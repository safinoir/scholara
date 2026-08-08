import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai/client", () => ({
  chatJson: vi.fn(),
  isAiConfigured: vi.fn(),
}));

import { chatJson, isAiConfigured } from "@/lib/ai/client";
import {
  buildWeekTuningMessages,
  interpretWeekNote,
  validateWeekTuningProposal,
  weekTuningRequestSchema,
} from "@/lib/ai/tuning";
import {
  MAX_TUNING_REQUEST_BYTES,
  POST,
} from "@/app/api/plan/tune/route";

function requestBody() {
  return {
    note: "  Chemistry exam Friday and work Tuesday 5-9.  ",
    weekStart: "2026-08-03",
    timeZone: "America/New_York",
    courses: [
      { id: "chem", name: "Chemistry" },
      { id: "history", name: "History" },
    ],
    current: {
      load: "normal",
      energy: "steady",
      targetStudyMinutes: 600,
      focusFrictions: ["procrastination"],
      unavailableDays: [],
      busyWindows: [],
      courseTargets: [],
    },
  };
}

function validInput() {
  const parsed = weekTuningRequestSchema.safeParse(requestBody());
  if (!parsed.success) throw new Error("Test fixture is invalid");
  return parsed.data;
}

function modelProposal() {
  return {
    load: "crunch",
    energy: null,
    targetStudyMinutes: 480,
    focusFrictions: ["procrastination", "procrastination"],
    unavailableDays: ["Sunday", "Sunday"],
    busyWindows: [
      { day: "Tuesday", startMinute: 1_021, endMinute: 1_261 },
      { day: "Tuesday", startMinute: 1_020, endMinute: 1_260 },
    ],
    courseTargets: [
      { courseId: "chem", priority: "urgent", deadlineDay: "Friday" },
      { courseId: "chem", priority: "urgent", deadlineDay: "Friday" },
    ],
    assumptions: ["Work ends at 9 PM.", "work ends at 9 PM."],
    unresolved: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isAiConfigured).mockReturnValue(false);
});

describe("week tuning request validation", () => {
  it("accepts and trims the bounded request", () => {
    const result = weekTuningRequestSchema.safeParse(requestBody());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.note).toBe("Chemistry exam Friday and work Tuesday 5-9.");
    }
  });

  it("rejects extra fields, invalid dates, duplicate courses, and unknown current targets", () => {
    const extra = { ...requestBody(), planBlocks: [] };
    expect(weekTuningRequestSchema.safeParse(extra).success).toBe(false);

    const invalidDate = { ...requestBody(), weekStart: "2026-02-30" };
    expect(weekTuningRequestSchema.safeParse(invalidDate).success).toBe(false);

    const duplicateBase = requestBody();
    const duplicate = {
      ...duplicateBase,
      courses: [
        ...duplicateBase.courses,
        { id: "chem", name: "Other chemistry" },
      ],
    };
    expect(weekTuningRequestSchema.safeParse(duplicate).success).toBe(false);

    const unknownBase = requestBody();
    const unknownTarget = {
      ...unknownBase,
      current: {
        ...unknownBase.current,
        courseTargets: [
          { courseId: "unknown", priority: "urgent", deadlineDay: "Friday" },
        ],
      },
    };
    expect(weekTuningRequestSchema.safeParse(unknownTarget).success).toBe(false);
  });
});

describe("model proposal validation", () => {
  it("snaps times and deduplicates bounded values", () => {
    const proposal = validateWeekTuningProposal(modelProposal(), validInput());

    expect(proposal).toEqual({
      load: "crunch",
      energy: null,
      targetStudyMinutes: 480,
      focusFrictions: ["procrastination"],
      unavailableDays: ["Sunday"],
      busyWindows: [
        { day: "Tuesday", startMinute: 1_020, endMinute: 1_260 },
      ],
      courseTargets: [
        { courseId: "chem", priority: "urgent", deadlineDay: "Friday" },
      ],
      assumptions: ["Work ends at 9 PM."],
      unresolved: [],
    });
  });

  it("rejects unknown fields, unknown courses, invalid ranges, and target increases", () => {
    expect(
      validateWeekTuningProposal(
        { ...modelProposal(), planBlocks: [] },
        validInput(),
      ),
    ).toBeNull();

    expect(
      validateWeekTuningProposal(
        {
          ...modelProposal(),
          courseTargets: [
            { courseId: "invented", priority: "urgent", deadlineDay: null },
          ],
        },
        validInput(),
      ),
    ).toBeNull();

    expect(
      validateWeekTuningProposal(
        {
          ...modelProposal(),
          busyWindows: [
            { day: "Tuesday", startMinute: 1_439, endMinute: 1_440 },
          ],
        },
        validInput(),
      ),
    ).toBeNull();

    expect(
      validateWeekTuningProposal(
        { ...modelProposal(), targetStudyMinutes: 615 },
        validInput(),
      ),
    ).toBeNull();
  });
});

describe("AI interpretation", () => {
  it("quotes the note as untrusted data", () => {
    const input = validInput();
    const messages = buildWeekTuningMessages(input);

    expect(messages[0].content).toContain("quoted untrusted data");
    expect(messages[1].content).toContain(
      `UNTRUSTED_STUDENT_NOTE=${JSON.stringify(input.note)}`,
    );
  });

  it("returns unavailable without configuration", async () => {
    await expect(interpretWeekNote(validInput())).resolves.toEqual({
      source: "unavailable",
      proposal: null,
    });
    expect(chatJson).not.toHaveBeenCalled();
  });

  it("uses low-temperature JSON generation and validates its result", async () => {
    vi.mocked(isAiConfigured).mockReturnValue(true);
    vi.mocked(chatJson).mockImplementation(
      (async (_options, validate) => validate(modelProposal())) as typeof chatJson,
    );

    const result = await interpretWeekNote(validInput());

    expect(result.source).toBe("ai");
    expect(chatJson).toHaveBeenCalledWith(
      expect.objectContaining({ temperature: 0.1 }),
      expect.any(Function),
    );
  });
});

describe("POST /api/plan/tune", () => {
  it("rejects malformed, oversized, and invalid requests", async () => {
    const malformed = await POST(
      new Request("http://localhost/api/plan/tune", {
        method: "POST",
        body: "{",
      }),
    );
    expect(malformed.status).toBe(400);

    const oversized = await POST(
      new Request("http://localhost/api/plan/tune", {
        method: "POST",
        headers: { "Content-Length": String(MAX_TUNING_REQUEST_BYTES + 1) },
        body: "{}",
      }),
    );
    expect(oversized.status).toBe(400);

    const invalid = await POST(
      new Request("http://localhost/api/plan/tune", {
        method: "POST",
        body: JSON.stringify({ ...requestBody(), note: "   " }),
      }),
    );
    expect(invalid.status).toBe(400);
  });

  it("leaves the plan unchanged when AI is unavailable", async () => {
    const response = await POST(
      new Request("http://localhost/api/plan/tune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody()),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      source: "unavailable",
      proposal: null,
    });
  });
});

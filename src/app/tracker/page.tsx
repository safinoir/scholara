import type { Metadata } from "next";
import { TrackerView } from "@/components/tracker/TrackerView";

export const metadata: Metadata = {
  title: "Weekly habit tracker — Scholara",
  description:
    "Turn your Scholara study Methods into small, repeatable habits and check in across the last seven days.",
};

export default function TrackerPage() {
  return <TrackerView />;
}

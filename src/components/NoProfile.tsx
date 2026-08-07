import { ButtonLink, Card } from "@/components/ui";

export function NoProfile({
  title = "You haven't taken the quiz yet",
  body = "It takes about two minutes and there's no signup. Everything on this page is built from your answers.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-20">
      <Card className="text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">{body}</p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/quiz" size="lg">
            Start the quiz
          </ButtonLink>
          <ButtonLink href="/express" variant="secondary" size="lg">
            I already know my habits
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}

export function LoadingShell() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24">
      <p className="text-center text-ink-faint">Loading your profile…</p>
    </div>
  );
}

import { ArrowRight } from "lucide-react";
import { ButtonLink, Card } from "@/components/ui";

export function OnboardingGate({
  title,
  body,
  href,
  action,
}: {
  title: string;
  body: string;
  href: "/persona" | "/toolkit" | "/plan/setup" | "/plan";
  action: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-20">
      <Card className="text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">{body}</p>
        <ButtonLink href={href} size="lg" className="mt-7">
          {action}
          <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/components/ui";
import { canAccessToolkit, hasConfirmedToolkit } from "@/lib/onboarding";

const NAV = [
  { href: "/persona", label: "Persona" },
  { href: "/toolkit", label: "Toolkit" },
  { href: "/plan", label: "Plan" },
  { href: "/tracker", label: "Tracker" },
  { href: "/resources", label: "Resources" },
  { href: "/career", label: "After" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const { profile, ready } = useProfile();

  // Nav only appears once there's something to navigate to.
  const showNav = ready && profile !== null;
  const visibleNav = profile
    ? NAV.filter((item) => {
        if (item.href === "/toolkit") return canAccessToolkit(profile);
        if (item.href === "/plan") return hasConfirmedToolkit(profile);
        return true;
      })
    : [];

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <GraduationCap className="size-5 text-brand-600" aria-hidden />
          Scholara
        </Link>

        {showNav && (
          <nav aria-label="Main" className="ml-auto">
            <ul className="flex items-center gap-1 overflow-x-auto text-sm">
              {visibleNav.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-lg px-3 whitespace-nowrap transition-colors",
                        active
                          ? "bg-brand-50 font-medium text-brand-700"
                          : "text-ink-soft hover:bg-line-soft hover:text-ink",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {!showNav && (
          <Link
            href="/quiz"
            className="ml-auto inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-ink-soft hover:bg-line-soft hover:text-ink"
          >
            Take the quiz
          </Link>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print mt-20 border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-ink-faint">
        <p className="max-w-2xl">
          Scholara stores your profile and schedule in your browser. Only an AI
          note you explicitly submit and bounded plan context are sent to the
          configured provider; Scholara does not store them on a server.
        </p>
        <p className="mt-3 max-w-2xl">
          Study techniques are drawn from cognitive-science research, and each one
          is labeled with how strong that evidence is. Scholara is a study tool,
          not medical or mental-health advice.
        </p>
        <p className="mt-5">
          Built for the Stellic Pathfinders challenge &middot;{" "}
          <Link href="/about" className="underline hover:text-ink">
            How it works
          </Link>
        </p>
      </div>
    </footer>
  );
}

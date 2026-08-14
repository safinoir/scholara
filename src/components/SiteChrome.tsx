"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/components/ui";
import {
  canAccessToolkit,
  hasCompletedSchedule,
  hasConfirmedToolkit,
} from "@/lib/onboarding";

const NAV = [
  { href: "/about", label: "About" },
  { href: "/persona", label: "Persona" },
  { href: "/toolkit", label: "Methods" },
  { href: "/plan", label: "Plan" },
  { href: "/tracker", label: "Tracker" },
  { href: "/resources", label: "Resources" },
  { href: "/career", label: "After" },
] as const;

const PUBLIC_NAV = [
  { href: "/about", label: "About" },
  { href: "/resources", label: "Resources" },
  { href: "/quiz", label: "Take the quiz" },
] as const;

type NavItem = {
  href: string;
  label: string;
};

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationLinks({
  items,
  pathname,
  mobile = false,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <ul
      className={cn(
        "text-sm",
        mobile ? "space-y-1" : "flex items-center gap-1",
      )}
    >
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <li key={`${item.label}:${item.href}`}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "inline-flex min-h-11 items-center rounded-lg px-3 whitespace-nowrap transition-colors",
                mobile && "w-full",
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
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { profile } = useProfile();
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const mobileOpen = mobileOpenPath === pathname;

  const visibleNav: NavItem[] = profile
    ? NAV.filter((item) => {
        if (item.href === "/toolkit") return canAccessToolkit(profile);
        if (item.href === "/plan") return hasConfirmedToolkit(profile);
        return true;
      }).map((item) =>
        item.href === "/plan"
          ? {
              ...item,
              href: hasCompletedSchedule(profile) ? "/plan" : "/plan/setup",
            }
          : item,
      )
    : [...PUBLIC_NAV];

  useEffect(() => {
    if (!mobileOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileOpenPath(null);
      menuButtonRef.current?.focus();
    };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        mobileNavRef.current?.contains(target) ||
        menuButtonRef.current?.contains(target)
      ) {
        return;
      }
      setMobileOpenPath(null);
    };

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [mobileOpen]);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
      <div className="relative mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <Image
            src="/icon.svg"
            alt=""
            width={20}
            height={20}
            className="size-5"
            aria-hidden
          />
          Scholara
        </Link>

        <nav aria-label="Main" className="ml-auto hidden md:block">
          <NavigationLinks items={visibleNav} pathname={pathname} />
        </nav>

        <button
          ref={menuButtonRef}
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="mobile-main-navigation"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          onClick={() =>
            setMobileOpenPath((openPath) =>
              openPath === pathname ? null : pathname,
            )
          }
          className="ml-auto inline-flex size-11 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-line-soft hover:text-ink md:hidden"
        >
          {mobileOpen ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>

        {mobileOpen && (
          <nav
            ref={mobileNavRef}
            id="mobile-main-navigation"
            aria-label="Main mobile"
            className="absolute top-full right-5 left-5 mt-2 rounded-xl border border-line bg-paper p-2 shadow-lg md:hidden"
          >
            <NavigationLinks
              items={visibleNav}
              pathname={pathname}
              mobile
              onNavigate={() => setMobileOpenPath(null)}
            />
          </nav>
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
        <p className="mt-5">Built for the Stellic Pathfinders challenge</p>
      </div>
    </footer>
  );
}

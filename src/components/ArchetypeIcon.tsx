import {
  Anchor,
  Compass,
  Network,
  Telescope,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Anchor,
  Compass,
  Network,
  Telescope,
  Users,
  Zap,
};

export function ArchetypeIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Compass;
  return <Icon className={className} aria-hidden />;
}

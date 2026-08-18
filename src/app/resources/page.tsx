import type { Metadata } from "next";
import { ResourcesView } from "@/components/resources/ResourcesView";

export const metadata: Metadata = {
  title: "Study resources — Scholara",
  description:
    "A curated library of free and free-tier study tools, practical guides, and campus services.",
};

export default function ResourcesPage() {
  return <ResourcesView />;
}

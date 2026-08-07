import type { Metadata } from "next";
import { ResourcesView } from "@/components/resources/ResourcesView";

export const metadata: Metadata = {
  title: "Free resources — Scholara",
  description:
    "A curated library of free study tools, plus the campus services your tuition already pays for.",
};

export default function ResourcesPage() {
  return <ResourcesView />;
}

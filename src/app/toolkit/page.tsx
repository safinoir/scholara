import type { Metadata } from "next";
import { ToolkitView } from "@/components/toolkit/ToolkitView";

export const metadata: Metadata = {
  title: "Your Study Toolkit — Scholara",
  description: "Evidence-based study methods ranked for the way you work.",
};

export default function ToolkitPage() {
  return <ToolkitView />;
}

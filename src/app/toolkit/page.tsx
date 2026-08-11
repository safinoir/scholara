import type { Metadata } from "next";
import { ToolkitView } from "@/components/toolkit/ToolkitView";

export const metadata: Metadata = {
  title: "Your study methods — Scholara",
  description:
    "Choose evidence-based study methods Scholara can build into your weekly plan.",
};

export default function ToolkitPage() {
  return <ToolkitView />;
}

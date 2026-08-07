import type { Metadata } from "next";
import { ResultsView } from "@/components/results/ResultsView";

export const metadata: Metadata = {
  title: "Your persona — Scholara",
};

export default function ResultsPage() {
  return <ResultsView />;
}

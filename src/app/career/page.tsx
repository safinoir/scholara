import type { Metadata } from "next";
import { CareerView } from "@/components/career/CareerView";

export const metadata: Metadata = {
  title: "Your degree path — Scholara",
  description:
    "Connect current coursework to degree decisions, skill evidence, and stage-aware next steps.",
};

export default function CareerPage() {
  return <CareerView />;
}

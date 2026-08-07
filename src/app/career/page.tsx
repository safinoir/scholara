import type { Metadata } from "next";
import { CareerView } from "@/components/career/CareerView";

export const metadata: Metadata = {
  title: "What comes after — Scholara",
  description:
    "A free, year-by-year career readiness checklist tied to your field of study.",
};

export default function CareerPage() {
  return <CareerView />;
}

import type { Metadata } from "next";
import { PlanView } from "@/components/plan/PlanView";

export const metadata: Metadata = {
  title: "Weekly setup — Scholara",
};

export default function PlanSetupPage() {
  return <PlanView setupOnly />;
}

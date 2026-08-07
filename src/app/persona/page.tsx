import type { Metadata } from "next";
import { PersonaView } from "@/components/persona/PersonaView";

export const metadata: Metadata = {
  title: "Your persona — Scholara",
  description: "See your Scholara persona and the six factors shaping your study profile.",
};

export default function PersonaPage() {
  return <PersonaView />;
}

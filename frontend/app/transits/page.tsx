import type { Metadata } from "next";
import EnginePage from "@/components/EnginePage";

export const metadata: Metadata = {
  title: "Transits | BhriguWelt",
};

export default function TransitsPage() {
  return <EnginePage slug="transits" />;
}

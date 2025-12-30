import type { Metadata } from "next";
import EnginePage from "@/components/EnginePage";

export const metadata: Metadata = {
  title: "Past Life | BhriguWelt",
};

export default function PastLifePage() {
  return <EnginePage slug="past-life" />;
}

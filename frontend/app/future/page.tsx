import type { Metadata } from "next";
import EnginePage from "@/components/EnginePage";

export const metadata: Metadata = {
  title: "Future | BhriguWelt",
};

export default function FuturePage() {
  return <EnginePage slug="future" />;
}

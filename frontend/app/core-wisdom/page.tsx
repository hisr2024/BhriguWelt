import type { Metadata } from "next";
import EnginePage from "@/components/EnginePage";

export const metadata: Metadata = {
  title: "Core Wisdom | BhriguWelt",
};

export default function CoreWisdomPage() {
  return <EnginePage slug="core-wisdom" />;
}

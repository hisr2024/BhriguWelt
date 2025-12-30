import type { Metadata } from "next";
import EnginePage from "@/components/EnginePage";

export const metadata: Metadata = {
  title: "Timeline | BhriguWelt",
};

export default function TimelinePage() {
  return <EnginePage slug="timeline" />;
}

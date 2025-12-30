import type { Metadata } from "next";
import EnginePage from "@/components/EnginePage";

export const metadata: Metadata = {
  title: "Calendar | BhriguWelt",
};

export default function CalendarPage() {
  return <EnginePage slug="calendar" />;
}

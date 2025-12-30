import EnginePage from "@/components/EnginePage";
import { engineBySlug } from "@/lib/engineConfig";

export default function CalendarPage() {
  return <EnginePage config={engineBySlug["calendar"]} />;
}

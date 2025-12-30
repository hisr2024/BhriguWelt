import EnginePage from "@/components/EnginePage";
import { CalendarForm } from "@/components/EngineForms";
import { ENGINE_MAP } from "@/components/engineData";

export default function CalendarPage() {
  return (
    <EnginePage engine={ENGINE_MAP["calendar"]}>
      <CalendarForm />
    </EnginePage>
  );
}

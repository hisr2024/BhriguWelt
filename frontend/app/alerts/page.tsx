import EnginePage from "@/components/EnginePage";
import { AlertsPanel } from "@/components/EngineForms";
import { ENGINE_MAP } from "@/components/engineData";

export default function AlertsPage() {
  return (
    <EnginePage engine={ENGINE_MAP["alerts"]}>
      <AlertsPanel />
    </EnginePage>
  );
}

import EnginePage from "@/components/EnginePage";
import { AlertsPanel } from "@/components/EngineForms";
import { ENGINE_MAP } from "@/components/engineData";

export default function AlertsPage() {
  const engine = ENGINE_MAP["alerts"];

  return (
    <EnginePage engine={engine}>
      <AlertsPanel />
    </EnginePage>
  );
}

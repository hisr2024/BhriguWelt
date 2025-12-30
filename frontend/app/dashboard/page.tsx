import EnginePage from "@/components/EnginePage";
import { DashboardPanel } from "@/components/EngineForms";
import { ENGINE_MAP } from "@/components/engineData";

export default function DashboardPage() {
  return (
    <EnginePage engine={ENGINE_MAP["dashboard"]}>
      <DashboardPanel />
    </EnginePage>
  );
}

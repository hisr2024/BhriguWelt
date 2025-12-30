import EnginePage from "@/components/EnginePage";
import { AnalyticsPanel } from "@/components/EngineForms";
import { ENGINE_MAP } from "@/components/engineData";

export default function AnalyticsPage() {
  return (
    <EnginePage engine={ENGINE_MAP["analytics"]}>
      <AnalyticsPanel />
    </EnginePage>
  );
}

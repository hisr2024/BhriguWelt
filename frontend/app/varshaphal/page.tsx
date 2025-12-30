import EnginePage from "@/components/EnginePage";
import { VarshaphalPanel } from "@/components/EngineForms";
import { ENGINE_MAP } from "@/components/engineData";

export default function VarshaphalPage() {
  return (
    <EnginePage engine={ENGINE_MAP["varshaphal"]}>
      <VarshaphalPanel />
    </EnginePage>
  );
}

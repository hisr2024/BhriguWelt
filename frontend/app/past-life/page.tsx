import EnginePage from "@/components/EnginePage";
import { PredictionForm } from "@/components/EngineForms";
import { ENGINE_MAP } from "@/components/engineData";

export default function PastLifePage() {
  return (
    <EnginePage engine={ENGINE_MAP["past-life"]}>
      <PredictionForm engine="past-life" />
    </EnginePage>
  );
}

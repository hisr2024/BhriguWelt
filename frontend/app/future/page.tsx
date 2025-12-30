import EnginePage from "@/components/EnginePage";
import { PredictionForm } from "@/components/EngineForms";
import { ENGINE_MAP } from "@/components/engineData";

export default function FuturePage() {
  return (
    <EnginePage engine={ENGINE_MAP["future"]}>
      <PredictionForm engine="future" />
    </EnginePage>
  );
}

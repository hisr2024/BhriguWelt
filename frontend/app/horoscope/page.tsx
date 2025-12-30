import EnginePage from "@/components/EnginePage";
import { PredictionForm } from "@/components/EngineForms";
import { ENGINE_MAP } from "@/components/engineData";

export default function HoroscopePage() {
  return (
    <EnginePage engine={ENGINE_MAP["horoscope"]}>
      <PredictionForm engine="horoscope" />
    </EnginePage>
  );
}

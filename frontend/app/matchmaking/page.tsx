import EnginePage from "@/components/EnginePage";
import { MatchmakingForm } from "@/components/EngineForms";
import { ENGINE_MAP } from "@/components/engineData";

export default function MatchmakingPage() {
  return (
    <EnginePage engine={ENGINE_MAP["matchmaking"]}>
      <MatchmakingForm />
    </EnginePage>
  );
}

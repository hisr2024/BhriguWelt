import EnginePage from "@/components/EnginePage";
import { engineBySlug } from "@/lib/engineConfig";

export default function MatchmakingPage() {
  return <EnginePage config={engineBySlug["matchmaking"]} />;
}

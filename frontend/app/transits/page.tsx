import EnginePage from "@/components/EnginePage";
import { engineBySlug } from "@/lib/engineConfig";

export default function TransitsPage() {
  return <EnginePage config={engineBySlug["transits"]} />;
}

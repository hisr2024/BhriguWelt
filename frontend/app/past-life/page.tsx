import EnginePage from "@/components/EnginePage";
import { engineBySlug } from "@/lib/engineConfig";

export default function PastLifePage() {
  return <EnginePage config={engineBySlug["past-life"]} />;
}

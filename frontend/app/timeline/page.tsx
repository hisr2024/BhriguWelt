import EnginePage from "@/components/EnginePage";
import { engineBySlug } from "@/lib/engineConfig";

export default function TimelinePage() {
  return <EnginePage config={engineBySlug["timeline"]} />;
}

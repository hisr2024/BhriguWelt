import EnginePage from "@/components/EnginePage";
import { engineBySlug } from "@/lib/engineConfig";

export default function AnalyticsPage() {
  return <EnginePage config={engineBySlug["analytics"]} />;
}

import EnginePage from "@/components/EnginePage";
import { engineBySlug } from "@/lib/engineConfig";

export default function VarshaphalPage() {
  return <EnginePage config={engineBySlug["varshaphal"]} />;
}

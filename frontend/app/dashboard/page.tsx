import EnginePage from "@/components/EnginePage";
import { engineBySlug } from "@/lib/engineConfig";

export default function DashboardPage() {
  return <EnginePage config={engineBySlug["dashboard"]} />;
}

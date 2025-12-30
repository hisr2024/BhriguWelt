import EnginePage from "@/components/EnginePage";
import { TransitsForm } from "@/components/EngineForms";
import { ENGINE_MAP } from "@/components/engineData";

export default function TransitsPage() {
  return (
    <EnginePage engine={ENGINE_MAP["transits"]}>
      <TransitsForm />
    </EnginePage>
  );
}

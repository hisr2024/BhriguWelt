import EnginePage from "@/components/EnginePage";
import { CoreWisdomForm } from "@/components/EngineForms";
import { ENGINE_MAP } from "@/components/engineData";

export default function CoreWisdomPage() {
  return (
    <EnginePage engine={ENGINE_MAP["core-wisdom"]}>
      <CoreWisdomForm />
    </EnginePage>
  );
}

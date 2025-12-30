import EnginePage from "@/components/EnginePage";
import { TimelinePanel } from "@/components/EngineForms";
import { ENGINE_MAP } from "@/components/engineData";

export default function TimelinePage() {
  return (
    <EnginePage engine={ENGINE_MAP["timeline"]}>
      <TimelinePanel />
    </EnginePage>
  );
}

import EnginePage from "@/components/EnginePage";
import { ChatPanel } from "@/components/EngineForms";
import { ENGINE_MAP } from "@/components/engineData";

export default function ChatPage() {
  return (
    <EnginePage engine={ENGINE_MAP["chat"]}>
      <ChatPanel />
    </EnginePage>
  );
}

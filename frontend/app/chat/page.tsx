import type { Metadata } from "next";
import EnginePage from "@/components/EnginePage";

export const metadata: Metadata = {
  title: "Chat | BhriguWelt",
};

export default function ChatPage() {
  return <EnginePage slug="chat" />;
}

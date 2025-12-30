"use client";

import EnginePage from "@/components/EnginePage";
import { engineBySlug } from "@/lib/engineConfig";

export default function ChatPage() {
  return <EnginePage config={engineBySlug["chat"]} />;
}

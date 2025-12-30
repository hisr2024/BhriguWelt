import type { Metadata } from "next";
import EnginePage from "@/components/EnginePage";

export const metadata: Metadata = {
  title: "Matchmaking | BhriguWelt",
};

export default function MatchmakingPage() {
  return <EnginePage slug="matchmaking" />;
}

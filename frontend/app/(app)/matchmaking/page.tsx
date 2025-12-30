import { redirect } from "next/navigation";

export default function LegacyMatchmakingRedirect() {
  redirect("/engines/matchmaking");
}

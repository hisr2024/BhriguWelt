import { redirect } from "next/navigation";

export default function LegacyTimelineRedirect() {
  redirect("/engines/timeline");
}

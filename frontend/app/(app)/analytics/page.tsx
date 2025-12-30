import { redirect } from "next/navigation";

export default function LegacyAnalyticsRedirect() {
  redirect("/engines/analytics");
}

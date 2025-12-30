import { redirect } from "next/navigation";

export default function LegacyTransitsRedirect() {
  redirect("/engines/transits");
}

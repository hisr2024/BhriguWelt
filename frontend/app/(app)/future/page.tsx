import { redirect } from "next/navigation";

export default function LegacyFutureRedirect() {
  redirect("/engines/future");
}

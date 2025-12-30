import { redirect } from "next/navigation";

export default function LegacyHoroscopeRedirect() {
  redirect("/engines/horoscope");
}

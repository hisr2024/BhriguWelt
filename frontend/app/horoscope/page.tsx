import type { Metadata } from "next";
import EnginePage from "@/components/EnginePage";

export const metadata: Metadata = {
  title: "Horoscope | BhriguWelt",
};

export default function HoroscopePage() {
  return <EnginePage slug="horoscope" />;
}

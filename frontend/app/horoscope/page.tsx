"use client";

import EnginePage from "@/components/EnginePage";
import { engineBySlug } from "@/lib/engineConfig";

export default function HoroscopePage() {
  return <EnginePage config={engineBySlug["horoscope"]} />;
}

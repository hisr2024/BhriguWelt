import type { Metadata } from "next";
import EnginePage from "@/components/EnginePage";

export const metadata: Metadata = {
  title: "Varshaphal | BhriguWelt",
};

export default function VarshaphalPage() {
  return <EnginePage slug="varshaphal" />;
}

import { ENGINES } from "@/components/engineData";
import EngineCard from "@/components/EngineCard";

export default function EngineGrid() {
  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {ENGINES.map((engine) => (
        <EngineCard key={engine.slug} engine={engine} />
      ))}
    </section>
  );
}

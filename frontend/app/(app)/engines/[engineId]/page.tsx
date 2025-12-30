import { notFound } from "next/navigation";
import EnginePage from "@/components/EnginePage";
import { engineBySlug, engineConfigs } from "@/lib/engineConfig";

type EnginePageProps = {
  params: { engineId: string };
};

export const dynamicParams = false;

export function generateStaticParams() {
  return engineConfigs.map((engine) => ({ engineId: engine.slug }));
}

export function generateMetadata({ params }: EnginePageProps) {
  const engine = engineBySlug[params.engineId];
  return engine
    ? {
        title: `${engine.title} · BhriguWelt`,
        description: engine.description,
      }
    : {
        title: "Engine not found · BhriguWelt",
        description: "Engine not available.",
      };
}

export default function EngineSlugPage({ params }: EnginePageProps) {
  const engine = engineBySlug[params.engineId];
  if (!engine) {
    notFound();
  }

  return <EnginePage engine={engine} />;
}

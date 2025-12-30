import { notFound } from "next/navigation";
import EnginePage from "@/components/EnginePage";
import { engineBySlug, engineConfigs } from "@/lib/engineConfig";

type EnginePageProps = {
  params: { slug: string };
};

export const dynamicParams = false;

export function generateStaticParams() {
  return engineConfigs.map((engine) => ({ slug: engine.slug }));
}

export function generateMetadata({ params }: EnginePageProps) {
  const engine = engineBySlug[params.slug];
  if (!engine) {
    return {
      title: "Engine not found · BhriguWelt",
      description: "Engine not available.",
    };
  }

  return {
    title: `${engine.title} · BhriguWelt`,
    description: engine.description,
  };
}

export default function EngineSlugPage({ params }: EnginePageProps) {
  const engine = engineBySlug[params.slug];
  if (!engine) {
    notFound();
  }

  return <EnginePage engine={engine} />;
}

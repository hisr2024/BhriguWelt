import LunarPhasesPanel from "@/components/LunarPhasesPanel";
import JourneyRail from "@/components/JourneyRail";

export default function MoonPhasesPage() {
  return (
    <section className="panel">
      <div className="panel__content">
        <JourneyRail />
        <LunarPhasesPanel />
      </div>
    </section>
  );
}

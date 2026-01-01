import DailyVrishaphal from "@/components/DailyVrishaphal";
import JourneyRail from "@/components/JourneyRail";

export default function DailyInsightsPage() {
  return (
    <section className="panel">
      <div className="panel__content">
        <JourneyRail />
        <DailyVrishaphal />
      </div>
    </section>
  );
}

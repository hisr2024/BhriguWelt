import LifeEventsTimeline, { LifeEventsReport } from "../LifeEventsTimeline";
import DetailedChartPanel from "./DetailedChartPanel";
import { ChartResponse, FormState, Interpretation } from "./types";
import "./detailed-chart.css";

// Helper to validate life_areas structure
function isLifeArea(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const area = obj as Record<string, unknown>;
  return (
    Array.isArray(area.strengths) &&
    Array.isArray(area.challenges) &&
    Array.isArray(area.turning_points) &&
    typeof area.guidance === 'string'
  );
}

// Type guard to check if an object matches the DetailedChart interface
function isDetailedChart(obj: unknown): obj is {
  correlation_id: string;
  chart_summary: string;
  key_personality_themes: string[];
  life_areas: {
    career: {
      strengths: string[];
      challenges: string[];
      turning_points: string[];
      guidance: string;
    };
    relationships: {
      strengths: string[];
      challenges: string[];
      turning_points: string[];
      guidance: string;
    };
    health: {
      strengths: string[];
      challenges: string[];
      turning_points: string[];
      guidance: string;
    };
    finances: {
      strengths: string[];
      challenges: string[];
      turning_points: string[];
      guidance: string;
    };
    spirituality: {
      strengths: string[];
      challenges: string[];
      turning_points: string[];
      guidance: string;
    };
  };
  yogas_or_bhrigu_indicators: Array<{
    principle_id: string;
    name: string;
    description: string;
    sutra_reference: string;
  }>;
  yearwise_major_events: Array<{
    year: number;
    themes: string[];
    likely_events: string[];
    cautions: string[];
    supports: string[];
  }>;
  confidence_notes: string;
  schema_valid?: boolean;
  retry_count?: number;
} {
  if (!obj || typeof obj !== 'object') return false;
  const chart = obj as Record<string, unknown>;
  
  // Check basic fields
  if (
    typeof chart.correlation_id !== 'string' ||
    typeof chart.chart_summary !== 'string' ||
    !Array.isArray(chart.key_personality_themes) ||
    typeof chart.confidence_notes !== 'string' ||
    !Array.isArray(chart.yogas_or_bhrigu_indicators) ||
    !Array.isArray(chart.yearwise_major_events)
  ) {
    return false;
  }
  
  // Check life_areas structure
  const lifeAreas = chart.life_areas;
  if (!lifeAreas || typeof lifeAreas !== 'object') return false;
  
  const areas = lifeAreas as Record<string, unknown>;
  if (
    !isLifeArea(areas.career) ||
    !isLifeArea(areas.relationships) ||
    !isLifeArea(areas.health) ||
    !isLifeArea(areas.finances) ||
    !isLifeArea(areas.spirituality)
  ) {
    return false;
  }
  
  return true;
}

type Props = {
  chart: ChartResponse | null;
  form: FormState;
  interpretation: Interpretation;
  hasNarrative: boolean;
  fallbackNarrative: string;
  onShare: () => void;
  onPlayVoice: () => void;
  onDownloadPdf: () => void;
};

export default function ReadingPanel({
  chart,
  form,
  interpretation,
  hasNarrative,
  fallbackNarrative,
  onShare,
  onPlayVoice,
  onDownloadPdf,
}: Props) {
  return (
    <div className="horo-panel horo-panel--reading" aria-live="polite">
      <div className="panel-head">
        <div>
          <p className="pill">Interpretation</p>
          <h2>Reading canvas</h2>
        </div>
        {chart ? (
          <div className="status-chip status-chip--ready">Ready to share</div>
        ) : (
          <div className="status-chip">Waiting for inputs</div>
        )}
      </div>

      {chart ? (
        <div className="reading-surface">
          <div className="interpretation-stack">
            <div className="interpretation-canvas">
              <div className="canvas-head">
                <div>
                  <h3 className="canvas-title">{form.name ? `${form.name}'s reading` : "Interpretation"}</h3>
                </div>
                {interpretation.summary ? <span className="pill">{interpretation.summary}</span> : null}
              </div>

              {hasNarrative ? (
                <>
                  {interpretation.english ? (
                    <section>
                      <p className="microcopy">English</p>
                      <pre aria-live="polite">{interpretation.english}</pre>
                    </section>
                  ) : null}
                  {interpretation.hindi ? (
                    <section>
                      <p className="microcopy">हिंदी मार्गदर्शन</p>
                      <pre aria-live="polite">{interpretation.hindi}</pre>
                    </section>
                  ) : null}
                </>
              ) : (
                <section>
                  <p className="microcopy">Raw data</p>
                  <pre aria-live="polite">{fallbackNarrative}</pre>
                </section>
              )}
            </div>

            {/* Detailed Chart Panel with comprehensive analysis */}
            {(() => {
              const detailedChart = typeof chart === 'object' && chart && 'detailed_chart' in chart
                ? chart.detailed_chart
                : null;
              return detailedChart && isDetailedChart(detailedChart) ? <DetailedChartPanel detailedChart={detailedChart} name={form.name} /> : null;
            })()}

            {/* Year-wise Life Events Timeline */}
            {(() => {
              const lifeEventsReport = typeof chart === 'object' && chart && 'life_events_report' in chart
                ? (chart.life_events_report as LifeEventsReport)
                : null;
              return lifeEventsReport ? <LifeEventsTimeline report={lifeEventsReport} /> : null;
            })()}

            <div className="results-actions" aria-label="Share or export results">
              <div>
                <h4>Share the results</h4>
                <p className="microcopy">Export, share, or listen to the reading in a modern voice.</p>
              </div>
              <div className="results-actions__buttons">
                <button type="button" className="ghost-button" onClick={onShare}>
                  Share results
                </button>
                <button type="button" className="ghost-button" onClick={onPlayVoice}>
                  Play modern voice
                </button>
                <button type="button" className="ghost-button" onClick={onDownloadPdf}>
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="reading-placeholder">
          <h3>Space reserved for the live reading</h3>
          <p className="muted">Add details to unlock the interpretation.</p>
          <ul>
            <li>Reading panel activates after submission.</li>
            <li>Then download as PDF or continue in chat.</li>
            <li>English and Hindi blocks load together.</li>
          </ul>
        </div>
      )}
    </div>
  );
}

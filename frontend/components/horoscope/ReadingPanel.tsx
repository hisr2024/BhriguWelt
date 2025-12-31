import { ChartResponse, FormState, Interpretation } from "./types";

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

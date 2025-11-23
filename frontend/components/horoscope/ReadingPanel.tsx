import { ChartResponse, FormState, Interpretation } from "./types";

type Props = {
  chart: ChartResponse | null;
  form: FormState;
  interpretation: Interpretation;
  hasNarrative: boolean;
  fallbackNarrative: string;
  onAskBhrigu: () => void;
  onDownloadPdf: () => void;
};

export default function ReadingPanel({
  chart,
  form,
  interpretation,
  hasNarrative,
  fallbackNarrative,
  onAskBhrigu,
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
          <div className="reading-toolbar">
            <div>
              <strong>{form.name || "Reader"}</strong>
            </div>
            <div className="toolbar-actions">
              <button type="button" className="ghost-button" onClick={onAskBhrigu}>
                Ask in chat
              </button>
              <button type="button" className="ghost-button" onClick={onDownloadPdf}>
                Save PDF
              </button>
            </div>
          </div>

          <div className="interpretation-grid">
            <div className="interpretation-canvas">
              <div className="canvas-head">
                <div>
                  <h3 className="canvas-title">Interpretation</h3>
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

            <aside className="interpretation-notes">
              <h4>Share or download</h4>
              <ul>
                <li>Save PDF</li>
                <li>Send to chat</li>
                <li>Bilingual ready</li>
              </ul>
            </aside>
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

'use client';

/**
 * ReadingView — renders a structured reading (backend reading_format 2).
 *
 * One reading, two audiences, zero duplication:
 *  - Simple view: overview, key insight, a timing strip, and per-theme cards
 *    with a plain explanation + 3 actions. No jargon, no technical walkthrough.
 *  - Astrologer view: the same cards plus the technical basis (placements,
 *    dasha, rule IDs), a verification badge, and the deterministic
 *    Bhrigu/Nadi rule findings the reading was built from.
 *
 * The full concatenated "complete reading" is intentionally NOT rendered:
 * it repeated every section a second time.
 */
import { useMemo, useState } from 'react';
import { ChevronDown, Clock, CheckCircle2, ShieldCheck, AlertTriangle, ScrollText } from 'lucide-react';
import { MarkdownRenderer } from '@/app/components/MarkdownRenderer';

export interface SectionDetail {
  simple?: string;
  timing?: string;
  technical?: string;
  guidance?: string[];
  basis?: string[];
}

export interface RuleFinding {
  id: string;
  source?: string;
  provenance?: 'classical' | 'tradition-attributed' | 'modern' | string;
  principle?: string;
  finding: string;
  timing?: string;
  weight?: number;
  categories?: string[];
}

export interface SectionStatus {
  status?: string;
  precision?: { verified?: boolean; specific_refs?: number; mismatched_claims?: string[] };
}

export interface StructuredReading {
  reading_format?: number;
  overview?: string;
  key_insight?: string;
  section_order?: string[];
  section_titles?: Record<string, string>;
  section_details?: Record<string, SectionDetail>;
  user_views?: Record<string, string>;
  astrologer_views?: Record<string, string>;
  section_generation_status?: Record<string, SectionStatus>;
  rule_findings?: RuleFinding[];
  [key: string]: unknown;
}

export const isStructuredReading = (p: unknown): boolean =>
  !!p && typeof p === 'object' && (p as StructuredReading).reading_format === 2;

type ViewMode = 'layman' | 'astrologer';

const humanize = (key: string) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function SectionCard({
  sectionKey,
  title,
  detail,
  fallbackText,
  viewMode,
  status,
  defaultOpen,
}: {
  sectionKey: string;
  title: string;
  detail?: SectionDetail;
  fallbackText?: string;
  viewMode: ViewMode;
  status?: SectionStatus;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const astro = viewMode === 'astrologer';
  const precision = status?.precision;
  const hasStructured = !!(detail && (detail.simple || detail.technical));

  return (
    <article
      className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden"
      data-section={sectionKey}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left min-h-[56px]
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
      >
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold text-white leading-snug">{title}</h3>
          {!open && detail?.simple && (
            <p className="mt-1 text-sm text-slate-400 line-clamp-1">{detail.simple}</p>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 mt-0.5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          {hasStructured ? (
            <>
              {detail?.simple && (
                <p className="text-[15.5px] leading-7 text-slate-100">{detail.simple}</p>
              )}

              {detail?.timing && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-400/[0.08] border border-amber-300/20 px-3 py-2.5">
                  <Clock className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" aria-hidden="true" />
                  <p className="text-sm text-amber-100">
                    <span className="font-semibold text-amber-200">When: </span>
                    {detail.timing}
                  </p>
                </div>
              )}

              {detail?.guidance && detail.guidance.length > 0 && (
                <ul className="space-y-2">
                  {detail.guidance.map((g, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[15px] text-slate-200">
                      <CheckCircle2 className="w-4 h-4 mt-1 text-emerald-400 shrink-0" aria-hidden="true" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              )}

              {astro && detail?.technical && (
                <div className="rounded-xl border border-violet-400/20 bg-violet-500/[0.07] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-300 mb-1.5">
                    Technical basis
                  </p>
                  <p className="text-sm leading-6 text-violet-50/90">{detail.technical}</p>
                  {detail.basis && detail.basis.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {detail.basis.map((b) => (
                        <span key={b} className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-violet-400/15 text-violet-200">
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            fallbackText && <MarkdownRenderer content={fallbackText} />
          )}

          {astro && precision && (
            <p className={`flex items-center gap-1.5 text-xs ${precision.verified ? 'text-emerald-300' : 'text-amber-300'}`}>
              {precision.verified ? (
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {precision.verified ? 'Verified against chart' : 'Partially verified'}
              {typeof precision.specific_refs === 'number' && ` · ${precision.specific_refs} chart references`}
              {precision.mismatched_claims && precision.mismatched_claims.length > 0 &&
                ` · ${precision.mismatched_claims.length} claim(s) flagged`}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export function ReadingView({ prediction, viewMode }: { prediction: StructuredReading; viewMode: ViewMode }) {
  const astro = viewMode === 'astrologer';

  const sections = useMemo(() => {
    const status = prediction.section_generation_status || {};
    const order =
      prediction.section_order && prediction.section_order.length
        ? prediction.section_order
        : Object.keys(prediction.section_details || {});
    return order
      .filter((key) => {
        const s = status[key]?.status || '';
        return !['unavailable', 'duplicate'].includes(s);
      })
      .map((key) => ({
        key,
        title: prediction.section_titles?.[key] || humanize(key),
        detail: prediction.section_details?.[key],
        fallbackText: astro
          ? prediction.astrologer_views?.[key] || (prediction[key] as string | undefined)
          : prediction.user_views?.[key] || (prediction[key] as string | undefined),
        status: status[key],
      }));
  }, [prediction, astro]);

  const timeline = useMemo(
    () => sections.filter((s) => s.detail?.timing).map((s) => ({ key: s.key, title: s.title, timing: s.detail!.timing! })),
    [sections]
  );

  const findings = prediction.rule_findings || [];
  const [showAllRules, setShowAllRules] = useState(false);
  const visibleFindings = showAllRules ? findings : findings.slice(0, 6);

  return (
    <div className="space-y-5">
      {(prediction.overview || prediction.key_insight) && (
        <section className="rounded-3xl p-6 bg-gradient-to-br from-cyan-500/[0.12] via-indigo-500/[0.08] to-fuchsia-500/[0.10] border border-white/10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300 mb-2">Your reading</p>
          {prediction.overview && (
            <p className="text-[17px] leading-7 text-white">{prediction.overview}</p>
          )}
          {prediction.key_insight && (
            <blockquote className="mt-4 border-l-2 border-amber-300 pl-4 text-[15px] leading-6 text-amber-50">
              {prediction.key_insight}
            </blockquote>
          )}
        </section>
      )}

      {timeline.length > 0 && (
        <section aria-label="Timing" className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-300 mb-3">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Key windows
          </p>
          <ol className="space-y-2.5">
            {timeline.slice(0, astro ? 12 : 5).map((t) => (
              <li key={t.key} className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
                <span className="text-sm font-medium text-white sm:w-44 shrink-0">{t.title}</span>
                <span className="text-sm text-slate-300">{t.timing}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="space-y-3">
        {sections.map((s, i) => (
          <SectionCard
            key={s.key}
            sectionKey={s.key}
            title={s.title}
            detail={s.detail}
            fallbackText={s.fallbackText}
            viewMode={viewMode}
            status={s.status}
            defaultOpen={i === 0}
          />
        ))}
      </div>

      {astro && findings.length > 0 && (
        <section className="rounded-2xl border border-violet-400/20 bg-violet-500/[0.05] p-5">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300 mb-3">
            <ScrollText className="w-3.5 h-3.5" aria-hidden="true" /> Rules applied to this chart
          </p>
          <ul className="divide-y divide-white/[0.06]">
            {visibleFindings.map((f) => (
              <li key={f.id + f.finding} className="py-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-violet-400/15 text-violet-200 shrink-0">{f.id}</span>
                  <span className="text-sm text-slate-100">{f.finding}</span>
                </div>
                {(f.timing || f.principle) && (
                  <p className="mt-1 pl-1 text-xs text-slate-400">
                    {f.provenance && (
                      <span
                        className={`mr-1.5 inline-block px-1.5 rounded text-[10px] uppercase tracking-wide ${
                          f.provenance === 'classical'
                            ? 'bg-emerald-400/10 text-emerald-300'
                            : f.provenance === 'tradition-attributed'
                              ? 'bg-amber-400/10 text-amber-300'
                              : 'bg-slate-400/10 text-slate-300'
                        }`}
                      >
                        {f.provenance === 'tradition-attributed' ? 'tradition' : f.provenance}
                      </span>
                    )}
                    {f.principle}
                    {f.principle && f.timing ? ' · ' : ''}
                    {f.timing && <span className="text-amber-200/90">{f.timing}</span>}
                  </p>
                )}
              </li>
            ))}
          </ul>
          {findings.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAllRules((v) => !v)}
              className="mt-2 text-sm font-medium text-violet-300 hover:text-violet-200 min-h-[44px]"
            >
              {showAllRules ? 'Show fewer' : `Show all ${findings.length} rules`}
            </button>
          )}
        </section>
      )}
    </div>
  );
}

export default ReadingView;

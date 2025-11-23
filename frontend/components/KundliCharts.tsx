'use client';

import { useEffect, useMemo, useState } from "react";

import { areMicroAnimationsAllowed } from "@/lib/immersive";
import { ChartHouse, DashaPeriod } from "@/types/astro";

interface InterpretationDetail {
  label: string;
  summary: string;
  highlight?: string;
  notes?: string[];
}

interface CompatibilityOverlay {
  primaryLabel: string;
  partnerLabel: string;
  harmonyIndex?: number;
  sharedThemes: { label: string; alignment?: number; tags?: string[] }[];
}

interface Props {
  rashiChart?: ChartHouse[];
  bhavaChart?: ChartHouse[];
  partnerChart?: ChartHouse[];
  dashas?: DashaPeriod[];
  compatibilityOverlay?: CompatibilityOverlay;
}

type DetailLevel = "concise" | "advanced";

export default function KundliCharts({ rashiChart = [], bhavaChart = [], dashas = [], compatibilityOverlay }: Props) {
  const [animateCharts, setAnimateCharts] = useState(false);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("concise");
  const [activeDetail, setActiveDetail] = useState<InterpretationDetail | null>(null);
  const [interpretationLayer, setInterpretationLayer] = useState<
    "foundation" | "interpretations" | "horoscope" | "past-future" | "matchmaking"
  >("foundation");

  useEffect(() => {
    const refresh = () => setAnimateCharts(areMicroAnimationsAllowed());
    refresh();

    if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;

    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-animations"] });

    return () => observer.disconnect();
  }, []);

  const readyLabel = useMemo(() => (rashiChart.length || bhavaChart.length ? "Chart ready" : "Awaiting birth details"), [
    bhavaChart.length,
    rashiChart.length,
  ]);

  const journeySteps = useMemo(
    () => [
      {
        key: "foundation",
        label: "Foundation",
        description: readyLabel,
        complete: Boolean(rashiChart.length && bhavaChart.length),
      },
      {
        key: "interpretations",
        label: "Layered interpretations",
        description: "Tap a house to reveal stacked meanings",
        complete: Boolean(activeDetail),
      },
      {
        key: "horoscope",
        label: "Horoscope linkage",
        description: dashas.length ? "Dashas linked to wheel" : "Waiting for dasha data",
        complete: Boolean(dashas.length),
      },
      {
        key: "past-future",
        label: "Past & future story",
        description: "Overlay karmic arcs on the wheel",
        complete: detailLevel === "advanced",
      },
      {
        key: "matchmaking",
        label: "Compatibility",
        description: compatibilityOverlay ? "Overlay ready" : "Add partner chart to unlock",
        complete: Boolean(compatibilityOverlay),
      },
    ], [activeDetail, bhavaChart.length, compatibilityOverlay, dashas.length, detailLevel, rashiChart.length, readyLabel]);

  const buildHouseDetail = (house: ChartHouse, occupant?: string): InterpretationDetail => {
    const occupantLabel = occupant || (house.occupants.length ? house.occupants.join(", ") : "Empty house");
    return {
      label: occupant ? `${occupant} in house ${house.index}` : `House ${house.index}`,
      summary: `${house.sign} focus with ${occupantLabel.toLowerCase()} influencing this span of life.`,
      highlight: occupant || house.sign,
      notes: detailLevel === "advanced" ? house.bhrigu_notes : undefined,
    };
  };

  const renderOccupants = (house: ChartHouse, textX: number) => {
    const occupants = house.occupants.length ? house.occupants : ["Empty house"];

    return occupants.map((occupant, occupantIndex) => {
      const detail = buildHouseDetail(house, occupant === "Empty house" ? undefined : occupant);
      const dy = occupantIndex === 0 ? "1.1em" : "1em";
      const isActive = activeDetail?.label === detail.label;

      const handleFocus = () => setActiveDetail(detail);
      const handleBlur = () => setActiveDetail(null);

      return (
        <tspan
          key={`${house.index}-${occupant}`}
          x={textX}
          dy={dy}
          className={`kundli-occupants ${isActive ? "kundli-occupants--active" : ""}`.trim()}
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            handleFocus();
            setInterpretationLayer("interpretations");
          }}
          onMouseEnter={handleFocus}
          onFocus={handleFocus}
          onMouseLeave={handleBlur}
          onBlur={handleBlur}
        >
          <title>{detail.summary}</title>
          {occupant}
        </tspan>
      );
    });
  };

  const renderInterpretationLayers = () => {
    const layers: { key: typeof interpretationLayer; title: string; body: string; cta?: string }[] = [
      {
        key: "foundation",
        title: "Foundation wheel",
        body: readyLabel,
        cta: "Start with house numbers and signs",
      },
      {
        key: "interpretations",
        title: "Layered interpretations",
        body: activeDetail?.summary || "Tap any house to unlock concise and advanced notes.",
        cta: activeDetail?.highlight,
      },
      {
        key: "horoscope",
        title: "Horoscope linkage",
        body: dashas.length
          ? "Daily, weekly, and yearly predictions stay tethered to this wheel."
          : "Add dashas to watch predictions animate around the wheel.",
        cta: dashas.length ? "View active dasha overlay" : undefined,
      },
      {
        key: "past-future",
        title: "Past & future story arcs",
        body:
          "Past-life reveals unlock after the core chart renders; future nodes glow along the same spokes for continuity.",
        cta: "Scroll timeline for deep dives",
      },
      {
        key: "matchmaking",
        title: "Compatibility overlays",
        body: compatibilityOverlay
          ? `${compatibilityOverlay.primaryLabel} × ${compatibilityOverlay.partnerLabel} overlay ready.`
          : "Add a partner chart to animate duo-chart overlays and energy merging.",
        cta: compatibilityOverlay ? "View harmony index" : undefined,
      },
    ];

    return (
      <div className="kundli-card kundli-card--layers" aria-live="polite">
        <header className="section-heading">
          <p className="eyebrow">Interpretation rail</p>
          <h4>Cosmic layers</h4>
          <p className="muted">Move from raw houses → stories → relationships in a single rail.</p>
        </header>
        <div className="kundli-layer-rail" role="tablist" aria-label="Interpretation layers">
          {layers.map((layer) => {
            const isActive = interpretationLayer === layer.key;
            return (
              <button
                key={layer.key}
                className={`layer-chip ${isActive ? "layer-chip--active" : ""}`}
                onClick={() => setInterpretationLayer(layer.key)}
                role="tab"
                aria-selected={isActive}
                type="button"
              >
                <span className="layer-chip__label">{layer.title}</span>
                <span className="layer-chip__cta">{layer.cta || "Open"}</span>
              </button>
            );
          })}
        </div>
        {layers
          .filter((layer) => layer.key === interpretationLayer)
          .map((layer) => (
            <div key={layer.key} className="layer-panel" role="tabpanel">
              <p className="eyebrow">{layer.title}</p>
              <p className="muted">{layer.body}</p>
              {activeDetail?.notes?.length && interpretationLayer === "interpretations" ? (
                <ul className="kudos-list">
                  {activeDetail.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
      </div>
    );
  };

  const renderChart = (label: string, houses: ChartHouse[], animate: boolean) => {
    const size = 320;
    const center = size / 2;
    const radius = 135;
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const overlays = houses[0]?.bhrigu_notes || [];

    return (
      <div className={`kundli-card ${animate ? "kundli-card--animated" : ""}`}>
        <header className="section-heading">
          <p className="eyebrow">{label}</p>
          <h4>{houses.length ? readyLabel : "Awaiting birth details"}</h4>
        </header>
        {houses.length > 0 ? (
          <>
            <svg
              className="kundli-svg"
              viewBox={`0 0 ${size} ${size}`}
              role="img"
              aria-label={`${label} twelve-house wheel`}
              preserveAspectRatio="xMidYMid meet"
            >
              <circle cx={center} cy={center} r={radius} className="kundli-ring" />
              {houses.map((house) => {
                const startAngle = (house.index - 1) * 30 - 90;
                const endAngle = startAngle + 30;
                const midAngle = startAngle + 15;
                const x1 = center + radius * Math.cos(toRadians(startAngle));
                const y1 = center + radius * Math.sin(toRadians(startAngle));
                const x2 = center + radius * Math.cos(toRadians(endAngle));
                const y2 = center + radius * Math.sin(toRadians(endAngle));
                const textX = center + (radius - 32) * Math.cos(toRadians(midAngle));
                const textY = center + (radius - 32) * Math.sin(toRadians(midAngle));
                return (
                  <g key={house.index}>
                    <line x1={center} y1={center} x2={x1} y2={y1} className="kundli-spoke" />
                    {house.index === 12 && <line x1={center} y1={center} x2={x2} y2={y2} className="kundli-spoke" />}
                    <text x={textX} y={textY} textAnchor="middle" className="kundli-label">
                      {house.index}
                      <tspan x={textX} dy="1.1em" className="kundli-sign">
                        {house.sign}
                      </tspan>
                      {renderOccupants(house, textX)}
                    </text>
                  </g>
                );
              })}
              <circle cx={center} cy={center} r={48} className="kundli-core" />
              <text x={center} y={center} textAnchor="middle" className="kundli-center">
                Bhrigu
              </text>
            </svg>
            <div className="kundli-visual">
              <svg width={size} height={size} role="img" aria-label={`${label} twelve-house wheel`}>
                <circle cx={center} cy={center} r={radius} className="kundli-ring" />
                {houses.map((house) => {
                  const startAngle = (house.index - 1) * 30 - 90;
                  const endAngle = startAngle + 30;
                  const midAngle = startAngle + 15;
                  const x1 = center + radius * Math.cos(toRadians(startAngle));
                  const y1 = center + radius * Math.sin(toRadians(startAngle));
                  const x2 = center + radius * Math.cos(toRadians(endAngle));
                  const y2 = center + radius * Math.sin(toRadians(endAngle));
                  const textX = center + (radius - 32) * Math.cos(toRadians(midAngle));
                  const textY = center + (radius - 32) * Math.sin(toRadians(midAngle));
                  return (
                    <g key={house.index}>
                      <line x1={center} y1={center} x2={x1} y2={y1} className="kundli-spoke" />
                      {house.index === 12 && <line x1={center} y1={center} x2={x2} y2={y2} className="kundli-spoke" />}
                      <text x={textX} y={textY} textAnchor="middle" className="kundli-label">
                        {house.index}
                        <tspan x={textX} dy="1.1em" className="kundli-sign">
                          {house.sign}
                        </tspan>
                        {renderOccupants(house, textX)}
                      </text>
                    </g>
                  );
                })}
                <circle cx={center} cy={center} r={48} className="kundli-core" />
                <text x={center} y={center} textAnchor="middle" className="kundli-center">
                  Bhrigu
                </text>
              </svg>
              {animate && (
                <div className="kundli-orbits" aria-hidden="true">
                  <span className="kundli-planet kundli-planet--inner" />
                  <span className="kundli-planet kundli-planet--outer" />
                </div>
              )}
            </div>
            {overlays.length > 0 && detailLevel === "advanced" && (
              <ul className="kudos-list" style={{ marginTop: "0.75rem" }}>
                {overlays.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="muted">Charts render after the API responds.</p>
        )}
      </div>
    );
  };

  const renderCompatibilityOverlay = (overlay: CompatibilityOverlay) => {
    const harmony = overlay.harmonyIndex ?? 0;
    return (
      <div className="kundli-card">
        <header className="section-heading">
          <p className="eyebrow">Compatibility</p>
          <h4>
            {overlay.primaryLabel} × {overlay.partnerLabel}
          </h4>
          <p className="muted">Shared themes and balance indicators between both charts.</p>
        </header>
        <div className="compatibility-meter" role="img" aria-label={`Harmony index ${harmony}%`}>
          <div className="compatibility-meter__bar" style={{ width: `${Math.min(100, harmony)}%` }} />
          <div className="compatibility-meter__label">{harmony}% harmonic alignment</div>
        </div>
        <ul className="kudos-list">
          {overlay.sharedThemes.map((theme) => (
            <li key={theme.label}>
              <strong>{theme.label}</strong>
              {theme.alignment !== undefined ? ` • ${theme.alignment}% alignment` : null}
              {theme.tags?.length ? <span className="pill">{theme.tags.join(", ")}</span> : null}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="kundli-grid">
      {renderInterpretationLayers()}
      <div className="kundli-card">
        <header className="section-heading">
          <p className="eyebrow">Detail mode</p>
          <h4>Interactive houses</h4>
          <p className="muted">Hover or focus on a house or occupant to pin more detail.</p>
        </header>
        <div className="button-row" role="group" aria-label="Toggle detail level">
          <button
            type="button"
            className={`button-link ${detailLevel === "concise" ? "button-link--active" : ""}`}
            onClick={() => setDetailLevel("concise")}
          >
            Concise
          </button>
          <button
            type="button"
            className={`button-link ${detailLevel === "advanced" ? "button-link--active" : ""}`}
            onClick={() => setDetailLevel("advanced")}
          >
            Advanced
          </button>
        </div>
        <div className="kudos-list" aria-live="polite">
          <div>
            <p className="eyebrow">Selection</p>
            <p className="muted">{activeDetail?.label || "No house selected yet."}</p>
          </div>
          <div>
            <p className="eyebrow">Summary</p>
            <p className="muted">{activeDetail?.summary || "Hover to explore each house."}</p>
          </div>
          {detailLevel === "advanced" && activeDetail?.notes?.length ? (
            <div>
              <p className="eyebrow">Bhrigu notes</p>
              <ul className="kudos-list">
                {activeDetail.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="kundli-journey" aria-label="Prediction progress">
          {journeySteps.map((step) => (
            <div key={step.key} className="journey-step">
              <div className={`journey-dot ${step.complete ? "journey-dot--complete" : ""}`} aria-hidden />
              <div>
                <p className="eyebrow">{step.label}</p>
                <p className="muted">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {renderChart("Rāśi chart", rashiChart, animateCharts)}
      {renderChart("Bhava chart", bhavaChart, animateCharts)}
      <div className="kundli-card">
        <header className="section-heading">
          <p className="eyebrow">Vimshottari</p>
          <h4>Dasha timeline</h4>
        </header>
        {dashas.length ? (
          <ol className="kundli-dasha">
            {dashas.map((segment) => (
              <li key={`${segment.lord}-${segment.start}`}>
                <div className="dasha-row">
                  <span className="badge">{segment.lord}</span>
                  <strong>
                    {segment.start} → {segment.end}
                  </strong>
                </div>
                <p className="muted">{segment.anchor_rule}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">Dasha cycles appear alongside the predictions.</p>
        )}
      </div>
      {compatibilityOverlay ? renderCompatibilityOverlay(compatibilityOverlay) : null}
    </div>
  );
}

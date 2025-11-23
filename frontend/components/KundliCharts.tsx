'use client';

import { useEffect, useState } from "react";
import { areMicroAnimationsAllowed } from "@/lib/immersive";
import { ChartHouse, DashaPeriod } from "@/types/astro";

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

function renderChart(label: string, houses: ChartHouse[], animate: boolean) {
  const size = 320;
  const center = size / 2;
  const radius = 135;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const overlays = houses[0]?.bhrigu_notes || [];

  const buildHouseDetail = (house: ChartHouse, occupant?: string): InterpretationDetail => {
    const occupantLabel = occupant || (house.occupants.length ? house.occupants.join(", ") : "Empty house");
    return {
      label: occupant ? `${occupant} in house ${house.index}` : `House ${house.index}`,
      summary: `${house.sign} focus with ${occupantLabel.toLowerCase()} influencing this span of life.`,
      highlight: occupant || house.sign,
      notes: detailLevel === "advanced" ? house.bhrigu_notes : undefined,
    };
  };

  const isActiveHouse = (house: ChartHouse) => activeDetail?.label.includes(`house ${house.index}`);

  return (
    <div className={`kundli-card ${animate ? "kundli-card--animated" : ""}`}>
      <header className="section-heading">
        <p className="eyebrow">{label}</p>
        <h4>{houses.length ? readyLabel : "Awaiting birth details"}</h4>
      </header>
      {houses.length > 0 ? (
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
            const occupantLabel = house.occupants.join(", ");
            return (
              <g key={house.index}>
                <line x1={center} y1={center} x2={x1} y2={y1} className="kundli-spoke" />
                {house.index === 12 && <line x1={center} y1={center} x2={x2} y2={y2} className="kundli-spoke" />}
                <text x={textX} y={textY} textAnchor="middle" className="kundli-label">
                  {house.index}
                  <tspan x={textX} dy="1.1em" className="kundli-sign">
                    {house.sign}
                  </tspan>
                  <tspan x={textX} dy="1.1em" className="kundli-occupants">
                    {occupantLabel || "Empty"}
                  </tspan>
                </text>
              </g>
            );
          })}
          <circle cx={center} cy={center} r={48} className="kundli-core" />
          <text x={center} y={center} textAnchor="middle" className="kundli-center">Bhrigu</text>
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
              const occupantLabel = house.occupants.join(", ");
              return (
                <g key={house.index}>
                  <line x1={center} y1={center} x2={x1} y2={y1} className="kundli-spoke" />
                  {house.index === 12 && <line x1={center} y1={center} x2={x2} y2={y2} className="kundli-spoke" />}
                  <text x={textX} y={textY} textAnchor="middle" className="kundli-label">
                    {house.index}
                    <tspan x={textX} dy="1.1em" className="kundli-sign">
                      {house.sign}
                    </tspan>
                    <tspan x={textX} dy="1.1em" className="kundli-occupants">
                      {occupantLabel || "Empty"}
                    </tspan>
                  </text>
                </g>
              );
            })}
            <circle cx={center} cy={center} r={48} className="kundli-core" />
            <text x={center} y={center} textAnchor="middle" className="kundli-center">Bhrigu</text>
          </svg>
          {animate && (
            <div className="kundli-orbits" aria-hidden="true">
              <span className="kundli-planet kundli-planet--inner" />
              <span className="kundli-planet kundli-planet--outer" />
            </div>
          )}
        </div>
      ) : (
        <p className="muted">Charts render after the API responds.</p>
      )}
      {overlays.length > 0 && detailLevel === "advanced" && (
        <ul className="kudos-list" style={{ marginTop: "0.75rem" }}>
          {overlays.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function KundliCharts({ rashiChart = [], bhavaChart = [], dashas = [] }: Props) {
  const [animateCharts, setAnimateCharts] = useState(false);

  useEffect(() => {
    const refresh = () => setAnimateCharts(areMicroAnimationsAllowed());
    refresh();

    if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;

    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-animations"] });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="kundli-grid">
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
      {compatibilityOverlay && renderCompatibilityOverlay(compatibilityOverlay)}
    </div>
  );
}

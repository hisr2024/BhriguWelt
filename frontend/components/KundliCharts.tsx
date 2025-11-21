'use client';

import { ChartHouse, DashaPeriod } from "@/types/astro";

interface Props {
  rashiChart?: ChartHouse[];
  bhavaChart?: ChartHouse[];
  dashas?: DashaPeriod[];
}

function renderChart(label: string, houses: ChartHouse[]) {
  const size = 320;
  const center = size / 2;
  const radius = 135;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const overlays = houses[0]?.bhrigu_notes || [];

  return (
    <div className="kundli-card">
      <header className="section-heading">
        <p className="eyebrow">{label}</p>
        <h4>{houses.length ? "Bhava alignment" : "Awaiting birth details"}</h4>
      </header>
      {houses.length > 0 ? (
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
      ) : (
        <p className="muted">Charts render after the API responds.</p>
      )}
      {overlays.length > 0 && (
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
  return (
    <div className="kundli-grid">
      {renderChart("Rāśi chart", rashiChart)}
      {renderChart("Bhava chart", bhavaChart)}
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
    </div>
  );
}

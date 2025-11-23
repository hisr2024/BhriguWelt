'use client';

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

function renderChart(label: string, houses: ChartHouse[], readyLabel = "Bhava alignment") {
  const size = 320;
  const center = size / 2;
  const radius = 135;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const overlays = houses[0]?.bhrigu_notes || [];

  return (
    <div className="kundli-card">
      <header className="section-heading">
        <p className="eyebrow">{label}</p>
        <h4>{houses.length ? readyLabel : "Awaiting birth details"}</h4>
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

function renderCompatibilityOverlay(overlay: CompatibilityOverlay) {
  const { primaryLabel, partnerLabel, harmonyIndex, sharedThemes } = overlay;
  return (
    <div className="kundli-card compatibility-card">
      <header className="section-heading">
        <p className="eyebrow">Compatibility overlay</p>
        <h4>{harmonyIndex ? `Harmony ${Math.round(harmonyIndex)} / 100` : "Energy Venn"}</h4>
      </header>
      <div className="energy-venn" role="img" aria-label="Compatibility energy Venn diagram">
        <div className="energy-orb orb-primary">
          <p className="eyebrow">{primaryLabel}</p>
          <strong>Source chart</strong>
          <span className="muted">Elemental drive</span>
        </div>
        <div className="energy-orb orb-partner">
          <p className="eyebrow">{partnerLabel}</p>
          <strong>Partner chart</strong>
          <span className="muted">Reciprocal flow</span>
        </div>
        <div className="energy-orb orb-shared">
          <p className="eyebrow">Shared energy</p>
          <div className="alignment-list">
            {sharedThemes.map((theme, index) => (
              <div key={`${theme.label}-${index}`} className="alignment-row">
                <div>
                  <strong>{theme.label}</strong>
                  {theme.tags && theme.tags.length > 0 && (
                    <div className="alignment-tags">
                      {theme.tags.map((tag) => (
                        <span className="tag-chip" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {typeof theme.alignment === "number" && (
                  <div className="alignment-bar" aria-label={`${theme.label} alignment ${Math.round(theme.alignment)}%`}>
                    <span style={{ width: `${Math.min(100, Math.max(theme.alignment, 0))}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="muted" style={{ marginTop: "0.5rem" }}>
        Modern filters and manuscript overlays blend here so both charts contribute before recommendations appear.
      </p>
    </div>
  );
}

export default function KundliCharts({
  rashiChart = [],
  bhavaChart = [],
  partnerChart = [],
  dashas = [],
  compatibilityOverlay,
}: Props) {
  const hasPartnerChart = partnerChart.length > 0;
  return (
    <div className="kundli-grid">
      {renderChart("Rāśi chart", rashiChart)}
      {hasPartnerChart ? renderChart("Partner rāśi chart", partnerChart, "Partner alignment") : renderChart("Bhava chart", bhavaChart)}
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

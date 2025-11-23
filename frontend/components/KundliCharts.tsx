'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { ChartHouse, DashaPeriod } from "@/types/astro";

interface Props {
  rashiChart?: ChartHouse[];
  bhavaChart?: ChartHouse[];
  dashas?: DashaPeriod[];
  detailLevel?: "beginner" | "advanced";
}

type InterpretationDetail = {
  label: string;
  summary: string;
  highlight?: string;
  notes?: string[];
};

type ZoomHandle = {
  destroy: () => void;
};

// Lightweight D3-style zoom fallback keeps the explorer interactive even when the full library is unavailable.
function attachZoom(svg: SVGSVGElement, content: SVGGElement, minScale = 0.7, maxScale = 3): ZoomHandle {
  const state = { scale: 1, x: 0, y: 0 };
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const update = () => {
    content.setAttribute("transform", `translate(${state.x}, ${state.y}) scale(${state.scale})`);
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -0.1 : 0.1;
    state.scale = clamp(state.scale + direction, minScale, maxScale);
    update();
  };

  const onPointerDown = (event: PointerEvent) => {
    isDragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    svg.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!isDragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    state.x += dx;
    state.y += dy;
    lastX = event.clientX;
    lastY = event.clientY;
    update();
  };

  const endDrag = (event: PointerEvent) => {
    isDragging = false;
    svg.releasePointerCapture(event.pointerId);
  };

  svg.addEventListener("wheel", onWheel, { passive: false });
  svg.addEventListener("pointerdown", onPointerDown);
  svg.addEventListener("pointermove", onPointerMove);
  svg.addEventListener("pointerup", endDrag);
  svg.addEventListener("pointerleave", endDrag);
  update();

  return {
    destroy: () => {
      svg.removeEventListener("wheel", onWheel);
      svg.removeEventListener("pointerdown", onPointerDown);
      svg.removeEventListener("pointermove", onPointerMove);
      svg.removeEventListener("pointerup", endDrag);
      svg.removeEventListener("pointerleave", endDrag);
    },
  };
}

function renderChart(
  label: string,
  houses: ChartHouse[],
  detailLevel: "beginner" | "advanced",
  onSelect: (detail: InterpretationDetail | null) => void,
  onPeek: (detail: InterpretationDetail | null) => void,
  activeDetail?: InterpretationDetail | null,
) {
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
            const houseDetail = buildHouseDetail(house);
            const handleClick = () => onSelect(houseDetail);
            const handleKey = (event: React.KeyboardEvent<SVGGElement>) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleClick();
              }
            };

            return (
              <g
                key={house.index}
                tabIndex={0}
                role="button"
                aria-label={`House ${house.index} ${house.sign} ${occupantLabel || "empty"}`}
                onClick={handleClick}
                onKeyDown={handleKey}
                onMouseEnter={() => onPeek(houseDetail)}
                onMouseLeave={() => onPeek(null)}
                className={isActiveHouse(house) ? "kundli-house active" : "kundli-house"}
              >
                <line x1={center} y1={center} x2={x1} y2={y1} className="kundli-spoke" />
                {house.index === 12 && <line x1={center} y1={center} x2={x2} y2={y2} className="kundli-spoke" />}
                <text x={textX} y={textY} textAnchor="middle" className="kundli-label">
                  {house.index}
                  <tspan x={textX} dy="1.1em" className="kundli-sign">
                    {house.sign}
                  </tspan>
                  {house.occupants.length ? (
                    house.occupants.map((occupant, occupantIndex) => (
                      <tspan
                        key={`${house.index}-${occupant}-${occupantIndex}`}
                        x={textX}
                        dy={occupantIndex === 0 ? "1.1em" : "1em"}
                        className="kundli-occupants"
                        onClick={(event) => {
                          event.stopPropagation();
                          const occupantDetail = buildHouseDetail(house, occupant);
                          onSelect(occupantDetail);
                        }}
                        onMouseEnter={(event) => {
                          event.stopPropagation();
                          const occupantDetail = buildHouseDetail(house, occupant);
                          onPeek(occupantDetail);
                        }}
                        onMouseLeave={(event) => {
                          event.stopPropagation();
                          onPeek(null);
                        }}
                      >
                        {occupant}
                      </tspan>
                    ))
                  ) : (
                    <tspan x={textX} dy="1.1em" className="kundli-occupants">
                      Empty
                    </tspan>
                  )}
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

export default function KundliCharts({
  rashiChart = [],
  bhavaChart = [],
  dashas = [],
  detailLevel = "beginner",
}: Props) {
  const [activeDetail, setActiveDetail] = useState<InterpretationDetail | null>(null);
  const [peekDetail, setPeekDetail] = useState<InterpretationDetail | null>(null);
  const [cosmicExplorerOpen, setCosmicExplorerOpen] = useState(false);
  const explorerRef = useRef<SVGSVGElement | null>(null);
  const explorerLayerRef = useRef<SVGGElement | null>(null);

  const energyNodes = useMemo(() => {
    const source = rashiChart.length ? rashiChart : bhavaChart;
    if (!source.length) return [] as { label: string; intensity: number; angle: number }[];
    return source.flatMap((house) =>
      house.occupants.map((occupant, index) => ({
        label: `${occupant} • House ${house.index}`,
        intensity: Math.min(1, 0.6 + house.bhrigu_notes.length * 0.1),
        angle: (house.index * 30 + index * 12) % 360,
      })),
    );
  }, [bhavaChart, rashiChart]);

  useEffect(() => {
    if (!cosmicExplorerOpen || !explorerRef.current || !explorerLayerRef.current) return;
    const zoomHandle = attachZoom(explorerRef.current, explorerLayerRef.current);
    return () => zoomHandle.destroy();
  }, [cosmicExplorerOpen, energyNodes.length]);

  return (
    <div className="kundli-grid">
      {renderChart("Rāśi chart", rashiChart, detailLevel, setActiveDetail, setPeekDetail, activeDetail)}
      {renderChart("Bhava chart", bhavaChart, detailLevel, setActiveDetail, setPeekDetail, activeDetail)}
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
      <div className="kundli-card">
        <header className="section-heading">
          <p className="eyebrow">Cosmic explorer</p>
          <div className="section-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4>Zoom into constellations</h4>
            <button
              className="secondary"
              type="button"
              onClick={() => setCosmicExplorerOpen((open) => !open)}
              aria-expanded={cosmicExplorerOpen}
            >
              {cosmicExplorerOpen ? "Collapse" : "Explore"}
            </button>
          </div>
          <p className="muted">Drag to pan, scroll to zoom, and tap planets to sense energy overlays.</p>
        </header>
        {cosmicExplorerOpen && (
          <div className="cosmic-explorer">
            <svg ref={explorerRef} width={360} height={280} role="img" aria-label="Constellation explorer">
              <g ref={explorerLayerRef}>
                <defs>
                  <radialGradient id="energy-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f8d8ff" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#7c4dff" stopOpacity="0.2" />
                  </radialGradient>
                </defs>
                <circle cx={180} cy={140} r={110} fill="url(#energy-glow)" opacity={0.35} />
                {energyNodes.map((node, index) => {
                  const radians = (node.angle * Math.PI) / 180;
                  const radius = 80 + (index % 5) * 18;
                  const cx = 180 + radius * Math.cos(radians);
                  const cy = 140 + radius * Math.sin(radians);
                  return (
                    <g key={node.label}>
                      <line
                        x1={180}
                        y1={140}
                        x2={cx}
                        y2={cy}
                        stroke="var(--accent, #7c4dff)"
                        strokeOpacity={0.25}
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={10 + node.intensity * 6}
                        fill="var(--accent-soft, #e2d9ff)"
                        stroke="var(--accent, #7c4dff)"
                        strokeWidth={1.2}
                        role="button"
                        tabIndex={0}
                        aria-label={`${node.label} energy`}
                        onClick={() =>
                          setActiveDetail({
                            label: node.label,
                            summary: `Planetary energy concentrated near ${node.label}.`,
                            highlight: "Energy pulse",
                            notes:
                              detailLevel === "advanced"
                                ? ["Zoom captures D3-style transforms for closer reading.", "Use panning to follow overlapping rays."]
                                : undefined,
                          })
                        }
                        onMouseEnter={() =>
                          setPeekDetail({
                            label: node.label,
                            summary: `Quick sense: ${node.label} radiates at intensity ${(node.intensity * 10).toFixed(1)}.`,
                          })
                        }
                        onMouseLeave={() => setPeekDetail(null)}
                      />
                      <text x={cx} y={cy - 16} textAnchor="middle" className="kundli-label">
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
            {!energyNodes.length && <p className="muted">Add birth data to animate constellations.</p>}
          </div>
        )}
      </div>
      {(peekDetail || activeDetail) && (
        <div className="kundli-card" role="status" aria-live="polite">
          <header className="section-heading">
            <p className="eyebrow">Layered insight</p>
            <h4>{activeDetail?.label || peekDetail?.label || "Tap a house to open details"}</h4>
          </header>
          <p>{activeDetail?.summary || peekDetail?.summary}</p>
          {activeDetail?.highlight && <p className="muted">Highlight: {activeDetail.highlight}</p>}
          {detailLevel === "advanced" && activeDetail?.notes && activeDetail.notes.length > 0 && (
            <div>
              <p className="eyebrow">Citations</p>
              <ul className="kudos-list">
                {activeDetail.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}
          {activeDetail && (
            <div style={{ marginTop: "0.5rem" }}>
              <button className="secondary" type="button" onClick={() => setActiveDetail(null)}>
                Clear insight
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

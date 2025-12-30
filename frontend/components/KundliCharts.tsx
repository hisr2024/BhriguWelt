'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "@/lib/framer-motion";

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
type LayerKey = "foundation" | "interpretations" | "horoscope" | "past-future" | "matchmaking";
type ZoomTransform = { toString: () => string };

type D3Selection = {
  selectAll: (selector: string) => D3Selection;
  remove: () => void;
  data: (data: PositionedHouse[]) => D3Selection;
  enter: () => D3Selection;
  append: (name: string) => D3Selection;
  attr: (
    name: string,
    value: number | string | ((d: PositionedHouse, i: number, arr: PositionedHouse[]) => number | string),
  ) => D3Selection;
  text: (value: string | ((d: PositionedHouse) => string)) => D3Selection;
  on: (event: string, handler: (event: unknown, d: PositionedHouse) => void) => D3Selection;
  call: (fn: unknown, ...args: unknown[]) => void;
  transition?: () => D3Selection;
};

type D3Zoom = {
  scaleExtent: (extent: [number, number]) => D3Zoom;
  on: (event: string, handler: (event: { transform: ZoomTransform }) => void) => D3Zoom;
  scaleBy: (selection: D3Selection, factor: number) => void;
  transform: (selection: D3Selection, transform: ZoomTransform | unknown) => void;
};

type D3Lite = {
  select: (element: SVGSVGElement) => D3Selection;
  zoom: () => D3Zoom;
  zoomIdentity?: ZoomTransform;
};

type PositionedHouse = ChartHouse & { x: number; y: number };

export default function KundliCharts({ rashiChart = [], bhavaChart = [], dashas = [], compatibilityOverlay }: Props) {
  const [animateCharts, setAnimateCharts] = useState(false);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("concise");
  const [activeDetail, setActiveDetail] = useState<InterpretationDetail | null>(null);
  const [interpretationLayer, setInterpretationLayer] = useState<LayerKey>("foundation");
  const [journeyAnchor, setJourneyAnchor] = useState<string | null>(null);
  const [d3Ready, setD3Ready] = useState(false);
  const [constellationHint, setConstellationHint] = useState("Pinch or scroll to zoom constellations");
  const constellationRef = useRef<SVGSVGElement | null>(null);
  const zoomHandleRef = useRef<{ zoom: D3Zoom; svg: D3Selection } | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const refresh = () => setAnimateCharts(areMicroAnimationsAllowed());
    refresh();

    if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;

    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-animations"] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as typeof window & { d3?: D3Lite }).d3) {
      setD3Ready(true);
      return;
    }

    const scriptId = "d3-cdn-script";
    if (document.getElementById(scriptId)) return;
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://d3js.org/d3.v7.min.js";
    script.async = true;
    script.onload = () => setD3Ready(true);
    script.onerror = () => setConstellationHint("D3 failed to load; retry or check connectivity.");
    document.body.appendChild(script);
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

  const horoscopeFlows = useMemo<{ label: string; progress: number; anchor: LayerKey; description: string }[]>(
    () => [
      { label: "Daily", progress: 70, anchor: "foundation", description: "Derived from current house rulers." },
      { label: "Weekly", progress: 55, anchor: "interpretations", description: "Combines ruler strength + dashas." },
      { label: "Monthly", progress: 40, anchor: "horoscope", description: "Links to transit overlays." },
      { label: "Yearly", progress: 25, anchor: "past-future", description: "Future arc nodes for the rail." },
    ],
    [],
  );

  const narrativeArcs = useMemo(
    () => [
      {
        title: "Past-life unlock",
        body: "Story cards stay locked until the core chart renders, then glide in with soft cosmic art.",
        status: rashiChart.length && bhavaChart.length ? "Unlocked" : "Locked",
      },
      {
        title: "Future timeline",
        body: "Glowing milestones line up against the same spokes for continuity between houses and predictions.",
        status: dashas.length ? "Anchored" : "Preparing",
      },
      {
        title: "Matchmaking overlay",
        body:
          compatibilityOverlay?.sharedThemes?.length
            ? "Duo-chart overlay ready with harmony and shared themes."
            : "Add partner data to activate energy merging animations.",
        status: compatibilityOverlay ? "Ready" : "Waiting",
      },
    ],
    [bhavaChart.length, compatibilityOverlay, dashas.length, rashiChart.length],
  );

  const constellationNodes = useMemo<PositionedHouse[]>(
    () =>
      (rashiChart.length ? rashiChart : bhavaChart).map((house, index) => {
        const angle = ((house.index - 3) * Math.PI) / 6; // start top
        const radius = 110 + (index % 2 === 0 ? 12 : -8);
        return {
          ...house,
          x: 180 + radius * Math.cos(angle),
          y: 140 + radius * Math.sin(angle),
        };
      }),
    [bhavaChart, rashiChart],
  );

  useEffect(() => {
    if (!d3Ready || !constellationRef.current) return;
    const d3 = (window as typeof window & { d3?: D3Lite }).d3;
    if (!d3) return;

    const svg = d3.select(constellationRef.current);
    svg.selectAll("*").remove();
    const layer = svg.append("g").attr("class", "constellation-layer");

    layer
      .selectAll("line")
      .data(constellationNodes)
      .enter()
      .append("line")
      .attr("x1", (d: PositionedHouse) => d.x)
      .attr("y1", (d: PositionedHouse) => d.y)
      .attr("x2", (d: PositionedHouse, i: number, arr: PositionedHouse[]) => arr[(i + 1) % arr.length].x)
      .attr("y2", (d: PositionedHouse, i: number, arr: PositionedHouse[]) => arr[(i + 1) % arr.length].y)
      .attr("class", "constellation-line");

    const nodes = layer
      .selectAll("circle")
      .data(constellationNodes)
      .enter()
      .append("circle")
      .attr("cx", (d: PositionedHouse) => d.x)
      .attr("cy", (d: PositionedHouse) => d.y)
      .attr("r", 8)
      .attr("class", "constellation-node")
      .on("click", (_event: unknown, d: ChartHouse) => {
        const detail = buildHouseDetail(d);
        setActiveDetail(detail);
        setInterpretationLayer("interpretations");
      });

    nodes.append("title").text((d: PositionedHouse) => `${d.sign} • House ${d.index} • ${d.occupants.join(", ") || "Empty"}`);

    layer
      .selectAll("text")
      .data(constellationNodes)
      .enter()
      .append("text")
      .attr("x", (d: PositionedHouse) => d.x + 12)
      .attr("y", (d: PositionedHouse) => d.y + 4)
      .text((d: PositionedHouse) => d.sign)
      .attr("class", "constellation-label");

    const zoom = d3
      .zoom()
      .scaleExtent([0.8, 3])
      .on("zoom", (event: { transform: ZoomTransform }) => {
        layer.attr("transform", event.transform.toString());
        setConstellationHint("Zoomed—drag to pan, tap a node to anchor interpretations");
      });

    svg.call(zoom);
    zoomHandleRef.current = { zoom, svg };
  }, [constellationNodes, d3Ready]);

  const buildHouseDetail = (house: ChartHouse, occupant?: string): InterpretationDetail => {
    const occupantLabel = occupant || (house.occupants.length ? house.occupants.join(", ") : "Empty house");
    return {
      label: occupant ? `${occupant} in house ${house.index}` : `House ${house.index}`,
      summary: `${house.sign} focus with ${occupantLabel.toLowerCase()} influencing this span of life.`,
      highlight: occupant || house.sign,
      notes: detailLevel === "advanced" ? house.bhrigu_notes : undefined,
    };
  };

  const biteSizedInterpretations = useMemo(() => {
    const source = rashiChart.length ? rashiChart : bhavaChart;
    return source.flatMap((house) => {
      const occupants = house.occupants.length ? house.occupants : ["House focus"];
      return occupants.slice(0, 3).map((occupant) => {
        const detail = buildHouseDetail(house, occupant === "House focus" ? undefined : occupant);
        return {
          label: detail.label,
          summary: detail.summary,
          focus: house.focus || house.sign,
        } as InterpretationDetail & { focus: string };
      });
    });
  }, [bhavaChart, rashiChart]);

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
        <div className="bite-grid" aria-label="Bite-sized interpretations">
          {biteSizedInterpretations.slice(0, 9).map((item) => (
            <button
              key={item.label}
              className="bite-chip"
              type="button"
              onClick={() => {
                setActiveDetail(item);
                setInterpretationLayer("interpretations");
              }}
            >
              <span className="pill">{item.label}</span>
              <p className="microcopy">{item.summary}</p>
              <p className="muted">{item.focus}</p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderConstellationLayer = () => (
    <div className="kundli-card">
      <header className="section-heading">
        <p className="eyebrow">Interactive constellations</p>
        <h4>Zoom & pan the sky</h4>
        <p className="muted">Click houses or planets on the canvas to reveal layered interpretations.</p>
      </header>
      <div className="constellation-actions">
        <div className="button-row" role="group" aria-label="Zoom controls">
          <button
            type="button"
            className="ghost-button small"
            onClick={() => zoomHandleRef.current?.svg?.transition?.().call?.(zoomHandleRef.current.zoom.scaleBy, 1.2)}
          >
            Zoom in
          </button>
          <button
            type="button"
            className="ghost-button small"
            onClick={() => zoomHandleRef.current?.svg?.transition?.().call?.(zoomHandleRef.current.zoom.scaleBy, 0.8)}
          >
            Zoom out
          </button>
          <button
            type="button"
            className="ghost-button small"
            onClick={() =>
              zoomHandleRef.current?.svg?.transition?.().call?.(
                zoomHandleRef.current.zoom.transform,
                (window as typeof window & { d3?: D3Lite }).d3?.zoomIdentity ?? { k: 1, x: 0, y: 0 },
              )
            }
          >
            Reset view
          </button>
        </div>
        <p className="microcopy" aria-live="polite">
          {d3Ready ? constellationHint : "Loading D3.js for zoomable constellations…"}
        </p>
      </div>
      <div className="constellation-map" role="img" aria-label="Zoomable constellation map">
        <svg ref={constellationRef} viewBox="0 0 360 280">
          <defs>
            <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f9d9b5" />
              <stop offset="100%" stopColor="#9ad3e8" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );

  const renderChart = (label: string, houses: ChartHouse[], animate: boolean) => {
    const size = 320;
    const center = size / 2;
    const radius = 135;
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const overlays = houses[0]?.bhrigu_notes || [];
    const shouldAnimate = animate && !reduceMotion;
    const houseVariants = {
      hidden: { opacity: 0, scale: 0.96 },
      visible: (index: number) => ({
        opacity: 1,
        scale: 1,
        transition: {
          delay: index * 0.04,
          duration: 0.45,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      }),
    };

    const renderHouseGroup = (house: ChartHouse, index: number) => {
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
        <motion.g
          key={house.index}
          className="house-hit"
          onClick={() => {
            setActiveDetail(buildHouseDetail(house));
            setInterpretationLayer("interpretations");
          }}
          variants={shouldAnimate ? houseVariants : undefined}
          initial={shouldAnimate ? "hidden" : undefined}
          animate={shouldAnimate ? "visible" : undefined}
          custom={index}
          style={{ transformOrigin: `${center}px ${center}px` }}
        >
          <line x1={center} y1={center} x2={x1} y2={y1} className="kundli-spoke" />
          {house.index === 12 && <line x1={center} y1={center} x2={x2} y2={y2} className="kundli-spoke" />}
          <text x={textX} y={textY} textAnchor="middle" className="kundli-label">
            {house.index}
            <tspan x={textX} dy="1.1em" className="kundli-sign">
              {house.sign}
            </tspan>
            {renderOccupants(house, textX)}
          </text>
        </motion.g>
      );
    };

    return (
      <motion.div
        className={`kundli-card ${animate ? "kundli-card--animated" : ""}`}
        initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <header className="section-heading">
          <p className="eyebrow">{label}</p>
          <h4>{houses.length ? readyLabel : "Awaiting birth details"}</h4>
        </header>
        {houses.length > 0 ? (
          <>
            <motion.svg
              className="kundli-svg"
              viewBox={`0 0 ${size} ${size}`}
              role="img"
              aria-label={`${label} twelve-house wheel`}
              preserveAspectRatio="xMidYMid meet"
              initial={shouldAnimate ? { opacity: 0 } : false}
              animate={shouldAnimate ? { opacity: 1 } : false}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.circle
                cx={center}
                cy={center}
                r={radius}
                className="kundli-ring"
                initial={shouldAnimate ? { opacity: 0 } : false}
                animate={shouldAnimate ? { opacity: 1 } : false}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
              {houses.map((house, index) => renderHouseGroup(house, index))}
              <motion.circle
                cx={center}
                cy={center}
                r={48}
                className="kundli-core"
                initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : false}
                animate={shouldAnimate ? { opacity: 1, scale: 1 } : false}
                transition={{
                  duration: 0.5,
                  delay: 0.2,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              />
              <motion.text
                x={center}
                y={center}
                textAnchor="middle"
                className="kundli-center"
                initial={shouldAnimate ? { opacity: 0 } : false}
                animate={shouldAnimate ? { opacity: 1 } : false}
                transition={{ duration: 0.45, delay: 0.3 }}
              >
                Bhrigu
              </motion.text>
            </motion.svg>
            <div className="kundli-visual">
              <motion.svg
                width={size}
                height={size}
                role="img"
                aria-label={`${label} twelve-house wheel`}
                initial={shouldAnimate ? { opacity: 0 } : false}
                animate={shouldAnimate ? { opacity: 1 } : false}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <motion.circle
                  cx={center}
                  cy={center}
                  r={radius}
                  className="kundli-ring"
                  initial={shouldAnimate ? { opacity: 0 } : false}
                  animate={shouldAnimate ? { opacity: 1 } : false}
                  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
                {houses.map((house, index) => renderHouseGroup(house, index))}
                <motion.circle
                  cx={center}
                  cy={center}
                  r={48}
                  className="kundli-core"
                  initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : false}
                  animate={shouldAnimate ? { opacity: 1, scale: 1 } : false}
                  transition={{
                    duration: 0.5,
                    delay: 0.2,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                />
                <motion.text
                  x={center}
                  y={center}
                  textAnchor="middle"
                  className="kundli-center"
                  initial={shouldAnimate ? { opacity: 0 } : false}
                  animate={shouldAnimate ? { opacity: 1 } : false}
                  transition={{ duration: 0.45, delay: 0.3 }}
                >
                  Bhrigu
                </motion.text>
              </motion.svg>
              {animate && (
                <div className="kundli-orbits" aria-hidden="true">
                  <span className="kundli-planet kundli-planet--inner" />
                  <span className="kundli-planet kundli-planet--outer" />
                </div>
              )}
            </div>
            <AnimatePresence>
              {overlays.length > 0 && detailLevel === "advanced" && (
                <motion.ul
                  className="kudos-list"
                  style={{ marginTop: "0.75rem" }}
                  initial={shouldAnimate ? { opacity: 0, y: 12 } : undefined}
                  animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                  exit={shouldAnimate ? { opacity: 0, y: 12 } : undefined}
                  transition={{ duration: 0.3 }}
                >
                  {overlays.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </>
        ) : (
          <p className="muted">Charts render after the API responds.</p>
        )}
      </motion.div>
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
      {renderConstellationLayer()}
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
          <p className="eyebrow">Horoscope linkage</p>
          <h4>Daily → yearly flows</h4>
          <p className="muted">Tap a flow to jump to the right chart layer; progress bars show how much is unlocked.</p>
        </header>
        <div className="horoscope-flow" role="list">
          {horoscopeFlows.map((flow) => (
            <button
              key={flow.label}
              className={`flow-chip ${journeyAnchor === flow.label ? "flow-chip--active" : ""}`}
              role="listitem"
              onClick={() => {
                setJourneyAnchor(flow.label);
                setInterpretationLayer(flow.anchor);
              }}
            >
              <div className="flow-chip__meta">
                <span className="pill">{flow.label}</span>
                <p className="muted">{flow.description}</p>
              </div>
              <div className="compatibility-meter" role="img" aria-label={`${flow.label} ${flow.progress}% anchored`}>
                <div className="compatibility-meter__bar" style={{ width: `${flow.progress}%` }} />
                <div className="compatibility-meter__label">{flow.progress}% linked to chart</div>
              </div>
            </button>
          ))}
        </div>
      </div>
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
          <p className="eyebrow">Story overlays</p>
          <h4>Past life → future → matchmaking</h4>
          <p className="muted">Narratives unlock sequentially and stay visually anchored to the kundli spokes.</p>
        </header>
        <ul className="kudos-list">
          {narrativeArcs.map((arc) => (
            <li key={arc.title}>
              <strong>{arc.title}</strong> • {arc.status}
              <p className="muted">{arc.body}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="kundli-card">
        <header className="section-heading">
          <p className="eyebrow">Immersive cues</p>
          <h4>Soundscapes, haptics, gestures</h4>
          <p className="muted">
            Micro-animations respect reduced-motion; toggle sound or haptics in the header to pair cosmic tones with wheel
            interactions.
          </p>
        </header>
        <ul className="kudos-list">
          <li>Subtle haptics fire on submit and when unlocking new layers.</li>
          <li>Sound cues (540hz tones) accompany taps when immersive mode is active.</li>
          <li>Horizontal drag, double tap, and keyboard focus all reveal the same layered interpretations.</li>
        </ul>
      </div>
      {compatibilityOverlay ? renderCompatibilityOverlay(compatibilityOverlay) : null}
    </div>
  );
}

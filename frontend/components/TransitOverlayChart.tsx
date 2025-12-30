'use client';

import { useMemo, useState } from "react";

import { ChartHouse } from "@/types/astro";
import { motion, useReducedMotion } from "@/lib/framer-motion";

export type TransitDirective = {
  planet?: string;
  influence?: string;
  certainty?: number;
  reference?: string;
};

type Props = {
  title?: string;
  houses: ChartHouse[];
  transits?: TransitDirective[];
};

const normalizeToken = (value?: string) => (value || "").toLowerCase().replace(/[^a-z]/g, "");

export default function TransitOverlayChart({ title = "Natal chart", houses, transits = [] }: Props) {
  const [zoom, setZoom] = useState(1);
  const [hovered, setHovered] = useState<{ title: string; detail: string } | null>(null);
  const reduceMotion = useReducedMotion();
  const size = 320;
  const center = size / 2;
  const radius = 135;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const shouldAnimate = !reduceMotion;

  const transitByHouse = useMemo(() => {
    const map = new Map<number, TransitDirective[]>();
    if (!houses.length || !transits.length) return map;
    const fallbackIndexes = houses.map((house) => house.index);

    transits.forEach((directive, index) => {
      const planetToken = normalizeToken(directive.planet);
      const matchedHouse = planetToken
        ? houses.find((house) =>
            house.occupants.some((occupant) => normalizeToken(occupant).includes(planetToken)),
          )
        : undefined;
      const houseIndex = matchedHouse?.index ?? fallbackIndexes[index % fallbackIndexes.length] ?? ((index % 12) + 1);
      const list = map.get(houseIndex) ?? [];
      list.push(directive);
      map.set(houseIndex, list);
    });

    return map;
  }, [houses, transits]);

  const chartVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, duration: 0.4 } },
  };

  const houseVariants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: (index: number) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: index * 0.03, duration: 0.35, ease: [0, 0, 0.58, 1] },
    }),
  };

  const tooltipCopy = hovered ?? {
    title: "Hover a house",
    detail: "See occupants and active transit notes here.",
  };

  const renderOccupants = (house: ChartHouse, textX: number) => {
    const occupants = house.occupants.length ? house.occupants : ["Empty house"];

    return occupants.map((occupant, occupantIndex) => (
      <tspan
        key={`${house.index}-${occupant}`}
        x={textX}
        dy={occupantIndex === 0 ? "1.1em" : "1em"}
        className="kundli-occupants"
      >
        {occupant}
      </tspan>
    ));
  };

  const renderTransits = (house: ChartHouse, textX: number) => {
    const directives = transitByHouse.get(house.index);
    if (!directives?.length) return null;

    return directives.slice(0, 2).map((directive, transitIndex) => (
      <tspan
        key={`${house.index}-${directive.planet || "transit"}-${transitIndex}`}
        x={textX}
        dy="1em"
        className="kundli-transit"
      >
        <title>
          {directive.influence || "Transit directive"}
          {directive.reference ? ` • ${directive.reference}` : ""}
        </title>
        {directive.planet ? `Transit: ${directive.planet}` : "Transit"}
      </tspan>
    ));
  };

  return (
    <div className="kundli-card">
      <header className="section-heading">
        <p className="eyebrow">Transit overlay</p>
        <h4>{houses.length ? title : "Awaiting birth details"}</h4>
        <p className="muted">Planets with active gochar guidance are highlighted inside the wheel.</p>
      </header>
      <div className="chart-controls" role="group" aria-label="Transit chart zoom">
        <span>Zoom</span>
        <input
          type="range"
          min="0.85"
          max="1.4"
          step="0.05"
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="flex-1 accent-amber-500"
          aria-label="Zoom transit chart"
        />
        <span className="chart-controls__value">{Math.round(zoom * 100)}%</span>
      </div>
      <div className="chart-tooltip" role="status" aria-live="polite">
        <strong>{tooltipCopy.title}</strong>
        <span>{tooltipCopy.detail}</span>
      </div>
      {houses.length ? (
        <motion.svg
          className="kundli-svg"
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`${title} twelve-house wheel with transit overlay`}
          preserveAspectRatio="xMidYMid meet"
          variants={shouldAnimate ? chartVariants : undefined}
          initial={shouldAnimate ? "hidden" : false}
          animate={shouldAnimate ? "visible" : false}
        >
          <motion.g
            animate={{ scale: zoom }}
            transition={shouldAnimate ? { type: "spring", stiffness: 120, damping: 18 } : { duration: 0 }}
            style={{ transformOrigin: "50% 50%" }}
          >
            <motion.circle cx={center} cy={center} r={radius} className="kundli-ring" />
            {houses.map((house, index) => {
              const startAngle = (house.index - 1) * 30 - 90;
              const endAngle = startAngle + 30;
              const midAngle = startAngle + 15;
              const x1 = center + radius * Math.cos(toRadians(startAngle));
              const y1 = center + radius * Math.sin(toRadians(startAngle));
              const x2 = center + radius * Math.cos(toRadians(endAngle));
              const y2 = center + radius * Math.sin(toRadians(endAngle));
              const textX = center + (radius - 32) * Math.cos(toRadians(midAngle));
              const textY = center + (radius - 32) * Math.sin(toRadians(midAngle));
              const transitsForHouse = transitByHouse.get(house.index) ?? [];
              const tooltipDetail = [
                house.occupants.length ? `Occupants: ${house.occupants.join(", ")}` : "No occupants listed.",
                transitsForHouse.length
                  ? `Transits: ${transitsForHouse.map((directive) => directive.planet || "Transit").join(", ")}`
                  : "No active transits.",
              ].join(" ");
              return (
                <motion.g
                  key={house.index}
                  className="house-hit"
                  variants={shouldAnimate ? houseVariants : undefined}
                  initial={shouldAnimate ? "hidden" : false}
                  animate={shouldAnimate ? "visible" : false}
                  custom={index}
                  onMouseEnter={() =>
                    setHovered({
                      title: `House ${house.index} • ${house.sign}`,
                      detail: tooltipDetail,
                    })
                  }
                  onMouseLeave={() => setHovered(null)}
                  whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
                  transition={{ duration: 0.2 }}
                >
                  <motion.line x1={center} y1={center} x2={x1} y2={y1} className="kundli-spoke" />
                  {house.index === 12 && (
                    <motion.line x1={center} y1={center} x2={x2} y2={y2} className="kundli-spoke" />
                  )}
                  <text x={textX} y={textY} textAnchor="middle" className="kundli-label">
                    {house.index}
                    <tspan x={textX} dy="1.1em" className="kundli-sign">
                      {house.sign}
                    </tspan>
                    {renderOccupants(house, textX)}
                    {renderTransits(house, textX)}
                  </text>
                </motion.g>
              );
            })}
            <motion.circle cx={center} cy={center} r={48} className="kundli-core" />
            <motion.text x={center} y={center} textAnchor="middle" className="kundli-center">
              Bhrigu
            </motion.text>
          </motion.g>
        </motion.svg>
      ) : (
        <p className="muted">Charts render once birth details are available.</p>
      )}
    </div>
  );
}

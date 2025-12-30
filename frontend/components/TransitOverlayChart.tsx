'use client';

import { useMemo } from "react";

import { ChartHouse } from "@/types/astro";

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
  const size = 320;
  const center = size / 2;
  const radius = 135;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

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
      {houses.length ? (
        <svg
          className="kundli-svg"
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`${title} twelve-house wheel with transit overlay`}
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
              <g key={house.index} className="house-hit">
                <line x1={center} y1={center} x2={x1} y2={y1} className="kundli-spoke" />
                {house.index === 12 && <line x1={center} y1={center} x2={x2} y2={y2} className="kundli-spoke" />}
                <text x={textX} y={textY} textAnchor="middle" className="kundli-label">
                  {house.index}
                  <tspan x={textX} dy="1.1em" className="kundli-sign">
                    {house.sign}
                  </tspan>
                  {renderOccupants(house, textX)}
                  {renderTransits(house, textX)}
                </text>
              </g>
            );
          })}
          <circle cx={center} cy={center} r={48} className="kundli-core" />
          <text x={center} y={center} textAnchor="middle" className="kundli-center">
            Bhrigu
          </text>
        </svg>
      ) : (
        <p className="muted">Charts render once birth details are available.</p>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Circle, Star, Moon, Sun, Sparkles, Info,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut
} from 'lucide-react';

interface Planet {
  name: string;
  position: number;
  sign: string;
  house: number;
  retrograde?: boolean;
}

interface BirthChartData {
  planets: Planet[];
  houses: number[];
  ascendant: string;
  zodiac_sign: string;
  moon_sign: string;
  nakshatra: string;
}

interface BirthChartVisualizationProps {
  chartData: BirthChartData;
  size?: number;
}

export default function BirthChartVisualization({
  chartData,
  size = 600
}: BirthChartVisualizationProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [hoveredHouse, setHoveredHouse] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const zodiacSigns = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];

  const resolveAscendant = (data: any): string => {
    if (!data?.ascendant) return 'N/A';
    if (typeof data.ascendant === 'string') return data.ascendant;
    return data.ascendant?.sign ?? data.ascendant?.name ?? 'N/A';
  };

  const resolveNakshatra = (data: any): string => {
    if (!data?.nakshatra) return '';
    if (typeof data.nakshatra === 'string') return data.nakshatra;
    return data.nakshatra?.name ?? '';
  };

  const getPositionFromPlanet = (planet: any): number | null => {
    if (!planet || typeof planet !== 'object') return null;
    if (typeof planet.position === 'number') return planet.position;
    if (typeof planet.longitude === 'number') return planet.longitude;
    if (typeof planet.degree === 'number') return planet.degree;
    if (typeof planet.degree_in_sign === 'number' && typeof planet.sign === 'string') {
      const signIndex = zodiacSigns.indexOf(planet.sign);
      if (signIndex >= 0) {
        return signIndex * 30 + planet.degree_in_sign;
      }
    }
    return null;
  };

  const getHouseFromSign = (sign?: string, houses?: string[]): number | null => {
    if (!sign || !houses?.length) return null;
    const index = houses.findIndex((houseSign) => houseSign === sign);
    return index >= 0 ? index + 1 : null;
  };

  // Defensive normalization for planets data - prevents crashes from various data shapes
  const normalizePlanets = (data: any): Planet[] => {
    const planetsRaw = data?.planets ?? data?.chart?.planets ?? data?.planets_data ?? [];
    const housesRaw = Array.isArray(data?.houses) ? data.houses : [];
    const houses = housesRaw.every((house) => typeof house === 'string') ? (housesRaw as string[]) : [];
    const planetsArray = Array.isArray(planetsRaw)
      ? planetsRaw
      : (planetsRaw && typeof planetsRaw === 'object' ? Object.entries(planetsRaw) : []);

    return planetsArray
      .map((entry: any) => {
        if (Array.isArray(entry) && entry.length === 2) {
          const [name, value] = entry;
          return { name, ...value };
        }
        return entry;
      })
      .map((planet: any) => {
        if (!planet || typeof planet !== 'object') {
          return null;
        }
        const name = planet.name ?? planet.planet ?? planet.key;
        if (!name) {
          return null;
        }
        const position = getPositionFromPlanet(planet);
        if (typeof position !== 'number' || Number.isNaN(position)) {
          return null;
        }
        const sign = typeof planet.sign === 'string' ? planet.sign : 'Unknown';
        const house = typeof planet.house === 'number'
          ? planet.house
          : (getHouseFromSign(sign, houses) ?? undefined);
        return {
          name,
          position,
          sign,
          house: house ?? 0,
          retrograde: planet.retrograde,
        } as Planet;
      })
      .filter((planet): planet is Planet => Boolean(planet));
  };

  const normalizedChartData = {
    ...chartData,
    ascendant: resolveAscendant(chartData),
    nakshatra: resolveNakshatra(chartData),
    planets: normalizePlanets(chartData)
  };

  const planetColors: Record<string, string> = {
    'Sun': '#FFD700',
    'Moon': '#E0E7FF',
    'Mercury': '#A78BFA',
    'Venus': '#EC4899',
    'Mars': '#EF4444',
    'Jupiter': '#F59E0B',
    'Saturn': '#6366F1',
    'Rahu': '#8B5CF6',
    'Ketu': '#10B981',
  };

  const planetIcons: Record<string, any> = {
    'Sun': Sun,
    'Moon': Moon,
    'Mercury': Sparkles,
    'Venus': Star,
    'Mars': Circle,
    'Jupiter': Circle,
    'Saturn': Circle,
    'Rahu': Circle,
    'Ketu': Circle,
  };

  // Calculate planet positions on the chart
  const getPlanetPosition = (planet: Planet) => {
    const angle = (planet.position * Math.PI) / 180 - Math.PI / 2;
    const radius = (size / 2) * 0.7;
    const x = size / 2 + radius * Math.cos(angle);
    const y = size / 2 + radius * Math.sin(angle);
    return { x, y, angle: planet.position };
  };

  // Get house wedge path
  const getHouseWedgePath = (houseNumber: number) => {
    const startAngle = ((houseNumber - 1) * 30 - 90) * (Math.PI / 180);
    const endAngle = (houseNumber * 30 - 90) * (Math.PI / 180);
    const outerRadius = (size / 2) * 0.9;
    const innerRadius = (size / 2) * 0.3;

    const x1 = size / 2 + innerRadius * Math.cos(startAngle);
    const y1 = size / 2 + innerRadius * Math.sin(startAngle);
    const x2 = size / 2 + outerRadius * Math.cos(startAngle);
    const y2 = size / 2 + outerRadius * Math.sin(startAngle);
    const x3 = size / 2 + outerRadius * Math.cos(endAngle);
    const y3 = size / 2 + outerRadius * Math.sin(endAngle);
    const x4 = size / 2 + innerRadius * Math.cos(endAngle);
    const y4 = size / 2 + innerRadius * Math.sin(endAngle);

    return `M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 0 0 ${x1} ${y1} Z`;
  };

  return (
    <div className="relative">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setZoom(Math.min(zoom + 0.2, 2))}
          className="w-10 h-10 rounded-full bg-genz-electric-blue/20 backdrop-blur-xl border border-genz-electric-blue/30 flex items-center justify-center text-white hover:bg-genz-electric-blue/30 transition-colors"
        >
          <ZoomIn className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}
          className="w-10 h-10 rounded-full bg-genz-electric-blue/20 backdrop-blur-xl border border-genz-electric-blue/30 flex items-center justify-center text-white hover:bg-genz-electric-blue/30 transition-colors"
        >
          <ZoomOut className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Rotation Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setRotation(rotation - 30)}
          className="w-10 h-10 rounded-full bg-genz-purple-haze/20 backdrop-blur-xl border border-genz-purple-haze/30 flex items-center justify-center text-white hover:bg-genz-purple-haze/30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setRotation(0)}
          className="px-4 h-10 rounded-full bg-genz-purple-haze/20 backdrop-blur-xl border border-genz-purple-haze/30 flex items-center justify-center text-white text-sm font-bold hover:bg-genz-purple-haze/30 transition-colors"
        >
          Reset
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setRotation(rotation + 30)}
          className="w-10 h-10 rounded-full bg-genz-purple-haze/20 backdrop-blur-xl border border-genz-purple-haze/30 flex items-center justify-center text-white hover:bg-genz-purple-haze/30 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Chart Container */}
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-pink-900/50 backdrop-blur-xl border border-white/10 p-8"
        style={{
          width: size + 64,
          height: size + 64,
        }}
        animate={{ scale: zoom }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <motion.svg
          width={size}
          height={size}
          className="mx-auto"
          style={{ transform: `rotate(${rotation}deg)` }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        >
          {/* Outer Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size / 2) * 0.9}
            fill="none"
            stroke="url(#gradient1)"
            strokeWidth="2"
            opacity="0.5"
          />

          {/* Inner Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size / 2) * 0.3}
            fill="none"
            stroke="url(#gradient2)"
            strokeWidth="2"
            opacity="0.5"
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D9FF" />
              <stop offset="100%" stopColor="#B983FF" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF006E" />
              <stop offset="100%" stopColor="#FFD60A" />
            </linearGradient>
            <radialGradient id="houseGradient">
              <stop offset="0%" stopColor="rgba(0, 217, 255, 0.1)" />
              <stop offset="100%" stopColor="rgba(185, 131, 255, 0.05)" />
            </radialGradient>
          </defs>

          {/* House Divisions */}
          {Array.from({ length: 12 }, (_, i) => i + 1).map((house) => (
            <g key={house}>
              {/* House Wedge */}
              <path
                d={getHouseWedgePath(house)}
                fill={hoveredHouse === house ? 'url(#houseGradient)' : 'transparent'}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1"
                onMouseEnter={() => setHoveredHouse(house)}
                onMouseLeave={() => setHoveredHouse(null)}
                className="cursor-pointer transition-all duration-300"
              />

              {/* House Number */}
              <text
                x={size / 2 + ((size / 2) * 0.6) * Math.cos(((house - 0.5) * 30 - 90) * (Math.PI / 180))}
                y={size / 2 + ((size / 2) * 0.6) * Math.sin(((house - 0.5) * 30 - 90) * (Math.PI / 180))}
                fill="white"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                opacity="0.6"
              >
                {house}
              </text>

              {/* Zodiac Sign */}
              <text
                x={size / 2 + ((size / 2) * 0.82) * Math.cos(((house - 0.5) * 30 - 90) * (Math.PI / 180))}
                y={size / 2 + ((size / 2) * 0.82) * Math.sin(((house - 0.5) * 30 - 90) * (Math.PI / 180))}
                fill="#00D9FF"
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
                dominantBaseline="middle"
                opacity="0.8"
              >
                {zodiacSigns[(house - 1) % 12].slice(0, 3)}
              </text>
            </g>
          ))}

          {/* Planets */}
          {normalizedChartData.planets && normalizedChartData.planets.map((planet, index) => {
            const pos = getPlanetPosition(planet);
            const PlanetIcon = planetIcons[planet.name] || Circle;

            return (
              <g key={planet.name}>
                {/* Planet Glow */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="20"
                  fill={planetColors[planet.name] || '#ffffff'}
                  opacity="0.2"
                  className="animate-pulse"
                />

                {/* Planet Circle */}
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r="12"
                  fill={planetColors[planet.name] || '#ffffff'}
                  stroke="white"
                  strokeWidth="2"
                  initial={{ scale: 0 }}
                  animate={{ scale: selectedPlanet?.name === planet.name ? 1.3 : 1 }}
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setSelectedPlanet(planet)}
                  className="cursor-pointer"
                  style={{
                    filter: `drop-shadow(0 0 8px ${planetColors[planet.name] || '#ffffff'})`
                  }}
                />

                {/* Retrograde Indicator */}
                {planet.retrograde && (
                  <text
                    x={pos.x}
                    y={pos.y - 20}
                    fill="#FF006E"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    R
                  </text>
                )}

                {/* Planet Label */}
                <text
                  x={pos.x}
                  y={pos.y + 26}
                  fill="white"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  opacity="0.9"
                >
                  {planet.name.slice(0, 3)}
                </text>
              </g>
            );
          })}

          {/* Center Info */}
          <text
            x={size / 2}
            y={size / 2 - 20}
            fill="white"
            fontSize="16"
            fontWeight="bold"
            textAnchor="middle"
          >
            {normalizedChartData.ascendant || 'N/A'}
          </text>
          <text
            x={size / 2}
            y={size / 2}
            fill="#00D9FF"
            fontSize="12"
            textAnchor="middle"
          >
            Ascendant
          </text>
          <text
            x={size / 2}
            y={size / 2 + 20}
            fill="white"
            fontSize="10"
            textAnchor="middle"
            opacity="0.7"
          >
            {normalizedChartData.nakshatra || ''}
          </text>
        </motion.svg>
      </motion.div>

      {/* Planet Info Panel */}
      <AnimatePresence>
        {selectedPlanet && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-genz-electric-blue/10 to-genz-purple-haze/10 backdrop-blur-xl border border-white/10"
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: planetColors[selectedPlanet.name] || '#ffffff',
                  boxShadow: `0 0 20px ${planetColors[selectedPlanet.name] || '#ffffff'}`
                }}
              >
                <span className="text-white font-bold">{selectedPlanet.name[0]}</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{selectedPlanet.name}</h3>
                <p className="text-genz-electric-blue">
                  {selectedPlanet.sign} • House {selectedPlanet.house ? selectedPlanet.house : '—'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/60 text-sm">Position</p>
                <p className="text-white font-bold">
                  {Number.isFinite(selectedPlanet.position)
                    ? `${selectedPlanet.position.toFixed(2)}°`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-sm">Status</p>
                <p className="text-white font-bold">
                  {selectedPlanet.retrograde ? 'Retrograde' : 'Direct'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedPlanet(null)}
              className="mt-4 w-full py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-3 md:grid-cols-5 gap-3">
        {Object.entries(planetColors).map(([planet, color]) => (
          <div key={planet} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-white/80 text-sm">{planet}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

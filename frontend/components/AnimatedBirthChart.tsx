"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Planet = {
  name: string;
  symbol: string;
  angle: number;
  color: string;
};

const planets: Planet[] = [
  { name: "Sun", symbol: "☉", angle: 0, color: "#FCD34D" },
  { name: "Moon", symbol: "☽", angle: 45, color: "#E0E7FF" },
  { name: "Mars", symbol: "♂", angle: 90, color: "#F87171" },
  { name: "Mercury", symbol: "☿", angle: 135, color: "#A78BFA" },
  { name: "Jupiter", symbol: "♃", angle: 180, color: "#FCD34D" },
  { name: "Venus", symbol: "♀", angle: 225, color: "#FCA5A5" },
  { name: "Saturn", symbol: "♄", angle: 270, color: "#94A3B8" },
  { name: "Rahu", symbol: "☊", angle: 315, color: "#6366F1" },
];

const houses = Array.from({ length: 12 }, (_, i) => ({
  number: i + 1,
  angle: (i * 30) - 90,
}));

export default function AnimatedBirthChart() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1,
      },
    },
  };

  const planetVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 260,
        damping: 20,
      },
    },
  };

  return (
    <motion.div
      className="birth-chart-container"
      variants={containerVariants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
    >
      <div className="chart-wrapper">
        {/* Outer circle */}
        <motion.div
          className="chart-circle outer-circle"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1,  }}
        >
          {/* Middle circle */}
          <motion.div
            className="chart-circle middle-circle"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8,  }}
          >
            {/* Inner circle */}
            <motion.div
              className="chart-circle inner-circle"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6,  }}
            >
              <motion.div
                className="chart-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="center-symbol">🔮</div>
                <div className="center-text">Birth Chart</div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* House divisions */}
          {houses.map((house) => (
            <motion.div
              key={house.number}
              className="house-line"
              style={{
                transform: `rotate(${house.angle}deg)`,
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 0.3 }}
              transition={{ delay: 0.6 + house.number * 0.02, duration: 0.3 }}
            />
          ))}

          {/* House numbers */}
          {houses.map((house) => {
            const radius = 180;
            const angleRad = ((house.angle + 15) * Math.PI) / 180;
            const x = Math.cos(angleRad) * radius;
            const y = Math.sin(angleRad) * radius;

            return (
              <motion.div
                key={`house-${house.number}`}
                className="house-number"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + house.number * 0.03, type: "spring" }}
              >
                {house.number}
              </motion.div>
            );
          })}

          {/* Planets */}
          {planets.map((planet, index) => {
            const radius = 140;
            const angleRad = (planet.angle * Math.PI) / 180;
            const x = Math.cos(angleRad) * radius;
            const y = Math.sin(angleRad) * radius;

            return (
              <motion.div
                key={planet.name}
                className="planet"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  color: planet.color,
                }}
                variants={planetVariants}
                whileHover={{ scale: 1.3, rotate: 360, transition: { duration: 0.5 } }}
                custom={index}
              >
                <motion.div
                  className="planet-symbol"
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 20 + index * 5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  {planet.symbol}
                </motion.div>
                <div className="planet-name">{planet.name}</div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <style jsx>{`
        .birth-chart-container {
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
          padding: 2rem;
          position: relative;
        }

        .chart-wrapper {
          position: relative;
          width: 100%;
          padding-bottom: 100%;
        }

        .chart-circle {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(139, 92, 246, 0.3);
          background: radial-gradient(
            circle at center,
            rgba(139, 92, 246, 0.05) 0%,
            rgba(14, 165, 233, 0.05) 50%,
            rgba(236, 72, 153, 0.05) 100%
          );
        }

        .outer-circle {
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          box-shadow: 0 0 40px rgba(139, 92, 246, 0.3);
        }

        .middle-circle {
          width: 85%;
          height: 85%;
          top: 7.5%;
          left: 7.5%;
          border-color: rgba(14, 165, 233, 0.3);
        }

        .inner-circle {
          width: 70%;
          height: 70%;
          top: 15%;
          left: 15%;
          border-color: rgba(236, 72, 153, 0.3);
        }

        .chart-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .center-symbol {
          font-size: 3rem;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        .center-text {
          font-size: 0.9rem;
          font-weight: 600;
          color: #8B5CF6;
          margin-top: 0.5rem;
        }

        .house-line {
          position: absolute;
          width: 2px;
          height: 50%;
          background: linear-gradient(
            to bottom,
            rgba(139, 92, 246, 0.3),
            rgba(139, 92, 246, 0)
          );
          top: 0;
          left: 50%;
          transform-origin: bottom center;
        }

        .house-number {
          position: absolute;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 50%;
          font-size: 0.75rem;
          font-weight: 600;
          color: #8B5CF6;
          transform: translate(-50%, -50%);
        }

        .planet {
          position: absolute;
          width: 60px;
          height: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transform: translate(-50%, -50%);
          cursor: pointer;
          z-index: 10;
        }

        .planet-symbol {
          font-size: 2rem;
          filter: drop-shadow(0 2px 8px currentColor);
        }

        .planet-name {
          font-size: 0.65rem;
          font-weight: 600;
          margin-top: 0.25rem;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .planet:hover .planet-name {
          opacity: 1;
        }

        @media (max-width: 640px) {
          .birth-chart-container {
            padding: 1rem;
          }

          .planet {
            width: 50px;
            height: 50px;
          }

          .planet-symbol {
            font-size: 1.5rem;
          }

          .center-symbol {
            font-size: 2rem;
          }

          .house-number {
            width: 24px;
            height: 24px;
            font-size: 0.65rem;
          }
        }
      `}</style>
    </motion.div>
  );
}

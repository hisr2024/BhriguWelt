"use client";

import { motion, useReducedMotion } from "../lib/framer-motion";

type FeatureCardProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

export default function FeatureCard({ title, description, eyebrow }: FeatureCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className="card"
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -6,
              boxShadow: "0 24px 48px rgba(15, 23, 42, 0.16)",
            }
      }
    >
      {eyebrow ? <span className="engine-badge">{eyebrow}</span> : null}
      <h3>{title}</h3>
      <p>{description}</p>
    </motion.article>
  );
}

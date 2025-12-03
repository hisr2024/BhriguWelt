import React from "react";

type Tab = {
  id: string;
  label: string;
  description: string;
};

type Props = {
  active?: string;
  onChange?: (id: string) => void;
};

const tabs: Tab[] = [
  {
    id: "inner-peace",
    label: "Inner Peace",
    description: "Breath-led calm with concentric rings that invite slow focus.",
  },
  {
    id: "mind-control",
    label: "Mind Control",
    description: "Intentional pulse toward clarity and disciplined thought.",
  },
  {
    id: "self-kindness",
    label: "Self Kindness",
    description: "Gentle blooms of compassion that soften every interaction.",
  },
];

export function TriangleEnergySystem({ active, onChange }: Props) {
  return (
    <div className="triangle-flow" aria-label="Triangle Flow Energy System">
      <div className="triangle-flow__canvas" aria-hidden>
        <span className="triangle-flow__energy" />
        <span className="triangle-flow__spark first" />
        <span className="triangle-flow__spark second" />
        <span className="triangle-flow__spark third" />
      </div>
      <div className="triangle-flow__vertices" role="tablist" aria-label="MindVibe anchors">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active ? active === tab.id : tab.id === "inner-peace"}
            className={`triangle-flow__vertex triangle-flow__vertex--${tab.id} ${active ? (active === tab.id ? "is-active" : "") : tab.id === "inner-peace" ? "is-active" : ""}`}
            onClick={() => onChange?.(tab.id)}
            onFocus={() => onChange?.(tab.id)}
          >
            <span className="triangle-flow__label">{tab.label}</span>
            <span className="triangle-flow__hint">{tab.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

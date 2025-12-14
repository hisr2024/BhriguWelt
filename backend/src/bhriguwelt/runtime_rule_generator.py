"""Runtime rule generator combining atomic rules, modifiers, and narratives."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Mapping, Sequence

from .calculations import CelestialSnapshot
from .chart_engine import ChartComputationResult, PersonalizationContext
from .core_wisdom_rules import core_wisdom_assets

_CONFIDENCE_WEIGHTS = {
    "traditional": 0.6,
    "modern": 0.5,
    "experimental": 0.35,
}


@dataclass
class RuleModifier:
    """Tiny control knobs that boost or soften atomic rule influence."""

    modifier_id: str
    description: str
    weight: float = 0.1
    applies_to: Sequence[str] = ()
    conflicts_with: Sequence[str] = ()
    polarity: str = "support"  # support|caution


@dataclass
class RuntimeRule:
    rule_id: str
    planet: str
    house: int
    confidence: float
    narrative: str
    applied_modifiers: List[str]

    def to_dict(self) -> Dict[str, object]:
        return {
            "rule_id": self.rule_id,
            "planet": self.planet,
            "house": self.house,
            "confidence": round(self.confidence, 2),
            "narrative": self.narrative,
            "applied_modifiers": list(self.applied_modifiers),
        }


class RuntimeRuleGenerator:
    """Glue layer: Chart → Engine → Narrative."""

    def __init__(self, modifiers: Iterable[RuleModifier] | None = None) -> None:
        self.atomic_rules = core_wisdom_assets()["atomic_rules"]
        self.modifiers = list(modifiers) if modifiers else self._default_modifiers()

    def generate(
        self,
        *,
        snapshot: CelestialSnapshot,
        chart: ChartComputationResult,
        dashas: List[Mapping[str, str]],
        personalization: PersonalizationContext,
    ) -> Dict[str, object]:
        """Compose confidence-weighted narratives from atomic rules."""

        relevant = self._select_relevant_rules(chart.house_assignments)
        resolved = self._apply_modifiers(relevant)
        narrative = self._compose_narrative(resolved, dashas, personalization, chart.ephemeris_source)
        return {
            "ephemeris_source": chart.ephemeris_source,
            "rules": [rule.to_dict() for rule in resolved],
            "narrative": narrative,
            "personalization": personalization.__dict__,
        }

    # --- internals ------------------------------------------------------
    def _select_relevant_rules(self, house_assignments: Mapping[str, int]) -> List[RuntimeRule]:
        active: List[RuntimeRule] = []
        for rule in self.atomic_rules:
            planet = rule.get("planet")
            house = int(rule.get("house", 0))
            if not planet or planet not in house_assignments:
                continue
            if house_assignments.get(planet) != house:
                continue
            base_confidence = _CONFIDENCE_WEIGHTS.get(str(rule.get("confidence", "traditional")), 0.5)
            narrative = rule.get("core_statement") or rule.get("description") or "Rule activated"
            active.append(
                RuntimeRule(
                    rule_id=str(rule.get("rule_id")),
                    planet=planet,
                    house=house,
                    confidence=base_confidence,
                    narrative=narrative,
                    applied_modifiers=[],
                )
            )
        return active

    def _apply_modifiers(self, rules: List[RuntimeRule]) -> List[RuntimeRule]:
        for mod in self.modifiers:
            for rule in rules:
                if mod.applies_to and rule.rule_id not in mod.applies_to:
                    continue
                if mod.conflicts_with and rule.rule_id in mod.conflicts_with:
                    rule.confidence = max(0.05, rule.confidence - abs(mod.weight))
                    rule.applied_modifiers.append(f"{mod.modifier_id}: conflict")
                    continue
                delta = mod.weight if mod.polarity == "support" else -abs(mod.weight)
                rule.confidence = max(0.05, min(rule.confidence + delta, 1.0))
                rule.applied_modifiers.append(mod.modifier_id)
        # Remove duplicate rule_ids keeping highest confidence
        compressed: Dict[str, RuntimeRule] = {}
        for rule in rules:
            existing = compressed.get(rule.rule_id)
            if not existing or rule.confidence > existing.confidence:
                compressed[rule.rule_id] = rule
        return sorted(compressed.values(), key=lambda item: item.confidence, reverse=True)

    @staticmethod
    def _compose_narrative(
        rules: List[RuntimeRule],
        dashas: List[Mapping[str, str]],
        personalization: PersonalizationContext,
        ephemeris_source: str,
    ) -> str:
        if not rules:
            return "No atomic rules activated for the current placements; verify birth details."

        lead = "; ".join(f"{rule.planet} in house {rule.house} ({rule.confidence:.2f})" for rule in rules[:3])
        dasha_note = dashas[0].get("lord") if dashas else "Unknown"
        mitigation = (
            "Mitigations noted: " + ", ".join(personalization.mitigation_flags)
            if personalization.mitigation_flags
            else "No mitigations provided; leaning on reflective prompts."
        )
        effort = personalization.effort_level or "balanced"
        return (
            f"Using {ephemeris_source}, active rules: {lead}. "
            f"Current dasha emphasis: {dasha_note}. {mitigation} "
            f"User effort set to {effort}; reflective prompts: {', '.join(personalization.reflection_prompts) or 'none'}."
        )

    @staticmethod
    def _default_modifiers() -> List[RuleModifier]:
        return [
            RuleModifier(
                modifier_id="CONFIDENCE_RAFT",
                description="Boost when multiple supportive indicators align",
                weight=0.15,
                applies_to=(),
                polarity="support",
            ),
            RuleModifier(
                modifier_id="ETHICAL_GUARDRAIL",
                description="Soften deterministic language",
                weight=0.1,
                applies_to=(),
                polarity="caution",
            ),
        ]


__all__ = ["RuntimeRuleGenerator", "RuleModifier", "RuntimeRule"]

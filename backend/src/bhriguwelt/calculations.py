"""Numerical helpers that translate Bhrigu Samhita sutras into scores."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time
from typing import Dict, List, Tuple


@dataclass
class CelestialSnapshot:
    """Minimal astronomical context used by the heuristic rules."""

    birth_date: date
    birth_time: time
    birth_place: str
    lunar_tithi: int
    moon_element: str
    mars_house: int
    saturn_house: int
    venus_house: int
    rahu_aspects_ascendant: bool

    @classmethod
    def from_strings(
        cls,
        birth_date: str,
        birth_time: str,
        birth_place: str,
        lunar_tithi: int,
        moon_element: str,
        mars_house: int,
        saturn_house: int,
        venus_house: int,
        rahu_aspects_ascendant: bool,
    ) -> "CelestialSnapshot":
        parsed_date = datetime.fromisoformat(birth_date).date()
        parsed_time = time.fromisoformat(birth_time)
        return cls(
            birth_date=parsed_date,
            birth_time=parsed_time,
            birth_place=birth_place,
            lunar_tithi=lunar_tithi,
            moon_element=moon_element,
            mars_house=mars_house,
            saturn_house=saturn_house,
            venus_house=venus_house,
            rahu_aspects_ascendant=rahu_aspects_ascendant,
        )


@dataclass
class PastLifeInsight:
    """Narratives pointing to prior-life vocations per Bhrigu."""

    engine_id: str
    sutra_reference: str
    narrative: str
    confidence: float


@dataclass
class FutureTrajectory:
    """Forward-looking mandates anchored in Bhrigu folios."""

    engine_id: str
    sutra_reference: str
    focus: str
    window: str
    certainty: float


@dataclass
class MatchCriterionResult:
    """Scored compatibility entry for a single Bhrigu criterion."""

    criterion_id: str
    sutra_reference: str
    description: str
    score: float
    notes: str


@dataclass
class MatchmakingCompatibility:
    """Aggregate compatibility score plus detailed folio references."""

    compatibility_index: float
    breakdown: List[MatchCriterionResult]
    modern_highlights: List[str]


def score_principles(snapshot: CelestialSnapshot, principles: List[Dict]) -> Dict[str, float]:
    """Compute normalized weights for each principle based on the snapshot."""

    scores: Dict[str, float] = {}
    for principle in principles:
        pid = principle["id"]
        weights = principle.get("weights", {})
        modifier = 1.0

        if pid == "BR-1" and snapshot.moon_element.lower() == "water":
            modifier += 0.2
        if pid == "BR-7" and snapshot.lunar_tithi == 5 and snapshot.mars_house == 10:
            modifier += 0.25
        if pid == "BR-18" and snapshot.saturn_house == 2 and snapshot.venus_house == 2 and snapshot.rahu_aspects_ascendant:
            modifier += 0.3

        for key, value in weights.items():
            scores[key] = round(value * modifier, 2)

    return scores


def derive_karmic_epoch(snapshot: CelestialSnapshot) -> str:
    """Return a concise narrative for the dominant karmic epoch."""

    age = (datetime.utcnow().date() - snapshot.birth_date).days / 365.25
    if age < 28:
        return "Bhrigu epoch: unfolding lunar memories of the previous incarnation."
    if age < 45:
        return "Bhrigu epoch: activation of Mars mandates for infrastructural service."
    return "Bhrigu epoch: treasury karma resurfacing with Venusian polish."


def evaluate_past_life(snapshot: CelestialSnapshot, engines: List[Dict]) -> List[PastLifeInsight]:
    """Select the most resonant past-life narratives from Bhrigu engines."""

    insights: List[PastLifeInsight] = []
    for engine in engines:
        confidence = _score_conditions(snapshot, engine.get("conditions", {}), engine.get("confidence", 0.6))
        if confidence <= 0:
            continue
        insights.append(
            PastLifeInsight(
                engine_id=engine["id"],
                sutra_reference=engine["sutra_reference"],
                narrative=engine["narrative"].strip(),
                confidence=confidence,
            )
        )

    return sorted(insights, key=lambda insight: insight.confidence, reverse=True)


def evaluate_future_directives(snapshot: CelestialSnapshot, engines: List[Dict]) -> List[FutureTrajectory]:
    """Map future trajectories for the native from the Samhita folios."""

    directives: List[FutureTrajectory] = []
    for engine in engines:
        certainty = _score_conditions(snapshot, engine.get("conditions", {}), engine.get("certainty", 0.65))
        if certainty <= 0:
            continue
        directives.append(
            FutureTrajectory(
                engine_id=engine["id"],
                sutra_reference=engine["sutra_reference"],
                focus=engine["trajectory"].strip(),
                window=engine.get("window", ""),
                certainty=certainty,
            )
        )

    return sorted(directives, key=lambda directive: directive.certainty, reverse=True)


def evaluate_matchmaking(
    primary: CelestialSnapshot,
    partner: CelestialSnapshot,
    criteria: List[Dict],
    modern_preferences: List[str],
) -> MatchmakingCompatibility:
    """Synthesize compatibility across classical and modern Bhrigu markers."""

    breakdown: List[MatchCriterionResult] = []
    total_score = 0.0
    total_weight = 0.0
    modern_highlights: List[str] = []

    for criterion in criteria:
        base_weight = float(criterion.get("base_weight", 1.0))
        pair_rules = criterion.get("pair_rules", [])
        earned = 0.0
        possible = 0.0
        notes: List[str] = []

        for rule in pair_rules:
            partial_score, partial_weight = _evaluate_pair_rule(primary, partner, rule)
            earned += partial_score
            possible += partial_weight
            if partial_score:
                notes.append(rule.get("label", ""))

        ratio = (earned / possible) if possible else 1.0
        criterion_score = round(base_weight * ratio, 2)
        total_score += criterion_score
        total_weight += base_weight

        modifier_notes: List[str] = []
        for preference in modern_preferences:
            bonus = float(criterion.get("modern_modifiers", {}).get(preference, 0.0))
            if bonus:
                total_score += bonus
                total_weight += bonus
                note = (
                    f"{criterion['id']} aligns with {preference} per {criterion['sutra_reference']} (+{bonus:.2f})"
                )
                modern_highlights.append(note)
                modifier_notes.append(note)

        breakdown.append(
            MatchCriterionResult(
                criterion_id=criterion["id"],
                sutra_reference=criterion["sutra_reference"],
                description=criterion.get("description", ""),
                score=criterion_score,
                notes=", ".join(filter(None, notes + modifier_notes)) or "Criterion requires additional remedies",
            )
        )

    compatibility_index = round((total_score / total_weight) * 100, 2) if total_weight else 0.0
    return MatchmakingCompatibility(
        compatibility_index=compatibility_index,
        breakdown=breakdown,
        modern_highlights=modern_highlights,
    )


def _score_conditions(snapshot: CelestialSnapshot, conditions: Dict, base_value: float) -> float:
    """Return a scaled score if snapshot satisfies the provided conditions."""

    if not conditions:
        return round(base_value, 2)

    matches = 0
    total = 0
    for field, rule in conditions.items():
        total += 1
        value = getattr(snapshot, field)
        if _matches_rule(value, rule):
            matches += 1

    ratio = matches / total if total else 1
    return round(base_value * ratio, 2)


def _matches_rule(value, rule) -> bool:
    if isinstance(rule, dict):
        equals = rule.get("equals")
        if equals is not None and value != equals:
            return False
        any_of = rule.get("any_of")
        if any_of is not None and value not in any_of:
            return False
        minimum = rule.get("min")
        if minimum is not None and value < minimum:
            return False
        maximum = rule.get("max")
        if maximum is not None and value > maximum:
            return False
        return True

    return value == rule


def _evaluate_pair_rule(
    primary: CelestialSnapshot, partner: CelestialSnapshot, rule: Dict
) -> Tuple[float, float]:
    """Score a single pair-wise compatibility rule."""

    weight = float(rule.get("weight", 1.0))
    comparator = rule.get("comparator", "equal")
    primary_value = getattr(primary, rule["primary_field"])
    partner_value = getattr(partner, rule.get("partner_field", rule["primary_field"]))

    matched = False
    if comparator == "equal":
        matched = primary_value == partner_value
    elif comparator == "harmonious":
        for harmony_set in rule.get("sets", []):
            if primary_value in harmony_set and partner_value in harmony_set:
                matched = True
                break
    elif comparator == "distance":
        if isinstance(primary_value, int) and isinstance(partner_value, int):
            diff = abs(primary_value - partner_value)
            if rule.get("circular"):
                diff = min(diff, 12 - diff)
            matched = diff <= int(rule.get("max_difference", 0))
    elif comparator == "complementary":
        for pair in rule.get("pairs", []):
            if {primary_value, partner_value} == set(pair):
                matched = True
                break

    return (weight if matched else 0.0, weight)

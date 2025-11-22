"""Numerical helpers that translate Bhrigu Samhita sutras into scores."""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import date, datetime, time
from functools import lru_cache
from typing import Dict, List, Tuple

try:  # NumPy ships via scikit-learn but stay defensive for constrained envs
    import numpy as np
except Exception:  # pragma: no cover - runtime environments may omit NumPy
    np = None

from sklearn.linear_model import LogisticRegression

from .astronomical_calculations import auto_snapshot_kwargs, derive_transit_snapshot, normalize_birth_datetime
from .config import load_runtime_config


@dataclass
class CelestialSnapshot:
    """Minimal astronomical context used by the heuristic rules."""

    birth_date: date
    birth_time: time
    birth_place: str
    tradition: str
    lunar_tithi: int
    moon_element: str
    mars_house: int
    saturn_house: int
    venus_house: int
    ketu_house: int
    mercury_house: int
    jupiter_house: int
    rahu_aspects_ascendant: bool
    saturn_retrograde: bool

    @classmethod
    def from_strings(
        cls,
        birth_date: str,
        birth_time: str,
        birth_place: str,
        lunar_tithi: int | None = None,
        moon_element: str | None = None,
        mars_house: int | None = None,
        saturn_house: int | None = None,
        venus_house: int | None = None,
        rahu_aspects_ascendant: bool | None = None,
        tradition: str | None = None,
        ketu_house: int | None = None,
        mercury_house: int | None = None,
        jupiter_house: int | None = None,
        saturn_retrograde: bool | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
        timezone_name: str | None = None,
    ) -> "CelestialSnapshot":
        baseline = auto_snapshot_kwargs(
            birth_date=birth_date,
            birth_time=birth_time,
            birth_place=birth_place,
            latitude=latitude,
            longitude=longitude,
            timezone_name=timezone_name,
        )

        computed: Dict[str, object] = {
            "lunar_tithi": lunar_tithi,
            "moon_element": moon_element,
            "mars_house": mars_house,
            "saturn_house": saturn_house,
            "venus_house": venus_house,
            "ketu_house": ketu_house,
            "mercury_house": mercury_house,
            "jupiter_house": jupiter_house,
            "rahu_aspects_ascendant": rahu_aspects_ascendant,
            "saturn_retrograde": saturn_retrograde,
        }

        for key, value in computed.items():
            if value is None:
                continue
            if isinstance(value, str) and value == "":
                continue
            if isinstance(value, (int, float)) and value == 0:
                continue
            baseline[key] = value

        parsed_date = datetime.fromisoformat(str(baseline["birth_date"])).date()
        parsed_time = time.fromisoformat(str(baseline["birth_time"]))
        normalized_tradition = (tradition or "universal").lower()

        return cls(
            birth_date=parsed_date,
            birth_time=parsed_time,
            birth_place=birth_place,
            tradition=normalized_tradition,
            lunar_tithi=int(baseline["lunar_tithi"]),
            moon_element=str(baseline["moon_element"]),
            mars_house=int(baseline["mars_house"]),
            saturn_house=int(baseline["saturn_house"]),
            venus_house=int(baseline["venus_house"]),
            ketu_house=int(baseline["ketu_house"]),
            mercury_house=int(baseline["mercury_house"]),
            jupiter_house=int(baseline["jupiter_house"]),
            rahu_aspects_ascendant=bool(baseline["rahu_aspects_ascendant"]),
            saturn_retrograde=bool(baseline["saturn_retrograde"]),
        )

    @classmethod
    def from_birth_details(
        cls,
        name: str,
        birth_date: str,
        birth_time: str,
        birth_place: str,
        tradition: str | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
        timezone_name: str | None = None,
    ) -> "CelestialSnapshot":
        """Create a snapshot by deriving lunar markers from the birth details."""

        derived = auto_snapshot_kwargs(
            birth_date=birth_date,
            birth_time=birth_time,
            birth_place=birth_place,
            latitude=latitude,
            longitude=longitude,
            timezone_name=timezone_name,
        )
        return cls.from_strings(
            birth_date=str(derived["birth_date"]),
            birth_time=str(derived["birth_time"]),
            birth_place=birth_place,
            tradition=tradition or "universal",
            lunar_tithi=int(derived["lunar_tithi"]),
            moon_element=str(derived["moon_element"]),
            mars_house=int(derived["mars_house"]),
            saturn_house=int(derived["saturn_house"]),
            venus_house=int(derived["venus_house"]),
            rahu_aspects_ascendant=bool(derived["rahu_aspects_ascendant"]),
            ketu_house=int(derived["ketu_house"]),
            mercury_house=int(derived["mercury_house"]),
            jupiter_house=int(derived["jupiter_house"]),
            saturn_retrograde=bool(derived["saturn_retrograde"]),
            latitude=derived.get("latitude"),
            longitude=derived.get("longitude"),
            timezone_name=derived.get("timezone"),
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
class TransitDirective:
    """Transit narrative combining natal and gochar observations."""

    reference: str
    influence: str
    certainty: float
    planet: str


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
    long_term_index: float
    short_term_index: float
    breakdown: List[MatchCriterionResult]
    modern_highlights: List[str]


def score_principles(
    snapshot: CelestialSnapshot, principles: List[Dict], runtime_config: Dict[str, object] | None = None
) -> Dict[str, float]:
    """Compute normalized weights for each principle based on the snapshot.

    A Bayesian posterior is blended with a lightweight ML scorer to highlight
    which manuscript principles matter most for the supplied snapshot. When
    multiple principles compete for the same conceptual weight, the conflict
    resolution strategy prefers the earliest antiquity rank to stay faithful to
    the manuscript lineage.
    """

    config = runtime_config or load_runtime_config()
    scoring_config: Dict[str, object] = config.get("scoring", {})  # type: ignore[assignment]
    conflict_config: Dict[str, object] = config.get("conflicts", {})  # type: ignore[assignment]
    alpha = float(scoring_config.get("bayesian_alpha", 1.1))
    beta = float(scoring_config.get("bayesian_beta", 1.05))
    ml_floor = float(scoring_config.get("ml_weight_floor", 0.4))
    max_modifier = float(scoring_config.get("max_modifier", 1.35))
    exponential_config: Dict[str, object] = scoring_config.get("exponential_weighting", {}) or {}

    resolved: Dict[str, Dict[str, object]] = {}
    model = _logistic_model(
        positive_bias=float(scoring_config.get("logistic_positive_bias", 0.2)),
        negative_bias=float(scoring_config.get("logistic_negative_bias", -0.1)),
        threshold=ml_floor,
    )

    for principle in principles:
        if not _tradition_allows(principle, snapshot.tradition):
            continue

        pid = principle["id"]
        weights = principle.get("weights", {})
        modifier = 1.0

        if pid == "BR-1" and snapshot.moon_element.lower() == "water":
            modifier += 0.2
        if pid == "BR-7" and snapshot.lunar_tithi == 5 and snapshot.mars_house == 10:
            modifier += 0.25
        if pid == "BR-18" and snapshot.saturn_house == 2 and snapshot.venus_house == 2 and snapshot.rahu_aspects_ascendant:
            modifier += 0.3
        if pid == "BR-19" and snapshot.ketu_house == 12 and snapshot.moon_element in {"water", "ether"}:
            modifier += 0.18
        if pid == "BR-22" and snapshot.mercury_house in {4, 5, 6} and snapshot.jupiter_house in {4, 5, 6}:
            modifier += 0.22
        if pid == "BR-30" and snapshot.saturn_retrograde and 4 <= snapshot.mars_house <= 10:
            modifier += 0.2

        modifier = min(modifier, max_modifier)
        antiquity_rank = _antiquity_rank(principle, conflict_config)

        for key, value in weights.items():
            posterior = _bayesian_weight(float(value), alpha, beta)
            ml_score = _ml_weight_score(model, posterior, modifier)
            combined = round(min(1.0, ((posterior + ml_score) / 2) * modifier), 2)
            dynamic = _apply_exponential_weighting(
                combined,
                posterior=posterior,
                ml_score=ml_score,
                modifier=modifier,
                config=exponential_config,
            )
            _record_weight(resolved, key, dynamic, antiquity_rank, pid, conflict_config)

    return {key: float(entry["score"]) for key, entry in resolved.items()}


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
        if not _tradition_allows(engine, snapshot.tradition):
            continue
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

    if not insights:
        insights.append(
            PastLifeInsight(
                engine_id="PL-DEFAULT",
                sutra_reference="Bhrigu Samhita (default)",
                narrative=(
                    "No specific past-life folios matched the provided placements; "
                    "defaulting to ancestral service and pilgrimage remedies."
                ),
                confidence=0.5,
            )
        )

    return sorted(insights, key=lambda insight: insight.confidence, reverse=True)


def evaluate_future_directives(
    snapshot: CelestialSnapshot,
    engines: List[Dict],
    transit_rules: List[Dict] | None = None,
    transit_details: Dict[str, object] | None = None,
) -> List[FutureTrajectory]:
    """Map future trajectories for the native from the Samhita folios.

    When transit details and gochar rules are supplied, append transit-driven
    mandates so callers can surface time-sensitive guidance alongside the
    longer-horizon folio trajectories.
    """

    directives: List[FutureTrajectory] = []
    for engine in engines:
        if not _tradition_allows(engine, snapshot.tradition):
            continue
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

    if transit_rules and transit_details is not None:
        transit_directives = evaluate_transits(snapshot, transit_details, transit_rules)
        for directive in transit_directives:
            directives.append(
                FutureTrajectory(
                    engine_id=f"TRANSIT-{directive.planet}",
                    sutra_reference=directive.reference,
                    focus=directive.influence,
                    window="Active transit window",
                    certainty=directive.certainty,
                )
            )

    if not directives:
        directives.append(
            FutureTrajectory(
                engine_id="FUTURE-DEFAULT",
                sutra_reference="Bhrigu Samhita (default)",
                focus=(
                    "Continue disciplined study, charity, and ancestral rituals while "
                    "consulting a learned guru for personalized windows."
                ),
                window="Multi-year guidance",
                certainty=0.55,
            )
        )

    return sorted(directives, key=lambda directive: directive.certainty, reverse=True)


def evaluate_transits(
    snapshot: CelestialSnapshot, transit_details: Dict[str, object], transit_rules: List[Dict]
) -> List[TransitDirective]:
    """Blend natal snapshot with transit overlays to surface gochar guidance."""

    directives: List[TransitDirective] = []
    for rule in transit_rules:
        if not _tradition_allows(rule, snapshot.tradition):
            continue
        conditions = rule.get("conditions", {})
        matches = 0
        total = 0
        for key, expected in conditions.items():
            total += 1
            value = transit_details.get(key, getattr(snapshot, key, None))
            if isinstance(expected, dict):
                min_val = expected.get("min")
                max_val = expected.get("max")
                any_of = expected.get("any_of")
                if any_of is not None and value in any_of:
                    matches += 1
                    continue
                if min_val is not None and value is not None and value >= min_val:
                    matches += 1
                    continue
                if max_val is not None and value is not None and value <= max_val:
                    matches += 1
                    continue
            elif value == expected or (isinstance(expected, (list, tuple, set)) and value in expected):
                matches += 1
        if total and matches / total < 0.5:
            continue

        directives.append(
            TransitDirective(
                reference=rule.get("sutra_reference", "Bhrigu gochar"),
                influence=rule.get("influence", "Transit influence requires more data"),
                certainty=round(float(rule.get("certainty", 0.65)) * (matches / max(total, 1)), 2),
                planet=rule.get("planet", "mixed"),
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
    long_term_score = 0.0
    long_term_weight = 0.0
    short_term_score = 0.0
    short_term_weight = 0.0
    modern_highlights: List[str] = []

    for criterion in criteria:
        if not _tradition_allows(criterion, primary.tradition):
            continue
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

        ratio = _safe_ratio(earned, possible)
        criterion_score = round(base_weight * ratio, 2)
        total_score += criterion_score
        total_weight += base_weight
        horizon = (criterion.get("time_horizon") or "").lower()
        if horizon == "long-term":
            long_term_score += criterion_score
            long_term_weight += base_weight
        elif horizon == "short-term":
            short_term_score += criterion_score
            short_term_weight += base_weight

        modifier_notes: List[str] = []
        for preference in modern_preferences:
            bonus = float(criterion.get("modern_modifiers", {}).get(preference, 0.0))
            if bonus:
                total_score += bonus
                total_weight += bonus
                if horizon == "long-term":
                    long_term_score += bonus
                    long_term_weight += bonus
                elif horizon == "short-term":
                    short_term_score += bonus
                    short_term_weight += bonus
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

    if not breakdown:
        breakdown.append(
            MatchCriterionResult(
                criterion_id="MM-DEFAULT",
                sutra_reference="Bhrigu Samhita (default)",
                description="Generic compatibility guidance while awaiting complete folios.",
                score=0.0,
                notes=(
                    "Submit complete Panchanga fields for both partners to unlock manuscript-backed compatibility mapping."
                ),
            )
        )

    compatibility_index = round(_safe_ratio(total_score, total_weight) * 100, 2) if total_weight else 50.0
    long_term_index = round(_safe_ratio(long_term_score, long_term_weight) * 100, 2) if long_term_weight else compatibility_index
    short_term_index = round(_safe_ratio(short_term_score, short_term_weight) * 100, 2) if short_term_weight else compatibility_index
    return MatchmakingCompatibility(
        compatibility_index=compatibility_index,
        long_term_index=long_term_index,
        short_term_index=short_term_index,
        breakdown=breakdown,
        modern_highlights=modern_highlights,
    )


def _bayesian_weight(raw_weight: float, alpha: float, beta: float) -> float:
    posterior_alpha = alpha + raw_weight
    posterior_beta = beta + (1 - raw_weight)
    return round(posterior_alpha / (posterior_alpha + posterior_beta), 3)


@lru_cache(maxsize=None)
def _logistic_model(positive_bias: float, negative_bias: float, threshold: float) -> LogisticRegression:
    """Train a tiny logistic regression to up-rank confident weights."""

    model = LogisticRegression()
    training_features = [
        [threshold - 0.2, negative_bias],
        [threshold, 0.0],
        [0.75, positive_bias],
        [0.9, positive_bias],
    ]
    labels = [0, 0, 1, 1]
    model.fit(training_features, labels)
    return model


def _ml_weight_score(model: LogisticRegression, posterior: float, modifier: float) -> float:
    probability = model.predict_proba([[posterior, modifier]])[0][1]
    return round(float(probability), 3)


def _apply_exponential_weighting(
    combined: float, posterior: float, ml_score: float, modifier: float, config: Dict[str, object]
) -> float:
    """Optionally amplify confident weights with an exponential curve.

    The exponential boost kicks in only when a principle already scores above
    the configured anchor; this prevents runaway values while still rewarding
    corroborated manuscript and ML signals.
    """

    if not config or not bool(config.get("enabled", False)):
        return combined

    curve = float(config.get("curve", 1.12))
    ceiling = float(config.get("ceiling", 0.25))
    anchor = float(config.get("anchor", 0.55))
    stability_bonus = float(config.get("stability_bonus", 0.03))
    prefer_higher = bool(config.get("prefer_higher", True))

    headroom = max(combined - anchor, 0)
    exponential = math.pow(curve, headroom * modifier) - 1
    capped = min(ceiling, exponential)
    adjusted = combined + capped

    if prefer_higher and combined >= ml_score:
        adjusted += min(ceiling - capped, stability_bonus * headroom)

    return round(min(1.0, adjusted), 2)


def _record_weight(
    resolved: Dict[str, Dict[str, object]],
    key: str,
    score: float,
    antiquity_rank: int,
    principle_id: str,
    conflict_config: Dict[str, object],
) -> None:
    strategy = str(conflict_config.get("strategy", "antiquity"))
    prefer_higher = bool(conflict_config.get("prefer_higher_weight", True))

    existing = resolved.get(key)
    if not existing:
        resolved[key] = {"score": score, "rank": antiquity_rank, "principle_id": principle_id}
        return

    existing_rank = int(existing.get("rank", 999))
    existing_score = float(existing.get("score", 0.0))

    if strategy == "antiquity":
        if antiquity_rank < existing_rank:
            resolved[key] = {"score": score, "rank": antiquity_rank, "principle_id": principle_id}
            return
        if antiquity_rank == existing_rank and prefer_higher and score > existing_score:
            resolved[key] = {"score": score, "rank": antiquity_rank, "principle_id": principle_id}
        return

    if prefer_higher and score > existing_score:
        resolved[key] = {"score": score, "rank": antiquity_rank, "principle_id": principle_id}


def _antiquity_rank(principle: Dict, conflict_config: Dict[str, object]) -> int:
    if "antiquity_rank" in principle:
        return int(principle["antiquity_rank"])
    default_rank = int(conflict_config.get("default_rank", 99))
    ranks = conflict_config.get("antiquity_ranks", {}) or {}
    return int(ranks.get(principle.get("id"), default_rank))


def _score_conditions(snapshot: CelestialSnapshot, conditions: Dict, base_value: float) -> float:
    """Return a scaled score if snapshot satisfies the provided conditions."""

    if not conditions:
        return round(base_value, 2)

    ratio = _condition_ratio(snapshot, conditions)
    return round(base_value * ratio, 2)


def _condition_ratio(snapshot: CelestialSnapshot, conditions: Dict) -> float:
    """Return match ratio using a NumPy fast-path when available."""

    results: List[bool] = []
    for field, rule in conditions.items():
        try:
            value = getattr(snapshot, field)
        except AttributeError as exc:
            raise ValueError(f"Snapshot missing field required by rule: {field}") from exc
        results.append(_matches_rule(value, rule))

    if not results:
        return 1.0

    if np is not None:
        array = np.fromiter((1.0 if match else 0.0 for match in results), dtype=float)
        return float(array.mean())

    matches = sum(1 for match in results if match)
    return matches / len(results)


def _safe_ratio(numerator: float, denominator: float) -> float:
    if denominator == 0:
        return 1.0
    if np is not None:
        return float(np.divide(numerator, denominator))
    return numerator / denominator


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


def _tradition_allows(entry: Dict, target: str) -> bool:
    """Return True when a corpus entry applies to the provided tradition."""

    entry_tradition = entry.get("tradition")
    if not entry_tradition:
        return True
    normalized_target = target.lower()
    if isinstance(entry_tradition, (list, tuple, set)):
        normalized = {str(item).lower() for item in entry_tradition}
        return normalized_target in normalized or "universal" in normalized

    normalized_entry = str(entry_tradition).lower()
    if normalized_entry == "universal":
        return True
    if normalized_target == "universal":
        return True
    return normalized_entry == normalized_target


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

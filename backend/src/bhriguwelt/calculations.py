"""Numerical helpers that translate Bhrigu Samhita sutras into scores."""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from datetime import date, datetime, time
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Tuple

try:  # NumPy ships via scikit-learn but stay defensive for constrained envs
    import numpy as np
except Exception:  # pragma: no cover - runtime environments may omit NumPy
    np = None

try:  # pragma: no cover - optional dependency for ML weighting
    from sklearn.linear_model import LogisticRegression
except Exception:  # pragma: no cover - offline or sandboxed environments
    LogisticRegression = None  # type: ignore[assignment]

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
    max_modifier = float(scoring_config.get("max_modifier", 1.35))
    exponential_config: Dict[str, object] = scoring_config.get("exponential_weighting", {}) or {}

    resolved: Dict[str, Dict[str, object]] = {}
    model = _logistic_model(scoring_config)

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
            ml_score = _ml_weight_score(model, snapshot, posterior, modifier)
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
def _element_scalar(element: str) -> float:
    element_order = ["fire", "earth", "air", "water", "ether"]
    try:
        position = element_order.index(element.lower())
    except ValueError:
        return 1.0
    return position / (len(element_order) - 1)


def _benchmark_path(scoring_config: Dict[str, object]) -> Path:
    configured = scoring_config.get("benchmark_data_path")
    if configured:
        candidate = Path(str(configured))
        if candidate.exists():
            return candidate
    package_root = Path(__file__).resolve().parents[2]
    bundled = package_root / "tests" / "data" / "benchmark_charts.json"
    if bundled.exists():
        return bundled
    project_root = Path(__file__).resolve().parents[3]
    return project_root / "tests" / "data" / "benchmark_charts.json"


@lru_cache(maxsize=None)
def _load_benchmark_charts(path: Path) -> List[Dict[str, object]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _shift_house(value: int, delta: int) -> int:
    base = (int(value) - 1 + delta) % 12
    return base + 1


def _encode_chart_features(markers: Dict[str, object], posterior: float, modifier: float) -> List[float]:
    return [
        posterior,
        modifier,
        float(markers.get("lunar_tithi", 0)) / 30.0,
        _element_scalar(str(markers.get("moon_element", ""))),
        float(markers.get("mars_house", 0)) / 12.0,
        float(markers.get("saturn_house", 0)) / 12.0,
        float(markers.get("venus_house", 0)) / 12.0,
        float(markers.get("ketu_house", 0)) / 12.0,
        float(markers.get("mercury_house", 0)) / 12.0,
        float(markers.get("jupiter_house", 0)) / 12.0,
        1.0 if markers.get("saturn_retrograde") else 0.0,
        1.0 if markers.get("rahu_aspects_ascendant") else 0.0,
    ]


def _negative_example(markers: Dict[str, object], jitter: float) -> Dict[str, object]:
    moon_cycle = {"fire": "earth", "earth": "air", "air": "water", "water": "fire"}
    return {
        "lunar_tithi": ((int(markers.get("lunar_tithi", 1)) + 3 - 1) % 30) + 1,
        "moon_element": moon_cycle.get(str(markers.get("moon_element", "")).lower(), "ether"),
        "mars_house": _shift_house(int(markers.get("mars_house", 1)), 2),
        "saturn_house": _shift_house(int(markers.get("saturn_house", 1)), 3),
        "venus_house": _shift_house(int(markers.get("venus_house", 1)), 1),
        "ketu_house": _shift_house(int(markers.get("ketu_house", 1)), 4),
        "mercury_house": _shift_house(int(markers.get("mercury_house", 1)), 5),
        "jupiter_house": _shift_house(int(markers.get("jupiter_house", 1)), 2),
        "saturn_retrograde": not bool(markers.get("saturn_retrograde", False)),
        "rahu_aspects_ascendant": not bool(markers.get("rahu_aspects_ascendant", False)),
        "modifier_penalty": max(0.0, 1.0 - jitter),
        "posterior_penalty": jitter,
    }


def _training_matrix(scoring_config: Dict[str, object]) -> Tuple[List[List[float]], List[int]]:
    charts = _load_benchmark_charts(_benchmark_path(scoring_config))
    posteriors = scoring_config.get("ml_training_posteriors", [0.45, 0.62, 0.8])
    modifiers = scoring_config.get("ml_training_modifiers", [1.0, 1.15, 1.28])
    jitter = float(scoring_config.get("ml_negative_jitter", 0.18))

    features: List[List[float]] = []
    labels: List[int] = []

    for chart in charts:
        markers = chart.get("expected_swisseph") or chart.get("expected_fallback")
        if not markers:
            continue

        for posterior in posteriors:
            for modifier in modifiers:
                features.append(_encode_chart_features(markers, float(posterior), float(modifier)))
                labels.append(1)

                synthetic_negative = _negative_example(markers, jitter)
                penalty = synthetic_negative.pop("posterior_penalty", jitter)
                modifier_penalty = synthetic_negative.pop("modifier_penalty", 1.0 - jitter)
                features.append(
                    _encode_chart_features(
                        synthetic_negative,
                        max(0.05, float(posterior) - float(penalty)),
                        max(1.0, float(modifier) * float(modifier_penalty)),
                    )
                )
                labels.append(0)

    if not features:
        fallback_threshold = float(scoring_config.get("ml_weight_floor", 0.4))
        bias_positive = float(scoring_config.get("logistic_positive_bias", 0.2))
        bias_negative = float(scoring_config.get("logistic_negative_bias", -0.1))
        fallback_markers = {
            "lunar_tithi": 15,
            "moon_element": "air",
            "mars_house": 6,
            "saturn_house": 8,
            "venus_house": 3,
            "ketu_house": 10,
            "mercury_house": 4,
            "jupiter_house": 9,
            "saturn_retrograde": False,
            "rahu_aspects_ascendant": True,
        }
        features = [
            _encode_chart_features(fallback_markers, fallback_threshold - 0.1, 1.0 + bias_negative),
            _encode_chart_features(fallback_markers, fallback_threshold + 0.05, 1.0),
            _encode_chart_features(fallback_markers, fallback_threshold + 0.2, 1.0 + bias_positive),
            _encode_chart_features(fallback_markers, fallback_threshold + 0.35, 1.0 + (bias_positive * 1.5)),
        ]
        labels = [0, 0, 1, 1]

    return features, labels


def _logistic_model(scoring_config: Dict[str, object]) -> Any:
    """Train a logistic regression using curated benchmark charts.

    The primary implementation relies on scikit-learn, but offline
    environments (or minimal CI sandboxes) may lack the dependency. In those
    cases a deterministic fallback model is returned so the ML weighting
    branch still exercises meaningful logic during testing.
    """

    # Backwards compatibility: older tests called this helper with individual
    # bias values instead of a configuration mapping. Detect that pattern and
    # normalize into the modern config structure so callers don't break.
    if not isinstance(scoring_config, dict):  # pragma: no cover - legacy path
        positive_bias = float(scoring_config or 0.0)
        scoring_config = {
            "logistic_positive_bias": positive_bias,
        }

    features, labels = _training_matrix(scoring_config)
    trained_parameters: Dict[str, object] | None = scoring_config.get("ml_trained_parameters")  # type: ignore[assignment]

    if trained_parameters:
        raw_weights = trained_parameters.get("coefficients") or trained_parameters.get("weights")
        weights = [float(value) for value in raw_weights or []]
        intercept = float(trained_parameters.get("intercept", 0.0))
        if weights:
            return _FallbackLogistic(weights, intercept=intercept)

    if LogisticRegression is not None:
        try:
            model = LogisticRegression(
                class_weight=scoring_config.get("logistic_class_weight", "balanced"),
                max_iter=int(scoring_config.get("logistic_max_iter", 500)),
                C=float(scoring_config.get("logistic_regularization", 1.4)),
                solver=str(scoring_config.get("logistic_solver", "liblinear")),
            )
            model.fit(features, labels)
            return model
        except Exception:  # pragma: no cover - fall back to static coefficients
            model = None

    return _train_fallback_model(features, labels, scoring_config)


class _FallbackLogistic:
    """Lightweight deterministic logistic substitute.

    The fallback mirrors the scikit-learn interface expected by
    :func:`_ml_weight_score` while avoiding heavyweight numeric dependencies.
    It computes a simple separating hyperplane using mean differences between
    positive and negative training samples, honoring any configured bias
    nudges. The goal isn't statistical perfection; it's to keep ML-aware
    scoring paths active when scikit-learn is unavailable.
    """

    def __init__(self, weights: List[float], intercept: float = 0.0) -> None:
        self.weights = weights
        self.intercept = intercept

    def predict_proba(self, samples: List[List[float]]):  # type: ignore[override]
        results = []
        for sample in samples:
            margin = self.intercept
            margin += sum(w * float(x) for w, x in zip(self.weights, sample))
            probability = 1 / (1 + math.exp(-margin))
            results.append([1 - probability, probability])
        return results


def _train_fallback_model(
    features: List[List[float]], labels: List[int], scoring_config: Dict[str, object]
) -> _FallbackLogistic:
    positive_samples = [vector for vector, label in zip(features, labels) if label == 1]
    negative_samples = [vector for vector, label in zip(features, labels) if label == 0]

    def _mean_vector(collection: List[List[float]]) -> List[float]:
        if not collection:
            return [0.0 for _ in range(len(features[0]) if features else 0)]
        length = len(collection)
        summed = [0.0 for _ in range(len(collection[0]))]
        for vector in collection:
            for index, value in enumerate(vector):
                summed[index] += float(value)
        return [value / length for value in summed]

    positive_mean = _mean_vector(positive_samples)
    negative_mean = _mean_vector(negative_samples)

    weights = [p - n for p, n in zip(positive_mean, negative_mean)]
    intercept = float(scoring_config.get("logistic_positive_bias", 0.0))
    intercept += float(scoring_config.get("logistic_negative_bias", 0.0))
    intercept += float(scoring_config.get("logistic_bias", 0.0))

    return _FallbackLogistic(weights, intercept=intercept)


def _ml_weight_score(
    model: Any, snapshot: CelestialSnapshot, posterior: float, modifier: float
) -> float:
    features = _encode_chart_features(
        {
            "lunar_tithi": snapshot.lunar_tithi,
            "moon_element": snapshot.moon_element,
            "mars_house": snapshot.mars_house,
            "saturn_house": snapshot.saturn_house,
            "venus_house": snapshot.venus_house,
            "ketu_house": snapshot.ketu_house,
            "mercury_house": snapshot.mercury_house,
            "jupiter_house": snapshot.jupiter_house,
            "saturn_retrograde": snapshot.saturn_retrograde,
            "rahu_aspects_ascendant": snapshot.rahu_aspects_ascendant,
        },
        posterior,
        modifier,
    )
    probability = model.predict_proba([features])[0][1]
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

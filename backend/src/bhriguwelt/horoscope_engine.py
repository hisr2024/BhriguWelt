"""Deterministic horoscope engine rooted in Bhrigu Samhita principles."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Iterable, List, Mapping

from .calculations import (
    CelestialSnapshot,
    FutureTrajectory,
    PastLifeInsight,
    evaluate_future_directives,
    evaluate_past_life,
    score_principles,
)
from .config import load_runtime_config
from .data_loader import load_bhrigu_data

SUPPORTED_MOON_ELEMENTS = {"water", "fire", "air", "earth", "ether"}
SUPPORTED_HOUSE_KEYS = {
    "moon",
    "ascendant",
    "mars",
    "saturn",
    "venus",
    "rahu",
    "ketu",
    "mercury",
    "jupiter",
}


@dataclass(frozen=True)
class BirthDetails:
    name: str
    birth_date: str
    birth_time: str
    birth_place: str
    lunar_tithi: int
    moon_element: str
    planetary_houses: Mapping[str, int]
    tradition: str = "universal"

    def validated(self) -> "BirthDetails":
        if not self.name.strip():
            raise ValueError("name is required")
        _ensure_iso_date(self.birth_date)
        _ensure_iso_time(self.birth_time)
        if not self.birth_place.strip():
            raise ValueError("birth_place is required")
        if not (1 <= self.lunar_tithi <= 30):
            raise ValueError("lunar_tithi must be between 1 and 30")
        normalized_element = self.moon_element.strip().lower()
        if normalized_element not in SUPPORTED_MOON_ELEMENTS:
            raise ValueError("moon_element must be one of water, fire, air, earth, ether")
        cleaned_houses = _normalize_planetary_houses(self.planetary_houses)
        return BirthDetails(
            name=self.name.strip(),
            birth_date=self.birth_date,
            birth_time=self.birth_time,
            birth_place=self.birth_place.strip(),
            lunar_tithi=self.lunar_tithi,
            moon_element=normalized_element,
            planetary_houses=cleaned_houses,
            tradition=(self.tradition or "universal").strip().lower(),
        )


class HoroscopeEngine:
    """Deterministic Bhrigu Samhita horoscope generator."""

    def __init__(self, data_path: str | None = None) -> None:
        self._data_path = data_path

    def generate_reading(self, details: BirthDetails) -> Dict[str, Any]:
        validated = details.validated()
        dataset = load_bhrigu_data(_path_from_str(self._data_path))
        snapshot = self._build_snapshot(validated)
        runtime_config = load_runtime_config()

        weights = score_principles(snapshot, dataset.get("principles", []), runtime_config)
        past_insights = evaluate_past_life(snapshot, dataset.get("past_life_engines", []))
        future_trajectories = evaluate_future_directives(
            snapshot,
            dataset.get("future_engines", []),
        )
        remedies = _personalize_remedies(
            dataset.get("remedies", []),
            weights,
            snapshot,
            runtime_config,
        )

        present_guidance = _rank_principles(dataset.get("principles", []), weights)

        return {
            "name": validated.name,
            "past": {
                "karmic_backlog": _format_past_life(past_insights),
                "citations": _collect_insight_citations(past_insights),
            },
            "present": {
                "guidance": present_guidance,
                "remedial_rituals": _format_remedies(remedies),
                "citations": _collect_present_citations(present_guidance, remedies),
            },
            "future": {
                "trajectories": _format_future_trajectories(future_trajectories),
                "citations": _collect_future_citations(future_trajectories),
            },
        }

    @staticmethod
    def _build_snapshot(details: BirthDetails) -> CelestialSnapshot:
        houses = details.planetary_houses
        return CelestialSnapshot.from_strings(
            birth_date=details.birth_date,
            birth_time=details.birth_time,
            birth_place=details.birth_place,
            lunar_tithi=details.lunar_tithi,
            moon_element=details.moon_element,
            moon_house=houses.get("moon"),
            ascendant_house=houses.get("ascendant"),
            mars_house=houses.get("mars"),
            saturn_house=houses.get("saturn"),
            venus_house=houses.get("venus"),
            rahu_house=houses.get("rahu"),
            ketu_house=houses.get("ketu"),
            mercury_house=houses.get("mercury"),
            jupiter_house=houses.get("jupiter"),
            tradition=details.tradition,
        )


def generate_horoscope_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """HTTP-friendly wrapper that accepts a JSON payload and returns the reading."""

    details = BirthDetails(
        name=str(payload.get("name", "")),
        birth_date=str(payload.get("birth_date", "")),
        birth_time=str(payload.get("birth_time", "")),
        birth_place=str(payload.get("birth_place", "")),
        lunar_tithi=int(payload.get("lunar_tithi", 0)),
        moon_element=str(payload.get("moon_element", "")),
        planetary_houses=payload.get("planetary_houses", {}) or {},
        tradition=str(payload.get("tradition", "universal")),
    )
    engine = HoroscopeEngine()
    return engine.generate_reading(details)


def build_cli_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate a deterministic Bhrigu Samhita horoscope reading.",
    )
    parser.add_argument("--name", required=True)
    parser.add_argument("--birth-date", required=True, help="ISO date, e.g. 1990-05-21")
    parser.add_argument("--birth-time", required=True, help="24h time, e.g. 14:25")
    parser.add_argument("--birth-place", required=True)
    parser.add_argument("--lunar-tithi", type=int, required=True)
    parser.add_argument("--moon-element", required=True, choices=sorted(SUPPORTED_MOON_ELEMENTS))
    parser.add_argument("--tradition", default="universal")
    parser.add_argument("--moon-house", type=int)
    parser.add_argument("--ascendant-house", type=int)
    parser.add_argument("--mars-house", type=int)
    parser.add_argument("--saturn-house", type=int)
    parser.add_argument("--venus-house", type=int)
    parser.add_argument("--rahu-house", type=int)
    parser.add_argument("--ketu-house", type=int)
    parser.add_argument("--mercury-house", type=int)
    parser.add_argument("--jupiter-house", type=int)
    parser.add_argument("--data-path", help="Optional path to the YAML/JSON corpus")
    return parser


def main(argv: List[str] | None = None) -> int:
    parser = build_cli_parser()
    args = parser.parse_args(argv)

    planetary_houses = {
        "moon": args.moon_house,
        "ascendant": args.ascendant_house,
        "mars": args.mars_house,
        "saturn": args.saturn_house,
        "venus": args.venus_house,
        "rahu": args.rahu_house,
        "ketu": args.ketu_house,
        "mercury": args.mercury_house,
        "jupiter": args.jupiter_house,
    }
    details = BirthDetails(
        name=args.name,
        birth_date=args.birth_date,
        birth_time=args.birth_time,
        birth_place=args.birth_place,
        lunar_tithi=args.lunar_tithi,
        moon_element=args.moon_element,
        planetary_houses=planetary_houses,
        tradition=args.tradition,
    )
    engine = HoroscopeEngine(data_path=args.data_path)
    payload = engine.generate_reading(details)
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


def _ensure_iso_date(value: str) -> None:
    try:
        datetime.fromisoformat(value)
    except ValueError as exc:
        raise ValueError("birth_date must be ISO formatted, e.g. 1990-05-21") from exc


def _ensure_iso_time(value: str) -> None:
    try:
        datetime.strptime(value, "%H:%M")
    except ValueError as exc:
        raise ValueError("birth_time must be 24h formatted, e.g. 14:25") from exc


def _normalize_planetary_houses(houses: Mapping[str, int]) -> Dict[str, int]:
    cleaned: Dict[str, int] = {}
    if not isinstance(houses, Mapping):
        raise ValueError("planetary_houses must be a mapping of planet -> house")
    for key, value in houses.items():
        normalized_key = str(key).strip().lower()
        if normalized_key not in SUPPORTED_HOUSE_KEYS:
            raise ValueError(f"Unsupported planetary house key: {key}")
        if value is None:
            continue
        if not isinstance(value, int):
            raise ValueError(f"House for {key} must be an integer between 1 and 12")
        if not (1 <= value <= 12):
            raise ValueError(f"House for {key} must be between 1 and 12")
        cleaned[normalized_key] = value
    return cleaned


def _path_from_str(path: str | None) -> Any:
    if not path:
        return None
    from pathlib import Path

    return Path(path)


def _matches_rule(value: object, rule: object) -> bool:
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


def _score_conditions(snapshot: CelestialSnapshot, conditions: Mapping[str, object], base: float) -> float:
    if not conditions:
        return round(base, 2)
    total = 0
    matches = 0
    for field, rule in conditions.items():
        total += 1
        value = getattr(snapshot, field, None)
        if _matches_rule(value, rule):
            matches += 1
    ratio = matches / total if total else 1
    return round(base * ratio, 2)


def _personalize_remedies(
    remedies: Iterable[Mapping[str, object]],
    weights: Dict[str, float],
    snapshot: CelestialSnapshot,
    runtime_config: Dict[str, object],
) -> List[Dict[str, object]]:
    remedy_config = runtime_config.get("remedies", {}) if runtime_config else {}
    relevance_floor = float(remedy_config.get("relevance_floor", 0.45))
    target_threshold = float(remedy_config.get("target_threshold", 0.5))
    scored: List[Dict[str, object]] = []
    for remedy in remedies:
        base_relevance = float(remedy.get("base_relevance", 0.5))
        condition_score = _score_conditions(snapshot, remedy.get("conditions") or {}, base_relevance)
        targets = remedy.get("personalize_for") or []
        matched_targets = [target for target in targets if weights.get(target, 0.0) >= target_threshold]
        target_bonus = max((weights.get(target, 0.0) for target in matched_targets), default=0.0)
        relevance = round(min(1.0, condition_score + target_bonus / 2), 2)
        if relevance < relevance_floor:
            continue
        enriched = dict(remedy)
        enriched["relevance"] = relevance
        if matched_targets:
            enriched["matched_targets"] = matched_targets
        scored.append(enriched)
    if not scored:
        return [dict(remedy) for remedy in remedies]
    return sorted(scored, key=lambda entry: (-entry.get("relevance", 0.0), entry.get("id", "")))


def _rank_principles(principles: Iterable[Mapping[str, object]], weights: Dict[str, float]) -> List[Dict[str, object]]:
    ranked: List[Dict[str, object]] = []
    for principle in principles:
        principle_weights = principle.get("weights", {}) or {}
        if not principle_weights:
            continue
        values = [weights.get(key, 0.0) for key in principle_weights.keys()]
        score = round(sum(values) / len(values), 3) if values else 0.0
        ranked.append(
            {
                "id": principle.get("id"),
                "summary": str(principle.get("description", "")).strip(),
                "score": score,
                "sutra_reference": principle.get("sutra_reference"),
                "sources": _extract_sources(principle),
            }
        )
    ranked.sort(key=lambda entry: (-entry.get("score", 0.0), entry.get("id", "")))
    return ranked[:3]


def _format_past_life(insights: Iterable[PastLifeInsight]) -> List[Dict[str, object]]:
    return [
        {
            "engine_id": insight.engine_id,
            "narrative": insight.narrative,
            "confidence": insight.confidence,
            "sutra_reference": insight.sutra_reference,
        }
        for insight in insights
    ]


def _format_future_trajectories(trajectories: Iterable[FutureTrajectory]) -> List[Dict[str, object]]:
    return [
        {
            "engine_id": directive.engine_id,
            "trajectory": directive.focus,
            "window": directive.window,
            "certainty": directive.certainty,
            "sutra_reference": directive.sutra_reference,
        }
        for directive in trajectories
    ]


def _format_remedies(remedies: Iterable[Mapping[str, object]]) -> List[Dict[str, object]]:
    return [
        {
            "id": remedy.get("id"),
            "ritual": remedy.get("description"),
            "sutra_reference": remedy.get("sutra_reference"),
            "relevance": remedy.get("relevance"),
            "sources": _extract_sources(remedy),
        }
        for remedy in remedies
    ][:3]


def _extract_sources(entry: Mapping[str, object]) -> List[str]:
    integrity = entry.get("integrity") if isinstance(entry, Mapping) else None
    if not isinstance(integrity, Mapping):
        return []
    sources = integrity.get("sources")
    if not sources:
        return []
    return [str(source) for source in sources]


def _collect_insight_citations(insights: Iterable[PastLifeInsight]) -> List[str]:
    return [insight.sutra_reference for insight in insights]


def _collect_present_citations(
    guidance: Iterable[Mapping[str, object]],
    remedies: Iterable[Mapping[str, object]],
) -> List[str]:
    citations: List[str] = []
    for entry in guidance:
        reference = entry.get("sutra_reference")
        if reference:
            citations.append(str(reference))
        citations.extend(entry.get("sources") or [])
    for remedy in remedies:
        reference = remedy.get("sutra_reference")
        if reference:
            citations.append(str(reference))
        citations.extend(_extract_sources(remedy))
    return list(dict.fromkeys(citations))


def _collect_future_citations(trajectories: Iterable[FutureTrajectory]) -> List[str]:
    return [trajectory.sutra_reference for trajectory in trajectories]


if __name__ == "__main__":  # pragma: no cover - CLI helper
    raise SystemExit(main())

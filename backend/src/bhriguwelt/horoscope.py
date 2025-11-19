"""CLI for generating horoscopes rooted in Bhrigu Samhita sutras."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from typing import Dict, List, Sequence

from .calendar_conversion import HinduCalendarContext, convert_birth_details
from .calculations import (
    CelestialSnapshot,
    FutureTrajectory,
    MatchmakingCompatibility,
    PastLifeInsight,
    derive_karmic_epoch,
    evaluate_future_directives,
    evaluate_matchmaking,
    evaluate_past_life,
    score_principles,
)
from .data_loader import load_bhrigu_data


@dataclass
class HoroscopeRequest:
    name: str
    birth_date: str
    birth_time: str
    birth_place: str
    lunar_tithi: int
    moon_element: str
    mars_house: int
    saturn_house: int
    venus_house: int
    rahu_aspects_ascendant: bool

    def __post_init__(self) -> None:
        if not (1 <= self.lunar_tithi <= 15):  # pragma: no cover - validation
            raise ValueError("lunar_tithi must be between 1 and 15")
        for field in ("mars_house", "saturn_house", "venus_house"):
            value = getattr(self, field)
            if not (1 <= value <= 12):
                raise ValueError(f"{field} must be between 1 and 12")
        normalized = self.moon_element.lower()
        if normalized not in {"water", "fire", "air", "earth"}:
            raise ValueError("moon_element must be one of water, fire, air, earth")
        self.moon_element = normalized


@dataclass
class HoroscopeReport:
    """Structured output referencing Bhrigu Samhita folios."""

    name: str
    karmic_epoch: str
    weights: Dict[str, float]
    principles: List[Dict]
    remedies: List[Dict]
    past_life_insights: List[PastLifeInsight]
    future_trajectories: List[FutureTrajectory]


@dataclass
class PastLifeReport:
    """Focused report on the native's prior incarnations."""

    name: str
    insights: List[PastLifeInsight]


@dataclass
class FutureReport:
    """Forward projections sourced from the Samhita."""

    name: str
    trajectories: List[FutureTrajectory]


@dataclass
class MatchmakingReport:
    """Compatibility digest that blends sutra guidance with modern intents."""

    primary_name: str
    partner_name: str
    compatibility: MatchmakingCompatibility


def build_calendar_context(
    birth_date: str, birth_time: str, birth_place: str
) -> HinduCalendarContext:
    """Return a Hindu calendar representation for the supplied birth record."""

    return convert_birth_details(birth_date=birth_date, birth_time=birth_time, birth_place=birth_place)


def build_prediction(request: HoroscopeRequest) -> HoroscopeReport:
    bhrigu_data = load_bhrigu_data()
    principles = bhrigu_data.get("principles", [])
    remedies = bhrigu_data.get("remedies", [])
    past_life_engines = bhrigu_data.get("past_life_engines", [])
    future_engines = bhrigu_data.get("future_engines", [])

    snapshot = _snapshot_from_request(request)

    weights = score_principles(snapshot, principles)
    karmic_epoch = derive_karmic_epoch(snapshot)
    past_life_insights = evaluate_past_life(snapshot, past_life_engines)
    future_trajectories = evaluate_future_directives(snapshot, future_engines)

    return HoroscopeReport(
        name=request.name,
        karmic_epoch=karmic_epoch,
        weights=weights,
        principles=principles,
        remedies=remedies,
        past_life_insights=past_life_insights,
        future_trajectories=future_trajectories,
    )


def build_past_life_report(request: HoroscopeRequest) -> PastLifeReport:
    bhrigu_data = load_bhrigu_data()
    snapshot = _snapshot_from_request(request)
    insights = evaluate_past_life(snapshot, bhrigu_data.get("past_life_engines", []))
    return PastLifeReport(name=request.name, insights=insights)


def build_future_report(request: HoroscopeRequest) -> FutureReport:
    bhrigu_data = load_bhrigu_data()
    snapshot = _snapshot_from_request(request)
    trajectories = evaluate_future_directives(snapshot, bhrigu_data.get("future_engines", []))
    return FutureReport(name=request.name, trajectories=trajectories)


def build_matchmaking_report(
    primary_request: HoroscopeRequest,
    partner_request: HoroscopeRequest,
    modern_preferences: List[str],
) -> MatchmakingReport:
    bhrigu_data = load_bhrigu_data()
    primary_snapshot = _snapshot_from_request(primary_request)
    partner_snapshot = _snapshot_from_request(partner_request)

    compatibility = evaluate_matchmaking(
        primary=primary_snapshot,
        partner=partner_snapshot,
        criteria=bhrigu_data.get("matchmaking_criteria", []),
        modern_preferences=modern_preferences,
    )

    return MatchmakingReport(
        primary_name=primary_request.name,
        partner_name=partner_request.name,
        compatibility=compatibility,
    )


def _snapshot_from_request(request: HoroscopeRequest) -> CelestialSnapshot:
    return CelestialSnapshot.from_strings(
        birth_date=request.birth_date,
        birth_time=request.birth_time,
        birth_place=request.birth_place,
        lunar_tithi=request.lunar_tithi,
        moon_element=request.moon_element,
        mars_house=request.mars_house,
        saturn_house=request.saturn_house,
        venus_house=request.venus_house,
        rahu_aspects_ascendant=request.rahu_aspects_ascendant,
    )


def _render_common_intro(name: str, birth_place: str) -> None:
    print(f"Bhrigu Samhita transmission for {name}")
    print(f"Birth locale recorded as {birth_place}")


def _add_common_arguments(parser: argparse.ArgumentParser, prefix: str = "") -> None:
    opt = f"{prefix}-" if prefix else ""
    dest = f"{prefix}_" if prefix else ""
    parser.add_argument(f"--{opt}name", dest=f"{dest}name", required=True, help="Native name")
    parser.add_argument(f"--{opt}birth-date", dest=f"{dest}birth_date", required=True, help="Birth date YYYY-MM-DD")
    parser.add_argument(f"--{opt}birth-time", dest=f"{dest}birth_time", required=True, help="Birth time HH:MM")
    parser.add_argument(f"--{opt}birth-place", dest=f"{dest}birth_place", required=True, help="Birth location")
    parser.add_argument(
        f"--{opt}lunar-tithi",
        dest=f"{dest}lunar_tithi",
        required=True,
        type=int,
        help="Lunar tithi (1-15)",
    )
    parser.add_argument(
        f"--{opt}moon-element",
        dest=f"{dest}moon_element",
        required=True,
        help="Element of Moon (water/fire/air/earth)",
    )
    parser.add_argument(
        f"--{opt}mars-house",
        dest=f"{dest}mars_house",
        required=True,
        type=int,
        help="House position of Mars",
    )
    parser.add_argument(
        f"--{opt}saturn-house",
        dest=f"{dest}saturn_house",
        required=True,
        type=int,
        help="House position of Saturn",
    )
    parser.add_argument(
        f"--{opt}venus-house",
        dest=f"{dest}venus_house",
        required=True,
        type=int,
        help="House position of Venus",
    )
    parser.add_argument(
        f"--{opt}rahu-aspects-ascendant",
        dest=f"{dest}rahu_aspects_ascendant",
        action="store_true",
        help="Flag when Rahu aspects the Ascendant",
    )


def _request_from_namespace(namespace: argparse.Namespace, prefix: str = "") -> HoroscopeRequest:
    dest = f"{prefix}_" if prefix else ""
    return HoroscopeRequest(
        name=getattr(namespace, f"{dest}name"),
        birth_date=getattr(namespace, f"{dest}birth_date"),
        birth_time=getattr(namespace, f"{dest}birth_time"),
        birth_place=getattr(namespace, f"{dest}birth_place"),
        lunar_tithi=getattr(namespace, f"{dest}lunar_tithi"),
        moon_element=getattr(namespace, f"{dest}moon_element"),
        mars_house=getattr(namespace, f"{dest}mars_house"),
        saturn_house=getattr(namespace, f"{dest}saturn_house"),
        venus_house=getattr(namespace, f"{dest}venus_house"),
        rahu_aspects_ascendant=getattr(namespace, f"{dest}rahu_aspects_ascendant"),
    )


def _render_horoscope(report: HoroscopeReport, birth_place: str) -> None:
    _render_common_intro(report.name, birth_place)
    print(f"Karmic epoch: {report.karmic_epoch}")
    print("Weights derived from Bhrigu sutras:")
    for key, value in report.weights.items():
        print(f"  - {key}: {value}")

    print("\nPast-life engines:")
    if report.past_life_insights:
        for insight in report.past_life_insights:
            print(
                f"  [{insight.engine_id}] {insight.narrative} (Confidence {insight.confidence} from {insight.sutra_reference})"
            )
    else:
        print("  No matching folios; consult Maharishi Bhrigu's remedies.")

    print("\nFuture directives:")
    if report.future_trajectories:
        for directive in report.future_trajectories:
            print(
                f"  [{directive.engine_id}] {directive.focus} | Window {directive.window} | Certainty {directive.certainty}"
            )
    else:
        print("  Awaiting further transits as per the Samhita.")

    print("\nPrinciple references:")
    for principle in report.principles:
        print(f"  [{principle['id']}] {principle['sutra_reference']}: {principle['description'].strip()}")

    print("\nRemedies:")
    for remedy in report.remedies:
        print(f"  [{remedy['id']}] {remedy['description'].strip()} ({remedy['sutra_reference']})")


def _render_past_life(report: PastLifeReport, birth_place: str) -> None:
    _render_common_intro(report.name, birth_place)
    if not report.insights:
        print("No past-life folios matched the provided placements.")
        return
    print("Past-life transmissions:")
    for insight in report.insights:
        print(
            f"  [{insight.engine_id}] {insight.narrative} -- confidence {insight.confidence} ({insight.sutra_reference})"
        )


def _render_future(report: FutureReport, birth_place: str) -> None:
    _render_common_intro(report.name, birth_place)
    if not report.trajectories:
        print("Future sutras are dormant for this configuration.")
        return
    print("Future directives:")
    for directive in report.trajectories:
        print(f"  [{directive.engine_id}] {directive.focus} | Window {directive.window} | Certainty {directive.certainty}")


def _render_matchmaking(report: MatchmakingReport) -> None:
    print(
        f"Modern Bhrigu matchmaking for {report.primary_name} × {report.partner_name}: {report.compatibility.compatibility_index}%"
    )
    print("Breakdown by folio:")
    for criterion in report.compatibility.breakdown:
        print(
            f"  [{criterion.criterion_id}] {criterion.description.strip()} -> score {criterion.score} ({criterion.sutra_reference})"
        )
        print(f"     Notes: {criterion.notes}")
    if report.compatibility.modern_highlights:
        print("\nModern alignment notes:")
        for note in report.compatibility.modern_highlights:
            print(f"  - {note}")


def _render_calendar(context: HinduCalendarContext) -> None:
    print("Bhrigu Samhita insists on capturing exact birth particulars.")
    print(f"Gregorian record: {context.birth_date.isoformat()} {context.birth_time.isoformat(timespec='minutes')} at {context.birth_place}")
    saka = context.saka_date
    print(
        "Śaka (Hindu national) conversion:"
        f" Year {saka.year}, Month {saka.month} ({saka.month_index}), Day {saka.day},"
        f" Leap-adjusted Chaitra: {'Yes' if saka.leap_year else 'No'}"
    )
    print(f"Conversion factor (Gregorian minus Śaka): {context.conversion_factor_years} years")
    print(f"Indian Standard Time reference longitude: {context.ist_reference_longitude}°E")
    print("Authentic Indian sources consulted:")
    for source in context.sources:
        print(f"  - {source}")


def main(argv: Sequence[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Bhrigu Samhita derived prediction engines")
    subparsers = parser.add_subparsers(dest="command", required=True)

    horoscope_parser = subparsers.add_parser("horoscope", help="Generate a full horoscope report")
    _add_common_arguments(horoscope_parser)

    past_parser = subparsers.add_parser("past-life", help="Generate a past-life focused report")
    _add_common_arguments(past_parser)

    future_parser = subparsers.add_parser("future", help="Generate future directives")
    _add_common_arguments(future_parser)

    matchmaking_parser = subparsers.add_parser("matchmaking", help="Modern compatibility diagnostics")
    _add_common_arguments(matchmaking_parser, prefix="primary")
    _add_common_arguments(matchmaking_parser, prefix="partner")
    matchmaking_parser.add_argument(
        "--modern-preference",
        action="append",
        default=[],
        help="Tag matchmaking intent such as remote-first, research-partnership, startup-ops, arts-collab",
    )

    calendar_parser = subparsers.add_parser(
        "calendar",
        help="Convert Gregorian birth data to Hindu (Śaka) calendar measurements",
    )
    calendar_parser.add_argument("--birth-date", required=True, help="Birth date YYYY-MM-DD")
    calendar_parser.add_argument("--birth-time", required=True, help="Birth time HH:MM")
    calendar_parser.add_argument("--birth-place", required=True, help="Birth location per passport")

    args = parser.parse_args(argv)

    if args.command == "horoscope":
        request = _request_from_namespace(args)
        report = build_prediction(request)
        _render_horoscope(report, args.birth_place)
    elif args.command == "past-life":
        request = _request_from_namespace(args)
        report = build_past_life_report(request)
        _render_past_life(report, args.birth_place)
    elif args.command == "future":
        request = _request_from_namespace(args)
        report = build_future_report(request)
        _render_future(report, args.birth_place)
    elif args.command == "matchmaking":
        primary_request = _request_from_namespace(args, prefix="primary")
        partner_request = _request_from_namespace(args, prefix="partner")
        report = build_matchmaking_report(primary_request, partner_request, args.modern_preference)
        _render_matchmaking(report)
    elif args.command == "calendar":
        context = build_calendar_context(args.birth_date, args.birth_time, args.birth_place)
        _render_calendar(context)
    else:  # pragma: no cover - defensive
        parser.error("Unknown command")


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    main()

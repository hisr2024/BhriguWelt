"""Regression tests for the Bhrigu prediction engines."""

from bhriguwelt.calculations import (
    CelestialSnapshot,
    evaluate_future_directives,
    evaluate_matchmaking,
    evaluate_past_life,
)
from bhriguwelt.data_loader import load_bhrigu_data


def _snapshot(**overrides) -> CelestialSnapshot:
    base = dict(
        birth_date="1990-05-18",
        birth_time="04:30",
        birth_place="Varanasi",
        lunar_tithi=5,
        moon_element="water",
        mars_house=10,
        saturn_house=2,
        venus_house=2,
        rahu_aspects_ascendant=True,
    )
    base.update(overrides)
    return CelestialSnapshot.from_strings(**base)


def test_past_life_engine_yields_confident_entry():
    data = load_bhrigu_data()
    insights = evaluate_past_life(_snapshot(), data["past_life_engines"])
    assert insights, "Expected at least one past-life narrative"
    assert insights[0].confidence >= insights[-1].confidence


def test_future_directives_match_high_priority_rules():
    data = load_bhrigu_data()
    directives = evaluate_future_directives(_snapshot(), data["future_engines"])
    assert directives, "Future directives should be present for the sample snapshot"
    assert any(d.engine_id == "FU-11" for d in directives)


def test_modern_matchmaking_scores_include_modifiers():
    data = load_bhrigu_data()
    partner = _snapshot(
        birth_date="1992-09-09",
        lunar_tithi=4,
        moon_element="earth",
        mars_house=8,
        venus_house=3,
        rahu_aspects_ascendant=False,
    )
    compatibility = evaluate_matchmaking(
        primary=_snapshot(),
        partner=partner,
        criteria=data["matchmaking_criteria"],
        modern_preferences=["remote-first", "startup-ops"],
    )
    assert compatibility.breakdown, "Each criterion should have a breakdown entry"
    assert compatibility.compatibility_index > 0
    assert compatibility.modern_highlights, "Modern preferences must contribute notes"


def test_interpretations_can_be_composed_from_reports():
    data = load_bhrigu_data()
    snapshot = _snapshot()
    past_report = evaluate_past_life(snapshot, data["past_life_engines"])
    future_report = evaluate_future_directives(snapshot, data["future_engines"])
    assert past_report[0].narrative
    assert future_report[0].focus


def test_interpretations_flow_into_reports():
    from bhriguwelt.horoscope import (
        HoroscopeRequest,
        build_future_report,
        build_past_life_report,
        build_prediction,
    )

    request = HoroscopeRequest(
        name="Test Native",
        birth_date="1990-05-18",
        birth_time="04:30",
        birth_place="Varanasi",
        lunar_tithi=5,
        moon_element="water",
        mars_house=10,
        saturn_house=2,
        venus_house=2,
        rahu_aspects_ascendant=True,
    )

    horoscope_report = build_prediction(request)
    assert horoscope_report.interpretation

    past_report = build_past_life_report(request)
    assert past_report.interpretation

    future_report = build_future_report(request)
    assert future_report.interpretation

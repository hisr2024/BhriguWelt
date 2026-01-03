"""Tests for the dynamic runtime rule generator and personalization layer."""

from datetime import date, time

from bhriguwelt.calculations import CelestialSnapshot
from bhriguwelt.chart_engine import ChartComputationResult, PersonalizationContext
from bhriguwelt.runtime_rule_generator import RuntimeRuleGenerator


def _sample_snapshot() -> CelestialSnapshot:
    return CelestialSnapshot(
        birth_date=date(1990, 1, 1),
        birth_time=time(12, 0),
        birth_place="Delhi",
        tradition="universal",
        lunar_tithi=1,
        moon_element="fire",
        moon_house=2,
        ascendant_house=1,
        mars_house=3,
        saturn_house=4,
        venus_house=5,
        rahu_house=9,
        ketu_house=6,
        mercury_house=7,
        jupiter_house=8,
        rahu_aspects_ascendant=False,
        saturn_retrograde=False,
    )


def test_personalization_and_confidence_weighting():
    chart = ChartComputationResult(
        ephemeris_source="test-ephemeris",
        planet_longitudes={"Sun": 0.0, "Moon": 90.0},
        house_cusps=[0.0] * 12,
        house_assignments={"Sun": 1, "Moon": 2},
        occupant_map={},
    )
    dashas = [{"lord": "Sun"}]
    personalization = PersonalizationContext(
        choices={"career": "build startup"},
        mitigation_flags=["mindfulness"],
        effort_level="high",
        reflection_prompts=["journal daily", "talk to mentor"],
    )

    result = RuntimeRuleGenerator().generate(
        snapshot=_sample_snapshot(),
        chart=chart,
        dashas=dashas,
        personalization=personalization,
    )

    rules = result["rules"]
    assert any(rule["planet"] == "Sun" for rule in rules)
    sun_rule = next(rule for rule in rules if rule["planet"] == "Sun")

    # Base traditional confidence (0.6) should be lifted by dasha + mitigation + effort
    assert sun_rule["confidence"] > 0.65

    narrative = result["narrative"]
    assert "priorities" in narrative
    assert "career" in narrative
    assert "Mitigations noted" in narrative
    assert "Reflect with" in narrative

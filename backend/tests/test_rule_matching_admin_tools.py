from __future__ import annotations

import io
from datetime import date, time

import pytest

from bhriguwelt.admin_cli import lint_dataset
from bhriguwelt.calculations import (
    CelestialSnapshot,
    evaluate_future_directives,
    evaluate_past_life,
    _matches_rule,
)
from bhriguwelt.ml_weighting import apply_reweighting
from bhriguwelt.rule_dsl import compile_to_dataset, parse_dsl
from bhriguwelt.taxonomy import missing_ids_in_dataset


def _snapshot() -> CelestialSnapshot:
    return CelestialSnapshot(
        birth_date=date(1990, 1, 1),
        birth_time=time(4, 30),
        birth_place="Delhi",
        tradition="universal",
        lunar_tithi=5,
        moon_element="water",
        moon_house=2,
        ascendant_house=1,
        mars_house=3,
        saturn_house=6,
        venus_house=5,
        rahu_house=7,
        ketu_house=1,
        mercury_house=8,
        jupiter_house=9,
        rahu_aspects_ascendant=True,
        saturn_retrograde=False,
    )


def test_past_life_matching_triggers_engine():
    snapshot = _snapshot()
    engines = [
        {
            "id": "PL-1",
            "sutra_reference": "folio",
            "description": "past",
            "narrative": "A vivid recollection emerges.",
            "confidence": 0.8,
            "conditions": {
                "lunar_tithi": {"max": 8},
                "moon_element": {"any_of": ["water", "earth"]},
                "rahu_aspects_ascendant": {"equals": True},
            },
        }
    ]

    insights = evaluate_past_life(snapshot, engines)
    assert insights[0].engine_id == "PL-1"
    assert insights[0].confidence > 0


def test_future_matching_triggers_engine():
    snapshot = _snapshot()
    engines = [
        {
            "id": "FU-2",
            "sutra_reference": "folio",
            "description": "future",
            "trajectory": "Start a school.",
            "certainty": 0.75,
            "conditions": {
                "lunar_tithi": {"min": 4, "max": 6},
                "moon_element": {"equals": "water"},
            },
        }
    ]

    directives = evaluate_future_directives(snapshot, engines)
    assert directives[0].engine_id == "FU-2"
    assert directives[0].certainty > 0


def test_missing_optional_field_fails_match_without_crash():
    snapshot = _snapshot()
    engines = [
        {
            "id": "PL-9",
            "sutra_reference": "folio",
            "description": "past",
            "narrative": "No match",
            "confidence": 0.8,
            "conditions": {"imaginary_field": {"equals": 99}},
        }
    ]

    insights = evaluate_past_life(snapshot, engines)
    assert insights[0].engine_id == "PL-DEFAULT"


def test_matches_rule_supports_comparators():
    assert _matches_rule(5, {"min": 1, "max": 6})
    assert _matches_rule("water", {"any_of": ["water", "fire"]})
    assert not _matches_rule(False, {"equals": True})


def test_rule_dsl_compile_creates_dataset():
    dsl_text = """
PL-27:
  when:
    lunar_tithi: { max: 8 }
    moon_element: { any_of: [water] }
    rahu_aspects_ascendant: { equals: true }
  then:
    confidence: 0.88
    narrative: "A watery moon speaks of temple archives."
    sutra_reference: "PL folio 27"
FU-3:
  when:
    lunar_tithi: { min: 3 }
  then:
    certainty: 0.71
    trajectory: "Travel east."
    sutra_reference: "FU folio 3"
"""

    compiled = compile_to_dataset(parse_dsl(dsl_text))
    assert compiled["past_life_engines"][0]["id"] == "PL-27"
    assert compiled["future_engines"][0]["id"] == "FU-3"
    assert compiled["past_life_engines"][0]["conditions"]["moon_element"]["any_of"] == ["water"]


def test_taxonomy_missing_ids_reported():
    dataset = {
        "metadata": {},
        "principles": [],
        "past_life_engines": [{"id": "PL-1"}],
        "future_engines": [{"id": "FU-1"}],
        "remedies": [],
        "transit_rules": [],
        "matchmaking_criteria": [],
    }

    missing = missing_ids_in_dataset(dataset)
    assert len(missing["past_life_engines"]) == 107
    assert len(missing["future_engines"]) == 83


def test_ml_reweighting_respects_bounds(capsys):
    dataset = {
        "metadata": {},
        "principles": [
            {
                "id": "BR-1",
                "weights": {"intuition": 0.5, "service": 0.5},
                "sutra_reference": "ref",
                "description": "desc",
            }
        ],
        "past_life_engines": [],
        "future_engines": [],
        "remedies": [],
        "transit_rules": [],
        "matchmaking_criteria": [],
    }

    buffer = io.StringIO()
    reweighted = apply_reweighting(dataset, logger=lambda msg: buffer.write(msg + "\n"))
    new_weights = reweighted["principles"][0]["weights"]
    for value in new_weights.values():
        assert 0.0 <= value <= 1.0

    log = buffer.getvalue()
    assert "BR-1 weights" in log


def test_admin_lint_detects_missing_taxonomy():
    dataset = {
        "metadata": {},
        "principles": [
            {
                "id": "BR-999",
                "sutra_reference": "ref",
                "description": "desc",
                "weights": {"a": 1.0},
                "integrity": {"checksum": ""},
            }
        ],
        "past_life_engines": [{"id": "PL-1", "sutra_reference": "ref", "description": "d", "narrative": "n"}],
        "future_engines": [{"id": "FU-1", "sutra_reference": "ref", "description": "d", "trajectory": "t"}],
        "remedies": [{"id": "REM-1", "sutra_reference": "ref", "description": "d"}],
        "transit_rules": [{"id": "TR-1", "sutra_reference": "ref", "influence": "i"}],
        "matchmaking_criteria": [
            {"id": "MM-1", "sutra_reference": "ref", "pair_rules": [{"label": "l", "primary_field": "a", "partner_field": "b", "comparator": "eq"}]}
        ],
    }

    with pytest.raises(ValueError):
        lint_dataset(dataset, strict=True)


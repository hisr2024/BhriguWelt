import pytest

from bhriguwelt.horoscope import HoroscopeRequest
from bhriguwelt.matchmaking_engine import run_matchmaking_pipeline


@pytest.fixture
def sample_core_bundle():
    return {
        "principles": [{"id": "p1", "description": "Rule", "sutra_reference": "S1"}],
        "remedies": [{"id": "r1", "description": "Remedy", "sutra_reference": "S2"}],
        "past_life_engines": [
            {
                "id": "pl1",
                "description": "Past life context",
                "narrative": "A clear karmic echo.",
                "sutra_reference": "S3",
            }
        ],
        "future_engines": [
            {
                "id": "f1",
                "description": "Future track",
                "trajectory": "Steady growth",
                "sutra_reference": "S4",
            }
        ],
        "transit_rules": [
            {"id": "t1", "influence": "Transit guidance", "sutra_reference": "S5"}
        ],
        "matchmaking_criteria": [
            {
                "id": "m1",
                "description": "Compat criteria",
                "pair_rules": [
                    {
                        "primary_field": "moon_element",
                        "partner_field": "moon_element",
                        "comparator": "equal",
                        "value": "water",
                        "weight": 1.0,
                    }
                ],
                "sutra_reference": "S6",
            }
        ],
    }


def _request(name: str) -> HoroscopeRequest:
    return HoroscopeRequest(
        name=name,
        birth_date="1990-01-01",
        birth_time="06:15",
        birth_place="Jaipur",
        lunar_tithi=3,
        moon_element="water",
        mars_house=3,
        saturn_house=6,
        venus_house=7,
    )


def test_pipeline_returns_core_outputs(sample_core_bundle):
    result = run_matchmaking_pipeline(
        _request("A"),
        _request("B"),
        modern_preferences=["remote-first"],
        language="en",
        core_bundle=sample_core_bundle,
    )

    assert result["tradition"] == "universal"
    assert result["modern_preferences"] == ["remote-first"]
    assert result["analyses"] and result["analyses"][0]["engine"] == "matchmaking_criteria"
    assert result["interpretations"] and result["interpretations"][0]["validated"] is True
    assert result["report"]["primary_name"] == "A"
    assert result["report"]["partner_name"] == "B"
    assert result["report"]["compatibility"]["compatibility_index"] >= 0
    assert len(result["briefings"]) == 2


def test_pipeline_handles_custom_language(sample_core_bundle):
    result = run_matchmaking_pipeline(
        _request("A"),
        _request("B"),
        modern_preferences=[],
        language="hi",
        core_bundle=sample_core_bundle,
    )

    assert all(briefing["language"] == "hi" for briefing in result["briefings"])
    assert result["interpretations"][0]["precision_score"] == 1.0

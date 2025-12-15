import pytest

from bhriguwelt.api import handle_command
from bhriguwelt.horoscope import HoroscopeRequest
from bhriguwelt.past_future_bridge import build_past_future_synthesis


def _request(**overrides) -> HoroscopeRequest:
    base = dict(
        name="Seeker", 
        birth_date="1991-07-21",
        birth_time="08:10",
        birth_place="Jaipur, Bharat",
        lunar_tithi=6,
        moon_element="water",
        mars_house=11,
        saturn_house=3,
        venus_house=4,
        rahu_aspects_ascendant=True,
        consent_for_date_predictions=True,
    )
    base.update(overrides)
    return HoroscopeRequest(**base)


def test_past_future_bridge_generates_predictions_and_ai_summary():
    synthesis = build_past_future_synthesis(_request(), focus_areas=["career", "relationships"])
    data = synthesis.to_dict()

    assert data["past_life"]["insights"]
    assert data["future"]["trajectories"]
    assert data["core_wisdom"]["sections"]
    assert any(entry.get("engine") == "past-life" for entry in data["predictions"])
    assert any(entry.get("engine", "").startswith("future") for entry in data["predictions"])
    assert "Bhrigu Samhita" in data["ai_summary"] or data["ai_summary"]


def test_past_future_command_handles_payload():
    payload = {
        "name": "Seeker",
        "birth_date": "1991-07-21",
        "birth_time": "08:10",
        "birth_place": "Jaipur, Bharat",
        "lunar_tithi": 6,
        "moon_element": "water",
        "mars_house": 11,
        "saturn_house": 3,
        "venus_house": 4,
        "rahu_aspects_ascendant": True,
        "consent_for_date_predictions": True,
        "focus_areas": ["career"],
    }

    response = handle_command("past-future", payload)

    assert response["seeker"]["name"] == payload["name"]
    assert response["past_life"]["insights"]
    assert response["future"]["trajectories"]
    assert response["ai_support"]["coverage"]
    assert response["ai_support"]["sources"]["past_life_json"] is True
    assert response["ai_support"]["sources"]["future_json"] is True

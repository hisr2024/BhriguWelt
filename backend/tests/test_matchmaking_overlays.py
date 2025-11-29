from __future__ import annotations

from bhriguwelt import api


def _payload():
    return {
        "primary": {
            "name": "Asha",
            "birth_date": "1995-05-18",
            "birth_time": "14:45",
            "birth_place": "Varanasi, Bharat",
            "lunar_tithi": 5,
            "moon_element": "water",
            "mars_house": 10,
            "saturn_house": 2,
            "venus_house": 2,
            "rahu_aspects_ascendant": True,
        },
        "partner": {
            "name": "Rahul",
            "birth_date": "1993-11-04",
            "birth_time": "08:20",
            "birth_place": "Kochi, Bharat",
            "lunar_tithi": 8,
            "moon_element": "earth",
            "mars_house": 6,
            "saturn_house": 11,
            "venus_house": 5,
        },
        "modern_preferences": ["career", "communication"],
    }


def test_matchmaking_returns_synastry_overlays():
    result = api.handle_command("matchmaking", _payload())
    compatibility = result["compatibility"]

    assert compatibility["synastry_overlays"], "Synastry overlays should always be populated"
    assert "overall_overlay" in compatibility["alignment_percentages"]
    assert any(path["theme"] == "Dharma and purpose" for path in compatibility["shared_life_paths"])

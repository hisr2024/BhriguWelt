from __future__ import annotations

from bhriguwelt import api


def _profile(name: str, mars_house: int, venus_house: int, mercury_house: int) -> dict:
    return dict(
        name=name,
        birth_date="1995-05-18",
        birth_time="14:45",
        birth_place="Varanasi, Bharat",
        lunar_tithi=5,
        moon_element="water",
        mars_house=mars_house,
        saturn_house=2,
        venus_house=venus_house,
        rahu_aspects_ascendant=True,
        mercury_house=mercury_house,
        jupiter_house=9,
    )


def test_matchmaking_response_surfaces_synastry():
    payload = {
        "primary": _profile("Asha", 10, 2, 7),
        "partner": _profile("Kiran", 4, 3, 8),
        "modern_preferences": ["remote-first"],
    }

    response = api.handle_command("matchmaking", payload)
    comp = response["compatibility"]

    assert comp["synastry_overlays"], "Synastry overlays should be precomputed for visual pairing"
    assert comp["alignment_percentages"]["communication"] > 0
    assert comp["shared_life_paths"], "Life path narratives should accompany the compatibility score"

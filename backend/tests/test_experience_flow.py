"""Ensure the unified experience flow covers every engine output."""

from bhriguwelt.experience_flow import build_unified_experience_flow
from bhriguwelt.horoscope import HoroscopeRequest


def _request(**overrides) -> HoroscopeRequest:
    base = dict(
        name="Primary Seeker",
        birth_date="1990-05-18",
        birth_time="04:30",
        birth_place="Varanasi",
        lunar_tithi=5,
        moon_element="water",
        mars_house=10,
        saturn_house=2,
        venus_house=2,
        rahu_aspects_ascendant=True,
        consent_for_date_predictions=True,
    )
    base.update(overrides)
    return HoroscopeRequest(**base)


def test_experience_flow_populates_all_engine_reports():
    primary = _request()
    partner = _request(
        name="Partner",
        birth_date="1992-09-09",
        lunar_tithi=4,
        moon_element="earth",
        mars_house=8,
        venus_house=3,
        rahu_aspects_ascendant=False,
    )

    flow = build_unified_experience_flow(
        primary,
        partner_request=partner,
        modern_preferences=["remote-first", "travel"],
        language="en",
    ).to_dict()

    assert flow["horoscope"].get("karmic_epoch")
    assert flow["past_life"].get("insights")
    assert flow["future"].get("trajectories")
    assert len(flow["timeline"].get("phases", [])) >= 5
    assert flow["matchmaking"]["compatibility"]["compatibility_index"] > 0
    assert any(entry.get("engine") == "future_engines" for entry in flow["analyzers"])
    assert flow["language_layer"]["language"] == "en"
    assert flow["language_layer"]["tone"] == "neutral"
    assert flow["language_layer"]["sections"]

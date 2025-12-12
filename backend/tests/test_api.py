"""Regression tests for the lightweight HTTP API helpers."""

from __future__ import annotations

from bhriguwelt import api


def _payload(**overrides):
    base = dict(
        name="Asha",
        birth_date="1995-05-18",
        birth_time="14:45",
        birth_place="Varanasi, Bharat",
        consent_for_date_predictions=True,
        lunar_tithi=5,
        moon_element="water",
        mars_house=10,
        saturn_house=2,
        venus_house=2,
        rahu_aspects_ascendant=True,
    )
    base.update(overrides)
    return base


def test_handle_command_horoscope_emits_full_payload():
    response = api.handle_command("horoscope", _payload())
    assert response["name"] == "Asha"
    assert response["past_life_insights"]
    assert response["future_trajectories"]
    assert response["interpretation"]


def test_handle_command_core_wisdom_structures_sections():
    response = api.handle_command("core-wisdom", {**_payload(), "focus_areas": ["career", "marriage"]})
    assert set(response["sections"].keys()) == set(str(i) for i in range(1, 9))
    assert response["rashi_chart"] and response["bhava_chart"]
    assert response["dashas"]


def test_handle_command_karmic_dashboard_outlines_hotspots():
    response = api.handle_command(
        "karmic-dashboard", {**_payload(), "focus_areas": ["career"], "issues": ["money worry"]}
    )
    assert set(response["sections"].keys()) == set(str(i) for i in range(1, 9))
    assert response["hotspots"], "Hotspots should be populated"
    assert response["gifts"], "Gifts should be populated"
    assert response["assignments"], "Assignments should be populated"


def test_handle_command_matchmaking_summarizes_highlights():
    response = api.handle_command(
        "matchmaking",
        dict(
            primary=_payload(),
            partner=_payload(
                name="Arjun",
                birth_date="1992-09-09",
                lunar_tithi=4,
                moon_element="earth",
                mars_house=8,
                venus_house=3,
                rahu_aspects_ascendant=False,
            ),
            modern_preferences=["remote-first", "arts-collab"],
        ),
    )
    assert response["compatibility"]["breakdown"], "Compatibility breakdown missing"
    assert response["compatibility"]["modern_highlights"], "Modern notes missing"
    assert response["interpretation"], "Interpretation missing for matchmaking"


def test_handle_command_past_life_includes_insights():
    response = api.handle_command("past-life", _payload())
    assert response["insights"], "Past-life response missing insights"
    assert response["interpretation"], "Past-life response missing interpretation"


def test_handle_command_future_includes_trajectories():
    response = api.handle_command("future", _payload())
    assert response["trajectories"], "Future response missing trajectories"
    assert response["interpretation"], "Future response missing interpretation"


def test_handle_command_calendar_returns_saka_payload():
    response = api.handle_command(
        "calendar",
        dict(birth_date="2024-03-21", birth_time="05:30", birth_place="Prayagraj"),
    )
    assert response["saka_date"]["year"] == 1946
    assert response["conversion_factor_years"] == 78


def test_ensure_visualization_payload_pads_missing_charts():
    response = {"rashi_chart": [], "bhava_chart": None, "dashas": []}
    api._ensure_visualization_payload(response)

    assert len(response["rashi_chart"]) == 12
    assert len(response["bhava_chart"]) == 12
    assert response["dashas"], "Dashas should include a placeholder entry"

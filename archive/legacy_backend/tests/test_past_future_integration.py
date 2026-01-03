from bhriguwelt.horoscope import HoroscopeRequest
from bhriguwelt.past_future_bridge import build_past_future_synthesis


def test_past_future_synthesis_uses_expected_engines():
    request = HoroscopeRequest(
        name="Integration Seeker",
        birth_date="1990-05-18",
        birth_time="04:30",
        birth_place="Varanasi",
        tradition="northern",
        consent_for_date_predictions=True,
        lunar_tithi=5,
        moon_element="water",
        mars_house=10,
        rahu_aspects_ascendant=True,
    )

    synthesis = build_past_future_synthesis(request)

    past_ids = {insight.get("engine_id") for insight in synthesis.past_life.get("insights", [])}
    future_ids = {directive.get("engine_id") for directive in synthesis.future.get("trajectories", [])}

    assert synthesis.past_life.get("insights"), "Expected past-life insights to be populated"
    assert synthesis.future.get("trajectories"), "Expected future directives to be populated"
    assert "PL-27" in past_ids
    assert "FU-11" in future_ids

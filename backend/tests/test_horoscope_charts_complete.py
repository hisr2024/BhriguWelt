from __future__ import annotations

from bhriguwelt import api, horoscope


def _payload(**overrides):
    base = dict(
        name="Asha",
        birth_date="1995-05-18",
        birth_time="14:45",
        birth_place="Varanasi, Bharat",
        lunar_tithi=5,
        moon_element="water",
        mars_house=10,
        saturn_house=2,
        venus_house=2,
        rahu_aspects_ascendant=True,
    )
    base.update(overrides)
    return base


def test_horoscope_injects_chart_placeholders(monkeypatch):
    def _empty_kundli(*_args, **_kwargs):
        return {"rashi_chart": [], "bhava_chart": [], "dashas": []}

    monkeypatch.setattr(api, "generate_kundli", _empty_kundli)
    monkeypatch.setattr(horoscope, "generate_kundli", _empty_kundli)
    response = api.handle_command("horoscope", _payload())

    assert len(response["rashi_chart"]) == 12
    assert len(response["bhava_chart"]) == 12
    assert response["dashas"], "Dashas placeholder should always be present"
    placeholder_occupants = [house.get("occupants", []) for house in response["rashi_chart"]]
    assert any("Pending calculation" in " ".join(occupants) for occupants in placeholder_occupants)

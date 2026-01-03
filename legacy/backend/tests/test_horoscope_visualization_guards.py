from __future__ import annotations

import pytest

from bhriguwelt import api


@pytest.fixture()
def minimal_payload():
    return dict(
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


def test_handle_command_guarantees_charts(monkeypatch, minimal_payload):
    def fake_kundli(*_, **__):
        return {"rashi_chart": [], "bhava_chart": [], "dashas": []}

    monkeypatch.setattr(api, "generate_kundli", fake_kundli)
    response = api.handle_command("horoscope", minimal_payload)

    assert len(response["rashi_chart"]) == 12
    assert len(response["bhava_chart"]) == 12
    assert response["dashas"]
    assert response["dashas"][0]["anchor_rule"]

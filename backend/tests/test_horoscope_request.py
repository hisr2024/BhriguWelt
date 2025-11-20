from __future__ import annotations

import pytest

from bhriguwelt.horoscope import HoroscopeRequest


def _base_request(**overrides):
    payload = dict(
        name="Asha",
        birth_date="1995-05-18",
        birth_time="14:45",
        birth_place="Varanasi",
        lunar_tithi=5,
        moon_element="water",
        mars_house=10,
        saturn_house=2,
        venus_house=2,
        rahu_aspects_ascendant=True,
    )
    payload.update(overrides)
    return payload


def test_request_accepts_full_tithi_range_and_ether():
    request = HoroscopeRequest(**_base_request(lunar_tithi=30, moon_element="ether"))
    assert request.lunar_tithi == 30
    assert request.moon_element == "ether"


def test_request_rejects_out_of_range_tithi():
    with pytest.raises(ValueError):
        HoroscopeRequest(**_base_request(lunar_tithi=0))

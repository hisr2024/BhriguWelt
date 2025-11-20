from __future__ import annotations

import pytest

from bhriguwelt import api


def _payload(**overrides):
    base = dict(
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
    base.update(overrides)
    return base


def test_handle_command_rejects_invalid_tithi():
    with pytest.raises(ValueError):
        api.handle_command("horoscope", _payload(lunar_tithi=0))


def test_handle_command_rejects_unsupported_moon_element():
    with pytest.raises(ValueError):
        api.handle_command("future", _payload(moon_element="ice"))

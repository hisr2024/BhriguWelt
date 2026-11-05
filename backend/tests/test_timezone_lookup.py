"""Timezone lookup must return the real zone, not a merged neighbour."""
import pytest

from services.astrology_calculator import AstrologyCalculator


@pytest.mark.parametrize('lat,lon,zone', [
    (52.52, 13.405, 'Europe/Berlin'),
    (39.7684, -86.1581, 'America/Indiana/Indianapolis'),
    (1.3521, 103.8198, 'Asia/Singapore'),
    (28.6139, 77.2090, 'Asia/Kolkata'),
])
def test_timezone_at(lat, lon, zone):
    calc = AstrologyCalculator.__new__(AstrologyCalculator)
    calc.tf = None
    assert calc._timezone_at(lat, lon) == zone

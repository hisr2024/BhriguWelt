"""Birth time formats, place disambiguation, and the Lagna against published charts."""
from datetime import datetime, time
from types import SimpleNamespace

import pytest

pytest.importorskip('swisseph')

from services.astrology_calculator import AstrologyCalculator, parse_birth_time


@pytest.mark.parametrize('text, expected', [
    ('10:30', time(10, 30)), ('10:30:00', time(10, 30)), ('10:30 PM', time(22, 30)),
    ('2:05pm', time(14, 5)), ('12:15 AM', time(0, 15)), ('14.30', time(14, 30)),
])
def test_birth_time_formats(text, expected):
    assert parse_birth_time(text) == expected


def test_bad_time_is_rejected():
    with pytest.raises(ValueError):
        parse_birth_time('half past ten')


@pytest.mark.parametrize('date, tm, lat, lon, lagna', [
    ('1950-09-17', '11:00', 23.785, 72.64, 'Scorpio'),     # Narendra Modi, Vadnagar
    ('1973-04-24', '16:20', 19.076, 72.8777, 'Virgo'),     # Sachin Tendulkar, Mumbai
    ('1942-10-11', '16:00', 25.4358, 81.8463, 'Aquarius'),  # Amitabh Bachchan, Allahabad (war time UTC+6:30)
])
def test_lagna_matches_published_charts(date, tm, lat, lon, lagna):
    chart = AstrologyCalculator().calculate_birth_chart(date, tm, 'India', lat, lon, None)
    assert chart['ascendant']['sign'] == lagna


def test_seconds_in_the_time_give_the_same_chart():
    calc = AstrologyCalculator()
    a = calc.calculate_birth_chart('1990-05-15', '10:30', 'Delhi', 28.6139, 77.209, None)
    b = calc.calculate_birth_chart('1990-05-15', '10:30:00', 'Delhi', 28.6139, 77.209, None)
    assert a['ascendant'] == b['ascendant']


def test_place_search_lists_every_match_with_its_zone_and_offset(monkeypatch):
    calc = AstrologyCalculator()
    hits = [
        SimpleNamespace(address='Aurangabad, Maharashtra, India', latitude=19.8762, longitude=75.3433),
        SimpleNamespace(address='Aurangabad, Maharashtra, India (district)', latitude=19.88, longitude=75.34),
        SimpleNamespace(address='Aurangabad, Bihar, India', latitude=24.7522, longitude=84.3742),
        SimpleNamespace(address='Patan, Gujarat, India', latitude=23.85, longitude=72.12),
        SimpleNamespace(address='Patan, Bagmati, Nepal', latitude=27.67, longitude=85.32),
    ]
    monkeypatch.setattr(calc.geolocator, 'geocode', lambda *a, **k: hits)
    found = calc.search_places('Aurangabad test', when=datetime(1990, 5, 15, 10, 30))
    names = [p['name'] for p in found]
    assert 'Aurangabad, Maharashtra, India (district)' not in names  # same town listed once
    assert {'Aurangabad, Maharashtra, India', 'Aurangabad, Bihar, India', 'Patan, Bagmati, Nepal'} <= set(names)
    nepal = next(p for p in found if 'Nepal' in p['name'])
    india = next(p for p in found if 'Bihar' in p['name'])
    assert nepal['timezone'] == 'Asia/Kathmandu' and nepal['utc_offset'] == 'UTC+5:45'
    assert india['timezone'] == 'Asia/Kolkata' and india['utc_offset'] == 'UTC+5:30'

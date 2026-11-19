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


# Published Vedic (Lahiri) ascendants; times as recorded (AA-rated where available).
PUBLISHED = [
    ('Narendra Modi', '1950-09-17', '11:00', 23.785, 72.64, 'Asia/Kolkata', 'Scorpio'),
    ('Sachin Tendulkar', '1973-04-24', '16:20', 19.076, 72.878, 'Asia/Kolkata', 'Virgo'),
    ('Amitabh Bachchan', '1942-10-11', '16:00', 25.436, 81.846, 'Asia/Kolkata', 'Aquarius'),   # war time UTC+6:30
    ('Indira Gandhi', '1917-11-19', '23:11', 25.436, 81.846, 'Asia/Kolkata', 'Cancer'),
    ('Rajiv Gandhi', '1944-08-20', '07:11', 19.076, 72.878, 'Asia/Kolkata', 'Leo'),
    ('Jawaharlal Nehru', '1889-11-14', '23:30', 25.436, 81.846, 'Asia/Kolkata', 'Cancer'),     # local mean time
    ('Mahatma Gandhi', '1869-10-02', '07:12', 21.642, 69.609, 'Asia/Kolkata', 'Libra'),        # local mean time
    ('Barack Obama', '1961-08-04', '19:24', 21.307, -157.858, 'Pacific/Honolulu', 'Capricorn'),
    ('Princess Diana', '1961-07-01', '19:45', 52.829, 0.514, 'Europe/London', 'Scorpio'),
    ('Queen Elizabeth II', '1926-04-21', '02:40', 51.511, -0.143, 'Europe/London', 'Sagittarius'),
    ('Donald Trump', '1946-06-14', '10:54', 40.702, -73.789, 'America/New_York', 'Leo'),
    ('Steve Jobs', '1955-02-24', '19:15', 37.775, -122.418, 'America/Los_Angeles', 'Leo'),
    ('Albert Einstein', '1879-03-14', '11:30', 48.400, 9.983, 'Europe/Berlin', 'Gemini'),     # local mean time of Ulm
]


@pytest.mark.parametrize('name, date, tm, lat, lon, tz, lagna', PUBLISHED, ids=[p[0] for p in PUBLISHED])
def test_lagna_matches_published_charts(name, date, tm, lat, lon, tz, lagna):
    chart = AstrologyCalculator().calculate_birth_chart(date, tm, name, lat, lon, tz)
    assert chart['ascendant']['sign'] == lagna


def test_births_before_standard_time_use_the_birthplace_clock():
    chart = AstrologyCalculator().calculate_birth_chart('1869-10-02', '07:12', 'Porbandar', 21.642, 69.609, 'Asia/Kolkata')
    assert chart['birth_details']['clock'] == 'local mean time of the birthplace'
    assert chart['birth_details']['utc'].startswith('1869-10-02T02:33')  # 07:12 at 69.6°E = UTC+4:38


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


def test_suggestions_label_town_state_country_and_skip_houses(monkeypatch):
    import requests
    calc = AstrologyCalculator()
    payload = {'features': [
        {'properties': {'name': 'Aurangabad', 'county': 'Aurangabad', 'state': 'Maharashtra', 'country': 'India', 'osm_value': 'city'},
         'geometry': {'coordinates': [75.3433, 19.8762]}},
        {'properties': {'name': 'Aurangabad', 'state': 'Bihar', 'country': 'India', 'osm_value': 'town'},
         'geometry': {'coordinates': [84.3742, 24.7522]}},
        {'properties': {'name': 'Aurangabad House', 'state': 'Delhi', 'country': 'India', 'osm_value': 'house'},
         'geometry': {'coordinates': [77.2, 28.6]}},
    ]}

    class Resp:
        def raise_for_status(self):
            pass

        def json(self):
            return payload

    monkeypatch.setattr(requests, 'get', lambda *a, **k: Resp())
    found = calc.suggest_places('Aurangab', when=datetime(1990, 5, 15, 10, 30))
    assert [p['name'] for p in found] == ['Aurangabad, Maharashtra, India', 'Aurangabad, Bihar, India']
    assert all(p['timezone'] == 'Asia/Kolkata' and p['utc_offset'] == 'UTC+5:30' for p in found)


def test_suggestions_fall_back_to_full_search(monkeypatch):
    import requests
    calc = AstrologyCalculator()

    def down(*a, **k):
        raise requests.ConnectionError('photon down')

    monkeypatch.setattr(requests, 'get', down)
    monkeypatch.setattr(calc.geolocator, 'geocode', lambda *a, **k: [])
    found = calc.suggest_places('Pune')
    assert found and found[0]['timezone'] == 'Asia/Kolkata'  # built-in list answers

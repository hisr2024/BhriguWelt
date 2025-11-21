import datetime

from bhriguwelt.astronomical_calculations import derive_transit_snapshot, normalize_birth_datetime
from bhriguwelt.bhrigu_data import as_dict
from bhriguwelt.calculations import CelestialSnapshot, evaluate_transits
from bhriguwelt.horoscope import HoroscopeRequest, build_transit_report


def test_normalize_birth_datetime_handles_offset():
    dt = normalize_birth_datetime("1899-12-31", "23:00", offset_minutes=330)
    assert dt.tzinfo is not None
    assert dt.year == 1899


def test_snapshot_autofills_with_geocoding_and_timezone():
    snapshot = CelestialSnapshot.from_strings(
        birth_date="1888-01-15",
        birth_time="06:45",
        birth_place="London",
        tradition="universal",
        timezone_name="Europe/London",
    )

    assert 1 <= snapshot.lunar_tithi <= 30
    assert snapshot.moon_element
    assert 1 <= snapshot.mars_house <= 12
    assert isinstance(snapshot.saturn_retrograde, bool)


def test_evaluate_transits_matches_rule():
    data = as_dict()
    rules = data["transit_rules"]
    snapshot = CelestialSnapshot.from_strings(
        birth_date="2000-01-01",
        birth_time="10:00",
        birth_place="Test",
        tradition="universal",
        lunar_tithi=10,
        moon_element="water",
        mars_house=3,
        saturn_house=2,
        venus_house=11,
        rahu_aspects_ascendant=False,
    )
    transit_details = {
        "tithi_delta": 1,
        "saturn_house": 10,
        "ketu_house": 12,
        "moon_element_shift": "water",
        "mercury_house": 3,
        "venus_house": 10,
    }
    directives = evaluate_transits(snapshot, transit_details, rules)
    assert directives
    assert directives[0].reference


def test_build_transit_report_integration():
    request = HoroscopeRequest(
        name="Tester",
        birth_date="2000-01-01",
        birth_time="10:00",
        birth_place="Delhi",
        tradition="universal",
        lunar_tithi=0,
        moon_element="",
        mars_house=0,
        saturn_house=0,
        venus_house=0,
        rahu_aspects_ascendant=False,
    )
    report = build_transit_report(
        request,
        {"transit_date": "2001-01-01", "transit_time": "11:00", "timezone": "Asia/Kolkata"},
    )
    assert report.directives is not None
    assert report.interpretation

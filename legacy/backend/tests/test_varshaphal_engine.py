from bhriguwelt.api import handle_command
from bhriguwelt.horoscope import HoroscopeRequest, build_varshaphal_report


def _request(**overrides) -> HoroscopeRequest:
    base = dict(
        name="Test Native",
        birth_date="1990-05-18",
        birth_time="04:30",
        birth_place="Varanasi, Bharat",
        lunar_tithi=5,
        moon_element="water",
        mars_house=10,
        saturn_house=2,
        venus_house=2,
        rahu_aspects_ascendant=True,
    )
    base.update(overrides)
    return HoroscopeRequest(**base)


def test_varshaphal_sections_and_segments():
    report = build_varshaphal_report(_request(), target_year="2025", main_focus="career")
    assert set(report.sections.keys()) == set(str(i) for i in range(1, 9))
    assert report.year_mantra
    assert len(report.segments) == 4
    assert report.gateways
    assert "not medical" in report.sections["2"].lower()


def test_varshaphal_handle_command_round_trip():
    payload = {
        "name": "Test Native",
        "birth_date": "1990-05-18",
        "birth_time": "04:30",
        "birth_place": "Varanasi, Bharat",
        "lunar_tithi": 5,
        "moon_element": "water",
        "mars_house": 10,
        "saturn_house": 2,
        "venus_house": 2,
        "rahu_aspects_ascendant": True,
        "target_year": "2025",
        "focus_areas": ["career", "relationships"],
    }
    response = handle_command("varshaphal", payload)
    assert response["sections"]["3"].lower().startswith("overall year theme")
    assert response["focus_areas"]["career_finances"]
    assert response["gateways"]

from bhriguwelt.horoscope import HoroscopeRequest, build_prediction


_DEF_BIRTH = dict(
    birth_date="1990-05-18",
    birth_time="04:30",
    birth_place="Varanasi",
    lunar_tithi=5,
    moon_element="water",
    mars_house=10,
    saturn_house=2,
    venus_house=2,
    rahu_aspects_ascendant=True,
    ketu_house=12,
    mercury_house=5,
    jupiter_house=5,
)


def _request(**overrides) -> HoroscopeRequest:
    params = dict(name="Test Native", **_DEF_BIRTH)
    params.update(overrides)
    return HoroscopeRequest(**params)


def test_remedies_reflect_chart_conditions_and_weights():
    report = build_prediction(_request())
    remedy_map = {remedy["id"]: remedy for remedy in report.remedies}

    assert "REM-42" in remedy_map, "Chart-linked remedy should be present"
    assert remedy_map["REM-42"].get("relevance", 0) >= remedy_map["REM-3"].get(
        "relevance", 0
    )
    assert remedy_map["REM-42"].get("matched_targets"), "Personalized targets should be recorded"


def test_remedy_disclaimer_flows_into_interpretation():
    report = build_prediction(_request())
    assert "practitioner" in report.interpretation.lower()

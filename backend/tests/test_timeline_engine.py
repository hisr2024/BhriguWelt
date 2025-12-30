"""Regression tests for the Bhrigu life events timeline engine."""

from bhriguwelt.horoscope import HoroscopeRequest, build_timeline_report


def _request(**overrides) -> HoroscopeRequest:
    base = dict(
        name="Test Native",
        birth_date="1990-05-18",
        birth_time="04:30",
        birth_place="Varanasi",
        lunar_tithi=5,
        moon_element="water",
        mars_house=10,
        saturn_house=2,
        venus_house=2,
        rahu_aspects_ascendant=True,
    )
    base.update(overrides)
    return HoroscopeRequest(**base)


def test_timeline_report_includes_all_phases():
    report = build_timeline_report(_request())
    assert len(report.phases) == 5
    for phase in report.phases:
        assert phase.main_experiences
        assert phase.karmic_lessons
        assert phase.turning_points
        assert phase.practical_guidance


def test_focus_areas_adjust_guidance():
    report = build_timeline_report(_request(), focus_areas=["career", "relationships", "spiritual"])
    merged_guidance = " ".join(" ".join(phase.practical_guidance) for phase in report.phases)
    assert "career" not in merged_guidance  # phrasing avoids literal word
    assert "spiritual" in merged_guidance.lower()
    assert any("dharma" in lesson for phase in report.phases for lesson in phase.karmic_lessons)

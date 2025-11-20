from __future__ import annotations

from bhriguwelt.calendar_conversion import convert_birth_details


def test_convert_birth_details_handles_leap_year_chaitra():
    context = convert_birth_details("2024-03-21", "05:30", "Prayagraj")
    assert context.saka_date.year == 1946
    assert context.saka_date.month == "Chaitra"
    assert context.saka_date.day == 1
    assert context.conversion_factor_years == 78
    assert context.sources, "Authentic sources must be embedded"


def test_convert_birth_details_before_chaitra_uses_previous_year():
    context = convert_birth_details("2024-03-20", "05:30", "Prayagraj")
    assert context.saka_date.year == 1945
    assert context.saka_date.month == "Phalguna"
    assert context.saka_date.day == 30
    assert context.conversion_factor_years == 79

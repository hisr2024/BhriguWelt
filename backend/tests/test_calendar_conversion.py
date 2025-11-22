from __future__ import annotations

import sys
import types
from datetime import date, time

import pytest

sklearn_stub = types.SimpleNamespace(linear_model=types.SimpleNamespace(LogisticRegression=object))
sys.modules.setdefault("sklearn", sklearn_stub)
sys.modules.setdefault("sklearn.linear_model", sklearn_stub.linear_model)

from bhriguwelt import calendar_conversion
from bhriguwelt.calendar_conversion import convert_birth_details


def test_convert_birth_details_handles_leap_year_chaitra():
    context = convert_birth_details("2024-03-21", "05:30", "Prayagraj")
    assert context.saka_date.year == 1946
    assert context.saka_date.month == "Chaitra"
    assert context.saka_date.day == 1
    assert context.conversion_factor_years == 78
    assert context.sources, "Authentic sources must be embedded"
    assert context.weekday
    assert 1 <= context.tithi_number <= 30


def test_convert_birth_details_before_chaitra_uses_previous_year():
    context = convert_birth_details("2024-03-20", "05:30", "Prayagraj")
    assert context.saka_date.year == 1945
    assert context.saka_date.month == "Phalguna"
    assert context.saka_date.day == 30
    assert context.conversion_factor_years == 79


def test_convert_birth_details_exposes_full_panchang(monkeypatch):
    monkeypatch.setattr("bhriguwelt.calendar_conversion.has_swisseph", lambda: False)
    context = convert_birth_details("2023-10-02", "06:00", "Delhi")

    assert context.nakshatra_index >= 1
    assert context.yoga_index >= 1
    assert context.karana_index >= 1
    assert context.tithi_number >= 1
    assert context.weekday in {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"}
    payload = context.as_payload()
    assert payload["nakshatra_index"] == context.nakshatra_index
    assert payload["karana"] == context.karana


def test_fallback_panchang_matches_surya_siddhanta_means():
    dt = calendar_conversion._ist_datetime(date(2024, 4, 9), time(15, 45))

    panchang = calendar_conversion._fallback_panchang(dt)

    assert panchang["tithi_number"] == 1
    assert panchang["nakshatra"] == "Ashwini"
    assert panchang["yoga"] == "Vaidhriti"
    assert panchang["karana"] == "Bava"
    assert panchang["ayanamsa"] == pytest.approx(23.859, rel=0, abs=0.001)


def test_swisseph_branch_uses_precise_values(monkeypatch):
    monkeypatch.setattr(calendar_conversion, "has_swisseph", lambda: True)
    monkeypatch.setattr(
        calendar_conversion,
        "_swisseph_panchang",
        lambda dt: {
            "tithi_number": 3,
            "tithi_name": "Shukla Tritiya",
            "nakshatra_index": 5,
            "nakshatra": "Mrigashirsha",
            "yoga_index": 2,
            "yoga": "Preeti",
            "karana_index": 4,
            "karana": "Kaulava",
        },
    )

    dt = calendar_conversion._ist_datetime(date(2024, 12, 1), time(7, 15))
    panchang = calendar_conversion._derive_panchang(dt.date(), time(7, 15))

    assert panchang["weekday"] == "Sunday"
    assert panchang["tithi_name"] == "Shukla Tritiya"
    assert panchang["karana_index"] == 4


def test_ist_datetime_attaches_timezone():
    dt = calendar_conversion._ist_datetime(date(2023, 7, 15), time(23, 0))

    assert dt.tzinfo is not None
    assert dt.tzinfo.key == "Asia/Kolkata"


@pytest.mark.parametrize(
    "year, expected",
    [
        (2024, True),
        (2023, False),
        (1900, False),
        (2000, True),
    ],
)
def test_is_gregorian_leap(year, expected):
    assert calendar_conversion._is_gregorian_leap(year) is expected


def test_saka_month_lengths_for_leap_and_common_years():
    assert calendar_conversion._saka_month_lengths(leap_year=True)[0] == 31
    assert calendar_conversion._saka_month_lengths(leap_year=False)[0] == 30
    assert sum(calendar_conversion._saka_month_lengths(True)) == 366
    assert sum(calendar_conversion._saka_month_lengths(False)) == 365


def test_tithi_and_karana_labels_cover_cycles():
    assert calendar_conversion._tithi_label(1) == "Shukla Pratipada"
    assert calendar_conversion._tithi_label(16) == "Krishna Pratipada"
    assert calendar_conversion._karana_name(999) == calendar_conversion._KARANA_SEQUENCE[-1]


def test_gregorian_to_saka_handles_leap_year_boundary():
    saka_date = calendar_conversion._gregorian_to_saka(date(2024, 3, 21))

    assert saka_date.year == 1946
    assert saka_date.month == "Chaitra"
    assert saka_date.day == 1


def test_panchang_benchmarks_capture_external_alignments():
    benchmarks = calendar_conversion._benchmark_panchang()

    assert benchmarks, "Benchmark snapshots should be produced"
    for entry in benchmarks:
        dt = entry["datetime"]
        derived = calendar_conversion._fallback_panchang(dt)
        assert derived["tithi_number"] == entry["expected"]["tithi_number"]
        assert derived["nakshatra"] == entry["expected"]["nakshatra"]

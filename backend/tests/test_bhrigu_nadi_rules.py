"""Golden + invariant tests for the corrected ephemeris and the Bhrigu/Nadi rules.

Reference chart: 15 May 1990, 10:30 IST, Delhi (28.6139 N, 77.2090 E).
Expected values were cross-checked against Swiss Ephemeris directly.
"""
from datetime import datetime, timedelta, timezone

import pytest

E = pytest.importorskip("services.ephemeris_core")
if not E.SWISSEPH_AVAILABLE:  # pragma: no cover
    pytest.skip("pyswisseph not installed", allow_module_level=True)

from services.bhrigu_nadi_rules import evaluate_rules  # noqa: E402
from services.wisdom_core_pipeline import build_chart_facts  # noqa: E402

BIRTH_UTC = datetime(1990, 5, 15, 5, 0, tzinfo=timezone.utc)  # 10:30 IST
LAT, LON = 28.6139, 77.2090
NOW = datetime(2026, 11, 3, tzinfo=timezone.utc)


@pytest.fixture(scope="module")
def chart():
    return E.build_chart(BIRTH_UTC, LAT, LON)


@pytest.fixture(scope="module")
def birth_data(chart):
    return {
        "date_of_birth": "1990-05-15", "time_of_birth": "10:30", "latitude": LAT, "longitude": LON,
        "gender": "male", "birth_details": {"utc": BIRTH_UTC.isoformat(), "timezone": "Asia/Kolkata"},
        "moon_sign": chart["planets"]["Moon"]["sign"], "zodiac_sign": chart["planets"]["Sun"]["sign"],
        **chart,
    }


def test_lagna_and_nodes_are_correct(chart):
    assert chart["ascendant"]["sign"] == "Cancer"
    assert chart["ascendant"]["degree_in_sign"] == pytest.approx(9.88, abs=0.05)
    assert chart["planets"]["Rahu"]["sign"] == "Capricorn"
    assert chart["planets"]["Rahu"]["degree_in_sign"] == pytest.approx(17.63, abs=0.05)
    assert chart["planets"]["Ketu"]["house"] == 1
    assert chart["planets"]["Saturn"]["retrograde"] is True
    assert chart["planets"]["Mercury"]["retrograde"] is True


def test_vimshottari_invariants(chart):
    periods = E.vimshottari(BIRTH_UTC, chart["planets"]["Moon"]["longitude"])
    mahas = E.maha_periods(periods)
    assert len(mahas) == 9
    total_years = (mahas[-1].end - mahas[0].start).days / E.YEAR_DAYS
    assert total_years == pytest.approx(120, abs=0.01)
    for a, b in zip(periods, periods[1:]):  # antardashas tile with no gaps
        assert abs((b.start - a.end).total_seconds()) < 1
    maha, antar = E.current_dasha(periods, NOW)
    assert (maha.maha, antar.antar) == ("Rahu", "Sun")
    assert antar.start.date().isoformat() == "2026-06-28"
    assert maha.end.date().isoformat() == "2029-12-09"


def test_bhrigu_bindu_and_transit(chart):
    bb = E.bhrigu_bindu(chart["planets"]["Moon"]["longitude"], chart["planets"]["Rahu"]["longitude"])
    assert E.fmt_dms(bb) == "8°44′ Cancer"
    wins = E.conjunction_windows("Saturn", bb, NOW, NOW + timedelta(days=10 * 365))
    assert wins and wins[0][0].year == 2034


def test_rules_are_chart_specific_and_dated(birth_data):
    findings = evaluate_rules(build_chart_facts(birth_data), birth_data, "relationships", now=NOW)
    ids = {f["id"] for f in findings}
    assert {"F-DASHA-01", "F-LAGNA-01", "F-DASHA-03", "F-BHAVAT-01"} <= ids
    text = " ".join(f["finding"] for f in findings)
    assert "Cancer" in text and "Capricorn" in text
    # No invented constants
    for banned in ("incarnations", "%", "folio"):
        assert banned not in text
    dated = [f for f in findings if f.get("timing")]
    assert len(dated) >= 3
    assert all(f["provenance"] in ("classical", "tradition-attributed", "modern") for f in findings)


def test_sensitivity_flags_moon_near_sign_end(birth_data):
    findings = evaluate_rules(build_chart_facts(birth_data), birth_data, "life_events", now=NOW, limit=40)
    sens = next(f for f in findings if f["id"] == "F-SENS-01")
    assert "Moon sign becomes Capricorn" in sens["finding"]


def test_rules_degrade_without_birth_time():
    facts = {"lagna": "Leo", "planets": {"Moon": {"sign": "Leo", "longitude": 130.0}}}
    findings = evaluate_rules(facts, {"planets": {"Moon": {"longitude": 130.0}}}, "karmic_journey", now=NOW)
    assert all(f["id"] not in ("F-DASHA-01", "F-BCP-01") for f in findings)

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


def test_sade_sati_not_reported_running_after_it_ended():
    from services.bhrigu_nadi_rules import Chart, rule_transits
    facts = {"lagna": "Aries", "planets": {}}
    # Moon in Capricorn; Saturn left Aquarius (setting phase) on 29 Mar 2025.
    bd = {"planets": {"Moon": {"longitude": 280.0}, "Sun": {"longitude": 10.0}},
          "ascendant": {"degree": 5.0}}
    out = rule_transits(Chart(facts, bd), datetime(2025, 5, 1, tzinfo=timezone.utc))
    sade = [f for f in out if f["id"] == "F-SADESATI-01"]
    assert not sade or "running now" not in sade[0]["finding"]


def test_inexact_lagna_degree_is_not_presented_as_exact():
    facts = {"lagna": "Aries", "planets": {"Moon": {"sign": "Leo", "longitude": 130.0}}}
    bd = {"planets": {"Moon": {"longitude": 130.0}}, "ascendant": "Aries"}
    findings = evaluate_rules(facts, bd, "karmic_journey", now=NOW, limit=40)
    lagna = next(f for f in findings if f["id"] == "F-LAGNA-01")
    assert "°" not in lagna["finding"].split(";")[0]
    assert not any("Lagna degree" in f["finding"] for f in findings)


# --- Precision inputs and additional classical rules -------------------------

from services.bhrigu_nadi_rules import navamsa_sign, aspects_from, compose_windows  # noqa: E402


def test_navamsa_sign_mapping():
    # Fire signs start D9 from Aries, earth from Capricorn, air from Libra, water from Cancer.
    assert navamsa_sign(0.5) == 0          # Aries 0°30' -> Aries
    assert navamsa_sign(30.5) == 9         # Taurus 0°30' -> Capricorn
    assert navamsa_sign(60.5) == 6         # Gemini 0°30' -> Libra
    assert navamsa_sign(90.5) == 3         # Cancer 0°30' -> Cancer
    assert navamsa_sign(29.9) == 8         # Aries 29°54' -> Sagittarius


def test_graha_drishti():
    assert aspects_from('Saturn', 0, 2) and aspects_from('Saturn', 0, 9)   # 3rd, 10th
    assert aspects_from('Jupiter', 0, 4) and aspects_from('Jupiter', 0, 8)  # 5th, 9th
    assert aspects_from('Mars', 0, 3) and aspects_from('Mars', 0, 7)        # 4th, 8th
    assert aspects_from('Venus', 0, 6) and not aspects_from('Venus', 0, 4)
    assert not aspects_from('Rahu', 0, 4)                                   # nodes: 7th only


def test_new_rules_fire_on_reference_chart(birth_data):
    findings = evaluate_rules(build_chart_facts(birth_data), birth_data, "karmic_journey", now=NOW, limit=80)
    ids = {f["id"] for f in findings}
    assert {"F-KARAKAMSHA-01", "F-D9-01", "F-GOCHARA-02", "F-NODES-02", "F-STAR-01", "F-LESSON-01"} <= ids
    for win in (f for f in findings if f["id"] == "F-WINDOW-01"):
        assert win["start"] and "F-DASHA-03" in win["finding"]


def test_unknown_birth_time_uses_chandra_lagna(birth_data):
    bd = {**birth_data, "birth_time_accuracy": "unknown"}
    findings = evaluate_rules(build_chart_facts(bd), bd, "relationships", now=NOW, limit=80)
    lagna = next(f for f in findings if f["id"] == "F-LAGNA-01")
    assert "Chandra Lagna, Sagittarius" in lagna["finding"]
    assert not any(f["id"] == "F-D9-02" for f in findings)
    sens = next(f for f in findings if f["id"] == "F-SENS-01")
    assert "Birth time unknown" in sens["finding"]


def test_approximate_birth_time_downweights_house_rules(birth_data):
    exact = {f["id"] + f["finding"][:30]: f["weight"] for f in
             evaluate_rules(build_chart_facts(birth_data), {**birth_data, "birth_time_accuracy": "exact"}, "relationships", now=NOW, limit=80)}
    approx = evaluate_rules(build_chart_facts(birth_data), {**birth_data, "birth_time_accuracy": "within_hour"}, "relationships", now=NOW, limit=80)
    bhavat = next(f for f in approx if f["id"] == "F-BHAVAT-01")
    assert "house may shift" in bhavat["finding"]
    assert bhavat["weight"] < 0.7


def test_gender_controls_jiva_karaka(birth_data):
    def ids(g):
        bd = {**birth_data, "gender": g}
        return {f["principle"] for f in evaluate_rules(build_chart_facts(bd), bd, "relationships", now=NOW, limit=80)}
    assert any("Jupiter as jiva" in p for p in ids("male"))
    assert any("Venus as jiva" in p for p in ids("female"))
    assert not any("as jiva" in p for p in ids("other"))


def test_window_composer_uses_true_overlap_and_same_domain():
    f = lambda i, a, b, dom=None, w=0.7: {"id": i, "start": a, "end": b, "weight": w, "domain": dom}
    out = compose_windows([
        f("F-DASHA-03", "2027-01-01", "2027-12-31", "career"),
        f("F-TRANSIT-02", "2027-03-01", "2027-06-01", "career"),
        f("F-TRANSIT-02", "2027-02-01", "2027-04-01", "marriage"),   # other domain: must not combine
        f("F-TRANSIT-01", "2030-01-01", "2030-02-01"),               # no dasha support
    ], ["all"])
    assert len(out) == 1
    text = out[0]["finding"]
    assert "career / public role: Mar 2027–Jun 2027 (F-DASHA-03 + F-TRANSIT-02)" in text
    assert "2030" not in text
    assert compose_windows([f("F-TRANSIT-01", "2027-01-01", "2027-03-01"),
                            f("F-BB-01", "2027-01-15", "2027-02-20")], ["all"]) == []


def test_request_sanitizer_drops_unknown_values():
    from routes.bhrigu_predictions_routes import _sanitize_question_field
    data = {"gender": "Female ", "birth_time_accuracy": "sometime"}
    _sanitize_question_field(data)
    assert data == {"gender": "female"}
    legacy = {"gender": "M", "birth_time_accuracy": "UNKNOWN"}
    _sanitize_question_field(legacy)
    assert legacy == {"gender": "male", "birth_time_accuracy": "unknown"}


def test_cache_hash_distinguishes_precision_inputs():
    from models import BhriguPredictionCache as C
    base = {"date_of_birth": "1990-05-15", "time_of_birth": "10:30", "latitude": 1, "longitude": 2}
    h = lambda **k: C.create_hash({**base, **k}, "relationships")
    assert h() == h(gender="other") == h(birth_time_accuracy="exact")
    assert len({h(), h(gender="male"), h(gender="female"), h(birth_time_accuracy="unknown")}) == 4


def test_unknown_time_prompt_and_rules_share_one_house_system(birth_data):
    from services.wisdom_core_pipeline import format_chart_context
    bd = {**birth_data, "birth_time_accuracy": "unknown"}
    facts = build_chart_facts(bd)
    ctx = format_chart_context(facts)
    assert "no Ascendant is used" in ctx and "Lagna (Ascendant)" not in ctx
    assert facts["planets"]["Venus"]["house"] == 4  # Pisces from Sagittarius Moon
    venus = next(f for f in evaluate_rules(facts, bd, "relationships", now=NOW, limit=80)
                 if f["id"] == "F-DIGNITY-01" and "Venus" in f["finding"])
    assert "4th house" in venus["finding"]


def test_unknown_time_flags_moon_sign_change():
    u = datetime(1985, 1, 3, 6, 0, tzinfo=timezone.utc)
    ch = E.build_chart(u, 28.6, 77.2)
    bd = {"birth_details": {"utc": u.isoformat()}, "birth_time_accuracy": "unknown",
          "latitude": 28.6, "longitude": 77.2, "moon_sign": ch["planets"]["Moon"]["sign"], **ch}
    sens = next(f for f in evaluate_rules(build_chart_facts(bd), bd, "karmic_journey", now=NOW, limit=80)
                if f["id"] == "F-SENS-01")
    assert "changes sign" in sens["finding"]


def test_approximate_time_hides_lagna_degree(birth_data):
    bd = {**birth_data, "birth_time_accuracy": "within_hour"}
    findings = evaluate_rules(build_chart_facts(bd), bd, "karmic_journey", now=NOW, limit=80)
    lagna = next(f for f in findings if f["id"] == "F-LAGNA-01")
    assert lagna["finding"].startswith("Lagna Cancer;")
    assert not any("Lagna degree" in f["finding"] for f in findings)

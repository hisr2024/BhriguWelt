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


# --- Ashtakavarga, vedha, karaka scheme, quota identity ----------------------

from services.bhrigu_nadi_rules import (  # noqa: E402
    ASHTAKAVARGA, bhinnashtakavarga, sarvashtakavarga, vedha_obstructers,
)


def test_ashtakavarga_tables_match_bphs_totals():
    totals = {p: sum(len(r) for r in rows) for p, rows in ASHTAKAVARGA.items()}
    assert totals == {'Sun': 48, 'Moon': 49, 'Mars': 39, 'Mercury': 54, 'Jupiter': 56, 'Venus': 52, 'Saturn': 39}
    # BPHS ch. 66 rows where some software follows a variant reading
    assert ASHTAKAVARGA['Moon'][1] == [1, 3, 6, 7, 10, 11]
    assert ASHTAKAVARGA['Moon'][4] == [1, 4, 7, 8, 10, 11, 12]
    assert ASHTAKAVARGA['Venus'][2] == [3, 5, 6, 9, 11, 12]


def test_sarvashtakavarga_sums_to_337_for_any_chart():
    import random
    rnd = random.Random(7)
    for _ in range(20):
        signs = {p: rnd.randrange(12) for p in ASHTAKAVARGA}
        bav = bhinnashtakavarga(signs, rnd.randrange(12))
        assert sum(sarvashtakavarga(bav)) == 337
        assert all(0 <= v <= 8 for row in bav.values() for v in row)


def test_bhinnashtakavarga_single_contributor_placement():
    # Everything in Aries (0) incl. Lagna: Sun's BAV gets a bindu in sign h-1
    # for every house h listed in each row → Aries gets one from every row with 1.
    bav = bhinnashtakavarga({p: 0 for p in ASHTAKAVARGA}, 0)
    rows_with_1 = sum(1 in r for r in ASHTAKAVARGA['Sun'])
    assert bav['Sun'][0] == rows_with_1


def test_vedha_obstruction_and_exemptions():
    moon = 0  # Moon in Aries
    # Jupiter in 5th (Leo) is good; vedha house 4th (Cancer)
    good, blockers = vedha_obstructers('Jupiter', moon, {'Jupiter': 4, 'Mars': 3})
    assert good and blockers == ['Mars']
    # Saturn in 3rd (Gemini) good; vedha 12th (Pisces); Sun there does NOT obstruct
    good, blockers = vedha_obstructers('Saturn', moon, {'Saturn': 2, 'Sun': 11})
    assert good and blockers == []
    # Moon in 3rd good; vedha 9th; Mercury exempt, Venus obstructs
    good, blockers = vedha_obstructers('Moon', moon, {'Moon': 2, 'Mercury': 8, 'Venus': 8})
    assert blockers == ['Venus']
    # unfavourable house → no vedha evaluation
    assert vedha_obstructers('Jupiter', moon, {'Jupiter': 0}) == (False, [])
    # nodes never obstruct
    assert vedha_obstructers('Jupiter', moon, {'Jupiter': 4, 'Rahu': 3})[1] == []


def test_ashtakavarga_rule_on_reference_chart(birth_data):
    findings = evaluate_rules(build_chart_facts(birth_data), birth_data, "present_life", now=NOW, limit=80)
    av1 = next(f for f in findings if f["id"] == "F-AV-01")
    assert "SAV" in av1["finding"] and "10th" in av1["finding"]
    av2 = next(f for f in findings if f["id"] == "F-AV-02")
    assert "of 8 bindus" in av2["finding"]


def test_eight_karaka_scheme_option(birth_data, monkeypatch):
    monkeypatch.setenv("BHRIGU_KARAKA_SCHEME", "8")
    findings = evaluate_rules(build_chart_facts(birth_data), birth_data, "karmic_journey", now=NOW, limit=80)
    k = next(f for f in findings if f["id"] == "F-KARAKA-01")
    assert "8-karaka" in k["principle"]


def test_client_id_header_sets_quota_identity():
    from flask import Flask
    from routes.bhrigu_predictions_routes import _sanitize_question_field
    app = Flask(__name__)
    with app.test_request_context(headers={"X-Client-Id": "abcd1234-ef56"}):
        data = {"client_id": "spoofed"}
        _sanitize_question_field(data)
        assert data["client_id"].split("@")[0] == "client:abcd1234-ef56"
    with app.test_request_context(headers={"X-Client-Id": "bad id; drop"}):
        data = {}
        _sanitize_question_field(data)
        assert not data.get("client_id", "").startswith("client:")


def test_quota_settles_on_reserved_key(monkeypatch):
    from services import ai_quota
    calls = []

    class FakeRedis:
        def incrby(self, key, n): calls.append((key, n))
        def expire(self, *a): pass
        def get(self, key): return 0
    monkeypatch.setattr(ai_quota, "_get_redis_client", lambda: FakeRedis())
    assert ai_quota.update_usage_after_call("u1", -50, quota_key="ai_usage:u1:2026-11-03")
    assert calls == [("ai_usage:u1:2026-11-03", -50)]


def test_layered_quota_blocks_rotating_device_ids(monkeypatch):
    from services import ai_quota
    monkeypatch.setattr(ai_quota, "_get_redis_client", lambda: None)
    ai_quota._memory_quota_store.clear()
    monkeypatch.setenv("USER_DAILY_TOKEN_LIMIT", "1000")
    monkeypatch.setenv("ANON_IP_DAILY_TOKEN_LIMIT", "1500")
    ai_quota.reserve_for_identities("client:aaaaaaaa@ip:9.9.9.9", 900)
    with pytest.raises(ai_quota.QuotaExceededError):
        # a fresh device id from the same network hits the network ceiling
        ai_quota.reserve_for_identities("client:bbbbbbbb@ip:9.9.9.9", 900)
    # the failed attempt rolled back its device reservation
    assert ai_quota._memory_quota_store[ai_quota._get_quota_key("client:bbbbbbbb")] == 0


def test_identities_are_masked_in_logs():
    from services.ai_quota import mask_identity
    masked = mask_identity("client:abcd1234-ef56@ip:1.2.3.4")
    assert "abcd1234" not in masked and "1.2.3.4" not in masked
    assert masked.startswith("client:") and "@ip:" in masked


def test_comprehensive_route_ignores_body_client_id():
    from flask import Flask
    from routes.bhrigu_predictions_routes import _sanitize_question_field
    app = Flask(__name__)
    with app.test_request_context(headers={"X-Client-Id": "abcd1234-real"}, environ_base={"REMOTE_ADDR": "5.6.7.8"}):
        data = {"client_id": "victim-or-random"}
        _sanitize_question_field(data)
        assert data["client_id"] == "client:abcd1234-real@ip:5.6.7.8"


# --- Shodhana, kakshya, fast transits ----------------------------------------

from services.bhrigu_nadi_rules import (  # noqa: E402
    trikona_shodhana, ekadhipatya_shodhana, kakshya_of, prastara,
)


def test_trikona_shodhana_rules():
    row = [0] * 12
    row[0], row[4], row[8] = 5, 3, 4        # fire: subtract min 3
    row[1], row[5], row[9] = 2, 2, 2        # earth: all equal -> 0
    row[2], row[6], row[10] = 0, 6, 1       # air: a zero -> unchanged
    row[3], row[7], row[11] = 7, 1, 1       # water: subtract 1
    out = trikona_shodhana(row)
    assert out[0:12] == [2, 0, 0, 6, 0, 0, 6, 0, 1, 0, 1, 0]


def test_ekadhipatya_shodhana_rules():
    row = [3, 4, 2, 5, 5, 2, 4, 5, 6, 0, 3, 2]
    # Mars pair Aries(0)/Scorpio(7): both empty, unequal -> both min (3)
    # Venus pair Taurus(1)/Libra(6): both empty, equal -> both 0
    # Mercury pair Gemini(2)/Virgo(5): Gemini occupied, Virgo empty equal -> Virgo = Gemini value
    # Jupiter pair Sag(8)/Pisces(11): Sag occupied, Pisces lower -> Pisces 0
    # Saturn pair Cap(9)/Aq(10): Cap is 0 -> unchanged
    out = ekadhipatya_shodhana(row, occupied={2, 8})
    assert out[0] == out[7] == 3
    assert out[1] == out[6] == 0
    assert out[2] == 2 and out[5] == 2
    assert out[8] == 6 and out[11] == 0
    assert out[9] == 0 and out[10] == 3


def test_kakshya_lords_and_prastara():
    assert kakshya_of(0.0) == (0, 'Saturn')
    assert kakshya_of(3.75) == (1, 'Jupiter')
    assert kakshya_of(29.99) == (7, 'Lagna')
    givers = prastara('Sun', {p: 0 for p in ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']}, 0)
    assert sum(len(g) for g in givers) == 48


def test_fast_transits_and_shodhana_on_reference_chart(birth_data):
    findings = evaluate_rules(build_chart_facts(birth_data), birth_data, "predictions", now=NOW, limit=80)
    ids = {f["id"] for f in findings}
    assert {"F-AV-03", "F-AV-04", "F-GOCHARA-04"} <= ids
    fast = next(f for f in findings if f["id"] == "F-GOCHARA-04")
    for planet in ("Sun", "Mars", "Mercury", "Venus", "Rahu"):
        assert planet in fast["finding"]


def test_fast_transit_output_details(birth_data):
    from services.bhrigu_nadi_rules import _dspan
    findings = evaluate_rules(build_chart_facts(birth_data), birth_data, "predictions", now=NOW, limit=80)
    fast = next(f for f in findings if f["id"] == "F-GOCHARA-04")
    # a stay in progress at day 60 shows its real exit, not the horizon
    assert "2 Jan 2027" not in fast["finding"]
    # obstructed favourable stays always show the day count
    assert "mostly obstructed by vedha (" in fast["finding"] or "days obstructed" in fast["finding"] or "favourable" in fast["finding"]
    assert _dspan(datetime(2027, 1, 3), datetime(2027, 1, 16), 2026) == "3–16 Jan 2027"
    assert _dspan(datetime(2026, 11, 3), datetime(2026, 11, 16), 2026) == "3–16 Nov"
    assert _dspan(datetime(2026, 12, 28), datetime(2027, 1, 9), 2026) == "28 Dec–9 Jan 2027"


def test_heavy_timing_rules_skipped_for_other_categories(birth_data):
    findings = evaluate_rules(build_chart_facts(birth_data), birth_data, "karmic_journey", now=NOW, limit=80)
    ids = {f["id"] for f in findings}
    assert "F-GOCHARA-04" not in ids and "F-AV-04" not in ids

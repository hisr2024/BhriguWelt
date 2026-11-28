"""Deeper classical principles: each checked against a hand-worked case from its definition."""
from datetime import datetime, timedelta, timezone

import pytest

E = pytest.importorskip("services.ephemeris_core")
if not E.SWISSEPH_AVAILABLE:  # pragma: no cover
    pytest.skip("pyswisseph not installed", allow_module_level=True)

from services import classical_more as K  # noqa: E402
from services.bhrigu_nadi_rules import Chart, evaluate_rules  # noqa: E402

NOW = datetime(2026, 11, 28, 8, 0, tzinfo=timezone.utc)
BIRTH = datetime(1990, 5, 15, 5, 0, tzinfo=timezone.utc)


def dms(sign, deg, minutes=0.0):
    return sign * 30 + deg + minutes / 60.0


def make(lons, asc_sign=0, asc_deg=15.0, gender='male', birth=BIRTH, accuracy=''):
    planets = {p: {'longitude': lon, 'speed': 1.0} for p, lon in lons.items()}
    bd = {'planets': planets, 'ascendant': {'sign': E.SIGNS[asc_sign], 'degree': asc_sign * 30 + asc_deg},
          'gender': gender, 'birth_details': {'utc': birth.isoformat()}, 'birth_time_accuracy': accuracy}
    return Chart({}, bd)


BASE = {'Sun': dms(1, 0, 40), 'Moon': dms(8, 29, 51), 'Mars': dms(10, 24), 'Mercury': dms(0, 12), 'Jupiter': dms(2, 15),
        'Venus': dms(11, 18), 'Saturn': dms(9, 1), 'Rahu': dms(9, 17), 'Ketu': dms(3, 17)}


def test_baladi_runs_forward_in_odd_signs_and_backward_in_even_signs():
    assert [K.baladi(dms(0, d))[0] for d in (3, 9, 15, 21, 27)] == ['infant', 'youth', 'adult', 'old', 'spent']
    assert [K.baladi(dms(1, d))[0] for d in (3, 9, 15, 21, 27)] == ['spent', 'old', 'adult', 'youth', 'infant']


def test_alertness_and_dignity_follow_the_friendship_table():
    assert K.jagradadi('Venus', 11) == 'awake'       # exalted in Pisces
    assert K.jagradadi('Sun', 1) == 'asleep'         # Taurus belongs to Venus, the Sun's enemy
    assert K.jagradadi('Mars', 10) == 'dreaming'     # Saturn is neutral to Mars
    assert K.dignity('Saturn', 0) == 'debilitated' and K.dignity('Jupiter', 8) == 'own sign'


def test_directional_strength_is_reported_from_the_house():
    text = K.rule_planet_state(make(BASE, asc_sign=3))[0]['finding']
    assert 'Saturn spent (almost none of its results), awake, has directional strength' in text   # Saturn in the 7th
    assert 'directional' not in K.rule_planet_state(make(BASE, accuracy='unknown'))[0]['finding']


@pytest.mark.parametrize('mars_sign, expected', [
    (4, 8),   # lord in the 5th: pada is the 9th (Sagittarius)
    (0, 9),   # lord in the house itself: the 10th from it (Capricorn)
    (3, 3),   # lord in the 4th: the 4th itself (Cancer)
    (6, 9),   # lord in the 7th: the 10th from the house (Capricorn)
    (9, 3),   # lord in the 10th: the 4th (Cancer)
])
def test_arudha_lagna_including_the_exceptions(mars_sign, expected):
    c = make(dict(BASE, Mars=dms(mars_sign, 10)), asc_sign=0)   # Aries rising, lord Mars
    assert K.arudha(c, 1) == expected


def test_arudha_and_upapada_for_the_reference_chart():
    c = make(BASE, asc_sign=3)
    assert E.SIGNS[K.arudha(c, 1)] == 'Taurus' and E.SIGNS[K.arudha(c, 12)] == 'Aquarius'
    al, ul = K.rule_arudha(c)
    assert 'The 11th from it holds Venus' in al['finding'] and 'the 12th from it holds Mercury' in al['finding']
    assert ul['domain'] == 'marriage' and 'Saturn is in its own sign' in ul['finding'] and 'holds Venus' in ul['finding']
    assert K.rule_arudha(make(BASE, accuracy='unknown')) == []


def test_tenth_and_seventh_divisions():
    assert K.dashamsha_sign(dms(0, 10)) == 3      # Aries 10°: 4th part, counted from Aries -> Cancer
    assert K.dashamsha_sign(dms(1, 10)) == 0      # Taurus 10°: 4th part, counted from Capricorn -> Aries
    assert K.dashamsha_sign(dms(9, 1, 31)) == 5   # Capricorn 1°31′: 1st part, counted from Virgo
    assert K.saptamsha_sign(dms(0, 10)) == 2      # Aries 10°: 3rd part -> Gemini
    assert K.saptamsha_sign(dms(1, 10)) == 9      # Taurus 10°: 3rd part, counted from Scorpio -> Capricorn
    assert K.dashamsha_sign(dms(11, 29.999)) == (11 + 8 + 9) % 12


def test_yogini_start_follows_the_birth_star():
    first = lambda star: K.yogini_periods(BIRTH, (star - 1) * E.NAK_SPAN + 0.01)[0][0]
    assert first(1) == 'Bhramari' and first(6) == 'Mangala' and first(14) == 'Mangala' and first(22) == 'Mangala'
    assert first(5) == 'Sankata' and first(27) == 'Ulka'
    periods = K.yogini_periods(BIRTH, dms(8, 29, 51))
    assert periods[0][0] == 'Sankata' and periods[0][2] < BIRTH < periods[0][3]
    assert sum((e - s).total_seconds() for _n, _l, s, e in periods[:8]) / 86400 == pytest.approx(36 * E.YEAR_DAYS, abs=0.01)
    now = next(p for p in periods if p[2] <= NOW < p[3])
    assert (now[0], now[2].year, now[3].year) == ('Sankata', 2024, 2032)


def test_yogas_are_emitted_only_when_present():
    ids = lambda c: {f['id']: f['finding'] for f in K.rule_classical_yogas(c)}
    base = ids(make(BASE, asc_sign=3))
    assert 'Mercury in the 10th from the Lagna' in base['F-YOGA-08']
    assert base['F-YOGA-09'].startswith('Ubhayachari') and 'F-YOGA-06' not in base and 'F-YOGA-12' not in base
    # Adhi: Mercury, Jupiter, Venus 6th/7th/8th from a Moon in Aries
    adhi = dict(BASE, Moon=dms(0, 5), Mercury=dms(5, 5), Jupiter=dms(6, 5), Venus=dms(7, 5))
    assert '(full)' in ids(make(adhi, asc_sign=3))['F-YOGA-07']
    # Shakata: Moon 8th from Jupiter, cancelled when the Moon is in a kendra from the Lagna
    shak = dict(BASE, Jupiter=dms(0, 5), Moon=dms(7, 5))
    assert 'rises and falls' in ids(make(shak, asc_sign=3))['F-YOGA-10']
    assert 'cancelled' in ids(make(shak, asc_sign=7))['F-YOGA-10']
    # Rajju: all seven in movable signs
    rajju = dict(BASE, Sun=dms(0, 5), Moon=dms(3, 5), Mars=dms(6, 5), Mercury=dms(0, 20), Jupiter=dms(9, 5), Venus=dms(0, 25), Saturn=dms(6, 20))
    assert ids(make(rajju, asc_sign=3))['F-YOGA-12'].startswith('Rajju')
    # Mahabhagya: man, day birth (Sun above the horizon), Sun, Moon and Lagna in odd signs
    maha = dict(BASE, Sun=dms(8, 15), Moon=dms(4, 5))
    assert 'F-YOGA-06' in ids(make(maha, asc_sign=0, gender='male'))          # Sun 9th from an Aries Lagna: above the horizon
    assert 'F-YOGA-06' not in ids(make(maha, asc_sign=0, gender='female'))
    assert 'F-YOGA-06' not in ids(make(dict(maha, Sun=dms(2, 15)), asc_sign=0, gender='male'))  # Sun below the horizon
    # Kala Sarpa: everything between Rahu (0° Aries) and Ketu
    ks = {p: dms(1, 5) + i * 20 for i, p in enumerate(K.GRAHAS)}
    ks.update(Rahu=dms(0, 0), Ketu=dms(6, 0))
    assert 'F-YOGA-13' in ids(make(ks, asc_sign=3)) and 'F-YOGA-13' not in base


def test_sub_period_lord_from_main_period_lord():
    f = K.rule_dasha_relation(make(BASE, asc_sign=3), NOW)[0]   # Rahu-Sun: Sun in Taurus is 5th from Rahu in Capricorn
    assert 'Sun, lord of the sub-period, is 5th from Rahu' in f['finding'] and 'work together' in f['finding']
    assert f['start'].startswith('2026-06') and f['end'].startswith('2027-05')


def test_indu_lagna_worked_example():
    # Aries rising: 9th lord Jupiter (10). Moon in Taurus: 9th from it is Capricorn, lord Saturn (1). 11 -> 11th from Taurus
    c = make(dict(BASE, Moon=dms(1, 10)), asc_sign=0)
    assert E.SIGNS[K.indu_lagna(c)] == 'Pisces'
    # a sum that divides exactly counts as 12: Sun (30) + Sun (30) = 60 -> the 12th from the Moon
    c = make(dict(BASE, Moon=dms(8, 10)), asc_sign=8)
    assert E.SIGNS[K.indu_lagna(c)] == 'Scorpio'


def test_murti_grade_from_the_moon_at_entry():
    f = K.rule_murti(make(BASE, asc_sign=3), NOW)[0]
    assert 'Saturn entered Pisces on 29 Mar 2025' in f['finding']
    entry = datetime(2025, 3, 29, 12, tzinfo=timezone.utc)
    moon = E.sign_index(E.planet_positions(entry)['Moon']['longitude'])
    n = (moon - 8) % 12 + 1
    assert f"with the Moon {n}" in f['finding'] and K.MURTI[n] in f['finding']
    assert sorted(set(K.MURTI.values())) == ['copper', 'gold', 'iron', 'silver'] and len(K.MURTI) == 12


def test_classical_rules_reach_the_full_evaluation():
    chart = E.build_chart(BIRTH, 28.6139, 77.2090)
    bd = {'date_of_birth': '1990-05-15', 'time_of_birth': '10:30', 'latitude': 28.6139, 'longitude': 77.2090,
          'gender': 'male', 'birth_details': {'utc': BIRTH.isoformat(), 'timezone': 'Asia/Kolkata'}, **chart}
    from services.wisdom_core_pipeline import build_chart_facts
    ids = {f['id'] for f in evaluate_rules(build_chart_facts(bd), bd, full=True, now=NOW)}
    assert {'F-STATE-01', 'F-ARUDHA-01', 'F-ARUDHA-02', 'F-D10-01', 'F-D7-01', 'F-YOGINI-01',
            'F-DASHA-04', 'F-MURTI-01', 'F-INDU-01'} <= ids

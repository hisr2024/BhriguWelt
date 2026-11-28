"""Sourced Bhrigu / Nadi rules: Bhrigu Bindu per C. S. Patel, Bhrigu Sutram ages,
R. G. Rao's Nadi aspects, maturity ages, dignity refinements."""
from datetime import datetime, timezone

import pytest

E = pytest.importorskip("services.ephemeris_core")
if not E.SWISSEPH_AVAILABLE:  # pragma: no cover
    pytest.skip("pyswisseph not installed", allow_module_level=True)

from services import bhrigu_nadi_more as M  # noqa: E402
from services.bhrigu_nadi_rules import Chart, evaluate_rules, rule_bhrigu_bindu, rule_dignity  # noqa: E402

NOW = datetime(2026, 11, 28, 8, 0, tzinfo=timezone.utc)
BIRTH = datetime(1990, 5, 15, 5, 0, tzinfo=timezone.utc)


def dms(sign, deg, minutes=0.0):
    return sign * 30 + deg + minutes / 60.0


def make(lons, asc_sign=0, speeds=None, gender='male', birth=BIRTH, accuracy=''):
    """A chart from sign-degree positions (asc at 15° of ``asc_sign``)."""
    planets = {p: {'longitude': lon, 'speed': (speeds or {}).get(p, 1.0)} for p, lon in lons.items()}
    bd = {'planets': planets, 'ascendant': {'sign': E.SIGNS[asc_sign], 'degree': asc_sign * 30 + 15.0},
          'gender': gender, 'birth_details': {'utc': birth.isoformat()}, 'birth_time_accuracy': accuracy}
    return Chart({}, bd)


BASE = {'Sun': dms(3, 10), 'Moon': dms(8, 20), 'Mars': dms(10, 5), 'Mercury': dms(2, 12), 'Jupiter': dms(2, 15),
        'Venus': dms(11, 18), 'Saturn': dms(9, 1), 'Rahu': dms(9, 16), 'Ketu': dms(3, 16)}


@pytest.mark.parametrize('moon, rahu, expected', [
    # Worked examples in C. S. Patel, ch. 13 (signs-degrees-minutes)
    ((6, 12, 13), (9, 17, 6), (1, 29, 39.5)),
    ((8, 2, 2), (3, 5, 15), (5, 18, 38.5)),
    ((9, 5, 37), (8, 10, 33), (8, 23, 5)),
])
def test_bhrigu_bindu_matches_the_source_examples(moon, rahu, expected):
    bb = E.bhrigu_bindu(dms(*moon), dms(*rahu))
    assert bb == pytest.approx(dms(*expected), abs=0.01)


def test_bhrigu_bindu_uses_the_100_minute_orb_and_the_nodes():
    c = make(BASE, asc_sign=3)
    f = rule_bhrigu_bindu(c, NOW)[0]
    assert 'C. S. Patel' in f['principle']
    assert 'crossed by' in f['finding']
    assert any(p in f['finding'] for p in ('Rahu', 'Ketu'))


def test_nadi_directions_and_connections():
    assert [M.direction(s) for s in range(4)] == ['East', 'South', 'West', 'North']
    assert M.direction(4) == 'East' and M.direction(8) == 'East'  # trines share a direction
    c = make(BASE, asc_sign=3, speeds={'Saturn': -0.05})
    links = dict(M.nadi_connections(c, 'Saturn'))
    assert links['Rahu'] == 'same sign'
    assert links['Venus'].startswith('opposite direction (3rd/11th)')   # Pisces is 3rd from Capricorn
    assert 'retrograde' in links['Moon']                                 # read from Sagittarius as Saturn is retrograde
    c2 = make(BASE, asc_sign=3)                                          # Saturn direct: Moon is only the 12th
    assert dict(M.nadi_connections(c2, 'Saturn'))['Moon'] == '12th'


def test_bhrigu_sutram_dates_the_running_year():
    # Lagna Aries, Sun in Cancer = 4th house: the 32nd year (31st to 32nd birthday)
    c = make(BASE, asc_sign=0, birth=datetime(1996, 3, 1, tzinfo=timezone.utc))
    found = [f for f in M.rule_bhrigu_sutram(c, NOW) if 'Sun in the 4th' in f['finding']]
    assert found and found[0]['start'] == '2027-03-01' and found[0]['end'] == '2028-03-01'
    assert '32nd year' in found[0]['finding'] and found[0]['house_based'] is True


def test_bhrigu_sutram_conditions_and_exclusions():
    # Sun in the 2nd in its own sign Leo: the loss in the 25th year does not apply
    own = dict(BASE, Sun=dms(4, 10))
    c = make(own, asc_sign=3, birth=datetime(2005, 1, 1, tzinfo=timezone.utc))
    assert not [f for f in M.rule_bhrigu_sutram(c, NOW) if 'Sun in the 2nd' in f['finding']]
    # ... in Virgo (2nd from Leo lagna) it does
    c = make(dict(BASE, Sun=dms(5, 10)), asc_sign=4, birth=datetime(2005, 1, 1, tzinfo=timezone.utc))
    assert [f for f in M.rule_bhrigu_sutram(c, NOW) if 'Sun in the 2nd' in f['finding']]
    # no birth time: houses are unknown, so the sutras are not applied
    assert M.rule_bhrigu_sutram(make(BASE, accuracy='unknown'), NOW) == []
    # nothing about length of life, and the 8th house lifespan sutras are absent
    assert not any(h == 8 and p in ('Saturn', 'Rahu', 'Ketu') for p, h in M.BHRIGU_SUTRAM_AGES)
    assert not any('life span' in r or 'death' in r for rows in M.BHRIGU_SUTRAM_AGES.values() for _y, r, _c, _t in rows)


def test_maturity_age_picks_the_next_planet():
    c = make(BASE, asc_sign=3)  # born May 1990: 36 since May 2026
    f = M.rule_maturity(c, NOW)[0]
    assert f['finding'].startswith('Saturn matures now') and f['start'] == '2026-05-15'


def test_bnn_transit_windows_are_dated_and_gendered():
    male = M.rule_bnn_transits(make(BASE, asc_sign=3), NOW)
    assert all(f['start'] and f['end'] for f in male)
    assert any('and marriage' in f['finding'] for f in male)
    assert not any(f['finding'].startswith('Mars') for f in male)
    female = M.rule_bnn_transits(make(BASE, asc_sign=3, gender='female'), NOW)
    assert any(f['finding'].startswith('Mars') and 'husband' in f['finding'] for f in female)
    unknown = M.rule_bnn_transits(make(BASE, asc_sign=3, gender=''), NOW)
    assert not any('marriage' in f['finding'] for f in unknown)  # never guessed


def test_dignity_notes_moolatrikona_and_fuller_neecha_bhanga():
    c = make(dict(BASE, Saturn=dms(10, 10), Sun=dms(6, 5), Venus=dms(9, 3)), asc_sign=3)
    notes = {f['finding'].split()[0]: f['finding'] for f in rule_dignity(c)}
    assert 'moolatrikona' in notes['Saturn']                 # Aquarius 0-20
    assert 'neecha-bhanga' in notes['Sun']                    # Venus, lord of Libra, in a kendra (7th)


def test_new_rules_reach_the_full_evaluation():
    chart = E.build_chart(BIRTH, 28.6139, 77.2090)
    bd = {'date_of_birth': '1990-05-15', 'time_of_birth': '10:30', 'latitude': 28.6139, 'longitude': 77.2090,
          'gender': 'male', 'birth_details': {'utc': BIRTH.isoformat(), 'timezone': 'Asia/Kolkata'}, **chart}
    from services.wisdom_core_pipeline import build_chart_facts
    ids = {f['id'] for f in evaluate_rules(build_chart_facts(bd), bd, full=True, now=NOW)}
    assert {'F-BSUTRA-01', 'F-BNN-04', 'F-BNN-05', 'F-MATURITY-01', 'F-BB-01'} <= ids

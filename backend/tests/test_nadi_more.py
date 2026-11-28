"""Nadi Jyotisha principles: each checked against the source's own table or example, or a hand-worked case."""
from datetime import datetime, timedelta, timezone

import pytest

E = pytest.importorskip("services.ephemeris_core")
if not E.SWISSEPH_AVAILABLE:  # pragma: no cover
    pytest.skip("pyswisseph not installed", allow_module_level=True)

from services import nadi_more as N  # noqa: E402
from services.bhrigu_nadi_rules import Chart, evaluate_rules, navamsa_sign  # noqa: E402
from services.section_routes import ROUTES, _matches  # noqa: E402

NOW = datetime(2026, 11, 28, 8, 0, tzinfo=timezone.utc)
BIRTH = datetime(1990, 5, 15, 5, 0, tzinfo=timezone.utc)


def dms(sign, deg, minutes=0.0):
    return sign * 30 + deg + minutes / 60.0


def make(lons, asc_sign=3, asc_deg=15.0, birth=BIRTH, accuracy=''):
    planets = {p: {'longitude': lon, 'speed': 1.0} for p, lon in lons.items()}
    bd = {'planets': planets, 'ascendant': {'sign': E.SIGNS[asc_sign], 'degree': asc_sign * 30 + asc_deg},
          'gender': 'male', 'birth_details': {'utc': birth.isoformat()}, 'birth_time_accuracy': accuracy}
    return Chart({}, bd)


# Cancer rising: Moon is the Lagna lord, Saturn the 7th lord (with Rahu), Mars the 5th lord in the 8th.
BASE = {'Sun': dms(1, 0, 40), 'Moon': dms(8, 29, 51), 'Mars': dms(10, 24), 'Mercury': dms(0, 12), 'Jupiter': dms(2, 15),
        'Venus': dms(11, 18), 'Saturn': dms(9, 1), 'Rahu': dms(9, 17), 'Ketu': dms(3, 17)}


def lon_of(planet, day):
    return E.planet_positions(day)[planet]['longitude']


def middle(start, end):
    return datetime.fromisoformat(start).replace(tzinfo=timezone.utc) + (
        datetime.fromisoformat(end) - datetime.fromisoformat(start)) / 2


def test_pushkara_table_matches_the_source():
    # Fire 7th and 9th, earth 3rd and 5th, air 6th and 8th, water 1st and 3rd navamsa.
    inside = {(0, 21): True, (0, 27): True, (0, 10): False, (1, 7): True, (1, 14): True, (1, 21): False,
              (2, 17): True, (2, 24): True, (2, 7): False, (3, 1): True, (3, 7): True, (3, 14): False,
              (8, 29.85): True, (10, 24): True, (9, 1): False}
    for (sign, deg), expected in inside.items():
        assert N.is_pushkara(dms(sign, deg)) is expected, (sign, deg)
    mids = [n * N.NAV + N.NAV / 2 for n in range(108)]
    pushkara = [m for m in mids if N.is_pushkara(m)]
    assert len(pushkara) == 24
    # Every Pushkara navamsa falls in a sign of Venus, the Moon, Mercury or Jupiter.
    assert {navamsa_sign(m) for m in pushkara} == {1, 3, 5, 6, 8, 11}
    # Exactly three are vargottama: the 5th of Taurus, the 1st of Cancer, the 9th of Sagittarius.
    assert sorted(int(m // 30) for m in pushkara if navamsa_sign(m) == int(m // 30)) == [1, 3, 8]
    # The Pushkara degrees of Muhurta Darpana (21°, 14°, 24°, 7°, repeating) all lie inside them.
    assert all(N.is_pushkara(dms(sign, (21, 14, 24, 7)[sign % 4])) for sign in range(12))


def test_pushkara_finding_reads_the_chart():
    text = N.rule_pushkara(make(BASE, asc_deg=9.88))[0]['finding']
    assert text.startswith('Pushkara navamsa: Moon, Mars sit in a Pushkara navamsa')
    assert 'Moon is also vargottama' in text and 'rising degree is in a Pushkara navamsa' in text
    # Jupiter at 21° Aries in the 10th from Cancer: a kendra, navamsa Libra (the 4th house).
    c = make(dict(BASE, Jupiter=dms(0, 21)), asc_deg=15)
    assert 'Jupiter is there in a kendra or trine' in N.rule_pushkara(c)[0]['finding']
    assert 'health needs care' not in N.rule_pushkara(c)[0]['finding']
    # Libra rising, Jupiter at 17° Libra: the 1st house, navamsa Pisces, which is the 6th house.
    c = make(dict(BASE, Jupiter=dms(6, 17)), asc_sign=6)
    assert 'health needs care, because that navamsa sign is the 6th house' in N.rule_pushkara(c)[0]['finding']
    # Birth time unknown: nothing that depends on houses or the rising degree.
    text = N.rule_pushkara(make(BASE, asc_deg=9.88, accuracy='unknown'))[0]['finding']
    assert 'rising degree' not in text and 'kendra' not in text


def test_exchange_segment_matches_the_verse_example():
    # Chandra Kala Nadi v. 2191: Saturn born in Libra with Aries navamsa; the exchange is Aries with Libra navamsa.
    assert N.exchange_segment(6, 0) == pytest.approx((20.0, 20.0 + N.NAV))
    assert N.exchange_segment(9, 0) is None      # Aries holds no Capricorn navamsa
    for sign in range(12):
        for nav in range(12):
            seg = N.exchange_segment(sign, nav)
            reachable = sign in {(nav * 9 + k) % 12 for k in range(9)}
            assert (seg is not None) == reachable
            if seg:
                mid = (seg[0] + seg[1]) / 2
                assert int(mid // 30) == nav and navamsa_sign(mid) == sign


def test_saturn_exchange_transit_is_dated_from_the_ephemeris():
    assert N.rule_exchange_transit(make(BASE), NOW) == []          # Saturn vargottama in Capricorn: nothing exchanged
    c = make(dict(BASE, Saturn=dms(4, 18)))                        # Leo, navamsa Virgo
    f = N.rule_exchange_transit(c, NOW)[0]
    assert 'Virgo in the navamsa of Leo (23°20′–26°40′)' in f['finding']
    start = datetime.fromisoformat(f['start']).replace(tzinfo=timezone.utc)
    assert abs(lon_of('Saturn', start) - dms(5, 25)) <= N.NAV / 2 + 0.2
    assert 'death' not in f['finding'].lower()


def test_birth_star_and_its_trines_are_the_same_lords_stars():
    c = make(BASE)   # Moon in Uttara Ashadha: the 10th is Krittika, the 19th Uttara Phalguni
    found = {f['id'] + ':' + f['finding'].split(' ')[0]: f for f in N.rule_birth_star_transits(c, NOW)}
    assert set(found) == {'F-NADI-03:Saturn', 'F-NADI-03:Rahu', 'F-NADI-04:Jupiter'}
    for key, f in found.items():
        planet = key.split(':')[1]
        star = E.nakshatra_of(lon_of(planet, middle(f['start'], f['start']) + timedelta(days=6)))[0]
        assert star in ('Uttara Ashadha', 'Krittika', 'Uttara Phalguni') and star in f['finding']
    assert 'the 10th star from the birth star' in found['F-NADI-03:Saturn']['finding']
    assert 'auspicious' in found['F-NADI-04:Jupiter']['finding']


def test_happy_sub_periods_follow_book_two_verse_245():
    named = N.happy_period_lords(make(BASE))
    # Lagna lord Moon in Sagittarius navamsa: Jupiter. Rahu sits with the 7th lord Saturn.
    # 5th lord Mars at 24° Aquarius is in Taurus navamsa: Venus.
    assert named == {'Jupiter': ['navamsa lord of the Lagna lord Moon'], 'Rahu': ['placed with the 7th lord Saturn'],
                     'Venus': ['navamsa lord of the 5th lord Mars']}
    f = N.rule_happy_periods(make(BASE), NOW)[0]
    assert f['id'] == 'F-NADI-05' and 'Jupiter–Jupiter' in f['finding']
    assert N.rule_happy_periods(make(BASE, accuracy='unknown'), NOW) == []


def test_sub_period_lord_against_the_lagna_lord():
    c = make(BASE)
    assert N.temporary_friend(c, 'Moon', 'Saturn') and not N.temporary_friend(c, 'Moon', 'Sun')   # 2nd and 6th from the Moon
    periods = E.vimshottari(c.birth_utc, c.lon['Moon'])

    def during(maha, antar):
        p = next(p for p in periods if p.maha == maha and p.antar == antar)
        return N.rule_period_and_lagna_lord(make(BASE), p.start + (p.end - p.start) / 2)[0]['finding']

    assert 'Sun, lord of the running sub-period, is a friend of the Lagna lord' in during('Rahu', 'Sun')
    assert 'is the Lagna lord itself' in during('Rahu', 'Moon')
    saturn = during('Rahu', 'Saturn')   # neutral to the Moon, and in the 2nd from it
    assert 'neutral to the Lagna lord' in saturn and 'temporary friend' in saturn
    # Mars sits in the 8th house: Deva Keralam v. 3611 turns benefic and malefic sub-periods round.
    assert 'a benefic such as Jupiter brings worry of mind' in during('Mars', 'Jupiter')
    assert 'a malefic such as Saturn brings relief and gain' in during('Mars', 'Saturn')
    assert '8th house' not in during('Rahu', 'Sun')


def test_star_lords_of_saturn_and_mars():
    f = N.rule_star_lords_of_malefics(make(BASE), NOW)[0]
    assert 'Sun (lord of Uttara Ashadha, the star holding Saturn)' in f['finding']
    assert 'Jupiter (lord of Purva Bhadrapada, the star holding Mars)' in f['finding']
    assert f['domain'] == 'health'


def test_wealth_givers_are_ranked_aspect_occupation_lordship():
    # Cancer rising: the 2nd is Leo. Mars in Aquarius aspects it; the Sun owns it; nothing sits there.
    assert N.wealth_givers(make(BASE)) == {'Mars': ['aspects the 2nd house'], 'Sun': ['owns the 2nd house']}
    c = make(dict(BASE, Venus=dms(4, 5)))
    assert list(N.wealth_givers(c)) == ['Mars', 'Venus', 'Sun']
    f = N.rule_wealth_givers(make(BASE), NOW)[0]
    assert f['domain'] == 'wealth' and f['finding'].startswith('Wealth-giving planets: Mars (aspects the 2nd house)')
    assert N.rule_wealth_givers(make(BASE, accuracy='unknown'), NOW) == []


def test_transits_counted_from_the_planets_own_birth_sign():
    found = {f['finding'].split(' ')[0]: f for f in N.rule_own_sign_transits(make(BASE), NOW)}
    jupiter = found['Jupiter']     # born in Gemini: the 5th is Libra
    assert 'Jupiter passes through Libra, the 5th from its own birth sign' in jupiter['finding'] and jupiter['domain'] == 'children'
    assert E.sign_index(lon_of('Jupiter', middle(jupiter['start'], jupiter['end']))) == 6
    if 'Saturn' in found:          # born in Capricorn: the 9th is Virgo
        assert 'Virgo, the 9th from its own birth sign' in found['Saturn']['finding']
        assert E.sign_index(lon_of('Saturn', middle(found['Saturn']['start'], found['Saturn']['end']))) == 5
    if 'Mars' in found:            # born in Aquarius: the 4th is Taurus, and only while retrograde
        mars = E.planet_positions(middle(found['Mars']['start'], found['Mars']['end']))['Mars']
        assert mars['speed'] < 0 and E.sign_index(mars['longitude']) == 1 and found['Mars']['domain'] == 'home'


def test_saturn_on_the_moon_sign_names_only_mars_and_rahu_sub_periods():
    seen = 0
    for year in range(1950, 2000, 3):
        c = make(dict(BASE, Moon=dms(11, 12)), birth=datetime(year, 5, 15, 5, 0, tzinfo=timezone.utc))   # Moon in Pisces
        for f in N.rule_saturn_on_moon_sign(c, NOW):
            seen += 1
            assert 'Pisces' in f['finding'] and f['timing'].split(',')[0].split('–')[1] in ('Mars', 'Rahu')
            assert E.sign_index(lon_of('Saturn', middle(f['start'], f['end']))) == 11
    assert seen >= 1


def test_nadi_rules_reach_the_engine_and_their_sections():
    calc = pytest.importorskip("services.astrology_calculator").get_astrology_calculator()
    chart = calc.calculate_birth_chart(date_of_birth='1990-05-15', time_of_birth='10:30', place='New Delhi',
                                       latitude=28.6139, longitude=77.209, timezone_override='Asia/Kolkata')
    bd = dict(chart, date_of_birth='1990-05-15', time_of_birth='10:30', latitude=28.6139, longitude=77.209, gender='male')
    findings = [f for f in evaluate_rules(chart, bd, full=True, now=NOW) if f['id'].startswith('F-NADI')]
    ids = {f['id'] for f in findings}
    assert {'F-NADI-01', 'F-NADI-03', 'F-NADI-04', 'F-NADI-05', 'F-NADI-06', 'F-NADI-07', 'F-NADI-08', 'F-NADI-09'} <= ids
    assert all(f['provenance'] == 'tradition-attributed' and 'C. S. Patel' in f['principle'] for f in findings)
    assert not any(word in f['finding'].lower() for f in findings for word in ('death', 'die', 'lifespan', 'bereave'))

    def reaches(category, section, rule_id):
        domains, prefixes = ROUTES[category][section]
        return any(_matches(f, domains, prefixes) for f in findings if f['id'] == rule_id)

    assert reaches('life_events', 'favorable_periods', 'F-NADI-05') and reaches('life_events', 'challenging_periods', 'F-NADI-03')
    assert reaches('life_events', 'financial_events', 'F-NADI-08') and reaches('life_events', 'children_family', 'F-NADI-09')
    assert reaches('present_life', 'current_phase', 'F-NADI-06') and reaches('life_events', 'health_alerts', 'F-NADI-07')
    # Without a birth time the house-based Nadi rules stay silent.
    unknown = {f['id'] for f in evaluate_rules(chart, dict(bd, birth_time_accuracy='unknown'), full=True, now=NOW)}
    assert not unknown & {'F-NADI-05', 'F-NADI-06', 'F-NADI-08'}

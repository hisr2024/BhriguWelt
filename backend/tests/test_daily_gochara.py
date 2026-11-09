"""The daily reading is computed from the Moon's transit against the birth chart."""
from datetime import datetime, timezone

import pytest

pytest.importorskip('swisseph')

from services.astrology_calculator import AstrologyCalculator
from services.daily_gochara import daily_facts, daily_reading, reading_for


@pytest.fixture(scope='module')
def chart():
    # Pisces lagna, Moon in Pisces (Revati).
    return AstrologyCalculator().calculate_birth_chart(
        '1994-03-14', '06:45', 'New Delhi', 28.6139, 77.209, 'Asia/Kolkata')


def test_new_moon_day_panchanga(chart):
    # 9 Nov 2026: new Moon at about 07:02 UTC, Sun and Moon in sidereal Libra.
    before = daily_facts(chart, datetime(2026, 11, 9, 5, 0, tzinfo=timezone.utc))
    after = daily_facts(chart, datetime(2026, 11, 9, 9, 0, tzinfo=timezone.utc))
    assert before['tithi'] == 'Krishna Amavasya'
    assert after['tithi'] == 'Shukla Pratipada' and after['tithi_class'] == 'Nanda'
    assert after['moon_sign'] == 'Libra' and after['nakshatra'] == 'Vishakha'


def test_chandra_bala_tara_bala_and_house(chart):
    f = daily_facts(chart, datetime(2026, 11, 9, 9, 0, tzinfo=timezone.utc))
    # Libra is the 8th sign from Pisces, both from the natal Moon and from the lagna.
    assert f['from_moon'] == 8 and f['house'] == 8 and f['chandra_score'] < 0
    # Revati (27th) to Vishakha (16th): 17th star counted inclusively, 17 mod 9 = 8 = Mitra.
    assert f['tara'] == 'Mitra'
    # Natal Jupiter is in Libra: the transit Moon joins it.
    assert ('Jupiter', 'joins') in f['links']
    assert f['nakshatra_until'] > f['when'] and f['sign_until'] > f['when']
    assert f['maha'] == 'Venus' and f['antar'] == 'Jupiter' and f['pratyantar']


def test_chandrashtama_reading_is_cautious_and_consistent(chart):
    r = daily_reading(chart, datetime(2026, 11, 9, 9, 0, tzinfo=timezone.utc))
    assert r['energy_level']['level'] == 'Go gently'
    assert 'Chandrashtama' in r['overall'] and any('Chandrashtama' in d for d in r['dont_list'])
    # A good tara must not produce "do your most important work" on a Chandrashtama day.
    assert not any('work that matters most' in d for d in r['do_list'])
    assert all(1 <= c['rating'] <= 5 for c in r['categories'].values())
    assert r['categories']['spiritual']['mantra'] == 'Om Chandraya Namaha'  # Monday
    assert 'needs care' in r['categories']['career']['message']


def test_a_favourable_day_reads_favourable(chart):
    # Moon in Capricorn = 11th from Pisces: gains.
    for day in range(10, 20):
        when = datetime(2026, 11, day, 9, 0, tzinfo=timezone.utc)
        f = daily_facts(chart, when)
        if f['moon_sign'] == 'Capricorn':
            r = daily_reading(chart, when)
            assert f['from_moon'] == 11 and 'gains' in r['overall']
            assert r['categories']['finance']['rating'] >= 3
            return
    pytest.fail('Moon never reached Capricorn in the window')


def test_clock_times_only_when_place_is_known(chart):
    same_zone = reading_for(chart, datetime(2026, 11, 9), 'Asia/Kolkata')
    assert same_zone['lucky_elements']['rahu_kalam'] and same_zone['lucky_elements']['auspicious_hours']
    elsewhere = reading_for(chart, datetime(2026, 11, 9), 'Europe/Berlin')
    assert 'rahu_kalam' not in elsewhere['lucky_elements']


def test_engines_use_the_computed_reading(chart):
    from services.daily_insights_engine import DailyInsightsEngine
    from services.horoscope_engine import HoroscopeEngine
    insight = DailyInsightsEngine().generate_daily_insight(chart, datetime(2026, 11, 9), 'Asia/Kolkata')
    assert insight['metadata']['computed'] and insight['panchanga']['tara_bala']
    horoscope = HoroscopeEngine().generate_daily_horoscope(chart, datetime(2026, 11, 9), 'Asia/Kolkata')
    assert horoscope['metadata']['computed'] and horoscope['sections']['career']['message']
    assert horoscope['overall']['energy'] in ('Favourable', 'Mixed', 'Go gently')


def test_conjunction_results(chart):
    from services.bhrigu_nadi_rules import evaluate_rules
    from services.wisdom_core_pipeline import build_chart_facts
    found = evaluate_rules(build_chart_facts(chart), chart, category='present_life', full=True)
    conj = [f for f in found if f['id'] == 'F-CONJ-01']
    assert conj and len(conj) <= 5
    text = ' '.join(f['finding'] for f in conj)
    # Mars and Saturn are 0°06' apart in Aquarius: tight, planetary war, 12th house.
    tight = next(f for f in conj if 'Mars + Saturn' in f['finding'])
    assert 'tight' in tight['finding'] and 'planetary war' in tight['finding'] and '12th house' in tight['finding']
    assert 'Moon + Venus' in text
    assert any(f['id'] == 'F-CONJ-02' and '4 planets together in Aquarius' in f['finding'] for f in found)

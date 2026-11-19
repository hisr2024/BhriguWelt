"""Weekly, monthly and yearly readings are computed from transits, to the minute."""
from datetime import datetime, timedelta, timezone

import pytest

from services import ephemeris_core as E
from services import period_gochara as P
from services.astrology_calculator import AstrologyCalculator

pytestmark = pytest.mark.skipif(not E.SWISSEPH_AVAILABLE, reason='Swiss Ephemeris not installed')


@pytest.fixture(scope='module')
def chart():
    return AstrologyCalculator().calculate_birth_chart(
        date_of_birth='1990-05-15', time_of_birth='10:30', place='New Delhi, India',
        latitude=28.6139, longitude=77.2090, timezone_override='Asia/Kolkata')


def _utc(*a):
    return datetime(*a, tzinfo=timezone.utc)


def test_data_files_are_used_not_the_moshier_fallback():
    assert E.ephemeris_source() == 'Swiss Ephemeris (JPL DE431)'


def test_known_ingresses_and_stations_2026():
    jup = P.ingresses('Jupiter', _utc(2026, 1, 1), _utc(2027, 1, 1))
    assert [(t.strftime('%Y-%m-%d'), E.SIGNS[new]) for t, _old, new in jup] == [('2026-06-01', 'Cancer'), ('2026-10-31', 'Leo')]
    assert P.ingresses('Saturn', _utc(2026, 1, 1), _utc(2027, 1, 1)) == []
    sat = P.stations('Saturn', _utc(2026, 1, 1), _utc(2027, 1, 1))
    assert [(t.strftime('%Y-%m-%d'), what) for t, what in sat] == [('2026-07-26', 'turns retrograde'), ('2026-12-11', 'turns direct')]


def test_ingress_is_found_to_the_minute():
    (t, old, new), = P.ingresses('Sun', _utc(2026, 11, 10), _utc(2026, 11, 20))
    before = E.planet_positions(t - timedelta(minutes=2))['Sun']['longitude']
    after = E.planet_positions(t + timedelta(minutes=2))['Sun']['longitude']
    assert E.sign_index(before) == old and E.sign_index(after) == new


def test_lunations_november_2026():
    found = [(t.strftime('%Y-%m-%d'), name) for t, name in P.lunations(_utc(2026, 11, 1), _utc(2026, 12, 1))]
    assert found == [('2026-11-09', 'Amavasya (new Moon)'), ('2026-11-24', 'Purnima (full Moon)')]


def test_week_is_seven_computed_days(chart):
    r = P.weekly_reading(chart, datetime(2026, 11, 11), 'Europe/Berlin')
    assert r['week_start'] == '2026-11-09' and len(r['daily_summaries']) == 7
    scores = {d['day']: d['score'] for d in r['daily_summaries']}
    assert scores[r['best_day']] == max(scores.values()) and scores[r['challenging_day']] == min(scores.values())
    assert all(('star' in d['focus']) or d['focus'].startswith('Weak Moon') for d in r['daily_summaries'])
    assert r['metadata']['computed'] and 'Your planetary periods now' in r['bhrigu_guidance']


def test_month_flags_chandrashtama_and_judges_from_the_moon(chart):
    r = P.monthly_reading(chart, 2026, 11, 'Europe/Berlin')
    # Natal Moon in Sagittarius: the 8th sign from it is Cancer.
    assert r['caution_days'] and all('Moon in Cancer' in c['reason'] for c in r['caution_days'])
    assert r['monthly_theme']['title'].startswith('Sun 11th from your birth Moon')
    assert any(e['event'].startswith('Sun enters Scorpio') for e in r['important_dates'])
    assert set(r['sections']) == {'career', 'love', 'health', 'finance'}
    assert all('basis' not in s for s in r['sections'].values())
    assert 'Bhrigu year-cycle' in r['bhrigu_guidance']


def test_year_reads_each_stay_of_the_slow_planets(chart):
    r = P.yearly_reading(chart, 2026, 'Europe/Berlin')
    assert r['yearly_theme']['title'] == 'Jupiter in Gemini, then Cancer, then Leo; Saturn in Pisces'
    assert sum(line.startswith('Jupiter in') for line in r['transits']) == 3
    assert 'Kantaka Shani' in r['bhrigu_guidance']  # Saturn 4th from a Sagittarius Moon
    assert 'until your birthday on 15 May' in r['bhrigu_guidance']
    assert len(r['quarters']) == 4 and all(q['summary'] for q in r['quarters'])
    assert {m['kind'] for m in r['key_months']} == {'favourable', 'caution'}


def test_vedha_from_fast_planets_is_ignored_over_a_long_span(chart):
    natal = P.D._natal(chart)
    tsigns = P._signs_at(_utc(2026, 3, 1))
    month = P.transit_state('Jupiter', natal, tsigns, None)
    year = P.transit_state('Jupiter', natal, tsigns, None, slow_only=True)
    assert year['good'] and set(year['blockers']) <= {'Jupiter', 'Saturn'} and len(year['blockers']) <= len(month['blockers'])


def test_engine_serves_the_computed_readings(chart):
    from services.horoscope_engine import HoroscopeEngine
    engine = HoroscopeEngine()
    assert engine.generate_weekly_horoscope(chart)['metadata']['computed']
    assert engine.generate_monthly_horoscope(chart, 2026, 11)['metadata']['computed']
    assert engine.generate_yearly_horoscope(chart, 2026)['metadata']['computed']


def test_orchestrator_passes_period_options_once(monkeypatch):
    """time_period used to be sent twice, so every call fell to a generic 'success' text."""
    from services.prediction_orchestrator import PredictionOrchestrator
    seen = {}

    def fake(self, category, chart_data, language, **kw):
        seen.update(kw)
        return {'mode': 'offline', 'prediction': 'x'}

    monkeypatch.setattr(PredictionOrchestrator, '_generate_hybrid', fake)
    out = PredictionOrchestrator().generate_prediction(
        category='predictions', chart_data={'zodiac_sign': 'Aries'}, time_period='weekly')
    assert out['mode'] == 'offline' and seen['time_period'] == 'weekly'


JARGON = ('bindu', 'vedha', 'lagna', 'natal', 'antardasha', 'pratyantar', 'tara bala', 'chandra bala', 'aspects')


def _texts(obj):
    if isinstance(obj, str):
        yield obj
    elif isinstance(obj, dict):
        for k, v in obj.items():
            if k not in ('metadata', 'panchanga', 'facts'):
                yield from _texts(v)
    elif isinstance(obj, (list, tuple)):
        for v in obj:
            yield from _texts(v)


def test_horoscopes_are_written_for_ordinary_readers(chart):
    from services.daily_gochara import reading_for
    readings = [reading_for(chart, datetime(2026, 11, d), 'Europe/Berlin') for d in range(1, 31)]
    readings += [P.weekly_reading(chart, datetime(2026, 11, 11), 'Europe/Berlin'),
                 P.monthly_reading(chart, 2026, 11, 'Europe/Berlin'), P.yearly_reading(chart, 2026, 'Europe/Berlin')]
    text = ' '.join(t for r in readings for t in _texts(r)).lower()
    assert not [w for w in JARGON if w in text]

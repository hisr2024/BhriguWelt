"""The Simple view carries results only: no planets, houses, signs or period names."""
import os
import re
import sys
from datetime import datetime, timedelta

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services import daily_gochara as D, ephemeris_core as E, period_gochara as P  # noqa: E402

JARGON = re.compile(
    r'\b(Sun|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu|house|lagna|ascendant|nakshatra|tithi|dasha|'
    r'period|transit|Chandrashtama|birth Moon|star|' + '|'.join(E.SIGNS) + r')\b')


@pytest.fixture(scope='module')
def chart():
    if not E.SWISSEPH_AVAILABLE:
        pytest.skip('Swiss Ephemeris not available')
    from services.astrology_calculator import get_astrology_calculator
    return get_astrology_calculator().calculate_birth_chart(
        date_of_birth='1990-05-15', time_of_birth='10:30', place='New Delhi',
        latitude=28.61, longitude=77.21, timezone_override='Asia/Kolkata')


def _clean(text):
    # Mantras name their planet's deity ("Om Suryaya Namaha"); weekday names are everyday words.
    assert not JARGON.search(text), text


def test_daily_simple_has_no_astrology_terms(chart):
    for i in range(30):
        r = D.reading_for(chart, datetime(2026, 11, 1) + timedelta(days=i), 'Europe/Berlin')
        s = r['simple']
        _clean(s['summary'])
        for c in s['categories'].values():
            _clean(c['message'])
            _clean(c['advice'])
        for line in s['do_list'] + s['dont_list']:
            _clean(line)
        assert r['overall'] and 'birth Moon' in r['overall']  # the Astrologer view keeps its reasoning


def test_period_simple_has_no_astrology_terms(chart):
    w = P.weekly_reading(chart, None, 'Europe/Berlin')
    m = P.monthly_reading(chart, 2026, 11, 'Europe/Berlin')
    y = P.yearly_reading(chart, 2026, 'Europe/Berlin')
    _clean(w['weekly_theme']['simple'])
    for d in w['daily_summaries']:
        _clean(d['simple'])
    for theme in (m['monthly_theme'], y['yearly_theme']):
        _clean(theme['simple_title'])
        _clean(theme['simple'])
    for reading in (w, m, y):
        for sec in reading['sections'].values():
            _clean(sec['simple'])
    for row in m['power_days'] + m['caution_days'] + y['quarters'] + y['key_months']:
        _clean(row['simple'])

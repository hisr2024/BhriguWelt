"""Weekday lords follow the Vedic order with Python's Monday = 0."""
from datetime import datetime

from services.daily_insights_engine import DailyInsightsEngine
from services.horoscope_engine import HoroscopeEngine

# 2026-11-02 is a Monday.
EXPECTED = ['Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Sun']


def test_horoscope_engine_day_ruler():
    engine = HoroscopeEngine()
    for offset, planet in enumerate(EXPECTED):
        assert engine._get_day_ruler(datetime(2026, 11, 2 + offset).weekday()) == planet


def test_daily_insight_day_ruler_and_ascendant_dict():
    engine = DailyInsightsEngine()
    birth = {'zodiac_sign': 'Aquarius', 'moon_sign': 'Pisces', 'nakshatra': 'Revati',
             'ascendant': {'sign': 'Pisces', 'degree': 331.6}}
    thursday = engine.generate_daily_insight(birth, datetime(2026, 11, 5))
    assert thursday['day_ruler']['planet'] == 'Jupiter'
    assert "{'sign'" not in str(thursday)

"""
Tests for the Wisdom Core precision pipeline (prefilter + postfilter)
and the strict no-generalised-fallback contract.
"""
import pytest
from unittest.mock import Mock

from services.wisdom_core_pipeline import (
    InsufficientChartDataError,
    PredictionUnavailableError,
    build_chart_facts,
    format_chart_context,
    nakshatra_for_longitude,
    postfilter_report,
    split_views,
)
from services.bhrigu_predictions import BhriguPredictionsService


@pytest.fixture
def birth_data():
    return {
        'ascendant': {'sign': 'Leo'},
        'moon_sign': 'Taurus',
        'zodiac_sign': 'Aries',
        'nakshatra': 'Rohini',
        'nakshatra_pada': 2,
        'planets': {
            'Sun': {'longitude': 15.5, 'sign': 'Aries'},
            'Moon': {'longitude': 45.2, 'sign': 'Taurus'},
            'Jupiter': {'longitude': 123.4, 'sign': 'Leo'},
            'Saturn': {'longitude': 200.0, 'sign': 'Libra'},
        },
        'dasha_period': {'maha_dasha': 'Venus', 'years_remaining': 4.2},
    }


class TestPrefilter:
    def test_missing_planets_refused(self):
        with pytest.raises(InsufficientChartDataError):
            build_chart_facts({'zodiac_sign': 'Aries'})

    def test_facts_carry_degrees_pada_and_houses(self, birth_data):
        facts = build_chart_facts(birth_data)
        moon = facts['planets']['Moon']
        assert moon['degree_in_sign'] == 15.2
        assert moon['nakshatra'] == 'Rohini'
        assert moon['pada'] == 2
        assert moon['house'] == 10  # Taurus from Leo lagna, whole-sign
        assert facts['planets']['Jupiter']['house'] == 1

    def test_context_text_is_precise(self, birth_data):
        facts = build_chart_facts(birth_data)
        context = format_chart_context(facts)
        assert 'Lagna (Ascendant): Leo' in context
        assert 'Saturn: Libra, 20.0°, house 3' in context
        assert 'Vimshottari Mahadasha: Venus' in context

    def test_nakshatra_boundaries(self):
        assert nakshatra_for_longitude(0.0) == ('Ashwini', 1, 'Ketu')
        assert nakshatra_for_longitude(120.0) == ('Magha', 1, 'Ketu')
        assert nakshatra_for_longitude(359.9)[0] == 'Revati'


class TestPostfilter:
    def test_grounded_specific_text_passes(self, birth_data):
        facts = build_chart_facts(birth_data)
        text = (
            'Your Jupiter in Leo in the 1st house forms a strong yoga. '
            'During Venus dasha, ages 32-34 bring career gains supported '
            'by Saturn in Libra.'
        )
        report = postfilter_report(text, facts)
        assert report['ok'] is True
        assert report['mismatched_claims'] == []

    def test_invented_placement_caught(self, birth_data):
        facts = build_chart_facts(birth_data)
        report = postfilter_report('Jupiter in Capricorn blesses you.', facts)
        assert any('Jupiter' in claim for claim in report['mismatched_claims'])
        assert report['ok'] is False

    def test_wrong_house_caught(self, birth_data):
        facts = build_chart_facts(birth_data)
        report = postfilter_report(
            'Saturn in the 7th house delays marriage during Venus dasha in Libra.', facts
        )
        assert any('house' in claim for claim in report['mismatched_claims'])

    def test_generic_filler_and_hedging_rejected(self, birth_data):
        facts = build_chart_facts(birth_data)
        report = postfilter_report(
            'Every soul experiences growth. Trust the universe; things may or may not improve at some point.',
            facts,
        )
        assert report['generic_hits']
        assert report['hedge_hits']
        assert report['ok'] is False


class TestDualViews:
    SECTION = (
        '**Key Insight:** Your career rises sharply between ages 32-34.\n'
        '**Timing:** Venus mahadasha, 4.2 years remaining.\n'
        '**Technical Analysis:** Jupiter in Leo in the 1st house with Saturn '
        'in Libra creates Raja Yoga per Bhrigu Samhita.\n'
        'Actionable Guidance:\n- Do X\n- Do Y'
    )

    def test_user_view_is_sharp_without_technical_detail(self):
        views = split_views(self.SECTION)
        assert 'career rises sharply' in views['user']
        assert 'Venus mahadasha' in views['user']
        assert 'Raja Yoga' not in views['user']
        assert 'Do X' in views['user']

    def test_astrologer_view_keeps_full_detail(self):
        views = split_views(self.SECTION)
        assert 'Technical Analysis' in views['astrologer']
        assert 'Raja Yoga' in views['astrologer']

    def test_unmarked_text_passes_through(self):
        views = split_views('Plain prose section.')
        assert views['user'] == 'Plain prose section.'
        assert views['astrologer'] == 'Plain prose section.'


class TestStrictNoFallbackContract:
    def _unhealthy_service(self):
        return BhriguPredictionsService(
            openai_service=None,
            astrology_calculator=Mock(),
            section_parser=None,
            corpus_db=None,
        )

    def test_strict_mode_raises_instead_of_generalised_fallback(self, monkeypatch):
        monkeypatch.setenv('BHRIGU_STRICT_PRECISION', 'true')
        service = self._unhealthy_service()
        with pytest.raises(PredictionUnavailableError):
            service._get_fallback_if_unavailable('karmic_journey', {'zodiac_sign': 'Aries'})

    def test_legacy_mode_still_serves_fallback(self, monkeypatch):
        monkeypatch.setenv('BHRIGU_STRICT_PRECISION', 'false')
        service = self._unhealthy_service()
        fallback = service._get_fallback_if_unavailable('karmic_journey', {'zodiac_sign': 'Aries'})
        assert fallback is not None
        assert fallback['metadata'].get('fallback_mode') is True

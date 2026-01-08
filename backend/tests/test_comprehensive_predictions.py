"""
Unit Tests for Comprehensive Prediction Service
Tests all engines and ensures no failures
"""
import unittest
from datetime import datetime
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.vedic_calculation_engine import VedicCalculationEngine, get_vedic_calculation_engine
from services.prediction_helpers import (
    format_soul_purpose, format_karmic_debts, fallback_karmic_journey,
    fallback_past_lives, fallback_future_lives
)
from services.prediction_analysis_methods import PredictionAnalysisMethods


class TestVedicCalculationEngine(unittest.TestCase):
    """Test Vedic Calculation Engine"""

    def setUp(self):
        """Set up test fixtures"""
        self.engine = get_vedic_calculation_engine()
        self.sample_chart = {
            'zodiac_sign': 'Aries',
            'moon_sign': 'Cancer',
            'ascendant': 'Sagittarius',
            'nakshatra': 'Ashwini',
            'date_of_birth': '1990-01-15',
            'planets': {
                'Sun': {'sign': 'Capricorn', 'longitude': 285.5},
                'Moon': {'sign': 'Cancer', 'longitude': 105.2},
                'Saturn': {'sign': 'Sagittarius', 'longitude': 265.8},
                'Jupiter': {'sign': 'Gemini', 'longitude': 75.3},
                'Mars': {'sign': 'Scorpio', 'longitude': 235.7},
                'Venus': {'sign': 'Aquarius', 'longitude': 315.4},
                'Mercury': {'sign': 'Capricorn', 'longitude': 290.1},
                'Rahu': {'sign': 'Aquarius', 'longitude': 320.0},
                'Ketu': {'sign': 'Leo', 'longitude': 140.0}
            },
            'houses': [
                'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
                'Aries', 'Taurus', 'Gemini', 'Cancer',
                'Leo', 'Virgo', 'Libra', 'Scorpio'
            ]
        }

    def test_soul_purpose_calculation(self):
        """Test soul purpose calculation"""
        result = self.engine.calculate_soul_purpose(self.sample_chart)

        self.assertTrue(result.get('success'))
        self.assertIn('primary_purpose', result)
        self.assertIn('purpose_indicators', result)
        self.assertIsInstance(result['purpose_indicators'], list)
        self.assertGreater(len(result['purpose_indicators']), 0)

    def test_karmic_debts_calculation(self):
        """Test karmic debts calculation"""
        result = self.engine.calculate_karmic_debts(self.sample_chart)

        self.assertTrue(result.get('success'))
        self.assertIn('karmic_debts', result)
        self.assertIn('karmic_credits', result)
        self.assertIsInstance(result['karmic_debts'], list)
        self.assertIsInstance(result['karmic_credits'], list)

    def test_dasha_timing_calculation(self):
        """Test dasha timing calculation"""
        result = self.engine.calculate_dasha_timing(
            '1990-01-15',
            105.2,  # Moon longitude
            self.sample_chart
        )

        self.assertTrue(result.get('success'))
        self.assertIn('dasha_timeline', result)
        self.assertIn('current_maha_dasha', result)
        self.assertIn('current_bhuktis', result)
        self.assertGreater(len(result['dasha_timeline']), 0)

    def test_life_events_timing(self):
        """Test life events timing calculation"""
        dasha_data = self.engine.calculate_dasha_timing(
            '1990-01-15',
            105.2,
            self.sample_chart
        )

        result = self.engine.calculate_life_events_timing(
            self.sample_chart,
            dasha_data
        )

        self.assertIsInstance(result, dict)
        self.assertIn('marriage', result)
        self.assertIn('career', result)
        self.assertIn('wealth', result)

    def test_remedial_measures_generation(self):
        """Test remedial measures generation"""
        result = self.engine.generate_remedial_measures(self.sample_chart)

        self.assertTrue(result.get('success'))
        self.assertIn('remedies', result)
        remedies = result['remedies']

        self.assertIn('mantras', remedies)
        self.assertIn('gemstones', remedies)
        self.assertIn('yantras', remedies)
        self.assertIn('charity', remedies)

        # Verify mantras structure
        self.assertGreater(len(remedies['mantras']), 0)
        first_mantra = remedies['mantras'][0]
        self.assertIn('planet', first_mantra)
        self.assertIn('mantra', first_mantra)
        self.assertIn('benefits', first_mantra)


class TestPredictionHelpers(unittest.TestCase):
    """Test prediction helper functions"""

    def setUp(self):
        """Set up test fixtures"""
        self.sample_chart = {
            'zodiac_sign': 'Aries',
            'nakshatra': 'Ashwini',
            'moon_sign': 'Cancer',
            'ascendant': 'Sagittarius'
        }

    def test_format_soul_purpose(self):
        """Test soul purpose formatting"""
        soul_data = {
            'success': True,
            'primary_purpose': 'Test purpose',
            'purpose_indicators': [
                {'indicator': 'Ascendant', 'value': 'Aries', 'purpose': 'Leading others'}
            ],
            'soul_lessons': ['Patience', 'Compassion']
        }

        result = format_soul_purpose(soul_data)

        self.assertIsInstance(result, str)
        self.assertIn('Soul\'s Primary Purpose', result)
        self.assertIn('Test purpose', result)
        self.assertIn('Purpose Indicators', result)

    def test_format_karmic_debts(self):
        """Test karmic debts formatting"""
        debts_data = {
            'success': True,
            'karmic_debts': [
                {
                    'planet': 'Saturn',
                    'house': 1,
                    'description': 'Self-discipline lessons',
                    'severity': 'High',
                    'remedy_focus': 'Meditation'
                }
            ],
            'karmic_credits': [
                {
                    'planet': 'Jupiter',
                    'description': 'Divine grace',
                    'strength': 'High'
                }
            ],
            'overall_assessment': 'Positive balance'
        }

        result = format_karmic_debts(debts_data)

        self.assertIsInstance(result, str)
        self.assertIn('Karmic Debts', result)
        self.assertIn('Saturn', result)
        self.assertIn('Jupiter', result)

    def test_fallback_karmic_journey(self):
        """Test fallback karmic journey"""
        result = fallback_karmic_journey(self.sample_chart)

        self.assertTrue(result.get('success'))
        self.assertEqual(result['engine'], 'karmic_journey')
        self.assertIn('subcategories', result)
        self.assertIn('soul_purpose', result['subcategories'])

    def test_fallback_past_lives(self):
        """Test fallback past lives"""
        result = fallback_past_lives(self.sample_chart)

        self.assertTrue(result.get('success'))
        self.assertEqual(result['engine'], 'past_lives')
        self.assertIn('subcategories', result)

    def test_fallback_future_lives(self):
        """Test fallback future lives"""
        result = fallback_future_lives(self.sample_chart)

        self.assertTrue(result.get('success'))
        self.assertEqual(result['engine'], 'future_lives')
        self.assertIn('subcategories', result)


class TestPredictionAnalysisMethods(unittest.TestCase):
    """Test prediction analysis methods"""

    def setUp(self):
        """Set up test fixtures"""
        self.analysis = PredictionAnalysisMethods()
        self.sample_chart = {
            'zodiac_sign': 'Aries',
            'nakshatra': 'Ashwini',
            'moon_sign': 'Cancer',
            'ascendant': 'Sagittarius',
            'planets': {
                'Saturn': {'sign': 'Sagittarius', 'longitude': 265.8},
                'Jupiter': {'sign': 'Gemini', 'longitude': 75.3},
                'Ketu': {'sign': 'Leo', 'longitude': 140.0},
                'Rahu': {'sign': 'Aquarius', 'longitude': 320.0}
            },
            'houses': ['Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
                      'Aries', 'Taurus', 'Gemini', 'Cancer',
                      'Leo', 'Virgo', 'Libra', 'Scorpio']
        }

    def test_calculate_karmic_lessons(self):
        """Test karmic lessons calculation"""
        result = self.analysis.calculate_karmic_lessons(self.sample_chart)

        self.assertIn('title', result)
        self.assertIn('content', result)
        self.assertIn('data', result)
        self.assertIn('lessons', result['data'])
        self.assertGreater(len(result['data']['lessons']), 0)

    def test_calculate_soul_evolution(self):
        """Test soul evolution calculation"""
        result = self.analysis.calculate_soul_evolution(self.sample_chart)

        self.assertIn('title', result)
        self.assertIn('content', result)
        self.assertIn('data', result)
        self.assertIn('stage', result['data'])
        self.assertIn('completion', result['data'])

    def test_calculate_soul_connections(self):
        """Test soul connections calculation"""
        result = self.analysis.calculate_soul_connections(self.sample_chart)

        self.assertIn('title', result)
        self.assertIn('content', result)
        self.assertIn('Soul Group', result['content'])

    def test_analyze_recent_past_life(self):
        """Test recent past life analysis"""
        result = self.analysis.analyze_recent_past_life(self.sample_chart)

        self.assertIn('title', result)
        self.assertIn('content', result)
        self.assertIn('data', result)
        self.assertIn('Most Recent Past Life', result['content'])

    def test_identify_karmic_patterns(self):
        """Test karmic patterns identification"""
        result = self.analysis.identify_karmic_patterns(self.sample_chart)

        self.assertIn('title', result)
        self.assertIn('content', result)
        self.assertIn('Karmic Patterns', result['content'])

    def test_identify_carried_talents(self):
        """Test carried talents identification"""
        result = self.analysis.identify_carried_talents(self.sample_chart)

        self.assertIn('title', result)
        self.assertIn('content', result)
        self.assertIn('Talents', result['content'])

    def test_identify_unresolved_issues(self):
        """Test unresolved issues identification"""
        result = self.analysis.identify_unresolved_issues(self.sample_chart)

        self.assertIn('title', result)
        self.assertIn('content', result)
        self.assertIn('Unresolved', result['content'])


class TestIntegration(unittest.TestCase):
    """Integration tests for complete prediction flow"""

    def setUp(self):
        """Set up test fixtures"""
        self.engine = get_vedic_calculation_engine()
        self.sample_chart = {
            'zodiac_sign': 'Aries',
            'moon_sign': 'Cancer',
            'ascendant': 'Sagittarius',
            'nakshatra': 'Ashwini',
            'date_of_birth': '1990-01-15',
            'planets': {
                'Sun': {'sign': 'Capricorn', 'longitude': 285.5},
                'Moon': {'sign': 'Cancer', 'longitude': 105.2},
                'Saturn': {'sign': 'Sagittarius', 'longitude': 265.8},
                'Jupiter': {'sign': 'Gemini', 'longitude': 75.3},
                'Rahu': {'sign': 'Aquarius', 'longitude': 320.0},
                'Ketu': {'sign': 'Leo', 'longitude': 140.0}
            },
            'houses': ['Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
                      'Aries', 'Taurus', 'Gemini', 'Cancer',
                      'Leo', 'Virgo', 'Libra', 'Scorpio']
        }

    def test_complete_karmic_journey_flow(self):
        """Test complete karmic journey prediction flow"""
        # Calculate soul purpose
        soul_purpose = self.engine.calculate_soul_purpose(self.sample_chart)
        self.assertTrue(soul_purpose.get('success'))

        # Calculate karmic debts
        karmic_debts = self.engine.calculate_karmic_debts(self.sample_chart)
        self.assertTrue(karmic_debts.get('success'))

        # Format results
        formatted_purpose = format_soul_purpose(soul_purpose)
        self.assertIsInstance(formatted_purpose, str)
        self.assertGreater(len(formatted_purpose), 100)

        formatted_debts = format_karmic_debts(karmic_debts)
        self.assertIsInstance(formatted_debts, str)
        self.assertGreater(len(formatted_debts), 100)

    def test_complete_dasha_and_events_flow(self):
        """Test complete dasha timing and life events flow"""
        # Calculate dasha
        dasha_data = self.engine.calculate_dasha_timing(
            '1990-01-15',
            105.2,
            self.sample_chart
        )
        self.assertTrue(dasha_data.get('success'))

        # Calculate life events
        events = self.engine.calculate_life_events_timing(
            self.sample_chart,
            dasha_data
        )
        self.assertIsInstance(events, dict)

        # Verify event categories
        expected_categories = ['marriage', 'career', 'wealth', 'health', 'spiritual']
        for category in expected_categories:
            self.assertIn(category, events)

    def test_complete_remedies_flow(self):
        """Test complete remedies generation flow"""
        remedies = self.engine.generate_remedial_measures(self.sample_chart)

        self.assertTrue(remedies.get('success'))
        self.assertIn('remedies', remedies)

        # Verify all remedy types
        remedy_types = ['mantras', 'gemstones', 'yantras', 'charity', 'rituals', 'lifestyle']
        for remedy_type in remedy_types:
            self.assertIn(remedy_type, remedies['remedies'])

    def test_error_handling_with_incomplete_data(self):
        """Test error handling with incomplete chart data"""
        incomplete_chart = {
            'zodiac_sign': 'Unknown',
            'nakshatra': 'Unknown'
        }

        # Should not raise exceptions
        soul_purpose = self.engine.calculate_soul_purpose(incomplete_chart)
        self.assertIsInstance(soul_purpose, dict)

        karmic_debts = self.engine.calculate_karmic_debts(incomplete_chart)
        self.assertIsInstance(karmic_debts, dict)

    def test_fallback_chain(self):
        """Test fallback chain with missing services"""
        # Test with minimal data
        minimal_chart = {'zodiac_sign': 'Aries', 'nakshatra': 'Ashwini'}

        # Use fallback functions
        journey = fallback_karmic_journey(minimal_chart)
        self.assertTrue(journey.get('success'))
        self.assertIn('subcategories', journey)

        past_lives = fallback_past_lives(minimal_chart)
        self.assertTrue(past_lives.get('success'))

        future_lives = fallback_future_lives(minimal_chart)
        self.assertTrue(future_lives.get('success'))


class TestDeterminism(unittest.TestCase):
    """Test deterministic calculations"""

    def setUp(self):
        """Set up test fixtures"""
        self.engine = get_vedic_calculation_engine()
        self.sample_chart = {
            'zodiac_sign': 'Aries',
            'moon_sign': 'Cancer',
            'ascendant': 'Sagittarius',
            'nakshatra': 'Ashwini',
            'date_of_birth': '1990-01-15',
            'planets': {
                'Moon': {'sign': 'Cancer', 'longitude': 105.2},
                'Saturn': {'sign': 'Sagittarius', 'longitude': 265.8}
            },
            'houses': ['Sagittarius'] * 12
        }

    def test_deterministic_soul_purpose(self):
        """Test that soul purpose calculation is deterministic"""
        result1 = self.engine.calculate_soul_purpose(self.sample_chart)
        result2 = self.engine.calculate_soul_purpose(self.sample_chart)

        self.assertEqual(
            result1.get('primary_purpose'),
            result2.get('primary_purpose')
        )

    def test_deterministic_dasha_calculation(self):
        """Test that dasha calculation is deterministic"""
        result1 = self.engine.calculate_dasha_timing(
            '1990-01-15', 105.2, self.sample_chart
        )
        result2 = self.engine.calculate_dasha_timing(
            '1990-01-15', 105.2, self.sample_chart
        )

        self.assertEqual(
            result1.get('birth_nakshatra'),
            result2.get('birth_nakshatra')
        )
        self.assertEqual(
            result1.get('birth_nakshatra_lord'),
            result2.get('birth_nakshatra_lord')
        )


def run_tests():
    """Run all tests"""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestVedicCalculationEngine))
    suite.addTests(loader.loadTestsFromTestCase(TestPredictionHelpers))
    suite.addTests(loader.loadTestsFromTestCase(TestPredictionAnalysisMethods))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegration))
    suite.addTests(loader.loadTestsFromTestCase(TestDeterminism))

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Return exit code
    return 0 if result.wasSuccessful() else 1


if __name__ == '__main__':
    exit_code = run_tests()
    sys.exit(exit_code)

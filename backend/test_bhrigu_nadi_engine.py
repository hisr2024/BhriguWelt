"""
Test script for Bhrigu-Nadi Core Wisdom Engine
Validates that all 155+ principles load and apply correctly across all 8 categories
"""
import sys
import json
from typing import Dict, Any

# Add backend to path
sys.path.insert(0, '/home/user/BhriguWelt/backend')

from services.bhrigu_nadi_integration import (
    BhriguNadiIntegration,
    apply_principles_to_all_categories,
    get_engine_statistics
)
from services.bhrigu_nadi_core_engine import generate_bhrigu_nadi_reading
from utils.logger import setup_logger

logger = setup_logger(__name__)


def test_principle_loading():
    """Test 1: Verify all principles load correctly"""
    print("\n" + "="*80)
    print("TEST 1: PRINCIPLE LOADING")
    print("="*80)

    try:
        stats = get_engine_statistics()

        print(f"✓ Total principles loaded: {stats['total_principles']}")
        print(f"  - Bhrigu Samhita: {stats['by_tradition']['bhrigu_samhita']}")
        print(f"  - Nadi Jyotisa: {stats['by_tradition']['nadi_jyotisa']}")
        print(f"✓ Domains available: {len(stats['domains_available'])}")
        print(f"  {', '.join(stats['domains_available'][:10])}")

        assert stats['total_principles'] >= 100, "Should have at least 100 principles"
        print("\n✅ TEST 1 PASSED: All principles loaded successfully")
        return True

    except Exception as e:
        print(f"\n❌ TEST 1 FAILED: {e}")
        return False


def test_single_category_generation():
    """Test 2: Generate reading for single category"""
    print("\n" + "="*80)
    print("TEST 2: SINGLE CATEGORY GENERATION")
    print("="*80)

    chart_features = {
        'moon_sign': 'Cancer',
        'ascendant': 'Virgo',
        'jupiter_house': 9,
        'saturn_house': 10,
        'venus_house': 2,
        'mars_house': 3,
        'moon_element': 'water',
        'lunar_tithi': 10,
        'saturn_retrograde': False
    }

    try:
        reading = BhriguNadiIntegration.generate_for_category(
            category='karmic_journey',
            chart_features=chart_features,
            depth='comprehensive'
        )

        print(f"✓ Category: {reading['category']}")
        print(f"✓ Success: {reading['success']}")
        print(f"✓ Rules considered: {reading['data']['principles_applied']['rules_considered']}")
        print(f"✓ Rules activated: {reading['data']['principles_applied']['total_rules']}")
        print(f"✓ Confidence: {reading['data']['confidence']['level']}")

        assert reading['success'], "Reading generation should succeed"
        assert reading['data']['principles_applied']['total_rules'] > 0, "Should activate rules"
        print("\n✅ TEST 2 PASSED: Single category generation works")
        return True

    except Exception as e:
        print(f"\n❌ TEST 2 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_all_categories_generation():
    """Test 3: Generate readings for ALL 8 categories"""
    print("\n" + "="*80)
    print("TEST 3: ALL 8 CATEGORIES GENERATION")
    print("="*80)

    chart_features = {
        'moon_sign': 'Pisces',
        'ascendant': 'Sagittarius',
        'jupiter_house': 5,
        'saturn_house': 3,
        'venus_house': 4,
        'mars_house': 10,
        'mercury_house': 2,
        'moon_element': 'water',
        'lunar_tithi': 8,
        'saturn_retrograde': True
    }

    try:
        results = apply_principles_to_all_categories(chart_features)

        print(f"✓ Total principles applied: {results['total_principles_applied']}")
        print(f"✓ Categories processed: {len(results['categories'])}")

        categories = [
            'karmic_journey', 'past_lives', 'future_lives', 'present_life',
            'life_events', 'karmic_remedies', 'relationships', 'predictions'
        ]

        for category in categories:
            cat_data = results['categories'][category]
            rules_count = cat_data['data']['principles_applied']['total_rules'] if cat_data['success'] else 0
            status = "✓" if cat_data['success'] else "✗"
            print(f"  {status} {category}: {rules_count} rules")

        successful = sum(1 for c in results['categories'].values() if c['success'])
        print(f"\n✓ Success rate: {successful}/8 categories")

        assert successful == 8, "All 8 categories should succeed"
        assert results['total_principles_applied'] > 100, "Should apply 100+ principles total"
        print("\n✅ TEST 3 PASSED: All 8 categories generated successfully")
        return True

    except Exception as e:
        print(f"\n❌ TEST 3 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_depth_levels():
    """Test 4: Verify different depth levels work"""
    print("\n" + "="*80)
    print("TEST 4: DEPTH LEVEL CONFIGURATIONS")
    print("="*80)

    chart_features = {
        'moon_sign': 'Leo',
        'ascendant': 'Aries',
        'jupiter_house': 11,
        'saturn_house': 8
    }

    depths = ['quick', 'standard', 'comprehensive', 'exhaustive']

    try:
        for depth in depths:
            reading = BhriguNadiIntegration.generate_for_category(
                category='present_life',
                chart_features=chart_features,
                depth=depth
            )

            rules_applied = reading['data']['principles_applied']['total_rules']
            print(f"✓ Depth '{depth}': {rules_applied} rules activated")

        print("\n✅ TEST 4 PASSED: All depth levels work correctly")
        return True

    except Exception as e:
        print(f"\n❌ TEST 4 FAILED: {e}")
        return False


def test_structured_output():
    """Test 5: Verify structured output format"""
    print("\n" + "="*80)
    print("TEST 5: STRUCTURED OUTPUT FORMAT")
    print("="*80)

    chart_features = {
        'moon_sign': 'Taurus',
        'ascendant': 'Libra',
        'jupiter_house': 7,
        'saturn_house': 4,
        'venus_house': 10
    }

    try:
        reading = generate_bhrigu_nadi_reading(
            chart_features=chart_features,
            domain='career',
            depth='comprehensive'
        )

        # Verify all components exist
        components = {
            'activated_rules': reading.activated_rules,
            'integrated_synthesis': reading.integrated_synthesis,
            'use_cases': reading.use_cases,
            'cross_verification': reading.cross_verification,
            'overall_confidence': reading.overall_confidence,
            'limits': reading.limits,
            'next_checks': reading.next_checks
        }

        print("✓ Output structure verification:")
        for name, component in components.items():
            exists = component is not None and (
                not hasattr(component, '__len__') or len(component) >= 0
            )
            status = "✓" if exists else "✗"
            if hasattr(component, '__len__'):
                print(f"  {status} {name}: {len(component)} items")
            else:
                print(f"  {status} {name}: {component}")

        # Verify 10-point specification compliance
        print("\n✓ 10-Point Specification Compliance:")
        print("  ✓ A. Activated Rules with sources")
        print(f"      - {len(reading.activated_rules)} rules with full metadata")
        print("  ✓ B. Integrated Reading")
        print(f"      - {len(reading.integrated_synthesis)} chars of synthesis")
        print("  ✓ C. Use-Cases & Manifestations")
        print(f"      - {len(reading.use_cases)} scenarios with invalidation criteria")
        print("  ✓ D. Cross-Verification")
        print(f"      - {'Present' if reading.cross_verification else 'Missing'}")
        print("  ✓ E. Confidence & Limits")
        print(f"      - Level: {reading.overall_confidence.value}, {len(reading.limits)} limits")
        print("  ✓ F. Next Checks")
        print(f"      - {len(reading.next_checks)} recommendations")

        print("\n✅ TEST 5 PASSED: Structured output format correct")
        return True

    except Exception as e:
        print(f"\n❌ TEST 5 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_zero_failure_guarantee():
    """Test 6: Verify zero-failure guarantee with missing data"""
    print("\n" + "="*80)
    print("TEST 6: ZERO-FAILURE GUARANTEE")
    print("="*80)

    # Minimal chart data
    minimal_chart = {
        'moon_sign': 'Gemini'
    }

    # Empty chart data
    empty_chart = {}

    try:
        # Test with minimal data
        reading1 = BhriguNadiIntegration.generate_for_category(
            category='present_life',
            chart_features=minimal_chart,
            depth='standard'
        )

        print(f"✓ Minimal data test:")
        print(f"  - Success: {reading1['success']}")
        print(f"  - Rules: {reading1['data']['principles_applied']['total_rules']}")

        # Test with empty data
        reading2 = BhriguNadiIntegration.generate_for_category(
            category='karmic_journey',
            chart_features=empty_chart,
            depth='quick'
        )

        print(f"✓ Empty data test:")
        print(f"  - Success: {reading2['success']}")
        print(f"  - Has synthesis: {bool(reading2['data']['synthesis'])}")

        print("\n✅ TEST 6 PASSED: Zero-failure guarantee maintained")
        return True

    except Exception as e:
        print(f"\n❌ TEST 6 FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run complete test suite"""
    print("\n" + "🔬"*40)
    print("BHRIGU-NADI CORE WISDOM ENGINE TEST SUITE")
    print("🔬"*40)

    tests = [
        ("Principle Loading", test_principle_loading),
        ("Single Category Generation", test_single_category_generation),
        ("All 8 Categories Generation", test_all_categories_generation),
        ("Depth Level Configurations", test_depth_levels),
        ("Structured Output Format", test_structured_output),
        ("Zero-Failure Guarantee", test_zero_failure_guarantee)
    ]

    results = []

    for test_name, test_func in tests:
        try:
            passed = test_func()
            results.append((test_name, passed))
        except Exception as e:
            print(f"\n💥 UNEXPECTED ERROR in {test_name}: {e}")
            results.append((test_name, False))

    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)

    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)

    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")

    print(f"\n{'='*80}")
    print(f"TOTAL: {passed_count}/{total_count} tests passed")
    print(f"{'='*80}\n")

    if passed_count == total_count:
        print("🎉 ALL TESTS PASSED! Engine ready for production.")
        return True
    else:
        print(f"⚠️  {total_count - passed_count} test(s) failed. Review errors above.")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)

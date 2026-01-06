"""
Comprehensive Test Script for All Jyotisa Category Predictions
Tests that each category generates predictions with proper structured sections
"""
import sys
import os
import json
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from services.bhrigu_predictions import get_bhrigu_service
from services.astrology_calculator import AstrologyCalculator

def test_category_predictions():
    """Test all 5 main categories for prediction generation"""

    print("="*80)
    print("COMPREHENSIVE JYOTISA PREDICTION TESTING")
    print("="*80)
    print()

    # Initialize services
    bhrigu_service = get_bhrigu_service()
    astrology_calc = AstrologyCalculator()

    # Test birth data
    test_person = {
        'date_of_birth': '1990-01-15',
        'time_of_birth': '14:30',
        'latitude': 28.6139,
        'longitude': 77.2090,
        'place_of_birth': 'New Delhi, India'
    }

    print(f"Test Profile:")
    print(f"  Date of Birth: {test_person['date_of_birth']}")
    print(f"  Time of Birth: {test_person['time_of_birth']}")
    print(f"  Place: {test_person['place_of_birth']}")
    print()

    # Calculate birth chart
    print("Calculating birth chart...")
    try:
        chart_data = astrology_calc.calculate_birth_chart(
            test_person['date_of_birth'],
            test_person['time_of_birth'],
            test_person['latitude'],
            test_person['longitude']
        )
        test_person.update(chart_data)
        print(f"  ✓ Zodiac Sign: {chart_data.get('zodiac_sign')}")
        print(f"  ✓ Nakshatra: {chart_data.get('nakshatra')}")
        print(f"  ✓ Moon Sign: {chart_data.get('moon_sign')}")
        print(f"  ✓ Ascendant: {chart_data.get('ascendant')}")
        print()
    except Exception as e:
        print(f"  ✗ Error calculating chart: {e}")
        print()

    # Test categories
    categories = [
        {
            'name': 'Karmic Journey',
            'key': 'karmic_journey',
            'method': bhrigu_service.generate_karmic_journey_prediction,
            'expected_sections': 8
        },
        {
            'name': 'Past Lives',
            'key': 'past_lives',
            'method': bhrigu_service.generate_past_lives_prediction,
            'expected_sections': 8
        },
        {
            'name': 'Future Lives',
            'key': 'future_lives',
            'method': bhrigu_service.generate_future_lives_prediction,
            'expected_sections': 8
        },
        {
            'name': 'Present Life',
            'key': 'present_life',
            'method': bhrigu_service.generate_present_life_prediction,
            'expected_sections': 10
        },
        {
            'name': 'Karmic Remedies',
            'key': 'karmic_remedies',
            'method': bhrigu_service.generate_karmic_remedies_prediction,
            'expected_sections': 12
        }
    ]

    results = {
        'total_tests': len(categories),
        'passed': 0,
        'failed': 0,
        'details': []
    }

    for category in categories:
        print("-"*80)
        print(f"Testing: {category['name']} ({category['key']})")
        print("-"*80)

        try:
            # Generate prediction
            print(f"  Generating prediction...")
            prediction = category['method'](test_person, None)

            # Check basic structure
            checks = {
                'has_category': 'category' in prediction,
                'has_title': 'title' in prediction,
                'has_full_analysis': 'full_analysis' in prediction and len(prediction['full_analysis']) > 100,
                'has_metadata': 'metadata' in prediction,
                'has_generated_at': 'generated_at' in prediction
            }

            # Count extracted sections
            section_count = 0
            section_keys = []
            for key, value in prediction.items():
                if key not in ['category', 'title', 'full_analysis', 'metadata', 'generated_at']:
                    if value and len(str(value)) > 50:
                        section_count += 1
                        section_keys.append(key)

            checks['has_sections'] = section_count >= category['expected_sections']

            # Display results
            all_passed = all(checks.values())

            print(f"  ✓ Category field present: {checks['has_category']}")
            print(f"  ✓ Title field present: {checks['has_title']}")
            print(f"  ✓ Full analysis present: {checks['has_full_analysis']}")
            print(f"  ✓ Metadata present: {checks['has_metadata']}")
            print(f"  ✓ Generated timestamp present: {checks['has_generated_at']}")
            print(f"  ✓ Section count: {section_count}/{category['expected_sections']} {'PASS' if checks['has_sections'] else 'FAIL'}")

            if section_keys:
                print(f"  Extracted sections: {', '.join(section_keys[:5])}" +
                      (f" (+{len(section_keys)-5} more)" if len(section_keys) > 5 else ""))

            # Sample content
            print(f"  Sample content length: {len(prediction['full_analysis'])} characters")
            print(f"  First 150 chars: {prediction['full_analysis'][:150]}...")

            if all_passed:
                results['passed'] += 1
                print(f"\n  ✅ {category['name']} - ALL CHECKS PASSED")
            else:
                results['failed'] += 1
                failed_checks = [k for k, v in checks.items() if not v]
                print(f"\n  ❌ {category['name']} - FAILED: {', '.join(failed_checks)}")

            results['details'].append({
                'category': category['name'],
                'status': 'PASS' if all_passed else 'FAIL',
                'section_count': section_count,
                'expected_sections': category['expected_sections'],
                'checks': checks,
                'content_length': len(prediction['full_analysis'])
            })

        except Exception as e:
            results['failed'] += 1
            print(f"  ❌ ERROR generating {category['name']}: {str(e)}")
            import traceback
            print(f"  {traceback.format_exc()}")

            results['details'].append({
                'category': category['name'],
                'status': 'ERROR',
                'error': str(e)
            })

        print()

    # Final summary
    print("="*80)
    print("FINAL TEST SUMMARY")
    print("="*80)
    print(f"Total Categories Tested: {results['total_tests']}")
    print(f"Passed: {results['passed']}")
    print(f"Failed: {results['failed']}")
    print(f"Success Rate: {(results['passed']/results['total_tests']*100):.1f}%")
    print()

    for detail in results['details']:
        status_icon = "✅" if detail['status'] == 'PASS' else "❌"
        print(f"{status_icon} {detail['category']}: {detail['status']}")
        if detail['status'] != 'ERROR':
            print(f"   Sections: {detail.get('section_count', 0)}/{detail.get('expected_sections', 0)}")
            print(f"   Content: {detail.get('content_length', 0)} chars")

    print()
    print("="*80)

    # Save results
    results_file = f'test_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    print(f"Detailed results saved to: {results_file}")

    return results

if __name__ == '__main__':
    try:
        results = test_category_predictions()
        sys.exit(0 if results['failed'] == 0 else 1)
    except Exception as e:
        print(f"FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

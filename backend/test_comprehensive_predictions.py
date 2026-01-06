#!/usr/bin/env python3
"""
Comprehensive Test Script for Bhrigu Jyotisa Prediction System
Tests all 8 categories with sample birth data
"""

import sys
import os
import json
from datetime import datetime

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.bhrigu_predictions import get_bhrigu_service
from services.astrology_calculator import AstrologyCalculator

# ANSI color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def print_header(text):
    """Print colored header"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'=' * 80}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(80)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'=' * 80}{Colors.ENDC}\n")


def print_success(text):
    """Print success message"""
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")


def print_info(text):
    """Print info message"""
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")


def print_warning(text):
    """Print warning message"""
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")


def print_error(text):
    """Print error message"""
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")


def print_section(title, content, max_length=500):
    """Print a section of content"""
    print(f"\n{Colors.OKBLUE}{Colors.BOLD}{title}:{Colors.ENDC}")
    if isinstance(content, dict):
        for key, value in content.items():
            if isinstance(value, str) and len(value) > max_length:
                value = value[:max_length] + "..."
            print(f"  • {key}: {value}")
    elif isinstance(content, list):
        for item in content[:5]:  # Show first 5 items
            if isinstance(item, str) and len(item) > max_length:
                item = item[:max_length] + "..."
            print(f"  • {item}")
        if len(content) > 5:
            print(f"  ... and {len(content) - 5} more items")
    elif isinstance(content, str):
        if len(content) > max_length:
            content = content[:max_length] + "..."
        print(f"  {content}")
    else:
        print(f"  {content}")


def create_sample_birth_data():
    """Create comprehensive sample birth data for testing"""
    return {
        'date_of_birth': '1990-03-21',
        'time_of_birth': '10:30:00',
        'place_of_birth': 'New Delhi, India',
        'latitude': 28.6139,
        'longitude': 77.2090,
        'zodiac_sign': 'Aries',
        'nakshatra': 'Ashwini',
        'moon_sign': 'Aries',
        'ascendant': 'Gemini',
        'age': 34,
        'current_dasha': 'Venus Mahadasha',
        'dasha_balance': '12 years remaining',
        'rahu_position': 'Capricorn',
        'ketu_position': 'Cancer',
        'jupiter_position': 'Gemini',
        'saturn_position': 'Capricorn',
        'venus_position': 'Pisces',
        'mars_position': 'Aries',
        'afflictions': 'None major',
        'weak_planets': 'Saturn',
        'doshas': 'None',
        'spiritual_level': 'Intermediate',
        'seventh_house': 'Sagittarius',
        'ninth_house': 'Aquarius',
        'twelfth_house_lord': 'Venus'
    }


def test_category(service, category_name, birth_data, test_question=None):
    """Test a specific prediction category"""
    print_header(f"Testing Category: {category_name.upper().replace('_', ' ')}")

    try:
        print_info(f"Generating {category_name} prediction...")
        start_time = datetime.now()

        result = service.generate_comprehensive_prediction(
            birth_data=birth_data,
            category=category_name,
            question=test_question
        )

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        print_success(f"Prediction generated in {duration:.2f} seconds")

        # Validate result structure
        required_fields = ['category', 'title', 'full_analysis', 'metadata', 'generated_at']
        missing_fields = [field for field in required_fields if field not in result]

        if missing_fields:
            print_error(f"Missing required fields: {', '.join(missing_fields)}")
            return False

        print_success("All required fields present")

        # Print summary
        print_section("Category", result['category'])
        print_section("Title", result['title'])
        print_section("Metadata", result['metadata'])

        # Show analysis length
        analysis_length = len(result['full_analysis'])
        print_info(f"Full analysis length: {analysis_length} characters")

        if analysis_length < 100:
            print_warning("Analysis seems too short!")
        elif analysis_length < 500:
            print_warning("Analysis could be more comprehensive")
        else:
            print_success("Analysis is comprehensive!")

        # Show sample of analysis
        print_section("Analysis Preview", result['full_analysis'][:800])

        # Show any extracted sections
        section_keys = [k for k in result.keys() if k not in required_fields]
        if section_keys:
            print_info(f"Extracted sections: {', '.join(section_keys[:5])}")
            if len(section_keys) > 5:
                print_info(f"... and {len(section_keys) - 5} more sections")

        # Save result to file for inspection
        output_dir = '/home/user/BhriguWelt/backend/test_outputs'
        os.makedirs(output_dir, exist_ok=True)
        output_file = f"{output_dir}/{category_name}_test_result.json"

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        print_success(f"Full result saved to: {output_file}")

        return True

    except Exception as e:
        print_error(f"Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run comprehensive tests for all categories"""
    print_header("BHRIGU JYOTISA COMPREHENSIVE PREDICTION SYSTEM TEST")

    # Initialize service
    print_info("Initializing Bhrigu Predictions Service...")
    try:
        service = get_bhrigu_service()
        print_success("Service initialized successfully")
    except Exception as e:
        print_error(f"Failed to initialize service: {str(e)}")
        return

    # Create sample birth data
    print_info("Creating sample birth data...")
    birth_data = create_sample_birth_data()
    print_success("Birth data created")
    print_section("Birth Data Sample", {
        'DOB': birth_data['date_of_birth'],
        'Time': birth_data['time_of_birth'],
        'Place': birth_data['place_of_birth'],
        'Zodiac': birth_data['zodiac_sign'],
        'Nakshatra': birth_data['nakshatra']
    })

    # Test all 8 categories
    categories = [
        ('karmic_journey', 'What is my soul\'s primary purpose?'),
        ('past_lives', 'Tell me about my most significant past life'),
        ('future_lives', 'What is my soul evolution path?'),
        ('present_life', 'What are my current life opportunities?'),
        ('life_events', 'What major events will occur in the next 5 years?'),
        ('karmic_remedies', 'What remedies will help me overcome obstacles?'),
        ('relationships', 'When will I meet my life partner?'),
        ('predictions', 'What does this month hold for me?')
    ]

    results = {}

    for category, question in categories:
        success = test_category(service, category, birth_data, question)
        results[category] = 'PASS' if success else 'FAIL'

        # Brief pause between tests
        import time
        time.sleep(1)

    # Print final summary
    print_header("TEST SUMMARY")

    total_tests = len(categories)
    passed_tests = sum(1 for v in results.values() if v == 'PASS')
    failed_tests = total_tests - passed_tests

    for category, status in results.items():
        if status == 'PASS':
            print_success(f"{category.upper().replace('_', ' ')}: {status}")
        else:
            print_error(f"{category.upper().replace('_', ' ')}: {status}")

    print(f"\n{Colors.BOLD}Total Tests: {total_tests}{Colors.ENDC}")
    print(f"{Colors.OKGREEN}Passed: {passed_tests}{Colors.ENDC}")
    print(f"{Colors.FAIL}Failed: {failed_tests}{Colors.ENDC}")

    if failed_tests == 0:
        print(f"\n{Colors.OKGREEN}{Colors.BOLD}🎉 ALL TESTS PASSED! 🎉{Colors.ENDC}")
        print(f"{Colors.OKGREEN}The Jyotisa prediction system is 100% functional!{Colors.ENDC}\n")
    else:
        print(f"\n{Colors.WARNING}{Colors.BOLD}⚠ SOME TESTS FAILED{Colors.ENDC}")
        print(f"{Colors.WARNING}Please review the errors above and fix them.{Colors.ENDC}\n")

    print_info("Test outputs saved to: /home/user/BhriguWelt/backend/test_outputs/")


if __name__ == '__main__':
    main()

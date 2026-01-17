#!/usr/bin/env python3
"""
Test script to verify all platform engines are working
Tests birth chart generation and predictions functionality
"""
import requests
import json
import sys

BASE_URL = "http://localhost:5000"

# Test data
test_birth_data = {
    "date_of_birth": "1990-01-15",
    "time_of_birth": "14:30",
    "place_of_birth": "New Delhi, India",
    "timezone": "Asia/Kolkata"
}

def test_birth_chart_generation():
    """Test birth chart generation endpoint"""
    print("\n" + "="*60)
    print("TEST 1: Birth Chart Generation")
    print("="*60)

    url = f"{BASE_URL}/api/astrology/birth-chart"

    try:
        response = requests.post(
            url,
            json=test_birth_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            if 'data' in data and 'zodiac_sign' in data['data']:
                print(f"✓ SUCCESS: Birth chart generated")
                print(f"  Zodiac Sign: {data['data'].get('zodiac_sign')}")
                print(f"  Moon Sign: {data['data'].get('moon_sign')}")
                print(f"  Nakshatra: {data['data'].get('nakshatra')}")
                print(f"  Ascendant: {data['data'].get('ascendant', {}).get('sign')}")
                return True
            else:
                print(f"✗ FAILED: Unexpected response format")
                print(f"  Response: {json.dumps(data, indent=2)}")
                return False
        else:
            print(f"✗ FAILED: HTTP {response.status_code}")
            print(f"  Response: {response.text}")
            return False

    except Exception as e:
        print(f"✗ ERROR: {str(e)}")
        return False


def test_predictions(category):
    """Test a specific prediction category"""
    print(f"\nTesting {category} prediction...")

    url = f"{BASE_URL}/api/bhrigu-predictions/{category}"

    try:
        response = requests.post(
            url,
            json=test_birth_data,
            headers={"Content-Type": "application/json"},
            timeout=60
        )

        print(f"  Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            if 'prediction' in data or 'data' in data:
                print(f"  ✓ SUCCESS: {category} prediction generated")
                return True
            else:
                print(f"  ✗ FAILED: Unexpected response format")
                print(f"  Response keys: {list(data.keys())}")
                return False
        else:
            print(f"  ✗ FAILED: HTTP {response.status_code}")
            print(f"  Response: {response.text[:200]}")
            return False

    except Exception as e:
        print(f"  ✗ ERROR: {str(e)}")
        return False


def test_all_predictions():
    """Test all prediction categories"""
    print("\n" + "="*60)
    print("TEST 2: Predictions Functionality")
    print("="*60)

    categories = [
        'karmic-journey',
        'past-lives',
        'future-lives',
        'present-life',
        'life-events',
        'karmic-remedies',
        'relationships',
        'predictions'
    ]

    results = {}
    for category in categories:
        results[category] = test_predictions(category)

    # Print summary
    print("\n" + "-"*60)
    print("Predictions Summary:")
    print("-"*60)
    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for category, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}: {category}")

    print(f"\nTotal: {passed}/{total} passed")
    return passed == total


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("BhriguWelt Platform Engines Test Suite")
    print("="*60)
    print(f"Testing against: {BASE_URL}")

    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"✓ Server is running (HTTP {response.status_code})")
    except (requests.exceptions.RequestException, ConnectionError) as e:
        print("✗ ERROR: Cannot connect to server")
        print(f"  Make sure the backend is running at {BASE_URL}")
        print(f"  Error: {e}")
        sys.exit(1)

    # Run tests
    test1_passed = test_birth_chart_generation()
    test2_passed = test_all_predictions()

    # Final summary
    print("\n" + "="*60)
    print("FINAL RESULTS")
    print("="*60)
    print(f"Birth Chart Generation: {'✓ PASS' if test1_passed else '✗ FAIL'}")
    print(f"Predictions Suite: {'✓ PASS' if test2_passed else '✗ FAIL'}")

    if test1_passed and test2_passed:
        print("\n✓ ALL TESTS PASSED - Platform is fully operational")
        sys.exit(0)
    else:
        print("\n✗ SOME TESTS FAILED - Please review errors above")
        sys.exit(1)


if __name__ == "__main__":
    main()

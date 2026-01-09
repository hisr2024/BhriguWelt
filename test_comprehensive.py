#!/usr/bin/env python3
"""
Comprehensive test for birth chart calculation
Tests all major components and edge cases
"""
import sys
import os

# Add paths
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
app_dir = os.path.join(os.path.dirname(__file__), 'app')
sys.path.insert(0, backend_dir)
sys.path.insert(0, app_dir)
sys.path.insert(0, os.path.dirname(__file__))

print("=" * 70)
print("COMPREHENSIVE BIRTH CHART CALCULATION TEST")
print("=" * 70)

test_cases = [
    {
        'name': 'New Delhi, India - Jan 15, 1990',
        'date': '1990-01-15',
        'time': '14:30',
        'lat': 28.6139,
        'lon': 77.2090,
        'tz': 'Asia/Kolkata',
        'expected': {
            'sun_sign': 'Capricorn',
            'moon_sign': 'Leo'
        }
    },
    {
        'name': 'New York, USA - Jul 4, 1990',
        'date': '1990-07-04',
        'time': '12:00',
        'lat': 40.7128,
        'lon': -74.0060,
        'tz': 'America/New_York'
    },
    {
        'name': 'Mumbai, India - Mar 21, 1985',
        'date': '1985-03-21',
        'time': '06:30',
        'lat': 19.0760,
        'lon': 72.8777,
        'tz': 'Asia/Kolkata'
    }
]

passed = 0
failed = 0

for idx, test in enumerate(test_cases, 1):
    print(f"\n{'='*70}")
    print(f"TEST {idx}: {test['name']}")
    print(f"{'='*70}")

    # Test with App Service (Swiss Ephemeris)
    print("\n[A] APP SERVICE (Swiss Ephemeris)")
    print("-" * 70)
    try:
        from app.domain.models import PersonInput, PlaceOfBirth
        from app.services.chart import ChartService

        person = PersonInput(
            name="Test Person",
            date_of_birth=test['date'],
            time_of_birth=test['time'],
            place_of_birth=PlaceOfBirth(
                city="Test City",
                country="Test Country",
                lat=test['lat'],
                lon=test['lon'],
                tz=test['tz']
            )
        )

        chart_service = ChartService()
        chart_data = chart_service.calculate_chart(person)
        chart_service.close()

        sun_sign = next(p for p in chart_data.planets if p.planet.value == 'Sun').sign.value
        moon_sign = next(p for p in chart_data.planets if p.planet.value == 'Moon').sign.value
        asc_sign = chart_data.ascendant.sign.value

        print(f"✓ SUCCESS")
        print(f"  Sun Sign:       {sun_sign}")
        print(f"  Moon Sign:      {moon_sign}")
        print(f"  Ascendant:      {asc_sign}")
        print(f"  Ayanamsa:       {chart_data.ayanamsa:.4f}°")
        print(f"  Julian Day:     {chart_data.julian_day:.4f}")

        # Store for comparison
        app_sun = sun_sign
        app_moon = moon_sign

    except Exception as e:
        print(f"✗ FAILED: {type(e).__name__}: {e}")
        app_sun = None
        app_moon = None

    # Test with Backend Service (ephem)
    print("\n[B] BACKEND SERVICE (ephem library)")
    print("-" * 70)
    try:
        from backend.services.astrology_calculator import AstrologyCalculator

        calc = AstrologyCalculator()
        chart = calc.calculate_birth_chart(
            date_of_birth=test['date'],
            time_of_birth=test['time'],
            place='',
            latitude=test['lat'],
            longitude=test['lon'],
            timezone_override=test['tz']
        )

        if 'error' in chart:
            print(f"✗ FAILED: {chart['error']}")
            backend_sun = None
            backend_moon = None
        else:
            print(f"✓ SUCCESS")
            print(f"  Sun Sign:       {chart['zodiac_sign']}")
            print(f"  Moon Sign:      {chart['moon_sign']}")
            print(f"  Ascendant:      {chart['ascendant']['sign']}")
            print(f"  Nakshatra:      {chart['nakshatra']} (Pada {chart['nakshatra_pada']})")

            backend_sun = chart['zodiac_sign']
            backend_moon = chart['moon_sign']

    except Exception as e:
        print(f"✗ FAILED: {type(e).__name__}: {e}")
        backend_sun = None
        backend_moon = None

    # Comparison
    print("\n[C] COMPARISON")
    print("-" * 70)
    if app_sun and backend_sun:
        sun_match = app_sun == backend_sun
        moon_match = app_moon == backend_moon

        print(f"  Sun Sign Match:  {'✓ PASS' if sun_match else '✗ FAIL'} ({app_sun} vs {backend_sun})")
        print(f"  Moon Sign Match: {'✓ PASS' if moon_match else '✗ FAIL'} ({app_moon} vs {backend_moon})")

        if sun_match and moon_match:
            passed += 1
            print(f"\n  ✓ TEST {idx} PASSED")
        else:
            failed += 1
            print(f"\n  ✗ TEST {idx} FAILED - Calculations don't match!")
    else:
        failed += 1
        print(f"  ✗ TEST {idx} FAILED - One or both services failed")

    # Validate against expected values if provided
    if 'expected' in test and app_sun:
        print("\n[D] EXPECTED VALUES VALIDATION")
        print("-" * 70)
        expected_sun = test['expected'].get('sun_sign')
        expected_moon = test['expected'].get('moon_sign')

        if expected_sun:
            match = app_sun == expected_sun
            print(f"  Expected Sun:    {'✓ MATCH' if match else '✗ MISMATCH'} ({expected_sun} vs {app_sun})")

        if expected_moon:
            match = app_moon == expected_moon
            print(f"  Expected Moon:   {'✓ MATCH' if match else '✗ MISMATCH'} ({expected_moon} vs {app_moon})")

print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)
print(f"Total Tests:  {len(test_cases)}")
print(f"Passed:       {passed}")
print(f"Failed:       {failed}")
print(f"Success Rate: {(passed/len(test_cases)*100):.1f}%")
print("=" * 70)

if failed == 0:
    print("\n✓ ALL TESTS PASSED!")
    sys.exit(0)
else:
    print(f"\n✗ {failed} TEST(S) FAILED")
    sys.exit(1)

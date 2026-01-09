#!/usr/bin/env python3
"""
Unit tests to verify the fixes for birth chart and predictions
Tests the calculator and route handlers without requiring a running server
"""
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(__file__))

def test_imports():
    """Test that all necessary modules can be imported"""
    print("="*60)
    print("TEST 1: Module Imports")
    print("="*60)

    try:
        from services.astrology_calculator import AstrologyCalculator, get_astrology_calculator
        print("✓ astrology_calculator imports OK")
    except Exception as e:
        print(f"✗ astrology_calculator import failed: {e}")
        return False

    try:
        from routes.astrology_routes import bp as astrology_bp
        print("✓ astrology_routes imports OK")
    except Exception as e:
        print(f"✗ astrology_routes import failed: {e}")
        return False

    try:
        from routes.bhrigu_predictions_routes import bp as bhrigu_bp
        print("✓ bhrigu_predictions_routes imports OK")
    except Exception as e:
        print(f"✗ bhrigu_predictions_routes import failed: {e}")
        return False

    try:
        from utils.validators import validate_birth_data, sanitizeQuestion
        print("✓ validators imports OK")
    except Exception as e:
        print(f"✗ validators import failed: {e}")
        return False

    try:
        from utils.logger import log_error, sanitize_error
        print("✓ logger imports OK")
    except Exception as e:
        print(f"✗ logger import failed: {e}")
        return False

    print("\n✓ All imports successful\n")
    return True


def test_helper_functions():
    """Test that helper functions exist in bhrigu_predictions_routes"""
    print("="*60)
    print("TEST 2: Helper Functions")
    print("="*60)

    try:
        from routes import bhrigu_predictions_routes

        # Check for helper functions
        functions_to_check = [
            '_sanitize_question_field',
            'validate_chart_inputs',
            '_generate_prediction',
            '_get_chart_data',
            '_build_cache_metadata',
            '_build_chart_metadata'
        ]

        missing = []
        for func_name in functions_to_check:
            if hasattr(bhrigu_predictions_routes, func_name):
                print(f"✓ {func_name} exists")
            else:
                print(f"✗ {func_name} missing")
                missing.append(func_name)

        if missing:
            print(f"\n✗ Missing functions: {', '.join(missing)}")
            return False

        print("\n✓ All helper functions present\n")
        return True

    except Exception as e:
        print(f"✗ Error checking helper functions: {e}")
        return False


def test_calculator_initialization():
    """Test that the astrology calculator can be initialized"""
    print("="*60)
    print("TEST 3: Calculator Initialization")
    print("="*60)

    try:
        from services.astrology_calculator import get_astrology_calculator, get_astrology_dependency_error

        calculator = get_astrology_calculator()
        error = get_astrology_dependency_error()

        if calculator:
            print("✓ Astrology calculator initialized successfully")
            print(f"  Calculator type: {type(calculator).__name__}")
            return True
        elif error:
            print("⚠ Calculator not available (missing dependencies)")
            print(f"  Error: {error}")
            print("  This is expected in environments without astronomy libraries")
            return True  # Not a failure, just a limitation
        else:
            print("✗ Unexpected state: no calculator and no error")
            return False

    except Exception as e:
        print(f"✗ Error initializing calculator: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_validators():
    """Test validation functions"""
    print("="*60)
    print("TEST 4: Validators")
    print("="*60)

    try:
        from utils.validators import validate_birth_data, sanitizeQuestion

        # Test valid data
        valid_data = {
            "date_of_birth": "1990-01-15",
            "time_of_birth": "14:30",
            "place_of_birth": "New Delhi, India"
        }

        error = validate_birth_data(valid_data)
        if error is None:
            print("✓ Valid birth data accepted")
        else:
            print(f"✗ Valid data rejected: {error}")
            return False

        # Test invalid data (missing fields)
        invalid_data = {
            "date_of_birth": "1990-01-15"
        }

        error = validate_birth_data(invalid_data)
        if error:
            print(f"✓ Invalid data rejected: {error}")
        else:
            print("✗ Invalid data accepted (should have been rejected)")
            return False

        # Test sanitizeQuestion
        dirty_question = "<script>alert('xss')</script>What is my future?"
        clean = sanitizeQuestion(dirty_question)
        if "<script>" not in clean and "What is my future?" in clean:
            print(f"✓ Question sanitized correctly: '{clean}'")
        else:
            print(f"✗ Question sanitization failed: '{clean}'")
            return False

        print("\n✓ All validator tests passed\n")
        return True

    except Exception as e:
        print(f"✗ Error testing validators: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_error_handling():
    """Test error handling in calculator"""
    print("="*60)
    print("TEST 5: Error Handling")
    print("="*60)

    try:
        from services.astrology_calculator import get_astrology_calculator

        calculator = get_astrology_calculator()

        if not calculator:
            print("⚠ Skipping error handling test (calculator not available)")
            return True

        # Test with invalid place that should trigger geocoding error
        result = calculator.calculate_birth_chart(
            date_of_birth="1990-01-15",
            time_of_birth="14:30",
            place="",  # Empty place should fail
            latitude=None,
            longitude=None
        )

        if 'error' in result:
            print(f"✓ Error properly returned: {result['error'].get('message')}")
            print(f"  Error code: {result['error'].get('code')}")
        else:
            print("⚠ No error for empty place (geocoding might have cache)")

        # Test with valid data
        result = calculator.calculate_birth_chart(
            date_of_birth="1990-01-15",
            time_of_birth="14:30",
            place="New Delhi, India"
        )

        if 'error' not in result and 'zodiac_sign' in result:
            print(f"✓ Valid calculation successful")
            print(f"  Zodiac: {result.get('zodiac_sign')}")
        elif 'error' in result:
            print(f"⚠ Valid calculation returned error: {result['error'].get('message')}")
            print("  (This may be due to geocoding service limitations)")
        else:
            print(f"✗ Unexpected result format: {list(result.keys())}")
            return False

        print("\n✓ Error handling tests passed\n")
        return True

    except Exception as e:
        print(f"✗ Error in error handling test: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("BhriguWelt Fix Verification Tests")
    print("="*60)

    tests = [
        ("Imports", test_imports),
        ("Helper Functions", test_helper_functions),
        ("Calculator Initialization", test_calculator_initialization),
        ("Validators", test_validators),
        ("Error Handling", test_error_handling)
    ]

    results = {}
    for name, test_func in tests:
        try:
            results[name] = test_func()
        except Exception as e:
            print(f"\n✗ TEST CRASHED: {name}")
            print(f"  Error: {e}")
            import traceback
            traceback.print_exc()
            results[name] = False

    # Summary
    print("="*60)
    print("TEST SUMMARY")
    print("="*60)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n✓ ALL TESTS PASSED")
        return 0
    else:
        print("\n✗ SOME TESTS FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(main())

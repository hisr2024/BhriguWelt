#!/usr/bin/env python3
"""
Test backend startup and service initialization
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

print("=" * 60)
print("Testing Backend Service Initialization")
print("=" * 60)

# Test 1: Corpus Loader
print("\n1. Testing Corpus Loader...")
try:
    from services.corpus_loader import get_corpus_loader
    result = get_corpus_loader()
    loader = result["loader"]
    if loader.corpus_loaded:
        print("   ✓ Corpus Loader initialized successfully")
        print(f"   ✓ Loaded {len(loader.bhrigu_data.get('principles', []))} Bhrigu principles")
        print(f"   ✓ Loaded {len(loader.nadi_data.get('principles', []))} Nadi principles")
    else:
        print("   ❌ Corpus Loader failed")
        if "error" in result:
            print(f"   Error: {result['error']}")
except Exception as e:
    print(f"   ❌ Corpus Loader error: {e}")
    import traceback
    traceback.print_exc()

# Test 2: Offline Wisdom Generator
print("\n2. Testing Offline Wisdom Generator...")
try:
    from services.bhrigu_offline_wisdom import get_offline_wisdom_generator
    offline_wisdom = get_offline_wisdom_generator()
    print("   ✓ Offline Wisdom Generator initialized successfully")

    # Test generation
    test_context = {
        "date_of_birth": "1990-01-01",
        "time_of_birth": "12:00",
        "place_of_birth": "Delhi",
        "moon_sign": "Taurus",
        "zodiac_sign": "Aries"
    }
    result = offline_wisdom.generate_prediction(test_context)
    if result.get("status") == "success":
        print("   ✓ Offline prediction generation works")
        prediction = result.get("prediction", "")
        print(f"   ✓ Generated {len(prediction)} character prediction")
    else:
        print(f"   ⚠️  Prediction generation returned: {result.get('status')}")
except Exception as e:
    print(f"   ❌ Offline Wisdom Generator error: {e}")
    import traceback
    traceback.print_exc()

# Test 3: Core Wisdom Database
print("\n3. Testing Core Wisdom Database...")
try:
    from services.wisdom_engine import get_wisdom_engine
    wisdom_engine = get_wisdom_engine()
    print("   ✓ Core Wisdom Database initialized successfully")
except Exception as e:
    print(f"   ❌ Core Wisdom Database error: {e}")
    import traceback
    traceback.print_exc()

# Test 4: Astrology Calculator
print("\n4. Testing Astrology Calculator...")
try:
    from services.astrology_calculator import AstrologyCalculator
    calc = AstrologyCalculator()
    print("   ✓ Astrology Calculator initialized successfully")

    # Test calculation
    birth_data = {
        "date_of_birth": "1990-01-01",
        "time_of_birth": "12:00",
        "place_of_birth": "Delhi"
    }
    chart = calc.calculate_chart(birth_data)
    if chart:
        print(f"   ✓ Chart calculation works")
        print(f"   ✓ Chart has {len(chart)} elements")
    else:
        print("   ⚠️  Chart calculation returned empty")
except Exception as e:
    print(f"   ⚠️  Astrology Calculator error: {e}")
    print("   Note: This may be expected if coordinates lookup fails")

# Test 5: Prediction Orchestrator
print("\n5. Testing Prediction Orchestrator...")
try:
    from services.prediction_orchestrator import PredictionOrchestrator
    orchestrator = PredictionOrchestrator()
    print("   ✓ Prediction Orchestrator initialized successfully")

    # Check components
    if orchestrator.offline_wisdom:
        print("   ✓ Offline wisdom component ready")
    if orchestrator.corpus_loader:
        print("   ✓ Corpus loader component ready")
    if orchestrator.wisdom_engine:
        print("   ✓ Wisdom engine component ready")
except Exception as e:
    print(f"   ❌ Prediction Orchestrator error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("✅ BACKEND STARTUP TEST COMPLETE")
print("=" * 60)

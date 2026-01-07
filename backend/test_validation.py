"""
Validation Test for Unified Predictions System
Tests all core components and prediction categories
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def test_service_initialization():
    """Test that all services initialize properly"""
    print("\n" + "="*60)
    print("Testing Service Initialization")
    print("="*60)
    
    try:
        # Test Prediction Orchestrator
        from services.prediction_orchestrator import get_prediction_orchestrator
        orchestrator = get_prediction_orchestrator()
        print("✓ Prediction Orchestrator initialized")
        
        # Test Core Wisdom
        from services.bhrigu_core_wisdom import get_bhrigu_core_wisdom
        core_wisdom = get_bhrigu_core_wisdom()
        print("✓ Core Wisdom initialized")
        print(f"  - Loaded {len(core_wisdom.rules_index.get('rules', []))} rules from index")
        
        # Test Rule Engine
        from services.rule_engine import get_rule_engine
        rule_engine = get_rule_engine()
        print("✓ Rule Engine initialized")
        
        # Test Offline Wisdom
        from services.bhrigu_offline_wisdom import get_offline_wisdom_generator
        offline_wisdom = get_offline_wisdom_generator()
        print("✓ Offline Wisdom Generator initialized")
        
        return True
    except Exception as e:
        print(f"✗ Service initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_categories():
    """Test that all categories are registered"""
    print("\n" + "="*60)
    print("Testing Category Registration")
    print("="*60)
    
    try:
        from services.prediction_orchestrator import get_prediction_orchestrator
        orchestrator = get_prediction_orchestrator()
        
        categories = orchestrator.get_supported_categories()
        print(f"✓ Found {len(categories)} registered categories:")
        
        for cat in categories:
            print(f"  - {cat['id']}: {cat['name']}")
        
        # Check for required categories
        required = ['karmic_journey', 'past_lives', 'future_lives', 'present_life',
                   'life_events', 'karmic_remedies', 'relationships', 'predictions']
        
        category_ids = [c['id'] for c in categories]
        missing = [r for r in required if r not in category_ids]
        
        if missing:
            print(f"✗ Missing required categories: {missing}")
            return False
        
        print("✓ All required categories present")
        return True
    except Exception as e:
        print(f"✗ Category test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_offline_prediction():
    """Test offline prediction generation"""
    print("\n" + "="*60)
    print("Testing Offline Prediction Generation")
    print("="*60)
    
    try:
        from services.prediction_orchestrator import get_prediction_orchestrator
        orchestrator = get_prediction_orchestrator()
        
        # Sample birth chart data
        test_chart = {
            'zodiac_sign': 'Leo',
            'nakshatra': 'Magha',
            'moon_sign': 'Leo',
            'date_of_birth': '1990-08-15',
            'age': 33
        }
        
        # Test karmic journey in offline mode
        print("\nTesting karmic_journey category (offline mode)...")
        result = orchestrator.generate_prediction(
            category='karmic_journey',
            chart_data=test_chart,
            mode='offline',
            language='en'
        )
        
        if result.get('status') == 'success':
            prediction = result.get('prediction', '')
            print(f"✓ Generated prediction ({len(prediction)} characters)")
            print(f"  - Mode: {result.get('mode')}")
            print(f"  - Source: {result.get('source')}")
            
            # Show a snippet
            snippet = prediction[:200] + "..." if len(prediction) > 200 else prediction
            print(f"\n  Preview:\n  {snippet}\n")
            
            return True
        else:
            print(f"✗ Prediction failed: {result}")
            return False
            
    except Exception as e:
        print(f"✗ Offline prediction test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_rule_engine():
    """Test rule engine evaluation"""
    print("\n" + "="*60)
    print("Testing Rule Engine")
    print("="*60)
    
    try:
        from services.rule_engine import get_rule_engine
        from services.bhrigu_core_wisdom import get_bhrigu_core_wisdom
        
        rule_engine = get_rule_engine()
        core_wisdom = get_bhrigu_core_wisdom()
        
        # Sample chart data with specific configurations
        test_chart = {
            'planets': {
                'Jupiter': {'house': 9, 'sign': 'Sagittarius', 'nakshatra': 'Moola'},
                'Venus': {'house': 7, 'sign': 'Libra', 'nakshatra': 'Swati'},
                'Sun': {'house': 10, 'sign': 'Leo', 'nakshatra': 'Magha'}
            },
            'houses': {
                'house_9': {'lord': 'Jupiter'},
                'house_7': {'lord': 'Venus'}
            },
            'nakshatra': 'Magha'
        }
        
        # Get rules and evaluate
        rules = core_wisdom.get_rules_for_category('spirituality', limit=10)
        print(f"\nEvaluating {len(rules)} spirituality rules...")
        
        matched_rules = rule_engine.evaluate_rules(rules, test_chart)
        
        print(f"✓ Matched {len(matched_rules)} rules:")
        for rule in matched_rules[:3]:  # Show top 3
            print(f"  - {rule['rule_id']} (priority {rule['priority']})")
            print(f"    {rule['interpretation'][:100]}...")
        
        return True
    except Exception as e:
        print(f"✗ Rule engine test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_core_wisdom_files():
    """Test that core wisdom files are present and valid"""
    print("\n" + "="*60)
    print("Testing Core Wisdom Files")
    print("="*60)
    
    try:
        import json
        core_wisdom_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'core_wisdom')
        
        # Check category rules
        categories = ['career', 'wealth', 'marriage', 'spirituality']
        for category in categories:
            path = os.path.join(core_wisdom_dir, 'bhrigu_samhita', 'rules', f'{category}_rules.json')
            if os.path.exists(path):
                with open(path, 'r') as f:
                    data = json.load(f)
                    print(f"✓ {category}_rules.json: {len(data.get('rules', []))} rules")
            else:
                print(f"✗ Missing: {category}_rules.json")
        
        # Check nakshatra rules
        nak_path = os.path.join(core_wisdom_dir, 'nadi_jyotisa', 'rules', 'nakshatra_rules.json')
        if os.path.exists(nak_path):
            with open(nak_path, 'r') as f:
                data = json.load(f)
                print(f"✓ nakshatra_rules.json: {len(data.get('nakshatras', []))} nakshatras")
        
        # Check remedies
        for remedy_type in ['mantras', 'gemstones']:
            path = os.path.join(core_wisdom_dir, 'remedies', f'{remedy_type}.json')
            if os.path.exists(path):
                with open(path, 'r') as f:
                    data = json.load(f)
                    count = len(data.get(remedy_type, []))
                    print(f"✓ {remedy_type}.json: {count} {remedy_type}")
        
        # Check glossaries
        for lang in ['en', 'hi', 'sa']:
            path = os.path.join(core_wisdom_dir, 'glossary', f'terms_{lang}.json')
            if os.path.exists(path):
                with open(path, 'r') as f:
                    data = json.load(f)
                    print(f"✓ terms_{lang}.json: {len(data.get('terms', {}))} terms")
        
        return True
    except Exception as e:
        print(f"✗ Core wisdom files test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all validation tests"""
    print("\n" + "="*60)
    print("BhriguWelt Unified Predictions System - Validation Test")
    print("="*60)
    
    results = {
        'Service Initialization': test_service_initialization(),
        'Category Registration': test_categories(),
        'Core Wisdom Files': test_core_wisdom_files(),
        'Rule Engine': test_rule_engine(),
        'Offline Prediction': test_offline_prediction()
    }
    
    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All validation tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == '__main__':
    sys.exit(main())

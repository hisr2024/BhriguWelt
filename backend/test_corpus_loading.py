#!/usr/bin/env python3
"""
Test corpus loading independently
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from services.corpus_loader import get_corpus_loader

def test_corpus_loading():
    print("=" * 60)
    print("Testing Corpus Loading")
    print("=" * 60)

    # Get corpus loader
    result = get_corpus_loader()
    loader = result["loader"]

    print(f"\n1. Corpus Loaded: {loader.corpus_loaded}")
    print(f"2. Corpus Base Path: {loader.corpus_base_path}")
    print(f"3. Search Paths: {loader.search_paths}")

    if loader.initialization_errors:
        print(f"\n⚠️  Initialization Errors:")
        for error in loader.initialization_errors:
            print(f"   - {error}")

    if loader.missing_files:
        print(f"\n⚠️  Missing Files:")
        for file in loader.missing_files:
            print(f"   - {file}")

    # Test Bhrigu data
    if loader.bhrigu_data:
        print(f"\n✓ Bhrigu Data Loaded:")
        print(f"   - Metadata: {loader.bhrigu_data.get('metadata', {}).get('title', 'N/A')}")
        bhrigu_principles = loader.bhrigu_data.get("principles", [])
        print(f"   - Principles: {len(bhrigu_principles)}")
        if bhrigu_principles:
            print(f"   - First Principle ID: {bhrigu_principles[0].get('id', 'N/A')}")
    else:
        print("\n❌ Bhrigu Data NOT Loaded")

    # Test Nadi data
    if loader.nadi_data:
        print(f"\n✓ Nadi Data Loaded:")
        print(f"   - Metadata: {loader.nadi_data.get('metadata', {}).get('title', 'N/A')}")
        nadi_principles = loader.nadi_data.get("principles", [])
        print(f"   - Principles: {len(nadi_principles)}")
        if nadi_principles:
            print(f"   - First Principle ID: {nadi_principles[0].get('id', 'N/A')}")
    else:
        print("\n❌ Nadi Data NOT Loaded")

    # Test retrieval methods
    print("\n" + "=" * 60)
    print("Testing Retrieval Methods")
    print("=" * 60)

    context = {
        "moon_sign": "Taurus",
        "zodiac_sign": "Aries",
        "nakshatra": "Ashwini"
    }

    bhrigu_principles = loader.get_relevant_bhrigu_principles(context, limit=3)
    print(f"\n✓ Retrieved {len(bhrigu_principles)} Bhrigu principles")

    nadi_principles = loader.get_relevant_nadi_principles(context, limit=3)
    print(f"✓ Retrieved {len(nadi_principles)} Nadi principles")

    past_life = loader.get_past_life_engines(context, limit=2)
    print(f"✓ Retrieved {len(past_life)} past life engines")

    future_life = loader.get_future_engines(context, limit=2)
    print(f"✓ Retrieved {len(future_life)} future life engines")

    remedies = loader.get_remedies(context, limit=3)
    print(f"✓ Retrieved {len(remedies)} remedies")

    # Final verdict
    print("\n" + "=" * 60)
    if loader.corpus_loaded:
        print("✅ CORPUS LOADING TEST: PASSED")
    else:
        print("❌ CORPUS LOADING TEST: FAILED")
    print("=" * 60)

    return loader.corpus_loaded

if __name__ == "__main__":
    success = test_corpus_loading()
    sys.exit(0 if success else 1)

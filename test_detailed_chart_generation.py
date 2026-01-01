#!/usr/bin/env python3
"""
Test script for detailed birth chart and horoscope generation.

Tests the generation pipeline with 3 diverse profiles and saves outputs
for verification and documentation.
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend" / "src"
sys.path.insert(0, str(backend_path))

from bhriguwelt.horoscope import HoroscopeRequest, build_prediction
from bhriguwelt.api import _serialize_horoscope_report, _enhance_with_ai
from bhriguwelt.ai_client import ai_provider_metadata


def setup_output_dir():
    """Create output directory for test results."""
    output_dir = Path(__file__).parent / "docs" / "test-outputs"
    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def create_test_profiles():
    """Create 3 diverse test profiles for comprehensive testing."""
    return [
        {
            "name": "Test Profile 1 - Young Adult",
            "profile_data": {
                "name": "Arjun Kumar",
                "birth_date": "2000-03-15",
                "birth_time": "08:30",
                "birth_place": "Mumbai, India",
                "timezone": "Asia/Kolkata",
                "tradition": "universal",
            },
            "description": "24-year-old, early career phase, modern urban background"
        },
        {
            "name": "Test Profile 2 - Middle-Aged Professional",
            "profile_data": {
                "name": "Priya Sharma",
                "birth_date": "1985-07-22",
                "birth_time": "14:45",
                "birth_place": "Delhi, India",
                "timezone": "Asia/Kolkata",
                "tradition": "universal",
            },
            "description": "39-year-old, established career, family phase"
        },
        {
            "name": "Test Profile 3 - Senior Individual",
            "profile_data": {
                "name": "Rajesh Patel",
                "birth_date": "1960-11-08",
                "birth_time": "06:15",
                "birth_place": "Ahmedabad, India",
                "timezone": "Asia/Kolkata",
                "tradition": "universal",
            },
            "description": "64-year-old, retirement phase, life reflection"
        }
    ]


def generate_chart_for_profile(profile_data, output_dir, profile_name):
    """Generate detailed chart for a single profile and save results."""
    print(f"\n{'='*80}")
    print(f"Testing: {profile_name}")
    print(f"{'='*80}")

    # Step 1: Create request
    print(f"\n[1/5] Creating HoroscopeRequest...")
    request = HoroscopeRequest(**profile_data)
    print(f"  ✓ Request created for {request.name}")

    # Step 2: Build prediction (core engine)
    print(f"\n[2/5] Building horoscope prediction...")
    start_time = datetime.now()
    report = build_prediction(request)
    core_duration = (datetime.now() - start_time).total_seconds()
    print(f"  ✓ Core prediction built in {core_duration:.2f}s")
    print(f"    - Karmic Epoch: {report.karmic_epoch}")
    print(f"    - Principles: {len(report.principles)}")
    print(f"    - Past Life Insights: {len(report.past_life_insights)}")
    print(f"    - Future Trajectories: {len(report.future_trajectories)}")
    print(f"    - Remedies: {len(report.remedies)}")

    # Step 3: Serialize response
    print(f"\n[3/5] Serializing horoscope report...")
    response = _serialize_horoscope_report(report)
    print(f"  ✓ Report serialized")

    # Step 4: Enhance with detailed AI chart
    print(f"\n[4/5] Enhancing with detailed AI chart generation...")
    ai_metadata = ai_provider_metadata()
    print(f"  AI Provider: {ai_metadata.get('provider', 'unknown')}")
    print(f"  AI Configured: {ai_metadata.get('configured', False)}")

    if not ai_metadata.get("configured"):
        print(f"  ⚠️  WARNING: AI not configured - detailed chart generation will be skipped")
        print(f"  Set AI_API_KEY environment variable to enable AI enhancement")
        enhanced_response = response
    else:
        start_time = datetime.now()
        try:
            enhanced_response = _enhance_with_ai(
                response,
                "horoscope",
                profile_data
            )
            ai_duration = (datetime.now() - start_time).total_seconds()
            print(f"  ✓ AI enhancement completed in {ai_duration:.2f}s")

            # Check for detailed_chart
            if "detailed_chart" in enhanced_response:
                dc = enhanced_response["detailed_chart"]
                print(f"\n  DETAILED CHART SUMMARY:")
                print(f"    - Correlation ID: {dc.get('correlation_id', 'N/A')}")
                print(f"    - Schema Valid: {dc.get('schema_valid', False)}")
                print(f"    - Retry Count: {dc.get('retry_count', 0)}")
                print(f"    - Personality Themes: {len(dc.get('key_personality_themes', []))}")
                print(f"    - Life Areas: {len(dc.get('life_areas', {}))}")
                print(f"    - Bhrigu Indicators: {len(dc.get('yogas_or_bhrigu_indicators', []))}")
                print(f"    - Year-wise Events: {len(dc.get('yearwise_major_events', []))}")

                # Print first personality theme as sample
                themes = dc.get('key_personality_themes', [])
                if themes:
                    print(f"\n  SAMPLE PERSONALITY THEME:")
                    print(f"    {themes[0][:150]}...")

                # Print career guidance excerpt
                life_areas = dc.get('life_areas', {})
                if 'career' in life_areas:
                    career = life_areas['career']
                    print(f"\n  CAREER ANALYSIS:")
                    print(f"    - Strengths: {len(career.get('strengths', []))}")
                    print(f"    - Challenges: {len(career.get('challenges', []))}")
                    print(f"    - Turning Points: {len(career.get('turning_points', []))}")
                    guidance = career.get('guidance', '')
                    if guidance:
                        print(f"    - Guidance (excerpt): {guidance[:200]}...")
            else:
                print(f"  ⚠️  WARNING: No detailed_chart in enhanced response")
        except Exception as e:
            print(f"  ✗ AI enhancement failed: {str(e)}")
            import traceback
            traceback.print_exc()
            enhanced_response = response

    # Step 5: Save output
    print(f"\n[5/5] Saving output...")
    output_file = output_dir / f"birth-horo-{profile_name.replace(' ', '-').lower()}.json"

    # Prepare output with metadata
    output_data = {
        "test_metadata": {
            "profile_name": profile_name,
            "test_timestamp": datetime.now().isoformat(),
            "core_generation_time_seconds": core_duration,
        },
        "request": {
            "name": request.name,
            "birth_date": request.birth_date,
            "birth_time": request.birth_time,
            "birth_place": request.birth_place,
            "timezone": request.timezone,
            "tradition": request.tradition,
        },
        "response": enhanced_response
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False, default=str)

    file_size_kb = output_file.stat().st_size / 1024
    print(f"  ✓ Output saved to: {output_file}")
    print(f"    File size: {file_size_kb:.2f} KB")

    return {
        "profile_name": profile_name,
        "output_file": str(output_file),
        "file_size_kb": file_size_kb,
        "core_duration": core_duration,
        "has_detailed_chart": "detailed_chart" in enhanced_response,
        "schema_valid": enhanced_response.get("detailed_chart", {}).get("schema_valid", None),
        "personality_themes_count": len(enhanced_response.get("detailed_chart", {}).get("key_personality_themes", [])),
        "yearwise_events_count": len(enhanced_response.get("detailed_chart", {}).get("yearwise_major_events", [])),
    }


def main():
    """Run comprehensive tests on detailed chart generation."""
    print("="*80)
    print("DETAILED BIRTH CHART GENERATION TEST SUITE")
    print("="*80)
    print(f"Started at: {datetime.now().isoformat()}")

    # Setup
    output_dir = setup_output_dir()
    print(f"\nOutput directory: {output_dir}")

    # Check AI configuration
    ai_metadata = ai_provider_metadata()
    print(f"\nAI Configuration:")
    print(f"  Provider: {ai_metadata.get('provider', 'unknown')}")
    print(f"  Configured: {ai_metadata.get('configured', False)}")
    print(f"  API Base: {ai_metadata.get('api_base', 'not set')}")

    if not ai_metadata.get("configured"):
        print(f"\n⚠️  WARNING: AI is not configured!")
        print(f"Set environment variable AI_API_KEY or SARVAM_API_KEY to enable detailed chart generation")
        print(f"Proceeding with tests, but AI enhancement will be skipped...\n")

    # Run tests
    profiles = create_test_profiles()
    results = []

    for i, profile in enumerate(profiles, 1):
        try:
            result = generate_chart_for_profile(
                profile["profile_data"],
                output_dir,
                profile["name"]
            )
            result["description"] = profile["description"]
            result["success"] = True
            results.append(result)
        except Exception as e:
            print(f"\n✗ Test failed for {profile['name']}: {str(e)}")
            import traceback
            traceback.print_exc()
            results.append({
                "profile_name": profile["name"],
                "description": profile["description"],
                "success": False,
                "error": str(e)
            })

    # Summary
    print(f"\n{'='*80}")
    print(f"TEST SUMMARY")
    print(f"{'='*80}")

    successful = sum(1 for r in results if r.get("success"))
    print(f"\nTests completed: {len(results)}")
    print(f"Successful: {successful}")
    print(f"Failed: {len(results) - successful}")

    print(f"\nDETAILED RESULTS:")
    for result in results:
        print(f"\n  {result['profile_name']}:")
        print(f"    Description: {result.get('description', 'N/A')}")
        print(f"    Success: {result.get('success', False)}")

        if result.get("success"):
            print(f"    Output File: {result.get('output_file', 'N/A')}")
            print(f"    File Size: {result.get('file_size_kb', 0):.2f} KB")
            print(f"    Core Generation Time: {result.get('core_duration', 0):.2f}s")
            print(f"    Has Detailed Chart: {result.get('has_detailed_chart', False)}")
            print(f"    Schema Valid: {result.get('schema_valid', 'N/A')}")
            print(f"    Personality Themes: {result.get('personality_themes_count', 0)}")
            print(f"    Year-wise Events: {result.get('yearwise_events_count', 0)}")
        else:
            print(f"    Error: {result.get('error', 'Unknown error')}")

    # Save summary
    summary_file = output_dir / "test-summary.json"
    summary_data = {
        "test_run_timestamp": datetime.now().isoformat(),
        "total_tests": len(results),
        "successful_tests": successful,
        "failed_tests": len(results) - successful,
        "ai_configured": ai_metadata.get("configured", False),
        "results": results
    }

    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary_data, f, indent=2, ensure_ascii=False, default=str)

    print(f"\n✓ Test summary saved to: {summary_file}")
    print(f"\nCompleted at: {datetime.now().isoformat()}")

    # Return exit code
    return 0 if successful == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())

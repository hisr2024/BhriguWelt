#!/usr/bin/env python3
"""
Generate golden test outputs for all test fixtures.
This script runs all fixtures through all engines and saves outputs.
"""
import json
import sys
from pathlib import Path
from datetime import date

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.domain.models import BirthInfo
from app.services.chart import ChartService
from app.services.horoscope import HoroscopeService
from app.services.matchmaking import MatchmakingService
from app.services.daily_insights import DailyInsightsService


FIXTURES_DIR = Path(__file__).parent.parent / "tests" / "fixtures"
GOLDEN_DIR = Path(__file__).parent.parent / "tests" / "golden" / "generated"


def load_birth_info(filename: str) -> BirthInfo:
    """Load birth info from fixture file."""
    filepath = FIXTURES_DIR / filename
    with open(filepath) as f:
        data = json.load(f)
    return BirthInfo(**data)


def save_json(data, filepath: Path):
    """Save data as JSON."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2, default=str)


def save_text(content: str, filepath: Path):
    """Save text content."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, 'w') as f:
        f.write(content)


def generate_chart_outputs():
    """Generate chart outputs for all fixtures."""
    print("\n=== Generating Chart Outputs ===")

    chart_service = ChartService()
    fixtures = [
        "person1_raj.json",
        "person2_priya.json",
        "person3_amit.json",
        "person4_anjali.json",
        "person5_vikram.json",
        "person6_meera.json"
    ]

    for fixture_file in fixtures:
        print(f"Processing {fixture_file}...")
        birth_info = load_birth_info(fixture_file)

        # Calculate chart
        chart = chart_service.calculate_chart(birth_info)

        # Save JSON
        base_name = fixture_file.replace('.json', '')
        json_path = GOLDEN_DIR / "charts" / f"{base_name}_chart.json"
        save_json(chart.model_dump(mode='json'), json_path)

        print(f"  ✓ Saved chart to {json_path}")

    chart_service.close()
    print("Chart generation complete!\n")


def generate_horoscope_outputs():
    """Generate horoscope outputs for all fixtures."""
    print("\n=== Generating Horoscope Outputs ===")

    horoscope_service = HoroscopeService()
    fixtures = [
        "person1_raj.json",
        "person2_priya.json",
        "person3_amit.json"  # Limit to 3 for golden outputs
    ]

    for fixture_file in fixtures:
        print(f"Processing {fixture_file}...")
        birth_info = load_birth_info(fixture_file)

        # Generate horoscope
        horoscope = horoscope_service.generate_horoscope(birth_info)

        # Save JSON
        base_name = fixture_file.replace('.json', '')
        json_path = GOLDEN_DIR / "horoscopes" / f"{base_name}_horoscope.json"
        save_json(horoscope.model_dump(mode='json'), json_path)

        # Save text summary
        text_content = f"HOROSCOPE FOR {birth_info.name}\n\n"
        text_content += "SUMMARY:\n"
        for bullet in horoscope.summary_bullets:
            text_content += f"  • {bullet}\n"
        text_content += f"\nTotal Domains Analyzed: {len(horoscope.domains)}\n"
        text_content += f"Total Rules Matched: {sum(len(d.rule_traces) for d in horoscope.domains)}\n"

        text_path = GOLDEN_DIR / "horoscopes" / f"{base_name}_horoscope.txt"
        save_text(text_content, text_path)

        print(f"  ✓ Saved horoscope to {json_path}")
        print(f"  ✓ Saved summary to {text_path}")

    horoscope_service.close()
    print("Horoscope generation complete!\n")


def generate_matchmaking_outputs():
    """Generate matchmaking outputs for couples."""
    print("\n=== Generating Matchmaking Outputs ===")

    matchmaking_service = MatchmakingService()
    couples = [
        ("person1_raj.json", "person2_priya.json", "couple1_raj_priya"),
        ("person3_amit.json", "person4_anjali.json", "couple2_amit_anjali"),
        ("person5_vikram.json", "person6_meera.json", "couple3_vikram_meera")
    ]

    for partner_a_file, partner_b_file, couple_name in couples:
        print(f"Processing {couple_name}...")
        partner_a = load_birth_info(partner_a_file)
        partner_b = load_birth_info(partner_b_file)

        # Analyze compatibility
        result = matchmaking_service.analyze_compatibility(partner_a, partner_b)

        # Save JSON
        json_path = GOLDEN_DIR / "matchmaking" / f"{couple_name}.json"
        save_json(result.model_dump(mode='json'), json_path)

        # Save text summary
        text_content = f"MATCHMAKING ANALYSIS: {partner_a.name} & {partner_b.name}\n\n"
        text_content += f"Overall Compatibility: {result.overall_compatibility}/100\n\n"
        text_content += "Synastry Rules:\n"
        for rule in result.synastry_rules:
            text_content += f"  • {rule.description}: {rule.compatibility_score}/100\n"

        text_path = GOLDEN_DIR / "matchmaking" / f"{couple_name}.txt"
        save_text(text_content, text_path)

        print(f"  ✓ Saved matchmaking to {json_path}")
        print(f"  ✓ Saved summary to {text_path}")

    matchmaking_service.close()
    print("Matchmaking generation complete!\n")


def generate_daily_insights_outputs():
    """Generate daily insights outputs."""
    print("\n=== Generating Daily Insights Outputs ===")

    daily_insights_service = DailyInsightsService()
    fixtures = [
        "person1_raj.json",
        "person2_priya.json"
    ]

    target_date = date(2025, 1, 15)  # Fixed date for reproducibility

    for fixture_file in fixtures:
        print(f"Processing {fixture_file}...")
        birth_info = load_birth_info(fixture_file)

        # Generate insights
        insights = daily_insights_service.generate_daily_insights(birth_info, target_date)

        # Save JSON
        base_name = fixture_file.replace('.json', '')
        json_path = GOLDEN_DIR / "daily_insights" / f"{base_name}_insights.json"
        save_json(insights.model_dump(mode='json'), json_path)

        # Save text summary
        text_content = f"DAILY INSIGHTS FOR {birth_info.name}\n"
        text_content += f"Date: {insights.today.date}\n\n"
        text_content += f"Energy Level: {insights.today.energy_level}\n\n"
        text_content += "Focus Areas:\n"
        for area in insights.today.focus_areas:
            text_content += f"  • {area}\n"

        text_path = GOLDEN_DIR / "daily_insights" / f"{base_name}_insights.txt"
        save_text(text_content, text_path)

        print(f"  ✓ Saved insights to {json_path}")
        print(f"  ✓ Saved summary to {text_path}")

    daily_insights_service.close()
    print("Daily insights generation complete!\n")


def main():
    """Main entry point."""
    print("\n" + "="*80)
    print("GOLDEN OUTPUT GENERATOR")
    print("Generating test outputs for all fixtures")
    print("="*80)

    try:
        # Create golden directory
        GOLDEN_DIR.mkdir(parents=True, exist_ok=True)

        # Generate all outputs
        generate_chart_outputs()
        generate_horoscope_outputs()
        generate_matchmaking_outputs()
        generate_daily_insights_outputs()

        print("\n" + "="*80)
        print("✅ ALL GOLDEN OUTPUTS GENERATED SUCCESSFULLY!")
        print(f"Output location: {GOLDEN_DIR}")
        print("="*80 + "\n")

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

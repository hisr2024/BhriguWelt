"""
Command-Line Interface for the astrology system.
Provides interactive commands for chart calculation, horoscope generation, etc.
"""
import argparse
import json
import sys
from datetime import date, datetime
from pathlib import Path
from app.domain.models import BirthInfo
from app.services.chart import ChartService
from app.services.horoscope import HoroscopeService
from app.services.matchmaking import MatchmakingService
from app.services.daily_insights import DailyInsightsService


def load_birth_info_from_file(filepath: str) -> BirthInfo:
    """Load birth information from JSON file."""
    with open(filepath, 'r') as f:
        data = json.load(f)
    return BirthInfo(**data)


def print_chart(chart_service: ChartService, birth_info: BirthInfo):
    """Calculate and print birth chart."""
    chart = chart_service.calculate_chart(birth_info)

    print(f"\n{'='*80}")
    print(f"BIRTH CHART FOR {birth_info.name}")
    print(f"{'='*80}\n")

    print(f"Birth Date: {birth_info.date_of_birth}")
    print(f"Birth Time: {birth_info.time_of_birth} ({birth_info.timezone})")
    print(f"Birth Place: {birth_info.latitude}°N, {birth_info.longitude}°E\n")

    print(f"Ascendant: {chart.ascendant.value} ({chart.ascendant_longitude:.2f}°)\n")

    print("PLANETARY POSITIONS:")
    print(f"{'Planet':<12} {'Sign':<12} {'House':<7} {'Degree':<10} {'Nakshatra':<20} {'Pada':<5} {'Retro'}")
    print("-" * 90)
    for planet_pos in chart.planets:
        retro = "R" if planet_pos.retrograde else ""
        print(
            f"{planet_pos.planet.value:<12} "
            f"{planet_pos.sign.value:<12} "
            f"{planet_pos.house:<7} "
            f"{planet_pos.degree_in_sign:>6.2f}° "
            f"{planet_pos.nakshatra.value:<20} "
            f"{planet_pos.nakshatra_pada:<5} "
            f"{retro}"
        )

    print("\nHOUSE CUSPS:")
    print(f"{'House':<7} {'Sign':<12} {'Degree'}")
    print("-" * 35)
    for cusp in chart.house_cusps:
        print(f"{cusp.house:<7} {cusp.sign.value:<12} {cusp.degree_in_sign:>6.2f}°")

    chart_service.close()


def print_horoscope(horoscope_service: HoroscopeService, birth_info: BirthInfo, output_file: str = None):
    """Generate and print horoscope."""
    horoscope = horoscope_service.generate_horoscope(birth_info)

    output = f"\n{'='*80}\n"
    output += f"COMPREHENSIVE HOROSCOPE FOR {birth_info.name}\n"
    output += f"{'='*80}\n\n"

    output += "SUMMARY:\n"
    for bullet in horoscope.summary_bullets:
        output += f"  • {bullet}\n"
    output += "\n"

    output += f"ASCENDANT: {horoscope.chart_summary['ascendant']} "
    output += f"({horoscope.chart_summary['ascendant_degree']}°)\n\n"

    output += f"MOON NAKSHATRA: {horoscope.nakshatra_summary['moon_nakshatra']} "
    output += f"(Pada {horoscope.nakshatra_summary['moon_pada']})\n"
    output += f"SUN NAKSHATRA: {horoscope.nakshatra_summary['sun_nakshatra']}\n\n"

    # Dasha information
    if horoscope.dasha_timeline:
        output += "CURRENT DASHA PERIODS:\n"
        output += f"  Maha Dasha: {horoscope.dasha_timeline.current_maha_dasha.planet.value} "
        output += f"({horoscope.dasha_timeline.current_maha_dasha.start_date} to "
        output += f"{horoscope.dasha_timeline.current_maha_dasha.end_date})\n"
        output += f"  Antar Dasha: {horoscope.dasha_timeline.current_antar_dasha.planet.value} "
        output += f"({horoscope.dasha_timeline.current_antar_dasha.start_date} to "
        output += f"{horoscope.dasha_timeline.current_antar_dasha.end_date})\n\n"

    # Domain analyses
    for domain_analysis in horoscope.domains:
        output += f"\n{'-'*80}\n"
        output += f"{domain_analysis.domain.upper()}\n"
        output += f"{'-'*80}\n\n"
        output += f"Summary: {domain_analysis.summary}\n\n"
        output += "Detailed Analysis:\n"
        output += domain_analysis.detailed_narrative + "\n"

        if domain_analysis.timing_windows:
            output += "\nTiming Windows:\n"
            for window in domain_analysis.timing_windows:
                output += f"  • {window}\n"

    output += f"\n{'='*80}\n"
    output += "DISCLAIMERS:\n"
    for disclaimer in horoscope.disclaimers:
        output += f"  • {disclaimer}\n"

    print(output)

    if output_file:
        with open(output_file, 'w') as f:
            f.write(output)
        print(f"\nHoroscope saved to: {output_file}")

    # Also save JSON
    if output_file:
        json_file = output_file.replace('.txt', '.json')
        with open(json_file, 'w') as f:
            json.dump(horoscope.model_dump(mode='json'), f, indent=2, default=str)
        print(f"JSON saved to: {json_file}")

    horoscope_service.close()


def print_matchmaking(
    matchmaking_service: MatchmakingService,
    partner_a: BirthInfo,
    partner_b: BirthInfo,
    output_file: str = None
):
    """Analyze and print matchmaking compatibility."""
    result = matchmaking_service.analyze_compatibility(partner_a, partner_b)

    output = f"\n{'='*80}\n"
    output += f"MARRIAGE COMPATIBILITY ANALYSIS\n"
    output += f"{partner_a.name} & {partner_b.name}\n"
    output += f"{'='*80}\n\n"

    output += f"OVERALL COMPATIBILITY SCORE: {result.overall_compatibility}/100\n\n"

    output += f"{partner_a.name.upper()} ANALYSIS:\n"
    output += f"  {result.partner_a_analysis.personality_summary}\n"
    output += f"  Marriage House: {result.partner_a_analysis.marriage_house_analysis}\n"
    output += f"  Venus: {result.partner_a_analysis.venus_analysis}\n\n"

    output += f"{partner_b.name.upper()} ANALYSIS:\n"
    output += f"  {result.partner_b_analysis.personality_summary}\n"
    output += f"  Marriage House: {result.partner_b_analysis.marriage_house_analysis}\n"
    output += f"  Venus: {result.partner_b_analysis.venus_analysis}\n\n"

    output += "SYNASTRY ANALYSIS:\n"
    for rule in result.synastry_rules:
        output += f"  • {rule.description} (Score: {rule.compatibility_score}/100)\n"
        output += f"    {rule.narrative}\n"

    output += "\nMARRIAGE STABILITY INDICATORS:\n"
    for indicator in result.marriage_stability_indicators:
        output += f"  • {indicator}\n"

    output += "\nTIMING WINDOWS:\n"
    for window in result.timing_overlap_windows:
        output += f"  • {window}\n"

    output += "\nCAUTIONS:\n"
    for caution in result.cautions:
        output += f"  • {caution}\n"

    output += "\nRECOMMENDED MITIGATIONS:\n"
    for mitigation in result.mitigations:
        output += f"  • {mitigation}\n"

    print(output)

    if output_file:
        with open(output_file, 'w') as f:
            f.write(output)
        print(f"\nMatchmaking analysis saved to: {output_file}")

        json_file = output_file.replace('.txt', '.json')
        with open(json_file, 'w') as f:
            json.dump(result.model_dump(mode='json'), f, indent=2, default=str)
        print(f"JSON saved to: {json_file}")

    matchmaking_service.close()


def print_daily_insights(
    daily_insights_service: DailyInsightsService,
    birth_info: BirthInfo,
    target_date: date = None,
    output_file: str = None
):
    """Generate and print daily insights."""
    insights = daily_insights_service.generate_daily_insights(birth_info, target_date)

    output = f"\n{'='*80}\n"
    output += f"DAILY INSIGHTS FOR {birth_info.name}\n"
    output += f"{'='*80}\n\n"

    output += f"TODAY ({insights.today.date}):\n"
    output += f"Energy Level: {insights.today.energy_level.upper()}\n\n"

    output += "Focus Areas:\n"
    for area in insights.today.focus_areas:
        output += f"  • {area}\n"

    output += "\nDO:\n"
    for item in insights.today.do_list:
        output += f"  ✓ {item}\n"

    output += "\nDON'T:\n"
    for item in insights.today.dont_list:
        output += f"  ✗ {item}\n"

    if insights.today.transit_triggers:
        output += "\nTransit Influences:\n"
        for trigger in insights.today.transit_triggers:
            output += f"  • {trigger.transit_planet.value}: {trigger.narrative}\n"

    output += f"\n{'-'*80}\n"
    output += "NEXT 7 DAYS OVERVIEW:\n"
    output += f"{'-'*80}\n\n"

    for day_insight in insights.next_7_days:
        output += f"{day_insight.date} ({day_insight.energy_level} energy):\n"
        output += f"  Focus: {', '.join(day_insight.focus_areas)}\n"

    print(output)

    if output_file:
        with open(output_file, 'w') as f:
            f.write(output)
        print(f"\nDaily insights saved to: {output_file}")

        json_file = output_file.replace('.txt', '.json')
        with open(json_file, 'w') as f:
            json.dump(insights.model_dump(mode='json'), f, indent=2, default=str)
        print(f"JSON saved to: {json_file}")

    daily_insights_service.close()


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Nadi Jyotisha & Bhrigu Samhita Astrology System CLI"
    )

    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Chart command
    chart_parser = subparsers.add_parser('chart', help='Calculate birth chart')
    chart_parser.add_argument('--file', required=True, help='JSON file with birth info')

    # Horoscope command
    horoscope_parser = subparsers.add_parser('horoscope', help='Generate horoscope')
    horoscope_parser.add_argument('--file', required=True, help='JSON file with birth info')
    horoscope_parser.add_argument('--output', help='Output file path (optional)')

    # Matchmaking command
    match_parser = subparsers.add_parser('matchmaking', help='Analyze compatibility')
    match_parser.add_argument('--partner-a', required=True, help='JSON file for partner A')
    match_parser.add_argument('--partner-b', required=True, help='JSON file for partner B')
    match_parser.add_argument('--output', help='Output file path (optional)')

    # Daily insights command
    daily_parser = subparsers.add_parser('daily-insights', help='Generate daily insights')
    daily_parser.add_argument('--file', required=True, help='JSON file with birth info')
    daily_parser.add_argument('--date', help='Target date (YYYY-MM-DD, default: today)')
    daily_parser.add_argument('--output', help='Output file path (optional)')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    try:
        if args.command == 'chart':
            birth_info = load_birth_info_from_file(args.file)
            chart_service = ChartService()
            print_chart(chart_service, birth_info)

        elif args.command == 'horoscope':
            birth_info = load_birth_info_from_file(args.file)
            horoscope_service = HoroscopeService()
            print_horoscope(horoscope_service, birth_info, args.output)

        elif args.command == 'matchmaking':
            partner_a = load_birth_info_from_file(args.partner_a)
            partner_b = load_birth_info_from_file(args.partner_b)
            matchmaking_service = MatchmakingService()
            print_matchmaking(matchmaking_service, partner_a, partner_b, args.output)

        elif args.command == 'daily-insights':
            birth_info = load_birth_info_from_file(args.file)
            target_date = None
            if args.date:
                target_date = datetime.strptime(args.date, '%Y-%m-%d').date()
            daily_insights_service = DailyInsightsService()
            print_daily_insights(daily_insights_service, birth_info, target_date, args.output)

    except FileNotFoundError as e:
        print(f"Error: File not found - {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

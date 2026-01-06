"""
Command-line interface for the Bhrigu-Nadi Astrology System.
Provides offline command-line access to all engines.
"""

import argparse
import json
import sys
from pathlib import Path

from app.domain.models import PersonInput, MatchMakingInput
from app.services.chart import ChartService
from app.services.horoscope import HoroscopeService
from app.services.matchmaking import MatchMakingService
from app.services.daily_insights import DailyInsightsService
from app.config import REFUSAL_MESSAGE


def load_person_input(file_path: str) -> PersonInput:
    """Load PersonInput from JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return PersonInput(**data)
    except Exception as e:
        print(f"Error loading input file: {e}", file=sys.stderr)
        sys.exit(1)


def save_output(data: dict, output_file: str = None):
    """Save output to file or print to stdout."""
    json_output = json.dumps(data, indent=2, ensure_ascii=False, default=str)

    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(json_output)
        print(f"Output saved to {output_file}")
    else:
        print(json_output)


def cmd_chart(args):
    """Generate birth chart."""
    person = load_person_input(args.input)

    chart_service = ChartService()
    chart_data = chart_service.calculate_chart(person)

    # Convert to dict
    output = chart_data.model_dump(mode='json')

    save_output(output, args.output)
    chart_service.close()


def cmd_horoscope(args):
    """Generate comprehensive horoscope."""
    person = load_person_input(args.input)

    horoscope_service = HoroscopeService()
    horoscope = horoscope_service.generate_horoscope(person)

    output = horoscope.model_dump(mode='json')

    save_output(output, args.output)
    horoscope_service.close()


def cmd_matchmaking(args):
    """Analyze matchmaking compatibility."""
    person_a = load_person_input(args.partner_a)
    person_b = load_person_input(args.partner_b)

    matchmaking_service = MatchMakingService()
    result = matchmaking_service.analyze_compatibility(person_a, person_b)

    output = result.model_dump(mode='json')

    save_output(output, args.output)
    matchmaking_service.close()


def cmd_daily_insights(args):
    """Generate daily insights."""
    person = load_person_input(args.input)

    daily_service = DailyInsightsService()
    insights = daily_service.generate_daily_insights(person)

    output = insights.model_dump(mode='json')

    save_output(output, args.output)
    daily_service.close()


def cmd_refusal(args):
    """Display refusal message for non-astrology queries."""
    print(REFUSAL_MESSAGE)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Bhrigu-Nadi Astrology System CLI - Offline astrology calculations",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate birth chart
  python -m app.cli chart --input tests/fixtures/person1.json

  # Generate horoscope
  python -m app.cli horoscope --input tests/fixtures/person1.json --output horoscope.json

  # Analyze compatibility
  python -m app.cli matchmaking --partner-a tests/fixtures/person1.json --partner-b tests/fixtures/person2.json

  # Daily insights
  python -m app.cli daily-insights --input tests/fixtures/person1.json
        """
    )

    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Chart command
    parser_chart = subparsers.add_parser('chart', help='Generate birth chart')
    parser_chart.add_argument('--input', required=True, help='Input JSON file with person data')
    parser_chart.add_argument('--output', help='Output JSON file (default: stdout)')
    parser_chart.set_defaults(func=cmd_chart)

    # Horoscope command
    parser_horoscope = subparsers.add_parser('horoscope', help='Generate comprehensive horoscope')
    parser_horoscope.add_argument('--input', required=True, help='Input JSON file with person data')
    parser_horoscope.add_argument('--output', help='Output JSON file (default: stdout)')
    parser_horoscope.set_defaults(func=cmd_horoscope)

    # Matchmaking command
    parser_match = subparsers.add_parser('matchmaking', help='Analyze compatibility')
    parser_match.add_argument('--partner-a', required=True, help='Input JSON for partner A')
    parser_match.add_argument('--partner-b', required=True, help='Input JSON for partner B')
    parser_match.add_argument('--output', help='Output JSON file (default: stdout)')
    parser_match.set_defaults(func=cmd_matchmaking)

    # Daily insights command
    parser_daily = subparsers.add_parser('daily-insights', help='Generate daily insights')
    parser_daily.add_argument('--input', required=True, help='Input JSON file with person data')
    parser_daily.add_argument('--output', help='Output JSON file (default: stdout)')
    parser_daily.set_defaults(func=cmd_daily_insights)

    # Refusal command (for demonstration)
    parser_refusal = subparsers.add_parser('refusal', help='Show scope limitation message')
    parser_refusal.set_defaults(func=cmd_refusal)

    # Parse arguments
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Execute command
    try:
        args.func(args)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()

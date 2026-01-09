"""
Bhrigu-Nadi Integration Helper
Provides easy integration for all 8 prediction engines to use the core wisdom engine
Ensures every engine applies 100s of principles without failure
"""
from typing import Dict, Any, Optional
import json

from services.bhrigu_nadi_core_engine import (
    BhriguNadiCoreEngine,
    BhriguNadiReading,
    generate_bhrigu_nadi_reading
)
from utils.logger import setup_logger

logger = setup_logger(__name__)


class BhriguNadiIntegration:
    """
    Integration helper for prediction engines
    Provides formatted outputs for all 8 categories
    """

    # Domain mapping for 8 prediction categories
    DOMAIN_MAP = {
        'karmic_journey': 'spiritual',
        'past_lives': 'past_lives',
        'future_lives': 'future_lives',
        'present_life': 'general',
        'life_events': 'timing',
        'karmic_remedies': 'remedies',
        'relationships': 'marriage',
        'predictions': 'timing'
    }

    @staticmethod
    def generate_for_category(
        category: str,
        chart_features: Dict[str, Any],
        depth: str = "comprehensive"
    ) -> Dict[str, Any]:
        """
        Generate Bhrigu-Nadi reading for a specific prediction category

        Args:
            category: One of the 8 categories (karmic_journey, past_lives, etc.)
            chart_features: Chart data
            depth: quick, standard, comprehensive, or exhaustive

        Returns:
            Dict with reading in category-appropriate format
        """
        logger.info(f"Generating Bhrigu-Nadi reading for category: {category}")

        # Map category to domain
        domain = BhriguNadiIntegration.DOMAIN_MAP.get(category, 'general')

        # Generate reading using core engine
        reading = generate_bhrigu_nadi_reading(
            chart_features=chart_features,
            domain=domain,
            depth=depth,
            tradition_bias='balanced'
        )

        # Format for output
        formatted = BhriguNadiIntegration._format_reading(reading, category)

        logger.info(f"✓ Generated reading with {reading.rules_activated} principles applied")

        return formatted

    @staticmethod
    def _format_reading(reading: BhriguNadiReading, category: str) -> Dict[str, Any]:
        """Format reading for API response"""
        return {
            'category': category,
            'success': True,
            'data': {
                # Main content
                'synthesis': reading.integrated_synthesis,
                'use_cases': [u.to_dict() for u in reading.use_cases],

                # Metadata
                'confidence': {
                    'level': reading.overall_confidence.value,
                    'explanation': reading.confidence_explanation
                },

                # Detailed breakdown (for advanced users)
                'principles_applied': {
                    'total_rules': reading.rules_activated,
                    'rules_considered': reading.rules_considered,
                    'activated_rules': [r.to_dict() for r in reading.activated_rules[:20]]  # Top 20
                },

                # Verification
                'cross_verification': reading.cross_verification.to_dict() if reading.cross_verification else None,

                # Guidance
                'next_checks': reading.next_checks,
                'limits': reading.limits
            }
        }

    @staticmethod
    def generate_markdown_report(reading: BhriguNadiReading) -> str:
        """
        Generate formatted markdown report following the specification structure

        Returns markdown string with:
        A. Activated Bhrigu & Nadi Rules
        B. Integrated Reading
        C. Use-Cases & Manifestations
        D. Cross-Verification
        E. Confidence & Limits
        F. Next Checks
        """
        lines = []

        # Header
        lines.append("# Bhrigu-Nadi Comprehensive Reading")
        lines.append("")
        lines.append(f"*{reading.rules_activated} principles applied from {reading.rules_considered} total matches*")
        lines.append("")

        # A. Activated Rules
        lines.append("## A. Activated Bhrigu & Nadi Rules")
        lines.append("")

        for i, rule in enumerate(reading.activated_rules[:20], 1):  # Top 20
            lines.append(f"### {i}. {rule.rule_id} - {rule.tradition}")
            lines.append("")
            lines.append(f"**Source**: {rule.source_reference}")
            lines.append("")
            lines.append(f"**Description**: {rule.description}")
            lines.append("")
            lines.append(f"**Triggered by**: {', '.join(rule.triggered_by)}")
            lines.append("")

            if rule.strength_modifiers:
                lines.append(f"**Strength modifiers**: {', '.join(rule.strength_modifiers)}")
                lines.append("")

            if rule.counter_rules:
                lines.append(f"**Counter-rules**: {', '.join(rule.counter_rules)}")
                lines.append("")

            lines.append(f"**Confidence**: {rule.confidence:.2f}")
            lines.append("")

        # B. Integrated Reading
        lines.append("## B. Integrated Reading")
        lines.append("")
        lines.append(reading.integrated_synthesis)
        lines.append("")

        # C. Use-Cases & Manifestations
        lines.append("## C. Use-Cases & Manifestations")
        lines.append("")

        for i, use_case in enumerate(reading.use_cases, 1):
            lines.append(f"### Use-Case {i}: {use_case.scenario}")
            lines.append("")
            lines.append(f"**Supporting rules**: {', '.join(use_case.supporting_rules)}")
            lines.append("")
            lines.append(f"**Confidence level**: {use_case.confidence.value}")
            lines.append("")
            lines.append("**What would invalidate this reading**:")
            for condition in use_case.invalidation_conditions:
                lines.append(f"- {condition}")
            lines.append("")

        # D. Cross-Verification
        if reading.cross_verification:
            lines.append("## D. Cross-Verification (Nadi Style)")
            lines.append("")

            lines.append("**What must repeat elsewhere in the chart**:")
            for item in reading.cross_verification.repetition_required:
                lines.append(f"- {item}")
            lines.append("")

            lines.append("**Which lords/signs must confirm**:")
            for item in reading.cross_verification.confirming_lords:
                lines.append(f"- {item}")
            lines.append("")

            lines.append("**What absence weakens the reading**:")
            for item in reading.cross_verification.absence_weakens:
                lines.append(f"- {item}")
            lines.append("")

        # E. Confidence & Limits
        lines.append("## E. Confidence & Limits")
        lines.append("")
        lines.append(f"**Overall confidence**: {reading.overall_confidence.value.upper()}")
        lines.append("")
        lines.append(f"**Explanation**: {reading.confidence_explanation}")
        lines.append("")

        lines.append("**Limitations**:")
        for limit in reading.limits:
            lines.append(f"- {limit}")
        lines.append("")

        # F. Next Checks
        lines.append("## F. Next Checks")
        lines.append("")
        lines.append("**Recommended chart factors to examine next**:")
        for check in reading.next_checks:
            lines.append(f"- {check}")
        lines.append("")

        return "\n".join(lines)


def apply_principles_to_all_categories(chart_features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Apply Bhrigu-Nadi principles to ALL 8 categories
    Returns comprehensive results for entire chart

    Args:
        chart_features: Chart data with planetary positions, houses, etc.

    Returns:
        Dict with readings for all 8 categories
    """
    logger.info("Generating Bhrigu-Nadi readings for ALL 8 categories")

    results = {}
    categories = [
        'karmic_journey',
        'past_lives',
        'future_lives',
        'present_life',
        'life_events',
        'karmic_remedies',
        'relationships',
        'predictions'
    ]

    total_rules_applied = 0

    for category in categories:
        try:
            reading_data = BhriguNadiIntegration.generate_for_category(
                category=category,
                chart_features=chart_features,
                depth='comprehensive'  # Use comprehensive for full coverage
            )

            results[category] = reading_data
            total_rules_applied += reading_data['data']['principles_applied']['total_rules']

            logger.info(f"✓ {category}: {reading_data['data']['principles_applied']['total_rules']} rules")

        except Exception as e:
            logger.error(f"Error generating {category}: {e}")
            # Zero-failure guarantee - provide fallback
            results[category] = {
                'category': category,
                'success': False,
                'error': str(e),
                'data': {
                    'synthesis': f"Unable to generate reading for {category} due to: {str(e)}",
                    'confidence': {
                        'level': 'low',
                        'explanation': 'Error during generation'
                    }
                }
            }

    logger.info(f"✓✓✓ COMPLETE: Applied {total_rules_applied} total principles across all 8 categories")

    return {
        'success': True,
        'total_principles_applied': total_rules_applied,
        'categories': results,
        'metadata': {
            'chart_features': chart_features,
            'engine_version': '1.0.0',
            'specification': '10-point Bhrigu-Nadi Core Wisdom Engine'
        }
    }


def get_engine_statistics() -> Dict[str, Any]:
    """
    Get statistics about loaded principles and engine capabilities

    Returns:
        Dict with principle counts, traditions, domains
    """
    from services.principle_loader import get_principle_loader

    loader = get_principle_loader()

    bhrigu_count = len(loader.get_by_tradition('bhrigu'))
    nadi_count = len(loader.get_by_tradition('nadi'))
    total_count = len(loader.get_all_principles())

    domains = list(loader.principles_by_domain.keys())

    return {
        'total_principles': total_count,
        'by_tradition': {
            'bhrigu_samhita': bhrigu_count,
            'nadi_jyotisa': nadi_count
        },
        'domains_available': domains,
        'engine_features': [
            'Exhaustive rule retrieval (never stops at first match)',
            'Source attribution (Bhrigu Samhita / Nadi Jyotisa / Derived)',
            'Cross-verification logic (repetition, confirmation)',
            'Confidence levels with explanations',
            'Counter-rule identification',
            'Strength modifiers',
            'Use-case scenarios with invalidation criteria',
            'Next check suggestions',
            'Zero-failure guarantee'
        ],
        'specification': '10-point Bhrigu-Nadi Core Wisdom Engine'
    }


# Example usage
if __name__ == "__main__":
    # Example chart features
    example_chart = {
        'moon_sign': 'Cancer',
        'ascendant': 'Virgo',
        'jupiter_house': 9,
        'saturn_house': 10,
        'venus_house': 2,
        'mars_house': 3,
        'moon_element': 'water',
        'lunar_tithi': 10,
        'saturn_retrograde': False
    }

    # Get engine statistics
    stats = get_engine_statistics()
    print(json.dumps(stats, indent=2))

    # Generate reading for one category
    reading_data = BhriguNadiIntegration.generate_for_category(
        category='karmic_journey',
        chart_features=example_chart
    )

    print("\n" + "="*80)
    print(f"CATEGORY: {reading_data['category']}")
    print(f"RULES APPLIED: {reading_data['data']['principles_applied']['total_rules']}")
    print(f"CONFIDENCE: {reading_data['data']['confidence']['level']}")
    print("="*80)

"""
Rule engine for matching chart patterns and generating narratives.
Loads rules from rule_index.json and evaluates them against charts.
"""
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.domain.models import Chart, RuleTrace, RuleTrigger, Planet
from app.services.chart import ChartService
from app.rules.dsl import DSLEvaluator


class RuleEngine:
    """Astrological rule matching and narrative generation engine."""

    def __init__(self, chart_service: ChartService, rules_path: Optional[str] = None):
        """
        Initialize rule engine.

        Args:
            chart_service: Chart service for chart operations
            rules_path: Path to rule_index.json (defaults to core_wisdom/rule_index.json)
        """
        self.chart_service = chart_service
        self.dsl_evaluator = DSLEvaluator(chart_service)

        if rules_path is None:
            # Default to core_wisdom/rule_index.json
            rules_path = str(Path(__file__).parent.parent.parent / "core_wisdom" / "rule_index.json")

        self.rules = self._load_rules(rules_path)

    def _load_rules(self, rules_path: str) -> List[Dict[str, Any]]:
        """Load rules from JSON file."""
        with open(rules_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get('rules', [])

    def match_rules(
        self,
        chart: Chart,
        domain: Optional[str] = None,
        tradition: Optional[str] = None
    ) -> List[RuleTrace]:
        """
        Match rules against a chart.

        Args:
            chart: Birth chart
            domain: Filter by domain (e.g., 'career', 'marriage')
            tradition: Filter by tradition ('bhrigu' or 'nadi')

        Returns:
            List of matched RuleTrace objects, sorted by priority (descending)
        """
        matched_traces: List[RuleTrace] = []

        for rule in self.rules:
            # Filter by domain
            if domain and rule.get('domain') != domain:
                continue

            # Filter by tradition
            if tradition and rule.get('tradition') != tradition:
                continue

            # Evaluate triggers
            triggers = rule.get('triggers', [])
            evaluated_triggers = self.dsl_evaluator.evaluate_all(triggers, chart)

            # Check if all triggers match
            all_match = all(t.evaluated for t in evaluated_triggers)

            if all_match:
                # Render narrative
                narrative = self._render_narrative(
                    rule['narrative_template'],
                    chart,
                    evaluated_triggers
                )

                # Create RuleTrace
                trace = RuleTrace(
                    rule_id=rule['rule_id'],
                    tradition=rule['tradition'],
                    domain=rule['domain'],
                    matched_triggers=evaluated_triggers,
                    priority=rule['priority'],
                    narrative=narrative,
                    citations=rule.get('citations', [])
                )

                matched_traces.append(trace)

        # Sort by priority (descending)
        matched_traces.sort(key=lambda x: x.priority, reverse=True)

        return matched_traces

    def _render_narrative(
        self,
        template: str,
        chart: Chart,
        triggers: List[RuleTrigger]
    ) -> str:
        """
        Render narrative template with chart data.

        Args:
            template: Narrative template with placeholders
            chart: Birth chart
            triggers: Evaluated triggers with context

        Returns:
            Rendered narrative string
        """
        # Build replacement dictionary
        replacements = {}

        # Extract context from triggers
        for trigger in triggers:
            for key, value in trigger.context.items():
                if isinstance(value, str):
                    replacements[key] = value

        # Add chart-level data
        replacements['ascendant'] = chart.ascendant.value

        # Handle common placeholder patterns
        narrative = template

        # Replace {planet_name}
        if '{planet_name}' in narrative:
            # Try to get from context
            if 'planet' in replacements:
                narrative = narrative.replace('{planet_name}', replacements['planet'])
            elif 'house_lord' in replacements:
                narrative = narrative.replace('{planet_name}', replacements['house_lord'])

        # Replace {sign_name}
        if '{sign_name}' in narrative:
            if 'actual_sign' in replacements:
                narrative = narrative.replace('{sign_name}', replacements['actual_sign'])

        # Replace {planet1_name}, {planet2_name}
        if '{planet1_name}' in narrative and 'planet1' in replacements:
            narrative = narrative.replace('{planet1_name}', replacements['planet1'])
        if '{planet2_name}' in narrative and 'planet2' in replacements:
            narrative = narrative.replace('{planet2_name}', replacements['planet2'])

        # Replace any other {key} patterns
        for key, value in replacements.items():
            placeholder = '{' + key + '}'
            if placeholder in narrative:
                narrative = narrative.replace(placeholder, str(value))

        return narrative

    def get_domain_rules(self, chart: Chart, domain: str) -> List[RuleTrace]:
        """Get all matched rules for a specific domain."""
        return self.match_rules(chart, domain=domain)

    def get_personality_summary(self, chart: Chart) -> str:
        """Generate personality summary from chart."""
        # Moon nakshatra
        moon_pos = self.chart_service.get_planet_position(chart, Planet.MOON)

        # Ascendant
        asc = chart.ascendant

        summary = f"Ascendant in {asc.value} with Moon in {moon_pos.nakshatra.value} nakshatra"

        return summary

    def get_chart_summary(self, chart: Chart) -> Dict[str, Any]:
        """Generate comprehensive chart summary."""
        summary = {
            "ascendant": chart.ascendant.value,
            "ascendant_degree": round(chart.ascendant_longitude % 30, 2),
            "planets": []
        }

        for planet_pos in chart.planets:
            summary["planets"].append({
                "planet": planet_pos.planet.value,
                "sign": planet_pos.sign.value,
                "house": planet_pos.house,
                "degree": round(planet_pos.degree_in_sign, 2),
                "nakshatra": planet_pos.nakshatra.value,
                "pada": planet_pos.nakshatra_pada,
                "retrograde": planet_pos.retrograde
            })

        return summary

    def get_nakshatra_summary(self, chart: Chart) -> Dict[str, Any]:
        """Generate nakshatra-focused summary."""
        moon_pos = self.chart_service.get_planet_position(chart, Planet.MOON)
        sun_pos = self.chart_service.get_planet_position(chart, Planet.SUN)

        return {
            "moon_nakshatra": moon_pos.nakshatra.value,
            "moon_pada": moon_pos.nakshatra_pada,
            "moon_sign": moon_pos.sign.value,
            "sun_nakshatra": sun_pos.nakshatra.value,
            "sun_pada": sun_pos.nakshatra_pada,
            "sun_sign": sun_pos.sign.value,
            "ascendant_nakshatra": self._longitude_to_nakshatra_name(chart.ascendant_longitude)
        }

    def _longitude_to_nakshatra_name(self, longitude: float) -> str:
        """Helper to get nakshatra name from longitude."""
        nakshatra, pada, lord = self.chart_service.ephemeris.longitude_to_nakshatra(longitude)
        return nakshatra.value

    def generate_summary_bullets(self, chart: Chart, rule_traces: List[RuleTrace]) -> List[str]:
        """Generate summary bullet points from chart and rules."""
        bullets = []

        # Ascendant bullet
        bullets.append(f"**Ascendant**: {chart.ascendant.value} - defines core personality and life approach")

        # Moon nakshatra bullet
        moon_pos = self.chart_service.get_planet_position(chart, Planet.MOON)
        bullets.append(
            f"**Moon Nakshatra**: {moon_pos.nakshatra.value} - "
            f"reveals karmic mission and emotional nature"
        )

        # Top 3 domain summaries from high-priority rules
        domains_covered = set()
        for trace in rule_traces[:5]:
            if trace.domain not in domains_covered and len(domains_covered) < 3:
                # Extract first sentence from narrative
                first_sentence = trace.narrative.split('.')[0] + '.'
                bullets.append(f"**{trace.domain.title()}**: {first_sentence}")
                domains_covered.add(trace.domain)

        return bullets

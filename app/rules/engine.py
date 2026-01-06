"""
Rules engine for loading and matching astrological rules.
Loads rules from rule_index.json and evaluates them against chart data.
"""

import json
from typing import List, Dict, Any, Optional
from pathlib import Path

from app.domain.models import ChartData, RuleTrace, TransitSnapshot
from app.rules.dsl import DSLEvaluator
from app.config import RULE_INDEX_FILE


class RulesEngine:
    """
    Engine for loading, matching, and rendering astrological rules.
    """

    def __init__(self):
        """Load rules from rule_index.json."""
        self.rules = []
        self.load_rules()

    def load_rules(self):
        """Load rules from the rule index file."""
        if not RULE_INDEX_FILE.exists():
            raise FileNotFoundError(f"Rule index file not found: {RULE_INDEX_FILE}")

        with open(RULE_INDEX_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            self.rules = data.get("rules", [])

    def match_rules(
        self,
        chart_data: ChartData,
        domain: Optional[str] = None,
        tradition: Optional[str] = None,
        transit_data: Optional[TransitSnapshot] = None,
        min_priority: int = 0
    ) -> List[RuleTrace]:
        """
        Match rules against chart data and return traces.

        Args:
            chart_data: Birth chart data
            domain: Optional domain filter (e.g., "career", "marriage")
            tradition: Optional tradition filter ("bhrigu", "nadi", "combined")
            transit_data: Optional transit data for daily insights
            min_priority: Minimum priority threshold

        Returns:
            List of RuleTrace objects for matched rules
        """
        matched_traces = []
        evaluator = DSLEvaluator(chart_data, transit_data)

        for rule in self.rules:
            # Apply filters
            if domain and rule.get("domain") != domain:
                continue

            if tradition and rule.get("tradition") != tradition:
                continue

            if rule.get("priority", 0) < min_priority:
                continue

            # Evaluate triggers
            triggers = rule.get("triggers", [])
            matched_triggers = []
            all_match = True

            for trigger in triggers:
                try:
                    if evaluator.evaluate(trigger):
                        matched_triggers.append(trigger)
                    else:
                        all_match = False
                        break
                except Exception as e:
                    # Skip rules with evaluation errors
                    all_match = False
                    break

            if all_match and matched_triggers:
                # Render narrative
                narrative = self._render_narrative(
                    rule.get("narrative_template", ""),
                    chart_data,
                    evaluator
                )

                trace = RuleTrace(
                    rule_id=rule["rule_id"],
                    tradition=rule["tradition"],
                    priority=rule["priority"],
                    domain=rule.get("domain", "general"),
                    matched_triggers=matched_triggers,
                    computed_facts=evaluator.get_computed_facts(),
                    rendered_narrative=narrative,
                    citations=rule.get("citations", [])
                )

                matched_traces.append(trace)

        # Sort by priority (descending)
        matched_traces.sort(key=lambda x: x.priority, reverse=True)

        return matched_traces

    def _render_narrative(
        self,
        template: str,
        chart_data: ChartData,
        evaluator: DSLEvaluator
    ) -> str:
        """
        Render narrative template with computed values.

        Args:
            template: Narrative template string
            chart_data: Chart data for variable substitution
            evaluator: DSL evaluator with context

        Returns:
            Rendered narrative string
        """
        # Simple template variable substitution
        variables = {
            "name": chart_data.person.name,
            "moon_nakshatra": chart_data.moon_nakshatra.nakshatra.value,
            "ascendant_sign": chart_data.ascendant.sign.value,
            "kuta_score": evaluator.context.get("kuta_score", ""),
            "compatibility_type": evaluator.context.get("compatibility_type", ""),
            "compatibility_level": evaluator.context.get("compatibility_level", ""),
            "aesthetic_compatibility": evaluator.context.get("aesthetic_compatibility", ""),
            "shared_values": evaluator.context.get("shared_values", "")
        }

        rendered = template
        for key, value in variables.items():
            placeholder = "{" + key + "}"
            rendered = rendered.replace(placeholder, str(value))

        return rendered

    def get_rules_by_domain(self, domain: str) -> List[Dict[str, Any]]:
        """
        Get all rules for a specific domain.

        Args:
            domain: Domain name

        Returns:
            List of rule dictionaries
        """
        return [rule for rule in self.rules if rule.get("domain") == domain]

    def get_rule_by_id(self, rule_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific rule by ID.

        Args:
            rule_id: Rule identifier

        Returns:
            Rule dictionary or None
        """
        for rule in self.rules:
            if rule.get("rule_id") == rule_id:
                return rule
        return None

    def get_domains(self) -> List[str]:
        """
        Get list of all domains covered by rules.

        Returns:
            List of domain names
        """
        domains = set()
        for rule in self.rules:
            domain = rule.get("domain")
            if domain:
                domains.add(domain)
        return sorted(list(domains))

    def get_traditions(self) -> List[str]:
        """
        Get list of all traditions in rules.

        Returns:
            List of tradition names
        """
        traditions = set()
        for rule in self.rules:
            tradition = rule.get("tradition")
            if tradition:
                traditions.add(tradition)
        return sorted(list(traditions))

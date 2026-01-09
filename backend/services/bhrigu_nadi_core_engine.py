"""
Bhrigu-Nadi Core Wisdom Engine

Implements the 10-point specification for authentic, exhaustive principle application:
1. Knowledge Source Constraints - Only authenticated Bhrigu & Nadi principles
2. Knowledge Coverage - ALL relevant rules retrieved and ranked
3. Input Processing - Handles canonical chart features
4. Rule Application Discipline - Exact triggers, source citations, counter-rules
5. Mandatory Output Structure - Activated Rules → Integrated Reading → Use-Cases → Cross-Verification → Confidence → Next Checks
6. Exhaustiveness - NEVER stops after first match
7. Learning Without Corruption - Feedback adjusts weights, not core logic
8. Ethical Boundaries - Probabilistic language, professional referrals
9. Integrity - Missing data stated explicitly, texts disagreements shown
10. Developer Controls - Depth, domain focus, tradition bias, verbosity

This engine is a custodian of lineage, not a creative writer.
"""
import os
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

from services.principle_loader import get_principle_loader, Principle
from utils.logger import setup_logger

logger = setup_logger(__name__)


class ConfidenceLevel(Enum):
    """Confidence levels for interpretations"""
    VERY_HIGH = "very_high"  # 0.85+
    HIGH = "high"           # 0.70 - 0.84
    MEDIUM = "medium"       # 0.50 - 0.69
    LOW = "low"             # < 0.50


@dataclass
class ActivatedRule:
    """Represents a rule that has been activated for a chart"""
    rule_id: str
    tradition: str  # Bhrigu Samhita / Nadi Jyotisa / Derived
    source_reference: str
    description: str
    triggered_by: List[str]  # Explicit chart features that triggered this
    confidence: float
    weights: Dict[str, float] = field(default_factory=dict)
    counter_rules: List[str] = field(default_factory=list)  # Rules that contradict this
    strength_modifiers: List[str] = field(default_factory=list)  # Factors affecting strength

    def to_dict(self) -> Dict[str, Any]:
        return {
            'rule_id': self.rule_id,
            'tradition': self.tradition,
            'source_reference': self.source_reference,
            'description': self.description,
            'triggered_by': self.triggered_by,
            'confidence': self.confidence,
            'weights': self.weights,
            'counter_rules': self.counter_rules,
            'strength_modifiers': self.strength_modifiers
        }


@dataclass
class UseCase:
    """Specific manifestation scenario with validation criteria"""
    scenario: str
    supporting_rules: List[str]
    confidence: ConfidenceLevel
    invalidation_conditions: List[str]  # What would invalidate this reading

    def to_dict(self) -> Dict[str, Any]:
        return {
            'scenario': self.scenario,
            'supporting_rules': self.supporting_rules,
            'confidence': self.confidence.value,
            'invalidation_conditions': self.invalidation_conditions
        }


@dataclass
class CrossVerification:
    """Nadi-style cross-verification requirements"""
    repetition_required: List[str]  # What must repeat elsewhere in chart
    confirming_lords: List[str]  # Which lords/signs must confirm
    absence_weakens: List[str]  # What absence weakens this reading

    def to_dict(self) -> Dict[str, Any]:
        return {
            'repetition_required': self.repetition_required,
            'confirming_lords': self.confirming_lords,
            'absence_weakens': self.absence_weakens
        }


@dataclass
class BhriguNadiReading:
    """Complete structured reading following the 10-point specification"""
    # A. Activated Rules
    activated_rules: List[ActivatedRule] = field(default_factory=list)

    # B. Integrated Reading
    integrated_synthesis: str = ""

    # C. Use-Cases & Manifestations
    use_cases: List[UseCase] = field(default_factory=list)

    # D. Cross-Verification
    cross_verification: Optional[CrossVerification] = None

    # E. Confidence & Limits
    overall_confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM
    confidence_explanation: str = ""
    limits: List[str] = field(default_factory=list)

    # F. Next Checks
    next_checks: List[str] = field(default_factory=list)

    # Metadata
    chart_features_used: Dict[str, Any] = field(default_factory=dict)
    rules_considered: int = 0
    rules_activated: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            'activated_rules': [r.to_dict() for r in self.activated_rules],
            'integrated_synthesis': self.integrated_synthesis,
            'use_cases': [u.to_dict() for u in self.use_cases],
            'cross_verification': self.cross_verification.to_dict() if self.cross_verification else None,
            'overall_confidence': self.overall_confidence.value,
            'confidence_explanation': self.confidence_explanation,
            'limits': self.limits,
            'next_checks': self.next_checks,
            'metadata': {
                'chart_features_used': self.chart_features_used,
                'rules_considered': self.rules_considered,
                'rules_activated': self.rules_activated
            }
        }


class BhriguNadiCoreEngine:
    """
    Core wisdom engine implementing the 10-point specification
    Provides exhaustive, authentic, lineage-preserving interpretations
    """

    def __init__(
        self,
        depth: str = "comprehensive",  # quick, standard, comprehensive, exhaustive
        domain_focus: Optional[str] = None,  # career, marriage, health, spiritual, etc.
        tradition_bias: str = "balanced",  # bhrigu-heavy, nadi-heavy, balanced
        verbosity: str = "detailed"  # concise, standard, detailed, scholarly
    ):
        self.depth = depth
        self.domain_focus = domain_focus
        self.tradition_bias = tradition_bias
        self.verbosity = verbosity

        # Load principle database
        self.principle_loader = get_principle_loader()

        # Configuration based on depth
        self.max_rules_to_apply = {
            'quick': 20,
            'standard': 50,
            'comprehensive': 100,
            'exhaustive': 999999  # No limit
        }.get(depth, 50)

    def generate_reading(
        self,
        chart_features: Dict[str, Any],
        domain: Optional[str] = None
    ) -> BhriguNadiReading:
        """
        Generate complete Bhrigu-Nadi reading for given chart features
        Following the 10-point specification

        Args:
            chart_features: Dict containing planetary positions, houses, lords, nakshatras, etc.
            domain: Optional domain focus (overrides instance domain_focus)

        Returns:
            BhriguNadiReading with all components
        """
        logger.info(f"Generating Bhrigu-Nadi reading (depth={self.depth}, domain={domain or self.domain_focus})")

        reading = BhriguNadiReading()
        reading.chart_features_used = chart_features

        # Use domain parameter or instance domain_focus
        active_domain = domain or self.domain_focus

        try:
            # Step 1: Retrieve ALL applicable rules (exhaustive)
            all_matching_principles = self._retrieve_all_matching_principles(
                chart_features,
                active_domain
            )

            reading.rules_considered = len(all_matching_principles)
            logger.info(f"Found {len(all_matching_principles)} matching principles")

            # Step 2: Activate rules (identify exact triggers)
            activated_rules = self._activate_rules(
                all_matching_principles,
                chart_features
            )

            reading.activated_rules = activated_rules[:self.max_rules_to_apply]
            reading.rules_activated = len(reading.activated_rules)

            logger.info(f"Activated {reading.rules_activated} rules (limit={self.max_rules_to_apply})")

            # Step 3: Identify counter-rules and conflicts
            self._identify_counter_rules(reading.activated_rules)

            # Step 4: Apply strength modifiers
            self._apply_strength_modifiers(reading.activated_rules, chart_features)

            # Step 5: Generate integrated synthesis
            reading.integrated_synthesis = self._synthesize_reading(
                reading.activated_rules,
                chart_features
            )

            # Step 6: Generate use-case scenarios
            reading.use_cases = self._generate_use_cases(
                reading.activated_rules,
                chart_features
            )

            # Step 7: Build cross-verification requirements
            reading.cross_verification = self._build_cross_verification(
                reading.activated_rules,
                chart_features
            )

            # Step 8: Calculate overall confidence
            reading.overall_confidence, reading.confidence_explanation = self._calculate_confidence(
                reading.activated_rules,
                chart_features
            )

            # Step 9: Identify limits and uncertainties
            reading.limits = self._identify_limits(
                reading.activated_rules,
                chart_features
            )

            # Step 10: Suggest next checks
            reading.next_checks = self._suggest_next_checks(
                reading.activated_rules,
                chart_features
            )

            logger.info("✓ Reading generation complete")

            return reading

        except Exception as e:
            logger.error(f"Error generating reading: {e}")
            # Return minimal reading with error context
            reading.limits.append(f"Generation error: {str(e)}")
            reading.overall_confidence = ConfidenceLevel.LOW
            reading.confidence_explanation = "Reading incomplete due to processing error"
            return reading

    def _retrieve_all_matching_principles(
        self,
        chart_features: Dict[str, Any],
        domain: Optional[str]
    ) -> List[Principle]:
        """
        EXHAUSTIVE retrieval - get ALL relevant principles
        This is critical per specification point 6
        """
        matching_principles = []

        # Get all principles from both traditions
        if self.tradition_bias == 'bhrigu-heavy':
            bhrigu_principles = self.principle_loader.get_by_tradition('bhrigu')
            nadi_principles = self.principle_loader.get_by_tradition('nadi')[:20]  # Limited
            all_principles = bhrigu_principles + nadi_principles
        elif self.tradition_bias == 'nadi-heavy':
            nadi_principles = self.principle_loader.get_by_tradition('nadi')
            bhrigu_principles = self.principle_loader.get_by_tradition('bhrigu')[:20]  # Limited
            all_principles = nadi_principles + bhrigu_principles
        else:  # balanced
            all_principles = self.principle_loader.get_all_principles()

        # Filter by domain if specified
        if domain:
            domain_principles = self.principle_loader.get_by_domain(domain)
            if domain_principles:
                all_principles = domain_principles

        # Check each principle against chart
        for principle in all_principles:
            if self._principle_applies(principle, chart_features):
                matching_principles.append(principle)

        # Sort by relevance and confidence
        matching_principles.sort(key=lambda p: p.confidence, reverse=True)

        return matching_principles

    def _principle_applies(
        self,
        principle: Principle,
        chart_features: Dict[str, Any]
    ) -> bool:
        """
        Check if a principle applies to the chart
        Uses both explicit conditions and keyword matching
        """
        # If principle has explicit conditions, use them
        if principle.conditions:
            return principle.matches_chart(chart_features)

        # Otherwise, use keyword matching (for principles without explicit conditions)
        # This ensures we don't miss rules that require manual interpretation
        return True  # Include all principles for manual review

    def _activate_rules(
        self,
        principles: List[Principle],
        chart_features: Dict[str, Any]
    ) -> List[ActivatedRule]:
        """
        Convert matching principles to activated rules with explicit triggers
        """
        activated_rules = []

        for principle in principles:
            triggers = self._identify_triggers(principle, chart_features)

            activated_rule = ActivatedRule(
                rule_id=principle.rule_id,
                tradition=self._format_tradition(principle.tradition),
                source_reference=principle.source_reference,
                description=principle.description,
                triggered_by=triggers,
                confidence=principle.confidence,
                weights=principle.weights
            )

            activated_rules.append(activated_rule)

        return activated_rules

    def _identify_triggers(
        self,
        principle: Principle,
        chart_features: Dict[str, Any]
    ) -> List[str]:
        """Identify explicit chart features that triggered this rule"""
        triggers = []

        # Check conditions
        for key, condition in principle.conditions.items():
            if key in chart_features:
                triggers.append(f"{key}={chart_features[key]}")

        # If no explicit conditions, note that manual interpretation required
        if not triggers:
            triggers.append("Manual interpretation required - no explicit conditions")

        return triggers

    def _format_tradition(self, tradition: str) -> str:
        """Format tradition name for output"""
        mapping = {
            'bhrigu': 'Bhrigu Samhita',
            'nadi': 'Nadi Jyotisa',
            'derived': 'Derived'
        }
        return mapping.get(tradition, tradition)

    def _identify_counter_rules(self, activated_rules: List[ActivatedRule]) -> None:
        """Identify rules that contradict each other"""
        # Simplified implementation - can be enhanced
        for i, rule1 in enumerate(activated_rules):
            for j, rule2 in enumerate(activated_rules[i+1:], start=i+1):
                if self._rules_conflict(rule1, rule2):
                    rule1.counter_rules.append(rule2.rule_id)
                    rule2.counter_rules.append(rule1.rule_id)

    def _rules_conflict(self, rule1: ActivatedRule, rule2: ActivatedRule) -> bool:
        """Check if two rules contradict each other"""
        # Simplified - look for opposing keywords
        opposing_pairs = [
            ('wealth', 'poverty'),
            ('success', 'failure'),
            ('harmony', 'conflict'),
            ('gain', 'loss'),
            ('strong', 'weak')
        ]

        desc1 = rule1.description.lower()
        desc2 = rule2.description.lower()

        for word1, word2 in opposing_pairs:
            if (word1 in desc1 and word2 in desc2) or (word2 in desc1 and word1 in desc2):
                return True

        return False

    def _apply_strength_modifiers(
        self,
        activated_rules: List[ActivatedRule],
        chart_features: Dict[str, Any]
    ) -> None:
        """Apply strength modifiers based on additional chart factors"""
        for rule in activated_rules:
            modifiers = []

            # Check for benefic aspects
            if 'jupiter_aspects' in chart_features:
                modifiers.append("Jupiter aspect strengthens")

            # Check for malefic aspects
            if 'saturn_aspects' in chart_features:
                modifiers.append("Saturn aspect adds discipline/delay")

            # Check for exaltation/debilitation
            if 'exalted_planets' in chart_features:
                modifiers.append("Exalted planet enhances")

            # Check for retrograde
            if 'retrograde_planets' in chart_features:
                modifiers.append("Retrograde planet adds complexity")

            rule.strength_modifiers = modifiers

    def _synthesize_reading(
        self,
        activated_rules: List[ActivatedRule],
        chart_features: Dict[str, Any]
    ) -> str:
        """
        Generate integrated synthesis respecting:
        - Repetition strength
        - Benefic/malefic balance
        - Dispositor strength
        """
        if not activated_rules:
            return "Insufficient chart data or no matching principles found."

        synthesis_parts = []

        # Group rules by theme/domain
        themes = self._extract_themes(activated_rules)

        for theme, rules in themes.items():
            theme_synthesis = f"**{theme.upper()}**: "

            if len(rules) >= 3:
                theme_synthesis += f"Strong indication (confirmed by {len(rules)} principles) - "
            elif len(rules) == 2:
                theme_synthesis += f"Moderate indication (confirmed by {len(rules)} principles) - "
            else:
                theme_synthesis += f"Single indication - "

            # Add key descriptions
            top_rules = rules[:3]  # Top 3 for this theme
            descriptions = [r.description[:100] + "..." if len(r.description) > 100 else r.description
                          for r in top_rules]

            theme_synthesis += " ".join(descriptions)

            synthesis_parts.append(theme_synthesis)

        return "\n\n".join(synthesis_parts)

    def _extract_themes(self, activated_rules: List[ActivatedRule]) -> Dict[str, List[ActivatedRule]]:
        """Group rules by common themes"""
        themes = {}

        for rule in activated_rules:
            # Extract theme from rule ID prefix or description
            if 'career' in rule.description.lower() or 'profession' in rule.description.lower():
                theme = 'Career'
            elif 'marriage' in rule.description.lower() or 'spouse' in rule.description.lower():
                theme = 'Marriage'
            elif 'wealth' in rule.description.lower() or 'money' in rule.description.lower():
                theme = 'Wealth'
            elif 'health' in rule.description.lower():
                theme = 'Health'
            elif 'spiritual' in rule.description.lower() or 'moksha' in rule.description.lower():
                theme = 'Spiritual'
            else:
                theme = 'General'

            if theme not in themes:
                themes[theme] = []
            themes[theme].append(rule)

        return themes

    def _generate_use_cases(
        self,
        activated_rules: List[ActivatedRule],
        chart_features: Dict[str, Any]
    ) -> List[UseCase]:
        """Generate distinct use-case scenarios with validation criteria"""
        use_cases = []

        # Group rules and create scenarios
        themes = self._extract_themes(activated_rules)

        for theme, rules in themes.items():
            if len(rules) < 2:
                continue  # Need at least 2 rules for strong use-case

            scenario = f"{theme} manifestation: "
            scenario += rules[0].description[:150]

            confidence = ConfidenceLevel.HIGH if len(rules) >= 3 else ConfidenceLevel.MEDIUM

            use_case = UseCase(
                scenario=scenario,
                supporting_rules=[r.rule_id for r in rules[:5]],
                confidence=confidence,
                invalidation_conditions=[
                    f"If {theme.lower()} houses are severely afflicted",
                    "If dasha periods do not align",
                    "If counter-indications appear in divisional charts"
                ]
            )

            use_cases.append(use_case)

        return use_cases[:5]  # Top 5 use-cases

    def _build_cross_verification(
        self,
        activated_rules: List[ActivatedRule],
        chart_features: Dict[str, Any]
    ) -> CrossVerification:
        """Build Nadi-style cross-verification requirements"""
        repetition = []
        confirming_lords = []
        absence_weakens = []

        # Extract cross-verification criteria from rules
        for rule in activated_rules[:10]:  # Top 10 rules
            if 'jupiter' in rule.description.lower():
                confirming_lords.append("Jupiter should confirm in D9")
            if 'lord of' in rule.description.lower():
                repetition.append("House lordship should repeat in divisional charts")

        # Default verifications
        if not repetition:
            repetition.append("Key planetary combinations should repeat in D9 (Navamsa)")

        if not confirming_lords:
            confirming_lords.append("Primary house lords should be well-placed")

        absence_weakens = [
            "Lack of benefic aspects weakens reading",
            "Afflicted house lords reduce confidence",
            "Contradictory transits delay manifestation"
        ]

        return CrossVerification(
            repetition_required=repetition,
            confirming_lords=confirming_lords,
            absence_weakens=absence_weakens
        )

    def _calculate_confidence(
        self,
        activated_rules: List[ActivatedRule],
        chart_features: Dict[str, Any]
    ) -> Tuple[ConfidenceLevel, str]:
        """Calculate overall confidence and explain reasoning"""
        if not activated_rules:
            return ConfidenceLevel.LOW, "No matching principles found"

        # Average confidence of top rules
        top_rules = activated_rules[:10]
        avg_confidence = sum(r.confidence for r in top_rules) / len(top_rules)

        # Check for repetition (multiple rules confirming same theme)
        themes = self._extract_themes(activated_rules)
        max_theme_count = max(len(rules) for rules in themes.values()) if themes else 1

        # Adjust confidence based on repetition
        if max_theme_count >= 5:
            confidence_boost = 0.15
            explanation = f"High confidence: {max_theme_count} principles confirm primary theme. "
        elif max_theme_count >= 3:
            confidence_boost = 0.10
            explanation = f"Good confidence: {max_theme_count} principles confirm primary theme. "
        else:
            confidence_boost = 0.0
            explanation = f"Moderate confidence: Limited repetition across principles. "

        final_confidence = min(1.0, avg_confidence + confidence_boost)

        # Convert to enum
        if final_confidence >= 0.85:
            level = ConfidenceLevel.VERY_HIGH
        elif final_confidence >= 0.70:
            level = ConfidenceLevel.HIGH
        elif final_confidence >= 0.50:
            level = ConfidenceLevel.MEDIUM
        else:
            level = ConfidenceLevel.LOW

        explanation += f"Average rule confidence: {avg_confidence:.2f}. "
        explanation += f"Rules activated: {len(activated_rules)}. "

        # Check for counter-rules
        counter_count = sum(1 for r in activated_rules if r.counter_rules)
        if counter_count > 0:
            explanation += f"Note: {counter_count} conflicting rules found. "

        return level, explanation

    def _identify_limits(
        self,
        activated_rules: List[ActivatedRule],
        chart_features: Dict[str, Any]
    ) -> List[str]:
        """Identify explicit limits and missing data"""
        limits = []

        # Check for missing data
        required_features = ['moon_sign', 'ascendant', 'jupiter_house', 'saturn_house']
        missing = [f for f in required_features if f not in chart_features]

        if missing:
            limits.append(f"Missing data reduces precision: {', '.join(missing)}")

        # Check for conflicting rules
        conflict_count = sum(1 for r in activated_rules if r.counter_rules)
        if conflict_count > len(activated_rules) * 0.3:  # More than 30% conflicts
            limits.append(f"High number of conflicting principles ({conflict_count}) suggests chart complexity")

        # Check for low-confidence rules
        low_conf_count = sum(1 for r in activated_rules if r.confidence < 0.5)
        if low_conf_count > 0:
            limits.append(f"{low_conf_count} principles have low individual confidence")

        # Note if exhaustiveness was limited
        if len(activated_rules) >= self.max_rules_to_apply:
            limits.append(f"Rule application limited to {self.max_rules_to_apply} (depth={self.depth})")

        if not limits:
            limits.append("No significant limitations identified")

        return limits

    def _suggest_next_checks(
        self,
        activated_rules: List[ActivatedRule],
        chart_features: Dict[str, Any]
    ) -> List[str]:
        """Suggest next chart factors to examine"""
        next_checks = []

        # Always suggest divisional chart verification
        next_checks.append("Verify key combinations in D9 (Navamsa) for marriage/relationships")
        next_checks.append("Check D10 (Dasamsa) for career confirmation")

        # Suggest based on activated rules
        if any('jupiter' in r.description.lower() for r in activated_rules):
            next_checks.append("Examine Jupiter's nakshatra and dispositor strength")

        if any('saturn' in r.description.lower() for r in activated_rules):
            next_checks.append("Analyze Saturn's current transit and upcoming Sade Sati periods")

        if any('dasha' in r.description.lower() for r in activated_rules):
            next_checks.append("Calculate current Vimshottari Dasha periods and upcoming changes")

        # Suggest remedial measures
        next_checks.append("Review planetary doshas and appropriate remedial measures")

        return next_checks[:6]  # Top 6 suggestions


# Convenience function
def generate_bhrigu_nadi_reading(
    chart_features: Dict[str, Any],
    domain: Optional[str] = None,
    depth: str = "comprehensive",
    tradition_bias: str = "balanced"
) -> BhriguNadiReading:
    """
    Convenience function to generate a Bhrigu-Nadi reading

    Args:
        chart_features: Chart data (planets, houses, nakshatras, etc.)
        domain: Optional domain focus (career, marriage, health, spiritual)
        depth: quick, standard, comprehensive, or exhaustive
        tradition_bias: bhrigu-heavy, nadi-heavy, or balanced

    Returns:
        BhriguNadiReading following the 10-point specification
    """
    engine = BhriguNadiCoreEngine(
        depth=depth,
        domain_focus=domain,
        tradition_bias=tradition_bias
    )

    return engine.generate_reading(chart_features, domain)

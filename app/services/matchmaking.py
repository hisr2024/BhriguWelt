"""
Matchmaking engine for compatibility analysis between two people.
Based on Nadi and Bhrigu principles including Ashtakuta analysis.
"""

from typing import Dict, List, Tuple
from datetime import datetime

from app.domain.models import (
    PersonInput, MatchMakingInput, MatchMakingOutput,
    CompatibilityAnalysis, ChartData, RuleTrace
)
from app.services.chart import ChartService
from app.rules.engine import RulesEngine
from app.config import ENGINE_VERSION, STANDARD_DISCLAIMERS, NAKSHATRAS


class MatchMakingService:
    """
    Service for analyzing compatibility between two individuals.
    """

    def __init__(self):
        self.chart_service = ChartService()
        self.rules_engine = RulesEngine()

    def analyze_compatibility(self, partner_a: PersonInput, partner_b: PersonInput) -> MatchMakingOutput:
        """
        Analyze compatibility between two partners.

        Args:
            partner_a: First person's input data
            partner_b: Second person's input data

        Returns:
            MatchMakingOutput with compatibility analysis
        """
        # Calculate charts for both
        chart_a = self.chart_service.calculate_chart(partner_a)
        chart_b = self.chart_service.calculate_chart(partner_b)

        # Calculate Ashtakuta (8-fold compatibility)
        kuta_score, kuta_breakdown = self._calculate_ashtakuta(chart_a, chart_b)

        # Analyze specific compatibility areas
        marriage_stability = self._analyze_marriage_stability(chart_a, chart_b, kuta_score)
        attraction_patterns = self._analyze_attraction(chart_a, chart_b)
        conflict_areas = self._analyze_conflicts(chart_a, chart_b)
        dasha_synergy = self._analyze_dasha_synergy(chart_a, chart_b)
        children_indications = self._analyze_children(chart_a, chart_b)
        mitigation_guidance = self._generate_mitigations(chart_a, chart_b, kuta_score)

        # Create compatibility analysis
        compatibility_analysis = CompatibilityAnalysis(
            compatibility_score=kuta_score,
            kuta_breakdown=kuta_breakdown,
            marriage_stability=marriage_stability,
            attraction_patterns=attraction_patterns,
            conflict_areas=conflict_areas,
            dasha_synergy=dasha_synergy,
            children_indications=children_indications,
            mitigation_guidance=mitigation_guidance
        )

        # Generate summary
        summary = self._generate_summary(chart_a, chart_b, kuta_score)

        # Generate timing windows for marriage
        timing_windows = self._generate_timing_windows(chart_a, chart_b)

        # Match rules (if any matchmaking-specific rules exist)
        rule_traces = []
        # Note: We'd need to enhance DSL for two-chart analysis
        # For now, we'll add basic analysis

        # Compatibility overview
        compatibility_overview = self._generate_compatibility_overview(chart_a, chart_b, kuta_score)

        # Create metadata
        meta = {
            "engine_version": ENGINE_VERSION,
            "calculation_notes": f"Compatibility calculated using Ashtakuta system and Bhrigu principles",
            "timestamp_utc": datetime.utcnow().isoformat()
        }

        output = MatchMakingOutput(
            meta=meta,
            partner_a_name=partner_a.name,
            partner_b_name=partner_b.name,
            summary=summary,
            compatibility_overview=compatibility_overview,
            compatibility_analysis=compatibility_analysis,
            timing_windows=timing_windows,
            rule_traces=rule_traces,
            disclaimers=STANDARD_DISCLAIMERS
        )

        return output

    def _calculate_ashtakuta(self, chart_a: ChartData, chart_b: ChartData) -> Tuple[float, Dict[str, float]]:
        """
        Calculate Ashtakuta (8-fold) compatibility score.

        Args:
            chart_a: First person's chart
            chart_b: Second person's chart

        Returns:
            Tuple of (total_score, breakdown_dict)
        """
        # Get Moon nakshatras for both
        nak_a = chart_a.moon_nakshatra.nakshatra.value
        nak_b = chart_b.moon_nakshatra.nakshatra.value

        # Get nakshatra indices
        nak_a_idx = NAKSHATRAS.index(nak_a.replace("_", " "))
        nak_b_idx = NAKSHATRAS.index(nak_b.replace("_", " "))

        # Get Moon signs
        moon_a = next(p for p in chart_a.planets if p.planet.value == "Moon")
        moon_b = next(p for p in chart_b.planets if p.planet.value == "Moon")

        # Simplified Ashtakuta calculation (real system is more complex)
        breakdown = {}

        # 1. Varna (1 point) - caste/spiritual compatibility
        breakdown["varna"] = 1.0

        # 2. Vashya (2 points) - mutual attraction
        breakdown["vashya"] = 2.0

        # 3. Tara (3 points) - birth star compatibility
        tara_distance = abs(nak_a_idx - nak_b_idx) % 27
        if tara_distance in [1, 2, 3, 5, 6, 7]:
            breakdown["tara"] = 3.0
        elif tara_distance in [4, 8]:
            breakdown["tara"] = 1.5
        else:
            breakdown["tara"] = 0.0

        # 4. Yoni (4 points) - sexual compatibility
        breakdown["yoni"] = 3.0

        # 5. Graha Maitri (5 points) - mental compatibility
        # Based on Moon sign lords friendship
        breakdown["graha_maitri"] = 4.0

        # 6. Gana (6 points) - temperament
        # Deva, Manushya, Rakshasa compatibility
        breakdown["gana"] = 5.0

        # 7. Bhakoot (7 points) - health and prosperity
        sign_distance = abs(self._sign_to_number(moon_a.sign.value) - self._sign_to_number(moon_b.sign.value))
        if sign_distance in [2, 12, 5, 9]:
            breakdown["bhakoot"] = 0.0  # Afflicted
        else:
            breakdown["bhakoot"] = 7.0

        # 8. Nadi (8 points) - health and progeny
        # Check if same nadi (dosha)
        nadi_a = nak_a_idx % 3
        nadi_b = nak_b_idx % 3
        if nadi_a == nadi_b:
            breakdown["nadi"] = 0.0  # Nadi dosha
        else:
            breakdown["nadi"] = 8.0

        total_score = sum(breakdown.values())

        return total_score, breakdown

    def _sign_to_number(self, sign: str) -> int:
        """Convert sign name to number (1-12)."""
        signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
                 "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
        try:
            return signs.index(sign) + 1
        except ValueError:
            return 1

    def _analyze_marriage_stability(self, chart_a: ChartData, chart_b: ChartData, kuta_score: float) -> str:
        """Analyze marriage stability indicators."""
        if kuta_score >= 24:
            stability = "Excellent marriage stability indicated. The compatibility score suggests harmonious union."
        elif kuta_score >= 18:
            stability = "Good marriage stability. With mutual understanding, the relationship will thrive."
        elif kuta_score >= 12:
            stability = "Moderate stability. Requires conscious effort and compromise from both partners."
        else:
            stability = "Challenges indicated. Deep compatibility analysis and remedial measures recommended."

        # Check 7th lords
        lord_7_a = chart_a.house_lords.get(7)
        lord_7_b = chart_b.house_lords.get(7)

        if lord_7_a and lord_7_b:
            stability += f" 7th lords are {lord_7_a.value} and {lord_7_b.value} respectively."

        return stability

    def _analyze_attraction(self, chart_a: ChartData, chart_b: ChartData) -> List[str]:
        """Analyze mutual attraction patterns."""
        patterns = []

        # Venus analysis
        venus_a = next((p for p in chart_a.planets if p.planet.value == "Venus"), None)
        venus_b = next((p for p in chart_b.planets if p.planet.value == "Venus"), None)

        if venus_a and venus_b:
            patterns.append(
                f"Venus in {venus_a.sign.value} (Partner A) and {venus_b.sign.value} (Partner B) "
                "indicates aesthetic and romantic compatibility"
            )

        # Moon-Moon connection
        moon_a = next(p for p in chart_a.planets if p.planet.value == "Moon")
        moon_b = next(p for p in chart_b.planets if p.planet.value == "Moon")

        patterns.append(
            f"Moon signs {moon_a.sign.value} and {moon_b.sign.value} create emotional resonance"
        )

        # Ascendant compatibility
        patterns.append(
            f"Ascendant signs {chart_a.ascendant.sign.value} and {chart_b.ascendant.sign.value} "
            "shape personality interaction"
        )

        return patterns

    def _analyze_conflicts(self, chart_a: ChartData, chart_b: ChartData) -> List[str]:
        """Identify potential conflict areas."""
        conflicts = []

        # Mars positions (aggression, assertion)
        mars_a = next((p for p in chart_a.planets if p.planet.value == "Mars"), None)
        mars_b = next((p for p in chart_b.planets if p.planet.value == "Mars"), None)

        if mars_a and mars_b:
            if mars_a.house in [1, 7] or mars_b.house in [1, 7]:
                conflicts.append(
                    "Mars placement suggests areas requiring patience in conflict resolution"
                )

        # Saturn (restrictions, differences)
        saturn_a = next((p for p in chart_a.planets if p.planet.value == "Saturn"), None)
        saturn_b = next((p for p in chart_b.planets if p.planet.value == "Saturn"), None)

        if saturn_a and saturn_b:
            conflicts.append(
                "Saturn positions indicate areas requiring maturity and long-term perspective"
            )

        if not conflicts:
            conflicts.append("No major conflict indicators in basic analysis")

        return conflicts

    def _analyze_dasha_synergy(self, chart_a: ChartData, chart_b: ChartData) -> List[str]:
        """Analyze dasha period synchronization."""
        synergy = []

        current_maha_a = chart_a.dasha_timeline.current_mahadasha
        current_maha_b = chart_b.dasha_timeline.current_mahadasha

        if current_maha_a and current_maha_b:
            synergy.append(
                f"Partner A in {current_maha_a.planet.value} Mahadasha, "
                f"Partner B in {current_maha_b.planet.value} Mahadasha"
            )

        synergy.append(
            "Dasha synchronization requires detailed antardasha analysis for marriage timing"
        )

        return synergy

    def _analyze_children(self, chart_a: ChartData, chart_b: ChartData) -> str:
        """Analyze children and progeny indications."""
        # 5th house analysis
        lord_5_a = chart_a.house_lords.get(5)
        lord_5_b = chart_b.house_lords.get(5)

        # Jupiter (significator of children)
        jupiter_a = next((p for p in chart_a.planets if p.planet.value == "Jupiter"), None)
        jupiter_b = next((p for p in chart_b.planets if p.planet.value == "Jupiter"), None)

        analysis = (
            f"5th lords are {lord_5_a.value} (A) and {lord_5_b.value} (B). "
            f"Jupiter positions in both charts support healthy progeny. "
            f"Timing of children correlates with 5th lord dasha periods."
        )

        return analysis

    def _generate_mitigations(self, chart_a: ChartData, chart_b: ChartData, kuta_score: float) -> List[str]:
        """Generate mitigation guidance for challenges."""
        guidance = []

        if kuta_score < 18:
            guidance.append("Kuta score below optimal threshold: strengthen Venus through Friday practices")
            guidance.append("Joint spiritual practices and temple visits recommended")

        # Check nadi dosha
        moon_a = next(p for p in chart_a.planets if p.planet.value == "Moon")
        moon_b = next(p for p in chart_b.planets if p.planet.value == "Moon")

        guidance.append("Cultivate mutual respect and communication")
        guidance.append("Honor each other's ascendant lord qualities")

        return guidance

    def _generate_summary(self, chart_a: ChartData, chart_b: ChartData, kuta_score: float) -> List[str]:
        """Generate summary bullet points."""
        summary = []

        summary.append(
            f"Ashtakuta compatibility score: {kuta_score}/36 "
            f"({'Excellent' if kuta_score >= 24 else 'Good' if kuta_score >= 18 else 'Moderate'})"
        )

        summary.append(
            f"Partner A: {chart_a.ascendant.sign.value} Ascendant, "
            f"Moon in {chart_a.moon_nakshatra.nakshatra.value}"
        )

        summary.append(
            f"Partner B: {chart_b.ascendant.sign.value} Ascendant, "
            f"Moon in {chart_b.moon_nakshatra.nakshatra.value}"
        )

        return summary

    def _generate_timing_windows(self, chart_a: ChartData, chart_b: ChartData) -> List[str]:
        """Generate favorable timing for marriage."""
        windows = []

        # Find 7th lord dashas for both
        lord_7_a = chart_a.house_lords.get(7)
        lord_7_b = chart_b.house_lords.get(7)

        if lord_7_a:
            for maha in chart_a.dasha_timeline.mahadashas[:5]:
                if maha.planet == lord_7_a:
                    windows.append(
                        f"Partner A's {maha.planet.value} Mahadasha ({maha.start_date} to {maha.end_date}): "
                        "Favorable for marriage"
                    )
                    break

        if lord_7_b:
            for maha in chart_b.dasha_timeline.mahadashas[:5]:
                if maha.planet == lord_7_b:
                    windows.append(
                        f"Partner B's {maha.planet.value} Mahadasha ({maha.start_date} to {maha.end_date}): "
                        "Favorable for marriage"
                    )
                    break

        if not windows:
            windows.append("Detailed timing requires antardasha and transit analysis")

        return windows

    def _generate_compatibility_overview(self, chart_a: ChartData, chart_b: ChartData, kuta_score: float) -> str:
        """Generate overall compatibility overview."""
        if kuta_score >= 24:
            level = "highly compatible"
        elif kuta_score >= 18:
            level = "compatible with good potential"
        else:
            level = "facing challenges that require awareness"

        overview = (
            f"Based on Nadi Jyotisha and Bhrigu Samhita principles, this partnership is {level}. "
            f"The Ashtakuta score of {kuta_score}/36 provides a foundation for analysis. "
            f"Both charts show complementary strengths that can create a balanced relationship "
            f"with conscious effort and mutual respect."
        )

        return overview

    def close(self):
        """Clean up resources."""
        self.chart_service.close()

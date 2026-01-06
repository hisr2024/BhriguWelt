"""
Matchmaking service for compatibility analysis between two charts.
Based on Nadi Jyotisha and Bhrigu Samhita principles.
"""
from typing import List, Dict, Any
from app.domain.models import (
    BirthInfo, MatchmakingOutput, PartnerAnalysis,
    SynastryRule, RuleTrace, Planet, Chart
)
from app.services.chart import ChartService
from app.rules.engine import RuleEngine


class MatchmakingService:
    """Service for marriage compatibility analysis."""

    def __init__(self):
        """Initialize matchmaking service."""
        self.chart_service = ChartService()
        self.rule_engine = RuleEngine(self.chart_service)

    def analyze_compatibility(
        self,
        partner_a: BirthInfo,
        partner_b: BirthInfo
    ) -> MatchmakingOutput:
        """
        Analyze marriage compatibility between two partners.

        Args:
            partner_a: First partner's birth info
            partner_b: Second partner's birth info

        Returns:
            Complete MatchmakingOutput
        """
        # Calculate charts
        chart_a = self.chart_service.calculate_chart(partner_a)
        chart_b = self.chart_service.calculate_chart(partner_b)

        # Individual analyses
        partner_a_analysis = self._analyze_individual_for_marriage(chart_a, partner_a.name)
        partner_b_analysis = self._analyze_individual_for_marriage(chart_b, partner_b.name)

        # Synastry analysis
        synastry_rules = self._analyze_synastry(chart_a, chart_b)

        # Overall compatibility score
        overall_compatibility = self._calculate_overall_score(synastry_rules)

        # Marriage stability indicators
        stability_indicators = self._get_stability_indicators(chart_a, chart_b, synastry_rules)

        # Timing overlap
        timing_overlap = self._get_timing_overlap(chart_a, chart_b)

        # Cautions and mitigations
        cautions = self._get_cautions(synastry_rules)
        mitigations = self._get_mitigations(chart_a, chart_b)

        # Collect all rule traces
        rule_traces: List[RuleTrace] = []

        # Meta
        meta = {
            "engine_version": "1.0.0",
            "analysis_type": "Marriage Compatibility (Nadi & Bhrigu Samhita)",
            "calculation_notes": [
                "Compatibility assessed through planetary positions, nakshatras, and house lords",
                "Traditional Vedic matchmaking principles applied",
                "Both individual charts and synastry considered"
            ]
        }

        # Disclaimers
        disclaimers = [
            "Compatibility analysis provides guidance based on traditional Vedic astrology.",
            "Successful relationships depend on mutual understanding, effort, and commitment.",
            "Astrological compatibility is one factor among many in relationship harmony.",
            "Consult qualified astrologers for detailed matchmaking and remedial measures."
        ]

        return MatchmakingOutput(
            meta=meta,
            partner_a_analysis=partner_a_analysis,
            partner_b_analysis=partner_b_analysis,
            synastry_rules=synastry_rules,
            overall_compatibility=overall_compatibility,
            marriage_stability_indicators=stability_indicators,
            timing_overlap_windows=timing_overlap,
            cautions=cautions,
            mitigations=mitigations,
            rule_traces=rule_traces,
            disclaimers=disclaimers
        )

    def _analyze_individual_for_marriage(self, chart: Chart, name: str) -> PartnerAnalysis:
        """Analyze individual chart for marriage potential."""
        # Personality summary
        moon_pos = self.chart_service.get_planet_position(chart, Planet.MOON)
        personality_summary = (
            f"{name} has {chart.ascendant.value} ascendant with Moon in "
            f"{moon_pos.nakshatra.value} nakshatra, indicating "
            f"{self._get_nakshatra_trait(moon_pos.nakshatra.value)} nature."
        )

        # Key traits
        key_traits = self._extract_key_traits(chart)

        # 7th house analysis
        house_7_lord = self.chart_service.get_house_lord(chart, 7)
        house_7_lord_pos = self.chart_service.get_planet_position(chart, house_7_lord)
        marriage_house_analysis = (
            f"7th house lord {house_7_lord.value} is in {house_7_lord_pos.house}th house "
            f"in {house_7_lord_pos.sign.value}, suggesting "
            f"{self._get_7th_lord_indication(house_7_lord_pos.house)}."
        )

        # Venus analysis
        venus_pos = self.chart_service.get_planet_position(chart, Planet.VENUS)
        venus_analysis = (
            f"Venus in {venus_pos.sign.value} in {venus_pos.house}th house indicates "
            f"{self._get_venus_indication(venus_pos.sign.value, venus_pos.house)}."
        )

        return PartnerAnalysis(
            name=name,
            personality_summary=personality_summary,
            key_traits=key_traits,
            marriage_house_analysis=marriage_house_analysis,
            venus_analysis=venus_analysis
        )

    def _analyze_synastry(self, chart_a: Chart, chart_b: Chart) -> List[SynastryRule]:
        """Analyze compatibility between two charts."""
        synastry_rules: List[SynastryRule] = []

        # Moon-Moon nakshatra compatibility
        moon_a = self.chart_service.get_planet_position(chart_a, Planet.MOON)
        moon_b = self.chart_service.get_planet_position(chart_b, Planet.MOON)

        moon_compat_score, moon_compat_desc = self._check_moon_compatibility(
            moon_a.nakshatra.value, moon_b.nakshatra.value
        )

        synastry_rules.append(SynastryRule(
            rule_id="SYN-001",
            description="Moon Nakshatra Compatibility",
            compatibility_score=moon_compat_score,
            narrative=moon_compat_desc
        ))

        # Ascendant compatibility
        asc_compat_score, asc_compat_desc = self._check_ascendant_compatibility(
            chart_a.ascendant.value, chart_b.ascendant.value
        )

        synastry_rules.append(SynastryRule(
            rule_id="SYN-002",
            description="Ascendant Sign Compatibility",
            compatibility_score=asc_compat_score,
            narrative=asc_compat_desc
        ))

        # Venus-Mars compatibility
        venus_mars_score, venus_mars_desc = self._check_venus_mars_compatibility(chart_a, chart_b)

        synastry_rules.append(SynastryRule(
            rule_id="SYN-003",
            description="Venus-Mars Attraction",
            compatibility_score=venus_mars_score,
            narrative=venus_mars_desc
        ))

        # Jupiter aspect on partner's Moon (blessing)
        jup_moon_score, jup_moon_desc = self._check_jupiter_moon_blessing(chart_a, chart_b)

        synastry_rules.append(SynastryRule(
            rule_id="SYN-004",
            description="Jupiter's Blessing",
            compatibility_score=jup_moon_score,
            narrative=jup_moon_desc
        ))

        return synastry_rules

    def _check_moon_compatibility(self, nak_a: str, nak_b: str) -> tuple[int, str]:
        """Check Moon nakshatra compatibility."""
        # Simplified compatibility - same nakshatra is very compatible
        if nak_a == nak_b:
            return 95, f"Both have Moon in {nak_a}, creating deep emotional understanding and shared instincts."

        # Compatible nakshatras (simplified)
        compatible_pairs = [
            ("Rohini", "Hasta"), ("Ashwini", "Magha"), ("Pushya", "Uttara Bhadrapada"),
            ("Shravana", "Uttara Ashadha")
        ]

        for pair in compatible_pairs:
            if (nak_a in pair and nak_b in pair):
                return 80, f"Moon in {nak_a} and {nak_b} creates harmonious emotional resonance."

        # Default moderate compatibility
        return 60, f"Moon in {nak_a} and {nak_b} suggests different emotional styles requiring understanding."

    def _check_ascendant_compatibility(self, asc_a: str, asc_b: str) -> tuple[int, str]:
        """Check ascendant sign compatibility."""
        # Same element is compatible
        fire_signs = ["Aries", "Leo", "Sagittarius"]
        earth_signs = ["Taurus", "Virgo", "Capricorn"]
        air_signs = ["Gemini", "Libra", "Aquarius"]
        water_signs = ["Cancer", "Scorpio", "Pisces"]

        for element_group in [fire_signs, earth_signs, air_signs, water_signs]:
            if asc_a in element_group and asc_b in element_group:
                return 85, f"{asc_a} and {asc_b} ascendants share elemental harmony, promoting understanding."

        # Complementary elements
        if (asc_a in fire_signs and asc_b in air_signs) or (asc_a in air_signs and asc_b in fire_signs):
            return 75, f"{asc_a} and {asc_b} create stimulating and dynamic interaction."

        if (asc_a in earth_signs and asc_b in water_signs) or (asc_a in water_signs and asc_b in earth_signs):
            return 75, f"{asc_a} and {asc_b} create nurturing and stable foundation."

        return 55, f"{asc_a} and {asc_b} have different life approaches requiring conscious adaptation."

    def _check_venus_mars_compatibility(self, chart_a: Chart, chart_b: Chart) -> tuple[int, str]:
        """Check Venus-Mars attraction."""
        venus_a = self.chart_service.get_planet_position(chart_a, Planet.VENUS)
        mars_b = self.chart_service.get_planet_position(chart_b, Planet.MARS)

        # If Venus of one is in same sign as Mars of other, strong attraction
        if venus_a.sign == mars_b.sign:
            return 90, "Venus-Mars sign alignment creates strong magnetic attraction and passion."

        return 65, "Venus-Mars create moderate attraction; passion develops through shared experiences."

    def _check_jupiter_moon_blessing(self, chart_a: Chart, chart_b: Chart) -> tuple[int, str]:
        """Check if Jupiter of one blesses Moon of other."""
        # Simplified - if Jupiter in same sign as partner's Moon
        jup_a = self.chart_service.get_planet_position(chart_a, Planet.JUPITER)
        moon_b = self.chart_service.get_planet_position(chart_b, Planet.MOON)

        if jup_a.sign == moon_b.sign:
            return 85, "Jupiter's placement brings wisdom and expansion to partner's emotional world."

        return 60, "Jupiter provides moderate blessing to the relationship."

    def _calculate_overall_score(self, synastry_rules: List[SynastryRule]) -> int:
        """Calculate overall compatibility score."""
        if not synastry_rules:
            return 50

        total = sum(rule.compatibility_score for rule in synastry_rules)
        return total // len(synastry_rules)

    def _get_stability_indicators(
        self,
        chart_a: Chart,
        chart_b: Chart,
        synastry: List[SynastryRule]
    ) -> List[str]:
        """Get marriage stability indicators."""
        indicators = []

        # Check Saturn influence (stability)
        saturn_a = self.chart_service.get_planet_position(chart_a, Planet.SATURN)
        if saturn_a.house == 7:
            indicators.append("Saturn in 7th house of partner A brings long-term commitment")

        # Check Jupiter influence (wisdom)
        indicators.append("Jupiter's blessing supports growth through partnership")

        # Overall score indicator
        avg_score = self._calculate_overall_score(synastry)
        if avg_score >= 75:
            indicators.append("High compatibility score suggests strong relationship foundation")
        elif avg_score >= 60:
            indicators.append("Moderate compatibility with potential for growth through understanding")
        else:
            indicators.append("Relationship requires conscious effort and mutual adjustment")

        return indicators

    def _get_timing_overlap(self, chart_a: Chart, chart_b: Chart) -> List[str]:
        """Get timing windows for marriage."""
        timing = []

        # Get current dashas
        dasha_a = self.chart_service.calculate_dasha_timeline(chart_a, num_years=5)
        dasha_b = self.chart_service.calculate_dasha_timeline(chart_b, num_years=5)

        timing.append(
            f"Partner A: {dasha_a.current_maha_dasha.planet.value} Maha Dasha "
            f"({dasha_a.current_maha_dasha.start_date.year}-{dasha_a.current_maha_dasha.end_date.year})"
        )

        timing.append(
            f"Partner B: {dasha_b.current_maha_dasha.planet.value} Maha Dasha "
            f"({dasha_b.current_maha_dasha.start_date.year}-{dasha_b.current_maha_dasha.end_date.year})"
        )

        return timing

    def _get_cautions(self, synastry: List[SynastryRule]) -> List[str]:
        """Get relationship cautions."""
        cautions = []

        avg_score = self._calculate_overall_score(synastry)
        if avg_score < 60:
            cautions.append("Compatibility score suggests need for patience and understanding")
            cautions.append("Focus on communication and shared values")

        cautions.append("Manage expectations and practice compassion")

        return cautions

    def _get_mitigations(self, chart_a: Chart, chart_b: Chart) -> List[str]:
        """Get remedial measures."""
        mitigations = [
            "Perform marriage rituals according to Vedic tradition",
            "Worship deities associated with relationship harmony (Parvati-Shiva)",
            "Chant relationship harmony mantras together",
            "Observe fasts on Fridays (Venus day) for relationship blessings"
        ]

        return mitigations

    def _get_nakshatra_trait(self, nakshatra: str) -> str:
        """Get key trait for nakshatra."""
        traits = {
            "Ashwini": "pioneering and healing",
            "Rohini": "nurturing and magnetic",
            "Magha": "regal and ancestral",
            "Pushya": "caring and disciplined",
            "Shravana": "attentive and wise"
        }
        return traits.get(nakshatra, "unique and evolving")

    def _extract_key_traits(self, chart: Chart) -> List[str]:
        """Extract key personality traits."""
        traits = []

        moon_pos = self.chart_service.get_planet_position(chart, Planet.MOON)
        traits.append(f"Emotionally {moon_pos.nakshatra.value}-influenced")

        traits.append(f"{chart.ascendant.value} ascendant nature")

        return traits

    def _get_7th_lord_indication(self, house: int) -> str:
        """Get indication based on 7th lord house placement."""
        indications = {
            1: "spouse influences identity; marriage central to self-image",
            2: "spouse brings wealth; financial partnership important",
            4: "domestic harmony and comfort through marriage",
            7: "strong focus on partnership; balanced relationship",
            10: "spouse supports career; public recognition through marriage",
            11: "gains through marriage; spouse fulfills desires"
        }
        return indications.get(house, "unique marriage dynamics")

    def _get_venus_indication(self, sign: str, house: int) -> str:
        """Get Venus indication."""
        if house == 7:
            return "harmonious marriage and romantic fulfillment"
        elif house == 1:
            return "attractive personality and love-centered life"
        elif house == 5:
            return "creative romance and joyful relationships"
        return "appreciation for beauty and relationship values"

    def close(self):
        """Clean up resources."""
        self.chart_service.close()

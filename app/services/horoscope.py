"""
Horoscope engine for generating detailed domain-wise predictions.
Produces comprehensive analysis across all life areas based on Bhrigu and Nadi principles.
"""

from typing import Dict, List
from datetime import datetime

from app.domain.models import (
    PersonInput, ChartData, HoroscopeOutput, DomainAnalysis,
    RuleTrace
)
from app.services.chart import ChartService
from app.services.dasha import DashaService
from app.rules.engine import RulesEngine
from app.config import ENGINE_VERSION, STANDARD_DISCLAIMERS


class HoroscopeService:
    """
    Service for generating comprehensive horoscopes with domain-wise analysis.
    """

    DOMAINS = [
        "career",
        "wealth",
        "marriage",
        "family",
        "children",
        "health",
        "spirituality",
        "education",
        "travel",
        "property"
    ]

    def __init__(self):
        self.chart_service = ChartService()
        self.dasha_service = DashaService()
        self.rules_engine = RulesEngine()

    def generate_horoscope(self, person: PersonInput) -> HoroscopeOutput:
        """
        Generate comprehensive horoscope for a person.

        Args:
            person: PersonInput with birth details

        Returns:
            HoroscopeOutput with domain-wise analysis
        """
        # Calculate chart
        chart_data = self.chart_service.calculate_chart(person)

        # Generate summary
        summary = self._generate_summary(chart_data)

        # Analyze each domain
        domains = {}
        all_rule_traces = []

        for domain in self.DOMAINS:
            domain_analysis = self._analyze_domain(domain, chart_data)
            domains[domain] = domain_analysis
            all_rule_traces.extend(domain_analysis.rule_traces)

        # Create metadata
        meta = {
            "engine_version": ENGINE_VERSION,
            "calculation_notes": f"Calculated using Lahiri ayanamsa ({chart_data.ayanamsa:.4f}°) at JD {chart_data.julian_day:.4f}",
            "assumptions": "All timing is based on Vimshottari Dasha system and sidereal zodiac",
            "timestamp_utc": datetime.utcnow().isoformat()
        }

        horoscope = HoroscopeOutput(
            meta=meta,
            summary=summary,
            domains=domains,
            rule_traces=all_rule_traces,
            disclaimers=STANDARD_DISCLAIMERS
        )

        return horoscope

    def _generate_summary(self, chart_data: ChartData) -> List[str]:
        """Generate high-level summary bullet points."""
        summary = []

        # Ascendant
        summary.append(
            f"Ascendant in {chart_data.ascendant.sign.value}, "
            f"nakshatra {chart_data.ascendant_nakshatra.nakshatra.value}: "
            f"Personality shaped by this rising sign's qualities"
        )

        # Moon
        moon_pos = next(p for p in chart_data.planets if p.planet.value == "Moon")
        summary.append(
            f"Moon in {moon_pos.sign.value}, nakshatra {chart_data.moon_nakshatra.nakshatra.value}: "
            f"Emotional nature and karmic patterns from past lives"
        )

        # Current dasha
        if chart_data.dasha_timeline.current_mahadasha:
            current_maha = chart_data.dasha_timeline.current_mahadasha
            summary.append(
                f"Currently in {current_maha.planet.value} Mahadasha "
                f"({current_maha.start_date} to {current_maha.end_date})"
            )

        # Key strength
        # Simple heuristic: find planets in own sign or exalted
        strong_planets = []
        for planet_pos in chart_data.planets:
            if self._is_planet_strong(planet_pos, chart_data):
                strong_planets.append(planet_pos.planet.value)

        if strong_planets:
            summary.append(f"Strong planets enhancing life: {', '.join(strong_planets[:3])}")

        return summary

    def _analyze_domain(self, domain: str, chart_data: ChartData) -> DomainAnalysis:
        """
        Analyze a specific life domain.

        Args:
            domain: Domain name
            chart_data: Birth chart data

        Returns:
            DomainAnalysis for the domain
        """
        # Match rules for this domain
        rule_traces = self.rules_engine.match_rules(
            chart_data,
            domain=domain,
            min_priority=65
        )

        # Generate indicators
        indicators = self._generate_indicators(domain, chart_data)

        # Extract Nadi and Bhrigu statements from rules
        nadi_statements = []
        bhrigu_themes = []

        for trace in rule_traces:
            if trace.tradition == "nadi":
                nadi_statements.append(trace.rendered_narrative)
            elif trace.tradition == "bhrigu":
                bhrigu_themes.append(trace.rendered_narrative)

        # Generate timing windows
        timing_windows = self._generate_timing(domain, chart_data)

        # Remedial guidance (optional)
        remedial = self._generate_remedial(domain, chart_data)

        analysis = DomainAnalysis(
            domain=domain,
            indicators=indicators,
            nadi_statements=nadi_statements if nadi_statements else ["(Nadi analysis pending deeper rule coverage)"],
            bhrigu_themes=bhrigu_themes if bhrigu_themes else ["(Bhrigu analysis pending deeper rule coverage)"],
            timing_windows=timing_windows,
            remedial_guidance=remedial,
            rule_traces=rule_traces
        )

        return analysis

    def _generate_indicators(self, domain: str, chart_data: ChartData) -> List[str]:
        """Generate indicators for a domain based on house analysis."""
        indicators = []

        # Map domains to primary houses
        domain_houses = {
            "career": [10, 6],
            "wealth": [2, 11],
            "marriage": [7],
            "family": [2, 4],
            "children": [5],
            "health": [1, 6],
            "spirituality": [9, 12],
            "education": [4, 5],
            "travel": [3, 9, 12],
            "property": [4]
        }

        houses = domain_houses.get(domain, [])

        for house_num in houses:
            lord = chart_data.house_lords.get(house_num)
            if lord:
                lord_pos = next((p for p in chart_data.planets if p.planet == lord), None)
                if lord_pos:
                    indicators.append(
                        f"{house_num}th house lord {lord.value} in {lord_pos.house}th house, "
                        f"{lord_pos.sign.value} sign"
                    )

            # Planets in the house
            planets_in_house = [p for p in chart_data.planets if p.house == house_num]
            if planets_in_house:
                planet_names = [p.planet.value for p in planets_in_house]
                indicators.append(f"Planets in {house_num}th house: {', '.join(planet_names)}")

        return indicators if indicators else ["(Analysis based on overall chart patterns)"]

    def _generate_timing(self, domain: str, chart_data: ChartData) -> List[str]:
        """Generate timing windows based on dasha periods."""
        timing = []

        # Map domains to relevant planets/houses
        domain_significators = {
            "career": [10],
            "wealth": [2, 11],
            "marriage": [7],
            "children": [5],
            "spirituality": [9],
            "education": [4, 5]
        }

        houses = domain_significators.get(domain, [])

        # Find relevant dasha periods
        for house_num in houses:
            lord = chart_data.house_lords.get(house_num)
            if lord:
                # Find mahadasha of this lord
                for maha in chart_data.dasha_timeline.mahadashas[:5]:  # Next 5 mahadashas
                    if maha.planet == lord:
                        timing.append(
                            f"{maha.planet.value} Mahadasha ({maha.start_date} to {maha.end_date}): "
                            f"Significant activation of {domain} matters"
                        )
                        break

        if not timing:
            timing.append("(Timing windows require deeper dasha-antardasha analysis)")

        return timing

    def _generate_remedial(self, domain: str, chart_data: ChartData) -> str:
        """Generate simple remedial guidance."""
        # Very basic remedial suggestions
        remedial_map = {
            "career": "Strengthen the 10th lord through appropriate practices",
            "wealth": "Support 2nd and 11th lords; practice gratitude and generosity",
            "marriage": "Strengthen Venus and 7th lord; cultivate relationship virtues",
            "children": "Honor Jupiter and 5th lord; practice patience and nurturing",
            "health": "Balance ascendant lord; maintain disciplined lifestyle",
            "spirituality": "Support 9th lord through dharmic living and study",
            "education": "Strengthen Mercury and 4th lord; consistent study habits",
            "travel": "Support 9th and 12th lords; be open to new experiences",
            "property": "Strengthen 4th lord and Mars; practice stability"
        }

        return remedial_map.get(domain, "Follow traditional Vedic remedial measures as appropriate")

    def _is_planet_strong(self, planet_pos, chart_data: ChartData) -> bool:
        """Check if a planet is strong (own sign, exaltation, etc.)."""
        # Check own sign
        ownerships = {
            "Sun": ["Leo"],
            "Moon": ["Cancer"],
            "Mars": ["Aries", "Scorpio"],
            "Mercury": ["Gemini", "Virgo"],
            "Jupiter": ["Sagittarius", "Pisces"],
            "Venus": ["Taurus", "Libra"],
            "Saturn": ["Capricorn", "Aquarius"]
        }

        own_signs = ownerships.get(planet_pos.planet.value, [])
        if planet_pos.sign.value in own_signs:
            return True

        # Check exaltation
        exaltations = {
            "Sun": "Aries",
            "Moon": "Taurus",
            "Mars": "Capricorn",
            "Mercury": "Virgo",
            "Jupiter": "Cancer",
            "Venus": "Pisces",
            "Saturn": "Libra"
        }

        if planet_pos.sign.value == exaltations.get(planet_pos.planet.value):
            return True

        # Check kendra/trikona placement
        if planet_pos.house in [1, 4, 5, 7, 9, 10]:
            return True

        return False

    def close(self):
        """Clean up resources."""
        self.chart_service.close()

"""
Horoscope service for generating complete horoscope reports.
Integrates chart calculation, rule matching, and narrative generation.
"""
from typing import List, Dict, Any
from app.domain.models import (
    BirthInfo, HoroscopeOutput, DomainAnalysis,
    Chart, RuleTrace
)
from app.services.chart import ChartService
from app.rules.engine import RuleEngine


class HoroscopeService:
    """Service for generating comprehensive horoscopes."""

    DOMAINS = [
        "personality",
        "career",
        "wealth",
        "marriage",
        "health",
        "spirituality",
        "family",
        "education"
    ]

    def __init__(self):
        """Initialize horoscope service."""
        self.chart_service = ChartService()
        self.rule_engine = RuleEngine(self.chart_service)

    def generate_horoscope(self, birth_info: BirthInfo) -> HoroscopeOutput:
        """
        Generate complete horoscope.

        Args:
            birth_info: Birth information

        Returns:
            Complete HoroscopeOutput
        """
        # Calculate chart
        chart = self.chart_service.calculate_chart(birth_info)

        # Match all rules
        all_rule_traces = self.rule_engine.match_rules(chart)

        # Generate domain analyses
        domain_analyses: List[DomainAnalysis] = []
        for domain in self.DOMAINS:
            analysis = self._generate_domain_analysis(domain, chart, all_rule_traces)
            if analysis:
                domain_analyses.append(analysis)

        # Calculate dasha timeline
        dasha_timeline = self.chart_service.calculate_dasha_timeline(chart, num_years=30)

        # Generate summaries
        chart_summary = self.rule_engine.get_chart_summary(chart)
        nakshatra_summary = self.rule_engine.get_nakshatra_summary(chart)
        summary_bullets = self.rule_engine.generate_summary_bullets(chart, all_rule_traces)

        # Meta information
        meta = {
            "engine_version": "1.0.0",
            "calculation_notes": [
                "Calculations use Lahiri Ayanamsa (sidereal zodiac)",
                "House system: Placidus",
                "Dasha system: Vimshottari (120-year cycle)"
            ],
            "assumptions": [
                "Birth time is accurate to the minute",
                "Timezone conversion is correctly applied",
                "Coordinates are precise for birth location"
            ]
        }

        # Disclaimers
        disclaimers = [
            "This horoscope provides interpretive guidance based on Nadi Jyotisha and Bhrigu Samhita traditions.",
            "Astrological insights are meant for contemplation and self-understanding, not absolute prediction.",
            "Free will and personal effort significantly influence life outcomes.",
            "Consult qualified astrologers for personalized guidance and remedial measures."
        ]

        return HoroscopeOutput(
            meta=meta,
            chart_summary=chart_summary,
            nakshatra_summary=nakshatra_summary,
            summary_bullets=summary_bullets,
            domains=domain_analyses,
            dasha_timeline=dasha_timeline,
            disclaimers=disclaimers
        )

    def _generate_domain_analysis(
        self,
        domain: str,
        chart: Chart,
        all_traces: List[RuleTrace]
    ) -> DomainAnalysis:
        """Generate analysis for a specific domain."""
        # Filter traces for this domain
        domain_traces = [t for t in all_traces if t.domain == domain]

        if not domain_traces:
            return None

        # Generate summary
        summary = self._generate_domain_summary(domain, domain_traces)

        # Generate detailed narrative
        detailed_narrative = self._generate_detailed_narrative(domain_traces)

        # Extract timing windows if relevant
        timing_windows = self._extract_timing_windows(domain, chart)

        return DomainAnalysis(
            domain=domain,
            summary=summary,
            detailed_narrative=detailed_narrative,
            rule_traces=domain_traces,
            timing_windows=timing_windows
        )

    def _generate_domain_summary(self, domain: str, traces: List[RuleTrace]) -> str:
        """Generate concise summary for a domain."""
        if not traces:
            return f"No specific {domain} patterns identified."

        # Use highest priority trace for summary
        top_trace = traces[0]
        first_sentence = top_trace.narrative.split('.')[0] + '.'

        return first_sentence

    def _generate_detailed_narrative(self, traces: List[RuleTrace]) -> str:
        """Combine multiple rule narratives into detailed analysis."""
        if not traces:
            return ""

        narratives = []
        for trace in traces:
            # Add narrative with citation
            narrative_with_citation = f"{trace.narrative}\n*[{trace.rule_id}]*"
            narratives.append(narrative_with_citation)

        return "\n\n".join(narratives)

    def _extract_timing_windows(self, domain: str, chart: Chart) -> List[str]:
        """Extract timing windows from dasha timeline."""
        dasha_timeline = self.chart_service.calculate_dasha_timeline(chart, num_years=10)

        windows = []

        # Current period
        current_maha = dasha_timeline.current_maha_dasha
        current_antar = dasha_timeline.current_antar_dasha

        windows.append(
            f"Current Maha Dasha: {current_maha.planet.value} "
            f"({current_maha.start_date.year}-{current_maha.end_date.year})"
        )
        windows.append(
            f"Current Antar Dasha: {current_antar.planet.value} "
            f"({current_antar.start_date.strftime('%Y-%m')}-"
            f"{current_antar.end_date.strftime('%Y-%m')})"
        )

        # Upcoming significant periods
        if dasha_timeline.upcoming_maha_dashas:
            next_maha = dasha_timeline.upcoming_maha_dashas[0]
            windows.append(
                f"Next Maha Dasha: {next_maha.planet.value} "
                f"starts {next_maha.start_date.strftime('%B %Y')}"
            )

        return windows

    def close(self):
        """Clean up resources."""
        self.chart_service.close()

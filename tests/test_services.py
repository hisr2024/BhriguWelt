"""
Comprehensive tests for all astrology services.
"""
import pytest
import json
from pathlib import Path
from datetime import date
from app.domain.models import BirthInfo
from app.services.chart import ChartService
from app.services.horoscope import HoroscopeService
from app.services.matchmaking import MatchmakingService
from app.services.daily_insights import DailyInsightsService


# Test fixtures directory
FIXTURES_DIR = Path(__file__).parent / "fixtures"


def load_birth_info(filename: str) -> BirthInfo:
    """Load birth info from fixture file."""
    filepath = FIXTURES_DIR / filename
    with open(filepath) as f:
        data = json.load(f)
    return BirthInfo(**data)


class TestChartService:
    """Tests for chart calculation service."""

    def test_calculate_chart_person1(self):
        """Test chart calculation for person 1."""
        birth_info = load_birth_info("person1_raj.json")
        chart_service = ChartService()

        chart = chart_service.calculate_chart(birth_info)

        assert chart.birth_info.name == "Rajesh Kumar"
        assert chart.ascendant is not None
        assert len(chart.planets) == 9  # 7 planets + Rahu + Ketu
        assert len(chart.house_cusps) == 12

        # Verify all planets have required fields
        for planet_pos in chart.planets:
            assert planet_pos.planet is not None
            assert planet_pos.sign is not None
            assert planet_pos.nakshatra is not None
            assert 1 <= planet_pos.nakshatra_pada <= 4
            assert 1 <= planet_pos.house <= 12
            assert 0 <= planet_pos.longitude < 360

        chart_service.close()

    def test_chart_determinism(self):
        """Test that chart calculation is deterministic."""
        birth_info = load_birth_info("person1_raj.json")
        chart_service = ChartService()

        chart1 = chart_service.calculate_chart(birth_info)
        chart2 = chart_service.calculate_chart(birth_info)

        # Should produce identical results
        assert chart1.ascendant == chart2.ascendant
        assert chart1.ascendant_longitude == chart2.ascendant_longitude

        for p1, p2 in zip(chart1.planets, chart2.planets):
            assert p1.planet == p2.planet
            assert p1.longitude == p2.longitude
            assert p1.sign == p2.sign
            assert p1.nakshatra == p2.nakshatra

        chart_service.close()

    def test_dasha_timeline(self):
        """Test Vimshottari dasha calculation."""
        birth_info = load_birth_info("person1_raj.json")
        chart_service = ChartService()

        chart = chart_service.calculate_chart(birth_info)
        # Calculate dashas for a longer period to ensure upcoming dashas
        dasha_timeline = chart_service.calculate_dasha_timeline(chart, num_years=100)

        assert dasha_timeline.current_maha_dasha is not None
        assert dasha_timeline.current_antar_dasha is not None
        # Verify structure (upcoming dashas may be empty for old birth dates)
        assert isinstance(dasha_timeline.upcoming_maha_dashas, list)

        # Verify dasha dates are logical
        assert dasha_timeline.current_maha_dasha.start_date <= date.today()
        assert dasha_timeline.current_maha_dasha.end_date >= date.today()

        chart_service.close()


class TestHoroscopeService:
    """Tests for horoscope generation service."""

    def test_generate_horoscope_person1(self):
        """Test horoscope generation for person 1."""
        birth_info = load_birth_info("person1_raj.json")
        horoscope_service = HoroscopeService()

        horoscope = horoscope_service.generate_horoscope(birth_info)

        # Verify structure
        assert horoscope.meta is not None
        assert 'engine_version' in horoscope.meta
        assert horoscope.chart_summary is not None
        assert horoscope.nakshatra_summary is not None
        assert len(horoscope.summary_bullets) > 0
        assert len(horoscope.domains) > 0
        assert len(horoscope.disclaimers) > 0

        # Verify domains
        domain_names = [d.domain for d in horoscope.domains]
        assert 'personality' in domain_names or 'career' in domain_names

        # Verify each domain has rule traces
        for domain in horoscope.domains:
            assert domain.summary is not None
            assert domain.detailed_narrative is not None
            assert len(domain.rule_traces) > 0

            # Verify rule traces have required fields
            for trace in domain.rule_traces:
                assert trace.rule_id is not None
                assert trace.tradition in ['bhrigu', 'nadi']
                assert trace.domain is not None
                assert trace.narrative is not None
                assert len(trace.citations) > 0

        horoscope_service.close()

    def test_horoscope_all_persons(self):
        """Test horoscope generation for all test persons."""
        horoscope_service = HoroscopeService()

        for i in range(1, 7):
            if i == 1:
                filename = "person1_raj.json"
            elif i == 2:
                filename = "person2_priya.json"
            elif i == 3:
                filename = "person3_amit.json"
            elif i == 4:
                filename = "person4_anjali.json"
            elif i == 5:
                filename = "person5_vikram.json"
            else:
                filename = "person6_meera.json"

            birth_info = load_birth_info(filename)
            horoscope = horoscope_service.generate_horoscope(birth_info)

            assert horoscope is not None
            assert len(horoscope.summary_bullets) > 0
            assert len(horoscope.domains) > 0

        horoscope_service.close()


class TestMatchmakingService:
    """Tests for matchmaking compatibility service."""

    def test_matchmaking_couple1(self):
        """Test matchmaking for couple 1: Rajesh & Priya."""
        partner_a = load_birth_info("person1_raj.json")
        partner_b = load_birth_info("person2_priya.json")

        matchmaking_service = MatchmakingService()
        result = matchmaking_service.analyze_compatibility(partner_a, partner_b)

        # Verify structure
        assert result.meta is not None
        assert result.partner_a_analysis is not None
        assert result.partner_b_analysis is not None
        assert len(result.synastry_rules) > 0
        assert 0 <= result.overall_compatibility <= 100
        assert len(result.marriage_stability_indicators) > 0
        assert len(result.timing_overlap_windows) > 0
        assert len(result.cautions) > 0
        assert len(result.mitigations) > 0
        assert len(result.disclaimers) > 0

        # Verify partner analyses
        assert result.partner_a_analysis.name == "Rajesh Kumar"
        assert result.partner_b_analysis.name == "Priya Sharma"
        assert len(result.partner_a_analysis.key_traits) > 0
        assert len(result.partner_b_analysis.key_traits) > 0

        # Verify synastry rules
        for rule in result.synastry_rules:
            assert rule.rule_id is not None
            assert rule.description is not None
            assert 0 <= rule.compatibility_score <= 100
            assert rule.narrative is not None

        matchmaking_service.close()

    def test_matchmaking_all_couples(self):
        """Test matchmaking for multiple couples."""
        couples = [
            ("person1_raj.json", "person2_priya.json"),
            ("person3_amit.json", "person4_anjali.json"),
            ("person5_vikram.json", "person6_meera.json")
        ]

        matchmaking_service = MatchmakingService()

        for partner_a_file, partner_b_file in couples:
            partner_a = load_birth_info(partner_a_file)
            partner_b = load_birth_info(partner_b_file)

            result = matchmaking_service.analyze_compatibility(partner_a, partner_b)

            assert result is not None
            assert result.overall_compatibility >= 0
            assert len(result.synastry_rules) > 0

        matchmaking_service.close()


class TestDailyInsightsService:
    """Tests for daily insights service."""

    def test_daily_insights_person1(self):
        """Test daily insights for person 1."""
        birth_info = load_birth_info("person1_raj.json")
        daily_insights_service = DailyInsightsService()

        insights = daily_insights_service.generate_daily_insights(birth_info)

        # Verify structure
        assert insights.meta is not None
        assert insights.today is not None
        assert len(insights.next_7_days) == 7
        assert len(insights.key_transit_triggers) > 0
        assert len(insights.disclaimers) > 0

        # Verify today's insight
        assert insights.today.date == date.today()
        assert len(insights.today.focus_areas) > 0
        assert len(insights.today.do_list) > 0
        assert len(insights.today.dont_list) > 0
        assert insights.today.energy_level in ['low', 'medium', 'high']

        # Verify next 7 days
        for i, day_insight in enumerate(insights.next_7_days):
            expected_date = date.today()
            from datetime import timedelta
            expected_date = expected_date + timedelta(days=i + 1)
            assert day_insight.date == expected_date
            assert len(day_insight.focus_areas) > 0

        daily_insights_service.close()

    def test_daily_insights_specific_date(self):
        """Test daily insights for a specific date."""
        birth_info = load_birth_info("person1_raj.json")
        daily_insights_service = DailyInsightsService()

        target_date = date(2025, 1, 1)
        insights = daily_insights_service.generate_daily_insights(birth_info, target_date)

        assert insights.today.date == target_date

        daily_insights_service.close()


class TestRuleEngine:
    """Tests for rule matching engine."""

    def test_rule_matching(self):
        """Test that rules are being matched and applied."""
        birth_info = load_birth_info("person1_raj.json")
        horoscope_service = HoroscopeService()

        horoscope = horoscope_service.generate_horoscope(birth_info)

        # Count total matched rules
        total_rules = sum(len(domain.rule_traces) for domain in horoscope.domains)

        # Should match at least some rules
        assert total_rules > 0

        # Verify rule structure
        for domain in horoscope.domains:
            for trace in domain.rule_traces:
                # Rule ID should follow format
                assert '-' in trace.rule_id or trace.rule_id.startswith('GENERAL')

                # Should have matched triggers
                assert len(trace.matched_triggers) > 0

                # Narrative should not be empty
                assert len(trace.narrative) > 10

                # Should have citations
                assert len(trace.citations) > 0

        horoscope_service.close()


class TestIntegration:
    """Integration tests across services."""

    def test_full_workflow(self):
        """Test complete workflow from chart to horoscope."""
        birth_info = load_birth_info("person1_raj.json")

        # Step 1: Calculate chart
        chart_service = ChartService()
        chart = chart_service.calculate_chart(birth_info)
        assert chart is not None

        # Step 2: Generate horoscope
        horoscope_service = HoroscopeService()
        horoscope = horoscope_service.generate_horoscope(birth_info)
        assert horoscope is not None

        # Step 3: Daily insights
        daily_insights_service = DailyInsightsService()
        insights = daily_insights_service.generate_daily_insights(birth_info)
        assert insights is not None

        # Cleanup
        chart_service.close()
        horoscope_service.close()
        daily_insights_service.close()

    def test_json_serialization(self):
        """Test that all outputs can be serialized to JSON."""
        birth_info = load_birth_info("person1_raj.json")

        # Chart
        chart_service = ChartService()
        chart = chart_service.calculate_chart(birth_info)
        chart_json = chart.model_dump(mode='json')
        assert chart_json is not None
        json_str = json.dumps(chart_json, default=str)
        assert len(json_str) > 0

        # Horoscope
        horoscope_service = HoroscopeService()
        horoscope = horoscope_service.generate_horoscope(birth_info)
        horoscope_json = horoscope.model_dump(mode='json')
        assert horoscope_json is not None
        json_str = json.dumps(horoscope_json, default=str)
        assert len(json_str) > 0

        # Cleanup
        chart_service.close()
        horoscope_service.close()


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

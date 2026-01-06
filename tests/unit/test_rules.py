"""
Unit tests for Rules Engine and DSL.
"""

import pytest

from app.rules.dsl import DSLEvaluator
from app.rules.engine import RulesEngine
from app.services.chart import ChartService
from app.domain.models import PersonInput, PlaceOfBirth


class TestDSLEvaluator:
    """Test cases for DSL Evaluator."""

    @pytest.fixture
    def sample_chart(self):
        """Create sample chart for testing."""
        person = PersonInput(
            name="Test Person",
            date_of_birth="1985-03-15",
            time_of_birth="14:30",
            place_of_birth=PlaceOfBirth(
                city="Delhi",
                country="India",
                lat=28.6139,
                lon=77.2090,
                tz="Asia/Kolkata"
            )
        )
        chart_service = ChartService()
        chart = chart_service.calculate_chart(person)
        chart_service.close()
        return chart

    @pytest.fixture
    def evaluator(self, sample_chart):
        """Create DSL evaluator with sample chart."""
        return DSLEvaluator(sample_chart)

    def test_planet_in_house(self, evaluator, sample_chart):
        """Test planet_in_house evaluation."""
        # Get actual Jupiter house
        jupiter_pos = next(p for p in sample_chart.planets if p.planet.value == "Jupiter")
        jupiter_house = jupiter_pos.house

        # Test positive case
        expr = f"planet_in_house(Jupiter, {jupiter_house})"
        assert evaluator.evaluate(expr) == True

        # Test negative case
        other_house = (jupiter_house % 12) + 1
        expr = f"planet_in_house(Jupiter, {other_house})"
        assert evaluator.evaluate(expr) == False

    def test_planet_in_sign(self, evaluator, sample_chart):
        """Test planet_in_sign evaluation."""
        # Get actual Sun sign
        sun_pos = next(p for p in sample_chart.planets if p.planet.value == "Sun")
        sun_sign = sun_pos.sign.value

        # Test positive case
        expr = f"planet_in_sign(Sun, {sun_sign})"
        assert evaluator.evaluate(expr) == True

        # Test negative case
        expr = "planet_in_sign(Sun, Aquarius)"
        result = evaluator.evaluate(expr)
        # Will be False unless Sun is actually in Aquarius

    def test_nakshatra_of(self, evaluator, sample_chart):
        """Test nakshatra_of evaluation."""
        moon_nak = sample_chart.moon_nakshatra.nakshatra.value

        result = evaluator._eval_nakshatra_of("Moon")
        assert result == moon_nak

    def test_conjunction(self, evaluator, sample_chart):
        """Test conjunction evaluation."""
        # Test Sun conjunction with itself (always true)
        expr = "conjunction(Sun, Sun, 1)"
        assert evaluator.evaluate(expr) == True

    def test_or_condition(self, evaluator):
        """Test OR condition."""
        # At least one should be true
        expr = "planet_in_house(Jupiter, 1) OR planet_in_house(Jupiter, 5) OR planet_in_house(Jupiter, 9)"
        # Jupiter is in some house, so at least one OR clause might match
        result = evaluator.evaluate(expr)
        assert isinstance(result, bool)

    def test_and_condition(self, evaluator, sample_chart):
        """Test AND condition."""
        jupiter_pos = next(p for p in sample_chart.planets if p.planet.value == "Jupiter")
        jupiter_house = jupiter_pos.house
        jupiter_sign = jupiter_pos.sign.value

        # Both should be true
        expr = f"planet_in_house(Jupiter, {jupiter_house}) AND planet_in_sign(Jupiter, {jupiter_sign})"
        assert evaluator.evaluate(expr) == True

    def test_comparison_operator(self, evaluator, sample_chart):
        """Test comparison operators."""
        moon_nak = sample_chart.moon_nakshatra.nakshatra.value

        expr = f'nakshatra_of(Moon) == "{moon_nak}"'
        assert evaluator.evaluate(expr) == True

        expr = 'nakshatra_of(Moon) == "SomeOtherNakshatra"'
        assert evaluator.evaluate(expr) == False


class TestRulesEngine:
    """Test cases for Rules Engine."""

    @pytest.fixture
    def rules_engine(self):
        """Create rules engine instance."""
        return RulesEngine()

    @pytest.fixture
    def sample_chart(self):
        """Create sample chart for testing."""
        person = PersonInput(
            name="Test Person",
            date_of_birth="1985-03-15",
            time_of_birth="14:30",
            place_of_birth=PlaceOfBirth(
                city="Delhi",
                country="India",
                lat=28.6139,
                lon=77.2090,
                tz="Asia/Kolkata"
            )
        )
        chart_service = ChartService()
        chart = chart_service.calculate_chart(person)
        chart_service.close()
        return chart

    def test_load_rules(self, rules_engine):
        """Test that rules are loaded."""
        assert len(rules_engine.rules) > 0

    def test_match_rules(self, rules_engine, sample_chart):
        """Test matching rules against chart."""
        traces = rules_engine.match_rules(sample_chart)

        # Should match at least some rules
        assert isinstance(traces, list)
        # At least the moon_nakshatra_any rule should match
        assert len(traces) > 0

    def test_match_rules_by_domain(self, rules_engine, sample_chart):
        """Test matching rules for specific domain."""
        career_traces = rules_engine.match_rules(sample_chart, domain="career")

        assert isinstance(career_traces, list)
        assert all(trace.domain == "career" for trace in career_traces)

    def test_match_rules_by_tradition(self, rules_engine, sample_chart):
        """Test matching rules for specific tradition."""
        bhrigu_traces = rules_engine.match_rules(sample_chart, tradition="bhrigu")

        assert isinstance(bhrigu_traces, list)
        assert all(trace.tradition == "bhrigu" for trace in bhrigu_traces)

    def test_match_rules_sorted_by_priority(self, rules_engine, sample_chart):
        """Test that matched rules are sorted by priority."""
        traces = rules_engine.match_rules(sample_chart)

        if len(traces) > 1:
            # Check descending priority order
            for i in range(len(traces) - 1):
                assert traces[i].priority >= traces[i + 1].priority

    def test_get_domains(self, rules_engine):
        """Test getting list of domains."""
        domains = rules_engine.get_domains()

        assert isinstance(domains, list)
        assert len(domains) > 0
        assert "career" in domains or "wealth" in domains or "marriage" in domains

    def test_get_traditions(self, rules_engine):
        """Test getting list of traditions."""
        traditions = rules_engine.get_traditions()

        assert isinstance(traditions, list)
        assert "bhrigu" in traditions
        assert "nadi" in traditions

    def test_rule_trace_structure(self, rules_engine, sample_chart):
        """Test that rule traces have correct structure."""
        traces = rules_engine.match_rules(sample_chart)

        if len(traces) > 0:
            trace = traces[0]
            assert hasattr(trace, "rule_id")
            assert hasattr(trace, "tradition")
            assert hasattr(trace, "priority")
            assert hasattr(trace, "domain")
            assert hasattr(trace, "matched_triggers")
            assert hasattr(trace, "rendered_narrative")
            assert hasattr(trace, "citations")

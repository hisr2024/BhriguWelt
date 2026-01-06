"""
Unit tests for Horoscope Service.
"""

import pytest

from app.services.horoscope import HoroscopeService
from app.domain.models import PersonInput, PlaceOfBirth


class TestHoroscopeService:
    """Test cases for HoroscopeService."""

    @pytest.fixture
    def horoscope_service(self):
        """Create horoscope service instance."""
        return HoroscopeService()

    @pytest.fixture
    def sample_person(self):
        """Create sample person input."""
        return PersonInput(
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

    def test_generate_horoscope(self, horoscope_service, sample_person):
        """Test horoscope generation."""
        horoscope = horoscope_service.generate_horoscope(sample_person)

        assert horoscope is not None
        assert len(horoscope.summary) > 0
        assert len(horoscope.domains) > 0

    def test_horoscope_has_all_domains(self, horoscope_service, sample_person):
        """Test that horoscope covers all expected domains."""
        horoscope = horoscope_service.generate_horoscope(sample_person)

        expected_domains = ["career", "wealth", "marriage", "family", "children",
                           "health", "spirituality", "education", "travel", "property"]

        for domain in expected_domains:
            assert domain in horoscope.domains

    def test_domain_analysis_structure(self, horoscope_service, sample_person):
        """Test that each domain analysis has proper structure."""
        horoscope = horoscope_service.generate_horoscope(sample_person)

        for domain_name, analysis in horoscope.domains.items():
            assert analysis.domain == domain_name
            assert isinstance(analysis.indicators, list)
            assert isinstance(analysis.nadi_statements, list)
            assert isinstance(analysis.bhrigu_themes, list)
            assert isinstance(analysis.timing_windows, list)
            assert isinstance(analysis.rule_traces, list)

    def test_horoscope_summary_not_empty(self, horoscope_service, sample_person):
        """Test that horoscope summary is generated."""
        horoscope = horoscope_service.generate_horoscope(sample_person)

        assert len(horoscope.summary) >= 3
        # Summary should mention ascendant, moon, and current dasha

    def test_horoscope_meta_information(self, horoscope_service, sample_person):
        """Test that horoscope has metadata."""
        horoscope = horoscope_service.generate_horoscope(sample_person)

        assert "engine_version" in horoscope.meta
        assert "calculation_notes" in horoscope.meta

    def test_horoscope_disclaimers(self, horoscope_service, sample_person):
        """Test that horoscope includes disclaimers."""
        horoscope = horoscope_service.generate_horoscope(sample_person)

        assert len(horoscope.disclaimers) > 0

    def test_career_domain_analysis(self, horoscope_service, sample_person):
        """Test career domain specific analysis."""
        horoscope = horoscope_service.generate_horoscope(sample_person)

        career = horoscope.domains["career"]
        assert career.domain == "career"
        assert len(career.indicators) > 0

    def test_wealth_domain_analysis(self, horoscope_service, sample_person):
        """Test wealth domain specific analysis."""
        horoscope = horoscope_service.generate_horoscope(sample_person)

        wealth = horoscope.domains["wealth"]
        assert wealth.domain == "wealth"
        assert len(wealth.indicators) > 0

    def test_marriage_domain_analysis(self, horoscope_service, sample_person):
        """Test marriage domain specific analysis."""
        horoscope = horoscope_service.generate_horoscope(sample_person)

        marriage = horoscope.domains["marriage"]
        assert marriage.domain == "marriage"
        assert len(marriage.indicators) > 0

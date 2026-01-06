"""
Unit tests for Chart Service.
"""

import pytest
import json

from app.services.chart import ChartService
from app.domain.models import PersonInput, PlaceOfBirth


class TestChartService:
    """Test cases for ChartService."""

    @pytest.fixture
    def chart_service(self):
        """Create chart service instance."""
        return ChartService()

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

    def test_calculate_chart(self, chart_service, sample_person):
        """Test chart calculation."""
        chart_data = chart_service.calculate_chart(sample_person)

        assert chart_data is not None
        assert chart_data.person.name == "Test Person"
        assert len(chart_data.planets) == 9
        assert chart_data.ascendant is not None
        assert len(chart_data.house_cusps.cusps) == 12

    def test_chart_has_all_planets(self, chart_service, sample_person):
        """Test that all planets are present in chart."""
        chart_data = chart_service.calculate_chart(sample_person)

        planet_names = [p.planet.value for p in chart_data.planets]
        assert "Sun" in planet_names
        assert "Moon" in planet_names
        assert "Mars" in planet_names
        assert "Mercury" in planet_names
        assert "Jupiter" in planet_names
        assert "Venus" in planet_names
        assert "Saturn" in planet_names
        assert "Rahu" in planet_names
        assert "Ketu" in planet_names

    def test_chart_planets_have_nakshatras(self, chart_service, sample_person):
        """Test that all planets have nakshatra assignments."""
        chart_data = chart_service.calculate_chart(sample_person)

        for planet_pos in chart_data.planets:
            assert planet_pos.nakshatra is not None
            assert 1 <= planet_pos.nakshatra_pada <= 4

    def test_chart_planets_in_houses(self, chart_service, sample_person):
        """Test that all planets are assigned to houses."""
        chart_data = chart_service.calculate_chart(sample_person)

        for planet_pos in chart_data.planets:
            assert 1 <= planet_pos.house <= 12

    def test_house_lords_calculated(self, chart_service, sample_person):
        """Test that house lords are calculated."""
        chart_data = chart_service.calculate_chart(sample_person)

        assert len(chart_data.house_lords) == 12
        for house_num in range(1, 13):
            assert house_num in chart_data.house_lords
            assert chart_data.house_lords[house_num] is not None

    def test_moon_nakshatra_info(self, chart_service, sample_person):
        """Test Moon nakshatra information."""
        chart_data = chart_service.calculate_chart(sample_person)

        assert chart_data.moon_nakshatra is not None
        assert chart_data.moon_nakshatra.nakshatra is not None
        assert 1 <= chart_data.moon_nakshatra.pada <= 4
        assert chart_data.moon_nakshatra.lord is not None

    def test_ascendant_nakshatra_info(self, chart_service, sample_person):
        """Test ascendant nakshatra information."""
        chart_data = chart_service.calculate_chart(sample_person)

        assert chart_data.ascendant_nakshatra is not None
        assert chart_data.ascendant_nakshatra.nakshatra is not None
        assert 1 <= chart_data.ascendant_nakshatra.pada <= 4

    def test_d9_chart_calculated(self, chart_service, sample_person):
        """Test that D9 (Navamsa) chart is calculated."""
        chart_data = chart_service.calculate_chart(sample_person)

        assert "planets" in chart_data.d9_chart
        assert "vargottama_planets" in chart_data.d9_chart
        assert isinstance(chart_data.d9_chart["vargottama_planets"], list)

    def test_dasha_timeline_calculated(self, chart_service, sample_person):
        """Test that dasha timeline is calculated."""
        chart_data = chart_service.calculate_chart(sample_person)

        assert chart_data.dasha_timeline is not None
        assert chart_data.dasha_timeline.system == "Vimshottari"
        assert len(chart_data.dasha_timeline.mahadashas) == 9

    def test_get_planet_by_name(self, chart_service, sample_person):
        """Test retrieving planet by name."""
        chart_data = chart_service.calculate_chart(sample_person)

        jupiter = chart_service.get_planet_by_name(chart_data, "Jupiter")
        assert jupiter is not None
        assert jupiter.planet.value == "Jupiter"

    def test_get_planets_in_house(self, chart_service, sample_person):
        """Test getting planets in a specific house."""
        chart_data = chart_service.calculate_chart(sample_person)

        # There should be at least some planets in houses
        all_houses_planets = []
        for house_num in range(1, 13):
            planets = chart_service.get_planets_in_house(chart_data, house_num)
            all_houses_planets.extend(planets)

        assert len(all_houses_planets) == 9  # All planets accounted for

    def test_are_planets_conjunct(self, chart_service, sample_person):
        """Test conjunction check."""
        chart_data = chart_service.calculate_chart(sample_person)

        # Test a planet with itself (should always be conjunct)
        jupiter = chart_service.get_planet_by_name(chart_data, "Jupiter")
        assert chart_service.are_planets_conjunct(jupiter, jupiter, orb=1.0)

    def test_get_lord_of_house(self, chart_service, sample_person):
        """Test getting house lord."""
        chart_data = chart_service.calculate_chart(sample_person)

        lord_1 = chart_service.get_lord_of_house(chart_data, 1)
        assert lord_1 is not None

        lord_10 = chart_service.get_lord_of_house(chart_data, 10)
        assert lord_10 is not None

    def test_ayanamsa_in_range(self, chart_service, sample_person):
        """Test that ayanamsa is in reasonable range."""
        chart_data = chart_service.calculate_chart(sample_person)

        # For 1985, Lahiri ayanamsa should be around 23-24 degrees
        assert 20 < chart_data.ayanamsa < 26

"""
Unit tests for Dasha Service.
"""

import pytest
from datetime import datetime

from app.services.dasha import DashaService
from app.domain.models import Planet


class TestDashaService:
    """Test cases for DashaService."""

    @pytest.fixture
    def dasha_service(self):
        """Create dasha service instance."""
        return DashaService()

    def test_calculate_vimshottari_dasha(self, dasha_service):
        """Test Vimshottari dasha calculation."""
        # Moon at 45° (Taurus, Rohini nakshatra)
        dasha_timeline = dasha_service.calculate_vimshottari_dasha("1985-03-15", 45.0)

        assert dasha_timeline is not None
        assert dasha_timeline.system == "Vimshottari"
        assert len(dasha_timeline.mahadashas) == 9

    def test_dasha_start_planet(self, dasha_service):
        """Test that dasha starts from correct nakshatra lord."""
        # 0° is Ashwini, ruled by Ketu
        dasha_timeline = dasha_service.calculate_vimshottari_dasha("1985-01-01", 0.0)
        assert dasha_timeline.start_planet == Planet.KETU

        # 13.333° is Bharani, ruled by Venus
        dasha_timeline = dasha_service.calculate_vimshottari_dasha("1985-01-01", 13.5)
        assert dasha_timeline.start_planet == Planet.VENUS

    def test_dasha_period_durations(self, dasha_service):
        """Test that dasha periods have correct durations."""
        dasha_timeline = dasha_service.calculate_vimshottari_dasha("1985-01-01", 0.0)

        # Check that all 9 dashas are present
        planet_names = [maha.planet.value for maha in dasha_timeline.mahadashas]
        assert len(planet_names) == 9
        assert len(set(planet_names)) == 9  # All unique

        # Verify expected durations
        for maha in dasha_timeline.mahadashas:
            assert maha.duration_years > 0
            assert maha.duration_years <= 20  # Venus has the longest (20 years)

    def test_birth_balance_calculation(self, dasha_service):
        """Test birth balance calculation."""
        # At the start of a nakshatra, should have full period remaining
        dasha_timeline = dasha_service.calculate_vimshottari_dasha("1985-01-01", 0.0)
        # Ketu dasha is 7 years
        assert 6.5 < dasha_timeline.birth_balance_years <= 7.0

        # At the end of a nakshatra, should have minimal balance
        dasha_timeline = dasha_service.calculate_vimshottari_dasha("1985-01-01", 13.0)
        assert dasha_timeline.birth_balance_years < 1.0

    def test_mahadasha_dates_sequential(self, dasha_service):
        """Test that mahadasha dates are sequential."""
        dasha_timeline = dasha_service.calculate_vimshottari_dasha("1985-01-01", 45.0)

        for i in range(len(dasha_timeline.mahadashas) - 1):
            current_end = dasha_timeline.mahadashas[i].end_date
            next_start = dasha_timeline.mahadashas[i + 1].start_date
            assert current_end == next_start

    def test_calculate_antardashas(self, dasha_service):
        """Test antardasha calculation."""
        dasha_timeline = dasha_service.calculate_vimshottari_dasha("1985-01-01", 0.0)
        first_maha = dasha_timeline.mahadashas[0]

        antardashas = dasha_service.calculate_antardashas(first_maha)

        assert len(antardashas) == 9
        assert all(antar.level == "antardasha" for antar in antardashas)

    def test_antardashas_sequential(self, dasha_service):
        """Test that antardashas are sequential."""
        dasha_timeline = dasha_service.calculate_vimshottari_dasha("1985-01-01", 0.0)
        first_maha = dasha_timeline.mahadashas[0]

        antardashas = dasha_service.calculate_antardashas(first_maha)

        for i in range(len(antardashas) - 1):
            assert antardashas[i].end_date == antardashas[i + 1].start_date

    def test_antardasha_covers_mahadasha(self, dasha_service):
        """Test that antardashas span the entire mahadasha."""
        dasha_timeline = dasha_service.calculate_vimshottari_dasha("1985-01-01", 0.0)
        first_maha = dasha_timeline.mahadashas[0]

        antardashas = dasha_service.calculate_antardashas(first_maha)

        assert antardashas[0].start_date == first_maha.start_date
        assert antardashas[-1].end_date == first_maha.end_date

    def test_get_dasha_periods_in_range(self, dasha_service):
        """Test getting dasha periods in a date range."""
        dasha_timeline = dasha_service.calculate_vimshottari_dasha("1985-01-01", 45.0)

        # Get dashas in a 10-year range
        periods = dasha_service.get_dasha_periods_in_range(
            dasha_timeline,
            "1985-01-01",
            "1995-01-01"
        )

        assert len(periods) > 0
        assert all(p.level == "mahadasha" for p in periods)

"""
Unit tests for Ephemeris Service.
"""

import pytest
from datetime import datetime
import pytz

from app.services.ephemeris import EphemerisService


class TestEphemerisService:
    """Test cases for EphemerisService."""

    @pytest.fixture
    def ephe_service(self):
        """Create ephemeris service instance."""
        return EphemerisService()

    def test_datetime_to_jd(self, ephe_service):
        """Test Julian Day calculation."""
        dt = datetime(2000, 1, 1, 12, 0, 0, tzinfo=pytz.UTC)
        jd = ephe_service.datetime_to_jd(dt)
        assert isinstance(jd, float)
        assert jd > 2451544  # J2000.0 is approximately 2451545

    def test_local_to_utc(self, ephe_service):
        """Test local time to UTC conversion."""
        utc_dt = ephe_service.local_to_utc("2023-01-01", "12:00", "Asia/Kolkata")
        assert isinstance(utc_dt, datetime)
        assert utc_dt.tzinfo == pytz.UTC
        # IST is UTC+5:30, so 12:00 IST = 06:30 UTC
        assert utc_dt.hour == 6
        assert utc_dt.minute == 30

    def test_get_ayanamsa(self, ephe_service):
        """Test ayanamsa calculation."""
        jd = 2451545.0  # J2000.0
        ayanamsa = ephe_service.get_ayanamsa(jd)
        assert isinstance(ayanamsa, float)
        assert 20 < ayanamsa < 25  # Lahiri ayanamsa around 23-24° in 2000

    def test_get_planet_position_sun(self, ephe_service):
        """Test Sun position calculation."""
        jd = 2451545.0
        pos = ephe_service.get_planet_position("Sun", jd)
        assert "longitude" in pos
        assert "latitude" in pos
        assert 0 <= pos["longitude"] < 360
        assert not pos["is_retrograde"]  # Sun never retrogrades

    def test_get_planet_position_moon(self, ephe_service):
        """Test Moon position calculation."""
        jd = 2451545.0
        pos = ephe_service.get_planet_position("Moon", jd)
        assert "longitude" in pos
        assert 0 <= pos["longitude"] < 360
        assert not pos["is_retrograde"]  # Moon never retrogrades

    def test_get_planet_position_jupiter(self, ephe_service):
        """Test Jupiter position calculation."""
        jd = 2451545.0
        pos = ephe_service.get_planet_position("Jupiter", jd)
        assert "longitude" in pos
        assert 0 <= pos["longitude"] < 360
        assert isinstance(pos["is_retrograde"], bool)

    def test_get_all_planet_positions(self, ephe_service):
        """Test getting all planet positions."""
        jd = 2451545.0
        positions = ephe_service.get_all_planet_positions(jd)
        assert len(positions) == 9  # Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu
        assert "Sun" in positions
        assert "Moon" in positions
        assert "Rahu" in positions
        assert "Ketu" in positions

    def test_ketu_position_opposite_rahu(self, ephe_service):
        """Test that Ketu is 180° opposite to Rahu."""
        jd = 2451545.0
        positions = ephe_service.get_all_planet_positions(jd)
        rahu_long = positions["Rahu"]["longitude"]
        ketu_long = positions["Ketu"]["longitude"]

        diff = abs(rahu_long - ketu_long)
        # Should be 180° apart (accounting for rounding)
        assert abs(diff - 180.0) < 0.1 or abs(diff - 180.0) > 359.9

    def test_get_house_cusps(self, ephe_service):
        """Test house cusp calculation."""
        jd = 2451545.0
        lat = 28.6139  # Delhi
        lon = 77.2090

        cusps, asc, mc = ephe_service.get_house_cusps(jd, lat, lon)
        assert len(cusps) == 12
        assert all(0 <= cusp < 360 for cusp in cusps)
        assert 0 <= asc < 360
        assert 0 <= mc < 360

    def test_longitude_to_sign(self, ephe_service):
        """Test longitude to sign conversion."""
        # 0° = 0° Aries
        sign, sign_long = ephe_service.longitude_to_sign(0)
        assert sign == "Aries"
        assert sign_long == 0

        # 30° = 0° Taurus
        sign, sign_long = ephe_service.longitude_to_sign(30)
        assert sign == "Taurus"
        assert sign_long == 0

        # 45° = 15° Taurus
        sign, sign_long = ephe_service.longitude_to_sign(45)
        assert sign == "Taurus"
        assert abs(sign_long - 15) < 0.1

    def test_longitude_to_nakshatra(self, ephe_service):
        """Test longitude to nakshatra conversion."""
        # 0° = Start of Ashwini
        nak, pada, lord, long_in_nak = ephe_service.longitude_to_nakshatra(0)
        assert nak == "Ashwini"
        assert pada == 1
        assert lord == "Ketu"
        assert long_in_nak == 0

        # 13.333333° = Start of Bharani
        nak, pada, lord, long_in_nak = ephe_service.longitude_to_nakshatra(13.333333)
        assert nak == "Bharani"
        assert pada == 1
        assert lord == "Venus"

    def test_get_sign_lord(self, ephe_service):
        """Test getting sign lordship."""
        assert ephe_service.get_sign_lord("Aries") == "Mars"
        assert ephe_service.get_sign_lord("Taurus") == "Venus"
        assert ephe_service.get_sign_lord("Leo") == "Sun"
        assert ephe_service.get_sign_lord("Cancer") == "Moon"
        assert ephe_service.get_sign_lord("Sagittarius") == "Jupiter"

    def test_calculate_navamsa_longitude(self, ephe_service):
        """Test Navamsa longitude calculation."""
        # 0° Aries should give specific navamsa
        d9_long = ephe_service.calculate_navamsa_longitude(0)
        assert 0 <= d9_long < 360

        # 15° Aries
        d9_long = ephe_service.calculate_navamsa_longitude(15)
        assert 0 <= d9_long < 360

"""
Ephemeris service using Swiss Ephemeris for offline calculations.
Provides planetary positions, house cusps, and coordinate transformations.
"""

import swisseph as swe
from datetime import datetime
from typing import Dict, Tuple, List
import pytz

from app.config import (
    AYANAMSA_MODE, HOUSE_SYSTEM, SIGNS, NAKSHATRAS,
    NAKSHATRA_LORDS, NAKSHATRA_DEGREES, SIGN_LORDS,
    EPHE_PATH
)


# Set ephemeris path
swe.set_ephe_path(EPHE_PATH)


class EphemerisService:
    """
    Wrapper around Swiss Ephemeris for all astronomical calculations.
    All calculations are done offline using the ephemeris data files.
    """

    # Swiss Ephemeris planet constants
    PLANET_CODES = {
        "Sun": swe.SUN,
        "Moon": swe.MOON,
        "Mars": swe.MARS,
        "Mercury": swe.MERCURY,
        "Jupiter": swe.JUPITER,
        "Venus": swe.VENUS,
        "Saturn": swe.SATURN,
        "Rahu": swe.MEAN_NODE,  # Using mean node for Rahu
        "Ketu": swe.MEAN_NODE   # Ketu is 180° opposite to Rahu
    }

    def __init__(self):
        """Initialize ephemeris service."""
        swe.set_sid_mode(AYANAMSA_MODE)

    def datetime_to_jd(self, dt: datetime) -> float:
        """
        Convert datetime to Julian Day in UTC.

        Args:
            dt: datetime object (should be UTC)

        Returns:
            Julian Day number
        """
        jd = swe.julday(dt.year, dt.month, dt.day,
                        dt.hour + dt.minute / 60.0 + dt.second / 3600.0)
        return jd

    def local_to_utc(self, date_str: str, time_str: str, timezone_str: str) -> datetime:
        """
        Convert local date/time to UTC datetime.

        Args:
            date_str: Date in YYYY-MM-DD format
            time_str: Time in HH:MM format
            timezone_str: IANA timezone string

        Returns:
            UTC datetime object
        """
        year, month, day = map(int, date_str.split('-'))
        hour, minute = map(int, time_str.split(':'))

        tz = pytz.timezone(timezone_str)
        local_dt = tz.localize(datetime(year, month, day, hour, minute, 0))
        utc_dt = local_dt.astimezone(pytz.UTC)

        return utc_dt

    def get_ayanamsa(self, jd: float) -> float:
        """
        Get ayanamsa value for given Julian Day.

        Args:
            jd: Julian Day number

        Returns:
            Ayanamsa in degrees
        """
        return swe.get_ayanamsa(jd)

    def get_planet_position(self, planet_name: str, jd: float) -> Dict:
        """
        Get sidereal position of a planet.

        Args:
            planet_name: Name of the planet
            jd: Julian Day number

        Returns:
            Dictionary with longitude, latitude, speed, etc.
        """
        planet_code = self.PLANET_CODES.get(planet_name)
        if planet_code is None:
            raise ValueError(f"Unknown planet: {planet_name}")

        # Calculate position with SEFLG_SIDEREAL flag
        result = swe.calc_ut(jd, planet_code, swe.FLG_SIDEREAL | swe.FLG_SPEED)

        longitude = result[0][0]
        latitude = result[0][1]
        distance = result[0][2]
        speed = result[0][3]

        # For Ketu, add 180 degrees to Rahu's position
        if planet_name == "Ketu":
            longitude = (longitude + 180.0) % 360.0

        # Normalize longitude to 0-360
        longitude = longitude % 360.0

        # Determine if retrograde (speed < 0)
        is_retrograde = speed < 0 if planet_name not in ["Rahu", "Ketu"] else False
        # Rahu and Ketu are always retrograde by nature, but we don't mark them as such

        return {
            "longitude": longitude,
            "latitude": latitude,
            "distance": distance,
            "speed": speed,
            "is_retrograde": is_retrograde
        }

    def get_all_planet_positions(self, jd: float) -> Dict[str, Dict]:
        """
        Get positions of all planets.

        Args:
            jd: Julian Day number

        Returns:
            Dictionary mapping planet names to their positions
        """
        positions = {}
        for planet_name in self.PLANET_CODES.keys():
            positions[planet_name] = self.get_planet_position(planet_name, jd)
        return positions

    def get_house_cusps(self, jd: float, lat: float, lon: float) -> Tuple[List[float], float, float]:
        """
        Calculate house cusps and angles.

        Args:
            jd: Julian Day number
            lat: Latitude in degrees
            lon: Longitude in degrees (East positive)

        Returns:
            Tuple of (house_cusps, ascendant, midheaven)
        """
        # Calculate houses using specified house system
        cusps, ascmc = swe.houses(jd, lat, lon, HOUSE_SYSTEM)

        # Get ayanamsa to convert to sidereal
        ayanamsa = self.get_ayanamsa(jd)

        # Convert cusps to sidereal
        house_cusps = [(cusp - ayanamsa) % 360.0 for cusp in cusps]

        # Ascendant and MC (Midheaven)
        ascendant = (ascmc[0] - ayanamsa) % 360.0
        midheaven = (ascmc[1] - ayanamsa) % 360.0

        return house_cusps, ascendant, midheaven

    def longitude_to_sign(self, longitude: float) -> Tuple[str, float]:
        """
        Convert absolute longitude to sign and sign longitude.

        Args:
            longitude: Absolute longitude (0-360 degrees)

        Returns:
            Tuple of (sign_name, longitude_within_sign)
        """
        sign_index = int(longitude / 30)
        sign_longitude = longitude % 30
        sign_name = SIGNS[sign_index]
        return sign_name, sign_longitude

    def longitude_to_nakshatra(self, longitude: float) -> Tuple[str, int, str, float]:
        """
        Convert longitude to nakshatra, pada, and lord.

        Args:
            longitude: Absolute longitude (0-360 degrees)

        Returns:
            Tuple of (nakshatra_name, pada, lord, longitude_in_nakshatra)
        """
        # Each nakshatra is 13°20' = 13.333333 degrees
        nakshatra_index = int(longitude / NAKSHATRA_DEGREES)
        nakshatra_index = nakshatra_index % 27  # Ensure we stay within 0-26

        # Position within the nakshatra
        longitude_in_nakshatra = longitude % NAKSHATRA_DEGREES

        # Pada (1-4) within the nakshatra
        pada = int(longitude_in_nakshatra / (NAKSHATRA_DEGREES / 4)) + 1

        nakshatra_name = NAKSHATRAS[nakshatra_index]
        lord = NAKSHATRA_LORDS[nakshatra_index]

        return nakshatra_name, pada, lord, longitude_in_nakshatra

    def get_house_number(self, longitude: float, house_cusps: List[float]) -> int:
        """
        Determine which house a planet is in based on house cusps.

        Args:
            longitude: Planet's longitude
            house_cusps: List of 12 house cusp longitudes

        Returns:
            House number (1-12)
        """
        # Normalize longitude
        longitude = longitude % 360.0

        for i in range(12):
            cusp_start = house_cusps[i]
            cusp_end = house_cusps[(i + 1) % 12]

            # Handle wraparound at 360/0 degrees
            if cusp_end < cusp_start:
                if longitude >= cusp_start or longitude < cusp_end:
                    return i + 1
            else:
                if cusp_start <= longitude < cusp_end:
                    return i + 1

        # Fallback (should not happen)
        return 1

    def get_sign_lord(self, sign_name: str) -> str:
        """
        Get the ruling planet of a sign.

        Args:
            sign_name: Name of the zodiac sign

        Returns:
            Name of the ruling planet
        """
        return SIGN_LORDS.get(sign_name, "Unknown")

    def calculate_navamsa_longitude(self, rasi_longitude: float) -> float:
        """
        Calculate Navamsa (D9) longitude from Rasi longitude.

        Each sign is divided into 9 parts of 3°20' each.
        The 9 divisions cycle through signs of the same element.

        Args:
            rasi_longitude: Longitude in Rasi chart (0-360)

        Returns:
            Longitude in Navamsa chart (0-360)
        """
        # Determine sign (0-11)
        sign_num = int(rasi_longitude / 30)

        # Longitude within sign (0-30)
        sign_long = rasi_longitude % 30

        # Navamsa number within the sign (0-8)
        navamsa_num = int(sign_long / (30.0 / 9.0))

        # Starting sign for navamsa calculation depends on sign element
        # Aries, Leo, Sagittarius (Fire) -> start from Aries (0)
        # Taurus, Virgo, Capricorn (Earth) -> start from Capricorn (9)
        # Gemini, Libra, Aquarius (Air) -> start from Libra (6)
        # Cancer, Scorpio, Pisces (Water) -> start from Cancer (3)

        element = sign_num % 3
        if sign_num in [0, 4, 8]:  # Aries, Leo, Sagittarius
            start_sign = 0
        elif sign_num in [1, 5, 9]:  # Taurus, Virgo, Capricorn
            start_sign = 9
        elif sign_num in [2, 6, 10]:  # Gemini, Libra, Aquarius
            start_sign = 6
        else:  # Cancer, Scorpio, Pisces
            start_sign = 3

        # Calculate navamsa sign
        navamsa_sign = (start_sign + navamsa_num) % 12

        # Calculate exact longitude in navamsa
        # Position within the 3°20' division
        pos_in_division = sign_long % (30.0 / 9.0)

        # Scale to full sign (0-30)
        navamsa_sign_long = (pos_in_division / (30.0 / 9.0)) * 30.0

        # Absolute navamsa longitude
        navamsa_longitude = navamsa_sign * 30.0 + navamsa_sign_long

        return navamsa_longitude

    def close(self):
        """Clean up Swiss Ephemeris resources."""
        swe.close()

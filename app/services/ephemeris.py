"""
Ephemeris service using pyswisseph for planetary calculations.
Handles all astronomical computations offline.
"""
import swisseph as swe
from datetime import datetime, timezone
from typing import Tuple, Dict, List
import pytz
from app.domain.models import Planet, Sign, Nakshatra


# Swiss Ephemeris planet constants
PLANET_MAP = {
    Planet.SUN: swe.SUN,
    Planet.MOON: swe.MOON,
    Planet.MARS: swe.MARS,
    Planet.MERCURY: swe.MERCURY,
    Planet.JUPITER: swe.JUPITER,
    Planet.VENUS: swe.VENUS,
    Planet.SATURN: swe.SATURN,
    Planet.RAHU: swe.MEAN_NODE,  # Mean North Node
}

# Ketu is 180 degrees opposite to Rahu
KETU_OFFSET = 180.0

# Ayanamsa for sidereal calculations (Lahiri)
AYANAMSA_LAHIRI = swe.SIDM_LAHIRI

# Sign boundaries (0-30, 30-60, etc.)
SIGNS = [
    Sign.ARIES, Sign.TAURUS, Sign.GEMINI, Sign.CANCER,
    Sign.LEO, Sign.VIRGO, Sign.LIBRA, Sign.SCORPIO,
    Sign.SAGITTARIUS, Sign.CAPRICORN, Sign.AQUARIUS, Sign.PISCES
]

# Nakshatra list (27 nakshatras)
NAKSHATRAS = [
    Nakshatra.ASHWINI, Nakshatra.BHARANI, Nakshatra.KRITTIKA, Nakshatra.ROHINI,
    Nakshatra.MRIGASHIRA, Nakshatra.ARDRA, Nakshatra.PUNARVASU, Nakshatra.PUSHYA,
    Nakshatra.ASHLESHA, Nakshatra.MAGHA, Nakshatra.PURVA_PHALGUNI, Nakshatra.UTTARA_PHALGUNI,
    Nakshatra.HASTA, Nakshatra.CHITRA, Nakshatra.SWATI, Nakshatra.VISHAKHA,
    Nakshatra.ANURADHA, Nakshatra.JYESHTHA, Nakshatra.MULA, Nakshatra.PURVA_ASHADHA,
    Nakshatra.UTTARA_ASHADHA, Nakshatra.SHRAVANA, Nakshatra.DHANISHTHA, Nakshatra.SHATABHISHA,
    Nakshatra.PURVA_BHADRAPADA, Nakshatra.UTTARA_BHADRAPADA, Nakshatra.REVATI
]

# Nakshatra lords (in Vimshottari sequence)
NAKSHATRA_LORDS = [
    Planet.KETU, Planet.VENUS, Planet.SUN, Planet.MOON,
    Planet.MARS, Planet.RAHU, Planet.JUPITER, Planet.SATURN,
    Planet.MERCURY, Planet.KETU, Planet.VENUS, Planet.SUN,
    Planet.MOON, Planet.MARS, Planet.RAHU, Planet.JUPITER,
    Planet.SATURN, Planet.MERCURY, Planet.KETU, Planet.VENUS,
    Planet.SUN, Planet.MOON, Planet.MARS, Planet.RAHU,
    Planet.JUPITER, Planet.SATURN, Planet.MERCURY
]

# Sign lords
SIGN_LORDS = {
    Sign.ARIES: Planet.MARS,
    Sign.TAURUS: Planet.VENUS,
    Sign.GEMINI: Planet.MERCURY,
    Sign.CANCER: Planet.MOON,
    Sign.LEO: Planet.SUN,
    Sign.VIRGO: Planet.MERCURY,
    Sign.LIBRA: Planet.VENUS,
    Sign.SCORPIO: Planet.MARS,
    Sign.SAGITTARIUS: Planet.JUPITER,
    Sign.CAPRICORN: Planet.SATURN,
    Sign.AQUARIUS: Planet.SATURN,
    Sign.PISCES: Planet.JUPITER,
}


class EphemerisService:
    """Service for astronomical calculations using Swiss Ephemeris."""

    def __init__(self):
        """Initialize Swiss Ephemeris with sidereal mode."""
        swe.set_sid_mode(AYANAMSA_LAHIRI)

    def datetime_to_julian_day(self, dt: datetime, tz_str: str) -> float:
        """
        Convert datetime to Julian Day (UT).

        Args:
            dt: datetime object (date + time)
            tz_str: timezone string (e.g., 'Asia/Kolkata')

        Returns:
            Julian Day in Universal Time
        """
        # Convert to timezone-aware datetime
        tz = pytz.timezone(tz_str)
        if dt.tzinfo is None:
            dt_aware = tz.localize(dt)
        else:
            dt_aware = dt.astimezone(tz)

        # Convert to UTC
        dt_utc = dt_aware.astimezone(timezone.utc)

        # Calculate Julian Day
        jd = swe.julday(
            dt_utc.year,
            dt_utc.month,
            dt_utc.day,
            dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
        )

        return jd

    def get_planet_longitude(self, planet: Planet, jd: float, sidereal: bool = True) -> Tuple[float, bool]:
        """
        Get planet's longitude.

        Args:
            planet: Planet enum
            jd: Julian Day
            sidereal: Use sidereal zodiac (True) or tropical (False)

        Returns:
            Tuple of (longitude in degrees 0-360, is_retrograde)
        """
        if planet == Planet.KETU:
            # Ketu is 180 degrees opposite to Rahu
            rahu_lon, _ = self.get_planet_longitude(Planet.RAHU, jd, sidereal)
            ketu_lon = (rahu_lon + KETU_OFFSET) % 360
            return ketu_lon, False  # Ketu has same retrograde status as Rahu

        planet_id = PLANET_MAP[planet]
        flags = swe.FLG_SWIEPH | swe.FLG_SPEED
        if sidereal:
            flags |= swe.FLG_SIDEREAL

        result = swe.calc_ut(jd, planet_id, flags)
        longitude = result[0][0]  # Longitude in degrees
        speed = result[0][3]  # Speed in degrees per day

        # Normalize to 0-360
        longitude = longitude % 360

        # Check retrograde (negative speed)
        is_retrograde = speed < 0

        return longitude, is_retrograde

    def get_ascendant(self, jd: float, lat: float, lon: float, sidereal: bool = True) -> float:
        """
        Calculate ascendant (rising sign).

        Args:
            jd: Julian Day
            lat: Latitude
            lon: Longitude
            sidereal: Use sidereal zodiac

        Returns:
            Ascendant longitude in degrees 0-360
        """
        flags = swe.FLG_SWIEPH
        if sidereal:
            flags |= swe.FLG_SIDEREAL

        houses, ascmc = swe.houses(jd, lat, lon, b'P')  # Placidus house system
        ascendant = ascmc[0]  # Ascendant

        return ascendant % 360

    def get_house_cusps(self, jd: float, lat: float, lon: float, sidereal: bool = True) -> List[float]:
        """
        Calculate all 12 house cusps.

        Args:
            jd: Julian Day
            lat: Latitude
            lon: Longitude
            sidereal: Use sidereal zodiac

        Returns:
            List of 12 house cusp longitudes
        """
        flags = swe.FLG_SWIEPH
        if sidereal:
            flags |= swe.FLG_SIDEREAL

        houses, ascmc = swe.houses(jd, lat, lon, b'P')  # Placidus

        # Return 12 house cusps
        return [h % 360 for h in houses]

    def longitude_to_sign(self, longitude: float) -> Tuple[Sign, float]:
        """
        Convert absolute longitude to sign and degree within sign.

        Args:
            longitude: Absolute longitude 0-360

        Returns:
            Tuple of (Sign, degree_in_sign)
        """
        sign_index = int(longitude // 30)
        degree_in_sign = longitude % 30

        if sign_index >= 12:
            sign_index = 11

        return SIGNS[sign_index], degree_in_sign

    def longitude_to_nakshatra(self, longitude: float) -> Tuple[Nakshatra, int, Planet]:
        """
        Convert longitude to nakshatra, pada, and nakshatra lord.

        Args:
            longitude: Absolute longitude 0-360

        Returns:
            Tuple of (Nakshatra, pada 1-4, nakshatra_lord)
        """
        # Each nakshatra is 13.333... degrees (360/27)
        nakshatra_span = 360.0 / 27.0
        nakshatra_index = int(longitude / nakshatra_span)

        if nakshatra_index >= 27:
            nakshatra_index = 26

        # Pada is 1/4 of nakshatra
        position_in_nakshatra = longitude - (nakshatra_index * nakshatra_span)
        pada = int(position_in_nakshatra / (nakshatra_span / 4)) + 1

        if pada > 4:
            pada = 4

        nakshatra = NAKSHATRAS[nakshatra_index]
        lord = NAKSHATRA_LORDS[nakshatra_index]

        return nakshatra, pada, lord

    def get_house_for_planet(self, planet_longitude: float, house_cusps: List[float]) -> int:
        """
        Determine which house a planet occupies.

        Args:
            planet_longitude: Planet's longitude
            house_cusps: List of 12 house cusp longitudes

        Returns:
            House number 1-12
        """
        # Handle wrap-around at 360/0 degrees
        for i in range(12):
            cusp_current = house_cusps[i]
            cusp_next = house_cusps[(i + 1) % 12]

            if cusp_next > cusp_current:
                # Normal case: no wrap-around
                if cusp_current <= planet_longitude < cusp_next:
                    return i + 1
            else:
                # Wrap-around case
                if planet_longitude >= cusp_current or planet_longitude < cusp_next:
                    return i + 1

        # Default to 1st house if not found
        return 1

    def get_sign_lord(self, sign: Sign) -> Planet:
        """Get the ruling planet of a sign."""
        return SIGN_LORDS[sign]

    def get_nakshatra_lord(self, nakshatra: Nakshatra) -> Planet:
        """Get the ruling planet of a nakshatra."""
        nak_index = NAKSHATRAS.index(nakshatra)
        return NAKSHATRA_LORDS[nak_index]

    def calculate_vimshottari_balance(self, moon_longitude: float, birth_date: datetime) -> Tuple[Planet, float]:
        """
        Calculate Vimshottari Dasha balance at birth.

        Args:
            moon_longitude: Moon's longitude at birth
            birth_date: Birth datetime

        Returns:
            Tuple of (dasha_lord, years_remaining)
        """
        # Get Moon's nakshatra
        nakshatra, pada, lord = self.longitude_to_nakshatra(moon_longitude)

        # Dasha years for each planet
        dasha_years = {
            Planet.KETU: 7,
            Planet.VENUS: 20,
            Planet.SUN: 6,
            Planet.MOON: 10,
            Planet.MARS: 7,
            Planet.RAHU: 18,
            Planet.JUPITER: 16,
            Planet.SATURN: 19,
            Planet.MERCURY: 17,
        }

        # Position within nakshatra
        nakshatra_span = 360.0 / 27.0
        nakshatra_index = int(moon_longitude / nakshatra_span)
        position_in_nakshatra = moon_longitude - (nakshatra_index * nakshatra_span)
        fraction_completed = position_in_nakshatra / nakshatra_span

        # Years remaining in this dasha
        total_years = dasha_years[lord]
        years_elapsed = fraction_completed * total_years
        years_remaining = total_years - years_elapsed

        return lord, years_remaining

    def close(self):
        """Close Swiss Ephemeris."""
        swe.close()

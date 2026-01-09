"""
Vedic Astrology Calculations Service
Core astronomical and astrological calculations
"""
import logging
import os
from datetime import datetime
from collections import OrderedDict
from importlib import import_module, util as importlib_util
import logging
import math
from typing import Dict, Any, Tuple, List

from utils.errors import AstrologyDependencyError, ASTROLOGY_DEPENDENCIES

logger = logging.getLogger(__name__)

class AstrologyCalculator:
    """Core Vedic astrology calculation engine"""

    # Zodiac signs (Rashi)
    ZODIAC_SIGNS = [
        'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ]

    # Nakshatras (Lunar mansions)
    NAKSHATRAS = [
        'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
        'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
        'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
        'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
        'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
    ]

    # Elements
    ELEMENTS = {
        'Aries': 'Fire', 'Leo': 'Fire', 'Sagittarius': 'Fire',
        'Taurus': 'Earth', 'Virgo': 'Earth', 'Capricorn': 'Earth',
        'Gemini': 'Air', 'Libra': 'Air', 'Aquarius': 'Air',
        'Cancer': 'Water', 'Scorpio': 'Water', 'Pisces': 'Water'
    }

    def __init__(self):
        missing = [
            package
            for module, package in ASTROLOGY_DEPENDENCIES.items()
            if importlib_util.find_spec(module) is None
        ]
        if missing:
            raise AstrologyDependencyError.for_missing(missing)

        self.ephem = import_module("ephem")
        self.pytz = import_module("pytz")
        timezonefinder_module = import_module("timezonefinder")
        geopy_geocoders = import_module("geopy.geocoders")
        self.TimezoneFinder = timezonefinder_module.TimezoneFinder
        self.Nominatim = geopy_geocoders.Nominatim

        self.tf = self.TimezoneFinder()
        self.geolocator = self.Nominatim(user_agent="bhriguwelt")
        self.MapBox = getattr(geopy_geocoders, "MapBox", None)
        self.mapbox_token = os.getenv("MAPBOX_ACCESS_TOKEN") or os.getenv("MAPBOX_TOKEN")
        self.mapbox_geolocator = (
            self.MapBox(api_key=self.mapbox_token)
            if self.MapBox and self.mapbox_token
            else None
        )
        self._geocode_cache = OrderedDict()
        self._geocode_cache_max_size = 256

    def calculate_birth_chart(self, date_of_birth: str, time_of_birth: str,
                              place: str, latitude: float = None,
                              longitude: float = None,
                              timezone_override: str = None) -> Dict[str, Any]:
        """
        Calculate complete Vedic birth chart

        Args:
            date_of_birth: Date in YYYY-MM-DD format
            time_of_birth: Time in HH:MM format
            place: Place of birth (for geocoding)
            latitude: Optional latitude (if not provided, will geocode)
            longitude: Optional longitude (if not provided, will geocode)
            timezone_override: Optional IANA timezone string to override lookup

        Returns:
            Complete birth chart data
        """
        # Get coordinates if not provided
        geocoded_coords = None
        if latitude is None or longitude is None:
            geocoded_coords = self._geocode_location(place)
            if not geocoded_coords:
                logger.warning("Geocoding failed for place_of_birth=%s", place)
                return {
                    'error': {
                        'code': 'geocoding_failed',
                        'message': (
                            "Unable to geocode place of birth. "
                            "Provide a valid place_of_birth or latitude/longitude."
                        )
                    }
                }
            latitude = geocoded_coords['latitude']
            longitude = geocoded_coords['longitude']

        # Get timezone
        timezone_str = None
        if timezone_override:
            try:
                self.pytz.timezone(timezone_override)
                timezone_str = timezone_override
            except self.pytz.UnknownTimeZoneError:
                logger.warning("Invalid timezone override received: %s", timezone_override)
                return {
                    'error': {
                        'code': 'invalid_timezone_override',
                        'message': "Provided timezone override is invalid."
                    }
                }

        if not timezone_str:
            timezone_str = self.tf.timezone_at(lat=latitude, lng=longitude)

        if not timezone_str and place:
            geocoded_coords = geocoded_coords or self._geocode_location(place)
            if geocoded_coords:
                timezone_str = self.tf.timezone_at(
                    lat=geocoded_coords['latitude'],
                    lng=geocoded_coords['longitude']
                )
                if timezone_str:
                    latitude = geocoded_coords['latitude']
                    longitude = geocoded_coords['longitude']

        if not timezone_str:
            logger.warning(
                "Timezone resolution failed; falling back to UTC for latitude=%s longitude=%s place=%s",
                latitude,
                longitude,
                place
            )
            timezone_str = "UTC"

        # Parse datetime
        dt_str = f"{date_of_birth} {time_of_birth}"
        local_dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
        timezone = self.pytz.timezone(timezone_str)
        local_dt = timezone.localize(local_dt)
        utc_dt = local_dt.astimezone(self.pytz.UTC)

        # Create observer
        observer = self.ephem.Observer()
        observer.lat = str(latitude)
        observer.lon = str(longitude)
        observer.date = utc_dt

        # Calculate planetary positions
        planets = self._calculate_planetary_positions(observer)

        # Calculate zodiac sign and nakshatra
        zodiac_sign = self._calculate_zodiac_sign(planets['Sun']['longitude'])
        moon_sign = self._calculate_zodiac_sign(planets['Moon']['longitude'])
        nakshatra = self._calculate_nakshatra(planets['Moon']['longitude'])

        # Calculate ascendant (Lagna)
        ascendant = self._calculate_ascendant(observer, utc_dt)

        # Calculate houses
        houses = self._calculate_houses(ascendant)

        return {
            'birth_details': {
                'date': date_of_birth,
                'time': time_of_birth,
                'place': place,
                'latitude': latitude,
                'longitude': longitude,
                'timezone': timezone_str
            },
            'zodiac_sign': zodiac_sign,
            'moon_sign': moon_sign,
            'ascendant': ascendant,
            'nakshatra': nakshatra['name'],
            'nakshatra_pada': nakshatra['pada'],
            'nakshatra_lord': nakshatra['lord'],
            'element': self.ELEMENTS.get(zodiac_sign, 'Unknown'),
            'planets': planets,
            'houses': houses,
            'karmic_number': self._calculate_karmic_number(date_of_birth),
            'soul_number': self._calculate_soul_number(date_of_birth),
            'dasha_period': self._calculate_current_dasha(utc_dt, planets['Moon']['longitude'])
        }

    def _geocode_location(self, place: str) -> Dict[str, float]:
        """Geocode location to get latitude/longitude"""
        place_key = place.strip().lower()
        if not place_key:
            return None
        cached = self._get_cached_geocode(place_key)
        if cached:
            return cached
        try:
            location = self.geolocator.geocode(place)
            if location:
                coords = {
                    'latitude': location.latitude,
                    'longitude': location.longitude
                }
                self._set_cached_geocode(place_key, coords)
                return coords
        except Exception as exc:
            logger.warning("Nominatim geocode error for place=%s: %s", place, exc)
        if self.mapbox_geolocator:
            try:
                location = self.mapbox_geolocator.geocode(place)
                if location:
                    coords = {
                        'latitude': location.latitude,
                        'longitude': location.longitude
                    }
                    self._set_cached_geocode(place_key, coords)
                    return coords
            except Exception as exc:
                logger.warning("Mapbox geocode error for place=%s: %s", place, exc)
        return None

    def _get_cached_geocode(self, place_key: str) -> Dict[str, float]:
        if place_key in self._geocode_cache:
            self._geocode_cache.move_to_end(place_key)
            return self._geocode_cache[place_key]
        return None

    def _set_cached_geocode(self, place_key: str, coords: Dict[str, float]) -> None:
        self._geocode_cache[place_key] = coords
        self._geocode_cache.move_to_end(place_key)
        if len(self._geocode_cache) > self._geocode_cache_max_size:
            self._geocode_cache.popitem(last=False)

    def _calculate_planetary_positions(self, observer: Any) -> Dict[str, Any]:
        """Calculate positions of all planets"""
        planets = {}

        # Sun
        sun = self.ephem.Sun(observer)
        planets['Sun'] = {
            'longitude': self._normalize_degrees(math.degrees(sun.ra)),
            'latitude': math.degrees(sun.dec),
            'sign': self._calculate_zodiac_sign(self._normalize_degrees(math.degrees(sun.ra)))
        }

        # Moon
        moon = self.ephem.Moon(observer)
        planets['Moon'] = {
            'longitude': self._normalize_degrees(math.degrees(moon.ra)),
            'latitude': math.degrees(moon.dec),
            'sign': self._calculate_zodiac_sign(self._normalize_degrees(math.degrees(moon.ra)))
        }

        # Mercury
        mercury = self.ephem.Mercury(observer)
        planets['Mercury'] = {
            'longitude': self._normalize_degrees(math.degrees(mercury.ra)),
            'latitude': math.degrees(mercury.dec),
            'sign': self._calculate_zodiac_sign(self._normalize_degrees(math.degrees(mercury.ra)))
        }

        # Venus
        venus = self.ephem.Venus(observer)
        planets['Venus'] = {
            'longitude': self._normalize_degrees(math.degrees(venus.ra)),
            'latitude': math.degrees(venus.dec),
            'sign': self._calculate_zodiac_sign(self._normalize_degrees(math.degrees(venus.ra)))
        }

        # Mars
        mars = self.ephem.Mars(observer)
        planets['Mars'] = {
            'longitude': self._normalize_degrees(math.degrees(mars.ra)),
            'latitude': math.degrees(mars.dec),
            'sign': self._calculate_zodiac_sign(self._normalize_degrees(math.degrees(mars.ra)))
        }

        # Jupiter
        jupiter = self.ephem.Jupiter(observer)
        planets['Jupiter'] = {
            'longitude': self._normalize_degrees(math.degrees(jupiter.ra)),
            'latitude': math.degrees(jupiter.dec),
            'sign': self._calculate_zodiac_sign(self._normalize_degrees(math.degrees(jupiter.ra)))
        }

        # Saturn
        saturn = self.ephem.Saturn(observer)
        planets['Saturn'] = {
            'longitude': self._normalize_degrees(math.degrees(saturn.ra)),
            'latitude': math.degrees(saturn.dec),
            'sign': self._calculate_zodiac_sign(self._normalize_degrees(math.degrees(saturn.ra)))
        }

        # Rahu (North Node) - simplified calculation
        planets['Rahu'] = {
            'longitude': (planets['Moon']['longitude'] + 180) % 360,
            'latitude': 0,
            'sign': self._calculate_zodiac_sign((planets['Moon']['longitude'] + 180) % 360)
        }

        # Ketu (South Node)
        planets['Ketu'] = {
            'longitude': planets['Moon']['longitude'],
            'latitude': 0,
            'sign': self._calculate_zodiac_sign(planets['Moon']['longitude'])
        }

        return planets

    def _calculate_zodiac_sign(self, longitude: float) -> str:
        """Calculate zodiac sign from longitude"""
        index = int(longitude / 30)
        return self.ZODIAC_SIGNS[index % 12]

    def _calculate_nakshatra(self, moon_longitude: float) -> Dict[str, Any]:
        """Calculate nakshatra from moon's longitude"""
        # Each nakshatra is 13°20' (13.333...)
        nakshatra_size = 360 / 27
        nakshatra_index = int(moon_longitude / nakshatra_size)
        pada = int((moon_longitude % nakshatra_size) / (nakshatra_size / 4)) + 1

        nakshatra_lords = [
            'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter',
            'Saturn', 'Mercury', 'Ketu', 'Venus', 'Sun', 'Moon', 'Mars',
            'Rahu', 'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus', 'Sun',
            'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
        ]

        return {
            'name': self.NAKSHATRAS[nakshatra_index],
            'pada': pada,
            'lord': nakshatra_lords[nakshatra_index]
        }

    def _calculate_ascendant(self, observer: Any, utc_dt: datetime) -> str:
        """Calculate ascendant (lagna) - simplified"""
        # Simplified calculation - in production, use Swiss Ephemeris
        sidereal_time = observer.sidereal_time()
        ascendant_degrees = (math.degrees(sidereal_time) * 15) % 360
        return self._calculate_zodiac_sign(ascendant_degrees)

    def _calculate_houses(self, ascendant: str) -> List[str]:
        """Calculate house cusps"""
        ascendant_index = self.ZODIAC_SIGNS.index(ascendant)
        houses = []
        for i in range(12):
            houses.append(self.ZODIAC_SIGNS[(ascendant_index + i) % 12])
        return houses

    def _calculate_karmic_number(self, date_of_birth: str) -> int:
        """Calculate karmic number from birth date"""
        date = datetime.strptime(date_of_birth, "%Y-%m-%d")
        total = sum(int(digit) for digit in date.strftime("%d%m%Y"))
        while total > 9:
            total = sum(int(digit) for digit in str(total))
        return total

    def _calculate_soul_number(self, date_of_birth: str) -> int:
        """Calculate soul number (from birth day)"""
        date = datetime.strptime(date_of_birth, "%Y-%m-%d")
        day = date.day
        while day > 9:
            day = sum(int(digit) for digit in str(day))
        return day

    def _calculate_current_dasha(self, birth_dt: datetime, moon_longitude: float) -> Dict[str, str]:
        """Calculate current Vimshottari Dasha period"""
        nakshatra = self._calculate_nakshatra(moon_longitude)
        dasha_lords = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury']
        dasha_years = [7, 20, 6, 10, 7, 18, 16, 19, 17]

        # Find starting dasha
        nakshatra_lord_index = dasha_lords.index(nakshatra['lord'])

        # Calculate age
        now = datetime.now(self.pytz.UTC)
        age_years = (now - birth_dt.replace(tzinfo=self.pytz.UTC)).days / 365.25

        # Find current dasha (simplified)
        total_years = 0
        for i in range(len(dasha_lords)):
            lord_index = (nakshatra_lord_index + i) % len(dasha_lords)
            years = dasha_years[lord_index]
            if total_years + years > age_years:
                return {
                    'maha_dasha': dasha_lords[lord_index],
                    'years_remaining': round(total_years + years - age_years, 1)
                }
            total_years += years

        return {'maha_dasha': 'Unknown', 'years_remaining': 0}

    def _normalize_degrees(self, degrees: float) -> float:
        """Normalize degrees to 0-360 range"""
        return degrees % 360

_astrology_calculator = None
_astrology_dependency_error = None


def _initialize_calculator() -> None:
    global _astrology_calculator, _astrology_dependency_error
    if _astrology_calculator or _astrology_dependency_error:
        return
    try:
        _astrology_calculator = AstrologyCalculator()
    except AstrologyDependencyError as exc:
        _astrology_dependency_error = exc


def get_astrology_calculator():
    _initialize_calculator()
    return _astrology_calculator


def get_astrology_dependency_error():
    _initialize_calculator()
    return _astrology_dependency_error


# Singleton instance (initialized lazily with dependency tracking)
astrology_calculator = get_astrology_calculator()

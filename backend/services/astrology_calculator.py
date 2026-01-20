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

    # Built-in geocode database for common cities (fallback when API unavailable)
    # Format: 'city_name_lowercase': {'latitude': float, 'longitude': float}
    BUILTIN_GEOCODES = {
        # India - Major Cities
        'new delhi': {'latitude': 28.6139, 'longitude': 77.2090},
        'delhi': {'latitude': 28.6139, 'longitude': 77.2090},
        'mumbai': {'latitude': 19.0760, 'longitude': 72.8777},
        'bombay': {'latitude': 19.0760, 'longitude': 72.8777},
        'bangalore': {'latitude': 12.9716, 'longitude': 77.5946},
        'bengaluru': {'latitude': 12.9716, 'longitude': 77.5946},
        'chennai': {'latitude': 13.0827, 'longitude': 80.2707},
        'madras': {'latitude': 13.0827, 'longitude': 80.2707},
        'kolkata': {'latitude': 22.5726, 'longitude': 88.3639},
        'calcutta': {'latitude': 22.5726, 'longitude': 88.3639},
        'hyderabad': {'latitude': 17.3850, 'longitude': 78.4867},
        'pune': {'latitude': 18.5204, 'longitude': 73.8567},
        'ahmedabad': {'latitude': 23.0225, 'longitude': 72.5714},
        'jaipur': {'latitude': 26.9124, 'longitude': 75.7873},
        'lucknow': {'latitude': 26.8467, 'longitude': 80.9462},
        'kanpur': {'latitude': 26.4499, 'longitude': 80.3319},
        'nagpur': {'latitude': 21.1458, 'longitude': 79.0882},
        'indore': {'latitude': 22.7196, 'longitude': 75.8577},
        'thane': {'latitude': 19.2183, 'longitude': 72.9781},
        'bhopal': {'latitude': 23.2599, 'longitude': 77.4126},
        'visakhapatnam': {'latitude': 17.6868, 'longitude': 83.2185},
        'patna': {'latitude': 25.5941, 'longitude': 85.1376},
        'vadodara': {'latitude': 22.3072, 'longitude': 73.1812},
        'ghaziabad': {'latitude': 28.6692, 'longitude': 77.4538},
        'ludhiana': {'latitude': 30.9010, 'longitude': 75.8573},
        'agra': {'latitude': 27.1767, 'longitude': 78.0081},
        'nashik': {'latitude': 20.0063, 'longitude': 73.7907},
        'faridabad': {'latitude': 28.4089, 'longitude': 77.3178},
        'meerut': {'latitude': 28.9845, 'longitude': 77.7064},
        'rajkot': {'latitude': 22.3039, 'longitude': 70.8022},
        'varanasi': {'latitude': 25.3176, 'longitude': 82.9739},
        'srinagar': {'latitude': 34.0837, 'longitude': 74.7973},
        'aurangabad': {'latitude': 19.8762, 'longitude': 75.3433},
        'dhanbad': {'latitude': 23.7957, 'longitude': 86.4304},
        'amritsar': {'latitude': 31.6340, 'longitude': 74.8723},
        'allahabad': {'latitude': 25.4358, 'longitude': 81.8463},
        'prayagraj': {'latitude': 25.4358, 'longitude': 81.8463},
        'ranchi': {'latitude': 23.3441, 'longitude': 85.3096},
        'coimbatore': {'latitude': 11.0168, 'longitude': 76.9558},
        'jabalpur': {'latitude': 23.1815, 'longitude': 79.9864},
        'gwalior': {'latitude': 26.2183, 'longitude': 78.1828},
        'vijayawada': {'latitude': 16.5062, 'longitude': 80.6480},
        'jodhpur': {'latitude': 26.2389, 'longitude': 73.0243},
        'madurai': {'latitude': 9.9252, 'longitude': 78.1198},
        'raipur': {'latitude': 21.2514, 'longitude': 81.6296},
        'kota': {'latitude': 25.2138, 'longitude': 75.8648},
        'guwahati': {'latitude': 26.1445, 'longitude': 91.7362},
        'chandigarh': {'latitude': 30.7333, 'longitude': 76.7794},
        'solapur': {'latitude': 17.6599, 'longitude': 75.9064},
        'hubli': {'latitude': 15.3647, 'longitude': 75.1240},
        'mysore': {'latitude': 12.2958, 'longitude': 76.6394},
        'mysuru': {'latitude': 12.2958, 'longitude': 76.6394},
        'tiruchirappalli': {'latitude': 10.7905, 'longitude': 78.7047},
        'trichy': {'latitude': 10.7905, 'longitude': 78.7047},
        'bareilly': {'latitude': 28.3670, 'longitude': 79.4304},
        'aligarh': {'latitude': 27.8974, 'longitude': 78.0880},
        'tiruppur': {'latitude': 11.1085, 'longitude': 77.3411},
        'moradabad': {'latitude': 28.8386, 'longitude': 78.7733},
        'jalandhar': {'latitude': 31.3260, 'longitude': 75.5762},
        'bhubaneswar': {'latitude': 20.2961, 'longitude': 85.8245},
        'salem': {'latitude': 11.6643, 'longitude': 78.1460},
        'warangal': {'latitude': 17.9784, 'longitude': 79.5941},
        'guntur': {'latitude': 16.3067, 'longitude': 80.4365},
        'bhiwandi': {'latitude': 19.2967, 'longitude': 73.0631},
        'saharanpur': {'latitude': 29.9680, 'longitude': 77.5510},
        'gorakhpur': {'latitude': 26.7606, 'longitude': 83.3732},
        'bikaner': {'latitude': 28.0229, 'longitude': 73.3119},
        'amravati': {'latitude': 20.9320, 'longitude': 77.7523},
        'noida': {'latitude': 28.5355, 'longitude': 77.3910},
        'jamshedpur': {'latitude': 22.8046, 'longitude': 86.2029},
        'bhilai': {'latitude': 21.2094, 'longitude': 81.4285},
        'cuttack': {'latitude': 20.4625, 'longitude': 85.8830},
        'firozabad': {'latitude': 27.1591, 'longitude': 78.3957},
        'kochi': {'latitude': 9.9312, 'longitude': 76.2673},
        'cochin': {'latitude': 9.9312, 'longitude': 76.2673},
        'nellore': {'latitude': 14.4426, 'longitude': 79.9865},
        'dehradun': {'latitude': 30.3165, 'longitude': 78.0322},
        'rourkela': {'latitude': 22.2604, 'longitude': 84.8536},
        'jamnagar': {'latitude': 22.4707, 'longitude': 70.0577},
        'ujjain': {'latitude': 23.1765, 'longitude': 75.7885},
        'jammu': {'latitude': 32.7266, 'longitude': 74.8570},
        'belgaum': {'latitude': 15.8497, 'longitude': 74.4977},
        'mangalore': {'latitude': 12.9141, 'longitude': 74.8560},
        'ambattur': {'latitude': 13.1143, 'longitude': 80.1548},
        'tirunelveli': {'latitude': 8.7139, 'longitude': 77.7567},
        'malegaon': {'latitude': 20.5579, 'longitude': 74.5089},
        'gaya': {'latitude': 24.7914, 'longitude': 85.0002},
        'udaipur': {'latitude': 24.5854, 'longitude': 73.7125},
        'maheshtala': {'latitude': 22.5096, 'longitude': 88.2624},
        'davanagere': {'latitude': 14.4644, 'longitude': 75.9218},
        'kozhikode': {'latitude': 11.2588, 'longitude': 75.7804},
        'calicut': {'latitude': 11.2588, 'longitude': 75.7804},
        'akola': {'latitude': 20.7002, 'longitude': 77.0082},
        'kurnool': {'latitude': 15.8281, 'longitude': 78.0373},
        'bokaro': {'latitude': 23.6693, 'longitude': 86.1511},
        'rajahmundry': {'latitude': 17.0005, 'longitude': 81.8040},
        'ballari': {'latitude': 15.1394, 'longitude': 76.9214},
        'bellary': {'latitude': 15.1394, 'longitude': 76.9214},
        'agartala': {'latitude': 23.8315, 'longitude': 91.2868},
        'bhagalpur': {'latitude': 25.2425, 'longitude': 87.0079},
        'latur': {'latitude': 18.4088, 'longitude': 76.5604},
        'dhule': {'latitude': 20.9042, 'longitude': 74.7749},
        'korba': {'latitude': 22.3595, 'longitude': 82.7501},
        'bhilwara': {'latitude': 25.3407, 'longitude': 74.6313},
        'brahmapur': {'latitude': 19.3150, 'longitude': 84.7941},
        'muzaffarpur': {'latitude': 26.1209, 'longitude': 85.3647},
        'ahmednagar': {'latitude': 19.0948, 'longitude': 74.7480},
        'mathura': {'latitude': 27.4924, 'longitude': 77.6737},
        'kollam': {'latitude': 8.8932, 'longitude': 76.6141},
        'avadi': {'latitude': 13.1067, 'longitude': 80.1099},
        'kadapa': {'latitude': 14.4674, 'longitude': 78.8241},
        'anantapur': {'latitude': 14.6819, 'longitude': 77.6006},
        'kamarhati': {'latitude': 22.6745, 'longitude': 88.3744},
        'bilaspur': {'latitude': 22.0797, 'longitude': 82.1409},
        'sambalpur': {'latitude': 21.4669, 'longitude': 83.9812},
        'siliguri': {'latitude': 26.7271, 'longitude': 88.3953},
        'asansol': {'latitude': 23.6739, 'longitude': 86.9524},
        'durgapur': {'latitude': 23.5204, 'longitude': 87.3119},
        'ajmer': {'latitude': 26.4499, 'longitude': 74.6399},
        'jhansi': {'latitude': 25.4484, 'longitude': 78.5685},
        'ulhasnagar': {'latitude': 19.2215, 'longitude': 73.1645},
        'sangli': {'latitude': 16.8524, 'longitude': 74.5815},
        'parbhani': {'latitude': 19.2704, 'longitude': 76.7697},
        'pondicherry': {'latitude': 11.9416, 'longitude': 79.8083},
        'puducherry': {'latitude': 11.9416, 'longitude': 79.8083},
        'shimla': {'latitude': 31.1048, 'longitude': 77.1734},
        'imphal': {'latitude': 24.8170, 'longitude': 93.9368},
        'shillong': {'latitude': 25.5788, 'longitude': 91.8933},
        'aizawl': {'latitude': 23.7271, 'longitude': 92.7176},
        'kohima': {'latitude': 25.6751, 'longitude': 94.1086},
        'itanagar': {'latitude': 27.0844, 'longitude': 93.6053},
        'gangtok': {'latitude': 27.3389, 'longitude': 88.6065},
        'panaji': {'latitude': 15.4909, 'longitude': 73.8278},
        'port blair': {'latitude': 11.6234, 'longitude': 92.7265},
        'silvassa': {'latitude': 20.2766, 'longitude': 73.0169},
        'daman': {'latitude': 20.4283, 'longitude': 72.8397},
        'diu': {'latitude': 20.7141, 'longitude': 70.9874},
        'leh': {'latitude': 34.1526, 'longitude': 77.5771},
        'kavaratti': {'latitude': 10.5593, 'longitude': 72.6358},
        # International - Major Cities
        'new york': {'latitude': 40.7128, 'longitude': -74.0060},
        'london': {'latitude': 51.5074, 'longitude': -0.1278},
        'paris': {'latitude': 48.8566, 'longitude': 2.3522},
        'tokyo': {'latitude': 35.6762, 'longitude': 139.6503},
        'sydney': {'latitude': -33.8688, 'longitude': 151.2093},
        'singapore': {'latitude': 1.3521, 'longitude': 103.8198},
        'dubai': {'latitude': 25.2048, 'longitude': 55.2708},
        'hong kong': {'latitude': 22.3193, 'longitude': 114.1694},
        'toronto': {'latitude': 43.6532, 'longitude': -79.3832},
        'los angeles': {'latitude': 34.0522, 'longitude': -118.2437},
        'chicago': {'latitude': 41.8781, 'longitude': -87.6298},
        'san francisco': {'latitude': 37.7749, 'longitude': -122.4194},
        'seattle': {'latitude': 47.6062, 'longitude': -122.3321},
        'boston': {'latitude': 42.3601, 'longitude': -71.0589},
        'washington dc': {'latitude': 38.9072, 'longitude': -77.0369},
        'berlin': {'latitude': 52.5200, 'longitude': 13.4050},
        'amsterdam': {'latitude': 52.3676, 'longitude': 4.9041},
        'melbourne': {'latitude': -37.8136, 'longitude': 144.9631},
        'auckland': {'latitude': -36.8485, 'longitude': 174.7633},
        'kuala lumpur': {'latitude': 3.1390, 'longitude': 101.6869},
        'bangkok': {'latitude': 13.7563, 'longitude': 100.5018},
        'jakarta': {'latitude': -6.2088, 'longitude': 106.8456},
        'manila': {'latitude': 14.5995, 'longitude': 120.9842},
        'dhaka': {'latitude': 23.8103, 'longitude': 90.4125},
        'kathmandu': {'latitude': 27.7172, 'longitude': 85.3240},
        'colombo': {'latitude': 6.9271, 'longitude': 79.8612},
        'karachi': {'latitude': 24.8607, 'longitude': 67.0011},
        'lahore': {'latitude': 31.5204, 'longitude': 74.3587},
        'islamabad': {'latitude': 33.6844, 'longitude': 73.0479},
        'cape town': {'latitude': -33.9249, 'longitude': 18.4241},
        'johannesburg': {'latitude': -26.2041, 'longitude': 28.0473},
        'cairo': {'latitude': 30.0444, 'longitude': 31.2357},
        'moscow': {'latitude': 55.7558, 'longitude': 37.6173},
        'beijing': {'latitude': 39.9042, 'longitude': 116.4074},
        'shanghai': {'latitude': 31.2304, 'longitude': 121.4737},
        'seoul': {'latitude': 37.5665, 'longitude': 126.9780},
    }

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
        self.geolocator = self.Nominatim(user_agent="bhriguwelt", timeout=10)
        self.MapBox = getattr(geopy_geocoders, "MapBox", None)
        self.mapbox_token = os.getenv("MAPBOX_ACCESS_TOKEN") or os.getenv("MAPBOX_TOKEN")
        self.mapbox_geolocator = (
            self.MapBox(api_key=self.mapbox_token, timeout=10)
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
        houses = self._calculate_houses(ascendant['sign'])

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
        """Geocode location to get latitude/longitude with retry logic and built-in fallback"""
        place_key = place.strip().lower()
        if not place_key:
            return None
        cached = self._get_cached_geocode(place_key)
        if cached:
            return cached

        # Try Nominatim with retry logic (max 3 attempts)
        for attempt in range(3):
            try:
                location = self.geolocator.geocode(place, timeout=10)
                if location:
                    coords = {
                        'latitude': location.latitude,
                        'longitude': location.longitude
                    }
                    self._set_cached_geocode(place_key, coords)
                    return coords
            except Exception as exc:
                if attempt < 2:
                    logger.debug("Nominatim geocode attempt %d failed for place=%s: %s", attempt + 1, place, exc)
                else:
                    logger.warning("Nominatim geocode error for place=%s after 3 attempts: %s", place, exc)

        # Fallback to MapBox if available
        if self.mapbox_geolocator:
            for attempt in range(3):
                try:
                    location = self.mapbox_geolocator.geocode(place, timeout=10)
                    if location:
                        coords = {
                            'latitude': location.latitude,
                            'longitude': location.longitude
                        }
                        self._set_cached_geocode(place_key, coords)
                        return coords
                except Exception as exc:
                    if attempt < 2:
                        logger.debug("Mapbox geocode attempt %d failed for place=%s: %s", attempt + 1, place, exc)
                    else:
                        logger.warning("Mapbox geocode error for place=%s after 3 attempts: %s", place, exc)

        # Final fallback: check built-in geocode database
        builtin_coords = self._get_builtin_geocode(place_key)
        if builtin_coords:
            logger.info("Using built-in geocode for place=%s", place)
            self._set_cached_geocode(place_key, builtin_coords)
            return builtin_coords

        return None

    def _get_builtin_geocode(self, place_key: str) -> Dict[str, float]:
        """
        Look up coordinates from built-in database.
        Tries exact match first, then partial matching for common variations.
        """
        # Exact match
        if place_key in self.BUILTIN_GEOCODES:
            return self.BUILTIN_GEOCODES[place_key].copy()

        # Try without common suffixes/prefixes
        normalized = place_key.replace(',', '').strip()
        # Remove country suffixes like ", india" or ", usa"
        for suffix in [', india', ', usa', ', uk', ', australia', ', canada', ', nepal', ', pakistan', ', bangladesh', ', sri lanka']:
            if normalized.endswith(suffix):
                normalized = normalized[:-len(suffix)].strip()
                break

        if normalized in self.BUILTIN_GEOCODES:
            return self.BUILTIN_GEOCODES[normalized].copy()

        # Try matching city name within the query (e.g., "New Delhi, India" -> "new delhi")
        for city_name, coords in self.BUILTIN_GEOCODES.items():
            if city_name in place_key or place_key in city_name:
                return coords.copy()

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

        # Calculate Lahiri ayanamsa for Vedic astrology
        # Convert ephem date to Julian Date
        jd = self.ephem.julian_date(observer.date)
        ayanamsa = self._calculate_ayanamsa(jd)

        # Sun
        sun = self.ephem.Sun(observer)
        sun_ecliptic = self.ephem.Ecliptic(sun)
        sun_longitude = self._normalize_degrees(math.degrees(sun_ecliptic.lon) - ayanamsa)
        planets['Sun'] = {
            'longitude': sun_longitude,
            'latitude': math.degrees(sun_ecliptic.lat),
            'sign': self._calculate_zodiac_sign(sun_longitude)
        }

        # Moon
        moon = self.ephem.Moon(observer)
        moon_ecliptic = self.ephem.Ecliptic(moon)
        moon_longitude = self._normalize_degrees(math.degrees(moon_ecliptic.lon) - ayanamsa)
        planets['Moon'] = {
            'longitude': moon_longitude,
            'latitude': math.degrees(moon_ecliptic.lat),
            'sign': self._calculate_zodiac_sign(moon_longitude)
        }

        # Mercury
        mercury = self.ephem.Mercury(observer)
        mercury_ecliptic = self.ephem.Ecliptic(mercury)
        mercury_longitude = self._normalize_degrees(math.degrees(mercury_ecliptic.lon) - ayanamsa)
        planets['Mercury'] = {
            'longitude': mercury_longitude,
            'latitude': math.degrees(mercury_ecliptic.lat),
            'sign': self._calculate_zodiac_sign(mercury_longitude)
        }

        # Venus
        venus = self.ephem.Venus(observer)
        venus_ecliptic = self.ephem.Ecliptic(venus)
        venus_longitude = self._normalize_degrees(math.degrees(venus_ecliptic.lon) - ayanamsa)
        planets['Venus'] = {
            'longitude': venus_longitude,
            'latitude': math.degrees(venus_ecliptic.lat),
            'sign': self._calculate_zodiac_sign(venus_longitude)
        }

        # Mars
        mars = self.ephem.Mars(observer)
        mars_ecliptic = self.ephem.Ecliptic(mars)
        mars_longitude = self._normalize_degrees(math.degrees(mars_ecliptic.lon) - ayanamsa)
        planets['Mars'] = {
            'longitude': mars_longitude,
            'latitude': math.degrees(mars_ecliptic.lat),
            'sign': self._calculate_zodiac_sign(mars_longitude)
        }

        # Jupiter
        jupiter = self.ephem.Jupiter(observer)
        jupiter_ecliptic = self.ephem.Ecliptic(jupiter)
        jupiter_longitude = self._normalize_degrees(math.degrees(jupiter_ecliptic.lon) - ayanamsa)
        planets['Jupiter'] = {
            'longitude': jupiter_longitude,
            'latitude': math.degrees(jupiter_ecliptic.lat),
            'sign': self._calculate_zodiac_sign(jupiter_longitude)
        }

        # Saturn
        saturn = self.ephem.Saturn(observer)
        saturn_ecliptic = self.ephem.Ecliptic(saturn)
        saturn_longitude = self._normalize_degrees(math.degrees(saturn_ecliptic.lon) - ayanamsa)
        planets['Saturn'] = {
            'longitude': saturn_longitude,
            'latitude': math.degrees(saturn_ecliptic.lat),
            'sign': self._calculate_zodiac_sign(saturn_longitude)
        }

        # Rahu (North Node) - Mean Node
        # For Vedic astrology, we use the Moon's north node
        rahu_longitude = self._normalize_degrees(math.degrees(observer.date + 2415020) * 0 - ayanamsa)
        # Simplified: Using a more accurate calculation for Rahu
        # The mean node precesses backwards at about 19.3 degrees per year
        # For a more accurate calculation, we calculate it from the Moon's orbit
        days_since_epoch = float(observer.date - 2444238.5)  # Jan 1, 1980
        rahu_mean_longitude = (125.04 - 0.0529539 * days_since_epoch) % 360
        rahu_longitude = self._normalize_degrees(rahu_mean_longitude - ayanamsa)
        planets['Rahu'] = {
            'longitude': rahu_longitude,
            'latitude': 0,
            'sign': self._calculate_zodiac_sign(rahu_longitude)
        }

        # Ketu (South Node) - 180 degrees opposite to Rahu
        ketu_longitude = (rahu_longitude + 180) % 360
        planets['Ketu'] = {
            'longitude': ketu_longitude,
            'latitude': 0,
            'sign': self._calculate_zodiac_sign(ketu_longitude)
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

    def _calculate_ascendant(self, observer: Any, utc_dt: datetime) -> Dict[str, Any]:
        """Calculate ascendant (lagna) with Vedic correction"""
        # Get sidereal time at birth location
        sidereal_time = observer.sidereal_time()

        # Convert sidereal time to degrees (1 hour = 15 degrees)
        lst_degrees = math.degrees(sidereal_time) * 15

        # Get latitude
        lat = math.radians(float(observer.lat))

        # Calculate RAMC (Right Ascension of Medium Coeli)
        ramc = lst_degrees

        # Simple ascendant approximation using latitude
        # More accurate: would use full house calculation
        # For now, using a simplified formula
        ascendant_tropical = (ramc + 90 + math.degrees(lat) * 0.5) % 360

        # Apply Lahiri ayanamsa for Vedic astrology
        jd = self.ephem.julian_date(observer.date)
        ayanamsa = self._calculate_ayanamsa(jd)
        ascendant_sidereal = self._normalize_degrees(ascendant_tropical - ayanamsa)

        ascendant_sign = self._calculate_zodiac_sign(ascendant_sidereal)

        return {
            'sign': ascendant_sign,
            'degree': ascendant_sidereal,
            'degree_in_sign': ascendant_sidereal % 30
        }

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

    def _calculate_ayanamsa(self, julian_date: float) -> float:
        """
        Calculate Lahiri ayanamsa for a given Julian date
        Lahiri ayanamsa formula: ayanamsa = 23.85 + (julian_date - 2451545.0) / 36525 * 50.27

        Args:
            julian_date: Julian date

        Returns:
            Ayanamsa in degrees
        """
        # Simplified Lahiri ayanamsa calculation
        # Reference: Jan 1, 2000, 12:00 TT = JD 2451545.0, ayanamsa ≈ 23.85°
        t = (julian_date - 2451545.0) / 36525.0  # Julian centuries from J2000.0
        ayanamsa = 23.85 + t * 50.27  # Approximate formula
        return ayanamsa

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

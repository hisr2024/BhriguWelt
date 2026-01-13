"""Birth chart computation API endpoints."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, time
from typing import Any, Dict, List, Optional, Tuple
from zoneinfo import ZoneInfo

from flask import Blueprint, request, jsonify
from api import BhriguAPIHandler

import swisseph as swe

bp = Blueprint('birthchart', __name__, url_prefix='/api/v1/birthchart')

ZODIAC_SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

NAKSHATRAS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
    'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
]

HOUSE_SYSTEMS = {
    'Placidus': 'P',
    'Whole Sign': 'W',
    'Koch': 'K',
    'Porphyry': 'O',
}

PLANETS = {
    'sun': swe.SUN,
    'moon': swe.MOON,
    'mercury': swe.MERCURY,
    'venus': swe.VENUS,
    'mars': swe.MARS,
    'jupiter': swe.JUPITER,
    'saturn': swe.SATURN,
    'uranus': swe.URANUS,
    'neptune': swe.NEPTUNE,
    'pluto': swe.PLUTO,
}

NODE_PLANET = swe.MEAN_NODE

@dataclass
class BirthChartProfile:
    name: Optional[str]
    dob: str
    time: str
    timezone: str
    latitude: float
    longitude: float
    place_name: Optional[str]
    house_system: str
    options: Dict[str, Any]
    time_unknown: bool


def _parse_date(value: str) -> datetime.date:
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except ValueError as exc:
        raise ValueError('dob must be in YYYY-MM-DD format') from exc


def _parse_time(value: Optional[str], time_unknown: bool) -> time:
    if time_unknown or not value:
        return time(12, 0)
    try:
        return datetime.strptime(value, '%H:%M').time()
    except ValueError as exc:
        raise ValueError('time must be in HH:MM format') from exc


def validate_birthchart_input(payload: Any) -> BirthChartProfile:
    if not isinstance(payload, dict):
        raise ValueError('Request body must be a JSON object')

    dob = payload.get('dob')
    if not dob:
        raise ValueError('dob is required')

    time_value = payload.get('time')
    time_unknown = bool(payload.get('time_unknown'))

    timezone = payload.get('timezone')
    if not timezone:
        raise ValueError('timezone is required')

    try:
        ZoneInfo(timezone)
    except Exception as exc:
        raise ValueError('timezone must be a valid IANA timezone') from exc

    latitude = payload.get('latitude')
    longitude = payload.get('longitude')

    if latitude is None or longitude is None:
        raise ValueError('latitude and longitude are required')

    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except (TypeError, ValueError) as exc:
        raise ValueError('latitude and longitude must be numbers') from exc

    if not (-90 <= latitude <= 90):
        raise ValueError('latitude must be between -90 and 90')
    if not (-180 <= longitude <= 180):
        raise ValueError('longitude must be between -180 and 180')

    parsed_date = _parse_date(dob)
    parsed_time = _parse_time(time_value, time_unknown)

    house_system = payload.get('house_system', 'Placidus')
    if house_system not in HOUSE_SYSTEMS:
        raise ValueError('house_system must be Placidus, Whole Sign, Koch, or Porphyry')

    options = payload.get('options') or {}
    if not isinstance(options, dict):
        raise ValueError('options must be an object if provided')

    return BirthChartProfile(
        name=payload.get('name'),
        dob=parsed_date.isoformat(),
        time=parsed_time.strftime('%H:%M'),
        timezone=timezone,
        latitude=latitude,
        longitude=longitude,
        place_name=payload.get('place_name'),
        house_system=house_system,
        options=options,
        time_unknown=time_unknown,
    )


def _to_utc_datetime(profile: BirthChartProfile) -> datetime:
    local_tz = ZoneInfo(profile.timezone)
    local_dt = datetime.fromisoformat(f"{profile.dob}T{profile.time}")
    local_dt = local_dt.replace(tzinfo=local_tz)
    return local_dt.astimezone(ZoneInfo('UTC'))


def _longitude_to_sign(longitude: float) -> Tuple[str, float]:
    normalized = longitude % 360
    sign_index = int(normalized // 30)
    sign = ZODIAC_SIGNS[sign_index]
    degree_in_sign = normalized % 30
    return sign, round(degree_in_sign, 2)


def _longitude_to_nakshatra(longitude: float) -> str:
    normalized = longitude % 360
    segment = 360 / 27
    index = int(normalized // segment)
    return NAKSHATRAS[index]


def _build_house_lookup(houses: List[float]) -> List[float]:
    if len(houses) != 12:
        return []
    return [h % 360 for h in houses]


def _planet_house(longitude: float, house_cusps: List[float]) -> Optional[int]:
    if len(house_cusps) != 12:
        return None

    for i in range(12):
        start = house_cusps[i]
        end = house_cusps[(i + 1) % 12]
        if start < end:
            if start <= longitude < end:
                return i + 1
        else:
            if longitude >= start or longitude < end:
                return i + 1
    return None


def compute_julian_date_and_positions(profile: BirthChartProfile) -> Dict[str, Any]:
    utc_dt = _to_utc_datetime(profile)
    jd = swe.julday(
        utc_dt.year,
        utc_dt.month,
        utc_dt.day,
        utc_dt.hour + utc_dt.minute / 60 + utc_dt.second / 3600,
    )

    planets: Dict[str, Dict[str, Any]] = {}
    for name, planet_id in PLANETS.items():
        position = swe.calc_ut(jd, planet_id)[0]
        longitude = position[0] % 360
        sign, degree = _longitude_to_sign(longitude)
        planets[name] = {
            'sign': sign,
            'degree': degree,
            'longitude': round(longitude, 4),
        }

    nodes = swe.calc_ut(jd, NODE_PLANET)[0]
    rahu_longitude = nodes[0] % 360
    ketu_longitude = (rahu_longitude + 180) % 360
    rahu_sign, rahu_degree = _longitude_to_sign(rahu_longitude)
    ketu_sign, ketu_degree = _longitude_to_sign(ketu_longitude)
    planets['rahu'] = {
        'sign': rahu_sign,
        'degree': rahu_degree,
        'longitude': round(rahu_longitude, 4),
    }
    planets['ketu'] = {
        'sign': ketu_sign,
        'degree': ketu_degree,
        'longitude': round(ketu_longitude, 4),
    }

    house_cusps: List[float] = []
    ascendant = None
    houses_payload = None
    try:
        house_code = HOUSE_SYSTEMS.get(profile.house_system, 'P')
        houses, ascmc = swe.houses(jd, profile.latitude, profile.longitude, house_code)
        house_cusps = _build_house_lookup(list(houses))
        houses_payload = [
            {
                'house': index + 1,
                'degree': round(cusp % 360, 2),
                'sign': _longitude_to_sign(cusp)[0],
            }
            for index, cusp in enumerate(house_cusps)
        ]
        asc_longitude = ascmc[0] % 360
        asc_sign, asc_degree = _longitude_to_sign(asc_longitude)
        ascendant = {
            'sign': asc_sign,
            'degree': asc_degree,
            'house': 1,
        }
    except Exception:
        ascendant = None
        houses_payload = None

    for planet in planets.values():
        house_number = _planet_house(planet['longitude'], house_cusps)
        if house_number:
            planet['house'] = house_number

    aspects = _compute_aspects(planets)
    elements = _compute_elements(planets)

    return {
        'datetime_utc': utc_dt.isoformat(),
        'timezone': profile.timezone,
        'ascendant': ascendant,
        'planets': planets,
        'houses': houses_payload,
        'aspects': aspects,
        'elements': elements,
        'nakshatra': _longitude_to_nakshatra(planets['moon']['longitude']),
        'julian_date': jd,
    }


def _compute_aspects(planets: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    aspect_angles = {
        'conjunction': 0,
        'sextile': 60,
        'square': 90,
        'trine': 120,
        'opposition': 180,
    }
    orb = 6
    names = [name for name in planets.keys() if name not in {'rahu', 'ketu'}]
    aspects: List[Dict[str, Any]] = []
    for i, p1 in enumerate(names):
        for p2 in names[i + 1:]:
            lon1 = planets[p1]['longitude']
            lon2 = planets[p2]['longitude']
            diff = abs(lon1 - lon2)
            diff = min(diff, 360 - diff)
            for aspect_name, angle in aspect_angles.items():
                if abs(diff - angle) <= orb:
                    aspects.append({
                        'planet1': p1,
                        'planet2': p2,
                        'type': aspect_name,
                        'orb': round(abs(diff - angle), 2),
                    })
    return aspects


def _compute_elements(planets: Dict[str, Dict[str, Any]]) -> Dict[str, int]:
    element_map = {
        'Aries': 'fire', 'Leo': 'fire', 'Sagittarius': 'fire',
        'Taurus': 'earth', 'Virgo': 'earth', 'Capricorn': 'earth',
        'Gemini': 'air', 'Libra': 'air', 'Aquarius': 'air',
        'Cancer': 'water', 'Scorpio': 'water', 'Pisces': 'water',
    }
    counts = {'fire': 0, 'earth': 0, 'air': 0, 'water': 0}
    for planet in planets.values():
        sign = planet.get('sign')
        if sign and sign in element_map:
            counts[element_map[sign]] += 1
    return counts


INTERPRETATION_TEMPLATES = {
    'sun_sign': {
        'template': "{name} has a Sun in {sun_sign}, highlighting a {sun_trait} core drive.",
        'traits': {
            'Aries': 'bold', 'Taurus': 'steadfast', 'Gemini': 'curious', 'Cancer': 'nurturing',
            'Leo': 'radiant', 'Virgo': 'methodical', 'Libra': 'harmonizing', 'Scorpio': 'intense',
            'Sagittarius': 'adventurous', 'Capricorn': 'disciplined', 'Aquarius': 'visionary', 'Pisces': 'empathetic',
        },
        'weight': 0.25,
    },
    'ascendant': {
        'template': "The ascendant in {asc_sign} shapes how others meet their energy—{asc_trait} and memorable.",
        'traits': {
            'Aries': 'direct', 'Taurus': 'grounded', 'Gemini': 'expressive', 'Cancer': 'protective',
            'Leo': 'charismatic', 'Virgo': 'intentional', 'Libra': 'graceful', 'Scorpio': 'magnetic',
            'Sagittarius': 'upbeat', 'Capricorn': 'composed', 'Aquarius': 'individualistic', 'Pisces': 'gentle',
        },
        'weight': 0.2,
    },
    'moon_nakshatra': {
        'template': "The Moon in {nakshatra} nakshatra points to {nakshatra_trait} emotional instincts.",
        'traits': {
            'Ashwini': 'fast-moving',
            'Rohini': 'sensual',
            'Pushya': 'protective',
            'Magha': 'regal',
            'Hasta': 'crafty',
            'Swati': 'independent',
            'Anuradha': 'loyal',
            'Mula': 'transformative',
            'Shravana': 'insightful',
            'Revati': 'compassionate',
        },
        'weight': 0.15,
    },
    'sun_moon_aspect': {
        'template': "A {aspect_type} between Sun and Moon blends identity with inner needs, giving a focused life rhythm.",
        'weight': 0.15,
    },
    'rahu_ketu': {
        'template': "Rahu in {rahu_sign} and Ketu in {ketu_sign} highlight karmic growth through {rahu_theme} lessons.",
        'themes': {
            'Aries': 'self-assertion',
            'Taurus': 'stability',
            'Gemini': 'communication',
            'Cancer': 'emotional security',
            'Leo': 'creative leadership',
            'Virgo': 'discernment',
            'Libra': 'partnership',
            'Scorpio': 'depth work',
            'Sagittarius': 'meaning-making',
            'Capricorn': 'legacy',
            'Aquarius': 'innovation',
            'Pisces': 'spiritual surrender',
        },
        'weight': 0.1,
    },
}

SECTION_TEMPLATES = {
    'career': "Career thrives when {sun_trait} vision meets {asc_trait} presence. Seek roles that reward long-term mastery.",
    'relationships': "Relationships flourish through {moon_trait} care and honest communication. Balance autonomy with warmth.",
    'health': "Health benefits from steady routines and mind-body grounding. Prioritize rest when emotions run high.",
    'spirituality': "Spiritual growth comes from {nakshatra_trait} intuition and the Rahu/Ketu axis urging mindful evolution.",
}

SECTION_TITLES = {
    'career': 'Career & Wealth',
    'relationships': 'Relationships',
    'health': 'Health',
    'spirituality': 'Spirituality',
}


def assemble_interpretation(
    profile: BirthChartProfile,
    chart: Dict[str, Any],
) -> Dict[str, Any]:
    name = profile.name or 'This chart'
    sun_sign = chart['planets']['sun']['sign']
    moon_sign = chart['planets']['moon']['sign']
    nakshatra = chart['nakshatra']
    asc_sign = chart['ascendant']['sign'] if chart.get('ascendant') else sun_sign

    sun_trait = INTERPRETATION_TEMPLATES['sun_sign']['traits'].get(sun_sign, 'distinct')
    asc_trait = INTERPRETATION_TEMPLATES['ascendant']['traits'].get(asc_sign, 'notable')
    moon_trait = INTERPRETATION_TEMPLATES['moon_nakshatra']['traits'].get(nakshatra, 'sensitive')
    nakshatra_trait = moon_trait

    summary_parts = []
    confidence_total = 0.0
    max_confidence = 0.0

    sun_template = INTERPRETATION_TEMPLATES['sun_sign']
    summary_parts.append(sun_template['template'].format(
        name=name,
        sun_sign=sun_sign,
        sun_trait=sun_trait,
    ))
    confidence_total += sun_template['weight']
    max_confidence += sun_template['weight']

    asc_template = INTERPRETATION_TEMPLATES['ascendant']
    summary_parts.append(asc_template['template'].format(
        asc_sign=asc_sign,
        asc_trait=asc_trait,
    ))
    confidence_total += asc_template['weight']
    max_confidence += asc_template['weight']

    nak_template = INTERPRETATION_TEMPLATES['moon_nakshatra']
    summary_parts.append(nak_template['template'].format(
        nakshatra=nakshatra,
        nakshatra_trait=nakshatra_trait,
    ))
    confidence_total += nak_template['weight']
    max_confidence += nak_template['weight']

    sun_moon_aspect = next(
        (
            aspect for aspect in chart.get('aspects', [])
            if {'sun', 'moon'} == {aspect['planet1'], aspect['planet2']}
        ),
        None,
    )
    if sun_moon_aspect:
        aspect_template = INTERPRETATION_TEMPLATES['sun_moon_aspect']
        summary_parts.append(aspect_template['template'].format(
            aspect_type=sun_moon_aspect['type'],
        ))
        confidence_total += aspect_template['weight']
    max_confidence += INTERPRETATION_TEMPLATES['sun_moon_aspect']['weight']

    rahu_template = INTERPRETATION_TEMPLATES['rahu_ketu']
    summary_parts.append(rahu_template['template'].format(
        rahu_sign=chart['planets']['rahu']['sign'],
        ketu_sign=chart['planets']['ketu']['sign'],
        rahu_theme=rahu_template['themes'].get(chart['planets']['rahu']['sign'], 'soulful'),
    ))
    confidence_total += rahu_template['weight']
    max_confidence += rahu_template['weight']

    sections = []
    for key, template in SECTION_TEMPLATES.items():
        text = template.format(
            sun_trait=sun_trait,
            asc_trait=asc_trait,
            moon_trait=moon_trait,
            nakshatra_trait=nakshatra_trait,
        )
        sections.append({
            'title': SECTION_TITLES[key],
            'text': text,
            'score': round(0.55 + (confidence_total / max_confidence) * 0.35, 2),
        })

    placements = {}
    for planet_name, planet_data in chart['planets'].items():
        placements[planet_name] = (
            f"{planet_name.title()} in {planet_data['sign']} at {planet_data['degree']}°"
            f" suggests {sun_trait} expression shaped by {planet_data['sign']} themes."
        )

    confidence = round(confidence_total / max_confidence, 2) if max_confidence else 0.5

    summary = ' '.join(summary_parts[:4])

    return {
        'summary': summary,
        'sections': sections,
        'placements': placements,
        'confidence': confidence,
    }


@bp.route('/compute', methods=['POST'])
def compute_birthchart():
    try:
        payload = request.get_json(silent=True) or {}
        profile = validate_birthchart_input(payload)
        chart = compute_julian_date_and_positions(profile)
        interpretation = assemble_interpretation(profile, chart)

        response = {
            'profile': {
                'name': profile.name,
                'dob': profile.dob,
                'time': profile.time,
                'timezone': profile.timezone,
                'latitude': profile.latitude,
                'longitude': profile.longitude,
                'place_name': profile.place_name,
                'house_system': profile.house_system,
                'time_unknown': profile.time_unknown,
            },
            'chart': {
                'datetime_utc': chart['datetime_utc'],
                'timezone': chart['timezone'],
                'ascendant': chart['ascendant'],
                'planets': chart['planets'],
                'houses': chart['houses'],
                'aspects': chart['aspects'],
                'elements': chart['elements'],
                'nakshatra': chart['nakshatra'],
            },
            'interpretation': interpretation,
            'confidence': interpretation['confidence'],
            'metadata': {
                'generated_at': datetime.utcnow().isoformat(),
                'engine': f"pyswisseph-{swe.__version__}",
            },
        }
        return jsonify(response), 200
    except ValueError as exc:
        return BhriguAPIHandler.send_error(str(exc), status_code=400, error_code='VALIDATION_ERROR')
    except Exception as exc:
        return BhriguAPIHandler.send_error(
            'Failed to compute birth chart',
            status_code=500,
            error_code='BIRTHCHART_COMPUTE_FAILED',
            details={'error': str(exc)},
        )

"""
Astrology API Routes
Core astrology calculation endpoints with enhanced validation and error handling
"""
from flask import Blueprint, request, jsonify
from services.astrology_calculator import get_astrology_calculator, get_astrology_dependency_error
from services.prediction_orchestrator import get_prediction_orchestrator
from utils.client_status import parse_client_online
from utils.astrology_helpers import dependency_error_response, get_cached_birth_data
from utils.logger import setup_logger, log_request, log_response, log_error
from utils.validators import validate_birth_details, validate_coordinates, sanitize_input
from utils.response_formatter import (
    success_response, error_response, validation_error_response, server_error_response
)

bp = Blueprint('astrology', __name__, url_prefix='/api/astrology')
logger = setup_logger(__name__)
orchestrator = get_prediction_orchestrator()

@bp.route('/birth-chart', methods=['POST'])
def calculate_birth_chart():
    """
    Calculate complete Vedic birth chart

    Request JSON:
    {
        "date_of_birth": "1990-01-15",
        "time_of_birth": "14:30",
        "place_of_birth": "New Delhi, India",
        "timezone": "Asia/Kolkata",
        "latitude": 28.6139,  // optional
        "longitude": 77.2090  // optional
    }
    """
    try:
        # Get and validate request data
        if not request.is_json:
            logger.warning("Birth chart request with invalid content type")
            return error_response("Content-Type must be application/json", 400)

        data = request.get_json()
        log_request(logger, data, '/api/astrology/birth-chart')

        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            # Validate birth details
            is_valid, error_msg = validate_birth_details(data)
            if not is_valid:
                logger.warning(f"Validation failed: {error_msg}")
                return validation_error_response(error_msg)

            # Sanitize inputs
            sanitized_data = {
                'date_of_birth': data['date_of_birth'],
                'time_of_birth': data['time_of_birth'],
                'place_of_birth': sanitize_input(data['place_of_birth'], max_length=200)
            }
            if data.get('timezone'):
                sanitized_data['timezone'] = sanitize_input(data['timezone'], max_length=64)

            # Validate coordinates if provided
            if 'latitude' in data and 'longitude' in data:
                is_valid, error_msg = validate_coordinates(data['latitude'], data['longitude'])
                if not is_valid:
                    logger.warning(f"Coordinate validation failed: {error_msg}")
                    return validation_error_response(error_msg)
                sanitized_data['latitude'] = data['latitude']
                sanitized_data['longitude'] = data['longitude']

            # Calculate birth chart
            logger.info(f"Calculating birth chart for {sanitized_data['place_of_birth']}")
            chart = calculator.calculate_birth_chart(
                date_of_birth=sanitized_data['date_of_birth'],
                time_of_birth=sanitized_data['time_of_birth'],
                place=sanitized_data['place_of_birth'],
                latitude=sanitized_data.get('latitude'),
                longitude=sanitized_data.get('longitude'),
                timezone_override=sanitized_data.get('timezone')
            )

            # Check if calculation returned an error
            if 'error' in chart:
                error_info = chart['error']
                logger.error(f"Birth chart calculation failed: {error_info.get('message')}")
                return error_response(
                    error_info.get('message', 'Failed to calculate birth chart'),
                    400 if error_info.get('code') == 'geocoding_failed' else 500
                )

            logger.info("Birth chart calculated successfully")
            return success_response(
                data=chart,
                message="Birth chart calculated successfully"
            )

        logger.warning("Astrology calculator unavailable; returning cached birth data.")
        return success_response(
            data=cached_birth_data,
            message="Returned cached birth data because calculator is unavailable."
        )

    except ValueError as e:
        log_error(logger, e, "Birth chart calculation - ValueError")
        return validation_error_response("Invalid request data.")
    except Exception as e:
        log_error(logger, e, "Birth chart calculation")
        return server_error_response("Failed to calculate birth chart. Please try again.")

@bp.route('/zodiac-analysis', methods=['POST'])
def zodiac_analysis():
    """Get detailed zodiac sign analysis with AI-powered insights"""
    try:
        if not request.is_json:
            return error_response("Content-Type must be application/json", 400)

        data = request.get_json()
        log_request(logger, data, '/api/astrology/zodiac-analysis')

        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            # Validate birth details
            is_valid, error_msg = validate_birth_details(data)
            if not is_valid:
                logger.warning(f"Validation failed: {error_msg}")
                return validation_error_response(error_msg)

            # Calculate birth chart
            logger.info("Calculating birth chart for zodiac analysis")
            birth_chart = calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=sanitize_input(data['place_of_birth'], max_length=200),
                timezone_override=sanitize_input(data['timezone'], max_length=64)
                if data.get('timezone') else None
            )

            # Check if calculation returned an error
            if 'error' in birth_chart:
                error_info = birth_chart['error']
                logger.error(f"Birth chart calculation failed: {error_info.get('message')}")
                return error_response(
                    error_info.get('message', 'Failed to calculate birth chart'),
                    400 if error_info.get('code') == 'geocoding_failed' else 500
                )
        else:
            logger.warning("Astrology calculator unavailable; using cached birth data.")
            birth_chart = cached_birth_data

        # Generate AI-powered analysis
        logger.info("Generating AI-powered zodiac analysis")
        prompt = f"""
        Provide a comprehensive zodiac analysis for:
        - Sun Sign: {birth_chart.get('zodiac_sign', 'Unknown')}
        - Moon Sign: {birth_chart.get('moon_sign', 'Unknown')}
        - Ascendant: {birth_chart.get('ascendant', 'Unknown')}
        - Nakshatra: {birth_chart.get('nakshatra', 'Unknown')}

        Include insights on:
        1. Personality traits and characteristics
        2. Strengths and weaknesses
        3. Life purpose and direction
        4. Relationships and compatibility
        5. Career and professional path
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        analysis_result = orchestrator.generate_prediction(
            category='predictions',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        logger.info("Zodiac analysis completed successfully")
        return success_response(
            data={
                'chart': birth_chart,
                'analysis': analysis_result.get('prediction', analysis_result),
                'partial': analysis_result.get('partial', False),
                'mode': analysis_result.get('mode', mode)
            },
            message="Zodiac analysis completed successfully"
        )

    except ValueError as e:
        log_error(logger, e, "Zodiac analysis - ValueError")
        return validation_error_response("Invalid request data.")
    except Exception as e:
        log_error(logger, e, "Zodiac analysis")
        return server_error_response("Failed to generate zodiac analysis. Please try again.")

@bp.route('/planetary-positions', methods=['POST'])
def planetary_positions():
    """Get current planetary positions and house placements"""
    try:
        if not request.is_json:
            return error_response("Content-Type must be application/json", 400)

        data = request.get_json()
        log_request(logger, data, '/api/astrology/planetary-positions')

        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            # Validate birth details
            is_valid, error_msg = validate_birth_details(data)
            if not is_valid:
                logger.warning(f"Validation failed: {error_msg}")
                return validation_error_response(error_msg)

            logger.info("Calculating planetary positions")
            chart = calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=sanitize_input(data['place_of_birth'], max_length=200),
                timezone_override=sanitize_input(data['timezone'], max_length=64)
                if data.get('timezone') else None
            )

            # Check if calculation returned an error
            if 'error' in chart:
                error_info = chart['error']
                logger.error(f"Birth chart calculation failed: {error_info.get('message')}")
                return error_response(
                    error_info.get('message', 'Failed to calculate birth chart'),
                    400 if error_info.get('code') == 'geocoding_failed' else 500
                )
        else:
            logger.warning("Astrology calculator unavailable; using cached birth data.")
            chart = cached_birth_data

        logger.info("Planetary positions calculated successfully")
        return success_response(
            data={
                'planets': chart.get('planets', {}),
                'houses': chart.get('houses', {}),
                'aspects': chart.get('aspects', [])
            },
            message="Planetary positions retrieved successfully"
        )

    except ValueError as e:
        log_error(logger, e, "Planetary positions - ValueError")
        return validation_error_response("Invalid request data.")
    except Exception as e:
        log_error(logger, e, "Planetary positions")
        return server_error_response("Failed to calculate planetary positions. Please try again.")

@bp.route('/compatibility', methods=['POST'])
def compatibility_analysis():
    """Analyze compatibility between two people with detailed AI insights"""
    try:
        if not request.is_json:
            return error_response("Content-Type must be application/json", 400)

        data = request.get_json()
        log_request(logger, data, '/api/astrology/compatibility')

        # Validate person1 data
        if 'person1' not in data:
            return validation_error_response("Missing person1 data", field="person1")

        # Validate person2 data
        if 'person2' not in data:
            return validation_error_response("Missing person2 data", field="person2")

        calculator = get_astrology_calculator()
        cached_chart1 = get_cached_birth_data(data['person1'])
        cached_chart2 = get_cached_birth_data(data['person2'])
        if not calculator and not (cached_chart1 and cached_chart2):
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            is_valid, error_msg = validate_birth_details(data['person1'])
            if not is_valid:
                logger.warning(f"Person1 validation failed: {error_msg}")
                return validation_error_response(f"Person1: {error_msg}")

            is_valid, error_msg = validate_birth_details(data['person2'])
            if not is_valid:
                logger.warning(f"Person2 validation failed: {error_msg}")
                return validation_error_response(f"Person2: {error_msg}")

            # Calculate charts for both people
            logger.info("Calculating compatibility charts")
            chart1 = calculator.calculate_birth_chart(
                date_of_birth=data['person1']['date_of_birth'],
                time_of_birth=data['person1']['time_of_birth'],
                place=sanitize_input(data['person1']['place_of_birth'], max_length=200),
                timezone_override=sanitize_input(data['person1']['timezone'], max_length=64)
                if data['person1'].get('timezone') else None
            )

            # Check if person1 chart calculation returned an error
            if 'error' in chart1:
                error_info = chart1['error']
                logger.error(f"Person1 birth chart calculation failed: {error_info.get('message')}")
                return error_response(
                    f"Person1: {error_info.get('message', 'Failed to calculate birth chart')}",
                    400 if error_info.get('code') == 'geocoding_failed' else 500
                )

            chart2 = calculator.calculate_birth_chart(
                date_of_birth=data['person2']['date_of_birth'],
                time_of_birth=data['person2']['time_of_birth'],
                place=sanitize_input(data['person2']['place_of_birth'], max_length=200),
                timezone_override=sanitize_input(data['person2']['timezone'], max_length=64)
                if data['person2'].get('timezone') else None
            )

            # Check if person2 chart calculation returned an error
            if 'error' in chart2:
                error_info = chart2['error']
                logger.error(f"Person2 birth chart calculation failed: {error_info.get('message')}")
                return error_response(
                    f"Person2: {error_info.get('message', 'Failed to calculate birth chart')}",
                    400 if error_info.get('code') == 'geocoding_failed' else 500
                )
        else:
            logger.warning("Astrology calculator unavailable; using cached birth data.")
            chart1 = cached_chart1
            chart2 = cached_chart2

        # Generate compatibility analysis
        logger.info("Generating AI-powered compatibility analysis")
        prompt = f"""
        Analyze romantic compatibility between:
        Person 1: {chart1.get('zodiac_sign', 'Unknown')} Sun, {chart1.get('moon_sign', 'Unknown')} Moon, {chart1.get('nakshatra', 'Unknown')} Nakshatra
        Person 2: {chart2.get('zodiac_sign', 'Unknown')} Sun, {chart2.get('moon_sign', 'Unknown')} Moon, {chart2.get('nakshatra', 'Unknown')} Nakshatra

        Provide a comprehensive compatibility analysis including:
        1. Overall compatibility score (0-100)
        2. Emotional compatibility and understanding
        3. Intellectual compatibility and communication
        4. Physical attraction and chemistry
        5. Spiritual connection and shared values
        6. Long-term relationship prospects
        7. Potential challenges and how to overcome them
        8. Strengths of the relationship
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        compatibility_result = orchestrator.generate_prediction(
            category='relationships',
            chart_data={
                'person1': chart1,
                'person2': chart2
            },
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        logger.info("Compatibility analysis completed successfully")
        return success_response(
            data={
                'person1_chart': chart1,
                'person2_chart': chart2,
                'compatibility_analysis': compatibility_result.get('prediction', compatibility_result),
                'partial': compatibility_result.get('partial', False),
                'mode': compatibility_result.get('mode', mode),
                'compatibility_factors': {
                    'sun_sign_compatibility': calculate_element_compatibility(
                        chart1.get('zodiac_sign'), chart2.get('zodiac_sign')
                    ),
                    'moon_sign_compatibility': calculate_element_compatibility(
                        chart1.get('moon_sign'), chart2.get('moon_sign')
                    ),
                    'nakshatra_compatibility': calculate_nakshatra_compatibility(
                        chart1.get('nakshatra'), chart2.get('nakshatra')
                    )
                }
            },
            message="Compatibility analysis completed successfully"
        )

    except ValueError as e:
        log_error(logger, e, "Compatibility analysis - ValueError")
        return validation_error_response("Invalid request data.")
    except Exception as e:
        log_error(logger, e, "Compatibility analysis")
        return server_error_response("Failed to generate compatibility analysis. Please try again.")


def calculate_element_compatibility(sign1: str, sign2: str) -> dict:
    """Calculate compatibility based on zodiac elements"""
    elements = {
        'Aries': 'Fire', 'Leo': 'Fire', 'Sagittarius': 'Fire',
        'Taurus': 'Earth', 'Virgo': 'Earth', 'Capricorn': 'Earth',
        'Gemini': 'Air', 'Libra': 'Air', 'Aquarius': 'Air',
        'Cancer': 'Water', 'Scorpio': 'Water', 'Pisces': 'Water'
    }

    element1 = elements.get(sign1, 'Unknown')
    element2 = elements.get(sign2, 'Unknown')

    # Same element = high compatibility
    # Compatible elements: Fire-Air, Earth-Water
    compatibility_matrix = {
        ('Fire', 'Fire'): 85, ('Fire', 'Air'): 80, ('Fire', 'Earth'): 45, ('Fire', 'Water'): 40,
        ('Air', 'Fire'): 80, ('Air', 'Air'): 85, ('Air', 'Water'): 45, ('Air', 'Earth'): 50,
        ('Earth', 'Earth'): 85, ('Earth', 'Water'): 80, ('Earth', 'Fire'): 45, ('Earth', 'Air'): 50,
        ('Water', 'Water'): 85, ('Water', 'Earth'): 80, ('Water', 'Fire'): 40, ('Water', 'Air'): 45,
    }

    score = compatibility_matrix.get((element1, element2), 50)

    return {
        'element1': element1,
        'element2': element2,
        'compatibility_score': score,
        'description': get_element_compatibility_description(element1, element2, score)
    }


def calculate_nakshatra_compatibility(nakshatra1: str, nakshatra2: str) -> dict:
    """Calculate basic nakshatra compatibility"""
    # Simplified nakshatra compatibility (can be enhanced with full Koota system)
    return {
        'nakshatra1': nakshatra1,
        'nakshatra2': nakshatra2,
        'compatibility_score': 75,  # Placeholder - implement full Koota calculation
        'description': 'Good nakshatra compatibility for long-term harmony'
    }


def get_element_compatibility_description(element1: str, element2: str, score: int) -> str:
    """Get description for element compatibility"""
    if score >= 80:
        return f"{element1} and {element2} signs have excellent natural harmony and understanding"
    elif score >= 60:
        return f"{element1} and {element2} signs complement each other well with some effort"
    else:
        return f"{element1} and {element2} signs may face challenges but can grow through differences"

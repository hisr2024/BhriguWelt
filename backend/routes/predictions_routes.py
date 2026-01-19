"""
Predictions API Routes
General prediction endpoints with structured horoscope data
"""
from flask import Blueprint, request, jsonify
from services.astrology_calculator import get_astrology_calculator, get_astrology_dependency_error
from services.prediction_orchestrator import get_prediction_orchestrator
from services.section_parser import get_section_parser
from services.horoscope_engine import get_horoscope_engine
from utils.client_status import parse_client_online
from utils.astrology_helpers import dependency_error_response, get_cached_birth_data, handle_birth_chart_error
from datetime import datetime
import logging
from utils.validators import sanitizeQuestion
from utils.response_formatter import prediction_response, prediction_error_response
from utils.validators import sanitize_input
from utils.logger import setup_logger, log_exception

logger = setup_logger(__name__)

bp = Blueprint('predictions', __name__, url_prefix='/api/predictions')
orchestrator = get_prediction_orchestrator()
horoscope_engine = get_horoscope_engine()

# Import limiter from app (will be set when app.py loads this module)
limiter = None
try:
    from app import limiter
except ImportError:
    pass  # Limiter not available during testing

@bp.route('/daily', methods=['POST'])
def daily_prediction():
    """Get daily horoscope prediction with structured sections"""
    try:
        data = request.get_json()
        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            birth_chart = calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=data['place_of_birth'],
                timezone_override=sanitize_input(data['timezone'], max_length=64)
                if data.get('timezone') else None
            )

            # Check for errors in birth chart calculation
            error_response_tuple = handle_birth_chart_error(birth_chart)
            if error_response_tuple:
                return error_response_tuple
        else:
            logger.warning("Astrology calculator unavailable; using cached birth data.")
            birth_chart = cached_birth_data

        # Generate structured daily horoscope
        horoscope = horoscope_engine.generate_daily_horoscope(birth_chart)

        return prediction_response(
            {
                'date': horoscope['date'],
                'day': horoscope['day'],
                'zodiac_sign': horoscope['zodiac_sign'],
                'overall': horoscope['overall'],
                'sections': horoscope['sections'],
                'ratings': horoscope['ratings'],
                'lucky_elements': horoscope['lucky_elements'],
                'daily_mantra': horoscope['daily_mantra'],
                'bhrigu_guidance': horoscope['bhrigu_guidance']
            },
            metadata={
                'timeframe': 'daily',
                'zodiac_sign': horoscope['zodiac_sign'],
                'moon_sign': horoscope['metadata'].get('moon_sign'),
                'nakshatra': horoscope['metadata'].get('nakshatra'),
                'dasha': horoscope['metadata'].get('dasha'),
                'mode': 'structured'
            }
        )

    except KeyError as e:
        logger.warning(f"Missing required field in daily prediction: {e}")
        return prediction_error_response(
            f"Missing required field: {str(e)}",
            400
        )
    except ValueError as e:
        logger.warning(f"Invalid input in daily prediction: {e}")
        return prediction_error_response(
            f"Invalid input: {str(e)}",
            400
        )
    except PermissionError as e:
        logger.warning(f"Permission denied in daily prediction: {e}")
        return prediction_error_response(
            "Permission denied",
            403
        )
    except Exception as e:
        log_exception(logger, e, context="predictions.daily")
        return prediction_error_response(
            "Failed to generate daily prediction. Please try again later.",
            500
        )

@bp.route('/weekly', methods=['POST'])
def weekly_prediction():
    """Get weekly horoscope prediction with day-by-day breakdown"""
    try:
        data = request.get_json()
        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            birth_chart = calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=data['place_of_birth'],
                timezone_override=sanitize_input(data['timezone'], max_length=64)
                if data.get('timezone') else None
            )

            # Check for errors in birth chart calculation
            error_response_tuple = handle_birth_chart_error(birth_chart)
            if error_response_tuple:
                return error_response_tuple
        else:
            logger.warning("Astrology calculator unavailable; using cached birth data.")
            birth_chart = cached_birth_data

        # Generate structured weekly horoscope
        horoscope = horoscope_engine.generate_weekly_horoscope(birth_chart)

        return prediction_response(
            {
                'week_start': horoscope['week_start'],
                'week_end': horoscope['week_end'],
                'zodiac_sign': horoscope['zodiac_sign'],
                'weekly_theme': horoscope['weekly_theme'],
                'sections': horoscope['sections'],
                'daily_summaries': horoscope['daily_summaries'],
                'best_day': horoscope['best_day'],
                'challenging_day': horoscope['challenging_day'],
                'weekly_mantra': horoscope['weekly_mantra'],
                'bhrigu_guidance': horoscope['bhrigu_guidance']
            },
            metadata={
                'timeframe': 'weekly',
                'zodiac_sign': horoscope['zodiac_sign'],
                'moon_sign': horoscope['metadata'].get('moon_sign'),
                'mode': 'structured'
            }
        )

    except KeyError as e:
        logger.warning(f"Missing required field in weekly prediction: {e}")
        return prediction_error_response(
            f"Missing required field: {str(e)}",
            400
        )
    except ValueError as e:
        logger.warning(f"Invalid input in weekly prediction: {e}")
        return prediction_error_response(
            f"Invalid input: {str(e)}",
            400
        )
    except PermissionError as e:
        logger.warning(f"Permission denied in weekly prediction: {e}")
        return prediction_error_response(
            "Permission denied",
            403
        )
    except Exception as e:
        log_exception(logger, e, context="predictions.weekly")
        return prediction_error_response(
            "Failed to generate weekly prediction. Please try again later.",
            500
        )

@bp.route('/monthly', methods=['POST'])
def monthly_prediction():
    """Get monthly horoscope prediction with key dates and rituals"""
    try:
        data = request.get_json()
        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            birth_chart = calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=data['place_of_birth'],
                timezone_override=sanitize_input(data['timezone'], max_length=64)
                if data.get('timezone') else None
            )

            # Check for errors in birth chart calculation
            error_response_tuple = handle_birth_chart_error(birth_chart)
            if error_response_tuple:
                return error_response_tuple
        else:
            logger.warning("Astrology calculator unavailable; using cached birth data.")
            birth_chart = cached_birth_data

        # Generate structured monthly horoscope
        horoscope = horoscope_engine.generate_monthly_horoscope(birth_chart)

        return prediction_response(
            {
                'month': horoscope['month'],
                'year': horoscope['year'],
                'month_name': horoscope['month_name'],
                'zodiac_sign': horoscope['zodiac_sign'],
                'monthly_theme': horoscope['monthly_theme'],
                'sections': horoscope['sections'],
                'important_dates': horoscope['important_dates'],
                'power_days': horoscope['power_days'],
                'caution_days': horoscope['caution_days'],
                'monthly_mantra': horoscope['monthly_mantra'],
                'monthly_ritual': horoscope['monthly_ritual'],
                'bhrigu_guidance': horoscope['bhrigu_guidance']
            },
            metadata={
                'timeframe': 'monthly',
                'zodiac_sign': horoscope['zodiac_sign'],
                'moon_sign': horoscope['metadata'].get('moon_sign'),
                'nakshatra': horoscope['metadata'].get('nakshatra'),
                'mode': 'structured'
            }
        )

    except KeyError as e:
        logger.warning(f"Missing required field in monthly prediction: {e}")
        return prediction_error_response(
            f"Missing required field: {str(e)}",
            400
        )
    except ValueError as e:
        logger.warning(f"Invalid input in monthly prediction: {e}")
        return prediction_error_response(
            f"Invalid input: {str(e)}",
            400
        )
    except PermissionError as e:
        logger.warning(f"Permission denied in monthly prediction: {e}")
        return prediction_error_response(
            "Permission denied",
            403
        )
    except Exception as e:
        log_exception(logger, e, context="predictions.monthly")
        return prediction_error_response(
            "Failed to generate monthly prediction. Please try again later.",
            500
        )

@bp.route('/yearly', methods=['POST'])
def yearly_prediction():
    """Get yearly horoscope prediction with quarterly breakdown and key months"""
    try:
        data = request.get_json()
        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            birth_chart = calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=data['place_of_birth'],
                timezone_override=sanitize_input(data['timezone'], max_length=64)
                if data.get('timezone') else None
            )

            # Check for errors in birth chart calculation
            error_response_tuple = handle_birth_chart_error(birth_chart)
            if error_response_tuple:
                return error_response_tuple
        else:
            logger.warning("Astrology calculator unavailable; using cached birth data.")
            birth_chart = cached_birth_data

        # Generate structured yearly horoscope
        horoscope = horoscope_engine.generate_yearly_horoscope(birth_chart)

        return prediction_response(
            {
                'year': horoscope['year'],
                'zodiac_sign': horoscope['zodiac_sign'],
                'yearly_theme': horoscope['yearly_theme'],
                'sections': horoscope['sections'],
                'quarters': horoscope['quarters'],
                'key_months': horoscope['key_months'],
                'yearly_mantra': horoscope['yearly_mantra'],
                'annual_ritual': horoscope['annual_ritual'],
                'bhrigu_guidance': horoscope['bhrigu_guidance']
            },
            metadata={
                'timeframe': 'yearly',
                'zodiac_sign': horoscope['zodiac_sign'],
                'moon_sign': horoscope['metadata'].get('moon_sign'),
                'nakshatra': horoscope['metadata'].get('nakshatra'),
                'dasha': horoscope['metadata'].get('dasha'),
                'mode': 'structured'
            }
        )

    except Exception as e:
        log_exception(logger, e, context="predictions.yearly")
        return prediction_error_response(
            "Failed to generate yearly prediction. Please try again later.",
            500
        )

@bp.route('/question', methods=['POST'])
def specific_question():
    """Get prediction for specific question"""
    try:
        data = request.get_json()
        raw_question = data.get('question')
        question = sanitizeQuestion(raw_question, max_length=500) if raw_question else ''

        if not question:
            return prediction_error_response('Question is required', 400)
        logger.info("Received sanitized question: %s", question)

        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            birth_chart = calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=data['place_of_birth'],
                timezone_override=sanitize_input(data['timezone'], max_length=64)
                if data.get('timezone') else None
            )

            # Check for errors in birth chart calculation
            error_response_tuple = handle_birth_chart_error(birth_chart)
            if error_response_tuple:
                return error_response_tuple
        else:
            logger.warning("Astrology calculator unavailable; using cached birth data.")
            birth_chart = cached_birth_data

        prompt = f"""
        Answer this specific question based on Vedic astrology:
        Question: {question}

        Birth Chart Context:
        - Zodiac: {birth_chart['zodiac_sign']}
        - Nakshatra: {birth_chart['nakshatra']}
        - Current Dasha: {birth_chart['dasha_period']['maha_dasha']}
        - Relevant house positions

        Provide detailed answer with:
        1. Direct answer to question
        2. Astrological reasoning
        3. Timing if applicable
        4. Remedies if needed
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        answer_result = orchestrator.generate_prediction(
            category='predictions',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )
        answer = answer_result.get('prediction', answer_result)

        return prediction_response(
            {
                'question': question,
                'answer': answer,
                'partial': answer_result.get('partial', False),
                'zodiac_sign': birth_chart['zodiac_sign']
            },
            metadata={
                'timeframe': 'question',
                'zodiac_sign': birth_chart['zodiac_sign'],
                'nakshatra': birth_chart['nakshatra'],
                'dasha': birth_chart.get('dasha_period', {}).get('maha_dasha'),
                'mode': answer_result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="predictions.question")
        return prediction_error_response(
            "Failed to answer prediction question. Please try again later.",
            500
        )

@bp.route('/test-section-extraction', methods=['POST'])
def test_section_extraction():
    """
    Test endpoint for debugging section extraction
    Accepts raw text and category, returns extracted sections
    """
    try:
        data = request.get_json()
        raw_text = data.get('raw_text')
        category = data.get('category', 'karmic_journey')

        if not raw_text:
            return jsonify({'error': 'raw_text is required'}), 400

        # Get section parser
        parser = get_section_parser()

        # Extract sections
        logger.info(f"Testing section extraction for category: {category}")
        sections = parser.extract_sections(raw_text, category, {})

        # Validate sections
        validation = parser.validate_sections(sections, category)
        missing_sections = parser.get_missing_sections(sections, category)

        # Calculate statistics
        total_sections = len(parser.REQUIRED_SECTIONS.get(category, []))
        extracted_sections = sum(1 for v in validation.values() if v)
        extraction_rate = (extracted_sections / total_sections * 100) if total_sections > 0 else 0

        return jsonify({
            'status': 'success',
            'data': {
                'category': category,
                'total_sections_required': total_sections,
                'sections_extracted': extracted_sections,
                'extraction_rate': f"{extraction_rate:.1f}%",
                'sections': sections,
                'validation': validation,
                'missing_sections': missing_sections,
                'raw_text_length': len(raw_text),
                'section_lengths': {
                    k: len(v) if v else 0
                    for k, v in sections.items()
                    if k != 'section_generation_status'
                }
            }
        }), 200

    except Exception as e:
        log_exception(logger, e, context="predictions.test_section_extraction")
        return error_response("Failed to test section extraction.", 500)

@bp.route('/debug-info', methods=['GET'])
def debug_info():
    """
    Get debug information about section extraction configuration
    """
    try:
        parser = get_section_parser()

        return jsonify({
            'status': 'success',
            'data': {
                'available_categories': list(parser.REQUIRED_SECTIONS.keys()),
                'category_sections': {
                    category: {
                        'required_sections': sections,
                        'count': len(sections),
                        'headers': {
                            section: parser.SECTION_HEADERS.get(section, [])
                            for section in sections
                        }
                    }
                    for category, sections in parser.REQUIRED_SECTIONS.items()
                },
                'minimum_section_length': parser.MINIMUM_SECTION_LENGTH,
                'header_extraction_min_length': parser.HEADER_EXTRACTION_MIN_LENGTH
            }
        }), 200

    except Exception as e:
        log_exception(logger, e, context="predictions.debug_info")
        return error_response("Failed to load debug info.", 500)

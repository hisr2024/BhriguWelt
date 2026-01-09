"""
Predictions API Routes
General prediction endpoints
"""
from flask import Blueprint, request, jsonify
from services.astrology_calculator import get_astrology_calculator, get_astrology_dependency_error
from services.prediction_orchestrator import get_prediction_orchestrator
from services.section_parser import get_section_parser
from utils.client_status import parse_client_online
from utils.astrology_helpers import dependency_error_response, get_cached_birth_data
from datetime import datetime
import logging
from utils.validators import sanitizeQuestion
from utils.response_formatter import prediction_response, prediction_error_response
from utils.validators import sanitize_input
from utils.logger import setup_logger

logger = setup_logger(__name__)

bp = Blueprint('predictions', __name__, url_prefix='/api/predictions')
orchestrator = get_prediction_orchestrator()

@bp.route('/daily', methods=['POST'])
def daily_prediction():
    """Get daily horoscope prediction"""
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
        else:
            logger.warning("Astrology calculator unavailable; using cached birth data.")
            birth_chart = cached_birth_data

        today = datetime.now().strftime("%Y-%m-%d")
        prompt = f"""
        Provide daily horoscope for {today}:
        - Zodiac: {birth_chart['zodiac_sign']}
        - Moon Sign: {birth_chart['moon_sign']}
        - Current Dasha: {birth_chart['dasha_period']['maha_dasha']}

        Include:
        1. Overall day energy
        2. Career and finances
        3. Relationships and love
        4. Health and wellness
        5. Lucky color and number
        6. Auspicious timing
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='predictions',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )
        prediction = result.get('prediction', result)

        return prediction_response(
            {
                'date': today,
                'zodiac_sign': birth_chart['zodiac_sign'],
                'prediction': prediction
            },
            metadata={
                'timeframe': 'daily',
                'zodiac_sign': birth_chart['zodiac_sign'],
                'moon_sign': birth_chart['moon_sign'],
                'dasha': birth_chart.get('dasha_period', {}).get('maha_dasha'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="predictions.daily")
        return prediction_error_response(
            "Failed to generate daily prediction. Please try again later.",
            500
        )

@bp.route('/weekly', methods=['POST'])
def weekly_prediction():
    """Get weekly horoscope prediction"""
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
        else:
            logger.warning("Astrology calculator unavailable; using cached birth data.")
            birth_chart = cached_birth_data

        prompt = f"""
        Provide weekly horoscope:
        - Zodiac: {birth_chart['zodiac_sign']}
        - Nakshatra: {birth_chart['nakshatra']}

        Weekly forecast for:
        1. Career and professional life
        2. Love and relationships
        3. Financial matters
        4. Health and energy
        5. Key dates and timing
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='predictions',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )
        prediction = result.get('prediction', result)

        return prediction_response(
            {
                'zodiac_sign': birth_chart['zodiac_sign'],
                'weekly_prediction': prediction
            },
            metadata={
                'timeframe': 'weekly',
                'zodiac_sign': birth_chart['zodiac_sign'],
                'nakshatra': birth_chart['nakshatra'],
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="predictions.weekly")
        return prediction_error_response(
            "Failed to generate weekly prediction. Please try again later.",
            500
        )

@bp.route('/monthly', methods=['POST'])
def monthly_prediction():
    """Get monthly horoscope prediction"""
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
        else:
            logger.warning("Astrology calculator unavailable; using cached birth data.")
            birth_chart = cached_birth_data

        current_month = datetime.now().strftime("%B %Y")
        prompt = f"""
        Provide monthly horoscope for {current_month}:
        - Zodiac: {birth_chart['zodiac_sign']}
        - Current Dasha: {birth_chart['dasha_period']['maha_dasha']}

        Monthly themes:
        1. Overall month energy
        2. Career opportunities
        3. Relationship dynamics
        4. Financial prospects
        5. Important dates
        6. Challenges and solutions
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='predictions',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )
        prediction = result.get('prediction', result)

        return prediction_response(
            {
                'month': current_month,
                'zodiac_sign': birth_chart['zodiac_sign'],
                'monthly_prediction': prediction
            },
            metadata={
                'timeframe': 'monthly',
                'zodiac_sign': birth_chart['zodiac_sign'],
                'dasha': birth_chart.get('dasha_period', {}).get('maha_dasha'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="predictions.monthly")
        return prediction_error_response(
            "Failed to generate monthly prediction. Please try again later.",
            500
        )

@bp.route('/yearly', methods=['POST'])
def yearly_prediction():
    """Get yearly horoscope prediction"""
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
        else:
            logger.warning("Astrology calculator unavailable; using cached birth data.")
            birth_chart = cached_birth_data

        current_year = datetime.now().year
        prompt = f"""
        Provide comprehensive yearly forecast for {current_year}:
        - Zodiac: {birth_chart['zodiac_sign']}
        - Current Dasha: {birth_chart['dasha_period']['maha_dasha']}

        Annual themes:
        1. Year overview and major themes
        2. Career and professional growth
        3. Love, relationships, marriage
        4. Financial prosperity
        5. Health and wellness
        6. Spiritual development
        7. Quarter-by-quarter breakdown
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='predictions',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )
        prediction = result.get('prediction', result)

        return prediction_response(
            {
                'year': current_year,
                'zodiac_sign': birth_chart['zodiac_sign'],
                'yearly_prediction': prediction
            },
            metadata={
                'timeframe': 'yearly',
                'zodiac_sign': birth_chart['zodiac_sign'],
                'dasha': birth_chart.get('dasha_period', {}).get('maha_dasha'),
                'mode': result.get('mode', mode)
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

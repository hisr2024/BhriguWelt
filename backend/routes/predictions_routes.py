"""
Predictions API Routes
General prediction endpoints
"""
from flask import Blueprint, request, jsonify
from services.astrology_calculator import astrology_calculator
from services.openai_service import openai_service
from services.section_parser import get_section_parser
from utils.client_status import parse_client_online
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

bp = Blueprint('predictions', __name__, url_prefix='/api/predictions')

@bp.route('/daily', methods=['POST'])
def daily_prediction():
    """Get daily horoscope prediction"""
    try:
        data = request.get_json()
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        )

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
        if client_online is False and openai_service.offline_wisdom:
            prediction = openai_service.offline_wisdom.generate_general_predictions(birth_chart)
            mode = 'offline'
        else:
            prediction = openai_service.generate_prediction(prompt, birth_chart)
            mode = 'online' if openai_service.enabled else 'offline'

        return jsonify({
            'status': 'success',
            'metadata': {
                'mode': mode,
                'client_online': client_online,
            },
            'data': {
                'date': today,
                'zodiac_sign': birth_chart['zodiac_sign'],
                'prediction': prediction
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/weekly', methods=['POST'])
def weekly_prediction():
    """Get weekly horoscope prediction"""
    try:
        data = request.get_json()
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        )

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
        if client_online is False and openai_service.offline_wisdom:
            prediction = openai_service.offline_wisdom.generate_general_predictions(birth_chart)
            mode = 'offline'
        else:
            prediction = openai_service.generate_prediction(prompt, birth_chart)
            mode = 'online' if openai_service.enabled else 'offline'

        return jsonify({
            'status': 'success',
            'metadata': {
                'mode': mode,
                'client_online': client_online,
            },
            'data': {
                'zodiac_sign': birth_chart['zodiac_sign'],
                'weekly_prediction': prediction
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/monthly', methods=['POST'])
def monthly_prediction():
    """Get monthly horoscope prediction"""
    try:
        data = request.get_json()
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        )

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
        if client_online is False and openai_service.offline_wisdom:
            prediction = openai_service.offline_wisdom.generate_general_predictions(birth_chart)
            mode = 'offline'
        else:
            prediction = openai_service.generate_prediction(prompt, birth_chart)
            mode = 'online' if openai_service.enabled else 'offline'

        return jsonify({
            'status': 'success',
            'metadata': {
                'mode': mode,
                'client_online': client_online,
            },
            'data': {
                'month': current_month,
                'zodiac_sign': birth_chart['zodiac_sign'],
                'monthly_prediction': prediction
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/yearly', methods=['POST'])
def yearly_prediction():
    """Get yearly horoscope prediction"""
    try:
        data = request.get_json()
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        )

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
        if client_online is False and openai_service.offline_wisdom:
            prediction = openai_service.offline_wisdom.generate_general_predictions(birth_chart)
            mode = 'offline'
        else:
            prediction = openai_service.generate_prediction(prompt, birth_chart)
            mode = 'online' if openai_service.enabled else 'offline'

        return jsonify({
            'status': 'success',
            'metadata': {
                'mode': mode,
                'client_online': client_online,
            },
            'data': {
                'year': current_year,
                'zodiac_sign': birth_chart['zodiac_sign'],
                'yearly_prediction': prediction
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/question', methods=['POST'])
def specific_question():
    """Get prediction for specific question"""
    try:
        data = request.get_json()
        question = data.get('question')

        if not question:
            return jsonify({'error': 'Question is required'}), 400

        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        )

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
        if client_online is False and openai_service.offline_wisdom:
            answer = openai_service.offline_wisdom.generate_general_predictions(birth_chart)
            mode = 'offline'
        else:
            answer = openai_service.generate_prediction(prompt, birth_chart)
            mode = 'online' if openai_service.enabled else 'offline'

        return jsonify({
            'status': 'success',
            'metadata': {
                'mode': mode,
                'client_online': client_online,
            },
            'data': {
                'question': question,
                'answer': answer,
                'zodiac_sign': birth_chart['zodiac_sign']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
                'section_lengths': {k: len(v) if v else 0 for k, v in sections.items()}
            }
        }), 200

    except Exception as e:
        logger.error(f"Error in test section extraction: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

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
        logger.error(f"Error in debug info: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

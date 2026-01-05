"""
Karmic Journey API Routes
Soul journey and karmic analysis endpoints
"""
from flask import Blueprint, request, jsonify
from services.astrology_calculator import astrology_calculator
from services.openai_service import openai_service

bp = Blueprint('karmic_journey', __name__, url_prefix='/api/karmic-journey')

@bp.route('/analysis', methods=['POST'])
def karmic_journey_analysis():
    """
    Generate comprehensive karmic journey analysis

    Request JSON:
    {
        "date_of_birth": "1990-01-15",
        "time_of_birth": "14:30",
        "place_of_birth": "New Delhi, India"
    }
    """
    try:
        data = request.get_json()

        # Calculate birth chart first
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        )

        # Generate karmic journey analysis using OpenAI
        karmic_analysis = openai_service.generate_karmic_journey(birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'birth_chart': birth_chart,
                'karmic_journey': karmic_analysis
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/soul-purpose', methods=['POST'])
def soul_purpose():
    """Discover soul's purpose in this lifetime"""
    try:
        data = request.get_json()
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        )

        prompt = f"""
        Based on Vedic astrology, determine the soul purpose for:
        - Zodiac: {birth_chart['zodiac_sign']}
        - Nakshatra: {birth_chart['nakshatra']}
        - Ascendant: {birth_chart['ascendant']}
        - North Node (Rahu): {birth_chart['planets']['Rahu']['sign']}

        Provide insights on:
        1. Primary life mission
        2. Soul contracts and agreements
        3. Dharmic responsibilities
        4. Spiritual gifts and talents
        5. Service to humanity
        """

        analysis = openai_service.generate_prediction(prompt, birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'soul_purpose': analysis,
                'dharmic_path': birth_chart['planets']['Rahu']['sign']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/karmic-lessons', methods=['POST'])
def karmic_lessons():
    """Get karmic lessons for this lifetime"""
    try:
        data = request.get_json()
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        )

        prompt = f"""
        Identify karmic lessons based on:
        - Zodiac: {birth_chart['zodiac_sign']}
        - South Node (Ketu): {birth_chart['planets']['Ketu']['sign']}
        - Saturn position: {birth_chart['planets']['Saturn']['sign']}
        - Karmic number: {birth_chart['karmic_number']}

        Detail:
        1. Primary karmic challenges
        2. Patterns to break
        3. Lessons to master
        4. Growth opportunities
        5. Karmic rewards upon completion
        """

        lessons = openai_service.generate_prediction(prompt, birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'karmic_lessons': lessons,
                'karmic_number': birth_chart['karmic_number'],
                'south_node': birth_chart['planets']['Ketu']['sign']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/soul-evolution', methods=['POST'])
def soul_evolution():
    """Track soul evolution and spiritual development"""
    try:
        data = request.get_json()
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        )

        prompt = f"""
        Analyze soul evolution stage for:
        - Nakshatra: {birth_chart['nakshatra']}
        - Jupiter (Guru) position: {birth_chart['planets']['Jupiter']['sign']}
        - Moon position: {birth_chart['planets']['Moon']['sign']}

        Determine:
        1. Current soul age and evolution stage
        2. Spiritual maturity level
        3. Consciousness expansion opportunities
        4. Next evolutionary steps
        5. Timeline to higher consciousness
        """

        evolution = openai_service.generate_prediction(prompt, birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'soul_evolution': evolution,
                'spiritual_teacher': birth_chart['planets']['Jupiter']['sign'],
                'emotional_evolution': birth_chart['planets']['Moon']['sign']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/dharmic-path', methods=['POST'])
def dharmic_path():
    """Identify dharmic path and life purpose"""
    try:
        data = request.get_json()
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        )

        prompt = f"""
        Define dharmic path based on:
        - Sun sign (Atma Karaka): {birth_chart['zodiac_sign']}
        - 10th house (Career/Dharma): {birth_chart['houses'][9]}
        - Jupiter (Dharma): {birth_chart['planets']['Jupiter']['sign']}

        Provide guidance on:
        1. Right livelihood and career path
        2. Service and contribution to society
        3. Dharmic duties and responsibilities
        4. Alignment with cosmic purpose
        5. Success through dharma
        """

        dharma = openai_service.generate_prediction(prompt, birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'dharmic_path': dharma,
                'career_house': birth_chart['houses'][9],
                'dharma_planet': birth_chart['planets']['Jupiter']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

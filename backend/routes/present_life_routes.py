"""
Present Life API Routes
Current life analysis and guidance endpoints
"""
from flask import Blueprint, request, jsonify
from services.astrology_calculator import get_astrology_calculator, get_astrology_dependency_error
from services.openai_service import openai_service
from utils.astrology_helpers import dependency_error_response, get_cached_birth_data


def _get_birth_chart(data):
    calculator = get_astrology_calculator()
    cached_birth_data = get_cached_birth_data(data)
    if calculator:
        return calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        ), None
    if cached_birth_data:
        return cached_birth_data, None
    return None, dependency_error_response(get_astrology_dependency_error())

bp = Blueprint('present_life', __name__, url_prefix='/api/present-life')

@bp.route('/comprehensive-analysis', methods=['POST'])
def comprehensive_analysis():
    """
    Generate comprehensive present life analysis

    Request JSON:
    {
        "date_of_birth": "1990-01-15",
        "time_of_birth": "14:30",
        "place_of_birth": "New Delhi, India"
    }
    """
    try:
        data = request.get_json()

        # Calculate birth chart
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        # Generate present life analysis
        present_life = openai_service.generate_present_life_analysis(birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'birth_chart': birth_chart,
                'present_life_analysis': present_life
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/career-guidance', methods=['POST'])
def career_guidance():
    """Get detailed career and professional guidance"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Provide comprehensive career guidance:
        - 10th House (Career): {birth_chart['houses'][9]}
        - Sun (Authority): {birth_chart['zodiac_sign']}
        - Mercury (Skills): {birth_chart['planets']['Mercury']['sign']}
        - Saturn (Discipline): {birth_chart['planets']['Saturn']['sign']}

        Analyze:
        1. Ideal career paths and professions
        2. Natural talents and strengths
        3. Career timing and opportunities
        4. Business vs employment suitability
        5. Success factors and challenges
        6. Financial prosperity timeline
        """

        career = openai_service.generate_prediction(prompt, birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'career_guidance': career,
                'career_house': birth_chart['houses'][9],
                'authority_sign': birth_chart['zodiac_sign']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/relationships', methods=['POST'])
def relationships_analysis():
    """Analyze current relationship patterns and guidance"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Analyze relationship dynamics:
        - 7th House (Partnership): {birth_chart['houses'][6]}
        - Venus (Love): {birth_chart['planets']['Venus']['sign']}
        - Mars (Passion): {birth_chart['planets']['Mars']['sign']}
        - Moon (Emotions): {birth_chart['moon_sign']}

        Provide insights on:
        1. Relationship patterns and tendencies
        2. Ideal partner characteristics
        3. Marriage timing and compatibility
        4. Relationship challenges to overcome
        5. Keys to successful partnerships
        6. Family and friendship dynamics
        """

        relationships = openai_service.generate_prediction(prompt, birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'relationships_analysis': relationships,
                'partnership_house': birth_chart['houses'][6],
                'venus_position': birth_chart['planets']['Venus']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/health-wellness', methods=['POST'])
def health_wellness():
    """Get health and wellness guidance"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Provide health and wellness guidance:
        - 6th House (Health): {birth_chart['houses'][5]}
        - Ascendant (Vitality): {birth_chart['ascendant']}
        - Moon (Mind): {birth_chart['moon_sign']}
        - Saturn (Chronic issues): {birth_chart['planets']['Saturn']['sign']}

        Address:
        1. Constitutional health strengths and weaknesses
        2. Potential health concerns and prevention
        3. Mental and emotional wellbeing
        4. Ayurvedic constitution (Vata, Pitta, Kapha)
        5. Diet and lifestyle recommendations
        6. Energy management and vitality
        """

        health = openai_service.generate_prediction(prompt, birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'health_guidance': health,
                'health_house': birth_chart['houses'][5],
                'vitality_sign': birth_chart['ascendant']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/financial-prospects', methods=['POST'])
def financial_prospects():
    """Analyze financial prospects and wealth potential"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Analyze financial prospects:
        - 2nd House (Wealth): {birth_chart['houses'][1]}
        - 11th House (Income): {birth_chart['houses'][10]}
        - Jupiter (Prosperity): {birth_chart['planets']['Jupiter']['sign']}
        - Venus (Luxury): {birth_chart['planets']['Venus']['sign']}

        Evaluate:
        1. Wealth accumulation potential
        2. Income sources and opportunities
        3. Financial challenges and solutions
        4. Investment and business prospects
        5. Property and assets timing
        6. Financial planning recommendations
        """

        financial = openai_service.generate_prediction(prompt, birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'financial_prospects': financial,
                'wealth_house': birth_chart['houses'][1],
                'prosperity_planet': birth_chart['planets']['Jupiter']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/spiritual-growth', methods=['POST'])
def spiritual_growth():
    """Guide spiritual growth and development"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Guide spiritual growth:
        - 9th House (Dharma): {birth_chart['houses'][8]}
        - 12th House (Liberation): {birth_chart['houses'][11]}
        - Jupiter (Wisdom): {birth_chart['planets']['Jupiter']['sign']}
        - Nakshatra: {birth_chart['nakshatra']}

        Provide:
        1. Current spiritual development stage
        2. Meditation and practice recommendations
        3. Spiritual teachers and guides
        4. Sacred texts and studies
        5. Pilgrimage and sacred sites
        6. Spiritual breakthroughs timeline
        """

        spiritual = openai_service.generate_prediction(prompt, birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'spiritual_guidance': spiritual,
                'dharma_house': birth_chart['houses'][8],
                'wisdom_planet': birth_chart['planets']['Jupiter']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/current-dasha', methods=['POST'])
def current_dasha():
    """Analyze current planetary period (dasha)"""
    try:
        data = request.get_json()
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        )

        prompt = f"""
        Analyze current Dasha period:
        - Maha Dasha: {birth_chart['dasha_period']['maha_dasha']}
        - Years remaining: {birth_chart['dasha_period']['years_remaining']}
        - Nakshatra: {birth_chart['nakshatra']}

        Explain:
        1. Current dasha characteristics and effects
        2. Opportunities and challenges
        3. What to focus on during this period
        4. Upcoming dasha transitions
        5. Making the most of current period
        """

        dasha = openai_service.generate_prediction(prompt, birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'dasha_analysis': dasha,
                'current_dasha': birth_chart['dasha_period'],
                'nakshatra': birth_chart['nakshatra']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

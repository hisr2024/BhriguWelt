"""
Karmic Remedies API Routes
Personalized remedies and spiritual practices
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

bp = Blueprint('karmic_remedies', __name__, url_prefix='/api/karmic-remedies')

@bp.route('/comprehensive', methods=['POST'])
def comprehensive_remedies():
    """
    Generate comprehensive karmic remedies

    Request JSON:
    {
        "date_of_birth": "1990-01-15",
        "time_of_birth": "14:30",
        "place_of_birth": "New Delhi, India",
        "challenges": ["career", "health", "relationships"]  // optional
    }
    """
    try:
        data = request.get_json()

        # Calculate birth chart
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        # Generate remedies
        challenges = data.get('challenges', [])
        remedies = openai_service.generate_karmic_remedies(birth_chart, challenges)

        return jsonify({
            'status': 'success',
            'data': {
                'birth_chart': birth_chart,
                'remedies': remedies
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/mantras', methods=['POST'])
def mantra_recommendations():
    """Get personalized mantra recommendations"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Recommend powerful mantras for:
        - Zodiac: {birth_chart['zodiac_sign']}
        - Nakshatra: {birth_chart['nakshatra']}
        - Current Dasha: {birth_chart['dasha_period']['maha_dasha']}

        Provide:
        1. Primary ruling planet mantra
        2. Nakshatra-specific mantra
        3. Remedial mantras for challenges
        4. Daily practice mantra
        5. Mantra pronunciation guide
        6. Benefits and timing for chanting
        """

        mantras = openai_service.generate_prediction(prompt, birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'mantras': mantras,
                'nakshatra': birth_chart['nakshatra'],
                'current_dasha': birth_chart['dasha_period']['maha_dasha']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/gemstones', methods=['POST'])
def gemstone_therapy():
    """Get gemstone therapy recommendations"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Recommend therapeutic gemstones:
        - Ascendant: {birth_chart['ascendant']}
        - Moon Sign: {birth_chart['moon_sign']}
        - Weak planets needing support
        - Strong planets for enhancement

        Provide:
        1. Primary gemstone for ascendant
        2. Secondary gemstone for moon
        3. Remedial gemstones for challenges
        4. Metal settings and specifications
        5. Wearing day and finger
        6. Mantra for energizing gemstone
        """

        gemstones = openai_service.generate_prediction(prompt, birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'gemstone_therapy': gemstones,
                'ascendant': birth_chart['ascendant'],
                'moon_sign': birth_chart['moon_sign']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/rituals', methods=['POST'])
def ritual_recommendations():
    """Get ritual and puja recommendations"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Recommend Vedic rituals and pujas:
        - Nakshatra Lord: {birth_chart['nakshatra_lord']}
        - Dasha Lord: {birth_chart['dasha_period']['maha_dasha']}
        - Planetary afflictions

        Suggest:
        1. Daily puja and worship
        2. Special ceremonies for challenges
        3. Homam/Havan recommendations
        4. Deity worship guidance
        5. Festival observances
        6. Pilgrimage sites
        """

        rituals = openai_service.generate_prediction(prompt, birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'ritual_recommendations': rituals,
                'nakshatra_lord': birth_chart['nakshatra_lord'],
                'dasha_lord': birth_chart['dasha_period']['maha_dasha']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/charitable-acts', methods=['POST'])
def charitable_acts():
    """Get dana (charitable) recommendations"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Recommend charitable acts (dana):
        - Saturn (Karmic balance): {birth_chart['planets']['Saturn']['sign']}
        - Jupiter (Blessings): {birth_chart['planets']['Jupiter']['sign']}
        - Challenging planets

        Suggest:
        1. Weekly charitable activities
        2. Items to donate for specific planets
        3. Beneficiaries (poor, animals, temples)
        4. Timing for maximum benefit
        5. Karmic debt clearing through service
        """

        charity = openai_service.generate_prediction(prompt, birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'charitable_recommendations': charity,
                'saturn_position': birth_chart['planets']['Saturn'],
                'jupiter_position': birth_chart['planets']['Jupiter']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/lifestyle-modifications', methods=['POST'])
def lifestyle_modifications():
    """Get lifestyle and dietary recommendations"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Recommend lifestyle modifications:
        - Element: {birth_chart['element']}
        - Ascendant: {birth_chart['ascendant']}
        - Moon Sign: {birth_chart['moon_sign']}

        Provide:
        1. Ayurvedic dietary guidelines
        2. Daily routine (Dinacharya)
        3. Sleep and rest patterns
        4. Exercise and yoga practices
        5. Color therapy
        6. Direction and spatial guidance
        """

        lifestyle = openai_service.generate_prediction(prompt, birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'lifestyle_recommendations': lifestyle,
                'element': birth_chart['element'],
                'ascendant': birth_chart['ascendant']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/meditation-practices', methods=['POST'])
def meditation_practices():
    """Get personalized meditation practices"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Recommend meditation practices:
        - Nakshatra: {birth_chart['nakshatra']}
        - Moon Sign: {birth_chart['moon_sign']}
        - 9th House (Spirituality): {birth_chart['houses'][8]}

        Suggest:
        1. Suitable meditation techniques
        2. Pranayama practices
        3. Chakra focus areas
        4. Visualization practices
        5. Timing for meditation
        6. Duration and frequency
        """

        meditation = openai_service.generate_prediction(prompt, birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'meditation_practices': meditation,
                'nakshatra': birth_chart['nakshatra'],
                'moon_sign': birth_chart['moon_sign']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/yantra-recommendations', methods=['POST'])
def yantra_recommendations():
    """Get yantra and sacred geometry recommendations"""
    try:
        data = request.get_json()
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        )

        prompt = f"""
        Recommend yantras:
        - Primary planet needs
        - Current Dasha: {birth_chart['dasha_period']['maha_dasha']}
        - Specific life challenges

        Provide:
        1. Primary yantra for overall harmony
        2. Specific yantras for challenges
        3. Placement and energizing methods
        4. Worship timing and mantras
        5. Materials and specifications
        """

        yantras = openai_service.generate_prediction(prompt, birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'yantra_recommendations': yantras,
                'current_dasha': birth_chart['dasha_period']['maha_dasha']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

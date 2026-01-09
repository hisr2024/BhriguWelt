"""
Karmic Remedies API Routes
Personalized remedies and spiritual practices
"""
from flask import Blueprint, request
from services.astrology_calculator import astrology_calculator
from services.openai_service import openai_service
from utils.response_formatter import prediction_response, prediction_error_response
from utils.logger import setup_logger, log_exception

bp = Blueprint('karmic_remedies', __name__, url_prefix='/api/karmic-remedies')
logger = setup_logger(__name__)

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

        return prediction_response(
            {
                'birth_chart': birth_chart,
                'remedies': remedies
            },
            metadata={
                'challenges': challenges,
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
            }
        )

    except Exception as e:
        log_exception(logger, e, context="karmic_remedies.comprehensive")
        return prediction_error_response(
            "Failed to generate comprehensive remedies. Please try again later.",
            500
        )

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

        mantras_result = openai_service.generate_prediction(prompt, birth_chart, return_metadata=True)

        return prediction_response(
            {
                'mantras': mantras,
                'nakshatra': birth_chart['nakshatra'],
                'current_dasha': birth_chart['dasha_period']['maha_dasha']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
            }
        )

    except Exception as e:
        log_exception(logger, e, context="karmic_remedies.mantras")
        return prediction_error_response(
            "Failed to generate mantra recommendations. Please try again later.",
            500
        )

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

        gemstones_result = openai_service.generate_prediction(prompt, birth_chart, return_metadata=True)

        return prediction_response(
            {
                'gemstone_therapy': gemstones,
                'ascendant': birth_chart['ascendant'],
                'moon_sign': birth_chart['moon_sign']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
            }
        )

    except Exception as e:
        log_exception(logger, e, context="karmic_remedies.gemstones")
        return prediction_error_response(
            "Failed to generate gemstone recommendations. Please try again later.",
            500
        )

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

        rituals_result = openai_service.generate_prediction(prompt, birth_chart, return_metadata=True)

        return prediction_response(
            {
                'ritual_recommendations': rituals,
                'nakshatra_lord': birth_chart['nakshatra_lord'],
                'dasha_lord': birth_chart['dasha_period']['maha_dasha']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
            }
        )

    except Exception as e:
        log_exception(logger, e, context="karmic_remedies.rituals")
        return prediction_error_response(
            "Failed to generate ritual recommendations. Please try again later.",
            500
        )

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

        charity_result = openai_service.generate_prediction(prompt, birth_chart, return_metadata=True)

        return prediction_response(
            {
                'charitable_recommendations': charity,
                'saturn_position': birth_chart['planets']['Saturn'],
                'jupiter_position': birth_chart['planets']['Jupiter']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
            }
        )

    except Exception as e:
        log_exception(logger, e, context="karmic_remedies.charitable")
        return prediction_error_response(
            "Failed to generate charitable recommendations. Please try again later.",
            500
        )

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

        lifestyle_result = openai_service.generate_prediction(prompt, birth_chart, return_metadata=True)

        return prediction_response(
            {
                'lifestyle_recommendations': lifestyle,
                'element': birth_chart['element'],
                'ascendant': birth_chart['ascendant']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
            }
        )

    except Exception as e:
        log_exception(logger, e, context="karmic_remedies.lifestyle")
        return prediction_error_response(
            "Failed to generate lifestyle recommendations. Please try again later.",
            500
        )

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

        meditation_result = openai_service.generate_prediction(prompt, birth_chart, return_metadata=True)

        return prediction_response(
            {
                'meditation_practices': meditation,
                'nakshatra': birth_chart['nakshatra'],
                'moon_sign': birth_chart['moon_sign']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
            }
        )

    except Exception as e:
        log_exception(logger, e, context="karmic_remedies.meditation")
        return prediction_error_response(
            "Failed to generate meditation practices. Please try again later.",
            500
        )

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

        yantras_result = openai_service.generate_prediction(prompt, birth_chart, return_metadata=True)

        return prediction_response(
            {
                'yantra_recommendations': yantras,
                'current_dasha': birth_chart['dasha_period']['maha_dasha']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
            }
        )

    except Exception as e:
        log_exception(logger, e, context="karmic_remedies.yantra")
        return prediction_error_response(
            "Failed to generate yantra recommendations. Please try again later.",
            500
        )

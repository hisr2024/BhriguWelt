"""
Karmic Remedies API Routes
Personalized remedies and spiritual practices
"""
from flask import Blueprint, request
from services.astrology_calculator import astrology_calculator
from services.prediction_orchestrator import get_prediction_orchestrator
from utils.client_status import parse_client_online
from utils.response_formatter import prediction_response, prediction_error_response

bp = Blueprint('karmic_remedies', __name__, url_prefix='/api/karmic-remedies')
orchestrator = get_prediction_orchestrator()

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

        challenges = data.get('challenges', [])
        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='karmic_remedies',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            challenges=challenges
        )
        remedies = result.get('prediction', result)

        return prediction_response(
            {
                'birth_chart': birth_chart,
                'remedies': remedies
            },
            metadata={
                'challenges': challenges,
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate comprehensive remedies: {str(e)}", 500)

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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        mantras_result = orchestrator.generate_prediction(
            category='karmic_remedies',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'mantras': mantras_result.get('prediction', mantras_result),
                'nakshatra': birth_chart['nakshatra'],
                'current_dasha': birth_chart['dasha_period']['maha_dasha']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': mantras_result.get('mode', mode)
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate mantra recommendations: {str(e)}", 500)

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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        gemstones_result = orchestrator.generate_prediction(
            category='karmic_remedies',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'gemstone_therapy': gemstones_result.get('prediction', gemstones_result),
                'ascendant': birth_chart['ascendant'],
                'moon_sign': birth_chart['moon_sign']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': gemstones_result.get('mode', mode)
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate gemstone recommendations: {str(e)}", 500)

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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        rituals_result = orchestrator.generate_prediction(
            category='karmic_remedies',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'ritual_recommendations': rituals_result.get('prediction', rituals_result),
                'nakshatra_lord': birth_chart['nakshatra_lord'],
                'dasha_lord': birth_chart['dasha_period']['maha_dasha']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': rituals_result.get('mode', mode)
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate ritual recommendations: {str(e)}", 500)

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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        charity_result = orchestrator.generate_prediction(
            category='karmic_remedies',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'charitable_recommendations': charity_result.get('prediction', charity_result),
                'saturn_position': birth_chart['planets']['Saturn'],
                'jupiter_position': birth_chart['planets']['Jupiter']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': charity_result.get('mode', mode)
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate charitable recommendations: {str(e)}", 500)

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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        lifestyle_result = orchestrator.generate_prediction(
            category='karmic_remedies',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'lifestyle_recommendations': lifestyle_result.get('prediction', lifestyle_result),
                'element': birth_chart['element'],
                'ascendant': birth_chart['ascendant']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': lifestyle_result.get('mode', mode)
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate lifestyle recommendations: {str(e)}", 500)

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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        meditation_result = orchestrator.generate_prediction(
            category='karmic_remedies',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'meditation_practices': meditation_result.get('prediction', meditation_result),
                'nakshatra': birth_chart['nakshatra'],
                'moon_sign': birth_chart['moon_sign']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': meditation_result.get('mode', mode)
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate meditation practices: {str(e)}", 500)

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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        yantras_result = orchestrator.generate_prediction(
            category='karmic_remedies',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'yantra_recommendations': yantras_result.get('prediction', yantras_result),
                'current_dasha': birth_chart['dasha_period']['maha_dasha']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': yantras_result.get('mode', mode)
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate yantra recommendations: {str(e)}", 500)

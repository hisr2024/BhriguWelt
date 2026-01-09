"""
Karmic Journey API Routes
Soul journey and karmic analysis endpoints
"""
from flask import Blueprint, request
from services.astrology_calculator import astrology_calculator
from services.prediction_orchestrator import get_prediction_orchestrator
from utils.client_status import parse_client_online
from utils.response_formatter import prediction_response, prediction_error_response

bp = Blueprint('karmic_journey', __name__, url_prefix='/api/karmic-journey')
orchestrator = get_prediction_orchestrator()

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
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='karmic_journey',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online
        )
        karmic_analysis = result.get('prediction', result)

        return prediction_response(
            {
                'birth_chart': birth_chart,
                'karmic_journey': karmic_analysis
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate karmic journey analysis: {str(e)}", 500)

@bp.route('/soul-purpose', methods=['POST'])
def soul_purpose():
    """Discover soul's purpose in this lifetime"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        analysis_result = orchestrator.generate_prediction(
            category='karmic_journey',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'soul_purpose': analysis_result.get('prediction', analysis_result),
                'dharmic_path': birth_chart['planets']['Rahu']['sign']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': analysis_result.get('mode', mode)
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate soul purpose: {str(e)}", 500)

@bp.route('/karmic-lessons', methods=['POST'])
def karmic_lessons():
    """Get karmic lessons for this lifetime"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        lessons_result = orchestrator.generate_prediction(
            category='karmic_journey',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'karmic_lessons': lessons_result.get('prediction', lessons_result),
                'karmic_number': birth_chart['karmic_number'],
                'south_node': birth_chart['planets']['Ketu']['sign']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': lessons_result.get('mode', mode)
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate karmic lessons: {str(e)}", 500)

@bp.route('/soul-evolution', methods=['POST'])
def soul_evolution():
    """Track soul evolution and spiritual development"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        evolution_result = orchestrator.generate_prediction(
            category='karmic_journey',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'soul_evolution': evolution_result.get('prediction', evolution_result),
                'spiritual_teacher': birth_chart['planets']['Jupiter']['sign'],
                'emotional_evolution': birth_chart['planets']['Moon']['sign']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': evolution_result.get('mode', mode)
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate soul evolution: {str(e)}", 500)

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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        dharma_result = orchestrator.generate_prediction(
            category='karmic_journey',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'dharmic_path': dharma_result.get('prediction', dharma_result),
                'career_house': birth_chart['houses'][9],
                'dharma_planet': birth_chart['planets']['Jupiter']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': dharma_result.get('mode', mode)
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate dharmic path: {str(e)}", 500)

"""
Future Lives API Routes
Future incarnation predictions and soul evolution
"""
from flask import Blueprint, request
from services.astrology_calculator import get_astrology_calculator, get_astrology_dependency_error
from services.prediction_orchestrator import get_prediction_orchestrator
from utils.client_status import parse_client_online
from utils.astrology_helpers import dependency_error_response, get_cached_birth_data, handle_birth_chart_error
from utils.response_formatter import prediction_response, prediction_error_response
from utils.validators import sanitize_input
from utils.logger import setup_logger, log_exception

bp = Blueprint('future_lives', __name__, url_prefix='/api/future-lives')
orchestrator = get_prediction_orchestrator()
logger = setup_logger(__name__)

@bp.route('/prediction', methods=['POST'])
def future_lives_prediction():
    """
    Generate future lives prediction based on current karmic trajectory

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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='future_lives',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online
        )
        future_prediction = result.get('prediction', result)

        return prediction_response(
            {
                'birth_chart': birth_chart,
                'future_lives_prediction': future_prediction
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="future_lives.prediction")
        return prediction_error_response(
            "Failed to generate future lives prediction. Please try again later.",
            500
        )

@bp.route('/evolution-path', methods=['POST'])
def evolution_path():
    """Map soul evolution path across future incarnations"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Map soul evolution path for future lives:
        - North Node (Rahu): {birth_chart['planets']['Rahu']['sign']}
        - Jupiter (Growth): {birth_chart['planets']['Jupiter']['sign']}
        - Sun (Soul essence): {birth_chart['zodiac_sign']}

        Predict:
        1. Next 3-5 incarnation scenarios
        2. Soul evolution milestones
        3. Consciousness expansion levels
        4. Future spiritual roles and missions
        5. Timeline to higher dimensional existence
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='future_lives',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )
        evolution = result.get('prediction', result)

        return prediction_response(
            {
                'evolution_path': evolution,
                'north_node': birth_chart['planets']['Rahu'],
                'soul_essence': birth_chart['zodiac_sign']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="future_lives.evolution_path")
        return prediction_error_response(
            "Failed to generate evolution path. Please try again later.",
            500
        )

@bp.route('/moksha-timeline', methods=['POST'])
def moksha_timeline():
    """Calculate timeline to liberation (moksha)"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Calculate path to moksha (liberation):
        - Jupiter (Spiritual wisdom): {birth_chart['planets']['Jupiter']['sign']}
        - 12th House (Moksha): {birth_chart['houses'][11]}
        - Nakshatra: {birth_chart['nakshatra']}

        Determine:
        1. Number of lifetimes to liberation
        2. Current progress toward moksha
        3. Key spiritual milestones ahead
        4. Practices to accelerate liberation
        5. Signs of approaching enlightenment
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='future_lives',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )
        moksha = result.get('prediction', result)

        return prediction_response(
            {
                'moksha_timeline': moksha,
                'moksha_house': birth_chart['houses'][11],
                'spiritual_guide': birth_chart['planets']['Jupiter']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="future_lives.moksha_timeline")
        return prediction_error_response(
            "Failed to generate moksha timeline. Please try again later.",
            500
        )

@bp.route('/future-missions', methods=['POST'])
def future_missions():
    """Identify future life missions and purposes"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Predict future life missions:
        - North Node (Future direction): {birth_chart['planets']['Rahu']['sign']}
        - 10th House (Purpose): {birth_chart['houses'][9]}
        - Sun (Life force): {birth_chart['zodiac_sign']}

        Envision:
        1. Future incarnation purposes
        2. Service missions for humanity
        3. Teaching and leadership roles
        4. Planetary and cosmic responsibilities
        5. Role in collective evolution
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='future_lives',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )
        missions = result.get('prediction', result)

        return prediction_response(
            {
                'future_missions': missions,
                'destiny_point': birth_chart['planets']['Rahu'],
                'purpose_house': birth_chart['houses'][9]
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="future_lives.future_missions")
        return prediction_error_response(
            "Failed to generate future missions. Please try again later.",
            500
        )

@bp.route('/soul-advancement', methods=['POST'])
def soul_advancement():
    """Assess soul advancement opportunities"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Assess soul advancement potential:
        - Current Nakshatra: {birth_chart['nakshatra']}
        - Jupiter position: {birth_chart['planets']['Jupiter']['sign']}
        - 9th House (Higher learning): {birth_chart['houses'][8]}

        Evaluate:
        1. Current soul development stage
        2. Opportunities for rapid advancement
        3. Initiations and upgrades available
        4. Teachers and guides in future lives
        5. Ascension pathway and timeline
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='future_lives',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )
        advancement = result.get('prediction', result)

        return prediction_response(
            {
                'soul_advancement': advancement,
                'current_nakshatra': birth_chart['nakshatra'],
                'higher_learning_house': birth_chart['houses'][8]
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="future_lives.soul_advancement")
        return prediction_error_response(
            "Failed to generate soul advancement. Please try again later.",
            500
        )


def _get_birth_chart(data):
    if not isinstance(data, dict):
        return None, prediction_error_response("Invalid request payload.", 400)

    required_fields = ['date_of_birth', 'time_of_birth', 'place_of_birth']
    for field in required_fields:
        if not data.get(field):
            return None, prediction_error_response(
                f"Missing required field: {field}",
                400
            )

    calculator = get_astrology_calculator()
    cached_birth_data = get_cached_birth_data(data)
    if not calculator and not cached_birth_data:
        return None, dependency_error_response(get_astrology_dependency_error())

    if calculator:
        try:
            birth_chart = calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=data['place_of_birth'],
                latitude=data.get('latitude'),
                longitude=data.get('longitude'),
                timezone_override=sanitize_input(data['timezone'], max_length=64)
                if data.get('timezone') else None
            )
        except Exception as exc:
            log_exception(logger, exc, context="future_lives.birth_chart")
            return None, prediction_error_response(
                "Failed to calculate birth chart.",
                500
            )

        error_response_tuple = handle_birth_chart_error(birth_chart)
        if error_response_tuple:
            return None, error_response_tuple
        return birth_chart, None

    return cached_birth_data, None

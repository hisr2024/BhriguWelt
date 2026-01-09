"""
Past Lives API Routes
Past life analysis and regression endpoints
"""
from flask import Blueprint, request
from services.astrology_calculator import astrology_calculator
from services.prediction_orchestrator import get_prediction_orchestrator
from utils.client_status import parse_client_online
from utils.response_formatter import prediction_response, prediction_error_response
from utils.validators import sanitize_input

bp = Blueprint('past_lives', __name__, url_prefix='/api/past-lives')
orchestrator = get_prediction_orchestrator()

@bp.route('/analysis', methods=['POST'])
def past_lives_analysis():
    """
    Generate comprehensive past lives analysis

    Request JSON:
    {
        "date_of_birth": "1990-01-15",
        "time_of_birth": "14:30",
        "place_of_birth": "New Delhi, India"
    }
    """
    try:
        data = request.get_json()

        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='past_lives',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online
        )
        past_lives = result.get('prediction', result)

        return prediction_response(
            {
                'birth_chart': birth_chart,
                'past_lives_analysis': past_lives
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="past_lives.analysis")
        return prediction_error_response(
            "Failed to generate past lives analysis. Please try again later.",
            500
        )

@bp.route('/karmic-patterns', methods=['POST'])
def karmic_patterns():
    """Identify karmic patterns from past lives"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Identify karmic patterns from past lives based on:
        - South Node (Ketu): {birth_chart['planets']['Ketu']['sign']}
        - 12th House (Past Life): {birth_chart['houses'][11]}
        - Saturn (Karmic teacher): {birth_chart['planets']['Saturn']['sign']}

        Reveal:
        1. Recurring relationship patterns
        2. Career and financial patterns
        3. Health and wellbeing patterns
        4. Spiritual development patterns
        5. Unfinished business from past lives
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        patterns_result = orchestrator.generate_prediction(
            category='past_lives',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'karmic_patterns': patterns_result.get('prediction', patterns_result),
                'ketu_position': birth_chart['planets']['Ketu'],
                'past_life_house': birth_chart['houses'][11]
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': patterns_result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="past_lives.karmic_patterns")
        return prediction_error_response(
            "Failed to generate karmic patterns. Please try again later.",
            500
        )

@bp.route('/past-relationships', methods=['POST'])
def past_relationships():
    """Explore past life relationships affecting current life"""
    try:
        data = request.get_json()
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Analyze past life relationships for:
        - Venus (Relationships): {birth_chart['planets']['Venus']['sign']}
        - South Node (Ketu): {birth_chart['planets']['Ketu']['sign']}
        - 7th House (Partnerships): {birth_chart['houses'][6]}

        Explore:
        1. Soul mate connections from past lives
        2. Karmic relationships requiring resolution
        3. Family members from previous incarnations
        4. Soul group members in current life
        5. Lessons through relationships
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        relationships_result = orchestrator.generate_prediction(
            category='past_lives',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'past_relationships': relationships_result.get('prediction', relationships_result),
                'venus_position': birth_chart['planets']['Venus'],
                'partnership_house': birth_chart['houses'][6]
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': relationships_result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="past_lives.past_relationships")
        return prediction_error_response(
            "Failed to generate past relationships. Please try again later.",
            500
        )

@bp.route('/talents-carried-forward', methods=['POST'])
def talents_carried_forward():
    """Identify talents and skills from past lives"""
    try:
        data = request.get_json()
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth'],
            timezone_override=sanitize_input(data['timezone'], max_length=64)
            if data.get('timezone') else None
        )

        prompt = f"""
        Identify innate talents from past lives:
        - Mercury (Skills): {birth_chart['planets']['Mercury']['sign']}
        - 5th House (Creativity): {birth_chart['houses'][4]}
        - Jupiter (Wisdom): {birth_chart['planets']['Jupiter']['sign']}

        Reveal:
        1. Natural talents and abilities
        2. Skills mastered in past lives
        3. Creative gifts inherited
        4. Wisdom and knowledge retained
        5. How to activate these talents
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        talents_result = orchestrator.generate_prediction(
            category='past_lives',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'talents': talents_result.get('prediction', talents_result),
                'mercury_position': birth_chart['planets']['Mercury'],
                'creativity_house': birth_chart['houses'][4]
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': talents_result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="past_lives.talents_carried_forward")
        return prediction_error_response(
            "Failed to generate talents carried forward. Please try again later.",
            500
        )

@bp.route('/past-traumas', methods=['POST'])
def past_traumas():
    """Identify past life traumas requiring healing"""
    try:
        data = request.get_json()
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth'],
            timezone_override=sanitize_input(data['timezone'], max_length=64)
            if data.get('timezone') else None
        )

        prompt = f"""
        Identify past life traumas and provide healing guidance:
        - Saturn (Karmic lessons): {birth_chart['planets']['Saturn']['sign']}
        - 8th House (Transformation): {birth_chart['houses'][7]}
        - South Node (Ketu): {birth_chart['planets']['Ketu']['sign']}

        Address:
        1. Past life traumas affecting current life
        2. Deep-seated fears and phobias
        3. Unexplained emotional patterns
        4. Healing modalities for release
        5. Steps toward karmic healing
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        traumas_result = orchestrator.generate_prediction(
            category='past_lives',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'past_traumas': traumas_result.get('prediction', traumas_result),
                'saturn_position': birth_chart['planets']['Saturn'],
                'transformation_house': birth_chart['houses'][7]
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': traumas_result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="past_lives.past_traumas")
        return prediction_error_response(
            "Failed to generate past traumas. Please try again later.",
            500
        )

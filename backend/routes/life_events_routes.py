"""
Life Events API Routes
Important life events prediction endpoints
"""
from datetime import datetime

from flask import Blueprint, request
from services.astrology_calculator import get_astrology_calculator, get_astrology_dependency_error
from services.prediction_orchestrator import get_prediction_orchestrator
from utils.astrology_helpers import dependency_error_response, get_cached_birth_data, handle_birth_chart_error
from utils.client_status import parse_client_online
from utils.logger import log_exception, setup_logger
from utils.response_formatter import prediction_response, prediction_error_response
from utils.validators import sanitize_input, validate_birth_details

bp = Blueprint('life_events', __name__, url_prefix='/api/life-events')
orchestrator = get_prediction_orchestrator()
logger = setup_logger(__name__)


@bp.errorhandler(405)
def method_not_allowed(error):
    """Handle invalid method calls for life events endpoints."""
    logger.warning("Method not allowed: %s %s", request.method, request.path)
    return prediction_error_response(
        "Method not allowed. Please use POST for this endpoint.",
        405
    )


def _get_request_payload():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        logger.warning("Missing or invalid JSON payload for %s", request.path)
        return None, prediction_error_response(
            "Request body must be a valid JSON object.",
            400
        )
    return data, None


def _get_birth_chart(data):
    is_valid, error = validate_birth_details(data)
    if not is_valid:
        logger.warning("Invalid birth details for %s: %s", request.path, error)
        return None, prediction_error_response(error, 400)

    calculator = get_astrology_calculator()
    cached_birth_data = get_cached_birth_data(data)
    if not calculator and not cached_birth_data:
        return None, dependency_error_response(get_astrology_dependency_error())

    if calculator:
        birth_chart = calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth'],
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            timezone_override=sanitize_input(data['timezone'], max_length=64)
            if data.get('timezone') else None
        )

        error_response_tuple = handle_birth_chart_error(birth_chart)
        if error_response_tuple:
            return None, error_response_tuple
    else:
        logger.warning("Astrology calculator unavailable; using cached birth data.")
        birth_chart = cached_birth_data

    return birth_chart, None

@bp.route('/prediction', methods=['POST'])
def life_events_prediction():
    """
    Predict important life events

    Request JSON:
    {
        "date_of_birth": "1990-01-15",
        "time_of_birth": "14:30",
        "place_of_birth": "New Delhi, India",
        "years_ahead": 10  // optional, default 10
    }
    """
    try:
        data, error = _get_request_payload()
        if error:
            return error
        years_ahead = data.get('years_ahead', 10)

        # Calculate birth chart
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='life_events',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            years_ahead=years_ahead
        )
        events = result.get('prediction', result)

        return prediction_response(
            {
                'birth_chart': birth_chart,
                'life_events': events
            },
            metadata={
                'years_ahead': years_ahead,
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="life_events.prediction")
        return prediction_error_response(
            "Failed to generate life events prediction. Please try again later.",
            500
        )

@bp.route('/career-milestones', methods=['POST'])
def career_milestones():
    """Predict career milestones and transitions"""
    try:
        data, error = _get_request_payload()
        if error:
            return error
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Predict career milestones:
        - 10th House: {birth_chart['houses'][9]}
        - Sun: {birth_chart['zodiac_sign']}
        - Current Dasha: {birth_chart['dasha_period']['maha_dasha']}

        Forecast:
        1. Promotion and advancement timing
        2. Career changes and transitions
        3. Business opportunities
        4. Professional recognition
        5. Income increases
        6. Leadership positions
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        milestones_result = orchestrator.generate_prediction(
            category='life_events',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'career_milestones': milestones_result.get('prediction', milestones_result),
                'career_house': birth_chart['houses'][9]
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': milestones_result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="life_events.career_milestones")
        return prediction_error_response(
            "Failed to generate career milestones. Please try again later.",
            500
        )

@bp.route('/relationship-events', methods=['POST'])
def relationship_events():
    """Predict relationship and marriage events"""
    try:
        data, error = _get_request_payload()
        if error:
            return error
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Predict relationship events:
        - 7th House: {birth_chart['houses'][6]}
        - Venus: {birth_chart['planets']['Venus']['sign']}
        - Jupiter: {birth_chart['planets']['Jupiter']['sign']}

        Timeline for:
        1. Meeting significant partner
        2. Marriage timing
        3. Relationship challenges
        4. Children and family expansion
        5. Partnership opportunities
        6. Reconciliation or separation
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        events_result = orchestrator.generate_prediction(
            category='life_events',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'relationship_events': events_result.get('prediction', events_result),
                'partnership_house': birth_chart['houses'][6],
                'venus_position': birth_chart['planets']['Venus']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': events_result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="life_events.relationship_events")
        return prediction_error_response(
            "Failed to generate relationship events. Please try again later.",
            500
        )

@bp.route('/financial-events', methods=['POST'])
def financial_events():
    """Predict major financial events"""
    try:
        data, error = _get_request_payload()
        if error:
            return error
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Predict financial events:
        - 2nd House: {birth_chart['houses'][1]}
        - 11th House: {birth_chart['houses'][10]}
        - Jupiter: {birth_chart['planets']['Jupiter']['sign']}

        Forecast:
        1. Major income increases
        2. Investment opportunities
        3. Property acquisition
        4. Financial windfalls
        5. Debt resolution
        6. Business expansion
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        events_result = orchestrator.generate_prediction(
            category='life_events',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'financial_events': events_result.get('prediction', events_result),
                'wealth_house': birth_chart['houses'][1],
                'gains_house': birth_chart['houses'][10]
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': events_result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="life_events.financial_events")
        return prediction_error_response(
            "Failed to generate financial events. Please try again later.",
            500
        )

@bp.route('/health-alerts', methods=['POST'])
def health_alerts():
    """Get health alerts and wellness periods"""
    try:
        data, error = _get_request_payload()
        if error:
            return error
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Predict health periods:
        - 6th House: {birth_chart['houses'][5]}
        - 8th House: {birth_chart['houses'][7]}
        - Saturn: {birth_chart['planets']['Saturn']['sign']}

        Alert for:
        1. Periods requiring health caution
        2. Times of peak vitality
        3. Preventive care timing
        4. Recovery and healing periods
        5. Mental health considerations
        6. Energy management cycles
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        alerts_result = orchestrator.generate_prediction(
            category='life_events',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'health_alerts': alerts_result.get('prediction', alerts_result),
                'health_house': birth_chart['houses'][5],
                'saturn_position': birth_chart['planets']['Saturn']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': alerts_result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="life_events.health_alerts")
        return prediction_error_response(
            "Failed to generate health alerts. Please try again later.",
            500
        )

@bp.route('/spiritual-breakthroughs', methods=['POST'])
def spiritual_breakthroughs():
    """Predict spiritual breakthroughs and initiations"""
    try:
        data, error = _get_request_payload()
        if error:
            return error
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Predict spiritual events:
        - 9th House: {birth_chart['houses'][8]}
        - 12th House: {birth_chart['houses'][11]}
        - Jupiter: {birth_chart['planets']['Jupiter']['sign']}

        Timeline for:
        1. Spiritual awakenings
        2. Meeting spiritual teachers
        3. Initiations and upgrades
        4. Pilgrimage opportunities
        5. Meditation breakthroughs
        6. Consciousness expansion
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        breakthroughs_result = orchestrator.generate_prediction(
            category='life_events',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'spiritual_breakthroughs': breakthroughs_result.get('prediction', breakthroughs_result),
                'dharma_house': birth_chart['houses'][8],
                'liberation_house': birth_chart['houses'][11]
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': breakthroughs_result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="life_events.spiritual_breakthroughs")
        return prediction_error_response(
            "Failed to generate spiritual breakthroughs. Please try again later.",
            500
        )

@bp.route('/auspicious-timings', methods=['POST'])
def auspicious_timings():
    """Get auspicious timings for major decisions"""
    try:
        data, error = _get_request_payload()
        if error:
            return error
        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Identify auspicious periods for:
        - Jupiter: {birth_chart['planets']['Jupiter']['sign']}
        - Venus: {birth_chart['planets']['Venus']['sign']}
        - Current Dasha: {birth_chart['dasha_period']['maha_dasha']}

        Best timing for:
        1. Starting new business
        2. Marriage and partnerships
        3. Property purchase
        4. Education and learning
        5. Travel and relocation
        6. Major investments
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        timings_result = orchestrator.generate_prediction(
            category='life_events',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )

        return prediction_response(
            {
                'auspicious_timings': timings_result.get('prediction', timings_result),
                'jupiter_position': birth_chart['planets']['Jupiter'],
                'current_dasha': birth_chart['dasha_period']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': timings_result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="life_events.auspicious_timings")
        return prediction_error_response(
            "Failed to generate auspicious timings. Please try again later.",
            500
        )


@bp.route('/varshaphal', methods=['POST'])
def varshaphal():
    """Generate Varshaphal (annual) insights"""
    try:
        data, error = _get_request_payload()
        if error:
            return error

        year_value = data.get('year', datetime.utcnow().year)
        try:
            year = int(year_value)
        except (TypeError, ValueError):
            logger.warning("Invalid year provided for varshaphal: %s", year_value)
            return prediction_error_response(
                "Year must be a valid integer.",
                400
            )

        max_year = datetime.utcnow().year + 10
        if year < 1900 or year > max_year:
            logger.warning("Out-of-range year for varshaphal: %s", year)
            return prediction_error_response(
                f"Year must be between 1900 and {max_year}.",
                400
            )

        birth_chart, error = _get_birth_chart(data)
        if error:
            return error

        prompt = f"""
        Provide Varshaphal (annual) forecast for {year}:
        - Zodiac: {birth_chart['zodiac_sign']}
        - Nakshatra: {birth_chart['nakshatra']}
        - Current Dasha: {birth_chart['dasha_period']['maha_dasha']}

        Include:
        1. Major themes for the year
        2. Career and financial growth
        3. Relationships and family matters
        4. Health and wellness focus
        5. Spiritual growth opportunities
        6. Key months and timing highlights
        """

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='life_events',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )
        prediction = result.get('prediction', result)

        return prediction_response(
            {
                'year': year,
                'varshaphal': prediction
            },
            metadata={
                'year': year,
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="life_events.varshaphal")
        return prediction_error_response(
            "Failed to generate Varshaphal insights. Please try again later.",
            500
        )

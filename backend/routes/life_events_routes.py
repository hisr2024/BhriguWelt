"""
Life Events API Routes
Important life events prediction endpoints
"""
from flask import Blueprint, request
from services.astrology_calculator import astrology_calculator
from services.prediction_orchestrator import get_prediction_orchestrator
from utils.client_status import parse_client_online
from utils.response_formatter import prediction_response, prediction_error_response

bp = Blueprint('life_events', __name__, url_prefix='/api/life-events')
orchestrator = get_prediction_orchestrator()

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
        data = request.get_json()
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
        return prediction_error_response(f"Failed to generate life events prediction: {str(e)}", 500)

@bp.route('/career-milestones', methods=['POST'])
def career_milestones():
    """Predict career milestones and transitions"""
    try:
        data = request.get_json()
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
        return prediction_error_response(f"Failed to generate career milestones: {str(e)}", 500)

@bp.route('/relationship-events', methods=['POST'])
def relationship_events():
    """Predict relationship and marriage events"""
    try:
        data = request.get_json()
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
        return prediction_error_response(f"Failed to generate relationship events: {str(e)}", 500)

@bp.route('/financial-events', methods=['POST'])
def financial_events():
    """Predict major financial events"""
    try:
        data = request.get_json()
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
        return prediction_error_response(f"Failed to generate financial events: {str(e)}", 500)

@bp.route('/health-alerts', methods=['POST'])
def health_alerts():
    """Get health alerts and wellness periods"""
    try:
        data = request.get_json()
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
        return prediction_error_response(f"Failed to generate health alerts: {str(e)}", 500)

@bp.route('/spiritual-breakthroughs', methods=['POST'])
def spiritual_breakthroughs():
    """Predict spiritual breakthroughs and initiations"""
    try:
        data = request.get_json()
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
        return prediction_error_response(f"Failed to generate spiritual breakthroughs: {str(e)}", 500)

@bp.route('/auspicious-timings', methods=['POST'])
def auspicious_timings():
    """Get auspicious timings for major decisions"""
    try:
        data = request.get_json()
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        )

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
        return prediction_error_response(f"Failed to generate auspicious timings: {str(e)}", 500)

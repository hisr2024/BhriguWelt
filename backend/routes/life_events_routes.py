"""
Life Events API Routes
Important life events prediction endpoints
"""
from flask import Blueprint, request
from services.astrology_calculator import astrology_calculator
from services.openai_service import openai_service
from utils.response_formatter import prediction_response, prediction_error_response
from utils.validators import sanitize_input

bp = Blueprint('life_events', __name__, url_prefix='/api/life-events')

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

        # Generate life events prediction
        events = openai_service.generate_life_events_prediction(birth_chart, years_ahead)

        return prediction_response(
            {
                'birth_chart': birth_chart,
                'life_events': events
            },
            metadata={
                'years_ahead': years_ahead,
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
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

        milestones_result = openai_service.generate_prediction(prompt, birth_chart, return_metadata=True)

        return prediction_response(
            {
                'career_milestones': milestones,
                'career_house': birth_chart['houses'][9]
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
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

        events_result = openai_service.generate_prediction(prompt, birth_chart, return_metadata=True)

        return prediction_response(
            {
                'relationship_events': events,
                'partnership_house': birth_chart['houses'][6],
                'venus_position': birth_chart['planets']['Venus']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
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

        events_result = openai_service.generate_prediction(prompt, birth_chart, return_metadata=True)

        return prediction_response(
            {
                'financial_events': events,
                'wealth_house': birth_chart['houses'][1],
                'gains_house': birth_chart['houses'][10]
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
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

        alerts_result = openai_service.generate_prediction(prompt, birth_chart, return_metadata=True)

        return prediction_response(
            {
                'health_alerts': alerts,
                'health_house': birth_chart['houses'][5],
                'saturn_position': birth_chart['planets']['Saturn']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
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

        breakthroughs_result = openai_service.generate_prediction(prompt, birth_chart, return_metadata=True)

        return prediction_response(
            {
                'spiritual_breakthroughs': breakthroughs,
                'dharma_house': birth_chart['houses'][8],
                'liberation_house': birth_chart['houses'][11]
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
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
            place=data['place_of_birth'],
            timezone_override=sanitize_input(data['timezone'], max_length=64)
            if data.get('timezone') else None
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

        timings_result = openai_service.generate_prediction(prompt, birth_chart, return_metadata=True)

        return prediction_response(
            {
                'auspicious_timings': timings,
                'jupiter_position': birth_chart['planets']['Jupiter'],
                'current_dasha': birth_chart['dasha_period']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate auspicious timings: {str(e)}", 500)

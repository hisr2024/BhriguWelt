"""
Present Life API Routes
Current life analysis and guidance endpoints
"""
from flask import Blueprint, request
from services.astrology_calculator import astrology_calculator
from services.prediction_orchestrator import get_prediction_orchestrator
from utils.client_status import parse_client_online
from utils.response_formatter import prediction_response, prediction_error_response
from utils.validators import sanitize_input

bp = Blueprint('present_life', __name__, url_prefix='/api/present-life')
orchestrator = get_prediction_orchestrator()

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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='present_life',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online
        )
        present_life = result.get('prediction', result)

        return prediction_response(
            {
                'birth_chart': birth_chart,
                'present_life_analysis': present_life
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="present_life.analysis")
        return prediction_error_response(
            "Failed to generate present life analysis. Please try again later.",
            500
        )

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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='present_life',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )
        career = result.get('prediction', result)

        return prediction_response(
            {
                'career_guidance': career,
                'career_house': birth_chart['houses'][9],
                'authority_sign': birth_chart['zodiac_sign']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="present_life.career_guidance")
        return prediction_error_response(
            "Failed to generate career guidance. Please try again later.",
            500
        )

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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='present_life',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )
        relationships = result.get('prediction', result)

        return prediction_response(
            {
                'relationships_analysis': relationships,
                'partnership_house': birth_chart['houses'][6],
                'venus_position': birth_chart['planets']['Venus']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="present_life.relationships")
        return prediction_error_response(
            "Failed to generate relationships analysis. Please try again later.",
            500
        )

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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='present_life',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )
        health = result.get('prediction', result)

        return prediction_response(
            {
                'health_guidance': health,
                'health_house': birth_chart['houses'][5],
                'vitality_sign': birth_chart['ascendant']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="present_life.health_guidance")
        return prediction_error_response(
            "Failed to generate health guidance. Please try again later.",
            500
        )

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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='present_life',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )
        financial = result.get('prediction', result)

        return prediction_response(
            {
                'financial_prospects': financial,
                'wealth_house': birth_chart['houses'][1],
                'prosperity_planet': birth_chart['planets']['Jupiter']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="present_life.financial_prospects")
        return prediction_error_response(
            "Failed to generate financial prospects. Please try again later.",
            500
        )

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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='present_life',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )
        spiritual = result.get('prediction', result)

        return prediction_response(
            {
                'spiritual_guidance': spiritual,
                'dharma_house': birth_chart['houses'][8],
                'wisdom_planet': birth_chart['planets']['Jupiter']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="present_life.spiritual_guidance")
        return prediction_error_response(
            "Failed to generate spiritual guidance. Please try again later.",
            500
        )

@bp.route('/current-dasha', methods=['POST'])
def current_dasha():
    """Analyze current planetary period (dasha)"""
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

        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        mode = data.get('mode', 'hybrid')
        result = orchestrator.generate_prediction(
            category='present_life',
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            prompt=prompt
        )
        dasha = result.get('prediction', result)

        return prediction_response(
            {
                'dasha_analysis': dasha,
                'current_dasha': birth_chart['dasha_period'],
                'nakshatra': birth_chart['nakshatra']
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra'),
                'mode': result.get('mode', mode)
            }
        )

    except Exception as e:
        log_exception(logger, e, context="present_life.dasha_analysis")
        return prediction_error_response(
            "Failed to generate dasha analysis. Please try again later.",
            500
        )

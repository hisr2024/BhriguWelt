"""
Past Lives API Routes
Past life analysis and regression endpoints
"""
from flask import Blueprint, request
from services.astrology_calculator import astrology_calculator
from services.openai_service import openai_service
from utils.response_formatter import prediction_response, prediction_error_response

bp = Blueprint('past_lives', __name__, url_prefix='/api/past-lives')

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

        # Generate past lives analysis
        past_lives = openai_service.generate_past_lives_analysis(birth_chart)

        return prediction_response(
            {
                'birth_chart': birth_chart,
                'past_lives_analysis': past_lives
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate past lives analysis: {str(e)}", 500)

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

        patterns_result = openai_service.generate_prediction(prompt, birth_chart, return_metadata=True)

        return prediction_response(
            {
                'karmic_patterns': patterns,
                'ketu_position': birth_chart['planets']['Ketu'],
                'past_life_house': birth_chart['houses'][11]
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate karmic patterns: {str(e)}", 500)

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

        relationships_result = openai_service.generate_prediction(prompt, birth_chart, return_metadata=True)

        return prediction_response(
            {
                'past_relationships': relationships,
                'venus_position': birth_chart['planets']['Venus'],
                'partnership_house': birth_chart['houses'][6]
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate past relationships: {str(e)}", 500)

@bp.route('/talents-carried-forward', methods=['POST'])
def talents_carried_forward():
    """Identify talents and skills from past lives"""
    try:
        data = request.get_json()
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
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

        talents_result = openai_service.generate_prediction(prompt, birth_chart, return_metadata=True)

        return prediction_response(
            {
                'talents': talents,
                'mercury_position': birth_chart['planets']['Mercury'],
                'creativity_house': birth_chart['houses'][4]
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate talents carried forward: {str(e)}", 500)

@bp.route('/past-traumas', methods=['POST'])
def past_traumas():
    """Identify past life traumas requiring healing"""
    try:
        data = request.get_json()
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
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

        traumas_result = openai_service.generate_prediction(prompt, birth_chart, return_metadata=True)

        return prediction_response(
            {
                'past_traumas': traumas,
                'saturn_position': birth_chart['planets']['Saturn'],
                'transformation_house': birth_chart['houses'][7]
            },
            metadata={
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'nakshatra': birth_chart.get('nakshatra')
            }
        )

    except Exception as e:
        return prediction_error_response(f"Failed to generate past traumas: {str(e)}", 500)

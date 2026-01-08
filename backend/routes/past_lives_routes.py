"""
Past Lives API Routes
Past life analysis and regression endpoints
"""
from flask import Blueprint, request, jsonify
from services.astrology_calculator import astrology_calculator
from services.openai_service import openai_service

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

        # Calculate birth chart
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        )

        # Generate past lives analysis
        past_lives = openai_service.generate_past_lives_analysis(birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'birth_chart': birth_chart,
                'past_lives_analysis': past_lives
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/karmic-patterns', methods=['POST'])
def karmic_patterns():
    """Identify karmic patterns from past lives"""
    try:
        data = request.get_json()
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        )

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

        return jsonify({
            'status': 'success',
            'data': {
                'karmic_patterns': patterns_result['text'],
                'ketu_position': birth_chart['planets']['Ketu'],
                'past_life_house': birth_chart['houses'][11],
                'partial': patterns_result['partial']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/past-relationships', methods=['POST'])
def past_relationships():
    """Explore past life relationships affecting current life"""
    try:
        data = request.get_json()
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        )

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

        return jsonify({
            'status': 'success',
            'data': {
                'past_relationships': relationships_result['text'],
                'venus_position': birth_chart['planets']['Venus'],
                'partnership_house': birth_chart['houses'][6],
                'partial': relationships_result['partial']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

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

        return jsonify({
            'status': 'success',
            'data': {
                'talents': talents_result['text'],
                'mercury_position': birth_chart['planets']['Mercury'],
                'creativity_house': birth_chart['houses'][4],
                'partial': talents_result['partial']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

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

        return jsonify({
            'status': 'success',
            'data': {
                'past_traumas': traumas_result['text'],
                'saturn_position': birth_chart['planets']['Saturn'],
                'transformation_house': birth_chart['houses'][7],
                'partial': traumas_result['partial']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

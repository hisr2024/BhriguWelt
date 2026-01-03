"""
Astrology API Routes
Core astrology calculation endpoints
"""
from flask import Blueprint, request, jsonify
from services.astrology_calculator import astrology_calculator
from services.sarvam_ai import sarvam_ai

bp = Blueprint('astrology', __name__, url_prefix='/api/astrology')

@bp.route('/birth-chart', methods=['POST'])
def calculate_birth_chart():
    """
    Calculate complete Vedic birth chart

    Request JSON:
    {
        "date_of_birth": "1990-01-15",
        "time_of_birth": "14:30",
        "place_of_birth": "New Delhi, India",
        "latitude": 28.6139,  // optional
        "longitude": 77.2090  // optional
    }
    """
    try:
        data = request.get_json()

        # Validate required fields
        required = ['date_of_birth', 'time_of_birth', 'place_of_birth']
        for field in required:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Calculate birth chart
        chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth'],
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )

        return jsonify({
            'status': 'success',
            'data': chart
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/zodiac-analysis', methods=['POST'])
def zodiac_analysis():
    """Get detailed zodiac sign analysis"""
    try:
        data = request.get_json()
        birth_chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        )

        # Generate AI-powered analysis
        prompt = f"""
        Provide a comprehensive zodiac analysis for:
        - Sun Sign: {birth_chart['zodiac_sign']}
        - Moon Sign: {birth_chart['moon_sign']}
        - Ascendant: {birth_chart['ascendant']}
        - Nakshatra: {birth_chart['nakshatra']}
        """

        analysis = sarvam_ai.generate_prediction(prompt, birth_chart)

        return jsonify({
            'status': 'success',
            'data': {
                'chart': birth_chart,
                'analysis': analysis
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/planetary-positions', methods=['POST'])
def planetary_positions():
    """Get current planetary positions"""
    try:
        data = request.get_json()
        chart = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data['place_of_birth']
        )

        return jsonify({
            'status': 'success',
            'data': {
                'planets': chart['planets'],
                'houses': chart['houses']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/compatibility', methods=['POST'])
def compatibility_analysis():
    """Analyze compatibility between two people"""
    try:
        data = request.get_json()

        # Calculate charts for both people
        chart1 = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['person1']['date_of_birth'],
            time_of_birth=data['person1']['time_of_birth'],
            place=data['person1']['place_of_birth']
        )

        chart2 = astrology_calculator.calculate_birth_chart(
            date_of_birth=data['person2']['date_of_birth'],
            time_of_birth=data['person2']['time_of_birth'],
            place=data['person2']['place_of_birth']
        )

        # Generate compatibility analysis
        prompt = f"""
        Analyze compatibility between:
        Person 1: {chart1['zodiac_sign']} Sun, {chart1['moon_sign']} Moon, {chart1['nakshatra']} Nakshatra
        Person 2: {chart2['zodiac_sign']} Sun, {chart2['moon_sign']} Moon, {chart2['nakshatra']} Nakshatra

        Provide compatibility score and detailed analysis for:
        1. Emotional compatibility
        2. Intellectual compatibility
        3. Physical compatibility
        4. Spiritual compatibility
        5. Long-term prospects
        """

        compatibility = sarvam_ai.generate_prediction(prompt, {
            'person1': chart1,
            'person2': chart2
        })

        return jsonify({
            'status': 'success',
            'data': {
                'person1_chart': chart1,
                'person2_chart': chart2,
                'compatibility_analysis': compatibility
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

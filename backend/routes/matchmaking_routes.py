"""
Matchmaking API Routes
Kundali matching and compatibility analysis endpoints
"""
from flask import Blueprint, request, jsonify
from services.matchmaking_service import get_matchmaking_service
import logging
from services.astrology_calculator import get_astrology_calculator, get_astrology_dependency_error
from utils.astrology_helpers import dependency_error_response, get_cached_birth_data

logger = logging.getLogger(__name__)

bp = Blueprint('matchmaking', __name__, url_prefix='/api/matchmaking')


@bp.route('/compatibility', methods=['POST'])
def calculate_compatibility():
    """
    Calculate compatibility between two individuals using Ashtakoot system
    
    Request JSON:
    {
        "person1": {
            "name": "Person 1",
            "date_of_birth": "1990-01-15",
            "time_of_birth": "14:30",
            "place_of_birth": "New Delhi, India",
            "latitude": 28.6139,
            "longitude": 77.2090
        },
        "person2": {
            "name": "Person 2",
            "date_of_birth": "1992-05-20",
            "time_of_birth": "10:15",
            "place_of_birth": "Mumbai, India",
            "latitude": 19.0760,
            "longitude": 72.8777
        },
        "mode": "hybrid"  // "online", "offline", or "hybrid"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        person1_data = data.get('person1')
        person2_data = data.get('person2')
        mode = data.get('mode', 'hybrid')
        
        calculator = get_astrology_calculator()
        if not calculator:
            return dependency_error_response(get_astrology_dependency_error())

        # Validate input
        if not person1_data or not person2_data:
            return jsonify({'error': 'Both person1 and person2 data required'}), 400
        
        required_fields = ['date_of_birth', 'time_of_birth', 'place_of_birth']
        for field in required_fields:
            if field not in person1_data or field not in person2_data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate mode
        if mode not in ['online', 'offline', 'hybrid']:
            return jsonify({'error': 'Mode must be online, offline, or hybrid'}), 400
        
        # Calculate compatibility
        matchmaking_service = get_matchmaking_service()
        result = matchmaking_service.calculate_compatibility(
            person1_data=person1_data,
            person2_data=person2_data,
            mode=mode
        )
        
        return jsonify(result), 200
        
    except KeyError as e:
        logger.error(f"Missing required field: {e}")
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except Exception as e:
        logger.error(f"Compatibility calculation failed: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/quick-match', methods=['POST'])
def quick_match():
    """
    Quick compatibility check using just zodiac signs
    
    Request JSON:
    {
        "zodiac1": "Aries",
        "zodiac2": "Leo"
    }
    """
    try:
        data = request.get_json()
        
        zodiac1 = data.get('zodiac1')
        zodiac2 = data.get('zodiac2')
        
        if not zodiac1 or not zodiac2:
            return jsonify({'error': 'Both zodiac signs required'}), 400
        
        # Simple compatibility based on elements
        fire_signs = ['Aries', 'Leo', 'Sagittarius']
        earth_signs = ['Taurus', 'Virgo', 'Capricorn']
        air_signs = ['Gemini', 'Libra', 'Aquarius']
        water_signs = ['Cancer', 'Scorpio', 'Pisces']
        
        def get_element(sign):
            if sign in fire_signs:
                return 'Fire'
            elif sign in earth_signs:
                return 'Earth'
            elif sign in air_signs:
                return 'Air'
            elif sign in water_signs:
                return 'Water'
            return None
        
        element1 = get_element(zodiac1)
        element2 = get_element(zodiac2)
        
        # Element compatibility
        if element1 == element2:
            compatibility = 85
            message = "Excellent match! Same element creates natural understanding."
        elif (element1 == 'Fire' and element2 == 'Air') or \
             (element1 == 'Air' and element2 == 'Fire'):
            compatibility = 80
            message = "Great match! Fire and Air energize each other."
        elif (element1 == 'Earth' and element2 == 'Water') or \
             (element1 == 'Water' and element2 == 'Earth'):
            compatibility = 75
            message = "Very good match! Earth and Water nurture each other."
        elif (element1 == 'Fire' and element2 == 'Earth') or \
             (element1 == 'Earth' and element2 == 'Fire'):
            compatibility = 60
            message = "Moderate match. Fire and Earth need balance."
        elif (element1 == 'Air' and element2 == 'Water') or \
             (element1 == 'Water' and element2 == 'Air'):
            compatibility = 55
            message = "Moderate match. Air and Water require effort."
        elif (element1 == 'Fire' and element2 == 'Water') or \
             (element1 == 'Water' and element2 == 'Fire'):
            compatibility = 50
            message = "Challenging match. Fire and Water oppose each other."
        else:
            compatibility = 65
            message = "Average match with potential."
        
        return jsonify({
            'status': 'success',
            'zodiac1': zodiac1,
            'zodiac2': zodiac2,
            'element1': element1,
            'element2': element2,
            'compatibility_percentage': compatibility,
            'message': message,
            'note': 'For detailed compatibility, provide full birth details.'
        }), 200
        
    except Exception as e:
        logger.error(f"Quick match failed: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/doshas', methods=['POST'])
def check_doshas():
    """
    Check for marriage doshas (Mangal Dosha, Nadi Dosha, etc.)
    
    Request JSON:
    {
        "date_of_birth": "1990-01-15",
        "time_of_birth": "14:30",
        "place_of_birth": "New Delhi, India"
    }
    """
    try:
        data = request.get_json()
        
        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            chart = calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=data['place_of_birth']
            )
        else:
            chart = cached_birth_data
        
        # Check Mangal Dosha
        matchmaking_service = get_matchmaking_service()
        mars_house = matchmaking_service._get_planet_house(chart, 'Mars')
        mangal_houses = [1, 2, 4, 7, 8, 12]
        mangal_dosha = mars_house in mangal_houses
        
        doshas = {
            'mangal_dosha': {
                'present': mangal_dosha,
                'mars_house': mars_house,
                'severity': 'high' if mangal_dosha and mars_house in [1, 4, 7, 8] else 'moderate' if mangal_dosha else 'none',
                'description': f'Mars in house {mars_house}' + 
                             (' - Mangal Dosha present' if mangal_dosha else ' - No Mangal Dosha'),
                'remedies': [
                    'Chant Hanuman Chalisa daily',
                    'Visit Hanuman temple on Tuesdays',
                    'Wear red coral gemstone after consultation',
                    'Fast on Tuesdays',
                    'Donate red lentils and jaggery'
                ] if mangal_dosha else []
            }
        }
        
        return jsonify({
            'status': 'success',
            'doshas': doshas,
            'chart_summary': {
                'zodiac_sign': chart['zodiac_sign'],
                'moon_sign': chart['moon_sign'],
                'nakshatra': chart['nakshatra']
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Dosha check failed: {e}")
        return jsonify({'error': str(e)}), 500


@bp.route('/remedies', methods=['POST'])
def get_remedies():
    """
    Get Vedic remedies for improving compatibility
    
    Request JSON:
    {
        "compatibility_score": 18,
        "doshas": ["mangal_dosha"],
        "weak_kutas": ["nadi", "bhakoot"]
    }
    """
    try:
        data = request.get_json()
        
        score = data.get('compatibility_score', 0)
        doshas = data.get('doshas', [])
        weak_kutas = data.get('weak_kutas', [])
        
        remedies = {
            'mantras': [],
            'gemstones': [],
            'rituals': [],
            'charitable_acts': [],
            'lifestyle': []
        }
        
        # General remedies for low score
        if score < 18:
            remedies['mantras'].append({
                'name': 'Mahamrityunjaya Mantra',
                'description': 'Chant 108 times daily for harmony',
                'count': 108
            })
            remedies['rituals'].append({
                'name': 'Rudrabhishek',
                'description': 'Perform on Mondays for removing obstacles',
                'frequency': 'Monthly'
            })
        
        # Mangal Dosha remedies
        if 'mangal_dosha' in doshas:
            remedies['mantras'].append({
                'name': 'Hanuman Chalisa',
                'description': 'Recite daily to pacify Mars',
                'count': 1
            })
            remedies['gemstones'].append({
                'name': 'Red Coral',
                'description': 'Wear in ring finger after proper energization',
                'weight': '5-7 carats'
            })
            remedies['charitable_acts'].append({
                'name': 'Feed monkeys',
                'description': 'Feed monkeys with jaggery and gram on Tuesdays',
                'frequency': 'Weekly'
            })
        
        # Nadi Dosha remedies
        if 'nadi' in weak_kutas:
            remedies['rituals'].append({
                'name': 'Nadi Nivarana Puja',
                'description': 'Special puja for removing Nadi Dosha',
                'frequency': 'One time before marriage'
            })
            remedies['charitable_acts'].append({
                'name': 'Donate grains',
                'description': 'Donate wheat and rice to Brahmins',
                'frequency': 'Once'
            })
        
        # Bhakoot remedies
        if 'bhakoot' in weak_kutas:
            remedies['mantras'].append({
                'name': 'Chandra Mantra',
                'description': 'Om Chandraya Namaha - 108 times on Mondays',
                'count': 108
            })
            remedies['gemstones'].append({
                'name': 'Pearl',
                'description': 'Wear pearl for Moon\'s blessings',
                'weight': '5 carats'
            })
        
        # General lifestyle recommendations
        remedies['lifestyle'].extend([
            {
                'practice': 'Compatibility meditation',
                'description': 'Both partners meditate together daily'
            },
            {
                'practice': 'Temple visits',
                'description': 'Visit Shiva-Parvati temple together'
            },
            {
                'practice': 'Fasting',
                'description': 'Observe fasts on auspicious days'
            }
        ])
        
        return jsonify({
            'status': 'success',
            'remedies': remedies,
            'note': 'Consult a qualified astrologer before performing remedies'
        }), 200
        
    except Exception as e:
        logger.error(f"Remedies generation failed: {e}")
        return jsonify({'error': str(e)}), 500

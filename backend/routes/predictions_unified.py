"""
Unified Predictions API Routes
Comprehensive prediction endpoints supporting all categories with online/offline/hybrid modes
"""
from flask import Blueprint, request, jsonify
from services.prediction_orchestrator import get_prediction_orchestrator
from services.astrology_calculator import get_astrology_calculator, get_astrology_dependency_error
from services.bhrigu_core_wisdom import get_bhrigu_core_wisdom
from datetime import datetime
import logging
from utils.astrology_helpers import dependency_error_response, get_cached_birth_data

logger = logging.getLogger(__name__)

bp = Blueprint('predictions_unified', __name__, url_prefix='/api/predictions')

# Initialize services
orchestrator = get_prediction_orchestrator()
core_wisdom = get_bhrigu_core_wisdom()


@bp.route('/health', methods=['GET'])
def health_check():
    """Health check with feature status"""
    try:
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'features': {
                'online_mode': bool(orchestrator.openai_service and orchestrator.openai_service.enabled),
                'offline_mode': bool(orchestrator.offline_wisdom),
                'rule_engine': bool(orchestrator.rule_engine),
                'core_wisdom': bool(orchestrator.core_wisdom),
                'total_categories': len(orchestrator.get_supported_categories())
            }
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'degraded',
            'error': str(e)
        }), 500


@bp.route('/categories', methods=['GET'])
def get_categories():
    """Get list of all available prediction categories"""
    try:
        categories = orchestrator.get_supported_categories()
        return jsonify({
            'status': 'success',
            'categories': categories,
            'total': len(categories)
        }), 200
    except Exception as e:
        logger.error(f"Failed to get categories: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


@bp.route('/<category>', methods=['POST'])
def generate_category_prediction(category):
    """
    Generate prediction for any category
    
    Supported categories:
    - karmic_journey
    - past_lives
    - future_lives
    - present_life
    - life_events
    - karmic_remedies
    - relationships
    - predictions
    - cosmic_blueprint_overview
    - soul_purpose
    - karmic_debts
    - dharmic_path
    - spiritual_evolution
    - moksha_indicators
    
    Request body:
    {
        "date_of_birth": "YYYY-MM-DD",
        "time_of_birth": "HH:MM",
        "place_of_birth": "City, Country",
        "mode": "online|offline|hybrid" (optional, default: hybrid),
        "language": "en|hi|sa" (optional, default: en)
    }
    """
    try:
        data = request.get_json()
        
        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            # Validate required fields
            required_fields = ['date_of_birth', 'time_of_birth', 'place_of_birth']
            for field in required_fields:
                if field not in data:
                    return jsonify({
                        'status': 'error',
                        'error': f'Missing required field: {field}'
                    }), 400
        
        # Get mode and language
        mode = data.get('mode', 'hybrid')
        language = data.get('language', 'en')
        
        # Calculate birth chart
        if calculator:
            try:
                birth_chart = calculator.calculate_birth_chart(
                    date_of_birth=data['date_of_birth'],
                    time_of_birth=data['time_of_birth'],
                    place=data['place_of_birth']
                )
            except Exception as e:
                logger.error(f"Birth chart calculation failed: {e}")
                return jsonify({
                    'status': 'error',
                    'error': f'Failed to calculate birth chart: {str(e)}'
                }), 500
        else:
            logger.warning("Astrology calculator unavailable; using cached birth data.")
            birth_chart = cached_birth_data
        
        # Generate prediction
        result = orchestrator.generate_prediction(
            category=category,
            chart_data=birth_chart,
            mode=mode,
            language=language
        )
        
        return jsonify({
            'status': 'success',
            'category': category,
            'mode': result.get('mode', mode),
            'language': language,
            'prediction': result.get('prediction', ''),
            'matched_rules': result.get('matched_rules', []),
            'citations': result.get('citations', []),
            'source': result.get('source', 'Unknown'),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Prediction generation failed for {category}: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e),
            'category': category
        }), 500


@bp.route('/cosmic-blueprint', methods=['POST'])
def generate_cosmic_blueprint():
    """
    Generate complete cosmic blueprint with all subcategories
    
    Request body:
    {
        "date_of_birth": "YYYY-MM-DD",
        "time_of_birth": "HH:MM",
        "place_of_birth": "City, Country",
        "mode": "online|offline|hybrid" (optional, default: hybrid),
        "language": "en|hi|sa" (optional, default: en)
    }
    
    Returns comprehensive analysis combining:
    - Karmic Journey
    - Soul Purpose
    - Karmic Debts
    - Dharmic Path
    - Spiritual Evolution
    - Moksha Indicators
    - Present Life
    - Life Events
    """
    try:
        data = request.get_json()
        
        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            # Validate required fields
            required_fields = ['date_of_birth', 'time_of_birth', 'place_of_birth']
            for field in required_fields:
                if field not in data:
                    return jsonify({
                        'status': 'error',
                        'error': f'Missing required field: {field}'
                    }), 400
        
        # Get mode and language
        mode = data.get('mode', 'hybrid')
        language = data.get('language', 'en')
        
        # Calculate birth chart
        if calculator:
            try:
                birth_chart = calculator.calculate_birth_chart(
                    date_of_birth=data['date_of_birth'],
                    time_of_birth=data['time_of_birth'],
                    place=data['place_of_birth']
                )
            except Exception as e:
                logger.error(f"Birth chart calculation failed: {e}")
                return jsonify({
                    'status': 'error',
                    'error': f'Failed to calculate birth chart: {str(e)}'
                }), 500
        else:
            logger.warning("Astrology calculator unavailable; using cached birth data.")
            birth_chart = cached_birth_data
        
        # Generate cosmic blueprint
        blueprint = orchestrator.generate_cosmic_blueprint(
            chart_data=birth_chart,
            mode=mode,
            language=language
        )
        
        return jsonify({
            'status': 'success',
            'mode': blueprint.get('mode', mode),
            'language': language,
            'sections': blueprint.get('sections', {}),
            'complete_blueprint': blueprint.get('complete_blueprint', ''),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Cosmic blueprint generation failed: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


@bp.route('/daily', methods=['POST'])
def daily_prediction():
    """Get daily horoscope prediction - legacy endpoint for compatibility"""
    return generate_category_prediction('predictions')


@bp.route('/weekly', methods=['POST'])
def weekly_prediction():
    """Get weekly horoscope prediction - legacy endpoint for compatibility"""
    return generate_category_prediction('predictions')


@bp.route('/monthly', methods=['POST'])
def monthly_prediction():
    """Get monthly horoscope prediction - legacy endpoint for compatibility"""
    return generate_category_prediction('predictions')


@bp.route('/yearly', methods=['POST'])
def yearly_prediction():
    """Get yearly horoscope prediction - legacy endpoint for compatibility"""
    return generate_category_prediction('predictions')


# Specific category shortcuts for convenience
@bp.route('/karmic-journey', methods=['POST'])
def karmic_journey():
    """Generate karmic journey prediction"""
    return generate_category_prediction('karmic_journey')


@bp.route('/past-lives', methods=['POST'])
def past_lives():
    """Generate past lives analysis"""
    return generate_category_prediction('past_lives')


@bp.route('/future-lives', methods=['POST'])
def future_lives():
    """Generate future lives prediction"""
    return generate_category_prediction('future_lives')


@bp.route('/present-life', methods=['POST'])
def present_life():
    """Generate present life analysis"""
    return generate_category_prediction('present_life')


@bp.route('/life-events', methods=['POST'])
def life_events():
    """Generate life events prediction"""
    return generate_category_prediction('life_events')


@bp.route('/karmic-remedies', methods=['POST'])
def karmic_remedies():
    """Generate karmic remedies"""
    return generate_category_prediction('karmic_remedies')


@bp.route('/relationships', methods=['POST'])
def relationships():
    """Generate relationships analysis"""
    return generate_category_prediction('relationships')


@bp.route('/soul-purpose', methods=['POST'])
def soul_purpose():
    """Generate soul purpose analysis"""
    return generate_category_prediction('soul_purpose')


@bp.route('/karmic-debts', methods=['POST'])
def karmic_debts():
    """Generate karmic debts analysis"""
    return generate_category_prediction('karmic_debts')


@bp.route('/dharmic-path', methods=['POST'])
def dharmic_path():
    """Generate dharmic path guidance"""
    return generate_category_prediction('dharmic_path')


@bp.route('/spiritual-evolution', methods=['POST'])
def spiritual_evolution():
    """Generate spiritual evolution analysis"""
    return generate_category_prediction('spiritual_evolution')


@bp.route('/moksha-indicators', methods=['POST'])
def moksha_indicators():
    """Generate moksha indicators analysis"""
    return generate_category_prediction('moksha_indicators')


@bp.route('/test', methods=['GET'])
def test_route():
    """Test route to verify blueprint registration"""
    return jsonify({
        'status': 'success',
        'message': 'Unified predictions routes are active',
        'available_endpoints': [
            '/api/predictions/health',
            '/api/predictions/categories',
            '/api/predictions/<category>',
            '/api/predictions/cosmic-blueprint',
            '/api/predictions/daily',
            '/api/predictions/weekly',
            '/api/predictions/monthly',
            '/api/predictions/yearly'
        ]
    }), 200

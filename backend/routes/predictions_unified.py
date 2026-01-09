"""
Unified Predictions API Routes
Comprehensive prediction endpoints supporting all categories with online/offline/hybrid modes
"""
from flask import Blueprint, request, jsonify
from utils.client_status import parse_client_online
from services.prediction_orchestrator import get_prediction_orchestrator
from services.astrology_calculator import get_astrology_calculator, get_astrology_dependency_error
from services.bhrigu_core_wisdom import get_bhrigu_core_wisdom
from datetime import datetime
from utils.response_formatter import prediction_response, prediction_error_response
from utils.validators import sanitize_input
from utils.logger import setup_logger, log_exception

logger = setup_logger(__name__)

bp = Blueprint('predictions_unified', __name__, url_prefix='/api/predictions')

# Initialize services
orchestrator = get_prediction_orchestrator()
core_wisdom = get_bhrigu_core_wisdom()
astrology_calculator = get_astrology_calculator()


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
        log_exception(logger, e, context="predictions_unified.health_check")
        return jsonify({
            'status': 'degraded',
            'error': 'Health check failed'
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
        log_exception(logger, e, context="predictions_unified.get_categories")
        return jsonify({
            'status': 'error',
            'error': 'Failed to get categories'
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
        
        # Validate required fields
        required_fields = ['date_of_birth', 'time_of_birth', 'place_of_birth']
        for field in required_fields:
            if field not in data:
                return prediction_error_response(
                    f'Missing required field: {field}',
                    400,
                    metadata={'category': category}
                )
        
        # Get mode and language
        mode = data.get('mode', 'hybrid')
        language = data.get('language', 'en')
        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        
        # Calculate birth chart
        try:
            birth_chart = astrology_calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=data['place_of_birth'],
                timezone_override=sanitize_input(data['timezone'], max_length=64)
                if data.get('timezone') else None
            )
        except Exception as e:
            log_exception(logger, e, context="predictions_unified.birth_chart")
            return prediction_error_response(
                'Failed to calculate birth chart.',
                500,
                metadata={'category': category}
            )
        
        # Generate prediction
        result = orchestrator.generate_prediction(
            category=category,
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            language=language
        )
        
        return prediction_response(
            result.get('prediction', result),
            metadata={
                'category': category,
                'mode': result.get('mode', mode),
                'language': language,
                'matched_rules': result.get('matched_rules', []),
                'citations': result.get('citations', []),
                'source': result.get('source', 'Unknown'),
                'timestamp': datetime.utcnow().isoformat()
            }
        )
        
    except Exception as e:
        log_exception(logger, e, context=f"predictions_unified.generate_prediction.{category}")
        return prediction_error_response(
            'Failed to generate prediction. Please try again later.',
            500,
            metadata={'category': category}
        )


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
        
        # Validate required fields
        required_fields = ['date_of_birth', 'time_of_birth', 'place_of_birth']
        for field in required_fields:
            if field not in data:
                return prediction_error_response(
                    f'Missing required field: {field}',
                    400,
                    metadata={'category': 'cosmic_blueprint'}
                )
        
        # Get mode and language
        mode = data.get('mode', 'hybrid')
        language = data.get('language', 'en')
        client_online = parse_client_online(request.headers.get('X-Client-Online'))
        
        # Calculate birth chart
        try:
            birth_chart = astrology_calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=data['place_of_birth'],
                timezone_override=sanitize_input(data['timezone'], max_length=64)
                if data.get('timezone') else None
            )
        except Exception as e:
            log_exception(logger, e, context="predictions_unified.cosmic_blueprint.birth_chart")
            return prediction_error_response(
                'Failed to calculate birth chart.',
                500,
                metadata={'category': 'cosmic_blueprint'}
            )
        
        # Generate cosmic blueprint
        blueprint = orchestrator.generate_cosmic_blueprint(
            chart_data=birth_chart,
            mode=mode,
            client_online=client_online,
            language=language
        )
        
        return prediction_response(
            {
                'sections': blueprint.get('sections', {}),
                'complete_blueprint': blueprint.get('complete_blueprint', '')
            },
            metadata={
                'category': 'cosmic_blueprint',
                'mode': blueprint.get('mode', mode),
                'language': language,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
        
    except Exception as e:
        log_exception(logger, e, context="predictions_unified.cosmic_blueprint")
        return prediction_error_response(
            'Failed to generate cosmic blueprint. Please try again later.',
            500,
            metadata={'category': 'cosmic_blueprint'}
        )


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
            '/api/predictions/cosmic-blueprint'
        ]
    }), 200

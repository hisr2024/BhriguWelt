"""
AI-powered features routes
Provides secure AI integration with consent and privacy controls
"""
from flask import Blueprint, request, jsonify
from functools import wraps
import os

from middleware.sanitizer import RequestSanitizer
from middleware.ai_constants import PII_FIELDS
from services.ai_service import AIService
from utils.logger import setup_logger, log_exception

bp = Blueprint('ai', __name__, url_prefix='/api/ai')
logger = setup_logger(__name__)

# Initialize AI service
ai_service = AIService()


def require_ai_consent(f):
    """Decorator to ensure AI consent was provided"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if AI is enabled in environment
        if not os.getenv('OPENAI_API_KEY') and not ai_service.offline_ready:
            return jsonify({
                'error': 'AI features not configured',
                'message': 'AI integration is not available'
            }), 503
        
        # Check consent header
        consent = request.headers.get('X-AI-Consent')
        if consent != 'granted':
            return jsonify({
                'error': 'Consent required',
                'message': 'AI features require explicit user consent'
            }), 403
        
        # Check AI mode
        ai_mode = request.headers.get('X-AI-Mode')
        if ai_mode not in ['hybrid', 'conversational']:
            return jsonify({
                'error': 'Invalid AI mode',
                'message': 'AI mode must be "hybrid" or "conversational"'
            }), 400
        
        return f(*args, **kwargs)
    return decorated_function


def validate_ai_request(required_fields):
    """Decorator to validate AI request data"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({
                    'error': 'Invalid content type',
                    'message': 'Content-Type must be application/json'
                }), 400
            
            data = request.get_json()
            
            # Validate required fields
            for field in required_fields:
                if field not in data:
                    return jsonify({
                        'error': 'Missing required field',
                        'message': f'Field "{field}" is required'
                    }), 400
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


@bp.route('/compose', methods=['POST'])
@require_ai_consent
@validate_ai_request(['report_section', 'birth_data'])
def compose_report():
    """
    Refine existing report sections using AI
    
    Requires AI consent and sanitizes all PII before transmission
    """
    try:
        data = request.get_json()
        report_section = data['report_section']
        birth_data = data['birth_data']
        
        # Sanitize birth data - remove all PII
        sanitized_data = RequestSanitizer.sanitize_for_ai(birth_data)
        
        # Validate that no PII is present (using centralized list)
        for field in PII_FIELDS:
            if field in sanitized_data:
                return jsonify({
                    'error': 'Security error',
                    'message': 'PII detected in request. This should not happen.'
                }), 400
        
        # Get AI mode
        ai_mode = request.headers.get('X-AI-Mode', 'hybrid')
        
        # Generate refined report section
        refined_section = ai_service.refine_report_section(
            section_type=report_section,
            astrological_data=sanitized_data,
            mode=ai_mode
        )
        
        return jsonify({
            'status': 'success',
            'data': {
                'refined_section': refined_section,
                'section_type': report_section,
                'ai_enhanced': True,
                'mode': ai_mode,
                'privacy_note': 'No personal information was transmitted'
            }
        }), 200
        
    except ValueError as e:
        log_exception(logger, e, context="ai.compose_report.validation")
        return jsonify({
            'error': 'Validation error',
            'message': 'Invalid request data.'
        }), 400
    except Exception as e:
        log_exception(logger, e, context="ai.compose_report")
        return jsonify({
            'error': 'Server error',
            'message': 'Failed to generate AI response',
            'fallback': 'Please try offline mode'
        }), 500


@bp.route('/chat', methods=['POST'])
@require_ai_consent
@validate_ai_request(['message', 'birth_data'])
def chat_about_report():
    """
    Conversational Q&A about existing reports
    
    Requires explicit user consent and AI mode
    """
    try:
        data = request.get_json()
        message = data['message']
        birth_data = data['birth_data']
        conversation_history = data.get('conversation_history', [])
        
        # Sanitize user message
        message = RequestSanitizer.sanitize_string(message, max_length=1000)
        
        # Sanitize birth data
        sanitized_data = RequestSanitizer.sanitize_for_ai(birth_data)
        
        # Validate message is not empty
        if not message or len(message.strip()) == 0:
            return jsonify({
                'error': 'Empty message',
                'message': 'Please provide a question or message'
            }), 400
        
        # Generate AI response
        response = ai_service.chat_response(
            user_message=message,
            astrological_data=sanitized_data,
            history=conversation_history
        )
        
        return jsonify({
            'status': 'success',
            'data': {
                'response': response,
                'ai_enhanced': True,
                'mode': 'conversational',
                'privacy_note': 'No personal information was transmitted'
            }
        }), 200
        
    except ValueError as e:
        log_exception(logger, e, context="ai.chat.validation")
        return jsonify({
            'error': 'Validation error',
            'message': 'Invalid request data.'
        }), 400
    except Exception as e:
        log_exception(logger, e, context="ai.chat")
        return jsonify({
            'error': 'Server error',
            'message': 'Failed to generate AI response'
        }), 500


@bp.route('/summarize', methods=['POST'])
@require_ai_consent
@validate_ai_request(['report_data', 'birth_data'])
def summarize_report():
    """
    Generate AI-powered summaries for reports
    
    Requires consent and sanitizes all PII
    """
    try:
        data = request.get_json()
        report_data = data['report_data']
        birth_data = data['birth_data']
        summary_type = data.get('summary_type', 'overview')
        
        # Validate summary type
        valid_types = ['overview', 'key_insights', 'action_items', 'detailed']
        if summary_type not in valid_types:
            return jsonify({
                'error': 'Invalid summary type',
                'message': f'Summary type must be one of: {", ".join(valid_types)}'
            }), 400
        
        # Sanitize birth data
        sanitized_data = RequestSanitizer.sanitize_for_ai(birth_data)
        
        # Generate summary
        summary = ai_service.generate_summary(
            report_content=report_data,
            astrological_data=sanitized_data,
            summary_type=summary_type
        )
        
        return jsonify({
            'status': 'success',
            'data': {
                'summary': summary,
                'summary_type': summary_type,
                'ai_enhanced': True,
                'privacy_note': 'No personal information was transmitted'
            }
        }), 200
        
    except ValueError as e:
        log_exception(logger, e, context="ai.summarize.validation")
        return jsonify({
            'error': 'Validation error',
            'message': 'Invalid request data.'
        }), 400
    except Exception as e:
        log_exception(logger, e, context="ai.summarize")
        return jsonify({
            'error': 'Server error',
            'message': 'Failed to generate summary'
        }), 500


@bp.route('/consent', methods=['GET'])
def get_consent_info():
    """
    Get information about AI consent requirements
    No authentication required - public endpoint
    """
    return jsonify({
        'status': 'success',
        'data': {
            'consent_required': True,
            'modes': {
                'offline': {
                    'name': 'Offline Only',
                    'description': '100% local processing, no data transmission',
                    'privacy': 'Maximum',
                    'requires_consent': False
                },
                'hybrid': {
                    'name': 'Hybrid Refine',
                    'description': 'AI enhances local calculations',
                    'privacy': 'High',
                    'requires_consent': True,
                    'data_transmitted': ['zodiac_sign', 'nakshatra', 'planetary_positions']
                },
                'conversational': {
                    'name': 'AI Chatbot',
                    'description': 'Interactive AI assistant',
                    'privacy': 'Moderate',
                    'requires_consent': True,
                    'data_transmitted': ['zodiac_sign', 'nakshatra', 'planetary_positions', 'conversation_context']
                }
            },
            'data_never_transmitted': [
                'name',
                'email',
                'phone_number',
                'exact_birth_time',
                'birth_location',
                'address',
                'any_personal_identifiers'
            ],
            'privacy_policy_url': '/privacy'
        }
    }), 200


@bp.route('/status', methods=['GET'])
def ai_status():
    """
    Check AI service status
    No authentication required
    """
    ai_configured = bool(os.getenv('OPENAI_API_KEY'))
    
    return jsonify({
        'status': 'success',
        'data': {
            'ai_available': ai_configured,
            'service_operational': ai_configured,
            'endpoints': {
                'compose': '/api/ai/compose',
                'chat': '/api/ai/chat',
                'summarize': '/api/ai/summarize',
                'consent': '/api/ai/consent'
            }
        }
    }), 200

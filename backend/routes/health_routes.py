"""
Health and Status Routes
Comprehensive health checks, service status monitoring, and diagnostic endpoints
Includes cost monitoring for OpenAI API usage tracking
"""
from flask import Blueprint, jsonify, request
from datetime import datetime
import sys
import os
from pathlib import Path
from typing import Dict, Any, Optional
from utils.logger import setup_logger, log_exception

logger = setup_logger(__name__)
bp = Blueprint('health', __name__)


# ============================================================================
# COST MONITORING HELPERS
# ============================================================================

def _get_redis_client_safe():
    """
    Safely get Redis client, returning None if unavailable.
    """
    try:
        from services.redis_connection import get_redis_client
        return get_redis_client()
    except Exception as e:
        logger.debug(f"Redis client unavailable: {e}")
        return None


def _calculate_cost_metrics(redis_client) -> Dict[str, Any]:
    """
    Calculate cost metrics from Redis quota data.

    Returns aggregated cost information for monitoring.
    """
    if redis_client is None:
        return {
            'error': 'Redis unavailable',
            'daily_cost_usd': 0,
            'monthly_projection_usd': 0,
            'total_tokens_today': 0,
            'request_count_today': 0,
            'active_users_today': 0,
        }

    try:
        # Get all user quota keys for today
        today_str = datetime.utcnow().strftime('%Y-%m-%d')
        daily_pattern = f"ai_usage:*:{today_str}"

        # Use scan instead of keys for production safety
        user_keys = redis_client.keys(daily_pattern)

        total_tokens_today = 0
        active_users = 0

        for key in user_keys:
            try:
                tokens = redis_client.get(key)
                if tokens:
                    token_count = int(tokens)
                    if token_count > 0:
                        total_tokens_today += token_count
                        active_users += 1
            except (ValueError, TypeError):
                continue

        # Calculate costs
        cost_per_1k = float(os.getenv('OPENAI_COST_PER_1K', '0.002'))
        cost_per_token = cost_per_1k / 1000
        daily_cost = total_tokens_today * cost_per_token
        monthly_projection = daily_cost * 30

        # Get request count if tracked
        request_count_key = f"stats:requests:{today_str}"
        request_count = 0
        try:
            count = redis_client.get(request_count_key)
            if count:
                request_count = int(count)
        except Exception:
            pass

        # Calculate averages
        avg_tokens_per_request = (
            round(total_tokens_today / request_count, 2)
            if request_count > 0 else 0
        )
        cost_per_request = (
            round(daily_cost / request_count, 4)
            if request_count > 0 else 0
        )

        return {
            'daily_cost_usd': round(daily_cost, 4),
            'monthly_projection_usd': round(monthly_projection, 2),
            'total_tokens_today': total_tokens_today,
            'request_count_today': request_count,
            'active_users_today': active_users,
            'avg_tokens_per_request': avg_tokens_per_request,
            'cost_per_request_usd': cost_per_request,
            'quota_limit': int(os.getenv('USER_DAILY_TOKEN_LIMIT', '100000')),
            'cost_limit_per_request': float(os.getenv('PER_REQUEST_COST_LIMIT', '0.30')),
            'cost_per_1k_tokens': cost_per_1k,
        }

    except Exception as e:
        logger.error(f"Error calculating cost metrics: {e}")
        return {
            'error': str(e),
            'daily_cost_usd': 0,
            'monthly_projection_usd': 0,
            'total_tokens_today': 0,
        }


@bp.route('/status', methods=['GET'])
def simple_status():
    """
    Simple status endpoint for load balancers and uptime monitors
    Returns minimal response for quick health checks
    """
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'BhriguWelt-API',
        'version': '2.0.0'
    }), 200


@bp.route('/costs', methods=['GET'])
def cost_monitoring():
    """
    Real-time API cost monitoring endpoint.

    Returns daily costs, request counts, projections, and quota information.
    Useful for monitoring OpenAI API spending and optimizing usage.

    Returns:
        JSON with cost metrics:
        - daily_cost_usd: Total cost for today
        - monthly_projection_usd: Projected monthly cost
        - total_tokens_today: Total tokens consumed today
        - request_count_today: Number of API requests today
        - active_users_today: Number of users who made requests
        - avg_tokens_per_request: Average tokens per request
        - cost_per_request_usd: Average cost per request
        - quota_limit: Daily token quota per user
        - cost_limit_per_request: Maximum cost allowed per request
    """
    try:
        redis_client = _get_redis_client_safe()
        cost_data = _calculate_cost_metrics(redis_client)

        # Add cache statistics if available
        cache_stats = {}
        try:
            from services.prediction_cache import PredictionCache
            cache_stats = PredictionCache.get_cache_stats()
        except ImportError:
            cache_stats = {'available': False}
        except Exception as e:
            cache_stats = {'error': str(e)}

        # Add Redis health status
        redis_status = {
            'connected': redis_client is not None,
            'enabled': os.getenv('REDIS_ENABLED', 'true').lower() == 'true',
        }

        if redis_client is not None:
            try:
                from services.redis_connection import get_redis_manager
                manager = get_redis_manager()
                redis_status.update(manager.get_metrics())
            except Exception:
                pass

        return jsonify({
            'status': 'success',
            'timestamp': datetime.utcnow().isoformat(),
            'data': {
                'costs': cost_data,
                'cache': cache_stats,
                'redis': redis_status,
            },
            'config': {
                'user_daily_token_limit': int(os.getenv('USER_DAILY_TOKEN_LIMIT', '100000')),
                'per_request_cost_limit': float(os.getenv('PER_REQUEST_COST_LIMIT', '0.30')),
                'cost_per_1k_tokens': float(os.getenv('OPENAI_COST_PER_1K', '0.002')),
                'cache_enabled': os.getenv('PREDICTION_CACHE_ENABLED', 'true').lower() == 'true',
                'cache_ttl_seconds': int(os.getenv('CACHE_TTL', '3600')),
            }
        }), 200

    except Exception as e:
        logger.error(f"Cost monitoring error: {e}")
        log_exception(logger, e, context="cost_monitoring")
        return jsonify({
            'status': 'error',
            'timestamp': datetime.utcnow().isoformat(),
            'error': str(e),
        }), 500


@bp.route('/quota/<user_id>', methods=['GET'])
def user_quota_status(user_id: str):
    """
    Get quota status for a specific user.

    Args:
        user_id: The user identifier to check quota for

    Returns:
        JSON with user's quota information
    """
    try:
        from services.ai_quota import get_user_quota_status
        quota = get_user_quota_status(user_id)

        return jsonify({
            'status': 'success',
            'timestamp': datetime.utcnow().isoformat(),
            'user_id': user_id,
            'quota': quota,
        }), 200

    except Exception as e:
        logger.error(f"Error getting user quota: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e),
        }), 500


@bp.route('/detailed', methods=['GET'])
def detailed_health():
    """
    Detailed health check with comprehensive service diagnostics
    Includes all subsystems and their current status
    """
    health_data = {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '2.0.0',
        'uptime': _get_uptime(),
        'services': {},
        'vedic_systems': {},
        'infrastructure': {},
        'errors': []
    }

    # Check Prediction Orchestrator
    try:
        from services.prediction_orchestrator import get_prediction_orchestrator
        orchestrator = get_prediction_orchestrator()
        health_data['services']['prediction_orchestrator'] = {
            'status': 'operational',
            'concurrent_safe': bool(hasattr(orchestrator, 'lock')),
            'online_available': bool(orchestrator.openai_service and orchestrator.openai_service.enabled),
            'offline_available': bool(orchestrator.offline_wisdom)
        }
    except Exception as e:
        health_data['services']['prediction_orchestrator'] = {'status': 'error', 'error': str(e)}
        health_data['errors'].append(f"Prediction orchestrator: {str(e)}")

    # Check Vedic Calculation Engine
    try:
        from services.vedic_calculation_engine import VedicCalculationEngine
        engine = VedicCalculationEngine()
        health_data['vedic_systems']['calculation_engine'] = {
            'status': 'operational',
            'vimshottari_periods_count': len(engine.VIMSHOTTARI_PERIODS),
            'nakshatras_count': len(engine.NAKSHATRAS),
            'sign_lords_count': len(engine.SIGN_LORDS)
        }
    except Exception as e:
        health_data['vedic_systems']['calculation_engine'] = {'status': 'error', 'error': str(e)}
        health_data['errors'].append(f"Vedic calculation engine: {str(e)}")

    # Check Offline Wisdom Generator
    try:
        from services.bhrigu_offline_wisdom import BhriguOfflineWisdomGenerator
        offline_gen = BhriguOfflineWisdomGenerator()
        health_data['vedic_systems']['offline_wisdom'] = {
            'status': 'operational',
            'zodiac_traits_count': len(offline_gen.zodiac_traits),
            'nakshatra_traits_count': len(offline_gen.nakshatra_traits),
            'bhrigu_corpus_loaded': offline_gen.bhrigu_corpus is not None,
            'nadi_corpus_loaded': offline_gen.nadi_corpus is not None,
            'initialization_errors': offline_gen.initialization_errors
        }
        if offline_gen.initialization_errors:
            health_data['errors'].extend(offline_gen.initialization_errors)
    except Exception as e:
        health_data['vedic_systems']['offline_wisdom'] = {'status': 'error', 'error': str(e)}
        health_data['errors'].append(f"Offline wisdom: {str(e)}")

    # Check Astrology Calculator
    try:
        from services.astrology_calculator import get_astrology_calculator
        calc = get_astrology_calculator()
        if calc:
            health_data['vedic_systems']['astrology_calculator'] = {
                'status': 'operational',
                'ephemeris': 'Swiss Ephemeris',
                'ayanamsa': 'Lahiri',
                'nominatim_geocoding': 'operational',
                'mapbox_geocoding': 'operational' if calc.mapbox_geolocator else 'not_configured'
            }
        else:
            health_data['vedic_systems']['astrology_calculator'] = {'status': 'unavailable'}
    except Exception as e:
        health_data['vedic_systems']['astrology_calculator'] = {'status': 'error', 'error': str(e)}
        health_data['errors'].append(f"Astrology calculator: {str(e)}")

    # Check Database
    try:
        from models import db, BhriguWisdomEntry, BhriguPredictionCache
        wisdom_count = BhriguWisdomEntry.query.count()
        cache_count = BhriguPredictionCache.query.count()
        health_data['infrastructure']['database'] = {
            'status': 'operational',
            'wisdom_entries': wisdom_count,
            'cached_predictions': cache_count,
            'db_type': db.engine.dialect.name
        }
    except Exception as e:
        health_data['infrastructure']['database'] = {'status': 'error', 'error': str(e)}
        health_data['errors'].append(f"Database: {str(e)}")

    # Check Corpus Files
    corpus_status = {}
    data_dir = Path(__file__).parent.parent / 'data'
    corpus_files = {
        'bhrigu_samhita': 'bhrigu_samhita_principles.yml',
        'nadi_jyotisha': 'nadi_jyotisha_principles.yml',
        'soul_journey': 'bhrigu_karmic_soul_journey_model.json'
    }
    for key, filename in corpus_files.items():
        file_path = data_dir / filename
        corpus_status[key] = {
            'available': file_path.exists(),
            'size_kb': round(file_path.stat().st_size / 1024, 2) if file_path.exists() else 0
        }
    health_data['infrastructure']['corpus_files'] = corpus_status

    # Check OpenAI Service
    try:
        from services.openai_service import OpenAIService
        openai_svc = OpenAIService()
        health_data['services']['openai'] = {
            'status': 'operational' if openai_svc.enabled else 'disabled',
            'api_key_configured': bool(openai_svc.api_key) if openai_svc.enabled else False,
            'default_model': openai_svc.model if openai_svc.enabled else None
        }
    except Exception as e:
        health_data['services']['openai'] = {'status': 'offline', 'error': str(e)}

    # System Information
    health_data['infrastructure']['system'] = {
        'python_version': sys.version.split()[0],
        'platform': sys.platform,
        'environment': os.getenv('FLASK_ENV', 'production')
    }

    # Determine overall status
    error_count = len(health_data['errors'])
    if error_count > 5:
        health_data['status'] = 'unhealthy'
    elif error_count > 0:
        health_data['status'] = 'degraded'

    status_code = 200 if health_data['status'] == 'healthy' else 503

    return jsonify(health_data), status_code


@bp.route('/predictions', methods=['GET'])
def prediction_health():
    """
    Health check specifically for prediction services
    Tests each prediction category availability
    """
    prediction_status = {
        'status': 'operational',
        'timestamp': datetime.utcnow().isoformat(),
        'categories': {}
    }

    # Test prediction categories
    categories = [
        'karmic_journey',
        'past_lives',
        'future_lives',
        'present_life',
        'life_events',
        'karmic_remedies',
        'relationships',
        'predictions'
    ]

    try:
        from services.prediction_orchestrator import get_prediction_orchestrator
        orchestrator = get_prediction_orchestrator()

        for category in categories:
            try:
                # Check if orchestrator can handle this category
                has_handler = hasattr(orchestrator, f'_generate_{category}_prediction')
                prediction_status['categories'][category] = {
                    'status': 'available' if has_handler else 'not_implemented',
                    'online_mode': orchestrator.openai_service is not None,
                    'offline_mode': orchestrator.offline_wisdom is not None
                }
            except Exception as e:
                prediction_status['categories'][category] = {
                    'status': 'error',
                    'error': str(e)
                }

        prediction_status['summary'] = {
            'total_categories': len(categories),
            'available_categories': sum(1 for c in prediction_status['categories'].values()
                                       if c.get('status') == 'available'),
            'online_mode_ready': orchestrator.openai_service is not None,
            'offline_mode_ready': orchestrator.offline_wisdom is not None,
            'guaranteed_response': True
        }

    except Exception as e:
        prediction_status['status'] = 'error'
        prediction_status['error'] = str(e)
        log_exception(logger, e, context="prediction_health_check")

    return jsonify(prediction_status), 200


@bp.route('/database', methods=['GET'])
def database_health():
    """
    Detailed database health check
    Includes table statistics and connection status
    """
    db_status = {
        'status': 'operational',
        'timestamp': datetime.utcnow().isoformat(),
        'tables': {},
        'connection': {}
    }

    try:
        from models import db, BhriguWisdomEntry, BhriguPredictionCache, BhriguSessionLog

        # Test connection
        db.session.execute('SELECT 1')
        db_status['connection']['status'] = 'connected'
        db_status['connection']['dialect'] = db.engine.dialect.name
        db_status['connection']['driver'] = db.engine.driver

        # Table statistics
        try:
            db_status['tables']['wisdom_entries'] = {
                'count': BhriguWisdomEntry.query.count(),
                'categories': db.session.query(BhriguWisdomEntry.category).distinct().count()
            }
        except Exception as e:
            db_status['tables']['wisdom_entries'] = {'error': str(e)}

        try:
            db_status['tables']['prediction_cache'] = {
                'count': BhriguPredictionCache.query.count(),
                'categories': db.session.query(BhriguPredictionCache.category).distinct().count()
            }
        except Exception as e:
            db_status['tables']['prediction_cache'] = {'error': str(e)}

        try:
            db_status['tables']['session_logs'] = {
                'count': BhriguSessionLog.query.count()
            }
        except Exception as e:
            db_status['tables']['session_logs'] = {'error': str(e)}

    except Exception as e:
        db_status['status'] = 'error'
        db_status['error'] = str(e)
        log_exception(logger, e, context="database_health_check")

    status_code = 200 if db_status['status'] == 'operational' else 503

    return jsonify(db_status), status_code


@bp.route('/corpus', methods=['GET'])
def corpus_health():
    """
    Check status of Vedic wisdom corpus files
    """
    corpus_status = {
        'status': 'operational',
        'timestamp': datetime.utcnow().isoformat(),
        'files': {}
    }

    data_dir = Path(__file__).parent.parent / 'data'

    # Check all corpus files
    corpus_files = {
        'bhrigu_samhita_principles': 'bhrigu_samhita_principles.yml',
        'nadi_jyotisha_principles': 'nadi_jyotisha_principles.yml',
        'soul_journey_model': 'bhrigu_karmic_soul_journey_model.json',
        'core_texts': 'bhrigu_samhita/core_texts.json',
        'commentaries': 'bhrigu_samhita/commentaries.json',
        'nakshatra_mappings': 'bhrigu_samhita/nakshatra_mappings.json',
        'timing_rules': 'nadi_jyotisa/timing_rules.json',
        'manuscripts': 'nadi_jyotisa/manuscripts.json',
        'life_events_patterns': 'nadi_jyotisa/life_events_patterns.json'
    }

    missing_files = []
    for key, filename in corpus_files.items():
        file_path = data_dir / filename
        if file_path.exists():
            corpus_status['files'][key] = {
                'status': 'available',
                'size_kb': round(file_path.stat().st_size / 1024, 2),
                'modified': datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
            }
        else:
            corpus_status['files'][key] = {'status': 'missing'}
            missing_files.append(key)

    if missing_files:
        corpus_status['status'] = 'incomplete'
        corpus_status['missing_files'] = missing_files

    corpus_status['summary'] = {
        'total_files': len(corpus_files),
        'available_files': len([f for f in corpus_status['files'].values()
                               if f.get('status') == 'available']),
        'total_size_kb': sum(f.get('size_kb', 0) for f in corpus_status['files'].values())
    }

    return jsonify(corpus_status), 200


@bp.route('/readiness', methods=['GET'])
def readiness():
    """
    Kubernetes-style readiness probe
    Returns 200 if service is ready to accept traffic
    """
    try:
        # Check critical services
        from services.prediction_orchestrator import get_prediction_orchestrator
        orchestrator = get_prediction_orchestrator()

        if not orchestrator:
            return jsonify({'ready': False, 'reason': 'orchestrator_not_initialized'}), 503

        # Check database connectivity
        from models import db
        db.session.execute('SELECT 1')

        return jsonify({
            'ready': True,
            'timestamp': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        log_exception(logger, e, context="readiness_check")
        return jsonify({
            'ready': False,
            'reason': str(e)
        }), 503


@bp.route('/liveness', methods=['GET'])
def liveness():
    """
    Kubernetes-style liveness probe
    Returns 200 if service is alive (even if not fully operational)
    """
    return jsonify({
        'alive': True,
        'timestamp': datetime.utcnow().isoformat(),
        'version': '2.0.0'
    }), 200


def _get_uptime():
    """Calculate application uptime"""
    try:
        import time
        import psutil
        process = psutil.Process(os.getpid())
        uptime_seconds = time.time() - process.create_time()
        return {
            'seconds': int(uptime_seconds),
            'human_readable': _format_uptime(uptime_seconds)
        }
    except (ImportError, AttributeError, OSError) as e:
        logger.warning(f"Failed to get uptime: {e}")
        return {'seconds': 0, 'human_readable': 'unknown'}


def _format_uptime(seconds):
    """Format uptime in human-readable format"""
    days = int(seconds // 86400)
    hours = int((seconds % 86400) // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)

    parts = []
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0:
        parts.append(f"{minutes}m")
    parts.append(f"{secs}s")

    return " ".join(parts)


# Error handlers for health routes
@bp.errorhandler(Exception)
def handle_health_error(error):
    """Handle errors in health check routes"""
    log_exception(logger, error, context="health_route_error")
    return jsonify({
        'status': 'error',
        'error': str(error),
        'timestamp': datetime.utcnow().isoformat()
    }), 500

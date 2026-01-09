"""
Bhrigu Predictions Routes
Handles all Bhrigu Samhita and Nadi Jyotisa prediction requests
"""
from flask import Blueprint, request, jsonify
from services.bhrigu_predictions import get_bhrigu_service
from services.astrology_calculator import get_astrology_calculator, get_astrology_dependency_error
from models import db, BhriguPredictionCache, BhriguWisdomEntry, BhriguSessionLog
from middleware.rate_limiter import limiter
from utils.astrology_helpers import dependency_error_response, get_cached_birth_data
from utils.validators import validate_birth_data, sanitize_input
from utils.response_formatter import (
    success_response,
    error_response,
    prediction_response,
    prediction_error_response
)
from datetime import datetime
from typing import Optional
import uuid
import json
import time
import logging

bp = Blueprint('bhrigu_predictions', __name__, url_prefix='/api/bhrigu-predictions')
logger = setup_logger(__name__)

bhrigu_service = get_bhrigu_service()
logger = logging.getLogger(__name__)


def _get_chart_data(data):
    calculator = get_astrology_calculator()
    cached_birth_data = get_cached_birth_data(data)
    if calculator:
        return calculator.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data.get('place_of_birth', ''),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            timezone_override=sanitize_input(data['timezone'], max_length=64)
            if data.get('timezone') else None
        ), None
    if cached_birth_data:
        return cached_birth_data, None
    return None, dependency_error_response(get_astrology_dependency_error())


def _build_cache_metadata(cached):
    return {
        'zodiac_sign': cached.zodiac_sign,
        'nakshatra': cached.nakshatra,
        'moon_sign': cached.moon_sign,
        'ascendant': cached.ascendant,
        'category': cached.category,
        'from_cache': True,
        'cached_at': cached.created_at.isoformat() if cached.created_at else None,
        'access_count': cached.access_count
    }


def _build_chart_metadata(chart_data, category=None, extra=None):
    metadata = {
        'zodiac_sign': chart_data.get('zodiac_sign'),
        'nakshatra': chart_data.get('nakshatra'),
        'moon_sign': chart_data.get('moon_sign'),
        'ascendant': chart_data.get('ascendant'),
        'category': category,
        'from_cache': False
    }

    if extra:
        metadata.update(extra)

    return metadata


def _sanitize_question_field(data):
    raw_question = data.get('question')
    if raw_question is None:
        return None

    sanitized_question = sanitizeQuestion(raw_question, max_length=500)
    if sanitized_question:
        logger.info("Received sanitized question: %s", sanitized_question)
    else:
        sanitized_question = None

    data['question'] = sanitized_question
    return sanitized_question


@bp.route('/karmic-journey', methods=['POST'])
@limiter.limit("10 per minute")
def karmic_journey():
    """
    Generate comprehensive Karmic Journey analysis
    Discover soul's purpose and life mission through detailed karmic analysis
    """
    try:
        data = request.get_json()
        _sanitize_question_field(data)

        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            # Validate birth data
            validation_error = validate_birth_data(data)
            if validation_error:
                return error_response(validation_error, 400)

        # Check cache first
        cached = BhriguPredictionCache.get_cached_prediction(
            data, 'karmic_journey', data.get('question')
        )

        if cached and not data.get('force_regenerate'):
            cached_prediction = cached.to_dict().get('prediction')
            return prediction_response(
                cached_prediction,
                metadata=_build_cache_metadata(cached),
                message="Retrieved from Bhrigu wisdom cache"
            )

        chart_data, error = _get_chart_data(data)
        if error:
            return error

        # Merge chart data with input
        birth_data = {**data, **chart_data}

        # Generate prediction
        prediction = _generate_prediction(
            "karmic_journey",
            birth_data,
            lambda: bhrigu_service.generate_karmic_journey_prediction(
                birth_data,
                data.get('question')
            )
        )

        # Cache the prediction
        metadata = {
            'zodiac_sign': chart_data.get('zodiac_sign'),
            'nakshatra': chart_data.get('nakshatra'),
            'moon_sign': chart_data.get('moon_sign'),
            'ascendant': chart_data.get('ascendant'),
            'ai_model': 'gpt-4'
        }

        BhriguPredictionCache.cache_prediction(
            birth_data,
            'karmic_journey',
            prediction,
            data.get('question'),
            metadata
        )

        return prediction_response(
            prediction,
            metadata=_build_chart_metadata(chart_data, category='karmic_journey', extra=metadata)
        )

    except Exception as e:
        log_error(logger, e, "Error in karmic_journey")
        return prediction_error_response(
            f"Failed to generate karmic journey analysis: {sanitize_error(str(e))}",
            500,
            metadata={'category': 'karmic_journey'}
        )


@bp.route('/past-lives', methods=['POST'])
@limiter.limit("10 per minute")
def past_lives():
    """
    Generate Past Lives analysis
    Explore previous incarnations and karmic patterns across lifetimes
    """
    try:
        data = request.get_json()
        _sanitize_question_field(data)
        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            validation_error = validate_birth_data(data)
            if validation_error:
                return error_response(validation_error, 400)

        # Check cache
        cached = BhriguPredictionCache.get_cached_prediction(
            data, 'past_lives', data.get('question')
        )
        if cached and not data.get('force_regenerate'):
            cached_prediction = cached.to_dict().get('prediction')
            return prediction_response(
                cached_prediction,
                metadata=_build_cache_metadata(cached),
                message="From cache"
            )

        chart_validation_error = validate_chart_inputs(data)
        if chart_validation_error:
            return error_response(chart_validation_error, 400)

        # Calculate and generate
        chart_data, error = _get_chart_data(data)
        if error:
            return error
        birth_data = {**data, **chart_data}

        prediction = _generate_prediction(
            "past_lives",
            birth_data,
            lambda: bhrigu_service.generate_past_lives_prediction(
                birth_data, data.get('question')
            )
        )

        # Cache
        BhriguPredictionCache.cache_prediction(
            birth_data, 'past_lives', prediction, data.get('question'),
            {'zodiac_sign': chart_data.get('zodiac_sign'),
             'nakshatra': chart_data.get('nakshatra')}
        )

        return prediction_response(
            prediction,
            metadata=_build_chart_metadata(chart_data, category='past_lives')
        )

    except Exception as e:
        log_error(logger, e, "Error in past_lives")
        return prediction_error_response(
            f"Failed to generate past lives analysis: {sanitize_error(str(e))}",
            500,
            metadata={'category': 'past_lives'}
        )


@bp.route('/future-lives', methods=['POST'])
@limiter.limit("10 per minute")
def future_lives():
    """
    Generate Future Lives prediction
    Envision soul's evolution and future incarnation possibilities
    """
    try:
        data = request.get_json()
        _sanitize_question_field(data)
        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            validation_error = validate_birth_data(data)
            if validation_error:
                return error_response(validation_error, 400)

        cached = BhriguPredictionCache.get_cached_prediction(
            data, 'future_lives', data.get('question')
        )
        if cached and not data.get('force_regenerate'):
            cached_prediction = cached.to_dict().get('prediction')
            return prediction_response(
                cached_prediction,
                metadata=_build_cache_metadata(cached),
                message="From cache"
            )

        chart_data, error = _get_chart_data(data)
        if error:
            return error
        birth_data = {**data, **chart_data}

        prediction = _generate_prediction(
            "future_lives",
            birth_data,
            lambda: bhrigu_service.generate_future_lives_prediction(
                birth_data, data.get('question')
            )
        )

        BhriguPredictionCache.cache_prediction(
            birth_data, 'future_lives', prediction, data.get('question'),
            {'zodiac_sign': chart_data.get('zodiac_sign'),
             'nakshatra': chart_data.get('nakshatra')}
        )

        return prediction_response(
            prediction,
            metadata=_build_chart_metadata(chart_data, category='future_lives')
        )

    except Exception as e:
        log_error(logger, e, "Error in future_lives")
        return prediction_error_response(
            f"Failed to generate future lives prediction: {sanitize_error(str(e))}",
            500,
            metadata={'category': 'future_lives'}
        )


@bp.route('/present-life', methods=['POST'])
@limiter.limit("10 per minute")
def present_life():
    """
    Generate Present Life comprehensive analysis
    Detailed analysis of current life opportunities and challenges
    """
    try:
        data = request.get_json()
        _sanitize_question_field(data)
        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            validation_error = validate_birth_data(data)
            if validation_error:
                return error_response(validation_error, 400)

        cached = BhriguPredictionCache.get_cached_prediction(
            data, 'present_life', data.get('question')
        )
        if cached and not data.get('force_regenerate'):
            cached_prediction = cached.to_dict().get('prediction')
            return prediction_response(
                cached_prediction,
                metadata=_build_cache_metadata(cached),
                message="From cache"
            )

        chart_data, error = _get_chart_data(data)
        if error:
            return error
        birth_data = {**data, **chart_data}

        prediction = _generate_prediction(
            "present_life",
            birth_data,
            lambda: bhrigu_service.generate_present_life_prediction(
                birth_data, data.get('question')
            )
        )

        BhriguPredictionCache.cache_prediction(
            birth_data, 'present_life', prediction, data.get('question'),
            {'zodiac_sign': chart_data.get('zodiac_sign'),
             'nakshatra': chart_data.get('nakshatra')}
        )

        return prediction_response(
            prediction,
            metadata=_build_chart_metadata(chart_data, category='present_life')
        )

    except Exception as e:
        log_error(logger, e, "Error in present_life")
        return prediction_error_response(
            f"Failed to generate present life analysis: {sanitize_error(str(e))}",
            500,
            metadata={'category': 'present_life'}
        )


@bp.route('/life-events', methods=['POST'])
@limiter.limit("10 per minute")
def life_events():
    """
    Generate Life Events prediction with precision timing
    Predict major transitions and events with month-level accuracy
    """
    try:
        data = request.get_json()
        _sanitize_question_field(data)
        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            validation_error = validate_birth_data(data)
            if validation_error:
                return error_response(validation_error, 400)

        cached = BhriguPredictionCache.get_cached_prediction(
            data, 'life_events', data.get('question')
        )
        if cached and not data.get('force_regenerate'):
            cached_prediction = cached.to_dict().get('prediction')
            return prediction_response(
                cached_prediction,
                metadata=_build_cache_metadata(cached),
                message="From cache"
            )

        chart_data, error = _get_chart_data(data)
        if error:
            return error
        birth_data = {**data, **chart_data}

        prediction = _generate_prediction(
            "life_events",
            birth_data,
            lambda: bhrigu_service.generate_life_events_prediction(
                birth_data, data.get('question')
            )
        )

        BhriguPredictionCache.cache_prediction(
            birth_data, 'life_events', prediction, data.get('question'),
            {'zodiac_sign': chart_data.get('zodiac_sign'),
             'nakshatra': chart_data.get('nakshatra')}
        )

        return prediction_response(
            prediction,
            metadata=_build_chart_metadata(chart_data, category='life_events')
        )

    except Exception as e:
        log_error(logger, e, "Error in life_events")
        return prediction_error_response(
            f"Failed to generate life events prediction: {sanitize_error(str(e))}",
            500,
            metadata={'category': 'life_events'}
        )


@bp.route('/karmic-remedies', methods=['POST'])
@limiter.limit("10 per minute")
def karmic_remedies():
    """
    Generate Karmic Remedies
    Personalized spiritual practices and remedies for balance
    """
    try:
        data = request.get_json()
        _sanitize_question_field(data)
        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            validation_error = validate_birth_data(data)
            if validation_error:
                return error_response(validation_error, 400)

        cached = BhriguPredictionCache.get_cached_prediction(
            data, 'karmic_remedies', data.get('question')
        )
        if cached and not data.get('force_regenerate'):
            cached_prediction = cached.to_dict().get('prediction')
            return prediction_response(
                cached_prediction,
                metadata=_build_cache_metadata(cached),
                message="From cache"
            )

        chart_data, error = _get_chart_data(data)
        if error:
            return error
        birth_data = {**data, **chart_data}

        prediction = _generate_prediction(
            "karmic_remedies",
            birth_data,
            lambda: bhrigu_service.generate_karmic_remedies_prediction(
                birth_data, data.get('question')
            )
        )

        BhriguPredictionCache.cache_prediction(
            birth_data, 'karmic_remedies', prediction, data.get('question'),
            {'zodiac_sign': chart_data.get('zodiac_sign'),
             'nakshatra': chart_data.get('nakshatra')}
        )

        return prediction_response(
            prediction,
            metadata=_build_chart_metadata(chart_data, category='karmic_remedies')
        )

    except Exception as e:
        log_error(logger, e, "Error in karmic_remedies")
        return prediction_error_response(
            f"Failed to generate karmic remedies: {sanitize_error(str(e))}",
            500,
            metadata={'category': 'karmic_remedies'}
        )


@bp.route('/relationships', methods=['POST'])
@limiter.limit("10 per minute")
def relationships():
    """
    Generate Relationships analysis
    Soul connections and compatibility for deeper bonds
    """
    try:
        data = request.get_json()
        _sanitize_question_field(data)
        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            validation_error = validate_birth_data(data)
            if validation_error:
                return error_response(validation_error, 400)

        cached = BhriguPredictionCache.get_cached_prediction(
            data, 'relationships', data.get('question')
        )
        if cached and not data.get('force_regenerate'):
            cached_prediction = cached.to_dict().get('prediction')
            return prediction_response(
                cached_prediction,
                metadata=_build_cache_metadata(cached),
                message="From cache"
            )

        chart_data, error = _get_chart_data(data)
        if error:
            return error
        birth_data = {**data, **chart_data}

        prediction = _generate_prediction(
            "relationships",
            birth_data,
            lambda: bhrigu_service.generate_relationships_prediction(
                birth_data, data.get('question')
            )
        )

        BhriguPredictionCache.cache_prediction(
            birth_data, 'relationships', prediction, data.get('question'),
            {'zodiac_sign': chart_data.get('zodiac_sign'),
             'nakshatra': chart_data.get('nakshatra')}
        )

        return prediction_response(
            prediction,
            metadata=_build_chart_metadata(chart_data, category='relationships')
        )

    except Exception as e:
        log_error(logger, e, "Error in relationships")
        return prediction_error_response(
            f"Failed to generate relationships analysis: {sanitize_error(str(e))}",
            500,
            metadata={'category': 'relationships'}
        )


@bp.route('/predictions', methods=['POST'])
@limiter.limit("20 per minute")
def predictions():
    """
    Generate General Predictions
    Daily, weekly, monthly, and yearly forecasts with actionable insights
    """
    try:
        data = request.get_json()
        _sanitize_question_field(data)
        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            validation_error = validate_birth_data(data)
            if validation_error:
                return error_response(validation_error, 400)

        cached = BhriguPredictionCache.get_cached_prediction(
            data, 'predictions', data.get('question')
        )
        if cached and not data.get('force_regenerate'):
            cached_prediction = cached.to_dict().get('prediction')
            return prediction_response(
                cached_prediction,
                metadata=_build_cache_metadata(cached),
                message="From cache"
            )

        chart_data, error = _get_chart_data(data)
        if error:
            return error
        birth_data = {**data, **chart_data}

        prediction = _generate_prediction(
            "predictions",
            birth_data,
            lambda: bhrigu_service.generate_general_predictions(
                birth_data, data.get('question')
            )
        )

        BhriguPredictionCache.cache_prediction(
            birth_data, 'predictions', prediction, data.get('question'),
            {'zodiac_sign': chart_data.get('zodiac_sign'),
             'nakshatra': chart_data.get('nakshatra')}
        )

        return prediction_response(
            prediction,
            metadata=_build_chart_metadata(chart_data, category='predictions')
        )

    except Exception as e:
        log_error(logger, e, "Error in predictions")
        return prediction_error_response(
            f"Failed to generate predictions: {sanitize_error(str(e))}",
            500,
            metadata={'category': 'predictions'}
        )


@bp.route('/wisdom-search', methods=['POST'])
@limiter.limit("30 per minute")
def wisdom_search():
    """
    Search Bhrigu wisdom database
    Access accumulated knowledge from previous predictions
    """
    try:
        data = request.get_json()
        _sanitize_question_field(data)

        category = data.get('category')
        zodiac_sign = data.get('zodiac_sign')
        nakshatra = data.get('nakshatra')
        limit = min(int(data.get('limit', 10)), 50)  # Max 50 results

        wisdom_entries = BhriguWisdomEntry.get_wisdom_for_context(
            category, zodiac_sign, nakshatra, limit
        )

        return success_response({
            'wisdom_entries': [entry.to_dict() for entry in wisdom_entries],
            'count': len(wisdom_entries),
            'category': category,
            'filters': {
                'zodiac_sign': zodiac_sign,
                'nakshatra': nakshatra
            }
        })

    except Exception as e:
        log_error(logger, e, "Error in wisdom_search")
        return error_response(f"Failed to search wisdom: {sanitize_error(str(e))}", 500)


@bp.route('/cache-stats', methods=['GET'])
def cache_stats():
    """
    Get cache statistics
    View accumulated prediction knowledge
    """
    try:
        total_predictions = BhriguPredictionCache.query.count()
        total_wisdom = BhriguWisdomEntry.query.count()

        categories_stats = db.session.query(
            BhriguPredictionCache.category,
            db.func.count(BhriguPredictionCache.id).label('count')
        ).group_by(BhriguPredictionCache.category).all()

        return success_response({
            'total_predictions_cached': total_predictions,
            'total_wisdom_entries': total_wisdom,
            'categories': {cat: count for cat, count in categories_stats},
            'cache_enabled': True,
            'expanding_knowledge_base': True
        })

    except Exception as e:
        log_error(logger, e, "Error in cache_stats")
        return error_response(f"Failed to get cache stats: {sanitize_error(str(e))}", 500)


@bp.route('/session/start', methods=['POST'])
def start_session():
    """
    Start a new Bhrigu predictions session
    Tracks user journey for analytics
    """
    try:
        session_id = str(uuid.uuid4())
        data = request.get_json()

        session_log = BhriguSessionLog(
            session_id=session_id,
            user_hash=data.get('user_hash'),
            categories_accessed=json.dumps([]),
            session_start=datetime.utcnow()
        )

        db.session.add(session_log)
        db.session.commit()

        return success_response({
            'session_id': session_id,
            'started_at': session_log.session_start.isoformat()
        })

    except Exception as e:
        log_error(logger, e, "Error starting session")
        return error_response(f"Failed to start session: {sanitize_error(str(e))}", 500)


@bp.route('/comprehensive', methods=['POST'])
@limiter.limit("5 per minute")
def comprehensive_prediction():
    """
    Generate comprehensive prediction for ALL categories
    Complete Bhrigu Samhita analysis covering all 8 aspects
    """
    try:
        data = request.get_json()
        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)
        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            validation_error = validate_birth_data(data)
            if validation_error:
                return error_response(validation_error, 400)

        # Calculate birth chart once
        chart_data, error = _get_chart_data(data)
        if error:
            return error
        birth_data = {**data, **chart_data}

        # Generate all 8 categories
        categories = [
            'karmic_journey', 'past_lives', 'future_lives', 'present_life',
            'life_events', 'karmic_remedies', 'relationships', 'predictions'
        ]

        comprehensive_result = {}

        for category in categories:
            # Check cache for each category
            cached = BhriguPredictionCache.get_cached_prediction(
                birth_data, category
            )

            if cached and not data.get('force_regenerate'):
                comprehensive_result[category] = cached.to_dict()
            else:
                # Generate new prediction
                prediction = _generate_prediction(
                    category,
                    birth_data,
                    lambda: bhrigu_service.generate_comprehensive_prediction(
                        birth_data, category
                    )
                )

                # Cache it
                metadata = {
                    'zodiac_sign': chart_data.get('zodiac_sign'),
                    'nakshatra': chart_data.get('nakshatra'),
                    'moon_sign': chart_data.get('moon_sign'),
                    'ascendant': chart_data.get('ascendant')
                }
                BhriguPredictionCache.cache_prediction(
                    birth_data, category, prediction, None, metadata
                )

                comprehensive_result[category] = prediction

        return prediction_response(
            {
                'comprehensive_analysis': comprehensive_result,
                'birth_data': {
                    'zodiac_sign': chart_data.get('zodiac_sign'),
                    'nakshatra': chart_data.get('nakshatra'),
                    'moon_sign': chart_data.get('moon_sign'),
                    'ascendant': chart_data.get('ascendant')
                },
                'categories_included': categories,
                'generated_at': datetime.utcnow().isoformat()
            },
            metadata=_build_chart_metadata(chart_data, category='comprehensive')
        )

    except Exception as e:
        log_error(logger, e, "Error in comprehensive_prediction")
        return prediction_error_response(
            f"Failed to generate comprehensive prediction: {sanitize_error(str(e))}",
            500,
            metadata={'category': 'comprehensive'}
        )


# Error handlers for this blueprint
@bp.errorhandler(429)
def ratelimit_handler(e):
    return prediction_error_response("Rate limit exceeded. Please try again later.", 429)


@bp.errorhandler(Exception)
def handle_error(e):
    log_error(logger, e, "Unhandled error in bhrigu_predictions")
    return prediction_error_response("An unexpected error occurred", 500)

"""
Bhrigu Predictions Routes
Handles all Bhrigu Samhita and Nadi Jyotisa prediction requests
"""
from flask import Blueprint, request, jsonify
from services.bhrigu_predictions import get_bhrigu_service
from services.prediction_orchestrator import PredictionOrchestrator
from services.astrology_calculator import AstrologyCalculator
from services.health_reporter import get_health_reporter
from models import db, BhriguPredictionCache, BhriguWisdomEntry, BhriguSessionLog
from middleware.rate_limiter import limiter
from utils.validators import validate_birth_data
from utils.response_formatter import success_response, error_response
import traceback
from datetime import datetime
from typing import Optional
import uuid
import json
import time

bp = Blueprint('bhrigu_predictions', __name__, url_prefix='/api/bhrigu-predictions')

bhrigu_service = get_bhrigu_service()
astrology_calc = AstrologyCalculator()
prediction_orchestrator = PredictionOrchestrator()

TRANSIENT_ERROR_HINTS = (
    "rate limit",
    "timeout",
    "temporarily unavailable",
    "service unavailable",
    "connection error",
    "connection aborted",
    "connection reset",
    "bad gateway",
    "gateway timeout",
    "openai",
    "502",
    "503",
    "504",
)


def _is_transient_openai_error(error: Exception) -> bool:
    message = str(error).lower()
    return any(hint in message for hint in TRANSIENT_ERROR_HINTS)


def _is_corpus_available() -> bool:
    corpus_db = getattr(bhrigu_service, "corpus_db", None)
    if not corpus_db:
        return False
    corpus_data = getattr(corpus_db, "local_corpus", {})
    return any(bool(section) for section in corpus_data.values())


def _fallback_mode() -> Optional[str]:
    openai_enabled = bool(getattr(bhrigu_service.openai_service, "enabled", False))
    if not openai_enabled:
        return "offline"
    if not _is_corpus_available():
        return "hybrid"
    return None


def _generate_prediction(category: str, birth_data: dict, generator):
    fallback_mode = _fallback_mode()
    if fallback_mode:
        return prediction_orchestrator.generate_prediction(
            category, birth_data, mode=fallback_mode
        )

    for attempt in range(1, 4):
        try:
            return generator()
        except Exception as exc:
            if not _is_transient_openai_error(exc) or attempt == 3:
                raise
            time.sleep(0.75 * attempt)


@bp.route('/karmic-journey', methods=['POST'])
@limiter.limit("10 per minute")
def karmic_journey():
    """
    Generate comprehensive Karmic Journey analysis
    Discover soul's purpose and life mission through detailed karmic analysis
    """
    try:
        data = request.get_json()

        # Validate birth data
        validation_error = validate_birth_data(data)
        if validation_error:
            return error_response(
                validation_error,
                400,
                error_code="VALIDATION_ERROR",
                retryable=False
            )

        # Check cache first
        cached = BhriguPredictionCache.get_cached_prediction(
            data, 'karmic_journey', data.get('question')
        )

        if cached and not data.get('force_regenerate'):
            return success_response(
                cached.to_dict(),
                message="Retrieved from Bhrigu wisdom cache"
            )

        chart_validation_error = validate_chart_inputs(data)
        if chart_validation_error:
            return error_response(chart_validation_error, 400)

        # Calculate birth chart
        chart_data = astrology_calc.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data.get('place_of_birth', ''),
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        chart_error = chart_error_response(chart_data)
        if chart_error:
            return chart_error

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

        return success_response({'prediction': prediction})

    except Exception as e:
        print(f"Error in karmic_journey: {str(e)}")
        traceback.print_exc()
        retryable = _is_transient_openai_error(e)
        return error_response(
            f"Failed to generate karmic journey analysis: {str(e)}",
            503 if retryable else 500,
            error_code="OPENAI_RETRYABLE_ERROR" if retryable else "PREDICTION_FAILED",
            retryable=retryable
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
        validation_error = validate_birth_data(data)
        if validation_error:
            return error_response(
                validation_error,
                400,
                error_code="VALIDATION_ERROR",
                retryable=False
            )

        # Check cache
        cached = BhriguPredictionCache.get_cached_prediction(
            data, 'past_lives', data.get('question')
        )
        if cached and not data.get('force_regenerate'):
            return success_response(cached.to_dict(), message="From cache")

        chart_validation_error = validate_chart_inputs(data)
        if chart_validation_error:
            return error_response(chart_validation_error, 400)

        # Calculate and generate
        chart_data = astrology_calc.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data.get('place_of_birth', ''),
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        chart_error = chart_error_response(chart_data)
        if chart_error:
            return chart_error
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

        return success_response({'prediction': prediction})

    except Exception as e:
        print(f"Error in past_lives: {str(e)}")
        traceback.print_exc()
        retryable = _is_transient_openai_error(e)
        return error_response(
            f"Failed to generate past lives analysis: {str(e)}",
            503 if retryable else 500,
            error_code="OPENAI_RETRYABLE_ERROR" if retryable else "PREDICTION_FAILED",
            retryable=retryable
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
        validation_error = validate_birth_data(data)
        if validation_error:
            return error_response(
                validation_error,
                400,
                error_code="VALIDATION_ERROR",
                retryable=False
            )

        cached = BhriguPredictionCache.get_cached_prediction(
            data, 'future_lives', data.get('question')
        )
        if cached and not data.get('force_regenerate'):
            return success_response(cached.to_dict(), message="From cache")

        chart_validation_error = validate_chart_inputs(data)
        if chart_validation_error:
            return error_response(chart_validation_error, 400)

        chart_data = astrology_calc.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data.get('place_of_birth', ''),
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        chart_error = chart_error_response(chart_data)
        if chart_error:
            return chart_error
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

        return success_response({'prediction': prediction})

    except Exception as e:
        print(f"Error in future_lives: {str(e)}")
        traceback.print_exc()
        retryable = _is_transient_openai_error(e)
        return error_response(
            f"Failed to generate future lives prediction: {str(e)}",
            503 if retryable else 500,
            error_code="OPENAI_RETRYABLE_ERROR" if retryable else "PREDICTION_FAILED",
            retryable=retryable
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
        validation_error = validate_birth_data(data)
        if validation_error:
            return error_response(
                validation_error,
                400,
                error_code="VALIDATION_ERROR",
                retryable=False
            )

        cached = BhriguPredictionCache.get_cached_prediction(
            data, 'present_life', data.get('question')
        )
        if cached and not data.get('force_regenerate'):
            return success_response(cached.to_dict(), message="From cache")

        chart_validation_error = validate_chart_inputs(data)
        if chart_validation_error:
            return error_response(chart_validation_error, 400)

        chart_data = astrology_calc.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data.get('place_of_birth', ''),
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        chart_error = chart_error_response(chart_data)
        if chart_error:
            return chart_error
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

        return success_response({'prediction': prediction})

    except Exception as e:
        print(f"Error in present_life: {str(e)}")
        traceback.print_exc()
        retryable = _is_transient_openai_error(e)
        return error_response(
            f"Failed to generate present life analysis: {str(e)}",
            503 if retryable else 500,
            error_code="OPENAI_RETRYABLE_ERROR" if retryable else "PREDICTION_FAILED",
            retryable=retryable
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
        validation_error = validate_birth_data(data)
        if validation_error:
            return error_response(
                validation_error,
                400,
                error_code="VALIDATION_ERROR",
                retryable=False
            )

        cached = BhriguPredictionCache.get_cached_prediction(
            data, 'life_events', data.get('question')
        )
        if cached and not data.get('force_regenerate'):
            return success_response(cached.to_dict(), message="From cache")

        chart_validation_error = validate_chart_inputs(data)
        if chart_validation_error:
            return error_response(chart_validation_error, 400)

        chart_data = astrology_calc.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data.get('place_of_birth', ''),
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        chart_error = chart_error_response(chart_data)
        if chart_error:
            return chart_error
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

        return success_response({'prediction': prediction})

    except Exception as e:
        print(f"Error in life_events: {str(e)}")
        traceback.print_exc()
        retryable = _is_transient_openai_error(e)
        return error_response(
            f"Failed to generate life events prediction: {str(e)}",
            503 if retryable else 500,
            error_code="OPENAI_RETRYABLE_ERROR" if retryable else "PREDICTION_FAILED",
            retryable=retryable
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
        validation_error = validate_birth_data(data)
        if validation_error:
            return error_response(
                validation_error,
                400,
                error_code="VALIDATION_ERROR",
                retryable=False
            )

        cached = BhriguPredictionCache.get_cached_prediction(
            data, 'karmic_remedies', data.get('question')
        )
        if cached and not data.get('force_regenerate'):
            return success_response(cached.to_dict(), message="From cache")

        chart_validation_error = validate_chart_inputs(data)
        if chart_validation_error:
            return error_response(chart_validation_error, 400)

        chart_data = astrology_calc.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data.get('place_of_birth', ''),
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        chart_error = chart_error_response(chart_data)
        if chart_error:
            return chart_error
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

        return success_response({'prediction': prediction})

    except Exception as e:
        print(f"Error in karmic_remedies: {str(e)}")
        traceback.print_exc()
        retryable = _is_transient_openai_error(e)
        return error_response(
            f"Failed to generate karmic remedies: {str(e)}",
            503 if retryable else 500,
            error_code="OPENAI_RETRYABLE_ERROR" if retryable else "PREDICTION_FAILED",
            retryable=retryable
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
        validation_error = validate_birth_data(data)
        if validation_error:
            return error_response(
                validation_error,
                400,
                error_code="VALIDATION_ERROR",
                retryable=False
            )

        cached = BhriguPredictionCache.get_cached_prediction(
            data, 'relationships', data.get('question')
        )
        if cached and not data.get('force_regenerate'):
            return success_response(cached.to_dict(), message="From cache")

        chart_validation_error = validate_chart_inputs(data)
        if chart_validation_error:
            return error_response(chart_validation_error, 400)

        chart_data = astrology_calc.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data.get('place_of_birth', ''),
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        chart_error = chart_error_response(chart_data)
        if chart_error:
            return chart_error
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

        return success_response({'prediction': prediction})

    except Exception as e:
        print(f"Error in relationships: {str(e)}")
        traceback.print_exc()
        retryable = _is_transient_openai_error(e)
        return error_response(
            f"Failed to generate relationships analysis: {str(e)}",
            503 if retryable else 500,
            error_code="OPENAI_RETRYABLE_ERROR" if retryable else "PREDICTION_FAILED",
            retryable=retryable
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
        validation_error = validate_birth_data(data)
        if validation_error:
            return error_response(
                validation_error,
                400,
                error_code="VALIDATION_ERROR",
                retryable=False
            )

        cached = BhriguPredictionCache.get_cached_prediction(
            data, 'predictions', data.get('question')
        )
        if cached and not data.get('force_regenerate'):
            return success_response(cached.to_dict(), message="From cache")

        chart_validation_error = validate_chart_inputs(data)
        if chart_validation_error:
            return error_response(chart_validation_error, 400)

        chart_data = astrology_calc.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data.get('place_of_birth', ''),
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        chart_error = chart_error_response(chart_data)
        if chart_error:
            return chart_error
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

        return success_response({'prediction': prediction})

    except Exception as e:
        print(f"Error in predictions: {str(e)}")
        traceback.print_exc()
        retryable = _is_transient_openai_error(e)
        return error_response(
            f"Failed to generate predictions: {str(e)}",
            503 if retryable else 500,
            error_code="OPENAI_RETRYABLE_ERROR" if retryable else "PREDICTION_FAILED",
            retryable=retryable
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
        print(f"Error in wisdom_search: {str(e)}")
        return error_response(f"Failed to search wisdom: {str(e)}", 500)


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
        print(f"Error in cache_stats: {str(e)}")
        return error_response(f"Failed to get cache stats: {str(e)}", 500)


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
        print(f"Error starting session: {str(e)}")
        return error_response(f"Failed to start session: {str(e)}", 500)


@bp.route('/comprehensive', methods=['POST'])
@limiter.limit("5 per minute")
def comprehensive_prediction():
    """
    Generate comprehensive prediction for ALL categories
    Complete Bhrigu Samhita analysis covering all 8 aspects
    """
    try:
        data = request.get_json()
        validation_error = validate_birth_data(data)
        if validation_error:
            return error_response(
                validation_error,
                400,
                error_code="VALIDATION_ERROR",
                retryable=False
            )

        chart_validation_error = validate_chart_inputs(data)
        if chart_validation_error:
            return error_response(chart_validation_error, 400)

        # Calculate birth chart once
        chart_data = astrology_calc.calculate_birth_chart(
            date_of_birth=data['date_of_birth'],
            time_of_birth=data['time_of_birth'],
            place=data.get('place_of_birth', ''),
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        chart_error = chart_error_response(chart_data)
        if chart_error:
            return chart_error
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

        return success_response({
            'comprehensive_analysis': comprehensive_result,
            'birth_data': {
                'zodiac_sign': chart_data.get('zodiac_sign'),
                'nakshatra': chart_data.get('nakshatra'),
                'moon_sign': chart_data.get('moon_sign'),
                'ascendant': chart_data.get('ascendant')
            },
            'categories_included': categories,
            'generated_at': datetime.utcnow().isoformat()
        })

    except Exception as e:
        print(f"Error in comprehensive_prediction: {str(e)}")
        traceback.print_exc()
        retryable = _is_transient_openai_error(e)
        return error_response(
            f"Failed to generate comprehensive prediction: {str(e)}",
            503 if retryable else 500,
            error_code="OPENAI_RETRYABLE_ERROR" if retryable else "PREDICTION_FAILED",
            retryable=retryable
        )


# Error handlers for this blueprint
@bp.errorhandler(429)
def ratelimit_handler(e):
    return error_response(
        "Rate limit exceeded. Please try again later.",
        429,
        error_code="RATE_LIMIT",
        retryable=True
    )


@bp.errorhandler(Exception)
def handle_error(e):
    print(f"Unhandled error in bhrigu_predictions: {str(e)}")
    traceback.print_exc()
    return error_response(
        "An unexpected error occurred",
        500,
        error_code="UNEXPECTED_ERROR",
        retryable=False
    )

"""
Daily Insights & Forecasts API Routes
Comprehensive daily, weekly, monthly, and yearly insights
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
from services.daily_insights_engine import get_daily_insights_engine
from services.horoscope_engine import get_horoscope_engine
from services.astrology_calculator import get_astrology_calculator, get_astrology_dependency_error
from utils.response_formatter import prediction_response, prediction_error_response
from utils.astrology_helpers import dependency_error_response, get_cached_birth_data, handle_birth_chart_error
from utils.client_status import parse_client_online
from utils.validators import sanitize_input
from utils.logger import setup_logger, log_exception

logger = setup_logger(__name__)

bp = Blueprint('daily_insights', __name__, url_prefix='/api/insights')


@bp.route('/daily', methods=['POST'])
def get_daily_insight():
    """
    Get comprehensive daily insight

    Request body:
    {
        "date_of_birth": "1990-01-15",
        "time_of_birth": "10:30",
        "place_of_birth": "Mumbai, India",
        "timezone": "Asia/Kolkata",
        "target_date": "2024-01-20" (optional)
    }
    """
    try:
        data = request.get_json()

        # Get calculator
        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)

        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        # Calculate or use cached birth chart
        if calculator:
            birth_chart = calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=data['place_of_birth'],
                timezone_override=sanitize_input(data.get('timezone'), max_length=64)
            )

            error_response = handle_birth_chart_error(birth_chart)
            if error_response:
                return error_response
        else:
            birth_chart = cached_birth_data

        # Parse target date
        target_date = None
        if data.get('target_date'):
            try:
                target_date = datetime.strptime(data['target_date'], '%Y-%m-%d')
            except ValueError:
                pass

        # Generate daily insight
        engine = get_daily_insights_engine()
        insight = engine.generate_daily_insight(birth_chart, target_date)

        return prediction_response(
            insight,
            metadata={
                'type': 'daily_insight',
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'moon_sign': birth_chart.get('moon_sign'),
                'nakshatra': birth_chart.get('nakshatra')
            }
        )

    except KeyError as e:
        logger.warning(f"Missing required field in daily insight: {e}")
        return prediction_error_response(f"Missing required field: {str(e)}", 400)
    except Exception as e:
        log_exception(logger, e, context="daily_insights.daily")
        return prediction_error_response(
            "Failed to generate daily insight. Please try again.",
            500
        )


@bp.route('/weekly', methods=['POST'])
def get_weekly_forecast():
    """
    Get 7-day weekly forecast
    """
    try:
        data = request.get_json()

        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)

        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            birth_chart = calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=data['place_of_birth'],
                timezone_override=sanitize_input(data.get('timezone'), max_length=64)
            )

            error_response = handle_birth_chart_error(birth_chart)
            if error_response:
                return error_response
        else:
            birth_chart = cached_birth_data

        # Parse start date
        start_date = None
        if data.get('start_date'):
            try:
                start_date = datetime.strptime(data['start_date'], '%Y-%m-%d')
            except ValueError:
                pass

        engine = get_daily_insights_engine()
        forecast = engine.generate_weekly_forecast(birth_chart, start_date)

        return prediction_response(
            forecast,
            metadata={
                'type': 'weekly_forecast',
                'zodiac_sign': birth_chart.get('zodiac_sign')
            }
        )

    except KeyError as e:
        logger.warning(f"Missing required field in weekly forecast: {e}")
        return prediction_error_response(f"Missing required field: {str(e)}", 400)
    except Exception as e:
        log_exception(logger, e, context="daily_insights.weekly")
        return prediction_error_response(
            "Failed to generate weekly forecast. Please try again.",
            500
        )


@bp.route('/monthly', methods=['POST'])
def get_monthly_forecast():
    """
    Get monthly forecast
    """
    try:
        data = request.get_json()

        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)

        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            birth_chart = calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=data['place_of_birth'],
                timezone_override=sanitize_input(data.get('timezone'), max_length=64)
            )

            error_response = handle_birth_chart_error(birth_chart)
            if error_response:
                return error_response
        else:
            birth_chart = cached_birth_data

        # Get year and month
        year = data.get('year')
        month = data.get('month')

        engine = get_daily_insights_engine()
        forecast = engine.generate_monthly_forecast(birth_chart, year, month)

        return prediction_response(
            forecast,
            metadata={
                'type': 'monthly_forecast',
                'zodiac_sign': birth_chart.get('zodiac_sign')
            }
        )

    except KeyError as e:
        logger.warning(f"Missing required field in monthly forecast: {e}")
        return prediction_error_response(f"Missing required field: {str(e)}", 400)
    except Exception as e:
        log_exception(logger, e, context="daily_insights.monthly")
        return prediction_error_response(
            "Failed to generate monthly forecast. Please try again.",
            500
        )


@bp.route('/yearly', methods=['POST'])
def get_yearly_forecast():
    """
    Get yearly forecast
    """
    try:
        data = request.get_json()

        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)

        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            birth_chart = calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=data['place_of_birth'],
                timezone_override=sanitize_input(data.get('timezone'), max_length=64)
            )

            error_response = handle_birth_chart_error(birth_chart)
            if error_response:
                return error_response
        else:
            birth_chart = cached_birth_data

        year = data.get('year')

        engine = get_daily_insights_engine()
        forecast = engine.generate_yearly_forecast(birth_chart, year)

        return prediction_response(
            forecast,
            metadata={
                'type': 'yearly_forecast',
                'zodiac_sign': birth_chart.get('zodiac_sign')
            }
        )

    except KeyError as e:
        logger.warning(f"Missing required field in yearly forecast: {e}")
        return prediction_error_response(f"Missing required field: {str(e)}", 400)
    except Exception as e:
        log_exception(logger, e, context="daily_insights.yearly")
        return prediction_error_response(
            "Failed to generate yearly forecast. Please try again.",
            500
        )


# Horoscope routes

@bp.route('/horoscope/daily', methods=['POST'])
def get_daily_horoscope():
    """
    Get daily horoscope based on Bhrigu Samhita
    """
    try:
        data = request.get_json()

        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)

        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            birth_chart = calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=data['place_of_birth'],
                timezone_override=sanitize_input(data.get('timezone'), max_length=64)
            )

            error_response = handle_birth_chart_error(birth_chart)
            if error_response:
                return error_response
        else:
            birth_chart = cached_birth_data

        target_date = None
        if data.get('target_date'):
            try:
                target_date = datetime.strptime(data['target_date'], '%Y-%m-%d')
            except ValueError:
                pass

        engine = get_horoscope_engine()
        horoscope = engine.generate_daily_horoscope(birth_chart, target_date)

        return prediction_response(
            horoscope,
            metadata={
                'type': 'daily_horoscope',
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'tradition': 'Bhrigu Samhita'
            }
        )

    except KeyError as e:
        logger.warning(f"Missing required field in daily horoscope: {e}")
        return prediction_error_response(f"Missing required field: {str(e)}", 400)
    except Exception as e:
        log_exception(logger, e, context="horoscope.daily")
        return prediction_error_response(
            "Failed to generate daily horoscope. Please try again.",
            500
        )


@bp.route('/horoscope/weekly', methods=['POST'])
def get_weekly_horoscope():
    """
    Get weekly horoscope based on Bhrigu Samhita
    """
    try:
        data = request.get_json()

        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)

        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            birth_chart = calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=data['place_of_birth'],
                timezone_override=sanitize_input(data.get('timezone'), max_length=64)
            )

            error_response = handle_birth_chart_error(birth_chart)
            if error_response:
                return error_response
        else:
            birth_chart = cached_birth_data

        start_date = None
        if data.get('start_date'):
            try:
                start_date = datetime.strptime(data['start_date'], '%Y-%m-%d')
            except ValueError:
                pass

        engine = get_horoscope_engine()
        horoscope = engine.generate_weekly_horoscope(birth_chart, start_date)

        return prediction_response(
            horoscope,
            metadata={
                'type': 'weekly_horoscope',
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'tradition': 'Bhrigu Samhita'
            }
        )

    except KeyError as e:
        logger.warning(f"Missing required field in weekly horoscope: {e}")
        return prediction_error_response(f"Missing required field: {str(e)}", 400)
    except Exception as e:
        log_exception(logger, e, context="horoscope.weekly")
        return prediction_error_response(
            "Failed to generate weekly horoscope. Please try again.",
            500
        )


@bp.route('/horoscope/monthly', methods=['POST'])
def get_monthly_horoscope():
    """
    Get monthly horoscope based on Bhrigu Samhita
    """
    try:
        data = request.get_json()

        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)

        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            birth_chart = calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=data['place_of_birth'],
                timezone_override=sanitize_input(data.get('timezone'), max_length=64)
            )

            error_response = handle_birth_chart_error(birth_chart)
            if error_response:
                return error_response
        else:
            birth_chart = cached_birth_data

        year = data.get('year')
        month = data.get('month')

        engine = get_horoscope_engine()
        horoscope = engine.generate_monthly_horoscope(birth_chart, year, month)

        return prediction_response(
            horoscope,
            metadata={
                'type': 'monthly_horoscope',
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'tradition': 'Bhrigu Samhita'
            }
        )

    except KeyError as e:
        logger.warning(f"Missing required field in monthly horoscope: {e}")
        return prediction_error_response(f"Missing required field: {str(e)}", 400)
    except Exception as e:
        log_exception(logger, e, context="horoscope.monthly")
        return prediction_error_response(
            "Failed to generate monthly horoscope. Please try again.",
            500
        )


@bp.route('/horoscope/yearly', methods=['POST'])
def get_yearly_horoscope():
    """
    Get yearly horoscope based on Bhrigu Samhita
    """
    try:
        data = request.get_json()

        calculator = get_astrology_calculator()
        cached_birth_data = get_cached_birth_data(data)

        if not calculator and not cached_birth_data:
            return dependency_error_response(get_astrology_dependency_error())

        if calculator:
            birth_chart = calculator.calculate_birth_chart(
                date_of_birth=data['date_of_birth'],
                time_of_birth=data['time_of_birth'],
                place=data['place_of_birth'],
                timezone_override=sanitize_input(data.get('timezone'), max_length=64)
            )

            error_response = handle_birth_chart_error(birth_chart)
            if error_response:
                return error_response
        else:
            birth_chart = cached_birth_data

        year = data.get('year')

        engine = get_horoscope_engine()
        horoscope = engine.generate_yearly_horoscope(birth_chart, year)

        return prediction_response(
            horoscope,
            metadata={
                'type': 'yearly_horoscope',
                'zodiac_sign': birth_chart.get('zodiac_sign'),
                'tradition': 'Bhrigu Samhita'
            }
        )

    except KeyError as e:
        logger.warning(f"Missing required field in yearly horoscope: {e}")
        return prediction_error_response(f"Missing required field: {str(e)}", 400)
    except Exception as e:
        log_exception(logger, e, context="horoscope.yearly")
        return prediction_error_response(
            "Failed to generate yearly horoscope. Please try again.",
            500
        )

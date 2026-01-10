"""
Sentry Error Tracking for Backend
Optional dependency - gracefully degrades if sentry_sdk not available
"""

import os
from utils.logger import setup_logger

logger = setup_logger(__name__)

# Try to import sentry_sdk - it's optional
try:
    import sentry_sdk
    from sentry_sdk.integrations.flask import FlaskIntegration
    SENTRY_AVAILABLE = True

    # Conditionally import CeleryIntegration only if celery is available
    try:
        from sentry_sdk.integrations.celery import CeleryIntegration
        CELERY_AVAILABLE = True
    except (ImportError, Exception):
        CELERY_AVAILABLE = False

except ImportError:
    SENTRY_AVAILABLE = False
    CELERY_AVAILABLE = False
    logger.warning("sentry_sdk not installed - error tracking disabled")


def init_sentry(app=None):
    """
    Initialize Sentry error tracking

    Args:
        app: Flask application instance (optional)
    """
    if not SENTRY_AVAILABLE:
        logger.info('sentry_sdk not installed - error tracking disabled')
        return

    sentry_dsn = os.getenv('SENTRY_DSN')

    if not sentry_dsn:
        logger.info('Sentry DSN not configured - error tracking disabled')
        return

    # Get environment
    environment = os.getenv('FLASK_ENV', 'development')

    # Get release version
    release = os.getenv('APP_VERSION', 'development')

    # Initialize Sentry
    integrations = [FlaskIntegration()]
    if CELERY_AVAILABLE:
        integrations.append(CeleryIntegration())

    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=environment,
        release=release,

        # Integrations
        integrations=integrations,

        # Performance monitoring
        traces_sample_rate=0.1 if environment == 'production' else 1.0,

        # Privacy-friendly settings
        send_default_pii=False,

        # Filter sensitive data
        before_send=before_send_filter,

        # Ignore common errors
        ignore_errors=[
            'ConnectionError',
            'TimeoutError',
            'BrokenPipeError',
        ],
    )

    logger.info('Sentry initialized for environment: %s', environment)


def before_send_filter(event, hint):
    """
    Filter sensitive data before sending to Sentry

    Args:
        event: Sentry event
        hint: Event hint

    Returns:
        Modified event or None to drop
    """
    if not SENTRY_AVAILABLE:
        return None

    # Remove sensitive request data
    if 'request' in event:
        request = event['request']

        # Remove cookies
        if 'cookies' in request:
            del request['cookies']

        # Remove authorization headers
        if 'headers' in request:
            headers = request['headers']
            if isinstance(headers, dict):
                headers.pop('Authorization', None)
                headers.pop('Cookie', None)

    # Remove user IP
    if 'user' in event:
        user = event['user']
        if 'ip_address' in user:
            del user['ip_address']

    # Remove sensitive context data
    if 'contexts' in event:
        contexts = event['contexts']
        if 'birth_data' in contexts:
            del contexts['birth_data']
        if 'profile' in contexts:
            del contexts['profile']

    return event


def capture_exception(error, context=None):
    """
    Capture an exception with optional context

    Args:
        error: Exception to capture
        context: Additional context data
    """
    if not SENTRY_AVAILABLE:
        logger.debug(f"Sentry not available - would have captured: {error}")
        return

    if context:
        with sentry_sdk.push_scope() as scope:
            for key, value in context.items():
                scope.set_extra(key, value)
            sentry_sdk.capture_exception(error)
    else:
        sentry_sdk.capture_exception(error)


def capture_message(message, level='info', context=None):
    """
    Capture a message with optional context

    Args:
        message: Message to capture
        level: Message level (debug, info, warning, error, fatal)
        context: Additional context data
    """
    if not SENTRY_AVAILABLE:
        logger.debug(f"Sentry not available - would have captured message: {message}")
        return

    if context:
        with sentry_sdk.push_scope() as scope:
            for key, value in context.items():
                scope.set_extra(key, value)
            sentry_sdk.capture_message(message, level)
    else:
        sentry_sdk.capture_message(message, level)


def set_user_context(user_id, username=None, email=None):
    """
    Set user context for error tracking

    Args:
        user_id: User ID
        username: Username (optional)
        email: Email (optional, not recommended for privacy)
    """
    if not SENTRY_AVAILABLE:
        return

    sentry_sdk.set_user({
        'id': user_id,
        'username': username,
        # Don't send email for privacy
    })


def clear_user_context():
    """Clear user context"""
    if not SENTRY_AVAILABLE:
        return
    sentry_sdk.set_user(None)


def add_breadcrumb(message, category, data=None, level='info'):
    """
    Add a breadcrumb for debugging

    Args:
        message: Breadcrumb message
        category: Category (e.g., 'query', 'auth', 'navigation')
        data: Additional data
        level: Breadcrumb level
    """
    if not SENTRY_AVAILABLE:
        return

    sentry_sdk.add_breadcrumb(
        message=message,
        category=category,
        data=data or {},
        level=level,
    )

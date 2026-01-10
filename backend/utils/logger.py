"""
Centralized logging configuration for BhriguWelt backend
"""
import json
import logging
import os
import re
import sys
from datetime import datetime
from pathlib import Path

# Create logs directory if it doesn't exist
LOGS_DIR = Path(__file__).parent.parent / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

# Configure logging format
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
DATE_FORMAT = '%Y-%m-%d %H:%M:%S'

class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors for console output"""

    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
    }
    RESET = '\033[0m'

    def format(self, record):
        log_color = self.COLORS.get(record.levelname, self.RESET)
        record.levelname = f"{log_color}{record.levelname}{self.RESET}"
        return super().format(record)


def _is_debug_enabled() -> bool:
    """Return True when verbose logging is enabled via env."""
    return os.getenv('BHRIGU_DEBUG', '').strip().lower() in {'1', 'true', 'yes', 'on'}


def _resolve_log_level(explicit_level: str = None) -> str:
    """Resolve the log level using environment defaults unless explicitly provided."""
    if explicit_level:
        return explicit_level

    flask_env = os.getenv('FLASK_ENV', 'development').strip().lower()
    if _is_debug_enabled():
        return 'DEBUG'
    if flask_env == 'production':
        return 'WARNING'
    return 'INFO'


def _configure_handler_levels(logger: logging.Logger, level: int):
    for handler in logger.handlers:
        if isinstance(handler, logging.FileHandler) and handler.level == logging.ERROR:
            continue
        handler.setLevel(level)


def setup_logger(name: str, level: str = None) -> logging.Logger:
    """
    Set up a logger with both file and console handlers

    Args:
        name: Logger name (usually __name__)
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)

    Returns:
        Configured logger instance
    """
    resolved_level = _resolve_log_level(level)
    logger_level = getattr(logging, resolved_level.upper(), logging.INFO)
    logger = logging.getLogger(name)
    logger.setLevel(logger_level)

    # Avoid adding duplicate handlers
    if logger.handlers:
        _configure_handler_levels(logger, logger_level)
        return logger

    # Console handler with colors
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logger_level)
    console_handler.setFormatter(ColoredFormatter(LOG_FORMAT, DATE_FORMAT))

    # File handler for all logs
    file_handler = logging.FileHandler(
        LOGS_DIR / f'bhriguwelt_{datetime.now().strftime("%Y%m%d")}.log'
    )
    file_handler.setLevel(logger_level)
    file_handler.setFormatter(logging.Formatter(LOG_FORMAT, DATE_FORMAT))

    # Error file handler for errors only
    error_handler = logging.FileHandler(
        LOGS_DIR / f'errors_{datetime.now().strftime("%Y%m%d")}.log'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(logging.Formatter(LOG_FORMAT, DATE_FORMAT))

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    logger.addHandler(error_handler)

    return logger


def log_request(logger: logging.Logger, request_data: dict, endpoint: str):
    """Log incoming API request"""
    sanitized_request = _redact_sensitive_data(request_data)
    logger.info(f"API Request to {endpoint}: {sanitized_request}")


def log_response(logger: logging.Logger, response_data: dict, endpoint: str, status_code: int):
    """Log API response"""
    sanitized_response = _redact_sensitive_data(response_data)
    logger.info(f"API Response from {endpoint} (status {status_code}): {sanitized_response}")


def log_error(logger: logging.Logger, error: Exception, context: str = None):
    """Log error with context"""
    log_exception(logger, error, context=context)


def _redact_pii(value: str) -> str:
    """Redact common PII patterns from log messages."""
    if not value:
        return value

    patterns = [
        (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b', '[REDACTED_EMAIL]'),
        (r'\b\d{3}-\d{2}-\d{4}\b', '[REDACTED_SSN]'),
        (r'\b(?:\d[ -]*?){13,16}\b', '[REDACTED_CARD]'),
        (r'\b(?:\+?\d{1,3}[ -]?)?(?:\(?\d{3}\)?[ -]?)?\d{3}[ -]?\d{4}\b', '[REDACTED_PHONE]'),
        # OpenAI/Anthropic API keys
        (r'\b(sk-[A-Za-z0-9]{20,})', '[REDACTED_API_KEY]'),
        (r'\b(sk-ant-[A-Za-z0-9\-]{20,})', '[REDACTED_API_KEY]'),
        # Generic API key patterns
        (r'(?i)(api[_\s]?key|apikey)[\s:=]+["\']?([A-Za-z0-9\-_]{20,})["\']?', r'\1: [REDACTED_API_KEY]'),
    ]

    redacted = value
    for pattern, replacement in patterns:
        redacted = re.sub(pattern, replacement, redacted)
    return redacted


def _redact_sensitive_data(value):
    """Recursively redact sensitive fields and PII from data structures."""
    if isinstance(value, dict):
        redacted = {}
        for key, item in value.items():
            if _is_sensitive_key(str(key)):
                redacted[key] = "[REDACTED]"
            else:
                redacted[key] = _redact_sensitive_data(item)
        return redacted
    if isinstance(value, list):
        return [_redact_sensitive_data(item) for item in value]
    if isinstance(value, str):
        sanitized = _redact_pii(value)
        sanitized = re.sub(r'(?i)\bbearer\s+[^\s]+', 'Bearer [REDACTED]', sanitized)
        return sanitized
    return value


def _is_sensitive_key(key: str) -> bool:
    sensitive_keys = {
        'api_key',
        'apikey',
        'authorization',
        'token',
        'access_token',
        'refresh_token',
        'secret',
        'client_secret',
        'password',
        'openai_api_key',
        'x-api-key',
        'x_api_key',
        'x-auth-token',
    }
    normalized_key = key.strip().lower()
    return normalized_key in sensitive_keys or normalized_key.endswith('_token')


def _get_request_id() -> str:
    try:
        from flask import g, request
        return (
            getattr(g, 'correlation_id', None)
            or request.headers.get('X-Request-ID')
            or request.headers.get('X-Correlation-ID')
        )
    except (RuntimeError, Exception):
        # Outside of application/request context
        return None


def sanitize_error(message: str) -> str:
    """Strip headers and PII from error messages."""
    if not message:
        return message

    sanitized = _redact_pii(message)
    sanitized = re.sub(
        r'(?i)(headers?\s*[:=]\s*)(\{[^}]*\}|\[[^\]]*\])',
        r'\1[REDACTED_HEADERS]',
        sanitized,
    )
    sanitized = re.sub(
        r'(?i)(authorization|x-api-key|api_key|apikey|token)\s*[:=]\s*[^\s,;]+',
        r'\1=[REDACTED]',
        sanitized,
    )
    return sanitized


def log_exception(logger: logging.Logger, error: Exception, context: str = None, request_id: str = None):
    """Log exception with PII redaction and request ID."""
    resolved_request_id = request_id or _get_request_id()
    redacted_error = sanitize_error(str(error))
    redacted_context = sanitize_error(context) if context else None

    request_prefix = f"Request ID {resolved_request_id} - " if resolved_request_id else ""
    if redacted_context:
        message = f"{request_prefix}{redacted_context}: {redacted_error}"
    else:
        message = f"{request_prefix}{redacted_error}"

    logger.error(message, exc_info=True)


def secure_log(logger: logging.Logger, level: str, message: str, extra: dict = None):
    """
    Log with explicit sanitization - ensures no secrets leak

    Args:
        logger: Logger instance
        level: Log level (info, warning, error, etc.)
        message: Log message
        extra: Additional structured data (will be sanitized)
    """
    sanitized_extra = _redact_sensitive_data(extra) if extra else {}
    sanitized_message = sanitize_error(message)

    # Ensure API keys are redacted even if not in standard fields
    for env_key in ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'API_KEY']:
        api_key = os.getenv(env_key, '')
        if api_key and api_key in sanitized_message:
            sanitized_message = sanitized_message.replace(api_key, '[REDACTED]')

    log_func = getattr(logger, level.lower(), logger.info)

    if sanitized_extra:
        log_func(json.dumps({
            'message': sanitized_message,
            'timestamp': datetime.utcnow().isoformat(),
            **sanitized_extra
        }))
    else:
        log_func(sanitized_message)


def secure_log_with_context(logger: logging.Logger, level: str, message: str, **kwargs):
    """
    Convenience wrapper for secure_log with keyword arguments

    Example:
        secure_log_with_context(logger, 'info', 'Prediction generated',
                               category='karmic_journey', user_id=123)
    """
    secure_log(logger, level, message, extra=kwargs)


def log_response_generated(logger: logging.Logger, category: str, success: bool,
                           duration_ms: float = None, error: str = None):
    """
    Log response generation event with structured data for monitoring
    VISIBILITY: Track all prediction generation attempts and outcomes
    """
    event_data = {
        'event': 'response_generated',
        'category': category,
        'success': success,
        'timestamp': datetime.utcnow().isoformat()
    }

    if duration_ms is not None:
        event_data['duration_ms'] = duration_ms

    if error:
        event_data['error'] = sanitize_error(str(error))

    logger.info(json.dumps(event_data))


def log_response_failure(logger: logging.Logger, category: str, error: Exception,
                        fallback_used: bool = False):
    """
    Log response failure with fallback status
    VISIBILITY: Track failures and fallback usage
    """
    event_data = {
        'event': 'response_failure',
        'category': category,
        'error': sanitize_error(str(error)),
        'fallback_used': fallback_used,
        'timestamp': datetime.utcnow().isoformat()
    }

    logger.error(json.dumps(event_data))


def log_concurrent_request(logger: logging.Logger, count: int, category: str = None):
    """
    Log concurrent request metrics
    VISIBILITY: Track system load and concurrency
    """
    event_data = {
        'event': 'concurrent_request',
        'concurrent_count': count,
        'timestamp': datetime.utcnow().isoformat()
    }

    if category:
        event_data['category'] = category

    logger.info(json.dumps(event_data))

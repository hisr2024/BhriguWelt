"""
Centralized logging configuration for BhriguWelt backend
"""
import logging
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


def setup_logger(name: str, level: str = 'INFO') -> logging.Logger:
    """
    Set up a logger with both file and console handlers

    Args:
        name: Logger name (usually __name__)
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))

    # Avoid adding duplicate handlers
    if logger.handlers:
        return logger

    # Console handler with colors
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    console_handler.setFormatter(ColoredFormatter(LOG_FORMAT, DATE_FORMAT))

    # File handler for all logs
    file_handler = logging.FileHandler(
        LOGS_DIR / f'bhriguwelt_{datetime.now().strftime("%Y%m%d")}.log'
    )
    file_handler.setLevel(logging.DEBUG)
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
    logger.info(f"API Request to {endpoint}: {request_data}")


def log_response(logger: logging.Logger, response_data: dict, endpoint: str, status_code: int):
    """Log API response"""
    logger.info(f"API Response from {endpoint} (status {status_code}): {response_data}")


def log_error(logger: logging.Logger, error: Exception, context: str = None):
    """Log error with context"""
    error_msg = f"Error in {context}: {str(error)}" if context else str(error)
    logger.error(error_msg, exc_info=True)

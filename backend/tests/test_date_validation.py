"""
Tests for date validation behavior.
"""
from datetime import date, timedelta
import sys
import os

# Ensure backend directory is in Python path for imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from utils.validators import validate_date


def test_accepts_multiple_date_formats():
    formats = [
        "1990-01-15",
        "01/15/1990",
        "15-01-1990",
        "1990/01/15",
    ]
    for date_str in formats:
        is_valid, error = validate_date(date_str, "Date of birth")
        assert is_valid, f"Expected {date_str} to be valid but got: {error}"


def test_rejects_future_date():
    future_date = (date.today() + timedelta(days=1)).isoformat()
    is_valid, error = validate_date(future_date, "Date of birth")
    assert not is_valid
    assert "future" in error.lower()


def test_leap_day_valid_and_invalid():
    is_valid, error = validate_date("2000-02-29", "Date of birth")
    assert is_valid, f"Expected leap day to be valid but got: {error}"

    is_valid, error = validate_date("2019-02-29", "Date of birth")
    assert not is_valid


def test_boundary_years():
    is_valid, error = validate_date("1900-01-01", "Date of birth")
    assert is_valid, f"Expected boundary year to be valid but got: {error}"

    is_valid, error = validate_date("1899-12-31", "Date of birth")
    assert not is_valid

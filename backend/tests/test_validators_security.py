import sys
from pathlib import Path

import pytest

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.append(str(BACKEND_ROOT))

from utils import validators  # noqa: E402


def test_contains_sql_injection_detects_common_patterns():
    assert validators.contains_sql_injection("1 OR 1=1")
    assert validators.contains_sql_injection("DROP TABLE users; --")
    assert validators.contains_sql_injection("UNION SELECT * FROM secrets")
    assert not validators.contains_sql_injection("Looking for a place called Union Square")


def test_contains_xss_detects_script_payloads():
    assert validators.contains_xss("<script>alert('x')</script>")
    assert validators.contains_xss("javascript:alert(1)")
    assert validators.contains_xss("<img src=x onerror=alert(1)>")
    assert not validators.contains_xss("Plain text with <b>bold</b>")


def test_sanitize_text_removes_html_and_control_chars():
    payload = "<script>alert('x')</script> Hello\x00"
    sanitized = validators.sanitize_input(payload, max_length=100)
    assert "script" not in sanitized.lower()
    assert "\x00" not in sanitized
    assert sanitized == "Hello"


def test_validate_place_rejects_injection_payloads():
    ok, error = validators.validate_place("New Delhi", field_name="place")
    assert ok is True
    assert error is None

    ok, error = validators.validate_place("New Delhi; DROP TABLE users", field_name="place")
    assert ok is False
    assert error

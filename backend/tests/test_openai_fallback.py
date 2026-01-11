import json
from unittest.mock import patch

import pytest
import requests

from backend.services.openai_service import OpenAIService


class FakeResponse(requests.Response):
    def __init__(self, status_code: int, payload: dict):
        super().__init__()
        self.status_code = status_code
        self._content = json.dumps(payload).encode('utf-8')


def test_openai_quota_fallback(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    monkeypatch.setenv("OPENAI_MODEL", "gpt-4")
    monkeypatch.setenv("OPENAI_MAX_TOKENS", "16")
    monkeypatch.setenv("PER_REQUEST_COST_LIMIT", "10.0")

    service = OpenAIService()

    def raise_http_error(payload):
        response = FakeResponse(429, {"error": {"message": "insufficient_quota"}})
        error = requests.exceptions.HTTPError(response=response)
        raise error

    with patch("backend.services.openai_service.check_daily_quota_and_reserve", return_value=(True, 1000)), \
         patch.object(OpenAIService, "_post_with_model_fallbacks", side_effect=raise_http_error):
        result = service.generate_prediction("Test prompt", return_metadata=True, user_id="user123")

    assert result["metadata"]["fallback"] is True
    assert result["metadata"]["reason"] == "quota"
    assert result["text"]

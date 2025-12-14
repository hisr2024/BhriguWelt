"""AI client configuration helpers for OpenAI-compatible providers."""

from __future__ import annotations

from bhriguwelt import ai_client


def _clear_ai_env(monkeypatch: "MonkeyPatch") -> None:
    for key in (
        "AI_API_BASE",
        "OPENAI_API_BASE",
        "SARVAM_API_BASE",
        "AI_API_KEY",
        "OPENAI_API_KEY",
        "SARVAM_API_KEY",
    ):
        monkeypatch.delenv(key, raising=False)


def test_is_ai_configured_with_sarvam_defaults(monkeypatch: "MonkeyPatch") -> None:
    _clear_ai_env(monkeypatch)
    monkeypatch.setenv("SARVAM_API_KEY", "test-key")

    assert ai_client.is_ai_configured() is True
    assert ai_client._resolve_api_key() == "test-key"
    assert ai_client._resolve_api_base() == "https://api.sarvam.ai"


def test_ai_client_prefers_explicit_base(monkeypatch: "MonkeyPatch") -> None:
    _clear_ai_env(monkeypatch)
    monkeypatch.setenv("AI_API_BASE", "https://example.test/api")
    monkeypatch.setenv("AI_API_KEY", "token")
    monkeypatch.setenv("SARVAM_API_BASE", "https://api.sarvam.ai")
    monkeypatch.setenv("SARVAM_API_KEY", "sarvam-token")

    assert ai_client._resolve_api_base() == "https://example.test/api"
    assert ai_client._resolve_api_key() == "token"

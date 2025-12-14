"""Lightweight client for OpenAI-compatible chat completions."""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict, Sequence


class AIIntegrationError(RuntimeError):
    """Raised when the AI provider cannot be reached or returns an invalid payload."""


_AI_BASE_ENV_VARS = ("AI_API_BASE", "OPENAI_API_BASE", "SARVAM_API_BASE")
_AI_KEY_ENV_VARS = ("AI_API_KEY", "OPENAI_API_KEY", "SARVAM_API_KEY")
_SARVAM_DEFAULT_BASE = "https://api.sarvam.ai"
_DEFAULT_MODEL = os.environ.get("AI_MODEL") or os.environ.get("OPENAI_MODEL") or "gpt-4o-mini"


def _first_env(options: Sequence[str]) -> str | None:
    for key in options:
        value = os.environ.get(key)
        if value:
            return value
    return None


def _resolve_api_base() -> str | None:
    base = _first_env(_AI_BASE_ENV_VARS)
    if base:
        return base

    # If only a Sarvam key is present, fall back to the known hosted endpoint.
    if os.environ.get("SARVAM_API_KEY"):
        return _SARVAM_DEFAULT_BASE

    return None


def _resolve_api_key() -> str | None:
    return _first_env(_AI_KEY_ENV_VARS)


def is_ai_configured() -> bool:
    """Return True when both an API base and key are available."""

    return bool(_resolve_api_base() and _resolve_api_key())


def chat_completion(
    messages: Sequence[Dict[str, str]],
    *,
    model: str | None = None,
    temperature: float = 0.4,
    max_tokens: int = 320,
) -> str:
    """Send a chat completion request to an OpenAI-compatible API.

    This intentionally avoids third-party SDKs so deployments stay lean. A
    human-friendly error is raised when the provider cannot be reached.
    """

    api_base = _resolve_api_base()
    api_key = _resolve_api_key()
    if not api_base or not api_key:
        raise AIIntegrationError("AI provider not configured; set AI_API_BASE and AI_API_KEY")

    url = api_base.rstrip("/") + "/v1/chat/completions"
    payload = {
        "model": model or _DEFAULT_MODEL,
        "temperature": float(temperature),
        "max_tokens": int(max_tokens),
        "messages": list(messages),
    }

    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=float(os.environ.get("AI_API_TIMEOUT", 10))) as response:
            data: Dict[str, Any] = json.load(response)
    except (urllib.error.URLError, json.JSONDecodeError) as exc:
        raise AIIntegrationError(f"AI provider unreachable: {exc}") from exc

    try:
        message = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise AIIntegrationError("AI provider returned an unexpected payload") from exc

    if not isinstance(message, str) or not message.strip():
        raise AIIntegrationError("AI provider returned an empty message")

    return message.strip()


__all__ = ["AIIntegrationError", "is_ai_configured", "chat_completion"]

"""
AI provider resolution — OpenAI or Sarvam AI behind one OpenAI-compatible client.

Sarvam's chat API (https://docs.sarvam.ai) mirrors OpenAI's:
  POST https://api.sarvam.ai/v1/chat/completions
  Authorization: Bearer <key>   +   api-subscription-key: <key>
  body: model, messages, max_tokens, temperature, response_format, reasoning_effort
  reply: choices[0].message.content, usage.{prompt,completion,total}_tokens

Selection (first match wins):
  1. AI_PROVIDER=openai|sarvam
  2. A Sarvam key (SARVAM_API_KEY / SARVAM_AI_API_KEY / SARVAM_KEY) and no OpenAI key
  3. OPENAI_API_KEY in Sarvam's format (starts with "sk_"; OpenAI keys start "sk-")
  4. otherwise OpenAI

When Sarvam is selected, OpenAI-only settings (OPENAI_MODEL=gpt-*, the
api.openai.com base URL, gpt-* fallback models) are ignored so a leftover
OpenAI config cannot break requests.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional

SARVAM_KEY_VARS = ('SARVAM_API_KEY', 'SARVAM_AI_API_KEY', 'SARVAM_KEY')
SARVAM_DEFAULT_BASE_URL = 'https://api.sarvam.ai/v1'
SARVAM_DEFAULT_MODEL = 'sarvam-105b'
OPENAI_DEFAULT_BASE_URL = 'https://api.openai.com/v1'
OPENAI_DEFAULT_MODEL = 'gpt-4o-mini'
OPENAI_JSON_MODELS = ('gpt-4-turbo', 'gpt-4o', 'gpt-4.1', 'gpt-4.5', 'gpt-5', 'gpt-3.5-turbo', 'o3', 'o4')


@dataclass
class AIProvider:
    name: str                       # 'openai' | 'sarvam'
    api_key: Optional[str]
    base_urls: List[str]
    model: str
    fallback_models: List[str]
    extra_headers: Dict[str, str] = field(default_factory=dict)
    reasoning_effort: Optional[str] = None

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    def supports_json_mode(self, model: str) -> bool:
        if self.name == 'sarvam':
            return True  # response_format json_object / json_schema supported
        return any(term in (model or '').lower() for term in OPENAI_JSON_MODELS)

    def headers(self) -> Dict[str, str]:
        if not self.api_key:
            return {}
        return {'Authorization': f'Bearer {self.api_key}', 'Content-Type': 'application/json', **self.extra_headers}

    def extra_payload(self) -> Dict[str, object]:
        return {'reasoning_effort': self.reasoning_effort} if self.reasoning_effort else {}


def _sarvam_key() -> Optional[str]:
    for var in SARVAM_KEY_VARS:
        value = (os.getenv(var) or '').strip()
        if value:
            return value
    return None


def _split(value: str) -> List[str]:
    return [v.strip() for v in (value or '').split(',') if v.strip()]


def resolve_provider() -> AIProvider:
    explicit = (os.getenv('AI_PROVIDER') or '').strip().lower()
    openai_key = (os.getenv('OPENAI_API_KEY') or '').strip() or None
    sarvam_key = _sarvam_key()

    if explicit == 'sarvam':
        use_sarvam = True
    elif explicit == 'openai':
        use_sarvam = False
    else:
        use_sarvam = bool((sarvam_key and not openai_key) or (openai_key and openai_key.startswith('sk_')))

    if use_sarvam:
        key = sarvam_key or openai_key
        configured_model = (os.getenv('SARVAM_MODEL') or os.getenv('OPENAI_MODEL') or '').strip()
        model = configured_model if configured_model.lower().startswith(('sarvam', 'glm', 'gemma', 'deepseek')) else SARVAM_DEFAULT_MODEL
        base = (os.getenv('SARVAM_BASE_URL') or '').strip()
        if not base:
            openai_base = (os.getenv('OPENAI_BASE_URL') or '').strip()
            base = openai_base if 'sarvam' in openai_base else SARVAM_DEFAULT_BASE_URL
        fallbacks = [m for m in _split(os.getenv('SARVAM_MODEL_FALLBACKS', '')) if m != model]
        effort = (os.getenv('SARVAM_REASONING_EFFORT') or 'low').strip().lower()
        if effort not in ('none', 'low', 'medium', 'high', 'max'):
            effort = 'low'
        return AIProvider('sarvam', key, [base.rstrip('/')], model, fallbacks,
                          extra_headers={'api-subscription-key': key} if key else {},
                          reasoning_effort=effort)

    urls = _split(os.getenv('OPENAI_BASE_URLS', '')) or [(os.getenv('OPENAI_BASE_URL') or OPENAI_DEFAULT_BASE_URL).strip()]
    model = (os.getenv('OPENAI_MODEL') or OPENAI_DEFAULT_MODEL).strip()
    fallbacks = [m for m in _split(os.getenv('OPENAI_MODEL_FALLBACKS', '')) if m != model]
    return AIProvider('openai', openai_key, list(dict.fromkeys(urls)), model, fallbacks)


def ai_configured() -> bool:
    """True when any supported provider has a key (replaces bare OPENAI_API_KEY checks)."""
    return resolve_provider().configured

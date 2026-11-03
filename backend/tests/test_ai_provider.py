"""Provider selection: OpenAI vs Sarvam AI (OpenAI-compatible)."""
import json

import pytest

from services.ai_provider import resolve_provider, ai_configured

ENV = ['AI_PROVIDER', 'OPENAI_API_KEY', 'SARVAM_API_KEY', 'SARVAM_AI_API_KEY', 'SARVAM_KEY',
       'OPENAI_MODEL', 'OPENAI_BASE_URL', 'OPENAI_BASE_URLS', 'SARVAM_MODEL', 'SARVAM_BASE_URL',
       'OPENAI_MODEL_FALLBACKS', 'SARVAM_REASONING_EFFORT']


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for k in ENV:
        monkeypatch.delenv(k, raising=False)


def test_sarvam_key_alone_selects_sarvam_and_ignores_openai_settings(monkeypatch):
    monkeypatch.setenv('SARVAM_API_KEY', 'sk_live_abc')
    monkeypatch.setenv('OPENAI_MODEL', 'gpt-3.5-turbo')            # leftover from render.yaml
    monkeypatch.setenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')
    monkeypatch.setenv('OPENAI_MODEL_FALLBACKS', 'gpt-4o')
    p = resolve_provider()
    assert p.name == 'sarvam' and p.configured
    assert p.model == 'sarvam-105b'
    assert p.base_urls == ['https://api.sarvam.ai/v1']
    assert p.fallback_models == []
    h = p.headers()
    assert h['Authorization'] == 'Bearer sk_live_abc' and h['api-subscription-key'] == 'sk_live_abc'
    assert p.supports_json_mode(p.model)


def test_sarvam_format_key_in_openai_variable(monkeypatch):
    monkeypatch.setenv('OPENAI_API_KEY', 'sk_live_xyz')
    assert resolve_provider().name == 'sarvam'


def test_openai_default_and_explicit_override(monkeypatch):
    monkeypatch.setenv('OPENAI_API_KEY', 'sk-proj-123')
    p = resolve_provider()
    assert p.name == 'openai' and p.model == 'gpt-4o-mini' and 'api-subscription-key' not in p.headers()
    monkeypatch.setenv('SARVAM_API_KEY', 'sk_live_abc')
    assert resolve_provider().name == 'openai'           # OpenAI key present wins by default
    monkeypatch.setenv('AI_PROVIDER', 'sarvam')
    assert resolve_provider().name == 'sarvam'


def test_no_key_means_not_configured():
    assert not ai_configured()


def test_sarvam_model_override(monkeypatch):
    monkeypatch.setenv('SARVAM_API_KEY', 'sk_live_abc')
    monkeypatch.setenv('SARVAM_MODEL', 'sarvam-105b-conversations')
    assert resolve_provider().model == 'sarvam-105b-conversations'


def test_sarvam_request_payload(monkeypatch):
    """The structured call sends a Sarvam-valid payload to the Sarvam URL."""
    monkeypatch.setenv('SARVAM_API_KEY', 'sk_live_abc')
    monkeypatch.setenv('SARVAM_REASONING_EFFORT', 'low')
    from services import openai_service as mod
    from services import ai_quota
    monkeypatch.setattr(ai_quota, '_get_redis_client', lambda: None)
    sent = {}

    class Resp:
        status_code = 200
        def raise_for_status(self): pass
        def json(self):
            return {'choices': [{'message': {'content': json.dumps({'overview': 'ok', 'sections': {}})},
                                 'finish_reason': 'stop'}],
                    'usage': {'prompt_tokens': 10, 'completion_tokens': 5, 'total_tokens': 15}}

    def fake_post(url, headers=None, json=None, timeout=None, **kw):
        sent.update(url=url, headers=headers, payload=json)
        return Resp()

    monkeypatch.setattr(mod.requests, 'post', fake_post)
    svc = mod.OpenAIService()
    assert svc.enabled and svc.provider.name == 'sarvam'
    out = svc.generate_structured('prompt', 'Return JSON', user_id='client:abc12345', max_tokens=1000)
    assert out['data'] == {'overview': 'ok', 'sections': {}}
    assert sent['url'] == 'https://api.sarvam.ai/v1/chat/completions'
    assert sent['headers']['api-subscription-key'] == 'sk_live_abc'
    p = sent['payload']
    assert p['model'] == 'sarvam-105b'
    assert p['response_format'] == {'type': 'json_object'}
    assert p['reasoning_effort'] == 'low'
    assert p['max_tokens'] == 1800   # 1000 + reasoning headroom

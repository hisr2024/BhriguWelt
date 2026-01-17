import sys
import time
from pathlib import Path

import pytest

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT_DIR))
sys.path.append(str(ROOT_DIR / "backend"))

from backend.app import app
from routes import ai_routes


@pytest.fixture()
def client():
    app.config['TESTING'] = True
    with app.test_client() as test_client:
        yield test_client


def _chat_headers():
    return {
        'X-AI-Consent': 'granted',
        'X-AI-Mode': 'conversational',
    }


def _base_birth_data():
    return {
        'zodiac_sign': 'Aries',
        'nakshatra': 'Ashwini',
        'moon_sign': 'Aries',
        'ascendant': 'Leo',
    }


def test_chat_response_quality_valid_input(client):
    payload = {
        'message': 'What should I focus on for my career growth?',
        'birth_data': _base_birth_data(),
        'conversation_history': [],
    }

    response = client.post('/api/ai/chat', json=payload, headers=_chat_headers())
    assert response.status_code == 200

    data = response.get_json()
    assert data['status'] == 'success'
    response_text = data['data']['response']

    assert isinstance(response_text, str)
    assert len(response_text.strip()) > 0
    assert 'Actionable' in response_text or 'Next Steps' in response_text


def test_chat_graceful_degradation_when_wisdom_unavailable(client, monkeypatch):
    monkeypatch.setattr(ai_routes.ai_service, 'core_wisdom', None)
    monkeypatch.setattr(ai_routes.ai_service, 'offline_ready', True)

    payload = {
        'message': 'Tell me about my relationships.',
        'birth_data': _base_birth_data(),
        'conversation_history': [],
    }

    response = client.post('/api/ai/chat', json=payload, headers=_chat_headers())
    assert response.status_code == 200

    data = response.get_json()
    response_text = data['data']['response']

    assert 'unavailable' in response_text.lower()
    assert 'Actionable' in response_text or 'Next Steps' in response_text


def test_chat_handles_missing_inputs(client):
    response = client.post('/api/ai/chat', json={}, headers=_chat_headers())
    assert response.status_code == 400
    payload = response.get_json()
    assert payload['error'] == 'Missing required field'

    response = client.post(
        '/api/ai/chat',
        json={'message': '   ', 'birth_data': _base_birth_data()},
        headers=_chat_headers(),
    )
    assert response.status_code == 400
    payload = response.get_json()
    assert payload['error'] == 'Empty message'


def test_chat_response_time_under_load(client):
    payload = {
        'message': 'Give me quick guidance for today.',
        'birth_data': _base_birth_data(),
        'conversation_history': [],
    }

    start = time.perf_counter()
    for _ in range(3):
        response = client.post('/api/ai/chat', json=payload, headers=_chat_headers())
        assert response.status_code == 200
    duration = time.perf_counter() - start

    assert duration < 5.0

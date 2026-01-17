from pathlib import Path
import sys

import pytest

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT_DIR / "backend"))

from backend.app import app
from backend.services import astrology_calculator
from routes import life_events_routes


class StubCalculator:
    def calculate_birth_chart(
        self,
        date_of_birth,
        time_of_birth,
        place,
        latitude=None,
        longitude=None,
        timezone_override=None,
    ):
        return {
            'zodiac_sign': 'Aries',
            'nakshatra': 'Ashwini',
            'dasha_period': {'maha_dasha': 'Mars'},
            'houses': [f'House {i}' for i in range(1, 13)],
            'planets': {
                'Venus': {'sign': 'Taurus'},
                'Jupiter': {'sign': 'Sagittarius'},
                'Saturn': {'sign': 'Capricorn'},
            },
        }


class StubOrchestrator:
    def generate_prediction(self, **kwargs):
        return {
            'prediction': {
                'summary': 'Stubbed varshaphal forecast.'
            },
            'mode': kwargs.get('mode', 'hybrid')
        }


@pytest.fixture()
def client(monkeypatch):
    app.config['TESTING'] = True
    monkeypatch.setattr(life_events_routes, 'get_astrology_calculator', lambda: StubCalculator())
    monkeypatch.setattr(life_events_routes, 'get_astrology_dependency_error', lambda: None)
    monkeypatch.setattr(life_events_routes, 'get_cached_birth_data', lambda data: None)
    monkeypatch.setattr(life_events_routes, 'orchestrator', StubOrchestrator())
    monkeypatch.setattr(astrology_calculator, 'get_astrology_calculator', lambda: StubCalculator())
    monkeypatch.setattr(astrology_calculator, 'astrology_calculator', StubCalculator())

    with app.test_client() as test_client:
        yield test_client


def test_varshaphal_post_success(client):
    payload = {
        'date_of_birth': '1990-01-01',
        'time_of_birth': '12:00',
        'place_of_birth': 'New Delhi, India',
        'year': 2025,
    }
    response = client.post('/api/life-events/varshaphal', json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'success'
    assert data['prediction']['year'] == 2025
    assert data['prediction']['varshaphal']['summary'] == 'Stubbed varshaphal forecast.'


def test_varshaphal_get_method_not_allowed(client):
    response = client.get('/api/life-events/varshaphal')
    assert response.status_code == 405
    data = response.get_json()
    assert data['error'] == 'Method not allowed'
    assert 'Method not allowed' in data['message']


def test_varshaphal_missing_birth_details_returns_validation_error(client):
    response = client.post('/api/life-events/varshaphal', json={})
    assert response.status_code == 400
    data = response.get_json()
    assert data['status'] == 'error'
    assert 'Date of birth' in data['message']


def test_varshaphal_invalid_year_returns_error(client):
    payload = {
        'date_of_birth': '1990-01-01',
        'time_of_birth': '12:00',
        'place_of_birth': 'New Delhi, India',
        'year': 'not-a-year',
    }
    response = client.post('/api/life-events/varshaphal', json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert data['status'] == 'error'
    assert 'Year must be a valid integer' in data['message']

import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app import app
from routes import predictions_unified


@pytest.fixture()
def client():
    app.config['TESTING'] = True
    with app.test_client() as test_client:
        yield test_client


@pytest.mark.integration
def test_future_lives_prediction_returns_payload(client, monkeypatch):
    class DummyCalculator:
        def calculate_birth_chart(
            self,
            date_of_birth,
            time_of_birth,
            place,
            timezone_override=None,
            latitude=None,
            longitude=None,
        ):
            return {
                'zodiac_sign': 'Aries',
                'nakshatra': 'Ashwini',
                'moon_sign': 'Taurus',
                'ascendant': 'Aries',
                'planets': {
                    'Rahu': {'sign': 'Aries'},
                    'Jupiter': {'sign': 'Cancer'},
                    'Moon': {'sign': 'Taurus'},
                },
                'houses': {
                    8: 'Sagittarius',
                    9: 'Capricorn',
                    11: 'Pisces',
                },
            }

    def fake_generate_prediction(category, chart_data, mode, client_online, language=None):
        return {
            'prediction': {
                'future_prediction': 'A future path of service and study.',
                'moksha_timeline': 'Liberation within a few lifetimes.',
            },
            'mode': mode,
        }

    monkeypatch.setattr(predictions_unified, 'astrology_calculator', DummyCalculator())
    monkeypatch.setattr(
        predictions_unified,
        'orchestrator',
        SimpleNamespace(generate_prediction=fake_generate_prediction),
    )

    payload = {
        'date_of_birth': '1990-01-15',
        'time_of_birth': '14:30',
        'place_of_birth': 'New Delhi, India',
    }

    response = client.post('/api/predictions/future_lives', json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'success'
    assert data['prediction'] is not None
    assert data['prediction']['future_prediction']


@pytest.mark.integration
def test_future_lives_prediction_missing_fields(client):
    response = client.post('/api/predictions/future_lives', json={})
    assert response.status_code == 400
    data = response.get_json()
    assert data['status'] == 'error'
    assert 'Missing required field' in data['message']

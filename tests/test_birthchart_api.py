import pytest

from backend.app import app
import backend.api_birthchart as api_birthchart


@pytest.fixture()
def client():
    app.config['TESTING'] = True
    with app.test_client() as test_client:
        yield test_client


def test_birthchart_validation_error_returns_consistent_error(client):
    response = client.post('/api/v1/birthchart/compute', json={})
    assert response.status_code == 400
    payload = response.get_json()
    assert payload['error_code'] == 'VALIDATION_ERROR'
    assert 'dob is required' in payload['message']


def test_birthchart_success_response_shape(client, monkeypatch):
    def mock_calc_ut(jd, planet_id):
        return ([planet_id * 5.0 % 360, 0.0, 1.0, 0.0],)

    def mock_houses(jd, lat, lon, house_code):
        houses = [i * 30.0 for i in range(12)]
        ascmc = [15.0, 0, 0, 0, 0, 0, 0, 0]
        return houses, ascmc

    monkeypatch.setattr(api_birthchart.swe, 'calc_ut', mock_calc_ut)
    monkeypatch.setattr(api_birthchart.swe, 'houses', mock_houses)

    payload = {
        'name': 'Demo',
        'dob': '1990-01-01',
        'time': '12:00',
        'timezone': 'UTC',
        'latitude': 0,
        'longitude': 0,
    }

    response = client.post('/api/v1/birthchart/compute', json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert 'chart' in data
    assert 'planets' in data['chart']
    assert 'sun' in data['chart']['planets']
    assert 'interpretation' in data
    assert isinstance(data['interpretation']['summary'], str)

from pathlib import Path

import pytest

from services import bhrigu_predictions
from services import section_parser as section_parser_module


class DummyOpenAIService:
    def __init__(self, response_text: str):
        self.response_text = response_text
        self.corpus_available = True

    def generate_prediction(self, prompt, birth_data):
        return self.response_text


class DummyCalculator:
    def calculate_birth_chart(self, *args, **kwargs):
        return {}


class DummyCorpusDB:
    pass


@pytest.fixture
def fixtures_dir():
    return Path(__file__).parent / "fixtures" / "ai_responses"


@pytest.fixture
def sample_birth_data():
    return {
        "zodiac_sign": "Leo",
        "nakshatra": "Magha",
        "moon_sign": "Leo",
        "ascendant": "Sagittarius",
        "date_of_birth": "1990-07-15",
        "time_of_birth": "14:30",
        "place_of_birth": "Mumbai, India",
        "latitude": 19.0760,
        "longitude": 72.8777,
    }


def _build_service(monkeypatch, response_text):
    monkeypatch.setattr(bhrigu_predictions, "get_openai_service", lambda: DummyOpenAIService(response_text))
    monkeypatch.setattr(bhrigu_predictions, "AstrologyCalculator", DummyCalculator)
    monkeypatch.setattr(bhrigu_predictions, "get_corpus_database", lambda: DummyCorpusDB())
    monkeypatch.setattr(section_parser_module, "_section_parser", None)
    return bhrigu_predictions.BhriguPredictionsService()


def test_karmic_journey_section_outputs(monkeypatch, fixtures_dir, sample_birth_data):
    response_text = (fixtures_dir / "karmic_journey.md").read_text()
    service = _build_service(monkeypatch, response_text)

    result = service.generate_karmic_journey_prediction(sample_birth_data)

    assert result["full_analysis"] == response_text
    assert "soul_purpose" in result
    assert "karmic_blueprint" in result
    assert "life_mission" in result
    assert len(result["soul_purpose"]) > 50
    assert len(result["karmic_blueprint"]) > 50


def test_predictions_section_outputs(monkeypatch, fixtures_dir, sample_birth_data):
    response_text = (fixtures_dir / "predictions.md").read_text()
    service = _build_service(monkeypatch, response_text)

    result = service.generate_general_predictions(sample_birth_data)

    assert result["full_analysis"] == response_text
    assert result["daily"].startswith("Today emphasizes")
    assert result["weekly"].startswith("This week highlights")
    assert result["monthly"].startswith("The month favors")
    assert result["yearly"].startswith("The year calls")

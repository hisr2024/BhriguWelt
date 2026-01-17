import sys
from pathlib import Path

import pytest

BACKEND_PATH = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND_PATH))

from services.bhrigu_predictions import BhriguPredictionsService
from services.section_parser import SectionParser


class StubOpenAIService:
    corpus_available = False

    def generate_prediction(self, prompt: str, birth_data: dict) -> str:
        return " ".join(["insight"] * 140)

    def get_selected_model(self) -> str:
        return "stub-model"

    def _estimate_tokens(self, text: str) -> int:
        return max(1, len(text) // 4)


@pytest.fixture()
def predictions_service():
    openai_service = StubOpenAIService()
    section_parser = SectionParser(openai_service)
    return BhriguPredictionsService(
        openai_service=openai_service,
        astrology_calculator=None,
        section_parser=section_parser,
        corpus_db=None,
    )


def test_karmic_remedies_success_with_valid_inputs(predictions_service):
    birth_data = {
        "date_of_birth": "1990-05-12",
        "time_of_birth": "06:30",
        "place_of_birth": "Mumbai, India",
        "zodiac_sign": "Taurus",
        "nakshatra": "Rohini",
        "moon_sign": "Taurus",
        "ascendant": "Gemini",
    }

    result = predictions_service.generate_karmic_remedies_prediction(birth_data)

    assert result["category"] == "karmic_remedies"
    assert result["full_analysis"]
    assert result["metadata"]["ai_model"] == "stub-model"
    assert not result["metadata"].get("fallback_mode", False)


def test_karmic_remedies_fallback_for_missing_inputs(predictions_service):
    birth_data = {
        "date_of_birth": "1990-05-12",
        "zodiac_sign": "Taurus",
    }

    result = predictions_service.generate_karmic_remedies_prediction(birth_data)

    assert result["category"] == "karmic_remedies"
    assert result["metadata"]["fallback_mode"] is True
    assert result["mantras"]
    assert result["gemstones"]


def test_karma_reset_fallback_for_missing_inputs(predictions_service):
    birth_data = {
        "date_of_birth": "1990-05-12",
        "zodiac_sign": "Taurus",
    }

    result = predictions_service.generate_karma_reset(birth_data)

    assert result["category"] == "karma_reset"
    assert result["metadata"]["fallback_mode"] is True
    assert result["reset_overview"]
    assert result["daily_reset"]


def test_karma_reset_success_with_valid_inputs(predictions_service):
    birth_data = {
        "date_of_birth": "1990-05-12",
        "time_of_birth": "06:30",
        "place_of_birth": "Mumbai, India",
        "zodiac_sign": "Taurus",
        "nakshatra": "Rohini",
        "moon_sign": "Taurus",
        "ascendant": "Gemini",
    }

    result = predictions_service.generate_karma_reset(birth_data)

    assert result["category"] == "karma_reset"
    assert result["full_analysis"]
    assert result["metadata"]["ai_model"] == "stub-model"
    assert not result["metadata"].get("fallback_mode", False)

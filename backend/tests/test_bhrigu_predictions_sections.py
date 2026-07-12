import re
from pathlib import Path

import pytest

from services import bhrigu_predictions
from services import section_parser as section_parser_module


@pytest.fixture(autouse=True)
def legacy_resilience_mode(monkeypatch):
    """These tests exercise the legacy always-return-a-dict resilience
    machinery, which is now gated behind BHRIGU_STRICT_PRECISION=false.
    Strict mode (default) raises PredictionUnavailableError instead of
    serving generalised fallback text; that contract is covered in
    tests/test_wisdom_core_pipeline.py."""
    monkeypatch.setenv('BHRIGU_STRICT_PRECISION', 'false')


def _parse_fixture_sections(text: str) -> dict:
    """Split a fixture markdown document into {header (lowercased): body}."""
    sections = {}
    current = None
    lines = []
    for line in text.splitlines():
        if line.startswith('## '):
            if current is not None:
                sections[current] = '\n'.join(lines).strip()
            current = line[3:].strip().lower()
            lines = []
        elif current is not None:
            lines.append(line)
    if current is not None:
        sections[current] = '\n'.join(lines).strip()
    return sections


class DummyOpenAIService:
    """Stands in for OpenAIService. The service now issues one prompt per
    section ('Generate ONLY the section titled "..."'), so return the fixture
    section whose header matches the requested title."""

    enabled = True
    corpus_available = True

    def __init__(self, response_text: str):
        self.response_text = response_text
        self.sections = _parse_fixture_sections(response_text)

    def generate_prediction(self, prompt, birth_data, **kwargs):
        match = re.search(r'titled "([^"]+)"', prompt)
        if match:
            title = match.group(1).strip().lower()
            for header, body in self.sections.items():
                if title == header or title.startswith(header):
                    return body
        return self.response_text

    def get_selected_model(self):
        return 'test-model'

    def _estimate_tokens(self, text: str) -> int:
        return len(text) // 4


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

    # Every fixture section body must survive verbatim into the assembled analysis
    for body in _parse_fixture_sections(response_text).values():
        assert body in result["full_analysis"]

    assert "soul_purpose" in result
    assert "karmic_blueprint" in result
    assert "life_mission" in result
    assert len(result["soul_purpose"]) > 50
    assert len(result["karmic_blueprint"]) > 50
    assert result["soul_purpose"].startswith("Your soul incarnated to cultivate courage")

    # New contract: per-section generation status and dual-audience views
    status_map = result["section_generation_status"]
    assert all(entry["status"] == "generated" for entry in status_map.values())
    assert isinstance(result["user_views"], dict)
    assert result["user_views"]["soul_purpose"]


def test_predictions_section_outputs(monkeypatch, fixtures_dir, sample_birth_data):
    response_text = (fixtures_dir / "predictions.md").read_text()
    service = _build_service(monkeypatch, response_text)

    result = service.generate_general_predictions(sample_birth_data)

    for body in _parse_fixture_sections(response_text).values():
        assert body in result["full_analysis"]

    assert result["daily"].startswith("Today emphasizes")
    assert result["weekly"].startswith("This week highlights")
    assert result["monthly"].startswith("The month favors")
    assert result["yearly"].startswith("The year calls")

    status_map = result["section_generation_status"]
    assert all(entry["status"] == "generated" for entry in status_map.values())
    assert isinstance(result["user_views"], dict)

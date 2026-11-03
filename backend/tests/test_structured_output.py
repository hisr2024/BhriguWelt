"""Regression tests for the raw-JSON-on-screen bug and the single-call reading."""
import json

import pytest

from services import bhrigu_predictions
from services import section_parser as section_parser_module
from services.structured_output import extract_json_object, to_readable_text

READING = {
    "summary": "Analysis of recurring karmic patterns reveals significant insights.",
    "sections": {
        "Recurring Karmic Patterns": "Rahu with the Moon in Leo shows an unfinished desire for recognition.",
        "Actionable Guidance": "1. Practice meditation daily. 2. Share teachings. 3. Study scriptures.",
    },
    "confidence": 0.9,
}


@pytest.mark.parametrize("wrap", [
    lambda j: j,
    lambda j: f"```json\n{j}\n```",
    lambda j: f"Here is your reading:\n{j}\nHope this helps!",
    lambda j: json.dumps(j),  # double-encoded string
])
def test_extract_variants(wrap):
    parsed = extract_json_object(wrap(json.dumps(READING)))
    assert parsed["sections"]["Recurring Karmic Patterns"].startswith("Rahu")


def test_extract_concatenated_chunks_are_merged():
    a = json.dumps({"summary": "A", "sections": {"one": "first"}})
    b = json.dumps({"summary": "B", "sections": {"two": "second"}})
    parsed = extract_json_object(a + "\n\n" + b)
    assert set(parsed["sections"]) == {"one", "two"}


def test_extract_truncated_reply():
    text = json.dumps(READING)[:-40]
    parsed = extract_json_object(text)
    assert parsed is not None and parsed.get("_truncated")
    assert "Recurring Karmic Patterns" in parsed["sections"]


def test_readable_text_never_contains_json_syntax():
    out = to_readable_text(json.dumps(READING))
    assert '{"' not in out and '"confidence"' not in out
    assert "### Recurring Karmic Patterns" in out
    assert "- Practice meditation daily." in out


def test_plain_text_passthrough():
    assert to_readable_text("Just prose.") == "Just prose."


# ---------------------------------------------------------------------------
# Single structured call per category
# ---------------------------------------------------------------------------

class StructuredDummy:
    enabled = True
    corpus_available = True

    def __init__(self, payload):
        self.payload = payload
        self.structured_calls = 0
        self.legacy_calls = 0

    def generate_structured(self, prompt, system_content, user_id=None, max_tokens=None):
        self.structured_calls += 1
        self.last_prompt = prompt
        self.last_max_tokens = max_tokens
        return {"data": self.payload, "text": json.dumps(self.payload), "partial": False}

    def generate_prediction(self, *args, **kwargs):
        self.legacy_calls += 1
        return ""

    def get_selected_model(self):
        return "test-model"

    def _estimate_tokens(self, text):
        return len(text) // 4


class DummyCalculator:
    def calculate_birth_chart(self, *a, **k):
        return {}


BIRTH = {
    "zodiac_sign": "Libra", "moon_sign": "Leo", "ascendant": "Libra",
    "nakshatra": "Purva Phalguni", "date_of_birth": "1990-10-10", "time_of_birth": "08:00",
    "place_of_birth": "Delhi", "latitude": 28.6, "longitude": 77.2,
    "planets": {
        "Moon": {"sign": "Leo", "longitude": 136.5},
        "Rahu": {"sign": "Capricorn", "longitude": 290.0},
        "Saturn": {"sign": "Sagittarius", "longitude": 262.0},
        "Jupiter": {"sign": "Cancer", "longitude": 100.0},
    },
}


def _service(monkeypatch, payload):
    dummy = StructuredDummy(payload)
    monkeypatch.setenv("BHRIGU_STRICT_PRECISION", "true")
    monkeypatch.setattr(bhrigu_predictions, "get_openai_service", lambda: dummy)
    monkeypatch.setattr(bhrigu_predictions, "AstrologyCalculator", DummyCalculator)
    monkeypatch.setattr(bhrigu_predictions, "get_corpus_database", lambda: object())
    monkeypatch.setattr(section_parser_module, "_section_parser", None)
    return bhrigu_predictions.BhriguPredictionsService(), dummy


def _section(simple, technical="Moon in Leo, 11th house; Rahu in Capricorn."):
    return {"simple": simple, "timing": "Saturn–Venus period 2027", "technical": technical,
            "guidance": ["Do one", "Do two", "Do three"], "basis": ["BS-01"]}


def test_one_call_for_whole_category_and_clean_sections(monkeypatch):
    payload = {
        "overview": "Your Leo Moon wants recognition through service.",
        "key_insight": "Rahu in Capricorn pushes you toward public duty.",
        "sections": {
            "soul_purpose": _section("You are here to lead through service."),
            "karmic_blueprint": _section("An old pattern of seeking approval returns."),
            "evolution_stage": _section("You are learning to detach from praise."),
        },
    }
    service, dummy = _service(monkeypatch, payload)
    result = service.generate_karmic_journey_prediction(BIRTH)

    assert dummy.structured_calls == 1
    assert dummy.legacy_calls <= 2  # bounded repair of missing sections only
    assert result["overview"].startswith("Your Leo Moon")
    assert result["key_insight"].startswith("Rahu in Capricorn")
    assert result["soul_purpose"].startswith("**Key Insight:** You are here")
    assert "{" not in result["soul_purpose"]
    assert result["section_details"]["soul_purpose"]["guidance"] == ["Do one", "Do two", "Do three"]
    assert "Technical Analysis" not in result["user_views"]["soul_purpose"]
    assert "Technical Analysis" in result["astrologer_views"]["soul_purpose"]
    # Chart injected once (not re-sent as a Python dict summary)
    assert dummy.last_prompt.count("Planetary Positions") == 1


def test_identical_sections_are_deduplicated(monkeypatch):
    same = _section("Identical template text about your soul purpose.")
    payload = {"sections": {"soul_purpose": same, "karmic_blueprint": same, "life_mission": _section("Different text.")}}
    service, _ = _service(monkeypatch, payload)
    result = service.generate_karmic_journey_prediction(BIRTH)
    status = result["section_generation_status"]
    assert status["karmic_blueprint"]["status"] == "duplicate"
    assert "karmic_blueprint" not in result["section_order"]


def test_fallback_category_marker_routes_correctly():
    from services.openai_service import OpenAIService
    svc = OpenAIService.__new__(OpenAIService)
    prompt = "CATEGORY_KEY: life_events\nDo NOT mention soul purpose."
    assert svc._detect_category_from_prompt(prompt) == "life_events"

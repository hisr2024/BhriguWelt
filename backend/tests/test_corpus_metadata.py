import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services import corpus_loader as corpus_loader_module
from services import openai_service as openai_service_module
from services.bhrigu_predictions import BhriguPredictionsService


def test_metadata_marks_missing_corpus(monkeypatch):
    def fake_load(self):
        self.corpus_loaded = False
        self.corpus_base_path = None
        self.search_paths = ["missing/path"]
        self.missing_files = [
            "bhrigu_samhita_principles.yml",
            "nadi_jyotisha_principles.yml",
        ]
        self.bhrigu_data = {
            "principles": [],
            "remedies": [],
            "past_life_engines": [],
            "future_engines": [],
        }
        self.nadi_data = {"principles": [], "remedies": [], "observances": []}

    monkeypatch.setattr(corpus_loader_module.CorpusLoader, "_load_corpus", fake_load)
    monkeypatch.setattr(corpus_loader_module, "_corpus_loader", None)
    monkeypatch.setattr(openai_service_module, "_openai_service_instance", None)
    # Legacy offline pipeline is under test (strict mode raises instead of
    # falling back), and OpenAI HTTP must fail fast without real network.
    monkeypatch.setenv('BHRIGU_STRICT_PRECISION', 'false')
    import requests as requests_module
    def _no_network(*args, **kwargs):
        raise requests_module.exceptions.ConnectionError('offline test environment')
    monkeypatch.setattr(openai_service_module.requests, 'post', _no_network)

    service = BhriguPredictionsService()
    birth_data = {
        "date_of_birth": "1990-01-01",
        "time_of_birth": "12:00",
        "place_of_birth": "Mumbai, India",
        "zodiac_sign": "Leo",
        "moon_sign": "Leo",
        "ascendant": "Sagittarius",
        "nakshatra": "Magha",
    }

    result = service.generate_karmic_journey_prediction(birth_data)

    assert result["metadata"]["corpus_available"] is False

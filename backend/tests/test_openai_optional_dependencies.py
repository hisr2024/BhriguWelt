"""
Tests for optional dependency handling in OpenAIService.

The service imports its optional collaborators in two ways:
- the corpus loader through the module-level `get_corpus_loader` binding,
- the offline wisdom generator through a `from ... import` inside __init__.

Each test triggers the failure path the source actually implements and
asserts the structured error the service records.
"""
import os
import sys

# Ensure backend directory is in Python path for imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import services.openai_service as openai_service_module
from services.openai_service import OpenAIService


def test_missing_corpus_loader_sets_custom_error(monkeypatch):
    def broken_corpus_loader():
        raise ImportError("corpus loader unavailable")

    monkeypatch.setattr(openai_service_module, "get_corpus_loader", broken_corpus_loader)

    service = OpenAIService()

    assert service.corpus_available is False
    assert service.corpus_error["code"] == "corpus_loader_error"
    assert "corpus loader" in service.corpus_error["message"].lower()


def test_missing_offline_wisdom_sets_custom_error(monkeypatch):
    # A None entry in sys.modules makes `from services.bhrigu_offline_wisdom
    # import ...` raise ImportError, exercising the service's ImportError branch.
    monkeypatch.setitem(sys.modules, "services.bhrigu_offline_wisdom", None)

    service = OpenAIService()

    assert service.offline_wisdom is None
    assert service.offline_wisdom_error["code"] == "offline_wisdom_missing"

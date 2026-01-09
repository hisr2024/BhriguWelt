"""
Tests for optional dependency handling in OpenAIService.
"""
import importlib
import os
import sys
import types

# Ensure backend directory is in Python path for imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from services.openai_service import OpenAIService


def _make_stub_corpus_module():
    def get_corpus_loader():
        return {"loader": object(), "error": None}

    return types.SimpleNamespace(get_corpus_loader=get_corpus_loader)


def _make_stub_offline_module():
    class StubOfflineWisdom:
        pass

    def get_offline_wisdom_generator():
        return StubOfflineWisdom()

    return types.SimpleNamespace(get_offline_wisdom_generator=get_offline_wisdom_generator)


def _patch_import_module(monkeypatch, missing_module):
    original_import_module = importlib.import_module

    def fake_import_module(name, package=None):
        if name == missing_module:
            raise ModuleNotFoundError(f"No module named '{name}'")
        if name == "services.corpus_loader":
            return _make_stub_corpus_module()
        if name == "services.bhrigu_offline_wisdom":
            return _make_stub_offline_module()
        return original_import_module(name, package=package)

    monkeypatch.setattr(importlib, "import_module", fake_import_module)


def test_missing_corpus_loader_sets_custom_error(monkeypatch):
    _patch_import_module(monkeypatch, "services.corpus_loader")

    service = OpenAIService()

    assert service.corpus_available is False
    assert service.corpus_error["code"] == "corpus_loader_missing"
    assert "corpus loader" in service.corpus_error["message"].lower()


def test_missing_offline_wisdom_sets_custom_error(monkeypatch):
    _patch_import_module(monkeypatch, "services.bhrigu_offline_wisdom")

    service = OpenAIService()

    assert service.offline_wisdom is None
    assert service.offline_wisdom_error["code"] == "offline_wisdom_missing"

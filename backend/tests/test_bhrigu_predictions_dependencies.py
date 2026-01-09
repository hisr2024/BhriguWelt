import services.bhrigu_predictions as bhrigu_predictions
from services.bhrigu_predictions import BhriguPredictionsService


def test_service_accepts_dependency_overrides():
    dummy_openai = object()
    dummy_astrology = object()
    dummy_parser = object()
    dummy_corpus = object()

    service = BhriguPredictionsService(
        openai_service=dummy_openai,
        astrology_calculator=dummy_astrology,
        section_parser=dummy_parser,
        corpus_db=dummy_corpus,
    )

    assert service.openai_service is dummy_openai
    assert service.astrology_calculator is dummy_astrology
    assert service.section_parser is dummy_parser
    assert service.corpus_db is dummy_corpus
    assert service.init_errors == []


def test_get_bhrigu_service_uses_overrides(monkeypatch):
    dummy_openai = object()
    dummy_astrology = object()
    dummy_parser = object()
    dummy_corpus = object()

    monkeypatch.setattr(bhrigu_predictions, "_bhrigu_service", None)
    monkeypatch.setattr(bhrigu_predictions, "_bhrigu_service_init_error", None)

    service = bhrigu_predictions.get_bhrigu_service(
        force_reinit=True,
        openai_service=dummy_openai,
        astrology_calculator=dummy_astrology,
        section_parser=dummy_parser,
        corpus_db=dummy_corpus,
    )

    assert service.openai_service is dummy_openai
    assert service.astrology_calculator is dummy_astrology
    assert service.section_parser is dummy_parser
    assert service.corpus_db is dummy_corpus
    assert bhrigu_predictions.get_bhrigu_service() is service

import pytest

from bhriguwelt import horoscope


def _baseline_request(**overrides) -> horoscope.HoroscopeRequest:
    base = dict(
        name="Test Native",
        birth_date="1990-05-18",
        birth_time="04:30",
        birth_place="Varanasi",
        consent_for_date_predictions=True,
        lunar_tithi=5,
        moon_element="water",
        mars_house=10,
        saturn_house=2,
        venus_house=2,
        rahu_aspects_ascendant=True,
    )
    base.update(overrides)
    return horoscope.HoroscopeRequest(**base)


def _blank_bhrigu_bundle() -> dict:
    return {
        "principles": [],
        "remedies": [],
        "past_life_engines": [],
        "future_engines": [],
        "transit_rules": [],
        "matchmaking_criteria": [],
    }


def test_prediction_requires_bhrigu_corpus(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(horoscope.bhrigu_core, "application_bundle", lambda tradition: _blank_bhrigu_bundle())

    with pytest.raises(ValueError, match="Bhrigu Samhita dataset"):
        horoscope.build_prediction(_baseline_request())


def test_past_life_requires_bhrigu_corpus(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(horoscope.bhrigu_core, "application_bundle", lambda tradition: _blank_bhrigu_bundle())

    with pytest.raises(ValueError, match="Bhrigu Samhita dataset"):
        horoscope.build_past_life_report(_baseline_request())


def test_future_requires_bhrigu_corpus(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(horoscope.bhrigu_core, "application_bundle", lambda tradition: _blank_bhrigu_bundle())

    with pytest.raises(ValueError, match="Bhrigu Samhita dataset"):
        horoscope.build_future_report(_baseline_request())


def test_engine_outputs_require_bhrigu_corpus(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(horoscope.bhrigu_core, "application_bundle", lambda tradition: _blank_bhrigu_bundle())

    with pytest.raises(ValueError, match="Bhrigu Samhita dataset"):
        horoscope.build_engine_outputs(_baseline_request())


def test_matchmaking_requires_bhrigu_corpus(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(horoscope.bhrigu_core, "application_bundle", lambda tradition: _blank_bhrigu_bundle())

    partner_request = _baseline_request(name="Partner", birth_date="1992-09-09", moon_element="earth")

    with pytest.raises(ValueError, match="Bhrigu Samhita dataset"):
        horoscope.build_matchmaking_report(_baseline_request(), partner_request, ["remote-first"])

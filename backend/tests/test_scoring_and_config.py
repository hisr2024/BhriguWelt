from bhriguwelt.calculations import CelestialSnapshot, score_principles
from bhriguwelt.horoscope import HoroscopeRequest, build_prediction


def _snapshot(**overrides) -> CelestialSnapshot:
    base = dict(
        birth_date="1990-05-18",
        birth_time="04:30",
        birth_place="Ayodhya",
        lunar_tithi=5,
        moon_element="water",
        mars_house=10,
        saturn_house=2,
        venus_house=2,
        rahu_aspects_ascendant=True,
    )
    base.update(overrides)
    return CelestialSnapshot.from_strings(**base)


def test_antiquity_rank_overrides_heavier_weight():
    runtime_config = {
        "scoring": {
            "bayesian_alpha": 1.0,
            "bayesian_beta": 1.0,
            "ml_weight_floor": 0.5,
            "max_modifier": 1.0,
            "logistic_positive_bias": 0.0,
            "logistic_negative_bias": 0.0,
        },
        "conflicts": {
            "strategy": "antiquity",
            "prefer_higher_weight": True,
            "default_rank": 99,
            "antiquity_ranks": {},
        },
        "interpretation": {},
    }

    principles = [
        {"id": "NEW", "weights": {"insight": 0.9}, "tradition": "universal", "antiquity_rank": 50},
        {"id": "OLD", "weights": {"insight": 0.4}, "tradition": "universal", "antiquity_rank": 5},
    ]

    runtime_config["scoring"]["ml_enabled"] = True
    snapshot = _snapshot()
    baseline = score_principles(snapshot, principles[1:], runtime_config)
    scores = score_principles(snapshot, principles, runtime_config)

    assert scores == baseline


def test_interpretation_mentions_name_and_place():
    request = HoroscopeRequest(
        name="Config Native",
        birth_date="1990-05-18",
        birth_time="04:30",
        birth_place="Ayodhya",
        lunar_tithi=5,
        moon_element="water",
        mars_house=10,
        saturn_house=2,
        venus_house=2,
        rahu_aspects_ascendant=True,
    )

    report = build_prediction(request)
    assert "Config Native" in report.interpretation
    assert "Ayodhya" in report.interpretation

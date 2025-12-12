import pytest

from bhriguwelt.engine_interpreters import interpret_bhrigu_wisdom


@pytest.fixture
def complete_bundle():
    return {
        "principles": [{"id": "p1", "description": "Rule", "sutra_reference": "S1"}],
        "remedies": [{"id": "r1", "description": "Remedy", "sutra_reference": "S2"}],
        "past_life_engines": [
            {
                "id": "pl1",
                "description": "Past life context",
                "narrative": "A clear karmic echo.",
                "sutra_reference": "S3",
            }
        ],
        "future_engines": [
            {
                "id": "f1",
                "description": "Future track",
                "trajectory": "Steady growth",
                "sutra_reference": "S4",
            }
        ],
        "transit_rules": [
            {"id": "t1", "influence": "Transit guidance", "sutra_reference": "S5"}
        ],
        "matchmaking_criteria": [
            {
                "id": "m1",
                "description": "Compat criteria",
                "pair_rules": ["rule"],
                "sutra_reference": "S6",
            }
        ],
    }


def test_interpretations_validate_clean_corpus(complete_bundle):
    interpretations = interpret_bhrigu_wisdom(core_bundle=complete_bundle, tradition="universal")

    assert len(interpretations) == 6
    for interpretation in interpretations:
        assert interpretation.validated is True
        assert interpretation.rechecked is True
        assert interpretation.precision_score == 1.0
        assert "Check and recheck matched" in interpretation.precise_result
        assert "Bhrigu Samhita" in interpretation.precise_result


def test_interpretations_surface_missing_fields(complete_bundle):
    degraded = {**complete_bundle, "remedies": [{"id": "r1", "sutra_reference": "S2"}]}

    interpretations = interpret_bhrigu_wisdom(core_bundle=degraded, tradition="universal")
    remedies = next(item for item in interpretations if item.engine == "remedies")

    assert remedies.validated is False
    assert remedies.rechecked is True
    assert remedies.precision_score < 1.0
    assert any("description" in missing for missing in remedies.missing_fields)
    assert "requires manuscript review" in remedies.precise_result

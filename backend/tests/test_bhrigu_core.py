import bhriguwelt.bhrigu_core as core_module
from bhriguwelt.bhrigu_core import BhriguCore


def test_core_uses_cached_dataset(monkeypatch):
    calls = 0

    def loader():
        nonlocal calls
        calls += 1
        return {
            "principles": [],
            "remedies": [],
            "past_life_engines": [
                {
                    "id": "P1",
                    "description": "placeholder",
                    "narrative": "placeholder",
                    "sutra_reference": "folio",
                }
            ],
            "future_engines": [
                {
                    "id": "F1",
                    "description": "placeholder",
                    "trajectory": "placeholder",
                    "sutra_reference": "folio",
                }
            ],
            "transit_rules": [],
            "matchmaking_criteria": [],
        }

    monkeypatch.setattr(core_module, "load_bhrigu_data", loader)
    core = BhriguCore(cache_ttl_seconds=60)

    core.dataset()
    core.application_bundle("universal")

    assert calls == 1
    assert core.cache_stats()["dataset_present"] == 1


def test_application_bundle_filters_and_refreshes(monkeypatch):
    initial_dataset = {
        "metadata": {"source": "bhrigu"},
        "principles": [
            {"id": "A", "tradition": "universal"},
            {"id": "B", "tradition": "northern"},
            {"id": "C", "tradition": "southern"},
        ],
        "remedies": [{"id": "R1", "tradition": ["northern", "universal"]}],
        "past_life_engines": [
            {
                "id": "P1",
                "tradition": "southern",
                "description": "past placeholder",
                "narrative": "past narrative",
                "sutra_reference": "folio",
            }
        ],
        "future_engines": [
            {
                "id": "F1",
                "tradition": "northern",
                "description": "future placeholder",
                "trajectory": "future trajectory",
                "sutra_reference": "folio",
            }
        ],
        "transit_rules": [{"id": "T1", "tradition": "universal"}],
        "matchmaking_criteria": [{"id": "M1", "tradition": "northern"}],
    }

    replacement_dataset = {
        "principles": [{"id": "D", "tradition": "universal"}],
        "remedies": [],
        "past_life_engines": [],
        "future_engines": [],
        "transit_rules": [],
        "matchmaking_criteria": [],
    }

    monkeypatch.setattr(core_module, "load_bhrigu_data", lambda: initial_dataset)
    core = BhriguCore(cache_ttl_seconds=120)

    northern_bundle = core.application_bundle("northern")
    assert {p["id"] for p in northern_bundle["principles"]} == {"A", "B"}
    assert northern_bundle["remedies"][0]["id"] == "R1"
    assert northern_bundle["past_life_engines"] == []
    assert northern_bundle["future_engines"][0]["id"] == "F1"
    assert northern_bundle["transit_rules"][0]["id"] == "T1"
    assert northern_bundle["matchmaking_criteria"][0]["id"] == "M1"

    core.refresh(replacement_dataset)
    refreshed_bundle = core.application_bundle("universal")
    assert refreshed_bundle["principles"][0]["id"] == "D"
    assert refreshed_bundle["remedies"] == []

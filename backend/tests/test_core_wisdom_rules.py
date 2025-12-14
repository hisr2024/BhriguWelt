import json
from pathlib import Path

from bhriguwelt.core_wisdom_rules import core_wisdom_assets


def test_core_wisdom_assets_builds_in_memory_bundle():
    assets = core_wisdom_assets()

    assert assets["count"] == 108
    assert assets["created_at"] == "2025-12-14"
    assert assets["atomic_rules"][0]["rule_id"] == "BR-SU-01"
    assert assets["engine_spec"]["engine"]["name"] == "Bhrigu-Style Rule Engine"
    assert assets["matchmaking_model"]["module"]["name"] == "Bhrigu Matchmaking & Compatibility Model"
    assert assets["matchmaking_model"]["module"]["created_at"] == "2025-12-14"


def test_core_wisdom_assets_can_persist(tmp_path: Path):
    assets = core_wisdom_assets(out_dir=tmp_path, persist=True)

    atomic_path = Path(assets["atomic_rules_path"])
    engine_path = Path(assets["engine_spec_path"])
    matchmaking_path = Path(assets["matchmaking_model_path"])

    assert atomic_path.exists()
    assert engine_path.exists()
    assert matchmaking_path.exists()

    with atomic_path.open("r", encoding="utf-8") as handle:
        atomic_payload = json.load(handle)

    with matchmaking_path.open("r", encoding="utf-8") as matchmaking_handle:
        matchmaking_payload = json.load(matchmaking_handle)

    assert atomic_payload["count"] == 108
    assert atomic_payload["atomic_rules"][0]["planet"] == "Sun"
    assert matchmaking_payload["module"]["name"] == "Bhrigu Matchmaking & Compatibility Model"
    assert matchmaking_payload["scoring"]["weights"]["ashtakoota"] == 0.45

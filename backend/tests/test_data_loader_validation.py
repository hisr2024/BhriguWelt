"""Validation coverage for the Bhrigu Samhita data loader."""

import json
from pathlib import Path

import pytest

from bhriguwelt.data_loader import load_bhrigu_data


def _write_payload(tmp_path: Path, payload: dict) -> Path:
    target = tmp_path / "payload.json"
    target.write_text(json.dumps(payload))
    return target


def _valid_past_engine() -> dict:
    return {
        "id": "PL-TEST",
        "description": "past placeholder",
        "narrative": "narrative placeholder",
        "sutra_reference": "folio",
    }


def _valid_future_engine() -> dict:
    return {
        "id": "FU-TEST",
        "description": "future placeholder",
        "trajectory": "trajectory placeholder",
        "sutra_reference": "folio",
    }


def _valid_transit_rule() -> dict:
    return {
        "id": "TR-TEST",
        "influence": "Transit influence placeholder",
        "sutra_reference": "folio",
    }


def _valid_matchmaking_criteria() -> dict:
    return {
        "id": "MM-TEST",
        "pair_rules": "pairing guidance",
        "sutra_reference": "folio",
    }


def test_loader_rejects_missing_engine_blocks(tmp_path: Path):
    payload = {"principles": [], "remedies": []}
    path = _write_payload(tmp_path, payload)

    with pytest.raises(ValueError, match="past_life_engines"):
        load_bhrigu_data(path)


def test_loader_requires_manuscript_fields_for_engines(tmp_path: Path):
    payload = {
        "principles": [],
        "remedies": [],
        "past_life_engines": [_valid_past_engine()],
        "future_engines": [
            {
                "id": "FU-INVALID",
                "description": "future placeholder",
                "sutra_reference": "folio",
            }
        ],
        "transit_rules": [_valid_transit_rule()],
        "matchmaking_criteria": [_valid_matchmaking_criteria()],
    }
    path = _write_payload(tmp_path, payload)

    with pytest.raises(ValueError, match="trajectory"):
        load_bhrigu_data(path)


def test_loader_accepts_fully_populated_engine_blocks(tmp_path: Path):
    payload = {
        "principles": [],
        "remedies": [],
        "past_life_engines": [_valid_past_engine()],
        "future_engines": [_valid_future_engine()],
        "transit_rules": [_valid_transit_rule()],
        "matchmaking_criteria": [_valid_matchmaking_criteria()],
    }
    path = _write_payload(tmp_path, payload)

    loaded = load_bhrigu_data(path)

    assert loaded["past_life_engines"][0]["id"] == "PL-TEST"
    assert loaded["future_engines"][0]["id"] == "FU-TEST"
    assert loaded["transit_rules"][0]["id"] == "TR-TEST"
    assert loaded["matchmaking_criteria"][0]["id"] == "MM-TEST"


def test_loader_requires_transit_and_matchmaking_blocks(tmp_path: Path):
    payload = {
        "principles": [],
        "remedies": [],
        "past_life_engines": [_valid_past_engine()],
        "future_engines": [_valid_future_engine()],
    }
    path = _write_payload(tmp_path, payload)

    with pytest.raises(ValueError, match="transit_rules"):
        load_bhrigu_data(path)

    payload["transit_rules"] = [_valid_transit_rule()]

    with pytest.raises(ValueError, match="matchmaking_criteria"):
        load_bhrigu_data(_write_payload(tmp_path, payload))

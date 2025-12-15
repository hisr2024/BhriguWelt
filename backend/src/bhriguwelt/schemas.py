"""Shared schema fragments for the Bhrigu data platform."""

from __future__ import annotations

DATASET_SEGMENTS = (
    "principles",
    "remedies",
    "past_life_engines",
    "future_engines",
    "transit_rules",
    "matchmaking_criteria",
)

SUPPORTED_OPS = {"equals", "min", "max", "any_of"}

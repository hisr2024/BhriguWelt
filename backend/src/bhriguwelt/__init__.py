"""BhriguWelt astrology utilities sourced exclusively from the Bhrigu Samhita."""

from importlib import import_module
from typing import Any

__all__ = [
    "build_prediction",
    "build_past_life_report",
    "build_future_report",
    "build_matchmaking_report",
    "HoroscopeRequest",
    "HoroscopeReport",
    "PastLifeReport",
    "FutureReport",
    "MatchmakingReport",
]


def __getattr__(name: str) -> Any:  # pragma: no cover - passthrough
    if name in __all__:
        module = import_module(".horoscope", __name__)
        return getattr(module, name)
    raise AttributeError(f"module 'bhriguwelt' has no attribute {name}")

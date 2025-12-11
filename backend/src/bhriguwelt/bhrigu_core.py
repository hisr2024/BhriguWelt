from __future__ import annotations

"""Centralized Bhrigu Samhita core with cached access to manuscript data.

The core exposes a cache-aware interface around :func:`bhriguwelt.data_loader.load_bhrigu_data`
so multiple application surfaces (horoscopes, matchmaking, past-life readings, and
transit projections) can reuse a single in-memory snapshot sourced from the repository's
authentic Indian manuscript extracts.
"""

from copy import deepcopy
from threading import Lock
from time import monotonic
from typing import Any, Dict, List

from .data_loader import load_bhrigu_data


class BhriguCore:
    """Cache-first accessor for the Bhrigu Samhita corpus."""

    def __init__(self, cache_ttl_seconds: int = 900) -> None:
        self.cache_ttl_seconds = cache_ttl_seconds
        self._lock = Lock()
        self._dataset_cache: tuple[float, Dict[str, Any]] | None = None
        self._segment_cache: dict[tuple[str, str], tuple[float, List[Dict[str, Any]]]] = {}

    @staticmethod
    def _filter_by_tradition(entries: List[Dict[str, Any]], tradition: str) -> List[Dict[str, Any]]:
        normalized = (tradition or "universal").lower()
        filtered: List[Dict[str, Any]] = []
        for entry in entries:
            entry_tradition = entry.get("tradition")
            if not entry_tradition:
                filtered.append(entry)
                continue

            if isinstance(entry_tradition, (list, tuple, set)):
                normalized_entry = {str(item).lower() for item in entry_tradition}
                if normalized in normalized_entry or "universal" in normalized_entry:
                    filtered.append(entry)
                continue

            normalized_entry = str(entry_tradition).lower()
            if normalized_entry == "universal" or normalized_entry == normalized or normalized == "universal":
                filtered.append(entry)

        return filtered

    def _dataset(self, now: float | None = None) -> Dict[str, Any]:
        timestamp = now if now is not None else monotonic()
        with self._lock:
            if self._dataset_cache and timestamp - self._dataset_cache[0] < self.cache_ttl_seconds:
                return deepcopy(self._dataset_cache[1])

            dataset = load_bhrigu_data()
            self._dataset_cache = (timestamp, dataset)
            self._segment_cache.clear()
            return deepcopy(dataset)

    def _segment(self, key: str, tradition: str) -> List[Dict[str, Any]]:
        normalized = (tradition or "universal").lower()
        cache_key = (normalized, key)
        dataset = self._dataset()
        now = monotonic()

        with self._lock:
            cached = self._segment_cache.get(cache_key)
            if cached and now - cached[0] < self.cache_ttl_seconds:
                return deepcopy(cached[1])

            values = dataset.get(key, []) if isinstance(dataset, dict) else []
            filtered = self._filter_by_tradition(values if isinstance(values, list) else [], normalized)
            self._segment_cache[cache_key] = (now, filtered)
            return deepcopy(filtered)

    def application_bundle(self, tradition: str | None = None) -> Dict[str, Any]:
        normalized = (tradition or "universal").lower()
        dataset = self._dataset()
        return {
            "metadata": deepcopy(dataset.get("metadata", {})),
            "principles": self._segment("principles", normalized),
            "remedies": self._segment("remedies", normalized),
            "past_life_engines": self._segment("past_life_engines", normalized),
            "future_engines": self._segment("future_engines", normalized),
            "transit_rules": self._segment("transit_rules", normalized),
            "matchmaking_criteria": self._segment("matchmaking_criteria", normalized),
        }

    def dataset(self) -> Dict[str, Any]:
        return self._dataset()

    def refresh(self, payload: Dict[str, Any] | None = None) -> Dict[str, Any]:
        now = monotonic()
        with self._lock:
            dataset = deepcopy(payload) if payload is not None else load_bhrigu_data()
            self._dataset_cache = (now, dataset)
            self._segment_cache.clear()
            return deepcopy(dataset)

    def cache_stats(self) -> Dict[str, int]:
        with self._lock:
            return {
                "dataset_present": int(self._dataset_cache is not None),
                "segments": len(self._segment_cache),
            }


bhrigu_core = BhriguCore()


def get_bhrigu_core() -> BhriguCore:
    return bhrigu_core

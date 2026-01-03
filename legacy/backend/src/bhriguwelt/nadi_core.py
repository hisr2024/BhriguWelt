"""Cache-first access to Nadi Jyotisha core wisdom datasets."""

from __future__ import annotations

from copy import deepcopy
from pathlib import Path
from threading import Lock
from time import monotonic
from typing import Any, Dict, List

from .nadi_loader import current_nadi_path, load_nadi_data


class NadiCore:
    """Cache-first accessor for Nadi Jyotisha folios."""

    def __init__(self, cache_ttl_seconds: int = 900) -> None:
        self.cache_ttl_seconds = cache_ttl_seconds
        self._lock = Lock()
        self._dataset_cache: tuple[float, Path, Dict[str, Any]] | None = None
        self._segment_cache: dict[tuple[str, str], tuple[float, List[Dict[str, Any]]]] = {}

    @staticmethod
    def _filter_by_tradition(entries: List[Dict[str, Any]], tradition: str) -> List[Dict[str, Any]]:
        normalized = (tradition or "nadi").lower()
        filtered: List[Dict[str, Any]] = []
        for entry in entries:
            entry_tradition = entry.get("tradition")
            if not entry_tradition:
                filtered.append(entry)
                continue

            if isinstance(entry_tradition, (list, tuple, set)):
                normalized_entry = {str(item).lower() for item in entry_tradition}
                if normalized in normalized_entry or "nadi" in normalized_entry:
                    filtered.append(entry)
                continue

            normalized_entry = str(entry_tradition).lower()
            if normalized_entry == normalized or normalized_entry == "nadi":
                filtered.append(entry)

        return filtered

    def _dataset(self, now: float | None = None) -> Dict[str, Any]:
        timestamp = now if now is not None else monotonic()
        active_path = current_nadi_path()
        with self._lock:
            if (
                self._dataset_cache
                and self._dataset_cache[1] == active_path
                and timestamp - self._dataset_cache[0] < self.cache_ttl_seconds
            ):
                return deepcopy(self._dataset_cache[2])

            dataset = load_nadi_data()
            self._dataset_cache = (timestamp, active_path, dataset)
            self._segment_cache.clear()
            return deepcopy(dataset)

    def _segment(self, key: str, tradition: str) -> List[Dict[str, Any]]:
        normalized = (tradition or "nadi").lower()
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
        normalized = (tradition or "nadi").lower()
        dataset = self._dataset()
        return {
            "metadata": deepcopy(dataset.get("metadata", {})),
            "principles": self._segment("principles", normalized),
            "remedies": self._segment("remedies", normalized),
            "observances": self._segment("observances", normalized),
        }

    def dataset(self) -> Dict[str, Any]:
        return self._dataset()

    def refresh(self, payload: Dict[str, Any] | None = None) -> Dict[str, Any]:
        now = monotonic()
        with self._lock:
            dataset = deepcopy(payload) if payload is not None else load_nadi_data()
            self._dataset_cache = (now, current_nadi_path(), dataset)
            self._segment_cache.clear()
            return deepcopy(dataset)

    def cache_stats(self) -> Dict[str, int]:
        with self._lock:
            return {
                "dataset_present": int(self._dataset_cache is not None),
                "segments": len(self._segment_cache),
            }


nadi_core = NadiCore()


def get_nadi_core() -> NadiCore:
    return nadi_core


__all__ = ["NadiCore", "get_nadi_core", "nadi_core"]

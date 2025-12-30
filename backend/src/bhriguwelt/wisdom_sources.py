"""Canonical catalog of authentic Indian wisdom sources for the Wisdom core."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Sequence


@dataclass(frozen=True)
class WisdomSource:
    name: str
    tradition: str
    category: str
    description: str

    def to_dict(self) -> Dict[str, str]:
        return {
            "name": self.name,
            "tradition": self.tradition,
            "category": self.category,
            "description": self.description,
        }


AUTHENTIC_SOURCES: Sequence[WisdomSource] = (
    WisdomSource(
        name="Bhrigu Samhita",
        tradition="bhrigu",
        category="manuscript",
        description="Palm-leaf manuscripts of Bhrigu lineage used for predictive sutras.",
    ),
    WisdomSource(
        name="Nadi Jyotisha",
        tradition="nadi",
        category="manuscript",
        description="Nadi palm-leaf traditions focused on karmic narratives and remedies.",
    ),
    WisdomSource(
        name="Brihat Parashara Hora Shastra",
        tradition="classical",
        category="treatise",
        description="Foundational classical compendium on jyotisha principles and techniques.",
    ),
    WisdomSource(
        name="Jaimini Sutras",
        tradition="classical",
        category="sutra",
        description="Sutra-based aphorisms emphasizing rashi and karaka techniques.",
    ),
    WisdomSource(
        name="Phaladeepika",
        tradition="classical",
        category="treatise",
        description="Medieval treatise offering predictive combinations and yogas.",
    ),
    WisdomSource(
        name="Saravali",
        tradition="classical",
        category="treatise",
        description="Compendium of planetary effects, house meanings, and yogas.",
    ),
    WisdomSource(
        name="Sarvartha Chintamani",
        tradition="classical",
        category="treatise",
        description="Authoritative text on planetary results and timing indicators.",
    ),
    WisdomSource(
        name="Jataka Parijata",
        tradition="classical",
        category="treatise",
        description="Classical reference for natal chart synthesis and result evaluation.",
    ),
)


def _dedupe_sources(sources: Sequence[WisdomSource]) -> List[WisdomSource]:
    seen = set()
    unique: List[WisdomSource] = []
    for source in sources:
        key = source.name.strip().lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(source)
    return unique


def source_catalog() -> List[Dict[str, str]]:
    """Return a de-duplicated list of authentic source references."""

    return [source.to_dict() for source in _dedupe_sources(AUTHENTIC_SOURCES)]


__all__ = ["WisdomSource", "AUTHENTIC_SOURCES", "source_catalog"]

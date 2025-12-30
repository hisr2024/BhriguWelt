"""Fallback Nadi Jyotisha core dataset for offline use."""

from __future__ import annotations

from typing import Any, Dict

DEFAULT_NADI_DATA: Dict[str, Any] = {
    "metadata": {
        "title": "Nadi Jyotisha Core Wisdom Keys",
        "compiled_by": "BhriguWelt Research",
        "source_note": (
            "Nadi Jyotisha readings are preserved as karmic narratives and remedial observances. "
            "The entries below are distilled from palm-leaf recensions safeguarded in Tamil Nadu and allied lineages."
        ),
        "integrity": {
            "schema_version": "2025-02",
            "reviewed_by": ["BhriguWelt Research"],
            "transmission_note": (
                "Narratives are preserved verbatim where possible; any modern gloss is marked explicitly in downstream apps."
            ),
        },
        "regulations": [
            "Honor the seeker’s stated name, birth date, birth time, and birth place before issuing any narrative.",
            "Deliver only the sutra-backed narrative segments and remedies drawn from the stored folios.",
            "Avoid speculative additions beyond the recorded leaf guidance.",
        ],
    },
    "principles": [
        {
            "id": "ND-1",
            "tradition": "nadi",
            "sutra_reference": "Chidambaram leaf 7a",
            "description": (
                "When the birth star aligns with a lunar waxing phase, the Nadi speaks of a vow to restore family harmony "
                "through ritual service and steady speech."
            ),
            "focus_tags": ["family", "speech", "ritual"],
        },
        {
            "id": "ND-2",
            "tradition": "nadi",
            "sutra_reference": "Vaitheeswaran Koil leaf 12c",
            "description": (
                "A strong lagna lord in a kendra is recorded as a karmic promise of leadership duties, tempered by humility "
                "and obligation to elders."
            ),
            "focus_tags": ["leadership", "dharma", "elders"],
        },
        {
            "id": "ND-3",
            "tradition": "nadi",
            "sutra_reference": "Kanchipuram leaf 5b",
            "description": (
                "If benefics guard the ninth house, the Nadi preserves a lineage of spiritual teachers and requires regular "
                "pilgrimage for renewal."
            ),
            "focus_tags": ["teachers", "pilgrimage", "faith"],
        },
        {
            "id": "ND-4",
            "tradition": "nadi",
            "sutra_reference": "Thanjavur leaf 22d",
            "description": (
                "Rahu’s influence on the moon is described as a life of foreign exchange and innovation, balanced by meditation "
                "on ancestral deities."
            ),
            "focus_tags": ["foreign", "innovation", "ancestral"],
        },
    ],
    "remedies": [
        {
            "id": "NR-1",
            "sutra_reference": "Remedy folio 3a",
            "description": "Light ghee lamps on Mondays and offer white flowers to the moon deity to calm the mind stream.",
            "focus_tags": ["mind", "peace"],
        },
        {
            "id": "NR-2",
            "sutra_reference": "Remedy folio 9b",
            "description": "Serve meals to elders or teachers on Saturdays to balance Saturnine obligations.",
            "focus_tags": ["elders", "service", "saturn"],
        },
        {
            "id": "NR-3",
            "sutra_reference": "Remedy folio 14c",
            "description": "Recite the specified lineage mantra for 41 days to restore ancestral blessings.",
            "focus_tags": ["ancestral", "mantra"],
        },
    ],
    "observances": [
        {
            "id": "NO-1",
            "sutra_reference": "Observance leaf 2d",
            "description": (
                "Maintain truthful speech during waxing moon fortnights; the Nadi records this as a safeguard for prosperity."
            ),
            "focus_tags": ["speech", "prosperity"],
        },
        {
            "id": "NO-2",
            "sutra_reference": "Observance leaf 11a",
            "description": (
                "Perform yearly pilgrimage or temple service to renew karmic vows when major dashas change."
            ),
            "focus_tags": ["pilgrimage", "dashas", "service"],
        },
    ],
}


def as_dict() -> Dict[str, Any]:
    return {
        "metadata": dict(DEFAULT_NADI_DATA.get("metadata", {})),
        "principles": list(DEFAULT_NADI_DATA.get("principles", [])),
        "remedies": list(DEFAULT_NADI_DATA.get("remedies", [])),
        "observances": list(DEFAULT_NADI_DATA.get("observances", [])),
    }


__all__ = ["as_dict", "DEFAULT_NADI_DATA"]

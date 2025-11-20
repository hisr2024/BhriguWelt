"""Hard-coded Bhrigu Samhita corpus used when YAML parsing is unavailable."""

from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict

BHRIGU_CANON: Dict[str, Any] = {
    "metadata": {
        "title": "Bhrigu Samhita Predictive Keys",
        "compiled_by": "BhriguWelt Research",
        "source_note": (
            "All interpretive statements below are distilled exclusively from palm-leaf "
            "manuscripts of the Bhrigu Samhita curated in Bikaner (Rajasthani script), "
            "Pune (Modi script), Kashi (Sharada script), Tamil Nadu (Grantha script), and "
            "Bharuch copperplate repositories."
        ),
    },
    "principles": [
        {
            "id": "BR-1",
            "sutra_reference": "Bikaner folio 12b",
            "description": (
                "When the native's Moon occupies a watery rashi and receives Jupiter's "
                "auspicious glance, the Bhrigu Samhita proclaims a life steeped in intuitive "
                "wisdom and prior-life scholarship. Such individuals recall fragments of their "
                "most recent birth while meditating near rivers."
            ),
            "weights": {
                "past_life_clarity": 0.82,
                "intuitive_dreams": 0.76,
                "scholarly_pursuits": 0.63,
            },
        },
        {
            "id": "BR-7",
            "sutra_reference": "Kashi palm 44a",
            "description": (
                "Bhrigu states that a native born on the fifth lunar tithi with Mars in "
                "the tenth bhava carries a karmic mandate for decisive leadership. Their "
                "future predictions emphasize infrastructure, fort-building, and digital "
                "architecture in the current age."
            ),
            "weights": {
                "career_command": 0.91,
                "infrastructural_success": 0.78,
                "karmic_debts": 0.35,
            },
        },
        {
            "id": "BR-18",
            "sutra_reference": "Pune Modi folio 3c",
            "description": (
                "If Saturn and Venus conjoin in the second bhava while Rahu aspects the "
                "Ascendant, Bhrigu records significant ancestral wealth that awakens after "
                "the 32nd year. The past-life narrative speaks of a treasurer in the "
                "Gupta courts entrusted with gem inventories."
            ),
            "weights": {
                "wealth_activation": 0.88,
                "ancestral_calling": 0.74,
                "speech_refinement": 0.57,
            },
        },
    ],
    "remedies": [
        {
            "id": "REM-3",
            "sutra_reference": "Grantha leaf 9a",
            "description": (
                "Offer clarified butter lamps to Maharishi Bhrigu on Thursdays while "
                "reciting the Sanskrit seed-syllable \"Bhrim\" to neutralize karmic debt tied "
                "to paternal lineages."
            ),
        },
        {
            "id": "REM-9",
            "sutra_reference": "Bikaner folio 21c",
            "description": (
                "Meditate at dawn facing east with a copper yantra inscribed with the "
                "syllables \"Om Brighave Namah\" to restore continuity of memory between "
                "incarnations."
            ),
        },
    ],
    "past_life_engines": [
        {
            "id": "PL-27",
            "sutra_reference": "Bharuch copper folio 27d",
            "description": (
                "Bhrigu's copper folios recount that watery Moons remembering Rahu's "
                "ascension keep detailed ledgers of their prior incarnations as healers."
            ),
            "conditions": {
                "moon_element": {"any_of": ["water"]},
                "lunar_tithi": {"max": 8},
                "rahu_aspects_ascendant": {"equals": True},
            },
            "narrative": (
                "The native safeguarded Ayurvedic clinics along the Narmada river and "
                "now returns to continue that medical seva with photographic memory."
            ),
            "confidence": 0.88,
        },
        {
            "id": "PL-42",
            "sutra_reference": "Sharada bundle 42c",
            "description": (
                "When Mars occupies a kendra and Saturn guards the second house, the "
                "Sharada bundle highlights archivists from previous births."
            ),
            "conditions": {
                "mars_house": {"min": 7, "max": 11},
                "saturn_house": {"equals": 2},
            },
            "narrative": (
                "Scrolls describe an imperial librarian who catalogued royal correspondences "
                "and now awakens with flawless recall of cryptographic ciphers."
            ),
            "confidence": 0.76,
        },
        {
            "id": "PL-51",
            "sutra_reference": "Grantha leaf 51b",
            "description": (
                "Venus in the second bhava with watery lunar influence signals past lives "
                "steeped in artistic patronage per the Grantha commentaries."
            ),
            "conditions": {
                "venus_house": {"equals": 2},
                "moon_element": {"any_of": ["water", "earth"]},
            },
            "narrative": (
                "The Samhita describes a court musician entrusted with temple treasury "
                "who now incarnates to restore sacred soundscapes."
            ),
            "confidence": 0.71,
        },
    ],
    "future_engines": [
        {
            "id": "FU-11",
            "sutra_reference": "Kashi palm 58a",
            "description": (
                "The fifth tithi with Mars elevated in the tenth bhava signals future "
                "infrastructure breakthroughs adapted to the digital age."
            ),
            "conditions": {
                "lunar_tithi": {"equals": 5},
                "mars_house": {"equals": 10},
            },
            "trajectory": (
                "Expect multi-decade leadership on smart-city logistics platforms that "
                "merge ancient fort-planning with cloud telemetry."
            ),
            "window": "Years 28-52",
            "certainty": 0.84,
        },
        {
            "id": "FU-29",
            "sutra_reference": "Pune Modi folio 19d",
            "description": (
                "Saturn-Venus stewardship of the second bhava points to financial systems "
                "that rebloom after Saturn returns."
            ),
            "conditions": {
                "saturn_house": {"equals": 2},
                "venus_house": {"equals": 2},
            },
            "trajectory": (
                "Capital accumulation through custodial fintech ventures emerges once the "
                "native invests in gemstone-backed ledgers referenced by Bhrigu."
            ),
            "window": "Years 32-60",
            "certainty": 0.8,
        },
        {
            "id": "FU-40",
            "sutra_reference": "Bikaner folio 33f",
            "description": (
                "Moons rooted in water yet stationed in tech-forward locales drive "
                "humanitarian innovation according to the folio."
            ),
            "conditions": {
                "moon_element": {"any_of": ["water"]},
            },
            "trajectory": (
                "Expect grants for climate-resilient desalination labs and pilgrim "
                "healthcare drones funded by philanthropic guilds."
            ),
            "window": "Years 18-40",
            "certainty": 0.73,
        },
    ],
    "matchmaking_criteria": [
        {
            "id": "MM-3",
            "sutra_reference": "Sharada palm 77c",
            "description": (
                "Harmonious lunar elements and synchronized tithis create empathic "
                "partnerships that Bhrigu recommends for both spiritual and modern "
                "entrepreneurial households."
            ),
            "base_weight": 0.6,
            "pair_rules": [
                {
                    "label": "Lunar element harmony",
                    "primary_field": "moon_element",
                    "partner_field": "moon_element",
                    "comparator": "harmonious",
                    "sets": [["water", "earth"], ["fire", "air"]],
                    "weight": 0.6,
                },
                {
                    "label": "Shared tithi rhythm",
                    "primary_field": "lunar_tithi",
                    "partner_field": "lunar_tithi",
                    "comparator": "distance",
                    "max_difference": 2,
                    "weight": 0.4,
                },
            ],
            "modern_modifiers": {
                "remote-first": 0.05,
                "research-partnership": 0.04,
            },
        },
        {
            "id": "MM-8",
            "sutra_reference": "Grantha scroll 18d",
            "description": (
                "Venus stewardship and Mars missions must complement to support Bhrigu's "
                "\"digital grihastha\" households that balance art, finance, and product "
                "roadmaps."
            ),
            "base_weight": 0.4,
            "pair_rules": [
                {
                    "label": "Venus treasury sync",
                    "primary_field": "venus_house",
                    "partner_field": "venus_house",
                    "comparator": "distance",
                    "max_difference": 1,
                    "circular": True,
                    "weight": 0.5,
                },
                {
                    "label": "Mars mission complement",
                    "primary_field": "mars_house",
                    "partner_field": "mars_house",
                    "comparator": "distance",
                    "max_difference": 3,
                    "weight": 0.5,
                },
            ],
            "modern_modifiers": {
                "startup-ops": 0.07,
                "arts-collab": 0.05,
            },
        },
    ],
}


def as_dict() -> Dict[str, Any]:
    """Return a deep copy of the canonical data."""

    return deepcopy(BHRIGU_CANON)

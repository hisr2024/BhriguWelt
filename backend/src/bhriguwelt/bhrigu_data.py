"""Hard-coded Bhrigu Samhita corpus used when YAML parsing is unavailable."""

from __future__ import annotations

import json
from copy import deepcopy
from typing import Any, Dict

_RAW_CORPUS = r"""
{
    "metadata": {
        "title": "Bhrigu Samhita Predictive Keys",
        "compiled_by": "BhriguWelt Research",
        "source_note": "All interpretive statements below are distilled exclusively from palm-leaf manuscripts of the Bhrigu Samhita curated in Bikaner (Rajasthani script), Pune (Modi script), Kashi (Sharada script), Tamil Nadu (Grantha script), and Bharuch copperplate repositories."
    },
    "principles": [
        {
            "id": "BR-1",
            "tradition": "universal",
            "sutra_reference": "Bikaner folio 12b",
            "description": "When the native's Moon occupies a watery rashi and receives Jupiter's auspicious glance, the Bhrigu Samhita proclaims a life steeped in intuitive wisdom and prior-life scholarship. Such individuals recall fragments of their most recent birth while meditating near rivers.",
            "weights": {
                "past_life_clarity": 0.82,
                "intuitive_dreams": 0.76,
                "scholarly_pursuits": 0.63
            }
        },
        {
            "id": "BR-7",
            "tradition": "northern",
            "sutra_reference": "Kashi palm 44a",
            "description": "Bhrigu states that a native born on the fifth lunar tithi with Mars in the tenth bhava carries a karmic mandate for decisive leadership. Their future predictions emphasize infrastructure, fort-building, and digital architecture in the current age.",
            "weights": {
                "career_command": 0.91,
                "infrastructural_success": 0.78,
                "karmic_debts": 0.35
            }
        },
        {
            "id": "BR-18",
            "tradition": "western-grantha",
            "sutra_reference": "Pune Modi folio 3c",
            "description": "If Saturn and Venus conjoin in the second bhava while Rahu aspects the Ascendant, Bhrigu records significant ancestral wealth that awakens after the 32nd year. The past-life narrative speaks of a treasurer in the Gupta courts entrusted with gem inventories.",
            "weights": {
                "wealth_activation": 0.88,
                "ancestral_calling": 0.74,
                "speech_refinement": 0.57
            }
        },
        {
            "id": "BR-19",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 19b",
            "description": "Ketu residing in the twelfth bhava with a waxing Moon in a watery rashi indicates a contemplative mendicant in prior births. The manuscript notes clairvoyant dreams and strong detachment from material pursuits.",
            "weights": {
                "past_life_clarity": 0.69,
                "spiritual_detachment": 0.81,
                "dream_recall": 0.72
            }
        },
        {
            "id": "BR-22",
            "tradition": "northern",
            "sutra_reference": "Bikaner folio 27a",
            "description": "Mercury conjoined with Jupiter in the fifth bhava yields matchmaking acumen and scriptural fluency. The folio remarks on skilled interpreters who reconcile families through scholarship.",
            "weights": {
                "matchmaking_insight": 0.77,
                "scholarly_pursuits": 0.68,
                "conciliatory_skill": 0.71
            }
        },
        {
            "id": "BR-30",
            "tradition": "universal",
            "sutra_reference": "Bharuch copper 30c",
            "description": "Retrograde Saturn aspecting Mars in a kendra signals rigorous patience and disciplined rebuilding after setbacks. Bhrigu aligns this with infrastructural resilience and long-term karma clearing.",
            "weights": {
                "resilience": 0.83,
                "infrastructural_success": 0.66,
                "karmic_debts": 0.49
            }
        },
        {
            "id": "BR-33",
            "tradition": [
                "northern",
                "southern-grantha"
            ],
            "sutra_reference": "Northern Bhrigu bundle 5a",
            "description": "When Ketu aspects the Ascendant while Jupiter guards the ninth house, the northern recension highlights sudden manuscript discoveries and breakthrough research allies from distant lands.",
            "weights": {
                "research_partners": 0.81,
                "spiritual_detachment": 0.52,
                "publication_success": 0.69
            }
        },
        {
            "id": "BR-38",
            "tradition": "western-grantha",
            "sutra_reference": "Grantha copper 38c",
            "description": "Venus in the eleventh with Rahu conjoining Mercury indicates digital patronage networks and multilingual product releases blessed by Bhrigu.",
            "weights": {
                "network_effects": 0.77,
                "language_mastery": 0.64,
                "venture_success": 0.72
            }
        },
        {
            "id": "BR-41",
            "tradition": "southern-grantha",
            "sutra_reference": "Tanjore palm 41d",
            "description": "Ketu in trine to Moon while Saturn retrogrades through a moksha bhava yields vivid dream visitations from rishis and strong retreat leadership.",
            "weights": {
                "dream_recall": 0.83,
                "retreat_facilitation": 0.71,
                "moksha_drive": 0.78
            }
        },
        {
            "id": "BR-46",
            "tradition": "northern",
            "sutra_reference": "Kashi folio 46b",
            "description": "Mars in the third with exalted Sun grants bold communicators who champion civic technology; Bhrigu prescribes hackathon-style seva.",
            "weights": {
                "public_speaking": 0.74,
                "civic_tech": 0.79,
                "courage": 0.68
            }
        },
        {
            "id": "BR-52",
            "tradition": "universal",
            "sutra_reference": "Bharuch copper 52a",
            "description": "Moon in an airy sign receiving Ketu's aspect promises strong data literacy and karmic duty to steward open knowledge commons.",
            "weights": {
                "data_stewardship": 0.73,
                "open_knowledge": 0.75,
                "collaboration": 0.7
            }
        },
        {
            "id": "BR-61",
            "tradition": [
                "northern",
                "western-grantha"
            ],
            "sutra_reference": "Sharada bundle 61c",
            "description": "Mercury and Venus exchanging signs with Saturn in upachaya bhavas signals a karmic arc of teaching, mentoring, and standards writing.",
            "weights": {
                "mentorship": 0.82,
                "standards_authorship": 0.73,
                "teaching_call": 0.69
            }
        },
        {
            "id": "BR-68",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha scroll 68f",
            "description": "When Moon transits Magha with exalted Jupiter, Bhrigu assigns royal restoration duties and digital heritage archiving in this age.",
            "weights": {
                "heritage_archives": 0.84,
                "leadership": 0.66,
                "ancestral_pride": 0.62
            }
        },
        {
            "id": "BR-72",
            "tradition": "universal",
            "sutra_reference": "Composite oral 72",
            "description": "Rahu in the seventh receiving Jupiter's aspect produces cross-cultural alliances and long-term global collaborations when honored with sincerity.",
            "weights": {
                "global_collab": 0.76,
                "marriage_endurance": 0.69,
                "bridge_building": 0.71
            }
        },
        {
            "id": "BR-73",
            "tradition": "northern",
            "sutra_reference": "Bikaner folio 45d",
            "description": "Ketu in the twelfth bhava with Mercury fortified in the fourth yields monastic translators who balance solitude with community archives. Bhrigu notes their ability to sustain daily meditation alongside rigorous record keeping.",
            "weights": {
                "spiritual_detachment": 0.84,
                "translation_gift": 0.72,
                "archive_care": 0.67
            }
        },
        {
            "id": "BR-74",
            "tradition": "northern",
            "sutra_reference": "Kashi palm 82b",
            "description": "Mercury receiving Jupiter's aspect in dual signs produces interpreters who revive commentaries lost to floods. The folio links their service to rebuilding temple libraries after monsoon damage.",
            "weights": {
                "commentary_revival": 0.78,
                "scholarly_pursuits": 0.73,
                "disaster_response": 0.61
            }
        },
        {
            "id": "BR-75",
            "tradition": "western-grantha",
            "sutra_reference": "Pune Modi folio 25c",
            "description": "A waxing Moon conjoined with Jupiter while Ketu guards the twelfth bhava inspires bilingual scribes who preserve merchant guild ledgers. The Modi annotation ties their karma to ethical accounting in border towns.",
            "weights": {
                "ethical_wealth": 0.71,
                "bilingual_fluency": 0.76,
                "pilgrimage_service": 0.58
            }
        },
        {
            "id": "BR-76",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 70a",
            "description": "When Ketu occupies the twelfth and Venus rules the ninth, the Grantha leaf praises contemplatives who uplift devotional art for pilgrims. They curate soundscapes and lighting in sanctuaries while keeping silence vows.",
            "weights": {
                "artistic_service": 0.74,
                "spiritual_detachment": 0.8,
                "pilgrimage_service": 0.63
            }
        },
        {
            "id": "BR-77",
            "tradition": "northern",
            "sutra_reference": "Kashi scroll 83d",
            "description": "Mercury-Jupiter mutual reception in kendra houses signals research pairs who translate law codes and mediate disputes. Bhrigu assigns them to civic courts and modern compliance work.",
            "weights": {
                "conciliatory_skill": 0.77,
                "research_partners": 0.79,
                "legal_draftsmanship": 0.7
            }
        },
        {
            "id": "BR-78",
            "tradition": "southern-grantha",
            "sutra_reference": "Tanjore palm 41f",
            "description": "Ketu twelfth with Saturn aspecting from the eighth denotes retreat leaders who hold space for grief rituals. The manuscript stresses their grounding breathwork and marshaling of community healers.",
            "weights": {
                "grief_counsel": 0.82,
                "retreat_facilitation": 0.75,
                "karmic_debts": 0.52
            }
        },
        {
            "id": "BR-79",
            "tradition": "universal",
            "sutra_reference": "Bharuch copper 61a",
            "description": "Rahu conjoined Mercury in the third with Jupiter's ninth aspect produces data storytellers who bridge ancestral lore with civic dashboards. Copper etchings emphasize truthful visualization practices.",
            "weights": {
                "data_stewardship": 0.78,
                "storytelling": 0.69,
                "civic_tech": 0.66
            }
        },
        {
            "id": "BR-80",
            "tradition": "western-grantha",
            "sutra_reference": "Pune Modi folio 28b",
            "description": "Jupiter retrograde in the eleventh facing Mercury in the fifth yields product visionaries who revive postponed scholarly tools. The folio notes delayed yet enduring patronage from educator guilds.",
            "weights": {
                "innovation_patience": 0.77,
                "scholarly_pursuits": 0.72,
                "patronage": 0.64
            }
        },
        {
            "id": "BR-81",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha scroll 72d",
            "description": "Moon in Rohini with Ketu in twelfth and Venus exalted signals artists who blend traditional crafts with digital residencies. Bhrigu ties their karma to curating immersive heritage exhibits.",
            "weights": {
                "artistic_service": 0.81,
                "digital_curation": 0.7,
                "moksha_drive": 0.62
            }
        },
        {
            "id": "BR-82",
            "tradition": "northern",
            "sutra_reference": "Sharada bundle 88c",
            "description": "Mercury combust under Sun while Jupiter aspects from a trikona grants sharp editors who rescue corrupted manuscripts. The Sharada bundle praises their stamina in disinfecting mold-damaged libraries.",
            "weights": {
                "preservation_skill": 0.82,
                "editorial_precision": 0.74,
                "health_resilience": 0.6
            }
        },
        {
            "id": "BR-83",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 74b",
            "description": "Ketu twelfth with Mercury in the second and Jupiter in the ninth inspires polyglot singers who archive oral histories. They travel shrine circuits to record vanishing ragas.",
            "weights": {
                "oral_archive": 0.78,
                "multilingual_chant": 0.73,
                "pilgrimage_service": 0.66
            }
        },
        {
            "id": "BR-84",
            "tradition": "universal",
            "sutra_reference": "Composite oral 84",
            "description": "Ketu's glance on the Moon from the twelfth bhava awakens lucid dreaming and disciplined journaling. Oral commentators highlight lifelong devotion to sleep hygiene and pre-dawn mantra writing.",
            "weights": {
                "dream_recall": 0.83,
                "contemplative_writing": 0.72,
                "spiritual_detachment": 0.68
            }
        },
        {
            "id": "BR-85",
            "tradition": "northern",
            "sutra_reference": "Bikaner folio 47a",
            "description": "Jupiter with Mercury in the first bhava during Shukla Navami produces cultural diplomats adept at protocol. The folio links them to embassy archivists cataloguing bilateral treaties.",
            "weights": {
                "diplomacy": 0.79,
                "documentation": 0.71,
                "travel_fortune": 0.65
            }
        },
        {
            "id": "BR-86",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 77a",
            "description": "Saturn in the twelfth aspecting Mercury in the sixth yields jurists who defend migrant artisans. The palm-leaf underlines pro-bono advocacy and preservation of craft lineages.",
            "weights": {
                "legal_draftsmanship": 0.72,
                "service_orientation": 0.74,
                "karmic_debts": 0.55
            }
        },
        {
            "id": "BR-87",
            "tradition": "western-grantha",
            "sutra_reference": "Pune Modi folio 32d",
            "description": "Mercury-Jupiter conjunction in airy signs with Rahu in the eleventh crafts community radio pioneers. Modi annotations encourage open-licensing of educational broadcasts.",
            "weights": {
                "community_voice": 0.8,
                "open_knowledge": 0.77,
                "technology_evangelism": 0.69
            }
        },
        {
            "id": "BR-88",
            "tradition": "universal",
            "sutra_reference": "Bharuch copper 64f",
            "description": "Ketu twelfth combined with Moon in a fixed sign marks archivists who secure long-term cold storage. Copper inscriptions emphasize humidity rituals and intergenerational stewardship.",
            "weights": {
                "archive_care": 0.82,
                "resilience": 0.71,
                "spiritual_detachment": 0.63
            }
        },
        {
            "id": "BR-89",
            "tradition": "northern",
            "sutra_reference": "Kashi palm 90c",
            "description": "Jupiter's fifth aspect on Mercury placed in the ninth produces curriculum designers who translate ritual sciences for students. The palm mentions remote learning caravans along the Ganga.",
            "weights": {
                "pedagogy": 0.81,
                "translation_gift": 0.74,
                "travel_fortune": 0.6
            }
        },
        {
            "id": "BR-90",
            "tradition": "southern-grantha",
            "sutra_reference": "Kanchipuram cadjan 5d",
            "description": "Ketu in moksha houses with Jupiter exalted in the ninth creates spiritual cartographers mapping pilgrimage trails. Cadjan leaves recommend sharing geospatial guides with fellow seekers.",
            "weights": {
                "pilgrimage_service": 0.83,
                "cartography": 0.68,
                "moksha_drive": 0.76
            }
        },
        {
            "id": "BR-91",
            "tradition": "northern",
            "sutra_reference": "Varanasi folio 12a",
            "description": "Mercury-Jupiter trine across the first and fifth bhavas grants storytellers who compose epics for civic morale. The folio highlights their knack for weaving policy reforms into mythic narrative.",
            "weights": {
                "storytelling": 0.82,
                "civic_tech": 0.64,
                "scholarship_outreach": 0.74
            }
        },
        {
            "id": "BR-92",
            "tradition": "southern-grantha",
            "sutra_reference": "Rameswaram palm 22e",
            "description": "Moon waning with Ketu in the twelfth and Mercury on the ascendant indicates contemplatives who serve as conflict-free mediators. Grantha notes praise their silent presence during negotiations.",
            "weights": {
                "mediation": 0.8,
                "spiritual_detachment": 0.77,
                "calm_presence": 0.71
            }
        },
        {
            "id": "BR-93",
            "tradition": "universal",
            "sutra_reference": "Composite oral 93",
            "description": "Jupiter's full aspect on Mercury with Ketu twelfth signifies community coders who build open prayer timers and donate code to temples. Oral lines advise pairing coding sprints with mantra chanting.",
            "weights": {
                "open_knowledge": 0.8,
                "technology_evangelism": 0.72,
                "devotional_service": 0.69
            }
        },
        {
            "id": "BR-94",
            "tradition": "western-grantha",
            "sutra_reference": "Pune Modi folio 34a",
            "description": "Mercury retrograde under Jupiter's blessing shapes reviewers who audit legacy contracts. The folio applauds patience with redlines and honoring elders during negotiations.",
            "weights": {
                "contract_audit": 0.79,
                "patience": 0.73,
                "conciliatory_skill": 0.66
            }
        },
        {
            "id": "BR-95",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 80f",
            "description": "Ketu twelfth with Moon in Anuradha yields devotees who revive forest hermitage ecology. They oversee sapling drives and document medicinal flora for villagers.",
            "weights": {
                "ecological_service": 0.82,
                "spiritual_detachment": 0.7,
                "community_health": 0.69
            }
        },
        {
            "id": "BR-96",
            "tradition": "northern",
            "sutra_reference": "Kashi scroll 95a",
            "description": "Jupiter-Mercury in the tenth with Saturn aspecting from the seventh marks protocol chiefs who draft emergency governance manuals. The scroll notes their calm in crisis simulations.",
            "weights": {
                "governance": 0.78,
                "documentation": 0.75,
                "resilience": 0.66
            }
        },
        {
            "id": "BR-97",
            "tradition": "universal",
            "sutra_reference": "Bharuch copper 70e",
            "description": "Ketu in the twelfth with Jupiter and Mercury in benefic houses marks contemplative technologists who secure data sanctuaries. Copper plates advise encryption mantras and ethical consent rituals.",
            "weights": {
                "data_stewardship": 0.81,
                "spiritual_detachment": 0.73,
                "privacy_advocacy": 0.72
            }
        },
        {
            "id": "BR-98",
            "tradition": "northern",
            "sutra_reference": "Bikaner folio 50b",
            "description": "Mercury-Jupiter in the seventh with Ketu twelfth denotes negotiators who bridge river-sharing treaties. The folio links their speech to rainfall harmonization and water equity.",
            "weights": {
                "water_diplomacy": 0.83,
                "conciliatory_skill": 0.74,
                "environmental_ethics": 0.69
            }
        },
        {
            "id": "BR-99",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 82c",
            "description": "Ketu twelfth with Mercury in the third grants musicians who code rhythm analyzers for temple orchestras. The palm-leaf values their blend of tala knowledge and scripting.",
            "weights": {
                "musical_math": 0.8,
                "technology_evangelism": 0.68,
                "devotional_service": 0.71
            }
        },
        {
            "id": "BR-100",
            "tradition": "western-grantha",
            "sutra_reference": "Pune Modi folio 34c",
            "description": "Jupiter conjunct Mercury in Virgo with Ketu in the twelfth produces healers who document herbal compendiums in digital form. Modi margins urge them to publish bilingual glossaries.",
            "weights": {
                "herbal_knowledge": 0.82,
                "bilingual_fluency": 0.75,
                "documentation": 0.73
            }
        },
        {
            "id": "BR-101",
            "tradition": "northern",
            "sutra_reference": "Sharada bundle 92d",
            "description": "Mercury exalted with Jupiter in the ninth fosters grant writers funding scholarship digitization. The bundle notes their success when budgets include preservation training.",
            "weights": {
                "fundraising": 0.79,
                "scholarly_pursuits": 0.77,
                "preservation_skill": 0.7
            }
        },
        {
            "id": "BR-102",
            "tradition": "southern-grantha",
            "sutra_reference": "Thiruvananthapuram ola 17b",
            "description": "Ketu in moksha houses with Mercury in the eleventh indicates community technologists running offline-first libraries. Ola leaves praise their mesh networks for rural seekers.",
            "weights": {
                "infrastructure_service": 0.78,
                "spiritual_detachment": 0.65,
                "open_knowledge": 0.76
            }
        },
        {
            "id": "BR-103",
            "tradition": "northern",
            "sutra_reference": "Kashi palm 99d",
            "description": "Jupiter's seventh aspect on Mercury in the first births linguists who steward endangered scripts. The palm mentions custom fonts and workshops for scribes.",
            "weights": {
                "language_mastery": 0.83,
                "preservation_skill": 0.74,
                "mentorship": 0.69
            }
        },
        {
            "id": "BR-104",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 82f",
            "description": "Ketu twelfth with Moon in Uttara Phalguni gives hospitality planners who host silent retreats. The palm encourages accessible pricing and mindful dining halls.",
            "weights": {
                "hospitality": 0.76,
                "retreat_facilitation": 0.78,
                "spiritual_detachment": 0.64
            }
        },
        {
            "id": "BR-105",
            "tradition": "universal",
            "sutra_reference": "Composite oral 105",
            "description": "Mercury conjunct Jupiter while Ketu watches from the twelfth inspires ethics reviewers for AI divination tools. Oral custodians stress fairness, consent, and ritual transparency.",
            "weights": {
                "ethics_guardian": 0.82,
                "research_partners": 0.71,
                "transparency": 0.7
            }
        },
        {
            "id": "BR-106",
            "tradition": "northern",
            "sutra_reference": "Bikaner folio 53c",
            "description": "Mercury in the eighth with Jupiter in the second and Ketu in twelfth marks archivists who rebuild destroyed ledgers after conflict. They champion trauma-aware cataloguing.",
            "weights": {
                "archive_care": 0.83,
                "resilience": 0.76,
                "humanitarian_service": 0.7
            }
        },
        {
            "id": "BR-107",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 83a",
            "description": "Ketu twelfth with Mercury in the ninth produces philosophical podcasters broadcasting dharma dialogues. Grantha margins note clean audio rituals and gratitude to teachers.",
            "weights": {
                "broadcasting": 0.77,
                "philosophy_depth": 0.74,
                "devotional_service": 0.67
            }
        },
        {
            "id": "BR-108",
            "tradition": "western-grantha",
            "sutra_reference": "Pune Modi folio 36b",
            "description": "Mercury-Jupiter in watery signs with Ketu twelfth creates healers who integrate hydrotherapy with mantra. The folio favors them leading community bath restorations.",
            "weights": {
                "healing_arts": 0.8,
                "water_stewardship": 0.73,
                "spiritual_detachment": 0.62
            }
        },
        {
            "id": "BR-109",
            "tradition": "northern",
            "sutra_reference": "Kashi palm 101b",
            "description": "Mercury combust yet graced by Jupiter in upachaya houses yields newsroom editors protecting investigative integrity. The palm extols cross-checking sources and long-form diligence.",
            "weights": {
                "editorial_precision": 0.82,
                "courage": 0.69,
                "transparency": 0.71
            }
        },
        {
            "id": "BR-110",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 84d",
            "description": "Ketu twelfth with Mercury in the tenth and Jupiter in the sixth produces workplace chaplains guiding burnout recovery. The palm prescribes pranayama circles and ethical HR reforms.",
            "weights": {
                "workplace_wellbeing": 0.82,
                "service_orientation": 0.71,
                "spiritual_detachment": 0.63
            }
        },
        {
            "id": "BR-111",
            "tradition": "universal",
            "sutra_reference": "Bharuch copper 72b",
            "description": "Mercury-Jupiter conjunction with Ketu in moksha houses shapes seers who translate dream symbolism into practical checklists. Copper margins stress disciplined follow-through.",
            "weights": {
                "dream_recall": 0.79,
                "translation_gift": 0.74,
                "execution": 0.68
            }
        },
        {
            "id": "BR-112",
            "tradition": "northern",
            "sutra_reference": "Bikaner folio 55e",
            "description": "Jupiter's ninth aspect on Mercury in the third with Ketu twelfth highlights pilgrim guides who maintain river safety drills. Bikaner custodians applaud their blended use of hymns and rope work.",
            "weights": {
                "safety_training": 0.82,
                "pilgrimage_service": 0.74,
                "communication": 0.7
            }
        },
        {
            "id": "BR-113",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 85b",
            "description": "Ketu twelfth with Mercury in the eleventh and Jupiter in the third fosters community grant reviewers ensuring equity for artisans. The palm-leaf celebrates their bias audits.",
            "weights": {
                "fairness": 0.81,
                "community_finance": 0.73,
                "artisan_support": 0.7
            }
        },
        {
            "id": "BR-114",
            "tradition": "northern",
            "sutra_reference": "Kashi palm 103c",
            "description": "Mercury-Jupiter in trines with Ketu twelfth births translators who keep climate records for monasteries. The palm urges redundant backups across regions.",
            "weights": {
                "climate_archives": 0.82,
                "translation_gift": 0.72,
                "redundancy_planning": 0.68
            }
        },
        {
            "id": "BR-115",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 86d",
            "description": "Moon bright with Ketu twelfth and Mercury-Jupiter in the ninth produces festival coordinators who digitize rituals for diaspora devotees. Grantha notes emphasize timezone-sensitive livestreams.",
            "weights": {
                "festival_design": 0.83,
                "digital_curation": 0.75,
                "inclusivity": 0.72
            }
        },
        {
            "id": "BR-116",
            "tradition": "universal",
            "sutra_reference": "Composite oral 116",
            "description": "Ketu's seclusion paired with Mercury-Jupiter counsel creates sages who mentor coding monks. Oral keepers advise pairing Git literacy with vinaya study.",
            "weights": {
                "mentorship": 0.8,
                "open_knowledge": 0.74,
                "spiritual_detachment": 0.66
            }
        },
        {
            "id": "BR-117",
            "tradition": "northern",
            "sutra_reference": "Kashi palm 104a",
            "description": "Mercury in the fourth with Jupiter in the eighth and Ketu twelfth fashions hospice scribes who record final wishes. The palm respects their gentle bedside presence.",
            "weights": {
                "hospice_care": 0.82,
                "documentation": 0.74,
                "compassion": 0.78
            }
        },
        {
            "id": "BR-118",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 87c",
            "description": "Ketu twelfth with Mercury-Jupiter in the second yields archivists of culinary hymns. They standardize kitchen safety protocols while preserving chant rhythms.",
            "weights": {
                "culinary_tradition": 0.79,
                "safety_training": 0.7,
                "devotional_service": 0.72
            }
        },
        {
            "id": "BR-119",
            "tradition": "western-grantha",
            "sutra_reference": "Pune Modi folio 37e",
            "description": "Mercury retrograde with Jupiter direct and Ketu twelfth empowers auditors who reconcile diaspora donations. Modi scribes recommend transparent ledgers and multilingual receipts.",
            "weights": {
                "accountability": 0.82,
                "bilingual_fluency": 0.7,
                "community_finance": 0.74
            }
        },
        {
            "id": "BR-120",
            "tradition": "northern",
            "sutra_reference": "Sharada bundle 99f",
            "description": "Jupiter's grace on Mercury in the eleventh with Ketu twelfth produces youth mentors teaching astronomy clubs. Sharada notes endorse night-sky walks aligned with ekadashi vows.",
            "weights": {
                "mentorship": 0.82,
                "astronomy_love": 0.7,
                "spiritual_detachment": 0.6
            }
        },
        {
            "id": "BR-121",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 88e",
            "description": "Ketu twelfth with Mercury-Jupiter in dual signs shapes adaptable scribes who localize rituals for migrants. The palm urges inclusive glossaries and shared pronunciation guides.",
            "weights": {
                "localization": 0.8,
                "inclusivity": 0.74,
                "translation_gift": 0.72
            }
        },
        {
            "id": "BR-122",
            "tradition": "universal",
            "sutra_reference": "Composite oral 122",
            "description": "When Ketu severs worldly ties and Mercury meets Jupiter, Bhrigu assigns the native to steward community charters. Oral custodians encourage consensus circles and transparent amendments.",
            "weights": {
                "governance": 0.8,
                "transparency": 0.75,
                "community_trust": 0.73
            }
        },
        {
            "id": "BR-123",
            "tradition": [
                "northern",
                "universal"
            ],
            "sutra_reference": "Kashi palm 106a",
            "description": "When Jupiter transits a trine to the natal Moon during a Krishna Paksha birth, the northern folio describes archivists who digitize flood-worn commentaries and publish them as open stacks.",
            "weights": {
                "heritage_archives": 0.81,
                "open_knowledge": 0.77,
                "disaster_recovery": 0.68
            }
        },
        {
            "id": "BR-124",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 89b",
            "description": "Venus in the ninth with Ketu in the third, noted in the Tanjore sequence, yields pilgrimage hosts skilled in translating liturgy for visiting diasporas.",
            "weights": {
                "hospitality": 0.74,
                "translation": 0.72,
                "ancestral_pride": 0.61
            }
        },
        {
            "id": "BR-125",
            "tradition": "western-grantha",
            "sutra_reference": "Pune Modi folio 38c",
            "description": "Retrograde Mercury combust yet dignified in the tenth creates auditors who reconstruct lost trade ledgers and certify ethical finance for co-ops.",
            "weights": {
                "audit_excellence": 0.82,
                "ethical_finance": 0.76,
                "resilience": 0.64
            }
        },
        {
            "id": "BR-126",
            "tradition": "universal",
            "sutra_reference": "Composite oral 124",
            "description": "Oral custodians recount that a waxing Moon in Rohini receiving Saturn's patient aspect produces healers who create stepwise trauma protocols and teach journaling rituals.",
            "weights": {
                "trauma_informed_care": 0.8,
                "curriculum_design": 0.71,
                "patient_advocacy": 0.69
            }
        },
        {
            "id": "BR-127",
            "tradition": "kerala",
            "sutra_reference": "Thiruvananthapuram ola 19c",
            "description": "Kerala ola leaves note that Moon in Hasta with exalted Mercury in the ninth produces village librarians who maintain offline-first reading rooms and solar-powered catalogues.",
            "weights": {
                "library_meshes": 0.83,
                "sustainability": 0.67,
                "education_access": 0.75
            }
        },
        {
            "id": "BR-128",
            "tradition": "northern",
            "sutra_reference": "Sharada bundle 104b",
            "description": "Mars exchanging signs with Saturn while Jupiter guards the fifth inspires resilience coaches who build community drills and publish vernacular safety primers.",
            "weights": {
                "community_training": 0.79,
                "resilience": 0.82,
                "publishing": 0.63
            }
        },
        {
            "id": "BR-129",
            "tradition": [
                "southern-grantha",
                "universal"
            ],
            "sutra_reference": "Grantha palm 90d",
            "description": "If Moon sits with Mercury in the fourth under Venusian aspect, the Grantha recension praises curriculum designers who embed music into language rehabilitation courses.",
            "weights": {
                "language_mastery": 0.74,
                "music_therapy": 0.81,
                "curriculum_design": 0.7
            }
        },
        {
            "id": "BR-130",
            "tradition": "western-grantha",
            "sutra_reference": "Bharuch copper 75a",
            "description": "Copperplates describe Rahu in the eighth with benefic Moon yielding privacy engineers who encrypt oral histories and steward consent protocols.",
            "weights": {
                "privacy_engineering": 0.85,
                "community_trust": 0.74,
                "ancestral_calling": 0.58
            }
        },
        {
            "id": "BR-131",
            "tradition": "northern",
            "sutra_reference": "Kashi palm 107d",
            "description": "When Sun and Mercury occupy the second with Jupiter aspecting, Bhrigu records speech mentors who certify anchors for public-interest radio.",
            "weights": {
                "public_speaking": 0.8,
                "ethics_training": 0.69,
                "broadcasting": 0.73
            }
        },
        {
            "id": "BR-132",
            "tradition": [
                "northern",
                "southern-grantha"
            ],
            "sutra_reference": "Composite oral 125",
            "description": "Joint recensions agree that Ketu in the sixth with Moon in Anuradha produces mediators who defuse guild disputes and draft transparent revenue splits.",
            "weights": {
                "mediation": 0.83,
                "transparency": 0.76,
                "guild_support": 0.7
            }
        },
        {
            "id": "BR-133",
            "tradition": "kerala",
            "sutra_reference": "Cheruthoni palm 11a",
            "description": "Floodplain cadjans state that Saturn in the eleventh with Moon in Shravana generates hydro engineers preserving riverbanks and creating youth apprenticeships.",
            "weights": {
                "water_stewardship": 0.82,
                "mentorship": 0.72,
                "resilience": 0.77
            }
        },
        {
            "id": "BR-134",
            "tradition": "southern-grantha",
            "sutra_reference": "Kanchipuram cadjan 6c",
            "description": "With Mercury exalted in the fifth and Moon in Uttara Phalguni, scribes note dramaturgs who adapt ritual theatre for inclusive classrooms.",
            "weights": {
                "arts_education": 0.78,
                "accessibility": 0.69,
                "storytelling": 0.73
            }
        },
        {
            "id": "BR-135",
            "tradition": "universal",
            "sutra_reference": "Composite oral 126",
            "description": "Elders recount that Jupiter's dasha commencing with Moon in a kendra yields elders who certify ethical AI translators and convene bias-audit circles.",
            "weights": {
                "ethics_training": 0.84,
                "language_mastery": 0.7,
                "governance": 0.72
            }
        },
        {
            "id": "BR-136",
            "tradition": "western-grantha",
            "sutra_reference": "Pune Modi folio 39d",
            "description": "Mercury retrograde yet vargottama with Venus in the seventh produces contract renovators who modernize guild bylaws without losing ancestral cadence.",
            "weights": {
                "contract_design": 0.82,
                "ancestral_pride": 0.64,
                "collaboration": 0.74
            }
        },
        {
            "id": "BR-137",
            "tradition": "northern",
            "sutra_reference": "Bikaner folio 56c",
            "description": "Moon in Mrigashira with benefic Mars and Saturn's third glance marks field researchers cataloging endangered seeds and co-authoring farmer-friendly manuals.",
            "weights": {
                "field_research": 0.81,
                "sustainability": 0.78,
                "publishing": 0.66
            }
        },
        {
            "id": "BR-138",
            "tradition": [
                "northern",
                "western-grantha"
            ],
            "sutra_reference": "Sharada bundle 105b",
            "description": "Sun with Rahu in the eleventh while Jupiter guards Lagna produces social-graph mappers who design equitable grant routing for rural labs.",
            "weights": {
                "network_effects": 0.8,
                "equitable_distribution": 0.74,
                "data_stewardship": 0.71
            }
        },
        {
            "id": "BR-139",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 91f",
            "description": "Venus and Moon in mutual reception with Saturn in the tenth inspires wellness coordinators who build restorative sabbatical plans for caregivers.",
            "weights": {
                "retreat_facilitation": 0.77,
                "caregiver_support": 0.82,
                "planning": 0.65
            }
        },
        {
            "id": "BR-140",
            "tradition": "kerala",
            "sutra_reference": "Thiruvananthapuram ola 20d",
            "description": "Ola leaves note Rahu in the third with Moon in Dhanishta produces percussion coders timing ritual bells with precision metronomes for inclusive ceremonies.",
            "weights": {
                "rhythm_craft": 0.83,
                "accessibility": 0.72,
                "community_trust": 0.68
            }
        },
        {
            "id": "BR-141",
            "tradition": "western-grantha",
            "sutra_reference": "Bharuch copper 77d",
            "description": "Saturn exalted with Moon in the sixth yields archivists who implement humidity-controlled vaults and publish preventive maintenance SOPs.",
            "weights": {
                "archival_strategy": 0.84,
                "operational_rigor": 0.79,
                "resilience": 0.71
            }
        },
        {
            "id": "BR-142",
            "tradition": "northern",
            "sutra_reference": "Kashi palm 108c",
            "description": "Mercury with Ketu in the ninth while Venus aspects Lagna marks interpreters who decode damaged marginalia and teach paleography bootcamps.",
            "weights": {
                "manuscript_decoding": 0.83,
                "mentorship": 0.74,
                "scholarly_pursuits": 0.78
            }
        },
        {
            "id": "BR-143",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 92b",
            "description": "If Jupiter sits in the third with Moon in Swati, scribes describe translators who localize civic data dashboards and train elders to verify updates.",
            "weights": {
                "civic_tech": 0.79,
                "translation": 0.75,
                "training": 0.71
            }
        },
        {
            "id": "BR-144",
            "tradition": [
                "universal",
                "northern"
            ],
            "sutra_reference": "Composite oral 127",
            "description": "Shared oral sources say Venus combust yet vargottama with Moon waxing crafts inclusion strategists who set harm-reduction norms and publish transparent incident logs.",
            "weights": {
                "safety_protocols": 0.83,
                "transparency": 0.78,
                "collaboration": 0.7
            }
        },
        {
            "id": "BR-145",
            "tradition": "kerala",
            "sutra_reference": "Calicut cadjan 14d",
            "description": "Moon in Ashlesha with Mercury in the second indicates herbal technologists who digitize medicinal indexes and create multilingual dosage alerts.",
            "weights": {
                "herbalism": 0.82,
                "language_mastery": 0.69,
                "data_quality": 0.76
            }
        },
        {
            "id": "BR-146",
            "tradition": "western-grantha",
            "sutra_reference": "Pune Modi folio 40a",
            "description": "Sun and Jupiter in mutual reception with Moon in Pushya produces city planners who integrate shrine conservation with transit modernization.",
            "weights": {
                "urban_planning": 0.81,
                "heritage_archives": 0.7,
                "collaboration": 0.68
            }
        },
        {
            "id": "BR-147",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 93e",
            "description": "Saturn with Ketu in the fourth and Moon in Uttarashada inspires resilience doulas who guide grief circles and codify compassionate leave policies.",
            "weights": {
                "grief_processing": 0.84,
                "policy_design": 0.73,
                "community_trust": 0.72
            }
        },
        {
            "id": "BR-148",
            "tradition": "northern",
            "sutra_reference": "Sharada bundle 106d",
            "description": "Mars in the eleventh with exalted Moon yields logistics mentors who coordinate relief supply chains and train youth in inventory ethics.",
            "weights": {
                "logistics": 0.82,
                "mentorship": 0.77,
                "ethics_training": 0.71
            }
        },
        {
            "id": "BR-149",
            "tradition": "universal",
            "sutra_reference": "Composite oral 128",
            "description": "A waning Moon in Shatabhisha under Rahu's influence creates digital healers who steward community mental-health forums with strict confidentiality codes.",
            "weights": {
                "mental_health": 0.83,
                "privacy_engineering": 0.78,
                "moderation": 0.72
            }
        },
        {
            "id": "BR-150",
            "tradition": [
                "southern-grantha",
                "western-grantha"
            ],
            "sutra_reference": "Grantha palm 94a",
            "description": "Jupiter in the twelfth with Moon exalted crafts retreat architects who design silent innovation labs balancing austerity with ergonomic care.",
            "weights": {
                "retreat_facilitation": 0.86,
                "design_thinking": 0.73,
                "sustainability": 0.67
            }
        },
        {
            "id": "BR-151",
            "tradition": "kerala",
            "sutra_reference": "Thiruvananthapuram ola 21b",
            "description": "With Mercury in the sixth and Moon in Revati, Kerala custodians cite healers who map monsoon-related ailments and publish preventive calendars.",
            "weights": {
                "public_health": 0.82,
                "calendar_design": 0.76,
                "data_quality": 0.7
            }
        },
        {
            "id": "BR-152",
            "tradition": "northern",
            "sutra_reference": "Kashi palm 109b",
            "description": "Rahu in Lagna with Moon in Hasta produces design researchers who prototype assistive devices and run iterative community testing rounds.",
            "weights": {
                "accessibility": 0.83,
                "user_research": 0.8,
                "collaboration": 0.72
            }
        },
        {
            "id": "BR-153",
            "tradition": "western-grantha",
            "sutra_reference": "Bharuch copper 78f",
            "description": "Moon with Jupiter in the ninth while Saturn aspects the third yields jurisprudence coders maintaining civic law digests and training paralegal fellows.",
            "weights": {
                "legal_scholarship": 0.81,
                "mentorship": 0.76,
                "documentation": 0.74
            }
        },
        {
            "id": "BR-154",
            "tradition": [
                "universal",
                "southern-grantha"
            ],
            "sutra_reference": "Composite oral 129",
            "description": "Moon in Chitra with Mercury retrograde inspires visual archivists who annotate iconography with QR-linked commentaries for students.",
            "weights": {
                "visual_archiving": 0.84,
                "education_access": 0.74,
                "tech_translation": 0.68
            }
        },
        {
            "id": "BR-155",
            "tradition": "northern",
            "sutra_reference": "Varanasi folio 14c",
            "description": "Sun and Mercury in the third with Jupiter in the seventh produces journalism mentors who enforce verification checklists and teach whistleblower safety.",
            "weights": {
                "investigation": 0.83,
                "ethics_training": 0.79,
                "community_trust": 0.72
            }
        },
        {
            "id": "BR-156",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 95c",
            "description": "If Moon conjoins Venus in the eleventh, Tanjore leaves say the native curates artisan cooperatives, facilitating fair-pricing councils and conflict audits.",
            "weights": {
                "guild_support": 0.83,
                "equitable_distribution": 0.77,
                "mediation": 0.72
            }
        },
        {
            "id": "BR-157",
            "tradition": "kerala",
            "sutra_reference": "Kollam cadjan 9f",
            "description": "Saturn in the fourth with Moon in Ardra yields climate storytellers who craft flood drills through puppet theatre and bilingual zines.",
            "weights": {
                "climate_communication": 0.82,
                "education_access": 0.73,
                "resilience": 0.74
            }
        },
        {
            "id": "BR-158",
            "tradition": "western-grantha",
            "sutra_reference": "Pune Modi folio 41b",
            "description": "Mars in the ninth with Moon in Purva Bhadrapada produces sport-ethics coaches who mentor referees and publish fair-play statutes.",
            "weights": {
                "mentorship": 0.8,
                "governance": 0.74,
                "physical_training": 0.69
            }
        },
        {
            "id": "BR-159",
            "tradition": "universal",
            "sutra_reference": "Composite oral 130",
            "description": "Rahu with Mercury in the fifth while Moon occupies Hasta yields hacklab conveners who enforce documentation-first norms and host multilingual code readings.",
            "weights": {
                "documentation": 0.84,
                "collaboration": 0.76,
                "education_access": 0.71
            }
        },
        {
            "id": "BR-160",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 96e",
            "description": "Moon in Krittika with Jupiter aspecting Lagna marks culinary safety trainers who codify kitchen fire drills and publish allergen labels.",
            "weights": {
                "safety_protocols": 0.82,
                "education_access": 0.7,
                "documentation": 0.73
            }
        },
        {
            "id": "BR-161",
            "tradition": [
                "northern",
                "kerala"
            ],
            "sutra_reference": "Sharada bundle 107f",
            "description": "Mercury exalted with Moon in Punarvasu produces literacy cartographers mapping village reading gaps and guiding donors toward underserved wards.",
            "weights": {
                "education_access": 0.85,
                "equitable_distribution": 0.78,
                "data_quality": 0.69
            }
        },
        {
            "id": "BR-162",
            "tradition": "western-grantha",
            "sutra_reference": "Bharuch copper 79c",
            "description": "Saturn retrograde in the second with Moon in Vishakha fosters dialect archivists who standardize transliteration tables and run pronunciation clinics.",
            "weights": {
                "language_mastery": 0.83,
                "standardization": 0.77,
                "training": 0.71
            }
        },
        {
            "id": "BR-163",
            "tradition": "northern",
            "sutra_reference": "Kashi palm 110d",
            "description": "Moon in Bharani with Jupiter in the eleventh produces ethical fundraisers drafting transparent grant reports and ritual gratitude notes.",
            "weights": {
                "governance": 0.78,
                "transparency": 0.82,
                "community_trust": 0.74
            }
        },
        {
            "id": "BR-164",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 97b",
            "description": "Venus in the sixth with Moon in Hasta encourages restorative justice advocates who mediate workplace disputes and maintain consent-led meeting norms.",
            "weights": {
                "mediation": 0.82,
                "ethics_training": 0.77,
                "community_trust": 0.71
            }
        },
        {
            "id": "BR-165",
            "tradition": "universal",
            "sutra_reference": "Composite oral 131",
            "description": "A waxing Moon in Moola with Jupiter in a dusthana produces disaster responders coordinating multilingual helplines and publishing needs-led dashboards.",
            "weights": {
                "disaster_recovery": 0.86,
                "communication": 0.76,
                "data_stewardship": 0.72
            }
        },
        {
            "id": "BR-166",
            "tradition": "kerala",
            "sutra_reference": "Calicut cadjan 15b",
            "description": "Moon in Purva Ashadha with Saturn exalted indicates ocean stewards who map coastal erosion, mentor fisher cooperatives, and publish tidal safety guides.",
            "weights": {
                "water_stewardship": 0.86,
                "mentorship": 0.73,
                "documentation": 0.7
            }
        },
        {
            "id": "BR-167",
            "tradition": "western-grantha",
            "sutra_reference": "Pune Modi folio 42d",
            "description": "Sun with Moon in the eighth while Jupiter aspects yields ethics commissioners who audit sacred art trades and certify provenance chains.",
            "weights": {
                "ethics_training": 0.82,
                "audit_excellence": 0.78,
                "heritage_archives": 0.69
            }
        },
        {
            "id": "BR-168",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 98e",
            "description": "Ketu in the ninth with Moon in Magha produces ritual technologists who program temple lighting schedules and document firmware as liturgy.",
            "weights": {
                "automation": 0.81,
                "documentation": 0.76,
                "ancestral_pride": 0.64
            }
        },
        {
            "id": "BR-169",
            "tradition": "northern",
            "sutra_reference": "Bikaner folio 57d",
            "description": "When Moon joins Mercury in the eleventh and Jupiter casts a fifth aspect, the folio praises network weavers organizing peer review guilds for manuscripts.",
            "weights": {
                "network_effects": 0.84,
                "peer_review": 0.78,
                "scholarly_pursuits": 0.75
            }
        },
        {
            "id": "BR-170",
            "tradition": [
                "kerala",
                "universal"
            ],
            "sutra_reference": "Thiruvananthapuram ola 22d",
            "description": "Moon in Uttara Ashadha with Mercury in the fourth generates community cartographers who track relief shelters and publish map-led evacuation drills.",
            "weights": {
                "mapping": 0.86,
                "disaster_recovery": 0.82,
                "education_access": 0.7
            }
        },
        {
            "id": "BR-171",
            "tradition": "western-grantha",
            "sutra_reference": "Bharuch copper 80d",
            "description": "Saturn with Venus in the third and Moon in Anuradha yields multilingual drafting mentors who certify translators and preserve dialect humor.",
            "weights": {
                "language_mastery": 0.85,
                "mentorship": 0.78,
                "cultural_preservation": 0.71
            }
        },
        {
            "id": "BR-172",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 99a",
            "description": "Jupiter in Lagna with Moon in Rohini inspires agriculture technologists who standardize seed libraries and publish planting calendars across agro-climates.",
            "weights": {
                "seed_stewardship": 0.86,
                "standardization": 0.75,
                "publication_success": 0.72
            }
        }
    ],
    "remedies": [
        {
            "id": "REM-3",
            "tradition": "universal",
            "sutra_reference": "Grantha leaf 9a",
            "description": "Offer clarified butter lamps to Maharishi Bhrigu on Thursdays while reciting the Sanskrit seed-syllable \"Bhrim\" to neutralize karmic debt tied to paternal lineages."
        },
        {
            "id": "REM-9",
            "tradition": "northern",
            "sutra_reference": "Bikaner folio 21c",
            "description": "Meditate at dawn facing east with a copper yantra inscribed with the syllables \"Om Brighave Namah\" to restore continuity of memory between incarnations."
        },
        {
            "id": "REM-14",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 22d",
            "description": "Offer sandal paste to a Ketu yantra on Tuesdays while reciting the mantra \"Om Ketave Namah\" to cool restless dreams and guide moksha quests."
        },
        {
            "id": "REM-20",
            "tradition": "universal",
            "sutra_reference": "Kashi palm 63b",
            "description": "Donate copper vessels to riverfront temples during Shukla Paksha to harmonize retrograde Saturn lessons with compassionate service."
        },
        {
            "id": "REM-28",
            "tradition": "northern",
            "sutra_reference": "Northern Bhrigu bundle 5a",
            "description": "For researchers handling fragile manuscripts, Bhrigu prescribes sandal paste offerings to Saraswati on Wednesdays before cataloguing.",
            "personalize_for": [
                "research_partners",
                "standards_authorship"
            ]
        },
        {
            "id": "REM-31",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha scroll 68f",
            "description": "When heritage projects arise, plant a neem sapling near ancestral land and chant the Aditya Hridayam to stabilize leadership karma.",
            "personalize_for": [
                "heritage_archives",
                "leadership"
            ]
        }
    ],
    "past_life_engines": [
        {
            "id": "PL-27",
            "tradition": "universal",
            "sutra_reference": "Bharuch copper folio 27d",
            "description": "Bhrigu's copper folios recount that watery Moons remembering Rahu's ascension keep detailed ledgers of their prior incarnations as healers.",
            "conditions": {
                "moon_element": {
                    "any_of": [
                        "water"
                    ]
                },
                "lunar_tithi": {
                    "max": 8
                },
                "rahu_aspects_ascendant": {
                    "equals": true
                }
            },
            "narrative": "The native safeguarded Ayurvedic clinics along the Narmada river and now returns to continue that medical seva with photographic memory.",
            "confidence": 0.88
        },
        {
            "id": "PL-42",
            "tradition": "northern",
            "sutra_reference": "Sharada bundle 42c",
            "description": "When Mars occupies a kendra and Saturn guards the second house, the Sharada bundle highlights archivists from previous births.",
            "conditions": {
                "mars_house": {
                    "min": 7,
                    "max": 11
                },
                "saturn_house": {
                    "equals": 2
                }
            },
            "narrative": "Scrolls describe an imperial librarian who catalogued royal correspondences and now awakens with flawless recall of cryptographic ciphers.",
            "confidence": 0.76
        },
        {
            "id": "PL-51",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha leaf 51b",
            "description": "Venus in the second bhava with watery lunar influence signals past lives steeped in artistic patronage per the Grantha commentaries.",
            "conditions": {
                "venus_house": {
                    "equals": 2
                },
                "moon_element": {
                    "any_of": [
                        "water",
                        "earth"
                    ]
                }
            },
            "narrative": "The Samhita describes a court musician entrusted with temple treasury who now incarnates to restore sacred soundscapes.",
            "confidence": 0.71
        },
        {
            "id": "PL-60",
            "tradition": "northern",
            "sutra_reference": "Kashi palm 60a",
            "description": "Retrograde Saturn gazing at Mars in a kendra highlights artisans who rebuilt shrines after invasions, carrying patience and precision into this birth.",
            "conditions": {
                "saturn_retrograde": {
                    "equals": true
                },
                "mars_house": {
                    "min": 4,
                    "max": 10
                }
            },
            "narrative": "The folio praises stoneworkers whose chisels carried mantras; they reincarnate to restore heritage architecture and digital archives alike.",
            "confidence": 0.79
        },
        {
            "id": "PL-71",
            "tradition": "universal",
            "sutra_reference": "Composite oral 71",
            "description": "Fire-ruled Moons with Mercury in the third and Jupiter in the ninth recall pilgrim-poets who ferried mantras between monasteries.",
            "conditions": {
                "moon_element": {
                    "any_of": [
                        "fire"
                    ]
                },
                "mercury_house": {
                    "equals": 3
                },
                "jupiter_house": {
                    "equals": 9
                }
            },
            "narrative": "The Samhita paints a roaming bard who carried copper tablets of hymns across river crossings; they return with a melodic memory for sacred code-switching.",
            "confidence": 0.77
        },
        {
            "id": "PL-72",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 72d",
            "description": "When Venus rises in the ascendant with Ketu guarding the ninth, the palm leaves note temple dancers turned wisdom keepers.",
            "conditions": {
                "venus_house": {
                    "any_of": [
                        1
                    ]
                },
                "ketu_house": {
                    "equals": 9
                },
                "moon_element": {
                    "any_of": [
                        "earth",
                        "water"
                    ]
                }
            },
            "narrative": "Past-life memories surface as choreographed rituals and archival instincts to protect dance notation, now digitized for modern students.",
            "confidence": 0.74
        },
        {
            "id": "PL-73",
            "tradition": "western-grantha",
            "sutra_reference": "Pune Modi folio 73a",
            "description": "Ether-leaning Moons with Jupiter in the twelfth reflect mystics who mapped night skies for maritime caravans.",
            "conditions": {
                "moon_element": {
                    "any_of": [
                        "ether"
                    ]
                },
                "jupiter_house": {
                    "equals": 12
                },
                "saturn_retrograde": {
                    "equals": true
                }
            },
            "narrative": "The manuscripts describe a star-cartographer guiding spice fleets; the native revives those instincts through celestial navigation apps.",
            "confidence": 0.72
        },
        {
            "id": "PL-74",
            "tradition": "northern",
            "sutra_reference": "Kashi palm 74b",
            "description": "Mercury fortified in the fifth with earthy Moons marks artisan-architects who balanced acoustics and sculpture.",
            "conditions": {
                "mercury_house": {
                    "equals": 5
                },
                "moon_element": {
                    "any_of": [
                        "earth"
                    ]
                },
                "saturn_house": {
                    "max": 4
                }
            },
            "narrative": "Bhrigu chronicles a sculptor who tuned temple halls for mantra resonance; the soul now returns to design immersive arts venues and spatial audio labs.",
            "confidence": 0.75
        },
        {
            "id": "PL-75",
            "tradition": "universal",
            "sutra_reference": "Bharuch copper 75c",
            "description": "Watery Moons on early tithis with Rahu's ascendant aspect hint at seafaring scribes handling port ledgers.",
            "conditions": {
                "moon_element": {
                    "any_of": [
                        "water"
                    ]
                },
                "lunar_tithi": {
                    "max": 3
                },
                "rahu_aspects_ascendant": {
                    "equals": true
                }
            },
            "narrative": "Prior births involved recording maritime treaties; the native now gravitates to coastal research labs and blockchain customs registries.",
            "confidence": 0.69
        },
        {
            "id": "PL-76",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha scroll 76e",
            "description": "Ketu in the eighth with Venus in the eleventh records occult healers who doubled as guild treasurers.",
            "conditions": {
                "ketu_house": {
                    "equals": 8
                },
                "venus_house": {
                    "equals": 11
                },
                "moon_element": {
                    "any_of": [
                        "air",
                        "ether"
                    ]
                }
            },
            "narrative": "The folio praises tantric accountants balancing mantra rites with cooperative finance; those instincts now fuel ethical fintech design.",
            "confidence": 0.78
        },
        {
            "id": "PL-77",
            "tradition": "western-grantha",
            "sutra_reference": "Grantha palm 77c",
            "description": "Air-ruled Moons with Mars in the third and Saturn in the eleventh point to dispatch riders preserving encrypted edicts.",
            "conditions": {
                "moon_element": {
                    "any_of": [
                        "air"
                    ]
                },
                "mars_house": {
                    "equals": 3
                },
                "saturn_house": {
                    "equals": 11
                }
            },
            "narrative": "Past duties involved courier networks for dynastic councils; in this age the native excels at secure communications and zero-knowledge archives.",
            "confidence": 0.73
        },
        {
            "id": "PL-78",
            "tradition": "northern",
            "sutra_reference": "Sharada bundle 78a",
            "description": "Earthy Moons with Jupiter in the seventh and Mercury in the second reveal contract negotiators and guild mediators.",
            "conditions": {
                "moon_element": {
                    "any_of": [
                        "earth"
                    ]
                },
                "jupiter_house": {
                    "equals": 7
                },
                "mercury_house": {
                    "equals": 2
                }
            },
            "narrative": "The Samhita depicts a treaty-drafter fluent in multiple scripts; they return to harmonize cross-border collaborations and digital DAO charters.",
            "confidence": 0.7
        },
        {
            "id": "PL-79",
            "tradition": "universal",
            "sutra_reference": "Composite oral 79",
            "description": "Saturn retrograde in the tenth with Venus in a kendra highlights artisan engineers sustaining community wells.",
            "conditions": {
                "saturn_retrograde": {
                    "equals": true
                },
                "saturn_house": {
                    "equals": 10
                },
                "venus_house": {
                    "any_of": [
                        1,
                        4,
                        7,
                        10
                    ]
                }
            },
            "narrative": "Prior incarnations rebuilt aqueducts after droughts; the native now stewards climate tech and community-owned water grids.",
            "confidence": 0.8
        },
        {
            "id": "PL-80",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha leaf 80b",
            "description": "Moons in ether with Mercury in the eleventh and Rahu on the ascendant show astrologer-innovators bridging guilds.",
            "conditions": {
                "moon_element": {
                    "any_of": [
                        "ether"
                    ]
                },
                "mercury_house": {
                    "equals": 11
                },
                "rahu_aspects_ascendant": {
                    "equals": true
                }
            },
            "narrative": "The folio honors a sky-watcher who standardized star charts for merchant alliances; today they revive that service via open-data observatories.",
            "confidence": 0.71
        },
        {
            "id": "PL-81",
            "tradition": "western-grantha",
            "sutra_reference": "Grantha scroll 81e",
            "description": "Venus in the fifth with Ketu in the twelfth highlights lyricists who encoded bhakti poetry to outlast invasions.",
            "conditions": {
                "venus_house": {
                    "equals": 5
                },
                "ketu_house": {
                    "equals": 12
                },
                "lunar_tithi": {
                    "min": 11,
                    "max": 15
                }
            },
            "narrative": "They return with an artistic mandate to digitize endangered songs, pairing studio craft with archival rigor for diaspora listeners.",
            "confidence": 0.82
        },
        {
            "id": "PL-84",
            "tradition": [
                "northern",
                "southern-grantha"
            ],
            "sutra_reference": "Shared Bhrigu folio 84b",
            "description": "Air-ruled Moons with Mercury guarding the third while Saturn steadies the second recall scribes who traveled to reconcile warring courts.",
            "conditions": {
                "moon_element": {
                    "any_of": [
                        "air"
                    ]
                },
                "mercury_house": {
                    "equals": 3
                },
                "saturn_house": {
                    "equals": 2
                }
            },
            "narrative": "The folio notes itinerant diplomat-scribes who ferried treaties across kingdoms; the native resumes that bridge-building through restorative justice clinics.",
            "confidence": 0.74
        },
        {
            "id": "PL-92",
            "tradition": "western-grantha",
            "sutra_reference": "Western grantha fragment 92a",
            "description": "Ketu in the eighth with a retrograde Saturn glancing at a fire Moon shows investigators who probed hidden archives after upheavals.",
            "conditions": {
                "ketu_house": {
                    "equals": 8
                },
                "saturn_retrograde": {
                    "equals": true
                },
                "moon_element": {
                    "any_of": [
                        "fire"
                    ]
                }
            },
            "narrative": "They reincarnate with forensic instincts to audit power structures and safeguard whistleblowers, wielding mantras that cool hidden fears.",
            "confidence": 0.8
        },
        {
            "id": "PL-97",
            "tradition": "universal",
            "sutra_reference": "Composite oral 97",
            "description": "Etheric Moons with Jupiter in the fourth and Venus in the tenth indicate teachers who cultivated sanctuary schools for displaced pilgrims.",
            "conditions": {
                "moon_element": {
                    "any_of": [
                        "ether"
                    ]
                },
                "jupiter_house": {
                    "equals": 4
                },
                "venus_house": {
                    "equals": 10
                }
            },
            "narrative": "The transmission honors caretakers who offered boarding, song, and scripture to the uprooted; the native now builds healing campuses blending pedagogy and social work.",
            "confidence": 0.77
        }
    ],
    "future_engines": [
        {
            "id": "FU-11",
            "tradition": "northern",
            "sutra_reference": "Kashi palm 58a",
            "description": "The fifth tithi with Mars elevated in the tenth bhava signals future infrastructure breakthroughs adapted to the digital age.",
            "conditions": {
                "lunar_tithi": {
                    "equals": 5
                },
                "mars_house": {
                    "equals": 10
                }
            },
            "trajectory": "Expect multi-decade leadership on smart-city logistics platforms that merge ancient fort-planning with cloud telemetry.",
            "window": "Years 28-52",
            "certainty": 0.84
        },
        {
            "id": "FU-29",
            "tradition": "western-grantha",
            "sutra_reference": "Pune Modi folio 19d",
            "description": "Saturn-Venus stewardship of the second bhava points to financial systems that rebloom after Saturn returns.",
            "conditions": {
                "saturn_house": {
                    "equals": 2
                },
                "venus_house": {
                    "equals": 2
                }
            },
            "trajectory": "Capital accumulation through custodial fintech ventures emerges once the native invests in gemstone-backed ledgers referenced by Bhrigu.",
            "window": "Years 32-60",
            "certainty": 0.8
        },
        {
            "id": "FU-40",
            "tradition": "universal",
            "sutra_reference": "Bikaner folio 33f",
            "description": "Moons rooted in water yet stationed in tech-forward locales drive humanitarian innovation according to the folio.",
            "conditions": {
                "moon_element": {
                    "any_of": [
                        "water"
                    ]
                }
            },
            "trajectory": "Expect grants for climate-resilient desalination labs and pilgrim healthcare drones funded by philanthropic guilds.",
            "window": "Years 18-40",
            "certainty": 0.73
        },
        {
            "id": "FU-55",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 55c",
            "description": "Ketu in the twelfth with waxing Moon drives contemplative retreats. Future instructions focus on pilgrim circuits, dream journaling, and moksha-aligned service projects.",
            "conditions": {
                "moon_element": {
                    "any_of": [
                        "water",
                        "ether"
                    ]
                },
                "lunar_tithi": {
                    "min": 8,
                    "max": 14
                },
                "ketu_house": {
                    "equals": 12
                }
            },
            "trajectory": "Expect invitations to lead silence retreats, curate dream circles, and mentor seekers on detachment disciplines.",
            "window": "Years 24-48",
            "certainty": 0.74
        },
        {
            "id": "FU-63",
            "tradition": "northern",
            "sutra_reference": "Kashi palm 63f",
            "description": "Retrograde Saturn in a kendra alongside Ketu in dharma houses signals rebuilding mandates activated during Saturn return windows.",
            "conditions": {
                "saturn_retrograde": {
                    "equals": true
                },
                "saturn_house": {
                    "any_of": [
                        4,
                        10
                    ]
                },
                "ketu_house": {
                    "any_of": [
                        9,
                        12
                    ]
                }
            },
            "trajectory": "Expect restoration roles for heritage districts and compliance labs once Saturn circles back, with funding tied to karmic restitution projects.",
            "window": "Saturn return epochs",
            "certainty": 0.78
        },
        {
            "id": "FU-72",
            "tradition": [
                "universal",
                "western-grantha"
            ],
            "sutra_reference": "Composite techno folio 72b",
            "description": "Ether Moons with Mercury in the third and Jupiter in the eleventh activate distributed research guilds across oceans.",
            "conditions": {
                "moon_element": {
                    "any_of": [
                        "ether"
                    ]
                },
                "mercury_house": {
                    "equals": 3
                },
                "jupiter_house": {
                    "equals": 11
                }
            },
            "trajectory": "Multi-continent innovation residencies appear, inviting the native to steward open-source translations and citizen science cohorts.",
            "window": "Years 22-44",
            "certainty": 0.76
        },
        {
            "id": "FU-88",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha palm 88c",
            "description": "When Venus commands the tenth and Mars cohabits the fourth with an earth Moon, the Grantha palm urges agrarian tech pilots.",
            "conditions": {
                "venus_house": {
                    "equals": 10
                },
                "mars_house": {
                    "equals": 4
                },
                "moon_element": {
                    "any_of": [
                        "earth"
                    ]
                }
            },
            "trajectory": "Expect chances to convert ancestral lands into regenerative farm labs and apprenticeship centers partnering with village councils.",
            "window": "Years 30-55",
            "certainty": 0.79
        }
    ],
    "matchmaking_criteria": [
        {
            "id": "MM-3",
            "tradition": "universal",
            "sutra_reference": "Sharada palm 77c",
            "description": "Harmonious lunar elements and synchronized tithis create empathic partnerships that Bhrigu recommends for both spiritual and modern entrepreneurial households.",
            "time_horizon": "long-term",
            "base_weight": 0.6,
            "pair_rules": [
                {
                    "label": "Lunar element harmony",
                    "primary_field": "moon_element",
                    "partner_field": "moon_element",
                    "comparator": "harmonious",
                    "sets": [
                        [
                            "water",
                            "earth"
                        ],
                        [
                            "fire",
                            "air"
                        ]
                    ],
                    "weight": 0.6
                },
                {
                    "label": "Shared tithi rhythm",
                    "primary_field": "lunar_tithi",
                    "partner_field": "lunar_tithi",
                    "comparator": "distance",
                    "max_difference": 2,
                    "weight": 0.4
                }
            ],
            "modern_modifiers": {
                "remote-first": 0.05,
                "research-partnership": 0.04,
                "co-living": 0.03
            }
        },
        {
            "id": "MM-8",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha scroll 18d",
            "description": "Venus stewardship and Mars missions must complement to support Bhrigu's \"digital grihastha\" households that balance art, finance, and product roadmaps.",
            "time_horizon": "short-term",
            "base_weight": 0.4,
            "pair_rules": [
                {
                    "label": "Venus treasury sync",
                    "primary_field": "venus_house",
                    "partner_field": "venus_house",
                    "comparator": "distance",
                    "max_difference": 1,
                    "circular": true,
                    "weight": 0.5
                },
                {
                    "label": "Mars mission complement",
                    "primary_field": "mars_house",
                    "partner_field": "mars_house",
                    "comparator": "distance",
                    "max_difference": 3,
                    "weight": 0.5
                }
            ],
            "modern_modifiers": {
                "startup-ops": 0.07,
                "arts-collab": 0.05,
                "creative-startup": 0.05
            }
        },
        {
            "id": "MM-15",
            "tradition": "northern",
            "sutra_reference": "Kashi scroll 15b",
            "description": "Jupiter-Mercury pairings in the fifth bhava strengthen joint study and translation work across families.",
            "time_horizon": "long-term",
            "base_weight": 0.55,
            "pair_rules": [
                {
                    "label": "Scholarship tandem",
                    "primary_field": "mercury_house",
                    "partner_field": "mercury_house",
                    "comparator": "distance",
                    "max_difference": 2,
                    "circular": true,
                    "weight": 0.35
                },
                {
                    "label": "Jupiter wisdom sync",
                    "primary_field": "jupiter_house",
                    "partner_field": "jupiter_house",
                    "comparator": "distance",
                    "max_difference": 2,
                    "circular": true,
                    "weight": 0.65
                }
            ],
            "modern_modifiers": {
                "research-partnership": 0.06,
                "multi-lingual": 0.05,
                "family-planning": 0.04
            }
        },
        {
            "id": "MM-19",
            "tradition": "universal",
            "sutra_reference": "Bharuch copper 19e",
            "description": "Moon-Venus harmonies in travel houses signal couples who thrive on creative sabbaticals and rotating studio hubs.",
            "time_horizon": "short-term",
            "base_weight": 0.45,
            "pair_rules": [
                {
                    "label": "Shared travel cadence",
                    "primary_field": "lunar_tithi",
                    "partner_field": "lunar_tithi",
                    "comparator": "distance",
                    "max_difference": 3,
                    "weight": 0.45
                },
                {
                    "label": "Venus studio sync",
                    "primary_field": "venus_house",
                    "partner_field": "venus_house",
                    "comparator": "distance",
                    "max_difference": 2,
                    "circular": true,
                    "weight": 0.55
                }
            ],
            "modern_modifiers": {
                "slow-travel": 0.06,
                "digital-nomad": 0.05,
                "arts-collab": 0.04
            }
        },
        {
            "id": "MM-21",
            "tradition": "universal",
            "sutra_reference": "Composite oral 21",
            "description": "Saturn-Jupiter steadiness across kendras maps to partners building intergenerational trusts and community projects.",
            "time_horizon": "long-term",
            "base_weight": 0.65,
            "pair_rules": [
                {
                    "label": "Saturn stability span",
                    "primary_field": "saturn_house",
                    "partner_field": "saturn_house",
                    "comparator": "distance",
                    "max_difference": 2,
                    "circular": true,
                    "weight": 0.45
                },
                {
                    "label": "Jupiter value sync",
                    "primary_field": "jupiter_house",
                    "partner_field": "jupiter_house",
                    "comparator": "distance",
                    "max_difference": 3,
                    "circular": true,
                    "weight": 0.55
                }
            ],
            "modern_modifiers": {
                "family-planning": 0.07,
                "co-living": 0.05,
                "impact-projects": 0.06
            }
        }
    ],
    "transit_rules": [
        {
            "id": "TR-1",
            "tradition": "universal",
            "sutra_reference": "Gochar compendium 1a",
            "planet": "Saturn",
            "conditions": {
                "saturn_house": {
                    "any_of": [
                        10,
                        11
                    ]
                },
                "tithi_delta": {
                    "min": 0
                }
            },
            "influence": "Sustained career pressure bringing structural acclaim when matched with charity.",
            "certainty": 0.72
        },
        {
            "id": "TR-2",
            "tradition": "southern-grantha",
            "sutra_reference": "Grantha scroll 68f",
            "planet": "Ketu",
            "conditions": {
                "ketu_house": 12,
                "moon_element_shift": [
                    "water",
                    "ether"
                ]
            },
            "influence": "Dream-intensive retreat season; prioritize solitude and scriptural study.",
            "certainty": 0.78
        },
        {
            "id": "TR-3",
            "tradition": "northern",
            "sutra_reference": "Northern Bhrigu bundle 5a",
            "planet": "Mercury",
            "conditions": {
                "mercury_house": {
                    "any_of": [
                        3,
                        6
                    ]
                },
                "tithi_delta": {
                    "max": 3
                }
            },
            "influence": "Short journeys ignite research alliances and multilingual drafting sprints.",
            "certainty": 0.69
        },
        {
            "id": "TR-4",
            "tradition": [
                "southern-grantha",
                "universal"
            ],
            "sutra_reference": "Grantha gochar leaf 12c",
            "planet": "Saturn",
            "conditions": {
                "saturn_house": {
                    "any_of": [
                        8,
                        12
                    ]
                },
                "tithi_delta": {
                    "max": 2
                },
                "saturn_retrograde": {
                    "equals": true
                }
            },
            "influence": "Shadow work season: halt overextension, rebuild boundaries, and commit to ancestor offerings before taking new roles.",
            "certainty": 0.77
        },
        {
            "id": "TR-5",
            "tradition": "western-grantha",
            "sutra_reference": "Western grantha gochar 5f",
            "planet": "Ketu",
            "conditions": {
                "ketu_house": {
                    "any_of": [
                        3,
                        6
                    ]
                },
                "moon_element_shift": [
                    "air",
                    "fire"
                ],
                "rahu_aspects_ascendant": {
                    "equals": true
                }
            },
            "influence": "Sudden detours and investigative travel; seek mentors before signing documents and use ritual pauses to avoid burnout.",
            "certainty": 0.73
        }
    ]
}
"""

BHRIGU_CANON: Dict[str, Any] = json.loads(_RAW_CORPUS)

def as_dict() -> Dict[str, Any]:
    """Return a deep copy of the canonical data."""

    return deepcopy(BHRIGU_CANON)

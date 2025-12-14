"""Bhrigu Core Wisdom atomic rules and engine specification.

This module codifies the sign-neutral, house-centric rule base provided for
the Bhrigu Core Wisdom experience. It exposes a helper to build the atomic
rules, assemble the engine specification, and optionally persist both to disk
in JSON form so downstream services (designers, interpreters, data pipelines)
can reuse the exact bundle.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Sequence, Tuple

DEFAULT_CREATION_DATE = "2025-12-14"
DEFAULT_OUTPUT_DIR = Path("/mnt/data")

PLANETS: Sequence[Tuple[str, str, str]] = (
    ("Sun", "SU", "authority, identity, government, vitality"),
    ("Moon", "MO", "mind, emotions, public, fluids"),
    ("Mars", "MA", "action, courage, conflict, engineering"),
    ("Mercury", "ME", "intellect, speech, trade, skills"),
    ("Jupiter", "JU", "wisdom, dharma, wealth-growth, children"),
    ("Venus", "VE", "relationships, comforts, arts, pleasures"),
    ("Saturn", "SA", "karma, delay, discipline, labor"),
    ("Rahu", "RA", "desire, disruption, foreign, unconventional"),
    ("Ketu", "KE", "detachment, intuition, spirituality, cuts"),
)

HOUSES: Sequence[Tuple[int, str, str]] = (
    (1, "Self & body", "identity, temperament, health, appearance, initiative"),
    (2, "Wealth & speech", "family, savings, food, voice, values"),
    (3, "Effort & siblings", "courage, communication, skills, short travel"),
    (4, "Home & peace", "mother, property, education, inner comfort"),
    (5, "Creativity & children", "intelligence, romance, mantra, speculation"),
    (6, "Work & obstacles", "service, debts, disease, rivals, litigation"),
    (7, "Marriage & trade", "spouse, partnerships, public dealings"),
    (8, "Change & longevity", "crises, occult, inheritance, transformations"),
    (9, "Fortune & dharma", "teachers, luck, long travel, faith"),
    (10, "Career & status", "profession, authority, reputation, actions"),
    (11, "Gains & networks", "income, friends, fulfilment, ambitions"),
    (12, "Loss & liberation", "expenses, sleep, foreign lands, moksha"),
)

HOUSE_DOMAIN_EFFECTS: Dict[int, Sequence[str]] = {
    1: ("health", "personality", "status"),
    2: ("wealth", "family", "speech"),
    3: ("skills", "courage", "siblings"),
    4: ("home", "property", "education"),
    5: ("children", "creativity", "intelligence"),
    6: ("work", "debts", "health"),
    7: ("marriage", "business", "public_life"),
    8: ("longevity", "sudden_events", "occult"),
    9: ("fortune", "teachers", "travel"),
    10: ("career", "authority", "reputation"),
    11: ("income", "networks", "gains"),
    12: ("expenses", "foreign", "spirituality"),
}


def _build_matchmaking_model(today: str) -> Dict[str, Any]:
    return {
        "module": {
            "name": "Bhrigu Matchmaking & Compatibility Model",
            "version": "1.0",
            "created_at": today,
            "scope": (
                "Compatibility scoring using jyotisha indicators commonly used alongside "
                "Bhrigu-style house-centric readings."
            ),
            "note": (
                "Outputs are probabilistic; human compatibility also depends on values, "
                "communication, and lived experience."
            ),
        },
        "inputs": {
            "required": {
                "person_a": ["planet_house_positions", "lagna_house_map"],
                "person_b": ["planet_house_positions", "lagna_house_map"],
            },
            "recommended": {
                "person_a": [
                    "moon_sign",
                    "moon_nakshatra",
                    "venus_house",
                    "mars_house",
                    "jupiter_house",
                    "7th_house_lord",
                    "upapada_lagna",
                ],
                "person_b": [
                    "moon_sign",
                    "moon_nakshatra",
                    "venus_house",
                    "mars_house",
                    "jupiter_house",
                    "7th_house_lord",
                    "upapada_lagna",
                ],
            },
            "optional": {
                "both": ["aspects", "dignities", "planet_strength", "dashas"],
            },
        },
        "scoring": {
            "overall_scale": "0..100",
            "bands": [
                {"label": "excellent", "min": 80},
                {"label": "good", "min": 65},
                {"label": "mixed", "min": 50},
                {"label": "challenging", "min": 0},
            ],
            "weights": {
                "ashtakoota": 0.45,
                "synastry": 0.35,
                "marriage_indicators": 0.20,
            },
        },
        "components": [
            {
                "component_id": "MM-ASHTAKOOTA",
                "name": "Ashtakoota (8 koota) score (North Indian standard)",
                "max_points": 36,
                "logic": [
                    {"koota": "Varna", "max": 1, "intent": "spiritual/temperamental compatibility"},
                    {"koota": "Vashya", "max": 2, "intent": "mutual influence and attraction"},
                    {"koota": "Tara (Dina)", "max": 3, "intent": "wellbeing and fortune"},
                    {"koota": "Yoni", "max": 4, "intent": "sexual/instinctive compatibility"},
                    {"koota": "Graha Maitri", "max": 5, "intent": "mental compatibility via lords"},
                    {"koota": "Gana", "max": 6, "intent": "nature/behavioral match"},
                    {"koota": "Bhakoot (Rashi)", "max": 7, "intent": "family prosperity and emotional flow"},
                    {"koota": "Nadi", "max": 8, "intent": "health/genetic harmony (traditional)"},
                ],
                "output": {
                    "koota_breakdown": [
                        {"koota": "string", "score": "number", "note": "string"},
                    ],
                    "total": "number",
                },
            },
            {
                "component_id": "MM-DOSHA-CHECKS",
                "name": "Dosha checks & mitigations",
                "logic": [
                    {
                        "dosha_id": "MM-MANGAL",
                        "name": "Kuja/Mangal Dosha",
                        "check": "Assess Mars placement from Lagna/Moon/Venus (configurable) in 1/2/4/7/8/12",
                        "effect": (
                            "Increases conflict/temper; mitigated by cancellations, strength, benefic aspects, "
                            "and matching dosha."
                        ),
                    },
                    {
                        "dosha_id": "MM-NADI",
                        "name": "Nadi Dosha",
                        "check": "If both have same Nadi (as per nakshatra mapping)",
                        "effect": "Traditional concern; mitigations vary by school; present as 'risk flag' not absolute.",
                    },
                    {
                        "dosha_id": "MM-BHAKOOT",
                        "name": "Bhakoot Dosha",
                        "check": "Moon sign distance pattern indicating strain",
                        "effect": (
                            "May indicate emotional/family flow challenges; mitigations via benefic support and "
                            "strong 7th factors."
                        ),
                    },
                ],
                "output": {
                    "flags": [
                        {"dosha_id": "string", "severity": "low|medium|high", "note": "string"},
                    ],
                },
            },
            {
                "component_id": "MM-SYN",
                "name": "Synastry (cross-chart) scoring",
                "logic": [
                    {
                        "rule_id": "SYN-7H-OVERLAY",
                        "name": "7th house overlay emphasis",
                        "check": (
                            "Do A's key planets (Venus/Jupiter/Moon) fall into B's 7th/1st/5th/11th houses (and "
                            "vice versa)?"
                        ),
                        "effect": "Boost attraction, partnership feeling, and support.",
                    },
                    {
                        "rule_id": "SYN-VENUS-MARS",
                        "name": "Venus–Mars chemistry",
                        "check": "Venus of one connects by house/aspect to Mars of the other (configurable)",
                        "effect": "Boost romance/chemistry; harsh aspects add volatility.",
                    },
                    {
                        "rule_id": "SYN-SATURN-TO-7H",
                        "name": "Saturn impact on relationship axis",
                        "check": "Saturn contacts to partner’s 7th house/lord or Venus/Moon",
                        "effect": (
                            "Adds commitment and longevity potential but may feel heavy/delaying if afflicted."
                        ),
                    },
                    {
                        "rule_id": "SYN-JUPITER-SUPPORT",
                        "name": "Jupiter protection",
                        "check": "Jupiter aspects/support to partner’s 7th/1st/5th or Venus/Moon",
                        "effect": "Improves harmony, forgiveness, family support.",
                    },
                    {
                        "rule_id": "SYN-NODES",
                        "name": "Rahu–Ketu karmic pull",
                        "check": "Nodes connect strongly to partner’s luminaries/7th lord/Upapada",
                        "effect": "Strong karmic attraction; may be intense; require maturity.",
                    },
                ],
                "output": {
                    "synastry_score": "number",
                    "highlights": [
                        {"rule_id": "string", "impact": "positive|mixed|challenging", "note": "string"},
                    ],
                },
            },
            {
                "component_id": "MM-MARRIAGE-INDICATORS",
                "name": "Marriage indicators (Bhrigu-style house-centric)",
                "logic": [
                    {
                        "indicator_id": "MI-7H",
                        "name": "7th house strength & affliction",
                        "check": "Assess each chart’s 7th house, its lord, and karakas (Venus/Jupiter) for support vs affliction.",
                        "effect": "Predicts marriage stability baseline.",
                    },
                    {
                        "indicator_id": "MI-UL",
                        "name": "Upapada Lagna (UL)",
                        "check": "UL strength and 2nd from UL; benefic/malefic influences",
                        "effect": "Refines spouse quality, marriage durability, public image of marriage.",
                    },
                    {
                        "indicator_id": "MI-D9",
                        "name": "Navamsa cross-check (if available)",
                        "check": "Compare D9 Venus/Jupiter/7th lord condition for both charts",
                        "effect": "Raises confidence; resolves conflicts from D1.",
                    },
                ],
                "output": {
                    "baseline_stability": "low|medium|high",
                    "notes": ["string"],
                },
            },
        ],
        "processing_steps": [
            "1) Compute Ashtakoota score from Moon nakshatra/rashi inputs (if provided); otherwise mark as 'missing' and down-weight.",
            "2) Run dosha checks and compute severity; apply cancellations if rules are configured.",
            "3) Compute synastry overlays and key planet-to-relationship-axis contacts in both directions.",
            "4) Compute marriage indicator baselines (7th house/lord, Venus/Jupiter, UL; optional D9).",
            "5) Combine weighted component scores into 0..100, produce band label + narrative highlights + risk flags.",
        ],
        "output_schema": {
            "overall": {"score": "number", "band": "string"},
            "components": {
                "ashtakoota": {"score": "number", "max": 36, "breakdown": "array"},
                "synastry": {"score": "number", "highlights": "array"},
                "doshas": {"flags": "array"},
                "marriage_indicators": {"baseline_stability": "string", "notes": "array"},
            },
            "recommendations": ["string"],
            "traceability": {
                "atomic_rule_ids_used": ["string"],
                "modifier_ids_used": ["string"],
                "component_ids_used": ["string"],
            },
        },
        "default_recommendations_templates": [
            "Prioritize communication rituals if emotional volatility flags are high.",
            "If Saturn-heavy contacts exist, plan for patience and structured conflict resolution.",
            "If strong benefic support exists, lean into shared education/values-building activities.",
            "Where dosha flags exist, present traditional remedies only as optional cultural practices (not medical advice).",
        ],
    }

PLANET_DOMAIN: Dict[str, Dict[str, str]] = {
    "Sun": {
        "health": "strong vitality; watch heat/pressure",
        "personality": "self-respecting, authoritative",
        "status": "honor, leadership, visibility",
        "wealth": "wealth via authority; pride in possessions",
        "family": "dominant family role; respected lineage",
        "speech": "direct, commanding speech",
        "skills": "administration, management skills",
        "courage": "bold, takes charge",
        "siblings": "proud relations; leadership among siblings",
        "home": "official/solar tone at home; father influence",
        "property": "property through authority/government",
        "education": "education for status; disciplined learning",
        "children": "child brings pride; focus on legacy",
        "creativity": "creative leadership; recognition",
        "intelligence": "clear judgment; ego may color views",
        "work": "service with authority; clashes with superiors possible",
        "debts": "debts reduced through discipline; avoid ego disputes",
        "marriage": "spouse respects status; strong will in partnership",
        "business": "success in leadership roles; brand/authority driven",
        "public_life": "public recognition; reputation central",
        "longevity": "survives crises with will; heart/heat care",
        "sudden_events": "sudden status shifts; avoid arrogance",
        "occult": "interest in authority of knowledge; not deeply occult",
        "fortune": "luck via mentors/authority; dharma pride",
        "teachers": "teacher-like role; respect gurus",
        "travel": "official travel; purposeful journeys",
        "career": "government/leadership; high responsibility",
        "authority": "command positions; fame possible",
        "reputation": "name and honor emphasized",
        "income": "gains through leadership; high expectations",
        "networks": "influential contacts; ego conflicts possible",
        "gains": "profits via status/brand",
        "expenses": "spend on status, authority, father/health",
        "foreign": "foreign for prestige/work",
        "spirituality": "spiritual pride; need humility",
    },
    "Moon": {
        "health": "variable vitality; digestion/fluids sensitive",
        "personality": "empathetic, changeable, popular",
        "status": "public favor; fluctuating fame",
        "wealth": "income linked to public/mass needs",
        "family": "nurturing family role; strong mother link",
        "speech": "soft, persuasive speech",
        "skills": "public relations; adaptive skills",
        "courage": "courage in tides; mood-driven action",
        "siblings": "caring sibling bonds; fluctuations",
        "home": "strong domestic focus; comfort seeking",
        "property": "property via family/mother; homes improve wellbeing",
        "education": "learning by feeling; memory strength",
        "children": "affectionate children; emotional bonds",
        "creativity": "imaginative, artistic mind",
        "intelligence": "reflective; indecision possible",
        "work": "service in caring roles; workplace emotions",
        "debts": "debts fluctuate; manage impulsive spending",
        "marriage": "emotionally responsive spouse; sensitivity in marriage",
        "business": "trade involving liquids, food, hospitality",
        "public_life": "visibility with ups/downs; crowd support",
        "longevity": "resilience depends on mental peace",
        "sudden_events": "sudden mood/relationship shifts",
        "occult": "intuition, dreams, mind sciences",
        "fortune": "luck through women/public; changing luck",
        "teachers": "learns through nurture; receptive to guidance",
        "travel": "travel near water; comfort-based travel",
        "career": "public-facing roles; caregiving/management",
        "authority": "soft authority; relies on popularity",
        "reputation": "reputation tied to emotions/public image",
        "income": "income through networks; seasonal variations",
        "networks": "many contacts; emotional ties",
        "gains": "gains through public support",
        "expenses": "spend on comfort, home, family",
        "foreign": "foreign due to emotional ties/work",
        "spirituality": "devotional mind; meditation helps stability",
    },
    "Mars": {
        "health": "strong energy; risk of cuts/inflammation",
        "personality": "brave, assertive, competitive",
        "status": "status through action; fights for recognition",
        "wealth": "wealth via engineering, land, initiative",
        "family": "protective but argumentative family role",
        "speech": "sharp speech; straightforward",
        "skills": "technical/defense skills; hands-on competence",
        "courage": "very high courage; takes risks",
        "siblings": "conflicts/competition with siblings possible",
        "home": "restlessness at home; need for independence",
        "property": "land, construction, vehicles; disputes possible",
        "education": "practical learning; sports/engineering",
        "children": "active children; strict discipline",
        "creativity": "bold creativity; entrepreneurship",
        "intelligence": "quick decisions; impatience",
        "work": "competitive service; wins over rivals",
        "debts": "takes loans for action; clears by effort",
        "marriage": "passion; disputes if anger unmanaged",
        "business": "industry, metals, tools, machinery; competitive trade",
        "public_life": "known for bold stands",
        "longevity": "accident risk; stamina high",
        "sudden_events": "sudden conflicts; accidents possible",
        "occult": "interest in weapons/strategic occult",
        "fortune": "fortune via courage; luck in contests",
        "teachers": "prefers direct mentors; challenges authority",
        "travel": "frequent short trips; action travel",
        "career": "military, engineering, operations, leadership",
        "authority": "command via strength; confrontations possible",
        "reputation": "reputation as fighter/achiever",
        "income": "income from initiative; variable with risks",
        "networks": "networks through teams/sports/industry",
        "gains": "gains through bold actions",
        "expenses": "spend on vehicles, tools, competition",
        "foreign": "foreign due to work/conflict resolution",
        "spirituality": "discipline via martial path; needs patience",
    },
    "Mercury": {
        "health": "nervous system sensitive; generally youthful",
        "personality": "curious, witty, communicative",
        "status": "status through skills and intellect",
        "wealth": "wealth via trade, analytics, writing",
        "family": "youthful family interactions; negotiations",
        "speech": "clever speech; languages",
        "skills": "strong in learning, commerce, tech",
        "courage": "courage through planning; tactical bravery",
        "siblings": "helpful sibling ties; communication central",
        "home": "busy home environment; study-friendly",
        "property": "property via documents/deals",
        "education": "excellent for education; multi-disciplinary",
        "children": "smart children; focus on studies",
        "creativity": "writing/design/logic creativity",
        "intelligence": "sharp reasoning; adaptable mind",
        "work": "service in communication/analysis roles",
        "debts": "debts handled via planning; paperwork important",
        "marriage": "partnership built on communication; youthful spouse",
        "business": "sales, brokerage, IT, media, consulting",
        "public_life": "known for speech/writing",
        "longevity": "benefits from mental activity; stress management",
        "sudden_events": "sudden changes via deals/messages",
        "occult": "interest in systems, numbers, astrology as craft",
        "fortune": "fortune through learning and networking",
        "teachers": "many teachers; learns quickly",
        "travel": "frequent short travel; business trips",
        "career": "commerce, analytics, media, education, tech",
        "authority": "authority through expertise",
        "reputation": "reputation as smart communicator",
        "income": "income via multiple streams",
        "networks": "large network; connector role",
        "gains": "gains through smart deals",
        "expenses": "spend on gadgets, learning, travel",
        "foreign": "foreign via trade/IT/study",
        "spirituality": "intellectual spirituality; mantra with logic",
    },
    "Jupiter": {
        "health": "overall protection; watch weight/sugar",
        "personality": "ethical, optimistic, guiding",
        "status": "respect, honor, counsel roles",
        "wealth": "wealth growth and stability",
        "family": "supportive family; good lineage",
        "speech": "wise, dignified speech",
        "skills": "teaching, advising, law, finance",
        "courage": "courage through dharma; confident",
        "siblings": "helpful relations; elder-sibling protection",
        "home": "peaceful home; blessings in residence",
        "property": "property expansion; good lands",
        "education": "higher education; scriptures",
        "children": "children blessing; good progeny",
        "creativity": "noble creativity; mentoring talent",
        "intelligence": "excellent judgment; wisdom",
        "work": "service in advisory/ethical roles",
        "debts": "debts manageable; protection in disputes",
        "marriage": "supportive spouse; moral partner",
        "business": "education, finance, law, consulting; ethical trade",
        "public_life": "respected and trusted by public",
        "longevity": "protects longevity; recovery",
        "sudden_events": "rescued in crises; benefic outcomes",
        "occult": "interest in philosophy, dharma, higher knowledge",
        "fortune": "strong fortune; grace of teachers",
        "teachers": "guru support; becomes teacher",
        "travel": "long travel for education/pilgrimage",
        "career": "counsel, administration, law, education",
        "authority": "authority as advisor/leader",
        "reputation": "good name; integrity",
        "income": "steady gains; patronage",
        "networks": "good friends; benefactors",
        "gains": "profits with ethics",
        "expenses": "spend on charity, education, rituals",
        "foreign": "foreign for study/teaching",
        "spirituality": "strong spiritual growth; devotion",
    },
    "Venus": {
        "health": "good vitality; watch sugar/indulgence",
        "personality": "charming, diplomatic, artistic",
        "status": "status via relationships/arts/comfort",
        "wealth": "wealth through luxury, trade, partnerships",
        "family": "harmonious family; pleasures",
        "speech": "pleasant speech; persuasive",
        "skills": "arts, design, negotiation, hospitality",
        "courage": "courage in social settings; diplomacy",
        "siblings": "friendly ties; cooperative",
        "home": "beautiful home; comforts",
        "property": "vehicles, luxuries, aesthetics in property",
        "education": "arts/creative education",
        "children": "affectionate children; creative legacy",
        "creativity": "strong arts/music/design",
        "intelligence": "balanced views; pleasure-seeking",
        "work": "service in arts/hospitality; diplomacy at work",
        "debts": "debts due to luxury; manage spending",
        "marriage": "romance; strong marital focus",
        "business": "fashion, beauty, entertainment, hospitality",
        "public_life": "popular, liked by people",
        "longevity": "comfort supports longevity; indulgence risks",
        "sudden_events": "sudden romance/pleasure events",
        "occult": "interest in tantra/arts; charm sciences",
        "fortune": "fortune through women/alliances",
        "teachers": "learns through refinement; artistic mentors",
        "travel": "travel for pleasure/arts",
        "career": "arts, luxury trade, diplomacy, design",
        "authority": "soft authority; influence through charm",
        "reputation": "known for taste and refinement",
        "income": "income via clients/partners",
        "networks": "strong social circles",
        "gains": "gains through alliances",
        "expenses": "spend on luxury, love, beauty",
        "foreign": "foreign for pleasure/arts/trade",
        "spirituality": "devotional aesthetics; bhakti through beauty",
    },
    "Saturn": {
        "health": "stamina but chronic issues; bones/joints care",
        "personality": "serious, disciplined, enduring",
        "status": "slow, lasting status; respect for work",
        "wealth": "wealth through labor and long-term saving",
        "family": "duty-bound family role; burdens possible",
        "speech": "measured speech; sometimes harsh",
        "skills": "management of systems; endurance skills",
        "courage": "courage through patience; steady",
        "siblings": "responsibility for siblings; distance possible",
        "home": "austere home; obligations",
        "property": "property after delay; repairs/old buildings",
        "education": "learning through effort; practical wisdom",
        "children": "children after delay or responsibility",
        "creativity": "structured creativity; craftsmanship",
        "intelligence": "realistic; cautious",
        "work": "service, labor, governance systems",
        "debts": "debts with delay; disciplined repayment",
        "marriage": "serious partnership; delay/tests possible",
        "business": "industry, minerals, logistics; long-term business",
        "public_life": "known for reliability",
        "longevity": "supports longevity with discipline",
        "sudden_events": "sudden setbacks if karma ripens",
        "occult": "interest in karma, austerity, deep truths",
        "fortune": "fortune after effort; karmic grace",
        "teachers": "teachers strict; learns patience",
        "travel": "travel for duty/work",
        "career": "slow rise; administration, labor, systems",
        "authority": "authority late; durable power",
        "reputation": "reputation for discipline",
        "income": "steady income; grows over time",
        "networks": "few but reliable friends",
        "gains": "gains through persistence",
        "expenses": "spend on obligations, repairs, health",
        "foreign": "foreign for labor/responsibility",
        "spirituality": "strong tapas; detachment lessons",
    },
    "Rahu": {
        "health": "odd ailments; toxins/addictions risk",
        "personality": "ambitious, unconventional, restless",
        "status": "sudden rise; fame through unusual paths",
        "wealth": "wealth via foreign, tech, speculation; swings",
        "family": "non-traditional family patterns",
        "speech": "persuasive, sometimes deceptive",
        "skills": "innovation, strategy, tech/media",
        "courage": "bold, risk-taking",
        "siblings": "unusual sibling relations; separations possible",
        "home": "restless home; relocations",
        "property": "property in foreign/modern areas; sudden gains/loss",
        "education": "modern/foreign learning",
        "children": "unusual children matters; sudden events",
        "creativity": "breakthrough creativity; rebellion",
        "intelligence": "cunning; obsession risk",
        "work": "work in mass/tech/foreign sectors; politics",
        "debts": "debts via risks; careful contracts",
        "marriage": "unconventional marriage; attraction/instability",
        "business": "tech, media, aviation, foreign trade",
        "public_life": "mass appeal; controversy possible",
        "longevity": "sudden crises possible; avoid risky habits",
        "sudden_events": "very high—surprises, scandals, leaps",
        "occult": "strong interest in occult, tantra, mysteries",
        "fortune": "fortune through unconventional routes",
        "teachers": "unorthodox mentors",
        "travel": "foreign/long travel prominent",
        "career": "tech/media/foreign/politics; sudden shifts",
        "authority": "authority via influence; instability",
        "reputation": "polarizing reputation",
        "income": "big gains possible; volatility",
        "networks": "wide networks; opportunistic ties",
        "gains": "windfalls; speculative gains",
        "expenses": "spend on desires, tech, travel",
        "foreign": "strong foreign connection",
        "spirituality": "spiritual breakthroughs after obsession control",
    },
    "Ketu": {
        "health": "mysterious issues; cuts; nervous sensitivity",
        "personality": "detached, inward, sharp intuition",
        "status": "low-interest in fame; niche respect",
        "wealth": "wealth via minimalism; sudden detachment from money",
        "family": "distance from family norms; separations possible",
        "speech": "few words; cutting truth",
        "skills": "research, healing, spiritual skills",
        "courage": "fearless in crises; dispassionate",
        "siblings": "distance or spiritual bonds",
        "home": "simple home; wandering spirit",
        "property": "property renounced or simplified",
        "education": "deep study, metaphysics, research",
        "children": "spiritual/intense children themes; detachment",
        "creativity": "minimalist, symbolic creativity",
        "intelligence": "penetrating insight; skeptical",
        "work": "work in research, healing, backstage roles",
        "debts": "cuts debts abruptly; sudden closures",
        "marriage": "detachment in marriage; spiritual tests",
        "business": "spiritual goods, research, niche services",
        "public_life": "private life; behind-the-scenes",
        "longevity": "survives crises through detachment",
        "sudden_events": "separations, endings, renunciation",
        "occult": "very strong occult/spiritual interest",
        "fortune": "fortune via letting go; pilgrimages",
        "teachers": "spiritual teachers; mystical guidance",
        "travel": "pilgrimage/isolated travel",
        "career": "research, spirituality, healing; non-mainstream",
        "authority": "dislikes authority; quiet influence",
        "reputation": "known for depth/otherworldliness",
        "income": "income steady but not attachment-based",
        "networks": "few, spiritual network",
        "gains": "gains through renunciation",
        "expenses": "spend on spirituality, retreats, healing",
        "foreign": "foreign for retreat/pilgrimage",
        "spirituality": "very high—moksha orientation",
    },
}

MODIFIERS: List[Dict[str, str]] = [
    {
        "modifier_id": "MOD-CONJ",
        "type": "conjunction",
        "applies_to": "planet_pair",
        "description": "If two planets are conjunct (within orb), blend effects; benefic/ malefic tone depends on planets and strength.",
    },
    {
        "modifier_id": "MOD-ASPECT-DRISHTI",
        "type": "aspect",
        "applies_to": "planet_pair",
        "description": "Apply graha drishti (special aspects) to modify the house results of the aspected planet/house.",
    },
    {
        "modifier_id": "MOD-RETRO",
        "type": "retrograde",
        "applies_to": "planet",
        "description": "Retrograde amplifies inward repetition; delays/returns; can intensify outcomes and rework themes.",
    },
    {
        "modifier_id": "MOD-COMBUST",
        "type": "combustion",
        "applies_to": "planet",
        "description": "Combust planet loses clarity; results become strained; mitigate via strength and benefic support.",
    },
    {
        "modifier_id": "MOD-EXALTED",
        "type": "dignity",
        "applies_to": "planet",
        "description": "Exaltation strengthens constructive expression; improves reliability of positive outcomes.",
    },
    {
        "modifier_id": "MOD-DEBILITATED",
        "type": "dignity",
        "applies_to": "planet",
        "description": "Debilitation weakens constructive expression; increases challenges unless supported.",
    },
    {
        "modifier_id": "MOD-OWN",
        "type": "dignity",
        "applies_to": "planet",
        "description": "Own sign steadies results; makes themes consistent.",
    },
    {
        "modifier_id": "MOD-FRIEND",
        "type": "dignity",
        "applies_to": "planet",
        "description": "Friend sign supports smoother outcomes.",
    },
    {
        "modifier_id": "MOD-ENEMY",
        "type": "dignity",
        "applies_to": "planet",
        "description": "Enemy sign adds friction and delays.",
    },
    {
        "modifier_id": "MOD-SHADBALA",
        "type": "strength",
        "applies_to": "planet",
        "description": "Use strength score (e.g., shadbala proxy) to scale effect intensity and positivity.",
    },
    {
        "modifier_id": "MOD-AFFLICTED",
        "type": "affliction",
        "applies_to": "planet_or_house",
        "description": "Affliction (malefic aspects/conjunctions) increases obstacles in that domain.",
    },
    {
        "modifier_id": "MOD-BENEFIC-SUPPORT",
        "type": "support",
        "applies_to": "planet_or_house",
        "description": "Benefic support improves outcomes and reduces harshness.",
    },
    {
        "modifier_id": "MOD-DASHA-MAHA",
        "type": "timing",
        "applies_to": "planet",
        "description": "During a planet’s mahadasha, its house results manifest strongly.",
    },
    {
        "modifier_id": "MOD-DASHA-ANTAR",
        "type": "timing",
        "applies_to": "planet_pair",
        "description": "Antardasha planet triggers subthemes and events within the mahadasha.",
    },
    {
        "modifier_id": "MOD-TRANSIT-TRIGGER",
        "type": "timing",
        "applies_to": "planet",
        "description": "Key transits over natal planets/houses trigger events; use as activation layer.",
    },
    {
        "modifier_id": "MOD-NAKSHATRA",
        "type": "lunar_mansion",
        "applies_to": "planet",
        "description": "Nakshatra lord adds a secondary signature; blend with its atomic rule.",
    },
    {
        "modifier_id": "MOD-HOUSE-LORD",
        "type": "lordship",
        "applies_to": "house",
        "description": "House lord placement modifies that house’s outcomes; combine lord house + owned house domains.",
    },
    {
        "modifier_id": "MOD-YOGA",
        "type": "combination",
        "applies_to": "chart",
        "description": "If yoga conditions met, add yoga effects with priority weights.",
    },
    {
        "modifier_id": "MOD-ARUDHA",
        "type": "public_image",
        "applies_to": "house",
        "description": "Arudha pada shifts outcomes toward perceived/public manifestation.",
    },
    {
        "modifier_id": "MOD-UPAPADA",
        "type": "marriage_indicator",
        "applies_to": "chart",
        "description": "Use Upapada Lagna to refine spouse/marriage outcomes beyond 7th house.",
    },
    {
        "modifier_id": "MOD-CHARA-KARAKA",
        "type": "significator",
        "applies_to": "planet",
        "description": "Chara karaka roles refine life-domain mapping (e.g., Atmakaraka for life purpose).",
    },
    {
        "modifier_id": "MOD-ARGALA",
        "type": "intervention",
        "applies_to": "house",
        "description": "Argala indicates intervention/support/obstruction from specific houses; adjust outcomes.",
    },
    {
        "modifier_id": "MOD-AVASTHA",
        "type": "state",
        "applies_to": "planet",
        "description": "Planetary avastha (state) adjusts maturity and positivity.",
    },
]


def _build_atomic_rules(today: str) -> List[Dict[str, Any]]:
    atomic_rules: List[Dict[str, Any]] = []
    for pname, pcode, pkws in PLANETS:
        for hnum, hname, hkws in HOUSES:
            domains = HOUSE_DOMAIN_EFFECTS[hnum]
            effects = {domain: PLANET_DOMAIN[pname].get(domain, "") for domain in domains}
            core = f"{pname} in House {hnum} ({hname}) tends to express {pkws} through {hkws}."
            atomic_rules.append(
                {
                    "rule_id": f"BR-{pcode}-{hnum:02d}",
                    "planet": pname,
                    "house": hnum,
                    "house_name": hname,
                    "core_statement": core,
                    "effects": effects,
                    "confidence": "traditional",
                    "notes": "Sign-neutral, Bhrigu-style house-centric principle (not verbatim from any one manuscript).",
                    "created_at": today,
                }
            )
    return atomic_rules


def _build_engine_spec(today: str) -> Dict[str, Any]:
    return {
        "engine": {
            "name": "Bhrigu-Style Rule Engine",
            "version": "1.0",
            "created_at": today,
            "purpose": "Generate Bhrigu-style house-centric predictions from atomic rules + modifiers.",
            "legal_note": (
                "This is a synthesized, sign-neutral jyotisha rule system inspired by Bhrigu-style "
                "reading; it is not a verbatim reproduction of any copyrighted edition."
            ),
        },
        "inputs": {
            "required": ["lagna_house_map", "planet_house_positions"],
            "optional": [
                "planet_strength",
                "dignities",
                "aspects",
                "dashas",
                "transits",
                "nakshatra_lords",
                "house_lords",
                "yoga_flags",
            ],
        },
        "processing_steps": [
            "1) For each planet, fetch atomic rule BR-<planet>-<house>.",
            "2) Apply house-lord and dignity modifiers to scale/tilt effects.",
            "3) Apply conjunction/aspect/affliction/support modifiers to blend effects and add obstacles/support.",
            "4) Apply timing layers (dasha/transit) to mark active event windows.",
            "5) Aggregate effects by domain (career, marriage, wealth, health, etc.) and produce ranked narratives.",
        ],
        "scoring": {
            "base_weight": 1.0,
            "strength_multiplier": "0.5..1.5",
            "benefic_support_bonus": 0.1,
            "affliction_penalty": 0.1,
            "timing_activation_bonus": 0.2,
        },
        "modifiers": MODIFIERS,
        "output_format": {
            "per_planet": ["core_statement", "effects", "applied_modifiers"],
            "by_domain": ["summary", "supporting_factors", "risk_factors", "timing_notes"],
            "traceability": ["atomic_rule_ids_used", "modifier_ids_used"],
        },
    }


def _build_past_life_model(today: str) -> Dict[str, Any]:
    return {
        "module": {
            "name": "Bhrigu Past-Life & Karmic Imprint Model",
            "version": "1.0",
            "created_at": today,
            "scope": "Interpretive (non-deterministic) karmic themes using classical jyotisha indicators commonly used in Bhrigu-style readings.",
            "note": "This model generates thematic narratives; it does not claim factual verification of past lives.",
        },
        "inputs": {
            "required": ["planet_house_positions", "lagna_house_map"],
            "recommended": ["nakshatra_lords", "house_lords", "dignities", "aspects"],
            "advanced_optional": [
                "charakarakas",
                "divisional_charts",
                "d60",
                "d9",
                "d10",
            ],
        },
        "core_indicators": [
            {
                "indicator_id": "PL-KETU",
                "name": "Ketu (moksha & prior imprint)",
                "logic": "Primary past-life/unfinished karma marker; read Ketu's house, sign (if used), conjunctions, and aspects.",
                "weight": 1.2,
            },
            {
                "indicator_id": "PL-12H",
                "name": "12th House (loss, liberation, foreign, retreats)",
                "logic": "Themes of renunciation, isolation, foreignness, monasteries/ashrams, expenditure of karma; planets here show past-life residues.",
                "weight": 1.0,
            },
            {
                "indicator_id": "PL-8H",
                "name": "8th House (transformation, death, hidden karma)",
                "logic": "Crisis/transition karma; inheritance/lineage secrets; occult; sudden endings.",
                "weight": 1.0,
            },
            {
                "indicator_id": "PL-9H",
                "name": "9th House (dharma, guru, punya)",
                "logic": "Accumulated merit; teacher/student lineage; pilgrimages; vows; moral memory.",
                "weight": 0.8,
            },
            {
                "indicator_id": "PL-5H",
                "name": "5th House (purva punya)",
                "logic": "Past merit, talents carried forward, mantra/learning from prior births; children as karmic link.",
                "weight": 0.9,
            },
            {
                "indicator_id": "PL-RAHU-KETU-AXIS",
                "name": "Rahu–Ketu axis (karmic direction)",
                "logic": "Ketu = what is already known/overdone; Rahu = growth edge; interpret houses as past vs future trajectory.",
                "weight": 1.1,
            },
        ],
        "theme_library": [
            {
                "theme_id": "PL-ASCETIC",
                "label": "Ascetic / renunciate imprint",
                "triggers": [
                    {"when": "Ketu in 12th or with Saturn", "suggest": "vows, solitude, disciplined spirituality"},
                    {"when": "Strong 12th+9th links", "suggest": "pilgrimage/monastic connection"},
                ],
            },
            {
                "theme_id": "PL-WARRIOR",
                "label": "Warrior / protector imprint",
                "triggers": [
                    {
                        "when": "Mars influences 8th/12th or Ketu with Mars",
                        "suggest": "conflict karma, courage, injuries/armor themes",
                    },
                    {"when": "Sun+Mars career axis strong", "suggest": "command, duty, service"},
                ],
            },
            {
                "theme_id": "PL-SCHOLAR",
                "label": "Scholar / teacher imprint",
                "triggers": [
                    {
                        "when": "Jupiter strong in 5th/9th or Ketu with Jupiter",
                        "suggest": "scriptures, teaching lineages, counsel",
                    },
                    {"when": "Mercury strong with 5th/9th", "suggest": "languages, writing, analysis"},
                ],
            },
            {
                "theme_id": "PL-MERCHANT",
                "label": "Merchant / trade imprint",
                "triggers": [
                    {
                        "when": "Mercury/Venus influence 2nd/7th/11th",
                        "suggest": "trade networks, negotiation karma",
                    },
                    {"when": "Rahu in 2nd/7th/11th", "suggest": "foreign commerce, risk appetite"},
                ],
            },
            {
                "theme_id": "PL-HEALER",
                "label": "Healer / occult imprint",
                "triggers": [
                    {
                        "when": "Strong 8th+Ketu or Ketu with Moon",
                        "suggest": "intuition, healing arts, hidden knowledge",
                    },
                    {"when": "Jupiter+8th/12th links", "suggest": "spiritual medicine/ritual knowledge"},
                ],
            },
        ],
        "processing_steps": [
            "1) Compute Ketu house and axis (Rahu house opposite).",
            "2) Score houses 5/8/9/12 and the lords of those houses (if provided).",
            "3) Add conjunction/aspect modifiers to adjust themes (e.g., Saturn with Ketu => austerity; Venus with Ketu => relationship detachment lessons).",
            "4) Select top themes from theme_library using trigger matches and weighted scoring.",
            "5) Output: past-life theme summary + unfinished lessons (Ketu) + growth direction (Rahu).",
        ],
        "output_schema": {
            "past_life_summary": "string",
            "dominant_themes": ["theme_id"],
            "ketu_imprint": {"house": "int", "notes": "string"},
            "rahu_direction": {"house": "int", "notes": "string"},
            "supporting_indicators": [
                {"indicator_id": "string", "score": "number", "notes": "string"},
            ],
            "traceability": {
                "atomic_rule_ids_used": ["string"],
                "modifier_ids_used": ["string"],
            },
        },
    }


def _build_future_prediction_model(today: str) -> Dict[str, Any]:
    return {
        "module": {
            "name": "Bhrigu Future Prediction & Timing Model",
            "version": "1.0",
            "created_at": today,
            "scope": "Forecasting by activation: dasha + transit triggers applied to natal atomic rules (Bhrigu-style).",
            "note": "Predictions are probabilistic narratives. Always present as tendencies with confidence bands.",
        },
        "inputs": {
            "required": ["planet_house_positions"],
            "recommended": ["dashas"],
            "optional": ["transits", "aspects", "planet_strength", "house_lords"],
        },
        "timing_layers": [
            {
                "layer_id": "FT-DASHA",
                "name": "Vimshottari (or chosen) dasha activation",
                "logic": "Mahadasha planet activates its natal house results; Antardasha adds subthemes; Pratyantar refines event windows.",
                "weight": 1.3,
            },
            {
                "layer_id": "FT-TRANSIT",
                "name": "Transit trigger layer",
                "logic": "Saturn/Jupiter/Rahu-Ketu transits over natal planets/houses trigger events; Mars triggers short spikes; eclipses amplify nodes.",
                "weight": 1.0,
            },
            {
                "layer_id": "FT-LORDSHIP",
                "name": "House lord activation",
                "logic": "When dasha/transit involves the lord of a house, that house topics become active (e.g., 7th lord => marriage/partnership).",
                "weight": 1.1,
            },
        ],
        "event_domains": [
            "career",
            "marriage",
            "children",
            "wealth",
            "health",
            "property",
            "travel",
            "education",
            "spirituality",
            "legal",
            "family",
            "reputation",
        ],
        "processing_steps": [
            "1) Build baseline domain map from natal atomic rules (108 set).",
            "2) For current/target period, determine active planets from dasha (maha/antar/pratyantar).",
            "3) Boost domain scores where active planets sit, aspect, or lord relevant houses.",
            "4) Apply transit triggers (slow planets for long trends, fast planets for short events).",
            "5) Produce outputs: (a) 12-month outlook, (b) 3–5 year trend, (c) next key windows with confidence.",
        ],
        "confidence_model": {
            "bands": ["very_high", "high", "medium", "low"],
            "drivers": [
                "Planet strength and dignity",
                "Benefic support vs affliction",
                "Multiple timing layers agreeing (dasha + transit)",
                "Domain consistency across indicators",
            ],
        },
        "output_schema": {
            "period": {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"},
            "domain_forecasts": [
                {
                    "domain": "string",
                    "trend": "string",
                    "top_triggers": [{"type": "string", "detail": "string"}],
                    "confidence": "string",
                    "windows": [
                        {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD", "note": "string"},
                    ],
                }
            ],
            "traceability": {
                "atomic_rule_ids_used": ["string"],
                "modifier_ids_used": ["string"],
                "timing_layers_used": ["string"],
            },
        },
    }


def core_wisdom_assets(
    *, today: str = DEFAULT_CREATION_DATE, out_dir: Path | str | None = None, persist: bool = False
) -> Dict[str, Any]:
    """Build the Bhrigu Core Wisdom atomic rules and engine spec.

    When ``persist`` is True, the bundle is written to JSON files in ``out_dir``
    (defaulting to ``/mnt/data``) and the file paths are returned alongside the
    in-memory objects.
    """

    atomic_rules = _build_atomic_rules(today)
    engine_spec = _build_engine_spec(today)
    matchmaking_model = _build_matchmaking_model(today)

    payload: Dict[str, Any] = {
        "created_at": today,
        "count": len(atomic_rules),
        "atomic_rules": atomic_rules,
        "engine_spec": engine_spec,
        "matchmaking_model": matchmaking_model,
    }

    if not persist:
        return payload

    target_dir = Path(out_dir) if out_dir is not None else DEFAULT_OUTPUT_DIR
    target_dir.mkdir(parents=True, exist_ok=True)

    atomic_path = target_dir / "bhrigu_atomic_rules_108.json"
    engine_path = target_dir / "bhrigu_rule_engine_spec.json"
    matchmaking_path = target_dir / "bhrigu_matchmaking_model.json"

    with atomic_path.open("w", encoding="utf-8") as atomic_handle:
        json.dump(
            {
                "tradition": "Bhrigu-style (house-centric) atomic principles",
                "version": "1.0",
                "created_at": today,
                "count": len(atomic_rules),
                "atomic_rules": atomic_rules,
            },
            atomic_handle,
            ensure_ascii=False,
            indent=2,
        )

    with engine_path.open("w", encoding="utf-8") as engine_handle:
        json.dump(engine_spec, engine_handle, ensure_ascii=False, indent=2)

    with matchmaking_path.open("w", encoding="utf-8") as matchmaking_handle:
        json.dump(matchmaking_model, matchmaking_handle, ensure_ascii=False, indent=2)

    payload["atomic_rules_path"] = str(atomic_path)
    payload["engine_spec_path"] = str(engine_path)
    payload["matchmaking_model_path"] = str(matchmaking_path)

    return payload


__all__ = ["core_wisdom_assets"]

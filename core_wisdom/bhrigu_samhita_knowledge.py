"""
Bhrigu Samhita Knowledge Database
Comprehensive collection of principles, rules, and wisdom from Bhrigu Samhita
This module serves as the authoritative source for AI Astrology Guide responses
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum


class PlanetaryInfluence(Enum):
    """Planetary influence levels"""
    VERY_STRONG = "very_strong"
    STRONG = "strong"
    MODERATE = "moderate"
    WEAK = "weak"
    AFFLICTED = "afflicted"


class KarmicIntensity(Enum):
    """Karmic intensity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MODERATE = "moderate"
    LOW = "low"
    RESOLVED = "resolved"


@dataclass
class BhriguSutra:
    """Represents a single Bhrigu Samhita sutra/principle"""
    sutra_id: str
    sanskrit_text: str
    hindi_translation: str
    english_translation: str
    domain: str
    planets_involved: List[str]
    houses_involved: List[int]
    confidence_level: float
    remedies: List[str] = field(default_factory=list)
    citations: List[str] = field(default_factory=list)


# =============================================================================
# PLANETARY WISDOM DATABASE
# =============================================================================

PLANETARY_CORE_WISDOM = {
    "Sun": {
        "sanskrit_name": "Surya (सूर्य)",
        "nature": "Sattvic, Royal, Authoritative",
        "represents": ["Soul", "Father", "Authority", "Government", "Health", "Vitality", "Ego", "Self-expression"],
        "karaka_for": ["1st House (Soul)", "9th House (Father)", "10th House (Authority)"],
        "exaltation": {"sign": "Aries", "degree": 10, "effects": "Maximum confidence, leadership, success in government"},
        "debilitation": {"sign": "Libra", "degree": 10, "effects": "Ego conflicts, weak vitality, father issues"},
        "own_signs": ["Leo"],
        "friendly_planets": ["Moon", "Mars", "Jupiter"],
        "enemy_planets": ["Venus", "Saturn"],
        "neutral_planets": ["Mercury"],
        "gemstone": {"name": "Ruby (Manikya)", "weight": "3-5 carats", "metal": "Gold", "finger": "Ring finger", "day": "Sunday"},
        "mantra": {
            "vedic": "Om Hraam Hreem Hraum Sah Suryaya Namah",
            "tantric": "Om Ghrini Suryaya Namah",
            "count": 7000,
            "day": "Sunday at sunrise"
        },
        "charitable_acts": ["Donate wheat", "Donate jaggery", "Donate copper", "Feed cows", "Respect father"],
        "fasting_day": "Sunday",
        "house_effects": {
            1: "Strong personality, leadership qualities, good health, but possible ego issues",
            2: "Wealth through government, authoritative speech, eye problems possible",
            3: "Courage, success over enemies, good relations with siblings",
            4: "Property through father, authoritative mother, heart issues possible",
            5: "Intelligent children, speculative gains, creative leadership",
            6: "Victory over enemies, government job, but health issues",
            7: "Spouse from good family, but ego clashes in marriage",
            8: "Father's health issues, inheritance disputes, interest in occult",
            9: "Fortunate father, religious inclinations, government favor",
            10: "Excellent for career, government positions, fame and recognition",
            11: "Gains through government, influential friends, eldest child benefits",
            12: "Father lives abroad, expenses on authority, spiritual liberation"
        },
        "karmic_lessons": [
            "Learning humility despite natural authority",
            "Balancing ego with service to others",
            "Honoring father's legacy while forging own path",
            "Using power for dharmic purposes"
        ],
        "past_life_indicators": {
            "strong_sun": "Past life as royalty, leader, or priest",
            "weak_sun": "Misuse of power in past life, ego-related karma",
            "afflicted_sun": "Disrespect to father or authority in past life"
        }
    },

    "Moon": {
        "sanskrit_name": "Chandra (चन्द्र)",
        "nature": "Sattvic, Nurturing, Emotional",
        "represents": ["Mind", "Mother", "Emotions", "Public", "Liquids", "Travel", "Fertility"],
        "karaka_for": ["4th House (Mother)", "Mind", "Emotional well-being"],
        "exaltation": {"sign": "Taurus", "degree": 3, "effects": "Emotional stability, prosperity, strong mind"},
        "debilitation": {"sign": "Scorpio", "degree": 3, "effects": "Emotional turbulence, mental stress, mother issues"},
        "own_signs": ["Cancer"],
        "friendly_planets": ["Sun", "Mercury"],
        "enemy_planets": ["None (Moon has no permanent enemies)"],
        "neutral_planets": ["Mars", "Jupiter", "Venus", "Saturn"],
        "gemstone": {"name": "Pearl (Moti)", "weight": "5-7 carats", "metal": "Silver", "finger": "Little finger", "day": "Monday"},
        "mantra": {
            "vedic": "Om Shraam Shreem Shraum Sah Chandraya Namah",
            "tantric": "Om Som Somaya Namah",
            "count": 11000,
            "day": "Monday evening"
        },
        "charitable_acts": ["Donate rice", "Donate milk", "Donate white cloth", "Feed birds", "Serve mother"],
        "fasting_day": "Monday",
        "house_effects": {
            1: "Attractive personality, emotional nature, public popularity",
            2: "Fluctuating wealth, sweet speech, large family",
            3: "Emotional courage, many short travels, creative siblings",
            4: "Very auspicious - emotional security, property, happy mother",
            5: "Emotional intelligence, artistic children, romance",
            6: "Victory through emotions, service-oriented, possible stomach issues",
            7: "Beautiful spouse, public partnerships, emotional marriage",
            8: "Psychic abilities, emotional intensity, inheritance through mother",
            9: "Devotional nature, mother influences dharma, pilgrimage lover",
            10: "Public career, fluctuating status, dealing with masses",
            11: "Gains through public, many friends, emotional fulfillment",
            12: "Foreign residence, spiritual inclinations, vivid dreams"
        },
        "karmic_lessons": [
            "Mastering emotional reactions",
            "Nurturing without attachment",
            "Developing mental discipline",
            "Healing mother-related karma"
        ],
        "past_life_indicators": {
            "strong_moon": "Past life as caretaker, healer, or devoted mother",
            "weak_moon": "Emotional neglect or abandonment in past life",
            "afflicted_moon": "Karma related to emotional manipulation"
        },
        "nakshatra_special_effects": {
            "Rohini": "Ultimate creativity, material abundance, beauty",
            "Hasta": "Skilled hands, craftsmanship, healing abilities",
            "Shravana": "Divine listening, learning abilities, fame"
        }
    },

    "Mars": {
        "sanskrit_name": "Mangal/Kuja (मंगल/कुज)",
        "nature": "Tamasic, Warrior, Aggressive",
        "represents": ["Energy", "Courage", "Brothers", "Property", "Blood", "Surgery", "Military"],
        "karaka_for": ["3rd House (Courage)", "4th House (Property)", "6th House (Enemies)"],
        "exaltation": {"sign": "Capricorn", "degree": 28, "effects": "Disciplined action, strategic success, property gains"},
        "debilitation": {"sign": "Cancer", "degree": 28, "effects": "Emotional aggression, property disputes, family conflicts"},
        "own_signs": ["Aries", "Scorpio"],
        "friendly_planets": ["Sun", "Moon", "Jupiter"],
        "enemy_planets": ["Mercury"],
        "neutral_planets": ["Venus", "Saturn"],
        "gemstone": {"name": "Red Coral (Moonga)", "weight": "6-9 carats", "metal": "Gold/Copper", "finger": "Ring finger", "day": "Tuesday"},
        "mantra": {
            "vedic": "Om Kraam Kreem Kraum Sah Bhaumaya Namah",
            "tantric": "Om Ang Angarakaya Namah",
            "count": 10000,
            "day": "Tuesday morning"
        },
        "charitable_acts": ["Donate red lentils", "Donate jaggery", "Donate copper", "Feed monkeys", "Help warriors/athletes"],
        "fasting_day": "Tuesday",
        "mangal_dosha": {
            "houses": [1, 2, 4, 7, 8, 12],
            "effects": "Delays marriage, conflicts with spouse, requires matching or remedies",
            "cancellation_conditions": [
                "Mars in own sign or exalted",
                "Mars aspected by Jupiter",
                "Both partners have Mangal Dosha",
                "Mars in specific nakshatras"
            ],
            "remedies": [
                "Kumbh Vivah (marriage to pot/tree)",
                "Mangal Shanti Puja",
                "Hanuman Chalisa recitation",
                "Red coral after proper analysis"
            ]
        },
        "house_effects": {
            1: "Strong physique, aggressive, leadership, possible accidents",
            2: "Harsh speech, family conflicts, wealth through effort",
            3: "Excellent - great courage, victory over enemies, successful siblings",
            4: "Property disputes, aggressive mother, heart/chest issues",
            5: "Competitive children, sports talents, speculative risks",
            6: "Excellent - destroys enemies, good health, service success",
            7: "Mangal Dosha - marriage delays/conflicts, passionate spouse",
            8: "Accidents, surgery, inheritance through conflict, occult interest",
            9: "Religious warrior, dharmic courage, foreign travels",
            10: "Military/police career, engineering, sports excellence",
            11: "Gains through courage, influential brothers, achievement of goals",
            12: "Expenses on property, foreign residence, hidden enemies"
        },
        "karmic_lessons": [
            "Channeling aggression constructively",
            "Developing patience alongside courage",
            "Protecting the weak, not dominating",
            "Healing warrior karma from past lives"
        ],
        "past_life_indicators": {
            "strong_mars": "Past life as warrior, soldier, surgeon, or athlete",
            "weak_mars": "Cowardice or violence in past life",
            "afflicted_mars": "Bloodshed or property disputes in past life"
        }
    },

    "Mercury": {
        "sanskrit_name": "Budha (बुध)",
        "nature": "Rajasic, Intellectual, Adaptable",
        "represents": ["Intelligence", "Communication", "Business", "Education", "Siblings", "Skin", "Nervous system"],
        "karaka_for": ["4th House (Education)", "10th House (Business)"],
        "exaltation": {"sign": "Virgo", "degree": 15, "effects": "Brilliant analysis, business success, communication mastery"},
        "debilitation": {"sign": "Pisces", "degree": 15, "effects": "Confused thinking, deception, learning difficulties"},
        "own_signs": ["Gemini", "Virgo"],
        "friendly_planets": ["Sun", "Venus"],
        "enemy_planets": ["Moon"],
        "neutral_planets": ["Mars", "Jupiter", "Saturn"],
        "gemstone": {"name": "Emerald (Panna)", "weight": "3-5 carats", "metal": "Gold", "finger": "Little finger", "day": "Wednesday"},
        "mantra": {
            "vedic": "Om Braam Breem Braum Sah Budhaya Namah",
            "tantric": "Om Bum Budhaya Namah",
            "count": 9000,
            "day": "Wednesday morning"
        },
        "charitable_acts": ["Donate green vegetables", "Donate green cloth", "Donate books", "Feed students", "Support education"],
        "fasting_day": "Wednesday",
        "house_effects": {
            1: "Intelligent, youthful appearance, good communication, versatile",
            2: "Wealth through intellect, sweet speech, good education",
            3: "Excellent - writing skills, successful siblings, good communication",
            4: "Education emphasis, intellectual mother, property through business",
            5: "Intelligent children, speculative gains through analysis",
            6: "Victory through intellect, nervous disorders possible, service success",
            7: "Communicative spouse, business partnerships, youthful partner",
            8: "Research abilities, occult interest, inheritance through documents",
            9: "Higher education, publishing, religious scholarship",
            10: "Business career, communication industry, versatile profession",
            11: "Gains through intellect, networking abilities, business profits",
            12: "Foreign education, expenses on learning, spiritual intellect"
        },
        "karmic_lessons": [
            "Using intellect for truth, not manipulation",
            "Developing depth alongside breadth",
            "Honest communication",
            "Balancing logic with intuition"
        ],
        "past_life_indicators": {
            "strong_mercury": "Past life as scholar, merchant, writer, or diplomat",
            "weak_mercury": "Intellectual dishonesty in past life",
            "afflicted_mercury": "Deception or fraud in past life"
        }
    },

    "Jupiter": {
        "sanskrit_name": "Guru/Brihaspati (गुरु/बृहस्पति)",
        "nature": "Sattvic, Benevolent, Expansive",
        "represents": ["Wisdom", "Teacher", "Children", "Wealth", "Dharma", "Husband (for women)", "Liver"],
        "karaka_for": ["2nd House (Wealth)", "5th House (Children)", "9th House (Dharma)", "11th House (Gains)"],
        "exaltation": {"sign": "Cancer", "degree": 5, "effects": "Maximum wisdom, wealth, spiritual blessings"},
        "debilitation": {"sign": "Capricorn", "degree": 5, "effects": "Materialistic, lack of faith, teacher issues"},
        "own_signs": ["Sagittarius", "Pisces"],
        "friendly_planets": ["Sun", "Moon", "Mars"],
        "enemy_planets": ["Mercury", "Venus"],
        "neutral_planets": ["Saturn"],
        "gemstone": {"name": "Yellow Sapphire (Pukhraj)", "weight": "5-7 carats", "metal": "Gold", "finger": "Index finger", "day": "Thursday"},
        "mantra": {
            "vedic": "Om Graam Greem Graum Sah Gurave Namah",
            "tantric": "Om Brim Brihaspataye Namah",
            "count": 19000,
            "day": "Thursday morning"
        },
        "charitable_acts": ["Donate turmeric", "Donate yellow cloth", "Donate gold", "Feed Brahmins", "Support teachers"],
        "fasting_day": "Thursday",
        "special_yogas": {
            "Hamsa_Yoga": {
                "condition": "Jupiter in Kendra in own/exaltation sign",
                "effects": "Wisdom, wealth, spiritual authority, respected personality"
            },
            "Gajakesari_Yoga": {
                "condition": "Jupiter and Moon in mutual Kendras",
                "effects": "Fame, wisdom, wealth, eloquence"
            }
        },
        "house_effects": {
            1: "Wise personality, optimistic, healthy, respected",
            2: "Wealthy family, truthful speech, good education",
            3: "Dharmic courage, religious siblings, sacred travels",
            4: "Property blessed, wise mother, vehicles, happiness",
            5: "Excellent - wise children, creativity, past life merit",
            6: "Victory through dharma, but possible liver issues",
            7: "Wise spouse, dharmic marriage, respected partnerships",
            8: "Long life, inheritance, mystical knowledge",
            9: "Most auspicious - fortune, dharma, father blessed, guru yoga",
            10: "Teaching career, respected profession, counseling success",
            11: "Gains through wisdom, noble friends, all desires fulfilled",
            12: "Spiritual liberation, foreign wealth, divine grace"
        },
        "karmic_lessons": [
            "Teaching with humility",
            "Expanding consciousness beyond materialism",
            "Dharmic wealth accumulation",
            "Guiding without imposing"
        ],
        "past_life_indicators": {
            "strong_jupiter": "Past life as priest, teacher, judge, or counselor",
            "weak_jupiter": "Religious hypocrisy in past life",
            "afflicted_jupiter": "Misuse of spiritual authority in past life"
        }
    },

    "Venus": {
        "sanskrit_name": "Shukra (शुक्र)",
        "nature": "Rajasic, Artistic, Sensual",
        "represents": ["Love", "Beauty", "Art", "Wife (for men)", "Luxury", "Vehicles", "Reproductive organs"],
        "karaka_for": ["7th House (Marriage)", "4th House (Vehicles/Comfort)"],
        "exaltation": {"sign": "Pisces", "degree": 27, "effects": "Divine love, artistic genius, spiritual beauty"},
        "debilitation": {"sign": "Virgo", "degree": 27, "effects": "Critical in love, health issues, relationship problems"},
        "own_signs": ["Taurus", "Libra"],
        "friendly_planets": ["Mercury", "Saturn"],
        "enemy_planets": ["Sun", "Moon"],
        "neutral_planets": ["Mars", "Jupiter"],
        "gemstone": {"name": "Diamond (Heera)", "weight": "0.5-1.5 carats", "metal": "Platinum/Gold", "finger": "Ring finger", "day": "Friday"},
        "mantra": {
            "vedic": "Om Draam Dreem Draum Sah Shukraya Namah",
            "tantric": "Om Shum Shukraya Namah",
            "count": 16000,
            "day": "Friday morning"
        },
        "charitable_acts": ["Donate white items", "Donate perfumes", "Donate silk", "Feed young women", "Support artists"],
        "fasting_day": "Friday",
        "special_yogas": {
            "Malavya_Yoga": {
                "condition": "Venus in Kendra in own/exaltation sign",
                "effects": "Beauty, luxury, artistic success, happy marriage"
            }
        },
        "house_effects": {
            1: "Beautiful appearance, artistic, charming, luxury-loving",
            2: "Wealth through beauty/art, sweet speech, family harmony",
            3: "Artistic skills, harmonious siblings, creative courage",
            4: "Luxury vehicles, beautiful home, happy mother",
            5: "Romantic nature, beautiful children, creative arts",
            6: "Service through beauty, possible reproductive issues",
            7: "Excellent - beautiful spouse, harmonious marriage, partnerships",
            8: "Gains through spouse, occult interest, longevity of spouse",
            9: "Artistic dharma, beautiful wife, love of travel",
            10: "Arts/beauty career, luxury goods business, entertainment",
            11: "Gains through art, beautiful friends, fulfilled desires",
            12: "Bedroom pleasures, foreign romance, spiritual arts"
        },
        "karmic_lessons": [
            "Love without attachment",
            "Beauty as spiritual expression",
            "Balancing pleasure with discipline",
            "Transforming desire into devotion"
        ],
        "past_life_indicators": {
            "strong_venus": "Past life as artist, musician, courtesan, or diplomat",
            "weak_venus": "Unfulfilled romantic karma",
            "afflicted_venus": "Misuse of beauty or relationships in past life"
        }
    },

    "Saturn": {
        "sanskrit_name": "Shani (शनि)",
        "nature": "Tamasic, Restrictive, Karmic Teacher",
        "represents": ["Karma", "Discipline", "Longevity", "Servants", "Old age", "Chronic illness", "Justice"],
        "karaka_for": ["6th House (Service)", "8th House (Longevity)", "10th House (Career)", "12th House (Liberation)"],
        "exaltation": {"sign": "Libra", "degree": 20, "effects": "Just authority, balanced karma, business success"},
        "debilitation": {"sign": "Aries", "degree": 20, "effects": "Frustrated ambition, impulsive karma, authority conflicts"},
        "own_signs": ["Capricorn", "Aquarius"],
        "friendly_planets": ["Mercury", "Venus"],
        "enemy_planets": ["Sun", "Moon", "Mars"],
        "neutral_planets": ["Jupiter"],
        "gemstone": {"name": "Blue Sapphire (Neelam)", "weight": "5-7 carats", "metal": "Silver/Iron", "finger": "Middle finger", "day": "Saturday",
                    "warning": "MUST be tested for 3-7 days before permanent wearing"},
        "mantra": {
            "vedic": "Om Praam Preem Praum Sah Shanaischaraya Namah",
            "tantric": "Om Sham Shanaishcharaya Namah",
            "count": 23000,
            "day": "Saturday evening"
        },
        "charitable_acts": ["Donate black sesame", "Donate iron", "Donate black cloth", "Feed disabled/elderly", "Serve workers"],
        "fasting_day": "Saturday",
        "sade_sati": {
            "description": "7.5 years of Saturn transiting over Moon sign",
            "phases": [
                {"phase": 1, "sign": "12th from Moon", "effects": "Expenses, mental stress, travel"},
                {"phase": 2, "sign": "Over Moon", "effects": "Peak challenges, health, career tests"},
                {"phase": 3, "sign": "2nd from Moon", "effects": "Family issues, financial stress"}
            ],
            "remedies": [
                "Shani Stotra recitation",
                "Hanuman Chalisa on Saturdays",
                "Black sesame donation",
                "Service to elderly and disabled",
                "Iron or blue sapphire (after testing)"
            ]
        },
        "house_effects": {
            1: "Serious personality, delayed success, longevity, hard worker",
            2: "Delayed wealth, harsh speech, family responsibilities",
            3: "Excellent - courage through patience, younger sibling challenges",
            4: "Property delays, mother's health issues, late life happiness",
            5: "Delayed children, disciplined creativity, past life karma",
            6: "Excellent - destroys enemies, chronic health then victory",
            7: "Delayed marriage, older spouse, mature relationships",
            8: "Long life, occult interest, hidden wealth, transformations",
            9: "Dharma through hardship, delayed luck, disciplined spirituality",
            10: "Excellent - slow but steady career rise, lasting success",
            11: "Delayed gains, few but loyal friends, elder sibling issues",
            12: "Foreign residence, spiritual liberation, expenses on health"
        },
        "karmic_lessons": [
            "Patience and perseverance",
            "Accepting responsibility for past karma",
            "Service without expectation",
            "Discipline as path to freedom"
        ],
        "past_life_indicators": {
            "strong_saturn": "Past life as servant, laborer, judge, or ascetic",
            "weak_saturn": "Shirked responsibilities in past life",
            "afflicted_saturn": "Cruelty to workers or elderly in past life"
        }
    },

    "Rahu": {
        "sanskrit_name": "Rahu (राहु)",
        "nature": "Tamasic, Obsessive, Materialistic",
        "represents": ["Desires", "Obsession", "Foreign", "Technology", "Unconventional", "Illusion", "Paternal grandfather"],
        "karaka_for": ["Foreign lands", "Technology", "Worldly desires", "Unconventional paths"],
        "exaltation": {"sign": "Taurus/Gemini (disputed)", "effects": "Material success, technological prowess"},
        "debilitation": {"sign": "Scorpio/Sagittarius (disputed)", "effects": "Spiritual crisis, identity confusion"},
        "own_signs": ["Aquarius (some traditions)"],
        "friendly_planets": ["Venus", "Saturn"],
        "enemy_planets": ["Sun", "Moon", "Mars"],
        "neutral_planets": ["Mercury", "Jupiter"],
        "gemstone": {"name": "Hessonite (Gomed)", "weight": "5-7 carats", "metal": "Silver", "finger": "Middle finger", "day": "Saturday"},
        "mantra": {
            "vedic": "Om Bhram Bhreem Bhraum Sah Rahave Namah",
            "tantric": "Om Raam Rahave Namah",
            "count": 18000,
            "day": "Saturday or Wednesday"
        },
        "charitable_acts": ["Donate blue/black cloth", "Donate blankets", "Feed outcasts", "Support foreigners"],
        "special_effects": {
            "kala_sarpa_yoga": {
                "condition": "All planets between Rahu and Ketu",
                "effects": "Life struggles, sudden changes, spiritual potential",
                "remedies": ["Kala Sarpa Shanti Puja", "Naga Puja", "Feeding snakes (milk)"]
            }
        },
        "house_effects": {
            1: "Unconventional personality, foreign appearance, magnetic presence",
            2: "Wealth through unconventional means, harsh speech, foreign family",
            3: "Bold communication, foreign siblings, media success",
            4: "Foreign property, unconventional mother, restless home life",
            5: "Unconventional children, speculative gains, foreign romance",
            6: "Victory over enemies, service to foreigners, unusual diseases",
            7: "Foreign spouse, unconventional marriage, multiple relationships",
            8: "Sudden inheritance, occult mastery, transformative experiences",
            9: "Foreign religion, unconventional beliefs, grandfather karma",
            10: "Fame in foreign lands, unconventional career, technology success",
            11: "Gains through foreign sources, unconventional friends, fulfilled desires",
            12: "Foreign residence, spiritual confusion then awakening, hidden enemies"
        },
        "karmic_lessons": [
            "Mastering worldly desires before transcending them",
            "Learning through obsession and eventual detachment",
            "Integrating foreign/unusual experiences",
            "Transforming material ambition into spiritual growth"
        ],
        "past_life_indicators": {
            "strong_rahu": "New soul with intense worldly desires to experience",
            "weak_rahu": "Unfulfilled worldly ambitions from past life",
            "afflicted_rahu": "Manipulation or deception in past life"
        }
    },

    "Ketu": {
        "sanskrit_name": "Ketu (केतु)",
        "nature": "Tamasic (but spiritualizing), Detaching, Liberating",
        "represents": ["Liberation", "Past lives", "Spiritual insight", "Detachment", "Maternal grandfather", "Occult"],
        "karaka_for": ["Moksha", "Past life karma", "Spiritual liberation"],
        "exaltation": {"sign": "Scorpio/Sagittarius (disputed)", "effects": "Spiritual mastery, occult powers"},
        "debilitation": {"sign": "Taurus/Gemini (disputed)", "effects": "Material confusion, lack of grounding"},
        "own_signs": ["Scorpio (some traditions)"],
        "friendly_planets": ["Mars", "Jupiter"],
        "enemy_planets": ["Sun", "Moon"],
        "neutral_planets": ["Mercury", "Venus", "Saturn"],
        "gemstone": {"name": "Cat's Eye (Lehsunia)", "weight": "5-7 carats", "metal": "Silver", "finger": "Ring finger", "day": "Thursday"},
        "mantra": {
            "vedic": "Om Sraam Sreem Sraum Sah Ketave Namah",
            "tantric": "Om Kem Ketave Namah",
            "count": 17000,
            "day": "Thursday or Tuesday"
        },
        "charitable_acts": ["Donate multi-colored blankets", "Feed dogs", "Support spiritual seekers", "Donate to ashrams"],
        "house_effects": {
            1: "Spiritual personality, past life mastery, identity confusion then clarity",
            2: "Detachment from wealth, cryptic speech, family karma",
            3: "Natural courage, spiritual siblings, detachment from communication",
            4: "Detachment from home, spiritual mother, inner peace",
            5: "Past life children karma, spiritual creativity, detached romance",
            6: "Natural immunity, victory without effort, service karma",
            7: "Spiritual spouse, detachment in marriage, karmic relationships",
            8: "Excellent - occult mastery, fearlessness, transformation",
            9: "Past life spiritual merit, natural wisdom, detached from religion",
            10: "Detachment from career, spiritual profession, unusual success",
            11: "Fulfilled through detachment, spiritual friends, minimal desires",
            12: "Excellent - liberation, enlightenment potential, past life mastery"
        },
        "karmic_lessons": [
            "Releasing attachment to past patterns",
            "Developing new skills (Rahu axis)",
            "Spiritual wisdom through letting go",
            "Completing karmic cycles"
        ],
        "past_life_indicators": {
            "strong_ketu": "Advanced spiritual soul, past life yogic practices",
            "weak_ketu": "Incomplete spiritual development in past life",
            "afflicted_ketu": "Spiritual pride or misuse of occult in past life"
        }
    }
}

# =============================================================================
# HOUSE (BHAVA) WISDOM DATABASE
# =============================================================================

HOUSE_WISDOM = {
    1: {
        "name": "Lagna (Ascendant)",
        "sanskrit": "तनु भाव (Tanu Bhava)",
        "signifies": ["Self", "Body", "Personality", "Health", "Beginning of life", "General prosperity"],
        "karaka": "Sun",
        "body_parts": ["Head", "Brain", "Face"],
        "directions": "East",
        "element_association": "Beginning of matter",
        "bhrigu_principles": [
            "The Lagna lord's placement determines the soul's primary focus in this life",
            "Benefics in Lagna bless the native with good fortune from birth",
            "Malefics in Lagna create struggles but also inner strength",
            "The Lagna represents the moment of incarnation - the soul's entry point"
        ],
        "past_life_connection": "The Lagna shows what the soul needs to develop in this life, based on past life achievements and lacks"
    },
    2: {
        "name": "Dhana Bhava",
        "sanskrit": "धन भाव",
        "signifies": ["Wealth", "Family", "Speech", "Food", "Right eye", "Face", "Death"],
        "karaka": "Jupiter",
        "body_parts": ["Face", "Right eye", "Teeth", "Tongue", "Throat"],
        "bhrigu_principles": [
            "The 2nd house reveals accumulated family karma and inherited wealth patterns",
            "Speech patterns indicate past life communication karma",
            "Strong 2nd house indicates wealth accumulated through past life generosity",
            "Afflicted 2nd house shows past life misuse of resources"
        ],
        "past_life_connection": "Family wealth and speech patterns often carry forward from past lives"
    },
    3: {
        "name": "Sahaja Bhava",
        "sanskrit": "सहज भाव",
        "signifies": ["Courage", "Siblings", "Short journeys", "Communication", "Hands", "Arts"],
        "karaka": "Mars",
        "body_parts": ["Shoulders", "Arms", "Hands", "Ears", "Nervous system"],
        "bhrigu_principles": [
            "Courage in this life reflects warrior karma from past lives",
            "Sibling relationships often continue from past life connections",
            "Strong 3rd house indicates past life development of skills and talents",
            "Mars in 3rd is considered its best placement for courage"
        ],
        "past_life_connection": "Skills, talents, and sibling bonds often carry forward across incarnations"
    },
    4: {
        "name": "Sukha Bhava",
        "sanskrit": "सुख भाव",
        "signifies": ["Mother", "Home", "Property", "Vehicles", "Inner peace", "Education", "Heart"],
        "karaka": "Moon",
        "body_parts": ["Chest", "Heart", "Lungs", "Breasts"],
        "bhrigu_principles": [
            "The 4th house represents the soul's emotional foundation",
            "Mother's influence reflects past life maternal karma",
            "Property ownership relates to past life generosity with shelter",
            "Inner peace comes from resolved 4th house karma"
        ],
        "past_life_connection": "Relationship with mother and sense of security often continue from past life patterns"
    },
    5: {
        "name": "Putra Bhava",
        "sanskrit": "पुत्र भाव",
        "signifies": ["Children", "Creativity", "Intelligence", "Romance", "Past life merit", "Speculation"],
        "karaka": "Jupiter",
        "body_parts": ["Stomach", "Upper abdomen", "Spine"],
        "bhrigu_principles": [
            "The 5th house is the house of Poorva Punya - past life merit",
            "Children are souls with whom we have karmic connections",
            "Creative abilities indicate past life development of talents",
            "Strong 5th house shows accumulated spiritual merit",
            "The 5th house reveals what we've earned through past life good deeds"
        ],
        "past_life_connection": "This is the primary house for understanding past life accumulated karma (both good and challenging)"
    },
    6: {
        "name": "Ripu Bhava",
        "sanskrit": "रिपु भाव (शत्रु भाव)",
        "signifies": ["Enemies", "Diseases", "Debts", "Service", "Obstacles", "Maternal uncle"],
        "karaka": "Mars/Saturn",
        "body_parts": ["Intestines", "Lower abdomen", "Kidneys"],
        "bhrigu_principles": [
            "Enemies in this life are often souls from past life conflicts",
            "Diseases can indicate past life karma requiring physical purification",
            "Service attitude helps resolve 6th house karma",
            "Malefics in 6th actually destroy enemies and diseases"
        ],
        "past_life_connection": "Conflicts and health patterns often have roots in past life actions"
    },
    7: {
        "name": "Kalatra Bhava",
        "sanskrit": "कलत्र भाव",
        "signifies": ["Spouse", "Marriage", "Partnerships", "Business", "Foreign travel", "Death"],
        "karaka": "Venus",
        "body_parts": ["Lower back", "Kidneys", "Reproductive organs"],
        "bhrigu_principles": [
            "Marriage partners are souls with deep past life connections",
            "The 7th house shows what we seek in others that we lack in ourselves",
            "Partnership patterns repeat until karmic lessons are learned",
            "The 7th house is also a maraka (death-inflicting) house"
        ],
        "past_life_connection": "Spouses and partners are almost always souls we've known in past lives"
    },
    8: {
        "name": "Ayur Bhava",
        "sanskrit": "आयुर भाव",
        "signifies": ["Longevity", "Death", "Transformation", "Occult", "Inheritance", "Sudden events"],
        "karaka": "Saturn",
        "body_parts": ["Reproductive organs", "Excretory organs", "Chronic diseases"],
        "bhrigu_principles": [
            "The 8th house holds the deepest karmic secrets",
            "Longevity is determined by past life prana accumulation",
            "Sudden events are often karmic in nature",
            "Occult abilities indicate past life spiritual practices",
            "Inheritance shows past life family karma"
        ],
        "past_life_connection": "Death circumstances and transformative experiences often mirror past life patterns"
    },
    9: {
        "name": "Dharma Bhava",
        "sanskrit": "धर्म भाव",
        "signifies": ["Father", "Guru", "Fortune", "Religion", "Higher education", "Long journeys"],
        "karaka": "Jupiter/Sun",
        "body_parts": ["Thighs", "Hips"],
        "bhrigu_principles": [
            "The 9th house represents accumulated dharmic merit",
            "Father's influence shows patriarchal karma",
            "Strong 9th house indicates past life religious practices",
            "This is the house of divine grace and blessings",
            "Guru connections from past lives activate in this house"
        ],
        "past_life_connection": "Religious and spiritual development from past lives manifests through this house"
    },
    10: {
        "name": "Karma Bhava",
        "sanskrit": "कर्म भाव",
        "signifies": ["Career", "Status", "Authority", "Father's status", "Government", "Actions"],
        "karaka": "Sun/Saturn/Mercury",
        "body_parts": ["Knees", "Joints"],
        "bhrigu_principles": [
            "The 10th house shows the soul's worldly mission",
            "Career patterns often continue from past lives",
            "Authority in this life relates to past life leadership karma",
            "Strong 10th house indicates important worldly purpose",
            "This is the highest visible point - representing public karma"
        ],
        "past_life_connection": "Professional abilities and status often carry forward from past life achievements"
    },
    11: {
        "name": "Labha Bhava",
        "sanskrit": "लाभ भाव",
        "signifies": ["Gains", "Income", "Friends", "Elder siblings", "Desires fulfilled", "Social networks"],
        "karaka": "Jupiter",
        "body_parts": ["Left ear", "Ankles", "Calves"],
        "bhrigu_principles": [
            "The 11th house shows rewards of past life good karma",
            "Gains come through the network of souls we've helped before",
            "Elder siblings often have past life connections",
            "Desires fulfilled here were earned through past merit",
            "Jupiter in 11th fulfills all legitimate desires"
        ],
        "past_life_connection": "Friends and supportive networks often consist of souls we've helped in past lives"
    },
    12: {
        "name": "Vyaya Bhava",
        "sanskrit": "व्यय भाव",
        "signifies": ["Liberation", "Losses", "Foreign lands", "Spirituality", "Bed pleasures", "Isolation"],
        "karaka": "Saturn/Ketu",
        "body_parts": ["Feet", "Left eye"],
        "bhrigu_principles": [
            "The 12th house is the gateway to moksha (liberation)",
            "Losses in this life are often karmic settlements",
            "Foreign residence indicates past life foreign karma",
            "Strong 12th house indicates spiritual maturity from past lives",
            "This house shows how the soul will exit this incarnation"
        ],
        "past_life_connection": "Spiritual development and liberation potential are revealed here"
    }
}

# =============================================================================
# YOGA (PLANETARY COMBINATIONS) DATABASE
# =============================================================================

YOGA_DATABASE = {
    "mahapurusha_yogas": {
        "Hamsa_Yoga": {
            "planet": "Jupiter",
            "condition": "Jupiter in Kendra (1, 4, 7, 10) in own sign (Sagittarius/Pisces) or exaltation (Cancer)",
            "effects": "Wisdom, wealth, righteousness, respected personality, long life, spiritual authority",
            "past_life": "Soul was a priest, teacher, or spiritual guide in past lives",
            "rarity": "Rare and highly auspicious"
        },
        "Malavya_Yoga": {
            "planet": "Venus",
            "condition": "Venus in Kendra in own sign (Taurus/Libra) or exaltation (Pisces)",
            "effects": "Beauty, luxury, artistic success, happy marriage, sensual pleasures",
            "past_life": "Soul was an artist, musician, or refined personality in past lives",
            "rarity": "Rare and auspicious for material comforts"
        },
        "Ruchaka_Yoga": {
            "planet": "Mars",
            "condition": "Mars in Kendra in own sign (Aries/Scorpio) or exaltation (Capricorn)",
            "effects": "Courage, leadership, military success, commander-like personality",
            "past_life": "Soul was a warrior, commander, or protector in past lives",
            "rarity": "Rare and powerful for action-oriented success"
        },
        "Bhadra_Yoga": {
            "planet": "Mercury",
            "condition": "Mercury in Kendra in own sign (Gemini/Virgo) or exaltation (Virgo)",
            "effects": "Intelligence, eloquence, business success, scholarly achievements",
            "past_life": "Soul was a scholar, merchant, or intellectual in past lives",
            "rarity": "Rare and excellent for intellectual pursuits"
        },
        "Sasa_Yoga": {
            "planet": "Saturn",
            "condition": "Saturn in Kendra in own sign (Capricorn/Aquarius) or exaltation (Libra)",
            "effects": "Authority, discipline, leadership through hard work, political success",
            "past_life": "Soul learned discipline and service through many incarnations",
            "rarity": "Rare and powerful for sustained success"
        }
    },

    "raja_yogas": {
        "Dharma_Karmadhipati_Yoga": {
            "condition": "Lords of 9th and 10th houses conjunct or mutually aspect",
            "effects": "High status, authority, fortune through career, leadership",
            "strength": "Strongest Raja Yoga"
        },
        "Lakshmi_Yoga": {
            "condition": "Lord of 9th strong and Venus in own/exaltation sign in Kendra/Trikona",
            "effects": "Wealth, beauty, prosperity, divine grace",
            "strength": "Powerful for wealth and fortune"
        },
        "Gajakesari_Yoga": {
            "condition": "Jupiter and Moon in mutual Kendras (1, 4, 7, 10 from each other)",
            "effects": "Fame, wisdom, wealth, eloquence, respected in society",
            "strength": "Very auspicious and commonly sought"
        },
        "Pancha_Mahapurusha_Yoga": {
            "condition": "Any of the five Mahapurusha Yogas present",
            "effects": "Exceptional personality, success in relevant domain",
            "strength": "Life-defining yoga"
        }
    },

    "dhana_yogas": {
        "Basic_Dhana_Yoga": {
            "condition": "Lords of 2nd and 11th conjunct or mutually aspect",
            "effects": "Wealth accumulation from multiple sources",
            "strength": "Foundation for financial prosperity"
        },
        "Lakshmi_Narayana_Yoga": {
            "condition": "Lords of 9th and 10th in Parivartana (exchange)",
            "effects": "Wealth through righteous career, sustained prosperity",
            "strength": "Combines fortune with action"
        },
        "Chandra_Mangal_Yoga": {
            "condition": "Moon and Mars conjunct",
            "effects": "Wealth through business, real estate, or courage",
            "strength": "Good for property and business"
        }
    },

    "spiritual_yogas": {
        "Pravrajya_Yoga": {
            "condition": "Four or more planets in one house without Raja Yoga",
            "effects": "Renunciation, spiritual life, detachment from material",
            "significance": "Soul is ready for spiritual advancement"
        },
        "Moksha_Yoga": {
            "condition": "Jupiter, Ketu in 12th or strong 12th lord with spiritual aspects",
            "effects": "Liberation potential, spiritual wisdom, detachment",
            "significance": "Soul approaching final incarnations"
        },
        "Saraswati_Yoga": {
            "condition": "Jupiter, Venus, Mercury in Kendras/Trikonas together",
            "effects": "Wisdom, learning, artistic and scholarly excellence",
            "significance": "Blessed with divine knowledge"
        }
    },

    "dosha_yogas": {
        "Kuja_Dosha": {
            "condition": "Mars in 1, 2, 4, 7, 8, or 12 from Lagna/Moon/Venus",
            "effects": "Marriage delays, spouse health issues, relationship conflicts",
            "remedies": ["Mangal Shanti", "Kumbh Vivah", "Hanuman worship"],
            "cancellation": "Mars in own/exaltation sign, aspected by benefics, or both partners have dosha"
        },
        "Kala_Sarpa_Dosha": {
            "condition": "All planets hemmed between Rahu and Ketu",
            "effects": "Life struggles, sudden changes, obstacles then spiritual growth",
            "remedies": ["Kala Sarpa Shanti", "Naga Puja", "Rahu-Ketu mantra"],
            "types": 12  # 12 types based on Rahu-Ketu axis
        },
        "Pitru_Dosha": {
            "condition": "Sun afflicted by Rahu/Ketu, weak 9th house, or Saturn affecting Sun",
            "effects": "Father issues, ancestral karma, obstacles from elders",
            "remedies": ["Pitru Tarpan", "Shradh rituals", "Sun mantras"],
            "significance": "Unresolved ancestral karma"
        },
        "Grahan_Dosha": {
            "condition": "Sun or Moon within 12 degrees of Rahu or Ketu",
            "effects": "Identity/emotional confusion, eclipse-born karma",
            "remedies": ["Grahan Shanti", "Specific planet mantras"],
            "significance": "Born during or near eclipse"
        }
    }
}

# =============================================================================
# DASHA (PLANETARY PERIOD) WISDOM
# =============================================================================

DASHA_WISDOM = {
    "vimshottari": {
        "total_years": 120,
        "description": "The 120-year cycle of planetary periods based on Moon's nakshatra at birth",
        "planets": {
            "Ketu": {"years": 7, "keywords": ["Detachment", "Spiritual insights", "Past life patterns emerge"]},
            "Venus": {"years": 20, "keywords": ["Relationships", "Luxury", "Artistic expression", "Material comforts"]},
            "Sun": {"years": 6, "keywords": ["Authority", "Father", "Government", "Health focus"]},
            "Moon": {"years": 10, "keywords": ["Emotions", "Mother", "Public life", "Mental development"]},
            "Mars": {"years": 7, "keywords": ["Energy", "Property", "Courage", "Conflicts"]},
            "Rahu": {"years": 18, "keywords": ["Worldly desires", "Foreign connections", "Unconventional experiences"]},
            "Jupiter": {"years": 16, "keywords": ["Wisdom", "Expansion", "Children", "Spiritual growth"]},
            "Saturn": {"years": 19, "keywords": ["Karma", "Discipline", "Hardship", "Lasting achievements"]},
            "Mercury": {"years": 17, "keywords": ["Intellect", "Business", "Communication", "Learning"]}
        }
    },
    "interpretation_principles": [
        "The Dasha lord's natal position determines the quality of the period",
        "Dasha of Yogakaraka planets brings excellent results",
        "Dasha of malefics for the Lagna can bring challenges",
        "Antardasha (sub-period) modifies the main Dasha effects",
        "Transit of Dasha lord during its period is especially important"
    ]
}

# =============================================================================
# REMEDIAL MEASURES DATABASE
# =============================================================================

REMEDIAL_WISDOM = {
    "principles": [
        "Remedies work by balancing karmic energies, not avoiding karma",
        "Mantra, Dana (charity), and Upasana (worship) are the three pillars",
        "Remedies should be performed with faith and proper guidance",
        "The best remedy is righteous living (Dharma)",
        "Remedies amplify positive karma and reduce intensity of negative karma"
    ],

    "gemstone_therapy": {
        "general_rules": [
            "Wear gemstone of benefic planets for your Lagna",
            "Never wear enemy planet gemstones together",
            "Gemstones should be natural, unheated, and of minimum weight",
            "Purification and energization (prana pratishtha) is essential",
            "Blue Sapphire requires testing period before permanent wearing"
        ],
        "weights": {
            "minimum": {"Ruby": 3, "Pearl": 5, "Coral": 6, "Emerald": 3, "Yellow_Sapphire": 5,
                       "Diamond": 0.5, "Blue_Sapphire": 5, "Hessonite": 5, "Cats_Eye": 5},
            "recommended": {"Ruby": 5, "Pearl": 7, "Coral": 9, "Emerald": 5, "Yellow_Sapphire": 7,
                           "Diamond": 1, "Blue_Sapphire": 7, "Hessonite": 7, "Cats_Eye": 7}
        }
    },

    "mantra_therapy": {
        "general_rules": [
            "Mantras should be received from a qualified Guru when possible",
            "Proper pronunciation (uccharan) is essential",
            "Regular practice (anushthana) of minimum 40 days recommended",
            "Best chanted during Brahma Muhurta (96 minutes before sunrise)",
            "Mental purity and vegetarian diet enhances effects"
        ],
        "universal_mantras": {
            "Gayatri": {"text": "Om Bhur Bhuva Swaha, Tat Savitur Varenyam, Bhargo Devasya Dhimahi, Dhiyo Yo Nah Prachodayat",
                       "effects": "Spiritual protection, wisdom, purification", "count": 108},
            "Mahamrityunjaya": {"text": "Om Tryambakam Yajamahe Sugandhim Pushtivardhanam, Urvarukamiva Bandhanan Mrityor Mukshiya Maamritat",
                               "effects": "Health, longevity, protection from death", "count": 108}
        }
    },

    "charitable_acts": {
        "principles": [
            "Dana (charity) should be given without expectation of return",
            "Items donated should correspond to the afflicted planet",
            "Best given on the planet's day during appropriate hora",
            "Feeding the hungry is the highest form of charity",
            "Charity to the deserving multiplies the merit"
        ]
    }
}

# =============================================================================
# AI GUIDE RESPONSE TEMPLATES
# =============================================================================

AI_GUIDE_TEMPLATES = {
    "greeting": """Namaste! I am your Bhrigu Samhita AI Guide, drawing wisdom from the ancient texts compiled by Maharishi Bhrigu over 5,000 years ago. I combine this sacred knowledge with Nadi Jyotisha principles to provide you authentic Vedic astrological insights.

How may I illuminate your cosmic journey today?""",

    "general_reading": """Based on the sacred principles of Bhrigu Samhita:

**Your Cosmic Blueprint:**
{cosmic_blueprint}

**Karmic Patterns:**
{karmic_patterns}

**Planetary Influences:**
{planetary_influences}

**Guidance from Ancient Wisdom:**
{guidance}

*This reading draws from authentic Vedic sources. For detailed life predictions, please provide your complete birth details.*""",

    "career_guidance": """**Career Wisdom from Bhrigu Samhita:**

According to the ancient texts, your {ascendant} Ascendant combined with {tenth_house_analysis} indicates:

**Professional Dharma:**
{career_dharma}

**Auspicious Fields:**
{auspicious_careers}

**Timing for Career Growth:**
{career_timing}

**Remedies for Career Enhancement:**
{career_remedies}

*May Brihaspati (Jupiter) bless your professional path.*""",

    "relationship_guidance": """**Relationship Wisdom from Bhrigu Samhita:**

The sacred texts reveal about your relationship karma:

**7th House Analysis:**
{seventh_house}

**Venus Position Effects:**
{venus_analysis}

**Karmic Relationship Patterns:**
{relationship_karma}

**Guidance for Harmonious Relationships:**
{relationship_guidance}

**Remedies:**
{relationship_remedies}

*May Shukra (Venus) bless your relationships with harmony.*""",

    "spiritual_guidance": """**Spiritual Wisdom from Bhrigu Samhita:**

The ancient seers reveal about your spiritual journey:

**Soul's Evolution Stage:**
{soul_stage}

**Past Life Spiritual Merit:**
{past_life_merit}

**Current Spiritual Path:**
{spiritual_path}

**Moksha Indicators:**
{moksha_indicators}

**Recommended Spiritual Practices:**
{spiritual_practices}

*Om Shanti Shanti Shanti*"""
}


# =============================================================================
# MAIN CLASS FOR ACCESSING BHRIGU SAMHITA KNOWLEDGE
# =============================================================================

class BhriguSamhitaKnowledge:
    """
    Main class for accessing Bhrigu Samhita knowledge database
    Used by AI Astrology Guide for generating authentic responses
    """

    def __init__(self):
        self.planetary_wisdom = PLANETARY_CORE_WISDOM
        self.house_wisdom = HOUSE_WISDOM
        self.yoga_database = YOGA_DATABASE
        self.dasha_wisdom = DASHA_WISDOM
        self.remedial_wisdom = REMEDIAL_WISDOM
        self.templates = AI_GUIDE_TEMPLATES

    def get_planetary_wisdom(self, planet: str) -> Dict[str, Any]:
        """Get comprehensive wisdom for a planet"""
        return self.planetary_wisdom.get(planet, {})

    def get_house_wisdom(self, house: int) -> Dict[str, Any]:
        """Get comprehensive wisdom for a house"""
        return self.house_wisdom.get(house, {})

    def get_planet_in_house_interpretation(self, planet: str, house: int) -> str:
        """Get interpretation for planet in house combination"""
        planet_data = self.planetary_wisdom.get(planet, {})
        house_effects = planet_data.get("house_effects", {})
        return house_effects.get(house, f"{planet} in house {house} brings unique influences based on the overall chart.")

    def get_yoga_information(self, yoga_name: str) -> Dict[str, Any]:
        """Get information about a specific yoga"""
        for category, yogas in self.yoga_database.items():
            if yoga_name in yogas:
                return yogas[yoga_name]
        return {}

    def get_remedies_for_planet(self, planet: str) -> Dict[str, Any]:
        """Get remedies for a specific planet"""
        planet_data = self.planetary_wisdom.get(planet, {})
        return {
            "gemstone": planet_data.get("gemstone", {}),
            "mantra": planet_data.get("mantra", {}),
            "charitable_acts": planet_data.get("charitable_acts", []),
            "fasting_day": planet_data.get("fasting_day", "")
        }

    def get_dasha_interpretation(self, planet: str) -> Dict[str, Any]:
        """Get Dasha period interpretation for a planet"""
        return self.dasha_wisdom["vimshottari"]["planets"].get(planet, {})

    def get_karmic_lessons(self, planet: str) -> List[str]:
        """Get karmic lessons associated with a planet"""
        planet_data = self.planetary_wisdom.get(planet, {})
        return planet_data.get("karmic_lessons", [])

    def get_past_life_indicators(self, planet: str, strength: str = "strong") -> str:
        """Get past life indicators for planet based on its strength"""
        planet_data = self.planetary_wisdom.get(planet, {})
        indicators = planet_data.get("past_life_indicators", {})
        return indicators.get(f"{strength}_{planet.lower()}", indicators.get(strength, ""))

    def format_response_for_query(self, query_type: str, context: Dict[str, Any]) -> str:
        """Format a response based on query type and context"""
        template = self.templates.get(query_type, self.templates["general_reading"])
        try:
            return template.format(**context)
        except KeyError:
            return template

    def get_comprehensive_planet_analysis(self, planet: str, house: int, sign: str = None) -> Dict[str, Any]:
        """Get comprehensive analysis for a planet placement"""
        planet_wisdom = self.get_planetary_wisdom(planet)
        house_effect = self.get_planet_in_house_interpretation(planet, house)
        remedies = self.get_remedies_for_planet(planet)
        karmic_lessons = self.get_karmic_lessons(planet)

        return {
            "planet": planet,
            "house": house,
            "sign": sign,
            "nature": planet_wisdom.get("nature", ""),
            "represents": planet_wisdom.get("represents", []),
            "house_effect": house_effect,
            "karmic_lessons": karmic_lessons,
            "remedies": remedies,
            "past_life_connection": planet_wisdom.get("past_life_indicators", {})
        }


# Singleton instance
_bhrigu_samhita_knowledge = None

def get_bhrigu_samhita_knowledge() -> BhriguSamhitaKnowledge:
    """Get or create Bhrigu Samhita Knowledge singleton"""
    global _bhrigu_samhita_knowledge
    if _bhrigu_samhita_knowledge is None:
        _bhrigu_samhita_knowledge = BhriguSamhitaKnowledge()
    return _bhrigu_samhita_knowledge

"""
Nadi Jyotisha Knowledge Database
Comprehensive collection of Nadi astrology principles from Tamil Nadu traditions
Including Nakshatra wisdom, Nadi readings, and precise prediction techniques
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum


class NadiType(Enum):
    """Types of Nadi classifications"""
    VATA = "Vata"
    PITTA = "Pitta"
    KAPHA = "Kapha"


class NakshatraGana(Enum):
    """Nakshatra temperament classifications"""
    DEVA = "Deva (Divine)"
    MANUSHYA = "Manushya (Human)"
    RAKSHASA = "Rakshasa (Demonic)"


class NakshatraTattva(Enum):
    """Nakshatra element classifications"""
    PRITHVI = "Earth"
    JALA = "Water"
    AGNI = "Fire"
    VAYU = "Air"
    AKASHA = "Ether"


# =============================================================================
# COMPLETE NAKSHATRA DATABASE - 27 NAKSHATRAS
# =============================================================================

NAKSHATRA_WISDOM = {
    1: {
        "name": "Ashwini",
        "sanskrit": "अश्विनी",
        "symbol": "Horse's Head",
        "deity": "Ashwini Kumaras (Divine Physicians)",
        "ruling_planet": "Ketu",
        "zodiac_range": "0°00' - 13°20' Aries",
        "gana": NakshatraGana.DEVA,
        "nadi": NadiType.VATA,
        "tattva": NakshatraTattva.PRITHVI,
        "animal_symbol": "Male Horse",
        "bird": "Wild Eagle",
        "tree": "Poison Nut Tree (Strychnos)",
        "sounds": ["Chu", "Che", "Cho", "La"],
        "characteristics": {
            "positive": ["Quick action", "Healing abilities", "Pioneering spirit", "Youthful energy", "Courage"],
            "negative": ["Impatience", "Aggression", "Impulsiveness", "Stubborn nature"],
            "physical": "Athletic build, bright eyes, broad forehead, handsome/beautiful appearance"
        },
        "career_indications": ["Physicians", "Healers", "Horse trainers", "Athletes", "Transport", "Military", "Emergency services"],
        "health_vulnerabilities": ["Head injuries", "Mental stress", "Fevers", "Inflammatory conditions"],
        "relationship_compatibility": {
            "best_match": ["Bharani", "Revati", "Shatabhisha"],
            "avoid": ["Jyeshtha", "Moola"]
        },
        "spiritual_path": "Quick spiritual progress through healing and service",
        "past_life_indicators": "Soul was involved in healing or rapid spiritual advancement",
        "remedies": {
            "deity_worship": "Ashwini Kumaras",
            "mantra": "Om Ashwibhyam Namah",
            "fasting": "Tuesday",
            "charity": "Donate medicines, help the sick"
        },
        "famous_personalities": "Those with natural healing abilities and swift action"
    },

    2: {
        "name": "Bharani",
        "sanskrit": "भरणी",
        "symbol": "Yoni (Female reproductive organ) / Vessel",
        "deity": "Yama (God of Death)",
        "ruling_planet": "Venus",
        "zodiac_range": "13°20' - 26°40' Aries",
        "gana": NakshatraGana.MANUSHYA,
        "nadi": NadiType.PITTA,
        "tattva": NakshatraTattva.PRITHVI,
        "animal_symbol": "Male Elephant",
        "bird": "Crow",
        "tree": "Amla (Indian Gooseberry)",
        "sounds": ["Lee", "Lu", "Le", "Lo"],
        "characteristics": {
            "positive": ["Responsibility", "Nurturing", "Creative fertility", "Transformation", "Endurance"],
            "negative": ["Jealousy", "Possessiveness", "Judgmental", "Struggling with mortality"],
            "physical": "Strong constitution, attractive features, expressive eyes"
        },
        "career_indications": ["Gynecology", "Fertility specialists", "Funeral services", "Psychology", "Art", "Entertainment"],
        "health_vulnerabilities": ["Reproductive issues", "Hormonal imbalances", "Diabetes"],
        "relationship_compatibility": {
            "best_match": ["Ashwini", "Pushya", "Rohini"],
            "avoid": ["Vishakha"]
        },
        "spiritual_path": "Transformation through facing mortality and embracing life cycles",
        "past_life_indicators": "Soul dealt with matters of life, death, and responsibility",
        "remedies": {
            "deity_worship": "Yama Dharmaraja",
            "mantra": "Om Yamaya Namah",
            "fasting": "Friday",
            "charity": "Support orphans, donate food"
        }
    },

    3: {
        "name": "Krittika",
        "sanskrit": "कृत्तिका",
        "symbol": "Flame / Razor / Axe",
        "deity": "Agni (Fire God)",
        "ruling_planet": "Sun",
        "zodiac_range": "26°40' Aries - 10°00' Taurus",
        "gana": NakshatraGana.RAKSHASA,
        "nadi": NadiType.KAPHA,
        "tattva": NakshatraTattva.PRITHVI,
        "animal_symbol": "Female Sheep",
        "bird": "Peacock",
        "tree": "Fig Tree (Cluster Fig)",
        "sounds": ["A", "Ee", "U", "Ae"],
        "characteristics": {
            "positive": ["Purification", "Sharp intellect", "Leadership", "Cutting through obstacles", "Determination"],
            "negative": ["Harsh speech", "Destructive tendencies", "Stubborn", "Critical nature"],
            "physical": "Sharp features, bright appearance, commanding presence"
        },
        "career_indications": ["Military", "Police", "Surgery", "Cooking/Culinary", "Fire services", "Metallurgy"],
        "health_vulnerabilities": ["Fevers", "Inflammations", "Digestive issues", "Accidents with fire/sharp objects"],
        "spiritual_path": "Purification through discipline and burning away impurities",
        "past_life_indicators": "Soul was involved in purification rituals or military action",
        "remedies": {
            "deity_worship": "Agni Deva",
            "mantra": "Om Agnaye Namah",
            "fasting": "Sunday",
            "charity": "Light lamps, feed Brahmins"
        }
    },

    4: {
        "name": "Rohini",
        "sanskrit": "रोहिणी",
        "symbol": "Chariot / Ox Cart / Temple",
        "deity": "Brahma (Creator) / Prajapati",
        "ruling_planet": "Moon",
        "zodiac_range": "10°00' - 23°20' Taurus",
        "gana": NakshatraGana.MANUSHYA,
        "nadi": NadiType.KAPHA,
        "tattva": NakshatraTattva.PRITHVI,
        "animal_symbol": "Male Serpent",
        "bird": "Owl",
        "tree": "Jamun (Java Plum)",
        "sounds": ["O", "Va", "Vi", "Vu"],
        "characteristics": {
            "positive": ["Beauty", "Fertility", "Creativity", "Material abundance", "Artistic talent", "Magnetism"],
            "negative": ["Materialism", "Possessiveness", "Jealousy", "Indulgence", "Stubbornness"],
            "physical": "Very attractive, large expressive eyes, graceful movements, sensuous"
        },
        "career_indications": ["Arts", "Fashion", "Agriculture", "Food industry", "Beauty", "Luxury goods", "Real estate"],
        "health_vulnerabilities": ["Throat issues", "Diabetes", "Weight gain", "Reproductive health"],
        "relationship_compatibility": {
            "best_match": ["Mrigashira", "Uttara Phalguni", "Uttara Bhadrapada"],
            "avoid": ["Vishakha", "Jyeshtha"]
        },
        "spiritual_path": "Finding the divine through beauty and creation",
        "past_life_indicators": "Soul experienced material abundance and artistic expression",
        "remedies": {
            "deity_worship": "Lord Brahma, Krishna (born in Rohini)",
            "mantra": "Om Prajapataye Namah",
            "fasting": "Monday",
            "charity": "Donate white items, feed cows"
        },
        "special_notes": "Lord Krishna's birth nakshatra - considered extremely auspicious"
    },

    5: {
        "name": "Mrigashira",
        "sanskrit": "मृगशिरा",
        "symbol": "Deer's Head",
        "deity": "Soma (Moon God) / Chandra",
        "ruling_planet": "Mars",
        "zodiac_range": "23°20' Taurus - 6°40' Gemini",
        "gana": NakshatraGana.DEVA,
        "nadi": NadiType.PITTA,
        "tattva": NakshatraTattva.PRITHVI,
        "animal_symbol": "Female Serpent",
        "bird": "Hen",
        "tree": "Khadira (Acacia Catechu)",
        "sounds": ["Ve", "Vo", "Ka", "Ke"],
        "characteristics": {
            "positive": ["Searching nature", "Gentle", "Creative", "Sensory enjoyment", "Curiosity", "Romantic"],
            "negative": ["Restlessness", "Fickleness", "Suspicion", "Nervous energy", "Indecision"],
            "physical": "Delicate features, beautiful eyes, graceful, youthful appearance"
        },
        "career_indications": ["Research", "Travel", "Writing", "Fashion", "Music", "Poetry", "Exploration"],
        "health_vulnerabilities": ["Nervous disorders", "Allergies", "Throat problems"],
        "spiritual_path": "Seeking the divine through constant search and exploration",
        "past_life_indicators": "Soul was a seeker, wanderer, or creative artist",
        "remedies": {
            "deity_worship": "Soma/Chandra",
            "mantra": "Om Somaya Namah",
            "fasting": "Monday",
            "charity": "Donate white cloth, rice"
        }
    },

    6: {
        "name": "Ardra",
        "sanskrit": "आर्द्रा",
        "symbol": "Teardrop / Diamond / Human Head",
        "deity": "Rudra (Storm God, form of Shiva)",
        "ruling_planet": "Rahu",
        "zodiac_range": "6°40' - 20°00' Gemini",
        "gana": NakshatraGana.MANUSHYA,
        "nadi": NadiType.VATA,
        "tattva": NakshatraTattva.JALA,
        "animal_symbol": "Female Dog",
        "bird": "Andril",
        "tree": "Long Pepper",
        "sounds": ["Ku", "Gha", "Ng", "Chha"],
        "characteristics": {
            "positive": ["Transformation", "Intellectual depth", "Research ability", "Effort", "Renewal"],
            "negative": ["Destructive tendencies", "Arrogance", "Cruel speech", "Turmoil", "Ingratitude"],
            "physical": "Attractive but with intense eyes, may have curly hair"
        },
        "career_indications": ["Research", "Technology", "Pharmaceuticals", "Butchery", "Surgery", "Investigation"],
        "health_vulnerabilities": ["Respiratory issues", "Heart problems", "Mental stress"],
        "spiritual_path": "Transformation through destruction of ego and renewal",
        "past_life_indicators": "Soul went through major transformations and storms",
        "remedies": {
            "deity_worship": "Lord Rudra/Shiva",
            "mantra": "Om Rudraya Namah",
            "fasting": "Saturday",
            "charity": "Help storm/disaster victims"
        }
    },

    7: {
        "name": "Punarvasu",
        "sanskrit": "पुनर्वसु",
        "symbol": "Bow and Quiver of Arrows / House",
        "deity": "Aditi (Mother of Gods)",
        "ruling_planet": "Jupiter",
        "zodiac_range": "20°00' Gemini - 3°20' Cancer",
        "gana": NakshatraGana.DEVA,
        "nadi": NadiType.VATA,
        "tattva": NakshatraTattva.JALA,
        "animal_symbol": "Female Cat",
        "bird": "Swan",
        "tree": "Bamboo",
        "sounds": ["Ke", "Ko", "Ha", "Hi"],
        "characteristics": {
            "positive": ["Renewal", "Return to source", "Nurturing", "Wisdom", "Philosophical", "Generous"],
            "negative": ["Over-simplification", "Indecision", "Lack of foresight", "Unstable"],
            "physical": "Handsome/beautiful, noble appearance, inspiring presence"
        },
        "career_indications": ["Teaching", "Counseling", "Publishing", "Philosophy", "Hospitality", "Imports"],
        "health_vulnerabilities": ["Digestive issues", "Ear problems", "Lung weakness"],
        "spiritual_path": "Return to divine source and spiritual renewal",
        "past_life_indicators": "Soul experienced cycles of loss and renewal",
        "remedies": {
            "deity_worship": "Goddess Aditi",
            "mantra": "Om Aditaye Namah",
            "fasting": "Thursday",
            "charity": "Support temples, donate yellow items"
        },
        "special_notes": "Lord Rama's birth nakshatra - considered very auspicious for new beginnings"
    },

    8: {
        "name": "Pushya",
        "sanskrit": "पुष्य",
        "symbol": "Cow's Udder / Lotus / Arrow / Circle",
        "deity": "Brihaspati (Jupiter, Guru of Gods)",
        "ruling_planet": "Saturn",
        "zodiac_range": "3°20' - 16°40' Cancer",
        "gana": NakshatraGana.DEVA,
        "nadi": NadiType.PITTA,
        "tattva": NakshatraTattva.JALA,
        "animal_symbol": "Male Sheep/Ram",
        "bird": "Sea Crow",
        "tree": "Peepal (Sacred Fig)",
        "sounds": ["Hu", "He", "Ho", "Da"],
        "characteristics": {
            "positive": ["Nourishment", "Protection", "Spiritual wisdom", "Generosity", "Devotion", "Prosperity"],
            "negative": ["Over-expansion", "Orthodoxy", "Selfishness", "Doubtful nature"],
            "physical": "Round face, calm expression, nurturing appearance"
        },
        "career_indications": ["Clergy", "Counselors", "Food industry", "Dairy", "Teaching", "Politics", "Management"],
        "health_vulnerabilities": ["Skin issues", "Stomach problems", "Respiratory weakness"],
        "spiritual_path": "Highest spiritual development through nourishment and devotion",
        "past_life_indicators": "Soul was a spiritual guide or nourisher of others",
        "remedies": {
            "deity_worship": "Brihaspati (Jupiter)",
            "mantra": "Om Brihaspataye Namah",
            "fasting": "Thursday",
            "charity": "Feed Brahmins, donate to temples"
        },
        "special_notes": "MOST AUSPICIOUS nakshatra - called 'King of Nakshatras'"
    },

    9: {
        "name": "Ashlesha",
        "sanskrit": "आश्लेषा",
        "symbol": "Coiled Serpent",
        "deity": "Nagas (Serpent Deities)",
        "ruling_planet": "Mercury",
        "zodiac_range": "16°40' - 30°00' Cancer",
        "gana": NakshatraGana.RAKSHASA,
        "nadi": NadiType.KAPHA,
        "tattva": NakshatraTattva.JALA,
        "animal_symbol": "Male Cat",
        "bird": "Small Blue Sparrow",
        "tree": "Naga Champa",
        "sounds": ["Di", "Du", "De", "Do"],
        "characteristics": {
            "positive": ["Mystical insight", "Kundalini power", "Penetrating wisdom", "Embrace", "Deep understanding"],
            "negative": ["Deception", "Coldness", "Manipulation", "Poisonous speech", "Ingratitude"],
            "physical": "Penetrating eyes, mysterious appearance, hypnotic gaze"
        },
        "career_indications": ["Occult", "Psychology", "Medicine", "Politics", "Lawyer", "Astrology", "Research"],
        "health_vulnerabilities": ["Nervous disorders", "Joint problems", "Digestive issues", "Poison effects"],
        "spiritual_path": "Kundalini awakening and transformation through serpent energy",
        "past_life_indicators": "Soul dealt with serpent worship or mystic practices",
        "remedies": {
            "deity_worship": "Naga Devatas",
            "mantra": "Om Sarpebhyo Namah",
            "fasting": "Wednesday",
            "charity": "Feed milk to snakes (symbolic), donate to Naga temples"
        }
    },

    10: {
        "name": "Magha",
        "sanskrit": "मघा",
        "symbol": "Royal Throne / Palanquin",
        "deity": "Pitris (Ancestors)",
        "ruling_planet": "Ketu",
        "zodiac_range": "0°00' - 13°20' Leo",
        "gana": NakshatraGana.RAKSHASA,
        "nadi": NadiType.KAPHA,
        "tattva": NakshatraTattva.JALA,
        "animal_symbol": "Male Rat",
        "bird": "Male Eagle",
        "tree": "Banyan",
        "sounds": ["Ma", "Mi", "Mu", "Me"],
        "characteristics": {
            "positive": ["Royal bearing", "Ancestral pride", "Leadership", "Tradition", "Authority", "Power"],
            "negative": ["Arrogance", "Racial/caste pride", "Disdain", "Cruelty", "Disconnection from present"],
            "physical": "Regal appearance, lion-like presence, commanding stature"
        },
        "career_indications": ["Politics", "Administration", "History", "Archaeology", "Museums", "Genealogy", "CEO positions"],
        "health_vulnerabilities": ["Heart problems", "Spinal issues", "Genetic disorders"],
        "spiritual_path": "Honoring ancestors and understanding lineage karma",
        "past_life_indicators": "Soul was royalty or held positions of ancestral authority",
        "remedies": {
            "deity_worship": "Pitris (Ancestors)",
            "mantra": "Om Pitribhyo Namah",
            "fasting": "Amavasya (New Moon)",
            "charity": "Perform Shraddha, donate to ancestors' names"
        }
    },

    11: {
        "name": "Purva Phalguni",
        "sanskrit": "पूर्व फाल्गुनी",
        "symbol": "Front legs of bed / Hammock / Fig Tree",
        "deity": "Bhaga (God of Marital Bliss and Fortune)",
        "ruling_planet": "Venus",
        "zodiac_range": "13°20' - 26°40' Leo",
        "gana": NakshatraGana.MANUSHYA,
        "nadi": NadiType.PITTA,
        "tattva": NakshatraTattva.JALA,
        "animal_symbol": "Female Rat",
        "bird": "Female Eagle",
        "tree": "Palash (Flame of Forest)",
        "sounds": ["Mo", "Ta", "Ti", "Tu"],
        "characteristics": {
            "positive": ["Enjoyment", "Creativity", "Romance", "Relaxation", "Generosity", "Charisma"],
            "negative": ["Vanity", "Indulgence", "Laziness", "Promiscuity", "Carelessness"],
            "physical": "Attractive, sweet-natured appearance, graceful movements"
        },
        "career_indications": ["Entertainment", "Music", "Art", "Luxury goods", "Marriage planning", "Photography"],
        "health_vulnerabilities": ["Heart issues", "Lip/mouth problems", "Reproductive health"],
        "spiritual_path": "Finding divine through beauty, love, and creative expression",
        "past_life_indicators": "Soul experienced luxury, romance, and artistic expression",
        "remedies": {
            "deity_worship": "Bhaga Deva",
            "mantra": "Om Bhagaya Namah",
            "fasting": "Friday",
            "charity": "Support marriages, donate to couples"
        }
    },

    12: {
        "name": "Uttara Phalguni",
        "sanskrit": "उत्तर फाल्गुनी",
        "symbol": "Back legs of bed / Fig Tree",
        "deity": "Aryaman (God of Contracts and Unions)",
        "ruling_planet": "Sun",
        "zodiac_range": "26°40' Leo - 10°00' Virgo",
        "gana": NakshatraGana.MANUSHYA,
        "nadi": NadiType.VATA,
        "tattva": NakshatraTattva.AGNI,
        "animal_symbol": "Male Cow/Bull",
        "bird": "Beetle",
        "tree": "Rose Laurel",
        "sounds": ["Te", "To", "Pa", "Pi"],
        "characteristics": {
            "positive": ["Commitment", "Friendship", "Patronage", "Generosity", "Prosperity", "Reliability"],
            "negative": ["Controlling", "Stubborn", "Excessive pride", "Disdain for lower classes"],
            "physical": "Tall, well-built, attractive, prosperous appearance"
        },
        "career_indications": ["Social work", "UN/NGO", "Counseling", "HR", "Contracts", "Healing arts"],
        "health_vulnerabilities": ["Digestive issues", "Intestinal problems", "Skin disorders"],
        "spiritual_path": "Service through friendship and helping others unite",
        "past_life_indicators": "Soul was a mediator, friend, or social connector",
        "remedies": {
            "deity_worship": "Aryaman",
            "mantra": "Om Aryamne Namah",
            "fasting": "Sunday",
            "charity": "Help in marriages, support friendships"
        }
    },

    13: {
        "name": "Hasta",
        "sanskrit": "हस्त",
        "symbol": "Hand / Fist",
        "deity": "Savitar (Sun God, Creative form)",
        "ruling_planet": "Moon",
        "zodiac_range": "10°00' - 23°20' Virgo",
        "gana": NakshatraGana.DEVA,
        "nadi": NadiType.VATA,
        "tattva": NakshatraTattva.AGNI,
        "animal_symbol": "Female Buffalo",
        "bird": "Crow",
        "tree": "Hog Plum",
        "sounds": ["Pu", "Sha", "Na", "Tha"],
        "characteristics": {
            "positive": ["Skill", "Craftsmanship", "Dexterity", "Cleverness", "Humor", "Healing hands"],
            "negative": ["Trickery", "Gambling", "Thievery", "Cunning", "Unscrupulousness"],
            "physical": "Attractive hands, skillful movements, pleasant appearance"
        },
        "career_indications": ["Crafts", "Healing", "Card dealers", "Magicians", "Surgeons", "Artisans", "Comedians"],
        "health_vulnerabilities": ["Hand/arm issues", "Nervous disorders", "Bowel problems"],
        "spiritual_path": "Manifestation through skilled action and service",
        "past_life_indicators": "Soul developed manual skills and craftsmanship",
        "remedies": {
            "deity_worship": "Savitar (Sun)",
            "mantra": "Om Savitre Namah",
            "fasting": "Monday or Sunday",
            "charity": "Support artisans, donate with your hands"
        }
    },

    14: {
        "name": "Chitra",
        "sanskrit": "चित्रा",
        "symbol": "Bright Jewel / Pearl",
        "deity": "Vishwakarma (Divine Architect)",
        "ruling_planet": "Mars",
        "zodiac_range": "23°20' Virgo - 6°40' Libra",
        "gana": NakshatraGana.RAKSHASA,
        "nadi": NadiType.PITTA,
        "tattva": NakshatraTattva.AGNI,
        "animal_symbol": "Female Tiger",
        "bird": "Woodpecker",
        "tree": "Bilva (Wood Apple)",
        "sounds": ["Pe", "Po", "Ra", "Ri"],
        "characteristics": {
            "positive": ["Beauty", "Creativity", "Architecture", "Design", "Elegance", "Brilliance"],
            "negative": ["Vanity", "Self-centeredness", "Smugness", "Corruption", "Criticism"],
            "physical": "Exceptionally beautiful/handsome, well-proportioned, bright appearance"
        },
        "career_indications": ["Architecture", "Design", "Jewelry", "Fashion", "Interior design", "Engineering"],
        "health_vulnerabilities": ["Kidney issues", "Skin problems", "Reproductive health"],
        "spiritual_path": "Creating beauty as divine worship",
        "past_life_indicators": "Soul was an architect, designer, or creator of beauty",
        "remedies": {
            "deity_worship": "Vishwakarma",
            "mantra": "Om Vishwakarmane Namah",
            "fasting": "Tuesday",
            "charity": "Support artists, donate beautiful items"
        }
    },

    15: {
        "name": "Swati",
        "sanskrit": "स्वाति",
        "symbol": "Young plant shoot / Coral / Sword",
        "deity": "Vayu (Wind God)",
        "ruling_planet": "Rahu",
        "zodiac_range": "6°40' - 20°00' Libra",
        "gana": NakshatraGana.DEVA,
        "nadi": NadiType.KAPHA,
        "tattva": NakshatraTattva.AGNI,
        "animal_symbol": "Male Buffalo",
        "bird": "Honey Bee",
        "tree": "Arjun Tree",
        "sounds": ["Ru", "Re", "Ro", "Ta"],
        "characteristics": {
            "positive": ["Independence", "Flexibility", "Diplomacy", "Adaptability", "Business acumen"],
            "negative": ["Restlessness", "Scattered energy", "Indecision", "Hidden anger"],
            "physical": "Graceful, flexible build, pleasant appearance"
        },
        "career_indications": ["Business", "Trade", "Politics", "Law", "Travel industry", "Sales"],
        "health_vulnerabilities": ["Gas/wind disorders", "Kidney problems", "Skin issues"],
        "spiritual_path": "Finding freedom through surrender to divine will",
        "past_life_indicators": "Soul valued independence and faced challenges of flexibility",
        "remedies": {
            "deity_worship": "Vayu Deva",
            "mantra": "Om Vayuve Namah",
            "fasting": "Saturday",
            "charity": "Plant trees, support environmental causes"
        },
        "special_notes": "Saraswati was born when the first rain fell on a lotus leaf in Swati"
    },

    16: {
        "name": "Vishakha",
        "sanskrit": "विशाखा",
        "symbol": "Triumphal Archway / Potter's Wheel",
        "deity": "Indra-Agni (Combined)",
        "ruling_planet": "Jupiter",
        "zodiac_range": "20°00' Libra - 3°20' Scorpio",
        "gana": NakshatraGana.RAKSHASA,
        "nadi": NadiType.KAPHA,
        "tattva": NakshatraTattva.AGNI,
        "animal_symbol": "Male Tiger",
        "bird": "Red Tail Sparrow",
        "tree": "Vikankatha (Wood Apple)",
        "sounds": ["Ti", "Tu", "Te", "To"],
        "characteristics": {
            "positive": ["Goal-oriented", "Determined", "Powerful", "Ambitious", "Purposeful", "Courageous"],
            "negative": ["Jealousy", "Frustration", "Quarrelsome", "Ruthless", "Infidelity"],
            "physical": "Attractive, bright appearance, intense eyes"
        },
        "career_indications": ["Politics", "Military", "Research", "Preaching", "Writing", "Leadership"],
        "health_vulnerabilities": ["Hormonal issues", "Kidney problems", "Arms/upper chest issues"],
        "spiritual_path": "Single-pointed focus on spiritual goal",
        "past_life_indicators": "Soul pursued goals with intense determination",
        "remedies": {
            "deity_worship": "Indra and Agni",
            "mantra": "Om Indragnibhyam Namah",
            "fasting": "Thursday",
            "charity": "Support goal achievement of others"
        }
    },

    17: {
        "name": "Anuradha",
        "sanskrit": "अनुराधा",
        "symbol": "Lotus / Triumphal Archway / Staff",
        "deity": "Mitra (God of Friendship)",
        "ruling_planet": "Saturn",
        "zodiac_range": "3°20' - 16°40' Scorpio",
        "gana": NakshatraGana.DEVA,
        "nadi": NadiType.PITTA,
        "tattva": NakshatraTattva.AGNI,
        "animal_symbol": "Female Deer/Hare",
        "bird": "Nightingale",
        "tree": "Bakula (Bullet Wood)",
        "sounds": ["Na", "Ni", "Nu", "Ne"],
        "characteristics": {
            "positive": ["Devotion", "Friendship", "Cooperation", "Love", "Success through groups"],
            "negative": ["Jealousy", "Control issues", "Possessiveness", "Wanderlust"],
            "physical": "Attractive, soft features, appealing appearance"
        },
        "career_indications": ["Organizational work", "Groups", "Occult", "Mining", "Statistics", "Numerology"],
        "health_vulnerabilities": ["Stomach issues", "Bowel problems", "Genital problems"],
        "spiritual_path": "Devotion and finding divine through friendship and love",
        "past_life_indicators": "Soul developed strong bonds of friendship and devotion",
        "remedies": {
            "deity_worship": "Mitra Deva",
            "mantra": "Om Mitraya Namah",
            "fasting": "Saturday",
            "charity": "Support friendships, help groups"
        },
        "special_notes": "Favorable for spiritual practice and meditation"
    },

    18: {
        "name": "Jyeshtha",
        "sanskrit": "ज्येष्ठा",
        "symbol": "Circular Amulet / Umbrella / Earring",
        "deity": "Indra (King of Gods)",
        "ruling_planet": "Mercury",
        "zodiac_range": "16°40' - 30°00' Scorpio",
        "gana": NakshatraGana.RAKSHASA,
        "nadi": NadiType.VATA,
        "tattva": NakshatraTattva.VAYU,
        "animal_symbol": "Male Deer/Hare",
        "bird": "Brahmani Duck",
        "tree": "Shalmali (Silk Cotton)",
        "sounds": ["No", "Ya", "Yi", "Yu"],
        "characteristics": {
            "positive": ["Seniority", "Protection", "Power", "Fame", "Valor", "Generosity"],
            "negative": ["Arrogance", "Jealousy", "Hypocrisy", "Harsh speech", "Scheming"],
            "physical": "Commanding presence, round face, attractive"
        },
        "career_indications": ["Military", "Police", "Administration", "Protection services", "Occult"],
        "health_vulnerabilities": ["Muscular problems", "Neck issues", "Reproductive health"],
        "spiritual_path": "Using power for protection of dharma",
        "past_life_indicators": "Soul held positions of authority and protection",
        "remedies": {
            "deity_worship": "Lord Indra",
            "mantra": "Om Indraya Namah",
            "fasting": "Wednesday",
            "charity": "Protect the weak, donate umbrellas"
        }
    },

    19: {
        "name": "Moola",
        "sanskrit": "मूल",
        "symbol": "Roots / Tied bunch of roots / Lion's tail",
        "deity": "Nirriti (Goddess of Destruction) / Alakshmi",
        "ruling_planet": "Ketu",
        "zodiac_range": "0°00' - 13°20' Sagittarius",
        "gana": NakshatraGana.RAKSHASA,
        "nadi": NadiType.VATA,
        "tattva": NakshatraTattva.VAYU,
        "animal_symbol": "Male Dog",
        "bird": "Red Vulture",
        "tree": "Raktachandan (Red Sandalwood)",
        "sounds": ["Ye", "Yo", "Ba", "Bi"],
        "characteristics": {
            "positive": ["Investigation", "Getting to root cause", "Transformation", "Research", "Uprooting evil"],
            "negative": ["Destructive", "Arrogant", "Self-destructive", "Troublesome"],
            "physical": "Attractive, proud bearing, may have marks on body"
        },
        "career_indications": ["Research", "Medicine", "Politics", "Preaching", "Investigation", "Herb medicine"],
        "health_vulnerabilities": ["Hip/thigh issues", "Sciatic nerve problems", "Accidents"],
        "spiritual_path": "Complete transformation through destroying illusions",
        "past_life_indicators": "Soul went through major destructions and rebuilding",
        "remedies": {
            "deity_worship": "Goddess Kali (Nirriti)",
            "mantra": "Om Nirritaye Namah",
            "fasting": "Tuesday",
            "charity": "Donate roots/medicines, help in crisis"
        },
        "special_notes": "First pada traditionally considered challenging - requires remedies"
    },

    20: {
        "name": "Purva Ashadha",
        "sanskrit": "पूर्वाषाढ़ा",
        "symbol": "Elephant's Tusk / Winnowing Basket / Fan",
        "deity": "Apas (Water Deity)",
        "ruling_planet": "Venus",
        "zodiac_range": "13°20' - 26°40' Sagittarius",
        "gana": NakshatraGana.MANUSHYA,
        "nadi": NadiType.PITTA,
        "tattva": NakshatraTattva.VAYU,
        "animal_symbol": "Male Monkey",
        "bird": "Francolin",
        "tree": "Ashoka Tree",
        "sounds": ["Bu", "Dha", "Pha", "Dha"],
        "characteristics": {
            "positive": ["Invincibility", "Pride", "Independence", "Influence", "Purification"],
            "negative": ["Overconfidence", "Hubris", "Cannot be told", "Superiority complex"],
            "physical": "Attractive, tall, well-formed body"
        },
        "career_indications": ["Shipping", "Navy", "Philosophy", "Writing", "Law", "Teaching"],
        "health_vulnerabilities": ["Thigh issues", "Lung problems", "Kidney/bladder issues"],
        "spiritual_path": "Victory through purification and divine grace",
        "past_life_indicators": "Soul experienced many victories and developed confidence",
        "remedies": {
            "deity_worship": "Apas (Water deities)",
            "mantra": "Om Adbhyo Namah",
            "fasting": "Friday",
            "charity": "Donate water, dig wells, support water causes"
        }
    },

    21: {
        "name": "Uttara Ashadha",
        "sanskrit": "उत्तराषाढ़ा",
        "symbol": "Elephant's Tusk / Small Cot",
        "deity": "Vishwadevas (Universal Gods)",
        "ruling_planet": "Sun",
        "zodiac_range": "26°40' Sagittarius - 10°00' Capricorn",
        "gana": NakshatraGana.MANUSHYA,
        "nadi": NadiType.KAPHA,
        "tattva": NakshatraTattva.VAYU,
        "animal_symbol": "Male Mongoose",
        "bird": "Stork",
        "tree": "Jackfruit",
        "sounds": ["Be", "Bo", "Ja", "Ji"],
        "characteristics": {
            "positive": ["Final victory", "Lasting success", "Leadership", "Pioneering", "Introspection"],
            "negative": ["Loneliness", "Multiple relationships", "Apathetic", "Unemotional"],
            "physical": "Tall, graceful, attractive, commanding presence"
        },
        "career_indications": ["Leadership", "Government", "Military", "Pioneers", "Social reformers"],
        "health_vulnerabilities": ["Stomach issues", "Waist problems", "Skin diseases"],
        "spiritual_path": "Achieving ultimate victory through righteous living",
        "past_life_indicators": "Soul achieved lasting victories through perseverance",
        "remedies": {
            "deity_worship": "Vishwadevas",
            "mantra": "Om Vishwebhyo Devebhyo Namah",
            "fasting": "Sunday",
            "charity": "Support universal causes, help all beings"
        },
        "special_notes": "Called 'Uttarashada' - the 'later invincible one' - success is assured"
    },

    22: {
        "name": "Shravana",
        "sanskrit": "श्रवण",
        "symbol": "Ear / Three Footprints",
        "deity": "Vishnu (Preserver)",
        "ruling_planet": "Moon",
        "zodiac_range": "10°00' - 23°20' Capricorn",
        "gana": NakshatraGana.DEVA,
        "nadi": NadiType.KAPHA,
        "tattva": NakshatraTattva.VAYU,
        "animal_symbol": "Female Monkey",
        "bird": "Francolin",
        "tree": "Milk Tree (Arka)",
        "sounds": ["Ju", "Je", "Jo", "Gha"],
        "characteristics": {
            "positive": ["Listening", "Learning", "Connection", "Fame", "Scholarship", "Preservation"],
            "negative": ["Gossip", "Hypersensitivity", "Extremism", "Jealousy"],
            "physical": "Well-proportioned, attractive, neat appearance"
        },
        "career_indications": ["Teaching", "Media", "Music", "Languages", "Counseling", "Travel industry"],
        "health_vulnerabilities": ["Ear problems", "Skin issues", "Knee problems"],
        "spiritual_path": "Listening to divine wisdom and preserving knowledge",
        "past_life_indicators": "Soul was a student of sacred knowledge or preserver of traditions",
        "remedies": {
            "deity_worship": "Lord Vishnu",
            "mantra": "Om Namo Narayanaya",
            "fasting": "Monday",
            "charity": "Support education, donate books"
        },
        "special_notes": "Saraswati Puja is especially effective for this nakshatra"
    },

    23: {
        "name": "Dhanishtha",
        "sanskrit": "धनिष्ठा",
        "symbol": "Drum / Flute",
        "deity": "Eight Vasus (Elemental Gods)",
        "ruling_planet": "Mars",
        "zodiac_range": "23°20' Capricorn - 6°40' Aquarius",
        "gana": NakshatraGana.RAKSHASA,
        "nadi": NadiType.PITTA,
        "tattva": NakshatraTattva.AKASHA,
        "animal_symbol": "Female Lion",
        "bird": "Golden Bee",
        "tree": "Shami Tree",
        "sounds": ["Ga", "Gi", "Gu", "Ge"],
        "characteristics": {
            "positive": ["Wealth", "Music", "Rhythm", "Fame", "Prosperity", "Charity"],
            "negative": ["Careless", "Talkative", "Arrogant about wealth", "Inconsiderate"],
            "physical": "Lean, tall, attractive, rhythmic in movement"
        },
        "career_indications": ["Music", "Real estate", "Surgery", "Mining", "Scientist", "Athletics"],
        "health_vulnerabilities": ["Blood disorders", "Ankle issues", "Cough/cold"],
        "spiritual_path": "Using wealth and talents for cosmic harmony",
        "past_life_indicators": "Soul developed musical abilities and material prosperity",
        "remedies": {
            "deity_worship": "Eight Vasus",
            "mantra": "Om Vasubhyo Namah",
            "fasting": "Tuesday",
            "charity": "Donate musical instruments, support musicians"
        }
    },

    24: {
        "name": "Shatabhisha",
        "sanskrit": "शतभिषा",
        "symbol": "Empty Circle / 100 Flowers / 100 Physicians",
        "deity": "Varuna (God of Cosmic Waters)",
        "ruling_planet": "Rahu",
        "zodiac_range": "6°40' - 20°00' Aquarius",
        "gana": NakshatraGana.RAKSHASA,
        "nadi": NadiType.VATA,
        "tattva": NakshatraTattva.AKASHA,
        "animal_symbol": "Female Horse",
        "bird": "Raven",
        "tree": "Kadamba",
        "sounds": ["Go", "Sa", "Si", "Su"],
        "characteristics": {
            "positive": ["Healing", "Protection", "Secrecy", "Mysticism", "Medicine", "Philosophy"],
            "negative": ["Loneliness", "Secretive", "Addictions", "Depression", "Harsh"],
            "physical": "Attractive, may have unusual features, healing presence"
        },
        "career_indications": ["Medicine", "Healing", "Astronomy", "Astrology", "Electricity", "Space science"],
        "health_vulnerabilities": ["Jaw issues", "Heart problems", "Arthritis", "Mental health"],
        "spiritual_path": "Healing through cosmic understanding and mystical insight",
        "past_life_indicators": "Soul was a healer, mystic, or worked with cosmic energies",
        "remedies": {
            "deity_worship": "Lord Varuna",
            "mantra": "Om Varunaya Namah",
            "fasting": "Saturday",
            "charity": "Support healing, donate medicines"
        },
        "special_notes": "The '100 healers' - powerful for healing abilities"
    },

    25: {
        "name": "Purva Bhadrapada",
        "sanskrit": "पूर्व भाद्रपद",
        "symbol": "Front of funeral cot / Sword / Two-faced man",
        "deity": "Aja Ekapada (One-footed Goat, form of Shiva)",
        "ruling_planet": "Jupiter",
        "zodiac_range": "20°00' Aquarius - 3°20' Pisces",
        "gana": NakshatraGana.MANUSHYA,
        "nadi": NadiType.VATA,
        "tattva": NakshatraTattva.AKASHA,
        "animal_symbol": "Male Lion",
        "bird": "Avocet",
        "tree": "Mango",
        "sounds": ["Se", "So", "Da", "Di"],
        "characteristics": {
            "positive": ["Transformation", "Intensity", "Passion", "Spirituality", "Sacrifice", "Asceticism"],
            "negative": ["Extremism", "Cynicism", "Dark moods", "Deception", "Two-faced"],
            "physical": "Tall, may limp or have foot issues, intense appearance"
        },
        "career_indications": ["Occult", "Death-related", "Metal work", "Penance", "Astrology", "Writing"],
        "health_vulnerabilities": ["Feet issues", "Swelling", "Liver problems", "Heart disease"],
        "spiritual_path": "Extreme transformation through fire of tapas",
        "past_life_indicators": "Soul underwent severe transformations and sacrifices",
        "remedies": {
            "deity_worship": "Aja Ekapada (Shiva)",
            "mantra": "Om Ajaya Namah",
            "fasting": "Thursday",
            "charity": "Support funeral rites, help dying"
        }
    },

    26: {
        "name": "Uttara Bhadrapada",
        "sanskrit": "उत्तर भाद्रपद",
        "symbol": "Back of funeral cot / Twin / Serpent",
        "deity": "Ahir Budhnya (Serpent of the Deep)",
        "ruling_planet": "Saturn",
        "zodiac_range": "3°20' - 16°40' Pisces",
        "gana": NakshatraGana.MANUSHYA,
        "nadi": NadiType.PITTA,
        "tattva": NakshatraTattva.AKASHA,
        "animal_symbol": "Female Cow",
        "bird": "Koyal (Cuckoo)",
        "tree": "Neem",
        "sounds": ["Du", "Tha", "Jha", "Da"],
        "characteristics": {
            "positive": ["Wisdom", "Control", "Deep thinking", "Mysticism", "Patience", "Compassion"],
            "negative": ["Lazy", "Careless speech", "Irresponsible", "Melancholic"],
            "physical": "Attractive, tall, may have unusual gait"
        },
        "career_indications": ["Charity", "Philosophy", "Yoga", "Non-profit", "Counseling", "Healing"],
        "health_vulnerabilities": ["Feet issues", "Stomach problems", "Constipation"],
        "spiritual_path": "Deep meditation and compassionate service",
        "past_life_indicators": "Soul developed wisdom through service and meditation",
        "remedies": {
            "deity_worship": "Ahir Budhnya (Cosmic Serpent)",
            "mantra": "Om Ahirbudhnyaya Namah",
            "fasting": "Saturday",
            "charity": "Support ashrams, donate to spiritual causes"
        },
        "special_notes": "Excellent for spiritual practices and renunciation"
    },

    27: {
        "name": "Revati",
        "sanskrit": "रेवती",
        "symbol": "Fish / Drum for walking",
        "deity": "Pushan (Nurturer, Protector of journeys)",
        "ruling_planet": "Mercury",
        "zodiac_range": "16°40' - 30°00' Pisces",
        "gana": NakshatraGana.DEVA,
        "nadi": NadiType.KAPHA,
        "tattva": NakshatraTattva.AKASHA,
        "animal_symbol": "Female Elephant",
        "bird": "Kite",
        "tree": "Mahua",
        "sounds": ["De", "Do", "Cha", "Chi"],
        "characteristics": {
            "positive": ["Nurturing", "Protection", "Wealth", "Safe journeys", "Compassion", "Creativity"],
            "negative": ["Over-giving", "Dull", "Stubborn", "Spite", "Easily influenced"],
            "physical": "Well-formed, attractive, clean appearance, prosperous look"
        },
        "career_indications": ["Travel", "Road/path work", "Timekeeping", "Lighthouse", "Foster care", "Orphanages"],
        "health_vulnerabilities": ["Feet issues", "Stomach problems", "Ear infections"],
        "spiritual_path": "Nurturing all beings on their spiritual journey",
        "past_life_indicators": "Soul was a protector, nurturer, or guide for travelers",
        "remedies": {
            "deity_worship": "Pushan",
            "mantra": "Om Pushne Namah",
            "fasting": "Wednesday",
            "charity": "Help travelers, protect animals"
        },
        "special_notes": "Last nakshatra - represents completion of cycle and new beginnings"
    }
}


# =============================================================================
# NADI MATCHING (COMPATIBILITY) WISDOM
# =============================================================================

NADI_COMPATIBILITY = {
    "kuta_system": {
        "total_points": 36,
        "minimum_acceptable": 18,
        "categories": {
            "Varna": {"points": 1, "description": "Spiritual compatibility"},
            "Vashya": {"points": 2, "description": "Mutual attraction and control"},
            "Tara": {"points": 3, "description": "Birth star compatibility"},
            "Yoni": {"points": 4, "description": "Sexual compatibility"},
            "Graha_Maitri": {"points": 5, "description": "Planetary friendship"},
            "Gana": {"points": 6, "description": "Temperament matching"},
            "Bhakoot": {"points": 7, "description": "Relative Moon sign positions"},
            "Nadi": {"points": 8, "description": "Health and genes - MOST IMPORTANT"}
        }
    },

    "nadi_dosha": {
        "description": "Same Nadi between partners - considered serious defect",
        "effects": [
            "Health problems for couple or children",
            "Lack of attraction over time",
            "Genetic incompatibility concerns"
        ],
        "exceptions": [
            "If same nakshatra but different rashis - reduced effect",
            "If same rashi but different nakshatras - reduced effect",
            "Various planetary positions can cancel the dosha"
        ],
        "remedies": [
            "Nadi Nivarana Puja",
            "Maha Mrityunjaya Japa",
            "Donations to specific temples"
        ]
    },

    "gana_compatibility": {
        "Deva_Deva": {"score": 6, "description": "Excellent - harmonious spiritual nature"},
        "Deva_Manushya": {"score": 6, "description": "Good - divine and human balance"},
        "Deva_Rakshasa": {"score": 1, "description": "Challenging - opposite temperaments"},
        "Manushya_Manushya": {"score": 6, "description": "Good - practical harmony"},
        "Manushya_Rakshasa": {"score": 0, "description": "Difficult - conflicting natures"},
        "Rakshasa_Rakshasa": {"score": 6, "description": "Can work - mutual understanding of intensity"}
    }
}


# =============================================================================
# NADI PREDICTION TECHNIQUES
# =============================================================================

NADI_PREDICTION_TECHNIQUES = {
    "bhrigu_nandi_nadi": {
        "description": "Technique using Saturn as primary significator",
        "principle": "Saturn's position from other planets reveals life events",
        "applications": ["Timing of events", "Career changes", "Relationship milestones"]
    },

    "jaimini_chara_dasha": {
        "description": "Rashi-based dasha system from Jaimini Sutras",
        "principle": "Signs rule periods based on their position from Lagna",
        "special_karakas": {
            "Atmakaraka": "Soul significator - highest degree planet",
            "Amatyakaraka": "Minister - second highest degree",
            "Bhratrukaraka": "Siblings significator",
            "Matrukaraka": "Mother significator",
            "Putrakaraka": "Children significator",
            "Gnatikaraka": "Relatives/enemies significator",
            "Darakaraka": "Spouse significator - lowest degree planet"
        }
    },

    "kalachakra_dasha": {
        "description": "Wheel of Time dasha system",
        "principle": "Based on nakshatra padas and their sequential activation",
        "special_feature": "Can move both forward and backward through signs"
    },

    "naadi_amsha": {
        "description": "150-part division of a sign for precise predictions",
        "calculation": "Each sign divided into 150 parts of 12 minutes each",
        "usage": "Extremely precise prediction of life events"
    }
}


# =============================================================================
# TRANSIT (GOCHARA) WISDOM
# =============================================================================

TRANSIT_WISDOM = {
    "moon_transit": {
        "cycle": "27.3 days through all nakshatras",
        "daily_effect": "2.25 days per sign",
        "importance": "Affects daily mood, decisions, and minor events"
    },

    "saturn_transit": {
        "cycle": "29.5 years",
        "per_sign": "2.5 years",
        "sade_sati": {
            "description": "7.5 year period when Saturn transits 12th, 1st, and 2nd from Moon",
            "phases": ["Rising (12th) - expenses, worry", "Peak (1st) - maximum challenges", "Setting (2nd) - family/financial issues"],
            "total_occurrences": "2-3 times in average lifespan",
            "remedies": ["Shani mantras", "Blue sapphire (if suitable)", "Service to elderly", "Saturday fasting"]
        }
    },

    "jupiter_transit": {
        "cycle": "12 years",
        "per_sign": "1 year",
        "best_positions": ["2nd", "5th", "7th", "9th", "11th from Moon"],
        "challenging_positions": ["3rd", "6th", "8th", "12th from Moon"]
    },

    "rahu_ketu_transit": {
        "cycle": "18 years",
        "per_sign": "1.5 years",
        "always_retrograde": True,
        "effects": "Major karmic activations and life changes"
    }
}


# =============================================================================
# MAIN CLASS FOR NADI JYOTISHA KNOWLEDGE
# =============================================================================

class NadiJyotishaKnowledge:
    """
    Main class for accessing Nadi Jyotisha knowledge database
    Used by AI Astrology Guide for generating authentic responses
    """

    def __init__(self):
        self.nakshatra_wisdom = NAKSHATRA_WISDOM
        self.compatibility = NADI_COMPATIBILITY
        self.prediction_techniques = NADI_PREDICTION_TECHNIQUES
        self.transit_wisdom = TRANSIT_WISDOM

    def get_nakshatra_info(self, nakshatra_number: int) -> Dict[str, Any]:
        """Get complete information for a nakshatra by number (1-27)"""
        return self.nakshatra_wisdom.get(nakshatra_number, {})

    def get_nakshatra_by_name(self, name: str) -> Dict[str, Any]:
        """Get nakshatra information by name"""
        for num, data in self.nakshatra_wisdom.items():
            if data.get("name", "").lower() == name.lower():
                return data
        return {}

    def get_nakshatra_compatibility(self, nakshatra1: str, nakshatra2: str) -> Dict[str, Any]:
        """Get compatibility between two nakshatras"""
        nak1 = self.get_nakshatra_by_name(nakshatra1)
        nak2 = self.get_nakshatra_by_name(nakshatra2)

        if not nak1 or not nak2:
            return {"error": "Nakshatra not found"}

        # Calculate basic compatibility factors
        gana1 = nak1.get("gana", NakshatraGana.MANUSHYA)
        gana2 = nak2.get("gana", NakshatraGana.MANUSHYA)

        nadi1 = nak1.get("nadi", NadiType.VATA)
        nadi2 = nak2.get("nadi", NadiType.VATA)

        # Nadi dosha check
        nadi_match = nadi1 != nadi2
        nadi_points = 8 if nadi_match else 0

        # Gana compatibility
        gana_key = f"{gana1.name}_{gana2.name}"
        gana_data = self.compatibility["gana_compatibility"].get(
            gana_key,
            self.compatibility["gana_compatibility"].get(f"{gana2.name}_{gana1.name}", {"score": 3})
        )

        return {
            "nakshatra1": nakshatra1,
            "nakshatra2": nakshatra2,
            "nadi_compatible": nadi_match,
            "nadi_points": nadi_points,
            "gana_points": gana_data.get("score", 3),
            "gana_description": gana_data.get("description", ""),
            "nadi_dosha": not nadi_match,
            "total_estimated_points": nadi_points + gana_data.get("score", 3)
        }

    def get_nakshatra_career_guidance(self, nakshatra: str) -> List[str]:
        """Get career recommendations for a nakshatra"""
        nak_data = self.get_nakshatra_by_name(nakshatra)
        return nak_data.get("career_indications", [])

    def get_nakshatra_remedies(self, nakshatra: str) -> Dict[str, Any]:
        """Get remedies for a nakshatra"""
        nak_data = self.get_nakshatra_by_name(nakshatra)
        return nak_data.get("remedies", {})

    def get_nakshatra_health_vulnerabilities(self, nakshatra: str) -> List[str]:
        """Get health vulnerabilities for a nakshatra"""
        nak_data = self.get_nakshatra_by_name(nakshatra)
        return nak_data.get("health_vulnerabilities", [])

    def get_nakshatra_spiritual_path(self, nakshatra: str) -> str:
        """Get spiritual path for a nakshatra"""
        nak_data = self.get_nakshatra_by_name(nakshatra)
        return nak_data.get("spiritual_path", "")

    def get_nakshatra_past_life(self, nakshatra: str) -> str:
        """Get past life indicators for a nakshatra"""
        nak_data = self.get_nakshatra_by_name(nakshatra)
        return nak_data.get("past_life_indicators", "")

    def get_transit_effects(self, planet: str) -> Dict[str, Any]:
        """Get transit effects for a planet"""
        planet_lower = planet.lower()
        if planet_lower in ["moon", "chandra"]:
            return self.transit_wisdom.get("moon_transit", {})
        elif planet_lower in ["saturn", "shani"]:
            return self.transit_wisdom.get("saturn_transit", {})
        elif planet_lower in ["jupiter", "guru"]:
            return self.transit_wisdom.get("jupiter_transit", {})
        elif planet_lower in ["rahu", "ketu"]:
            return self.transit_wisdom.get("rahu_ketu_transit", {})
        return {}

    def get_compatibility_analysis(self, nakshatra1: str, nakshatra2: str) -> Dict[str, Any]:
        """Get comprehensive compatibility analysis"""
        basic_compat = self.get_nakshatra_compatibility(nakshatra1, nakshatra2)

        nak1_data = self.get_nakshatra_by_name(nakshatra1)
        nak2_data = self.get_nakshatra_by_name(nakshatra2)

        # Check best matches
        nak1_best = nak1_data.get("relationship_compatibility", {}).get("best_match", [])
        nak2_best = nak2_data.get("relationship_compatibility", {}).get("best_match", [])

        is_best_match = nakshatra2 in nak1_best or nakshatra1 in nak2_best

        # Check avoid list
        nak1_avoid = nak1_data.get("relationship_compatibility", {}).get("avoid", [])
        nak2_avoid = nak2_data.get("relationship_compatibility", {}).get("avoid", [])

        is_to_avoid = nakshatra2 in nak1_avoid or nakshatra1 in nak2_avoid

        return {
            **basic_compat,
            "is_best_match": is_best_match,
            "is_to_avoid": is_to_avoid,
            "recommendation": "Highly recommended" if is_best_match else ("Caution advised" if is_to_avoid else "Neutral - check full chart")
        }


# Singleton instance
_nadi_jyotisha_knowledge = None

def get_nadi_jyotisha_knowledge() -> NadiJyotishaKnowledge:
    """Get or create Nadi Jyotisha Knowledge singleton"""
    global _nadi_jyotisha_knowledge
    if _nadi_jyotisha_knowledge is None:
        _nadi_jyotisha_knowledge = NadiJyotishaKnowledge()
    return _nadi_jyotisha_knowledge

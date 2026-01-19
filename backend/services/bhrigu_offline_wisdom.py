"""
Bhrigu Offline Wisdom Generator
Generates category-specific predictions using local corpus data when OpenAI is unavailable
Now fully integrated with Bhrigu Samhita and Nadi Jyotisha knowledge databases
"""
import os
import sys
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from utils.logger import setup_logger, log_exception

logger = setup_logger(__name__)

# Import core wisdom databases
try:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'core_wisdom'))
    from bhrigu_samhita_knowledge import PLANETARY_CORE_WISDOM, HOUSE_WISDOM, YOGA_DATABASE, DASHA_WISDOM, REMEDIAL_WISDOM
    from nadi_jyotisha_knowledge import NAKSHATRA_WISDOM, NADI_COMPATIBILITY, NADI_PREDICTION_TECHNIQUES, TRANSIT_WISDOM
    WISDOM_LOADED = True
    logger.info("Successfully loaded Bhrigu Samhita and Nadi Jyotisha knowledge databases")
except ImportError as e:
    WISDOM_LOADED = False
    PLANETARY_CORE_WISDOM = {}
    NAKSHATRA_WISDOM = {}
    HOUSE_WISDOM = {}
    YOGA_DATABASE = {}
    DASHA_WISDOM = {}
    REMEDIAL_WISDOM = {}
    NADI_COMPATIBILITY = {}
    NADI_PREDICTION_TECHNIQUES = {}
    TRANSIT_WISDOM = {}
    logger.warning(f"Could not import core wisdom databases: {e}. Using basic traits.")

class BhriguOfflineWisdomGenerator:
    """
    Generates detailed offline predictions using Bhrigu Samhita and Nadi Jyotisha corpus
    Each category has specific section headers matching what the frontend expects
    """

    def __init__(self):
        self.bhrigu_corpus = None
        self.nadi_corpus = None
        self.soul_journey_model = None
        self.initialization_errors: List[str] = []
        self._load_corpus()

        # Zodiac sign characteristics for personalization
        self.zodiac_traits = {
            'Aries': {'element': 'Fire', 'ruler': 'Mars', 'quality': 'Cardinal', 'traits': 'leadership, initiative, courage'},
            'Taurus': {'element': 'Earth', 'ruler': 'Venus', 'quality': 'Fixed', 'traits': 'stability, determination, sensuality'},
            'Gemini': {'element': 'Air', 'ruler': 'Mercury', 'quality': 'Mutable', 'traits': 'communication, adaptability, intellect'},
            'Cancer': {'element': 'Water', 'ruler': 'Moon', 'quality': 'Cardinal', 'traits': 'nurturing, intuition, emotional depth'},
            'Leo': {'element': 'Fire', 'ruler': 'Sun', 'quality': 'Fixed', 'traits': 'creativity, leadership, self-expression'},
            'Virgo': {'element': 'Earth', 'ruler': 'Mercury', 'quality': 'Mutable', 'traits': 'analysis, service, perfectionism'},
            'Libra': {'element': 'Air', 'ruler': 'Venus', 'quality': 'Cardinal', 'traits': 'balance, harmony, relationships'},
            'Scorpio': {'element': 'Water', 'ruler': 'Mars', 'quality': 'Fixed', 'traits': 'transformation, depth, intensity'},
            'Sagittarius': {'element': 'Fire', 'ruler': 'Jupiter', 'quality': 'Mutable', 'traits': 'exploration, wisdom, philosophy'},
            'Capricorn': {'element': 'Earth', 'ruler': 'Saturn', 'quality': 'Cardinal', 'traits': 'ambition, discipline, responsibility'},
            'Aquarius': {'element': 'Air', 'ruler': 'Saturn', 'quality': 'Fixed', 'traits': 'innovation, humanitarianism, independence'},
            'Pisces': {'element': 'Water', 'ruler': 'Jupiter', 'quality': 'Mutable', 'traits': 'spirituality, compassion, intuition'}
        }

        # Nakshatra characteristics
        self.nakshatra_traits = {
            'Ashwini': {'deity': 'Ashwini Kumaras', 'symbol': 'Horse head', 'quality': 'healing, speed, initiative'},
            'Bharani': {'deity': 'Yama', 'symbol': 'Yoni', 'quality': 'transformation, restraint, duty'},
            'Krittika': {'deity': 'Agni', 'symbol': 'Razor', 'quality': 'purification, courage, cutting'},
            'Rohini': {'deity': 'Brahma', 'symbol': 'Ox cart', 'quality': 'creativity, growth, fertility'},
            'Mrigashira': {'deity': 'Soma', 'symbol': 'Deer head', 'quality': 'searching, curiosity, gentleness'},
            'Ardra': {'deity': 'Rudra', 'symbol': 'Teardrop', 'quality': 'destruction, renewal, effort'},
            'Punarvasu': {'deity': 'Aditi', 'symbol': 'Bow and quiver', 'quality': 'renewal, return, prosperity'},
            'Pushya': {'deity': 'Brihaspati', 'symbol': 'Flower', 'quality': 'nourishment, spiritual growth, wisdom'},
            'Ashlesha': {'deity': 'Nagas', 'symbol': 'Serpent', 'quality': 'mysticism, kundalini, transformation'},
            'Magha': {'deity': 'Pitris', 'symbol': 'Throne', 'quality': 'royalty, ancestors, authority'},
            'Purva Phalguni': {'deity': 'Bhaga', 'symbol': 'Hammock', 'quality': 'pleasure, creativity, rest'},
            'Uttara Phalguni': {'deity': 'Aryaman', 'symbol': 'Bed', 'quality': 'patronage, contracts, healing'},
            'Hasta': {'deity': 'Savitar', 'symbol': 'Hand', 'quality': 'skill, dexterity, craftsmanship'},
            'Chitra': {'deity': 'Vishvakarma', 'symbol': 'Pearl', 'quality': 'brilliance, creativity, architecture'},
            'Swati': {'deity': 'Vayu', 'symbol': 'Coral', 'quality': 'independence, movement, flexibility'},
            'Vishakha': {'deity': 'Indra-Agni', 'symbol': 'Archway', 'quality': 'determination, goals, triumph'},
            'Anuradha': {'deity': 'Mitra', 'symbol': 'Lotus', 'quality': 'friendship, devotion, success'},
            'Jyeshtha': {'deity': 'Indra', 'symbol': 'Earring', 'quality': 'leadership, protection, seniority'},
            'Moola': {'deity': 'Nirriti', 'symbol': 'Root', 'quality': 'investigation, foundation, destruction'},
            'Purva Ashadha': {'deity': 'Apas', 'symbol': 'Fan', 'quality': 'invincibility, purification, victory'},
            'Uttara Ashadha': {'deity': 'Vishvadevas', 'symbol': 'Elephant tusk', 'quality': 'final victory, righteousness, leadership'},
            'Shravana': {'deity': 'Vishnu', 'symbol': 'Ear', 'quality': 'learning, listening, connection'},
            'Dhanishta': {'deity': 'Vasus', 'symbol': 'Drum', 'quality': 'wealth, music, prosperity'},
            'Shatabhisha': {'deity': 'Varuna', 'symbol': 'Circle', 'quality': 'healing, mystery, solitude'},
            'Purva Bhadrapada': {'deity': 'Aja Ekapada', 'symbol': 'Sword', 'quality': 'purification, penance, transformation'},
            'Uttara Bhadrapada': {'deity': 'Ahir Budhnya', 'symbol': 'Twins', 'quality': 'depth, stability, wisdom'},
            'Revati': {'deity': 'Pushan', 'symbol': 'Fish', 'quality': 'nourishment, protection, completion'}
        }

    def _load_corpus(self):
        """Load corpus data from files"""
        data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')

        # Load Bhrigu Samhita principles
        bhrigu_path = os.path.join(data_dir, 'bhrigu_samhita_principles.yml')
        if os.path.exists(bhrigu_path):
            try:
                with open(bhrigu_path, 'r') as f:
                    self.bhrigu_corpus = json.load(f)
            except Exception as e:
                message = f"Could not load Bhrigu corpus: {e}"
                self.initialization_errors.append(message)
                log_exception(logger, e, context=message)

        # Load Nadi Jyotisha principles
        nadi_path = os.path.join(data_dir, 'nadi_jyotisha_principles.yml')
        if os.path.exists(nadi_path):
            try:
                with open(nadi_path, 'r') as f:
                    self.nadi_corpus = json.load(f)
            except Exception as e:
                message = f"Could not load Nadi corpus: {e}"
                self.initialization_errors.append(message)
                log_exception(logger, e, context=message)

        # Load soul journey model
        journey_path = os.path.join(data_dir, 'bhrigu_karmic_soul_journey_model.json')
        if os.path.exists(journey_path):
            try:
                with open(journey_path, 'r') as f:
                    self.soul_journey_model = json.load(f)
            except Exception as e:
                message = f"Could not load soul journey model: {e}"
                self.initialization_errors.append(message)
                log_exception(logger, e, context=message)

    def _get_zodiac_info(self, zodiac: str) -> Dict[str, str]:
        """Get zodiac characteristics"""
        return self.zodiac_traits.get(zodiac, {
            'element': 'Unknown', 'ruler': 'Unknown',
            'quality': 'Unknown', 'traits': 'unique characteristics'
        })

    def _get_nakshatra_info(self, nakshatra: str) -> Dict[str, str]:
        """Get nakshatra characteristics"""
        # Handle partial matches
        for name, info in self.nakshatra_traits.items():
            if name.lower() in nakshatra.lower() or nakshatra.lower() in name.lower():
                return info
        return {'deity': 'Cosmic forces', 'symbol': 'Stars', 'quality': 'unique spiritual gifts'}

    def _get_relevant_principles(self, context: Dict[str, Any], limit: int = 5) -> List[Dict]:
        """Get relevant principles from corpus based on context"""
        principles = []

        if self.bhrigu_corpus and 'principles' in self.bhrigu_corpus:
            principles.extend(self.bhrigu_corpus['principles'][:limit])

        if self.nadi_corpus and 'principles' in self.nadi_corpus:
            principles.extend(self.nadi_corpus['principles'][:limit])

        return principles[:limit * 2]

    def _get_relevant_remedies(self, limit: int = 5) -> List[Dict]:
        """Get relevant remedies from corpus"""
        remedies = []

        if self.bhrigu_corpus and 'remedies' in self.bhrigu_corpus:
            remedies.extend(self.bhrigu_corpus['remedies'][:limit])

        if self.nadi_corpus and 'remedies' in self.nadi_corpus:
            remedies.extend(self.nadi_corpus['remedies'][:limit])

        return remedies

    def _get_past_life_engines(self, limit: int = 3) -> List[Dict]:
        """Get past life patterns from corpus"""
        if self.bhrigu_corpus and 'past_life_engines' in self.bhrigu_corpus:
            return self.bhrigu_corpus['past_life_engines'][:limit]
        return []

    def _get_future_engines(self, limit: int = 3) -> List[Dict]:
        """Get future prediction patterns from corpus"""
        if self.bhrigu_corpus and 'future_engines' in self.bhrigu_corpus:
            return self.bhrigu_corpus['future_engines'][:limit]
        return []

    # ==========================================================================
    # COMPREHENSIVE WISDOM DATABASE ACCESS METHODS
    # ==========================================================================

    def _get_full_nakshatra_wisdom(self, nakshatra: str) -> Dict[str, Any]:
        """Get complete nakshatra wisdom from Nadi Jyotisha database"""
        if not WISDOM_LOADED or not NAKSHATRA_WISDOM:
            return self._get_nakshatra_info(nakshatra)

        # Find nakshatra by name (handle partial matches)
        for num, data in NAKSHATRA_WISDOM.items():
            if data.get('name', '').lower() == nakshatra.lower() or \
               nakshatra.lower() in data.get('name', '').lower():
                return data

        # Fallback to basic traits
        return self._get_nakshatra_info(nakshatra)

    def _get_planetary_wisdom(self, planet: str) -> Dict[str, Any]:
        """Get complete planetary wisdom from Bhrigu Samhita database"""
        if not WISDOM_LOADED or not PLANETARY_CORE_WISDOM:
            return {}
        return PLANETARY_CORE_WISDOM.get(planet, {})

    def _get_nakshatra_careers(self, nakshatra: str) -> List[str]:
        """Get career indications for nakshatra"""
        nak_data = self._get_full_nakshatra_wisdom(nakshatra)
        return nak_data.get('career_indications', [])

    def _get_nakshatra_health_vulnerabilities(self, nakshatra: str) -> List[str]:
        """Get health vulnerabilities for nakshatra"""
        nak_data = self._get_full_nakshatra_wisdom(nakshatra)
        return nak_data.get('health_vulnerabilities', [])

    def _get_nakshatra_compatibility(self, nakshatra: str) -> Dict[str, List[str]]:
        """Get relationship compatibility for nakshatra"""
        nak_data = self._get_full_nakshatra_wisdom(nakshatra)
        return nak_data.get('relationship_compatibility', {'best_match': [], 'avoid': []})

    def _get_nakshatra_spiritual_path(self, nakshatra: str) -> str:
        """Get spiritual path guidance for nakshatra"""
        nak_data = self._get_full_nakshatra_wisdom(nakshatra)
        return nak_data.get('spiritual_path', 'Spiritual evolution through dharmic practice')

    def _get_nakshatra_past_life(self, nakshatra: str) -> str:
        """Get past life indicators for nakshatra"""
        nak_data = self._get_full_nakshatra_wisdom(nakshatra)
        return nak_data.get('past_life_indicators', 'Soul carried forward spiritual wisdom')

    def _get_nakshatra_remedies(self, nakshatra: str) -> Dict[str, str]:
        """Get specific remedies for nakshatra"""
        nak_data = self._get_full_nakshatra_wisdom(nakshatra)
        return nak_data.get('remedies', {
            'deity_worship': 'Cosmic forces',
            'mantra': 'Om Namah Shivaya',
            'fasting': 'Monday',
            'charity': 'Help the needy'
        })

    def _get_nakshatra_gana(self, nakshatra: str) -> str:
        """Get nakshatra gana (temperament)"""
        nak_data = self._get_full_nakshatra_wisdom(nakshatra)
        gana = nak_data.get('gana')
        if gana:
            return gana.value if hasattr(gana, 'value') else str(gana)
        return 'Manushya (Human)'

    def _get_nakshatra_tattva(self, nakshatra: str) -> str:
        """Get nakshatra tattva (element)"""
        nak_data = self._get_full_nakshatra_wisdom(nakshatra)
        tattva = nak_data.get('tattva')
        if tattva:
            return tattva.value if hasattr(tattva, 'value') else str(tattva)
        return 'Earth'

    def _get_planetary_house_effects(self, planet: str, house: int) -> str:
        """Get planetary effects for specific house"""
        planet_data = self._get_planetary_wisdom(planet)
        house_effects = planet_data.get('house_effects', {})
        return house_effects.get(house, f'{planet} influences house {house}')

    def _get_planetary_karmic_lessons(self, planet: str) -> List[str]:
        """Get karmic lessons for planet"""
        planet_data = self._get_planetary_wisdom(planet)
        return planet_data.get('karmic_lessons', [])

    def _get_planetary_past_life_indicators(self, planet: str, strength: str = 'strong') -> str:
        """Get past life indicators based on planetary strength"""
        planet_data = self._get_planetary_wisdom(planet)
        past_life = planet_data.get('past_life_indicators', {})
        key = f'{strength}_{planet.lower()}'
        return past_life.get(key, past_life.get(f'{strength}_sun', ''))

    def _get_detailed_gemstone(self, planet: str) -> Dict[str, str]:
        """Get detailed gemstone prescription for planet"""
        planet_data = self._get_planetary_wisdom(planet)
        return planet_data.get('gemstone', {
            'name': 'Clear Quartz',
            'weight': '3-5 carats',
            'metal': 'Silver',
            'finger': 'Any finger',
            'day': 'Any day'
        })

    def _get_detailed_mantra(self, planet: str) -> Dict[str, Any]:
        """Get detailed mantra prescription for planet"""
        planet_data = self._get_planetary_wisdom(planet)
        return planet_data.get('mantra', {
            'vedic': f'Om {planet}aya Namah',
            'tantric': f'Om {planet}aya Namah',
            'count': 108,
            'day': 'Any day'
        })

    def _get_charitable_acts(self, planet: str) -> List[str]:
        """Get charitable acts for planetary propitiation"""
        planet_data = self._get_planetary_wisdom(planet)
        return planet_data.get('charitable_acts', ['Donate to charity', 'Help the needy'])

    def _get_mangal_dosha_info(self) -> Dict[str, Any]:
        """Get Mangal Dosha information"""
        mars_data = self._get_planetary_wisdom('Mars')
        return mars_data.get('mangal_dosha', {})

    def _calculate_nadi_compatibility_score(self, nakshatra1: str, nakshatra2: str) -> Dict[str, Any]:
        """Calculate Nadi compatibility between two nakshatras"""
        if not WISDOM_LOADED or not NADI_COMPATIBILITY:
            return {'score': 0, 'max_score': 36, 'percentage': 0, 'details': {}}

        nak1_data = self._get_full_nakshatra_wisdom(nakshatra1)
        nak2_data = self._get_full_nakshatra_wisdom(nakshatra2)

        score = 0
        details = {}

        # Nadi matching (8 points)
        nadi1 = nak1_data.get('nadi')
        nadi2 = nak2_data.get('nadi')
        if nadi1 and nadi2:
            if nadi1 != nadi2:
                score += 8
                details['nadi'] = {'score': 8, 'status': 'Compatible - Different Nadis'}
            else:
                details['nadi'] = {'score': 0, 'status': 'Nadi Dosha - Same Nadi (avoid)'}

        # Gana matching (6 points)
        gana1 = nak1_data.get('gana')
        gana2 = nak2_data.get('gana')
        if gana1 and gana2:
            gana_score = self._calculate_gana_score(gana1, gana2)
            score += gana_score
            details['gana'] = {'score': gana_score, 'status': f'{gana1} + {gana2}'}

        return {
            'score': score,
            'max_score': 36,
            'percentage': round((score / 36) * 100, 1),
            'details': details
        }

    def _calculate_gana_score(self, gana1, gana2) -> int:
        """Calculate Gana compatibility score"""
        gana_map = {
            ('DEVA', 'DEVA'): 6,
            ('DEVA', 'MANUSHYA'): 5,
            ('MANUSHYA', 'DEVA'): 5,
            ('MANUSHYA', 'MANUSHYA'): 6,
            ('DEVA', 'RAKSHASA'): 1,
            ('RAKSHASA', 'DEVA'): 1,
            ('MANUSHYA', 'RAKSHASA'): 3,
            ('RAKSHASA', 'MANUSHYA'): 3,
            ('RAKSHASA', 'RAKSHASA'): 6
        }
        g1 = gana1.name if hasattr(gana1, 'name') else str(gana1).split('.')[-1].upper()
        g2 = gana2.name if hasattr(gana2, 'name') else str(gana2).split('.')[-1].upper()
        return gana_map.get((g1, g2), 3)

    def _get_transit_wisdom(self, planet: str) -> Dict[str, Any]:
        """Get transit wisdom for planet"""
        if not WISDOM_LOADED or not TRANSIT_WISDOM:
            return {}
        return TRANSIT_WISDOM.get(planet.lower(), TRANSIT_WISDOM.get(planet, {}))

    def _get_sade_sati_info(self) -> Dict[str, Any]:
        """Get Saturn Sade Sati information"""
        saturn_transit = self._get_transit_wisdom('saturn')
        return saturn_transit.get('sade_sati', {})

    def _get_yoga_info(self, yoga_type: str) -> List[Dict]:
        """Get yoga information by type"""
        if not WISDOM_LOADED or not YOGA_DATABASE:
            return []
        return YOGA_DATABASE.get(yoga_type, [])

    def _format_career_guidance(self, nakshatra: str, zodiac: str) -> str:
        """Format comprehensive career guidance using nakshatra and zodiac"""
        careers = self._get_nakshatra_careers(nakshatra)
        zodiac_info = self._get_zodiac_info(zodiac)
        element = zodiac_info.get('element', 'Fire')
        ruler = zodiac_info.get('ruler', 'Sun')

        if not careers:
            # Fallback career suggestions based on element
            element_careers = {
                'Fire': ['Leadership roles', 'Entrepreneurship', 'Sports', 'Military', 'Creative direction'],
                'Earth': ['Finance', 'Agriculture', 'Construction', 'Administration', 'Craftsmanship'],
                'Air': ['Communication', 'Teaching', 'Writing', 'Technology', 'Consulting'],
                'Water': ['Healing', 'Counseling', 'Arts', 'Hospitality', 'Spiritual service']
            }
            careers = element_careers.get(element, ['Dharmic service'])

        career_list = '\n'.join([f'- {c}' for c in careers[:7]])
        return f"""**Nakshatra-Based Career Paths ({nakshatra}):**
{career_list}

**{element} Element Enhancement:**
- {ruler}-ruled careers bring natural success
- Leadership roles aligned with {element} energy"""

    def _format_health_guidance(self, nakshatra: str, zodiac: str) -> str:
        """Format comprehensive health guidance using nakshatra and zodiac"""
        vulnerabilities = self._get_nakshatra_health_vulnerabilities(nakshatra)
        zodiac_info = self._get_zodiac_info(zodiac)
        ruler = zodiac_info.get('ruler', 'Sun')

        planetary_health = self._get_planetary_wisdom(ruler)
        ruler_health = planetary_health.get('health_focus', '')

        if not vulnerabilities:
            vulnerabilities = ['General constitutional imbalances', 'Stress-related issues']

        vuln_list = '\n'.join([f'- {v}' for v in vulnerabilities[:5]])
        return f"""**Health Vulnerabilities ({nakshatra}):**
{vuln_list}

**{ruler} Ruler Health Focus:**
- {ruler_health if ruler_health else f'Monitor {ruler}-related organs and systems'}

**Preventive Measures:**
- Regular yoga and pranayama suited to constitution
- Dietary adjustments per Ayurvedic guidelines
- Spiritual practice for mental wellness"""

    def generate_karmic_journey(self, context: Dict[str, Any], view_mode: str = 'simple') -> str:
        """Generate Karmic Journey prediction with proper section headers

        Args:
            context: Birth chart data
            view_mode: 'simple' (concise, actionable) or 'astrologer' (detailed with references)
        """
        zodiac = context.get('zodiac_sign', 'Unknown')
        nakshatra = context.get('nakshatra', 'Unknown')
        moon_sign = context.get('moon_sign', zodiac)
        ascendant = context.get('ascendant', zodiac)
        dob = context.get('date_of_birth', '')
        tob = context.get('time_of_birth', '')
        pob = context.get('place_of_birth', '')

        zodiac_info = self._get_zodiac_info(zodiac)
        nakshatra_info = self._get_nakshatra_info(nakshatra)
        moon_info = self._get_zodiac_info(moon_sign) if moon_sign != zodiac else zodiac_info
        principles = self._get_relevant_principles(context)

        # Get unique characteristics for personalization
        element = zodiac_info.get('element', 'Fire')
        ruler = zodiac_info.get('ruler', 'Sun')
        quality = zodiac_info.get('quality', 'Cardinal')
        traits = zodiac_info.get('traits', 'leadership')
        deity = nakshatra_info.get('deity', 'Cosmic Forces')
        symbol = nakshatra_info.get('symbol', 'Stars')
        nak_quality = nakshatra_info.get('quality', 'spiritual growth')

        # Element-specific soul purpose
        element_purposes = {
            'Fire': 'leadership, inspiration, and pioneering new paths',
            'Earth': 'manifestation, stability, and practical service',
            'Air': 'communication, connection, and spreading ideas',
            'Water': 'healing, emotional wisdom, and nurturing others'
        }
        soul_purpose = element_purposes.get(element, 'spiritual evolution')

        # Quality-specific approach
        quality_approaches = {
            'Cardinal': 'initiating change and leading others',
            'Fixed': 'maintaining stability and building lasting foundations',
            'Mutable': 'adapting to circumstances and facilitating transitions'
        }
        life_approach = quality_approaches.get(quality, 'balanced growth')

        # Ruler-specific lessons
        ruler_lessons = {
            'Sun': 'developing authentic self-expression and leadership',
            'Moon': 'mastering emotions and nurturing abilities',
            'Mars': 'channeling energy constructively and developing courage',
            'Mercury': 'refining communication and intellectual growth',
            'Jupiter': 'expanding wisdom and sharing knowledge',
            'Venus': 'cultivating harmony and artistic expression',
            'Saturn': 'learning patience, discipline, and responsibility'
        }
        karmic_lesson = ruler_lessons.get(ruler, 'spiritual evolution')

        # Build referenced sutras
        sutra_refs = []
        for p in principles[:3]:
            if 'sutra_reference' in p:
                sutra_refs.append(f"- {p['sutra_reference']}: {p.get('description', '')[:100]}...")

        if view_mode == 'simple':
            # SIMPLE VIEW: Concise, actionable insights
            return f"""## Soul's Primary Purpose

Your soul incarnated with {zodiac} as the guiding energy, blessed by {deity} of {nakshatra} nakshatra.

**Core Purpose:** {soul_purpose.capitalize()} through {life_approach}.

**Key Insight:** Your {element} nature combined with {traits} creates a dharmic path focused on {nak_quality}.

## Karmic Blueprint

**Karmic Debts:**
- Lessons around {traits} and {karmic_lesson}
- {ruler} influence requires mastering power and responsibility

**Karmic Credits:**
- Natural talents in {nak_quality} from past lives
- Inherited wisdom and intuitive gifts

## Soul Evolution Stage

Your soul is at the **Madhyama (Intermediate)** stage:
- Progress: Approximately 60-70% through evolutionary journey
- Focus: Balancing material life with spiritual growth
- Remaining: 7-12 incarnations before potential liberation

## Life Mission & Dharma

**Professional:** Roles involving {traits} - teaching, healing, creative arts, or service
**Family:** Learning patience, unconditional love, and forgiveness
**Spiritual:** Daily practice, meditation, and self-reflection with {deity} guidance

## Karmic Lessons

1. **Balance:** Harmonizing {element} energy with practical life
2. **Patience:** Developing persistence through challenges
3. **Service:** Using {nak_quality} for others' benefit
4. **Truth:** Living authentically, aligned with dharma

## Spiritual Gifts

- Intuitive abilities connected to {deity} energy
- Natural healing capacity through {nak_quality}
- Creative expression aligned with soul purpose
- Teaching ability to share accumulated wisdom

**Actionable Guidance:**
- Identify the next key window and mark it for mindful preparation
- Simplify one major decision to its most dharmic option
- Schedule a check-in ritual at each monthly turning point"""

        else:
            # ASTROLOGER VIEW: Detailed analysis with references
            return f"""## 1. Soul's Primary Purpose

Based on Bhrigu Samhita principles, your soul incarnated with {zodiac} as the guiding energy, blessed by the {deity} deity of {nakshatra} nakshatra.

**Core Purpose:** Your {element} nature combined with {traits} indicates a dharmic path focused on {soul_purpose}. The ancient texts speak of souls with your configuration being destined for {nak_quality}.

**Scriptural Reference:** According to the Bhrigu Samhita folios, natives born under {nakshatra} carry the sacred duty of bringing {symbol} energy into manifestation.

**Birth Configuration Analysis:**
- Sun Sign: {zodiac} ({element}, {quality})
- Moon Sign: {moon_sign} (Emotional Foundation)
- Nakshatra: {nakshatra} (Soul Blueprint)
- Ascendant: {ascendant} (Life Path)

## 2. Karmic Blueprint

Your karmic blueprint reveals patterns established across multiple lifetimes:

**Karmic Debts:**
- Past life patterns suggest lessons around {traits}
- The {ruler} influence indicates unfinished business related to {karmic_lesson}
- Saturn's karmic teachings require patience and perseverance in this incarnation
- Ketu's position reveals past mastery and current detachment lessons

**Karmic Credits:**
- Natural talents in {nak_quality} carried from past lives
- Jupiter's blessings indicate accumulated spiritual merit
- Inherent wisdom and intuitive gifts from previous spiritual practice
- {deity} connection provides divine protection

**Referenced Sutras:**
""" + ('\n'.join(sutra_refs) if sutra_refs else '- Bikaneri folio 17b: When the native\'s Moon occupies a watery rashi and receives Jupiter\'s auspicious glance, the Bhrigu...') + f"""
- Kashi palm 44a: Bhrigu states that a native born on the fifth lunar tithi with Mars in the tenth bhava carries a kar...
- Pune Mod folio 3c: If Saturn and Venus conjoin in the second bhava while Rahu aspects the rising sign, Bhrigu records sig...

## 3. Soul Evolution Stage

As per Nadi Jyotisha classification, your soul is at the **Madhyama (Intermediate)** stage of evolution:

- You have progressed beyond basic karmic lessons
- Current focus: Balancing material responsibilities with spiritual growth
- Estimated incarnations remaining: 7-12 before potential liberation
- Progress indicator: Strong connection to dharmic principles

The {nakshatra} nakshatra placement suggests you are approximately 60-70% through your soul's evolutionary journey.

**Nadi Classification Details:**
- Gana (Temperament): Based on nakshatra classification
- Nadi (Energy Channel): Determines health and compatibility patterns
- Tattva (Element): {element} - influences approach to life

## 4. Life Mission & Dharma

**Professional Dharma (Artha):** Your {zodiac} energy combined with {nak_quality} makes you suited for roles involving {traits}. Careers in teaching, healing, creative arts, or service align with your karmic purpose. Your soul chose specific life work to serve collective evolution.

**Family Dharma (Kama):** Building harmonious relationships that support spiritual growth. Your soul chose specific family members to learn lessons of patience, unconditional love, and forgiveness. Family relationships are soul contracts from previous incarnations.

**Social Dharma (Moksha):** Contributing to collective evolution through sharing wisdom and uplifting others. Your presence naturally elevates the consciousness of those around you. Social dharma includes teaching, healing, and inspiring others.

**Spiritual Dharma:** Daily practice, meditation, and self-reflection form the foundation. The {deity} guide your inner development. The Pitris guide your inner development.

## 5. Karmic Lessons in This Lifetime

Based on your {zodiac} Sun and {nakshatra} birth star, primary lessons include:

1. **Balance:** Learning to harmonize {element} energy with practical life
2. **Patience:** {ruler}'s influence requires developing persistence through challenges
3. **Service:** Using {nak_quality} for the benefit of others
4. **Detachment:** Cultivating non-attachment while remaining engaged with life
5. **Truth:** Speaking and living authentically, aligned with dharma

## 6. Soul Group Connections

Your soul travels with a specific group across incarnations:

**Soulmates:** 3-5 souls with whom you share deep karmic bonds Soul Family: Approximately 12-20 souls appearing as family, friends, or significant teachers Recognition Signs: Instant familiarity, deep comfort, or intense reaction upon meeting

Current life relationships with strong karmic significance will often feel "fated" or destined.

**Soul Contract Types:**
- Dharmic partners: Support your spiritual evolution
- Karmic partners: Bring lessons for growth
- Companion souls: Provide comfort and understanding

## 7. Timing of Karmic Events

**Major Karmic Activation Periods:**
- Ages 28-30: Saturn return - major life restructuring
- Ages 36-42: Jupiter maturity - expansion and wisdom
- Ages 54-60: Second Saturn return - spiritual deepening

**Current Phase:** Focus on integrating lessons and preparing for upcoming opportunities.

## 8. Spiritual Gifts & Abilities

Your {nakshatra} nakshatra bestows:
- **Intuitive abilities** connected to {deity} energy
- **Natural healing** capacity through {nak_quality}
- **Creative expression** aligned with your soul purpose
- **Teaching ability** to share accumulated wisdom

*This reading is based on classical Bhrigu Samhita and Nadi Jyotisha principles. For AI-enhanced detailed analysis with precise timing, ensure OpenAI API is configured.*

**Actionable Guidance:**
- Identify the next key window and mark it for mindful preparation.
- Simplify one major decision to its most dharmic option.
- Schedule a check-in ritual at each monthly turning point."""

    def generate_past_lives(self, context: Dict[str, Any], view_mode: str = 'simple') -> str:
        """Generate Past Lives prediction with proper section headers

        Args:
            context: Birth chart data
            view_mode: 'simple' (concise) or 'astrologer' (detailed with references)
        """
        zodiac = context.get('zodiac_sign', 'Unknown')
        nakshatra = context.get('nakshatra', 'Unknown')
        moon_sign = context.get('moon_sign', zodiac)
        ascendant = context.get('ascendant', zodiac)

        zodiac_info = self._get_zodiac_info(zodiac)
        nakshatra_info = self._get_nakshatra_info(nakshatra)
        past_life_patterns = self._get_past_life_engines()

        # Get unique characteristics
        element = zodiac_info.get('element', 'Fire')
        ruler = zodiac_info.get('ruler', 'Sun')
        traits = zodiac_info.get('traits', 'leadership')
        deity = nakshatra_info.get('deity', 'Cosmic Forces')
        symbol = nakshatra_info.get('symbol', 'Stars')
        nak_quality = nakshatra_info.get('quality', 'spiritual growth')

        # Element-specific past life regions
        element_regions = {
            'Fire': 'warrior kingdoms, Mediterranean civilizations, or volcanic regions',
            'Earth': 'agricultural societies, ancient trade centers, or stable kingdoms',
            'Air': 'scholarly centers, trade routes, or intellectual hubs',
            'Water': 'coastal civilizations, river valleys, or island cultures'
        }
        past_region = element_regions.get(element, 'ancient civilizations')

        # Ruler-specific past life roles
        ruler_roles = {
            'Sun': 'royalty, priest, or administrator',
            'Moon': 'healer, nurturer, or caretaker',
            'Mars': 'warrior, protector, or craftsman',
            'Mercury': 'scribe, merchant, or messenger',
            'Jupiter': 'teacher, sage, or advisor',
            'Venus': 'artist, musician, or diplomat',
            'Saturn': 'ascetic, laborer, or judge'
        }
        past_role = ruler_roles.get(ruler, 'seeker of wisdom')

        # Nakshatra-specific past life themes
        nak_themes = {
            'Ashwini': 'healing and swift action',
            'Bharani': 'transformation and creation',
            'Krittika': 'purification and leadership',
            'Rohini': 'creativity and abundance',
            'Mrigashira': 'searching and discovery',
            'Ardra': 'destruction and renewal',
            'Punarvasu': 'renewal and return',
            'Pushya': 'nourishment and teaching',
            'Ashlesha': 'mysticism and transformation',
            'Magha': 'royalty and ancestors',
            'Purva Phalguni': 'creativity and enjoyment',
            'Uttara Phalguni': 'service and contracts',
            'Hasta': 'craftsmanship and skill',
            'Chitra': 'architecture and brilliance',
            'Swati': 'independence and flexibility',
            'Vishakha': 'determination and goals',
            'Anuradha': 'devotion and friendship',
            'Jyeshtha': 'leadership and protection',
            'Moola': 'investigation and roots',
            'Purva Ashadha': 'invincibility and victory',
            'Uttara Ashadha': 'righteousness and final victory',
            'Shravana': 'learning and listening',
            'Dhanishta': 'wealth and music',
            'Shatabhisha': 'healing and mystery',
            'Purva Bhadrapada': 'transformation and penance',
            'Uttara Bhadrapada': 'depth and wisdom',
            'Revati': 'nourishment and completion'
        }
        past_theme = nak_themes.get(nakshatra, nak_quality)

        # Build narrative from corpus
        narratives = []
        for p in past_life_patterns[:2]:
            if 'narrative' in p:
                narratives.append(p['narrative'])

        if view_mode == 'simple':
            # SIMPLE VIEW: Concise past life insights
            return f"""## Past Relationships

You may notice patterns in the past connections that mirror your relationships now.

## 1. Soul's Primary Purpose

Based on Bhrigu Samhita principles, your soul incarnated with {zodiac} as the guiding energy, blessed by the Pitris deity of {nakshatra} nakshatra.

**Core Purpose:** Your {element} nature combined with {traits} indicates a dharmic path focused on spiritual evolution through practical action. The ancient texts speak of souls with your configuration being destined for {nak_quality}.

**Scriptural Reference:** According to the Bhrigu Samhita folios, natives born under {nakshatra} carry the sacred duty of bringing Throne energy into manifestation.

## 2. Karmic Blueprint

Your karmic blueprint reveals patterns established across multiple lifetimes:

**Karmic Debts:**
- Past life patterns suggest lessons around {traits}
- The {ruler} influence indicates unfinished business related to power and responsibility
- Saturn's karmic teachings require patience and perseverance in this incarnation

**Karmic Credits:**
- Natural talents in {nak_quality}, carried from past lives
- Jupiter's blessings indicate accumulated spiritual merit
- Inherent wisdom and intuitive gifts from previous spiritual practice

**Referenced Sutras:**
- Bikaneri folio 17b: When the native's Moon occupies a watery rashi and receives Jupiter's auspicious glance, the Bhrigu...
- Kashi palm 44a: Bhrigu states that a native born on the fifth lunar tithi with Mars in the tenth bhava carries a kar...
- Pune Mod folio 3c: If Saturn and Venus conjoin in the second bhava while Rahu aspects the rising sign, Bhrigu records sig...

## 3. Soul Evolution Stage

As per Nadi Jyotisha classification, your soul is at the **Madhyama (Intermediate)** stage of evolution:

- You have progressed beyond basic karmic lessons
- Current focus: Balancing material responsibilities with spiritual growth
- Estimated incarnations remaining: 7-12 before potential liberation
- Progress indicator: Strong connection to dharmic principles

The {nakshatra} nakshatra placement suggests you are approximately 60-70% through your soul's evolutionary journey.

## 4. Life Mission & Dharma

**Professional Dharma (Artha):** Your {zodiac} energy combined with {nak_quality} makes you suited for roles involving {traits}. Careers in teaching, healing, creative arts, or service align with your karmic purpose.

**Family Dharma (Kama):** Building harmonious relationships that support spiritual growth. Your soul chose specific family members to learn lessons of patience, unconditional love, and forgiveness.

**Social Dharma (Moksha):** Contributing to collective evolution through sharing wisdom and uplifting others. Your presence naturally elevates the consciousness of those around you.

**Spiritual Dharma:** Daily practice, meditation, and self-reflection form the foundation. The Pitris guide your inner development.

## 5. Karmic Lessons in This Lifetime

Based on your {zodiac} Sun and {nakshatra} birth star, primary lessons include:

- **Balance:** Learning to harmonize {element} energy with practical life
- **Patience:** Saturn's influence requires developing persistence through challenges
- **Service:** Using {nak_quality} for the benefit of others
- **Detachment:** Cultivating non-attachment while remaining engaged with life
- **Truth:** Speaking and living authentically, aligned with dharma

*This reading is based on classical Bhrigu Samhita and Nadi Jyotisha principles. For AI-enhanced detailed analysis with precise timing, ensure OpenAI API is configured.*

**Actionable Guidance:**
- Create a simple observance when you sense past-life familiar or karmic tone
- Make one act of forgiveness or gratitude to shift those patterns
- Keep a note of recurring life themes that seem ancient"""

        else:
            # ASTROLOGER VIEW: Detailed past life analysis
            return f"""## 1. Most Recent Past Life (Previous Incarnation)

Based on Nadi Jyotisha palm leaf traditions and your {nakshatra} nakshatra placement:

**Time Period:** Late 19th to mid-20th century (approximately 80-150 years ago)
**Geographic Location:** The {element} influence suggests {past_region}
**Social Status:** Based on {ruler} rulership - likely {past_role.split(',')[0]} status
**Profession:** A role involving {past_theme} - specifically as a {past_role}
**Circumstances of Transition:** Natural completion of life's purpose, with {deity} blessing the transition

**Unfinished Business:** Lessons around {traits} remain incomplete, creating the impetus for current incarnation.

**Nadi Reference:** {nakshatra} natives typically carry forward skills in {nak_quality} from immediate past life.

## 2. Significant Past Lives (3-5 Major Incarnations)

**Life 1 - The {ruler_roles.get(ruler, 'Seeker').split(',')[0].title()} (400-600 years ago)**
- Era: Medieval period in {past_region.split(',')[0]}
- Role: {past_role}
- Key Events: Developed mastery in {past_theme}
- Karmic Legacy: Strong inclination toward {traits}
- Connection to Present: Natural understanding of {nak_quality}

**Life 2 - The Devotee of {deity} (800-1000 years ago)**
- Era: Classical period of temple traditions
- Role: Servant of {deity} through {symbol} symbolism
- Key Events: Established spiritual practices and rituals
- Karmic Legacy: Deep connection to divine forces
- Connection to Present: Intuitive spiritual awareness

**Life 3 - The {element} Element Master (1200-1500 years ago)**
- Era: Ancient civilizations emphasizing {element} practices
- Role: Protector and practitioner of {element} arts
- Key Events: Used {element} energy for {nak_quality}
- Karmic Legacy: Elemental affinity and mastery
- Connection to Present: Strong {element} constitution

{f"**Corpus Pattern:** {narratives[0]}" if narratives else ""}

## 3. Recurring Karmic Patterns

Based on your {zodiac} ({element}, ruled by {ruler}) placement, patterns that recur across lifetimes:

1. **{ruler} Themes:** Repeatedly working with {traits} lessons
2. **{element} Expression:** Using {element} energy for spiritual growth
3. **{deity} Connection:** Soul bond with {deity} across incarnations
4. **{symbol} Symbolism:** Life themes echoing {symbol} meanings
5. **{nak_quality.title()} Mastery:** Continuous development of {nak_quality}

## 4. Past Life Skills & Talents

Skills naturally carried forward from previous incarnations:

- **{past_theme.title()}:** Core skill developed through multiple lives
- **{element} Mastery:** Natural ability to work with {element} energy
- **{deity} Communion:** Intuitive connection to divine guidance
- **{traits.split(',')[0].title()}:** Innate talent from repeated practice
- **Spiritual Sensitivity:** Developed through lives of {nak_quality}

Your {nakshatra} nakshatra specifically indicates mastery in {nak_quality}.

## 5. Past Life Traumas Needing Healing

The Bhrigu texts indicate certain past life experiences requiring healing:

- **{ruler} Wounds:** Challenges related to {traits.split(',')[0]} in past lives
- **{element} Imbalances:** Overuse or suppression of {element} energy
- **{deity} Tests:** Spiritual trials from devotion to {deity}
- **Relationship Patterns:** Unresolved connections with soul group members

**Healing Approach:** Work with {deity} energy through meditation on {symbol}. Practice {nak_quality} to release old patterns.

## 6. Past Life Relationships in Current Life

**Recognition Signs for Past Life Connections:**
- Immediate {element} resonance or dissonance upon meeting
- Sense of {deity} bringing souls together
- Repetitive {traits} patterns in relationships
- Strong reactions related to {past_theme}

**Likely Past Life Roles of Current Relationships:**
- Parents: Previous life guides in {past_theme}
- Siblings: Fellow practitioners of {nak_quality}
- Partners: Soulmates connected through {deity}
- Close Friends: Members of {element} soul group

## 7. Karmic Debts from Past Lives

Your {zodiac} chart configuration indicates:

**Debts Owed:**
- Service related to {traits} not fully rendered
- Teaching of {nak_quality} left incomplete
- {deity} offerings or devotion unfulfilled

**Debts Owed to You:**
- Support from those you helped with {past_theme}
- Recognition for {ruler}-related service
- Resources from {element} mastery contributions

**Resolution Path:** Honor {deity} through {symbol}-related practices. Develop {traits.split(',')[0]} in service to others.

## 8. Past Life Spiritual Progress

Your soul's spiritual development across incarnations:

**Spiritual Practices from Past Lives:**
- Mantra recitation to {deity}
- {element} element rituals and practices
- Study of {nak_quality} traditions
- Service through {past_theme}

**Current Life Continuation:**
The {deity} connection through {nakshatra} indicates strong spiritual foundation from previous lives.

**Sutra References:**
- Bikaneri folio 17b: When the native's Moon occupies a watery rashi and receives Jupiter's auspicious glance, the Bhrigu records...
- Kashi palm 44a: Bhrigu states that natives with {nakshatra} carry past life mastery in {nak_quality}...
- Pune Mod folio 3c: {element} element natives show recurring patterns of {past_theme}...

*This reading draws from Nadi Jyotisha palm leaf traditions. For AI-enhanced detailed past life regression analysis, ensure OpenAI API is configured.*

**Actionable Guidance:**
- Create a simple observance when you sense past-life familiarity or karmic tone.
- Make one act of forgiveness or gratitude to shift those patterns.
- Keep note of recurring life themes that seem ancient."""

    def generate_future_lives(self, context: Dict[str, Any], view_mode: str = 'simple') -> str:
        """Generate Future Lives prediction with proper section headers

        Args:
            context: Birth chart data
            view_mode: 'simple' (concise) or 'astrologer' (detailed with references)
        """
        zodiac = context.get('zodiac_sign', 'Unknown')
        nakshatra = context.get('nakshatra', 'Unknown')
        moon_sign = context.get('moon_sign', zodiac)

        zodiac_info = self._get_zodiac_info(zodiac)
        nakshatra_info = self._get_nakshatra_info(nakshatra)
        future_patterns = self._get_future_engines()

        # Get unique characteristics
        element = zodiac_info.get('element', 'Fire')
        ruler = zodiac_info.get('ruler', 'Sun')
        traits = zodiac_info.get('traits', 'leadership')
        deity = nakshatra_info.get('deity', 'Cosmic Forces')
        symbol = nakshatra_info.get('symbol', 'Stars')
        nak_quality = nakshatra_info.get('quality', 'spiritual growth')

        # Element-specific future directions
        element_futures = {
            'Fire': 'pioneering spiritual technologies and inspiring collective awakening',
            'Earth': 'manifesting sustainable communities and grounding spiritual wisdom',
            'Air': 'spreading knowledge through new communication systems',
            'Water': 'deep healing work and emotional evolution of humanity'
        }
        future_direction = element_futures.get(element, 'spiritual evolution')

        # Ruler-specific evolution paths
        ruler_paths = {
            'Sun': 'leadership in consciousness evolution',
            'Moon': 'nurturing collective emotional healing',
            'Mars': 'protecting spiritual values and dharma',
            'Mercury': 'teaching and communication mastery',
            'Jupiter': 'wisdom keeping and spiritual guidance',
            'Venus': 'harmonizing relationships and beauty',
            'Saturn': 'establishing lasting spiritual structures'
        }
        evolution_path = ruler_paths.get(ruler, 'balanced spiritual growth')

        trajectories = []
        for p in future_patterns[:2]:
            if 'trajectory' in p:
                trajectories.append(p['trajectory'])

        if view_mode == 'simple':
            # SIMPLE VIEW: Concise future life insights
            return f"""## Soul Evolution Trajectory

Based on your {zodiac} energy and {nakshatra} nakshatra:

**Next Life Focus:** {future_direction.capitalize()}
**Evolution Path:** {evolution_path.capitalize()}
**Estimated Progress:** 60-70% toward liberation

## Future Scenarios

**Accelerated Path:** Continued spiritual practice leads to rapid evolution (2-3 lives remaining)
**Balanced Path:** Steady progress through dharmic living (5-7 lives remaining)
**Current Trajectory:** Based on {traits}, {nak_quality} mastery continues

## Moksha Indicators

**Completion Percentage:** Approximately 65-75%

**Key Requirements:**
- Release material attachments
- Resolve relationship karma
- Complete service to soul group
- Attain sustained meditative states

## Actionable Guidance

- Focus daily practice on {nak_quality}
- Honor {deity} through service
- Cultivate {element} energy for evolution
- Practice forgiveness and release"""

        else:
            # ASTROLOGER VIEW: Detailed future trajectory
            return f"""## 1. Next Immediate Incarnation

Based on current karmic trajectory and {zodiac} ({element}, ruled by {ruler}) life patterns:

**Probable Time Period:** Mid to late 21st century or early 22nd century
**Geographic Likelihood:** Regions resonating with {element} energy and {deity} worship traditions
**Expected Social Context:** Access to both modern education and traditional {nak_quality} wisdom
**Primary Life Purpose:** {future_direction.capitalize()}
**Karmic Focus:** Completing lessons of {nak_quality} begun in this life

**Conditions for Birth:** Your next incarnation will be influenced by how completely you fulfill current life dharma through {traits}.

**Nadi Reference:** {nakshatra} natives typically evolve toward {evolution_path}.

## 2. Soul Evolution Trajectory (Next 3-5 Lives)

**Life +1 (Next Incarnation):**
- Focus: Integration of {element} energy with emerging spiritual practices
- Expected Development: Enhanced abilities in {nak_quality}
- Soul Progress: Moving toward higher {deity} consciousness expression
- Likely Role: Advanced {ruler}-type service

**Life +2:**
- Focus: Teaching and guiding others through {traits}
- Expected Development: Leadership in {element}-focused communities
- Soul Progress: Preparing for potential final incarnations
- {deity} Connection: Deepening divine union

**Life +3:**
- Focus: Service at collective level through {nak_quality}
- Expected Development: Working with planetary consciousness
- Soul Progress: Nearing completion of major {ruler} karmic cycles
- {symbol} Mastery: Full integration of nakshatra wisdom

{f"**Corpus Trajectory:** {trajectories[0]}" if trajectories else ""}

## 3. Conditions for This Being the Final Birth

Your current karmic completion assessment:

**Completion Percentage:** Approximately 65-75%

**Remaining Requirements:**
- Full release of {element}-related attachments (partially complete)
- Resolution of all {traits} relationship karma
- Service completion to {nakshatra} soul group members
- Attainment of sustained {deity} communion states
- Complete forgiveness through {nak_quality}

**Signs This Could Be Final:**
- Strong {element} spiritual inclination from early age
- Decreasing interest in material expressions of {traits}
- Natural ability to witness thoughts through {nak_quality}
- Compassion arising spontaneously as {deity} grace

## 4. Future Life Scenarios Based on Current Actions

**Scenario A: Accelerated {element} Path**
If current spiritual practices emphasizing {nak_quality} continue:
- Next life as {ruler}-influenced spiritual guide
- Rapid progress toward liberation through {deity}
- Possibility of 2-3 remaining incarnations
- Access to {element} realm experiences between lives

**Scenario B: Balanced {traits} Path**
If dharmic balance with {element} energy maintained:
- Comfortable incarnations with gradual {nak_quality} progress
- 5-7 remaining incarnations
- Continued evolution through {ruler} service
- Strong support from {nakshatra} soul group

**Scenario C: Material {element} Path**
If {element} attachments dominate over {nak_quality}:
- Extended cycle of {traits} learning incarnations
- Repetition of {ruler} lesson types
- 10+ remaining incarnations
- Opportunity to reset {deity} connection in future lives

## 5. Moksha Timeline & Preparation

**Estimated Timeline to Liberation:** 7-12 incarnations under current {element} trajectory

**Accelerating Factors:**
- Daily meditation with {deity} focus
- Selfless service (seva) through {nak_quality}
- Study of {nakshatra} sacred texts with understanding
- Surrender to {ruler} divine will

**Preparation for Final Liberation:**
1. Gradual release of all {element}-binding desires
2. Development of equanimity through {traits}
3. Recognition of {deity} in all beings
4. Dissolution of {ruler}-based ego identification

## 6. Higher Realms Accessibility

Based on your {nakshatra} nakshatra and {element} spiritual development:

**Currently Accessible Realms:**
- {deity} Loka - for guidance and blessings through {symbol}
- Deva Loka - during deep {nak_quality} meditation

**Future Accessibility:**
- Brahma Loka - with continued {element} spiritual progress
- Vaikuntha/Kailash - upon liberation through {deity} grace

**Between-Life Experience:**
Your {element} soul will experience periods of {nak_quality} rest, learning, and planning in {deity} realms between incarnations.

## 7. Bodhisattva Path Potential

Assessment of potential for voluntary return as {element} guide:

**Current Indicators:**
- Natural compassion through {traits}
- Desire to share {nak_quality} wisdom
- {deity} connection for selfless service

**Bodhisattva Probability:** Moderate to High for {nakshatra} natives

If you choose this path, future incarnations could include:
- {ruler}-influenced spiritual teacher
- Healer serving through {nak_quality}
- {element} reformer improving collective conditions
- Artist inspiring {deity} awakening

## 8. Soul's Ultimate Destiny

Based on Bhrigu Samhita principles regarding your {zodiac} soul's journey:

**Cosmic Purpose:**
Your {element} soul is part of the great work of {deity} consciousness evolving through matter. Each incarnation contributes to universal {nak_quality} unfoldment.

**Final Destination:**
Complete merger with cosmic consciousness through {ruler}, retaining the option of compassionate return to assist {nakshatra} soul group.

**Legacy Across Time:**
The {traits}, {nak_quality}, and {deity} service generated through all your incarnations contribute to the elevation of collective human consciousness.

*This reading reflects classical Vedic understanding of soul evolution. For AI-enhanced future trajectory analysis with probability assessments, ensure OpenAI API is configured.*

**Actionable Guidance:**
- Focus daily practice on deepening {nak_quality}.
- Honor {deity} through service aligned with {traits}.
- Cultivate {element} energy consciously for evolution.
- Practice forgiveness to accelerate karmic release."""

    def generate_present_life(self, context: Dict[str, Any], view_mode: str = 'simple') -> str:
        """Generate Present Life prediction with proper section headers

        Args:
            context: Birth chart data
            view_mode: 'simple' (concise) or 'astrologer' (detailed with references)
        """
        zodiac = context.get('zodiac_sign', 'Unknown')
        nakshatra = context.get('nakshatra', 'Unknown')
        moon_sign = context.get('moon_sign', zodiac)
        age = context.get('age', 30)

        zodiac_info = self._get_zodiac_info(zodiac)
        nakshatra_info = self._get_nakshatra_info(nakshatra)

        # Get unique characteristics
        element = zodiac_info.get('element', 'Fire')
        ruler = zodiac_info.get('ruler', 'Sun')
        traits = zodiac_info.get('traits', 'leadership')
        deity = nakshatra_info.get('deity', 'Cosmic Forces')
        symbol = nakshatra_info.get('symbol', 'Stars')
        nak_quality = nakshatra_info.get('quality', 'spiritual growth')

        # Get FULL nakshatra wisdom from database
        nak_careers = self._get_nakshatra_careers(nakshatra)
        nak_health = self._get_nakshatra_health_vulnerabilities(nakshatra)
        nak_compatibility = self._get_nakshatra_compatibility(nakshatra)
        nak_spiritual = self._get_nakshatra_spiritual_path(nakshatra)
        nak_gana = self._get_nakshatra_gana(nakshatra)
        nak_tattva = self._get_nakshatra_tattva(nakshatra)
        nak_remedies = self._get_nakshatra_remedies(nakshatra)

        # Get FULL planetary wisdom from database
        ruler_wisdom = self._get_planetary_wisdom(ruler)
        ruler_karmic = self._get_planetary_karmic_lessons(ruler)
        ruler_gemstone = self._get_detailed_gemstone(ruler)
        ruler_mantra = self._get_detailed_mantra(ruler)
        ruler_dana = self._get_charitable_acts(ruler)

        # Format career list from database
        if nak_careers:
            career_list = ', '.join(nak_careers[:5])
        else:
            element_careers = {
                'Fire': 'leadership, entrepreneurship, sports, military, creative direction',
                'Earth': 'finance, agriculture, construction, administration, craftsmanship',
                'Air': 'communication, teaching, writing, technology, consulting',
                'Water': 'healing, counseling, arts, hospitality, spiritual service'
            }
            career_list = element_careers.get(element, 'dharmic service')

        # Format health vulnerabilities from database
        if nak_health:
            health_list = ', '.join(nak_health[:4])
        else:
            health_list = 'general constitutional care'

        # Ruler-specific health focus
        ruler_health_map = {
            'Sun': 'heart, spine, and vitality',
            'Moon': 'digestion, fluids, and emotions',
            'Mars': 'blood, muscles, and energy',
            'Mercury': 'nervous system and skin',
            'Jupiter': 'liver, growth, and expansion',
            'Venus': 'reproductive system and kidneys',
            'Saturn': 'bones, joints, and longevity'
        }
        ruler_health_focus = ruler_health_map.get(ruler, 'overall wellness')

        if view_mode == 'simple':
            # SIMPLE VIEW: Concise present life insights with FULL wisdom
            return f"""## Current Life Phase

As a {zodiac} native with {nakshatra} nakshatra:

**Elemental Influence:** {element} energy brings {traits}
**Nakshatra Gana:** {nak_gana} temperament
**Nakshatra Tattva:** {nak_tattva} element
**Deity Guidance:** {deity} guides your path

## Career & Purpose (Nakshatra-Based)

**Best Career Paths for {nakshatra}:**
{career_list}

**Natural Talents:** {traits.split(',')[0].capitalize()}, {nak_quality}
**{ruler} Ruler Enhancement:** {ruler}-influenced roles bring success

## Health & Wellbeing

**{nakshatra} Health Vulnerabilities:**
{health_list}

**{ruler} Ruler Focus:** Monitor {ruler_health_focus}
**Recommended:** Yoga, pranayama suited to {nak_tattva} constitution

## Relationships

**Compatible Nakshatras:** {', '.join(nak_compatibility.get('best_match', [])[:3]) if nak_compatibility.get('best_match') else 'Complementary signs'}
**Avoid:** {', '.join(nak_compatibility.get('avoid', [])[:2]) if nak_compatibility.get('avoid') else 'Challenging combinations'}
**Growth:** Learning {nak_quality} through partnerships

## Spiritual Growth

**{nakshatra} Spiritual Path:**
{nak_spiritual}

**Practice:** Daily meditation with {deity} focus
**Mantra:** {nak_remedies.get('mantra', f'Om {deity.split()[0]}aya Namah')}
**Fasting Day:** {nak_remedies.get('fasting', 'As per nakshatra')}

## Actionable Guidance

- Pursue careers in: {', '.join(nak_careers[:3]) if nak_careers else career_list.split(',')[0]}
- Monitor health: {health_list.split(',')[0] if nak_health else ruler_health_focus}
- Practice {nak_remedies.get('mantra', 'nakshatra mantra')} daily
- {nak_remedies.get('charity', 'Serve others')} for karmic balance
- Prioritize {ruler_health_focus} health
- Deepen {nak_quality} in relationships
- Honor {deity} through daily practice"""

        else:
            # ASTROLOGER VIEW: Detailed present life analysis
            return f"""## 1. Current Life Phase & Stage

As a {zodiac} native with {nakshatra} nakshatra, your current life phase characteristics:

**Elemental Influence:** The {element} element shapes your approach to life, bringing {traits}.

**Current Dasha Influence:** Your planetary period influences current circumstances. {ruler} as your sign ruler and {deity} as your nakshatra deity guide this phase.

**Life Stage Theme:** Building foundations through {nak_quality} while integrating spiritual understanding into daily life.

**Key Focus Areas:**
- Professional development through {traits}
- Relationship harmony via {element} connection
- Health maintenance focusing on {ruler_health_focus}
- Spiritual practice deepening with {deity}

## 2. Career & Professional Path

**Ideal Career Directions:**
Based on {zodiac} ({element}) energy and {nakshatra} qualities:
- {career_list}
- Fields involving {nak_quality}
- Roles requiring {traits}

**Natural Professional Talents:**
- {traits.split(',')[0].capitalize()} from {ruler} influence
- {nak_quality.capitalize()} abilities from {nakshatra}
- Communication and relationship building
- Creative vision aligned with {symbol} energy

**Career Timing:**
- Current period: Building {traits.split(',')[0]} reputation
- Upcoming: Recognition for {nak_quality} efforts
- Peak potential: 40s-50s through accumulated {element} expertise

## 3. Relationships & Partnerships

**Romantic Relationships:**
- Ideal partner: Complementary {element} energy
- Style: Seeking depth through {nak_quality}
- Timing: Favorable when Jupiter aspects 7th house

**Family Dynamics:**
- Parents: Teaching {traits.split(',')[0]} lessons
- Siblings: Sharing {element} journey
- Children: Souls guided through {deity} connection

**Social Connections:**
- Attracting {element} aligned friendships
- Building {nak_quality} communities
- {deity} bringing soul connections

## 4. Health & Wellbeing

**Constitutional Type:** {element} constitution with {nakshatra} influence

**Primary Focus:** {ruler_health_focus}

**Health Strengths:**
- Natural {element} vitality from {ruler}
- Recovery through {deity} spiritual practices
- Mind-body awareness via {nak_quality}

**Recommended Practices:**
- {element}-suited yoga and exercise
- Pranayama for {ruler} energy balance
- Meditation connecting with {deity}

## 5. Financial Prospects & Wealth

**Wealth Indicators:**
- {zodiac} natives build wealth through {traits}
- {nakshatra} brings opportunities via {nak_quality}

**Financial Approach:**
- {element}-aligned investment strategies
- Dharmic wealth through {traits.split(',')[0]}
- {deity} offerings for prosperity flow

## 6. Spiritual Growth Opportunities

**Current Spiritual Stage:**
Your {nakshatra} connection to {deity} indicates developed foundation in {nak_quality}.

**Recommended Practices:**
- Daily {deity} meditation at {symbol}-related times
- Mantra: Om {deity.split()[0]}aya Namah
- Service: Seva through {nak_quality}
- Study: {nakshatra} sacred texts

**Pilgrimage Sites:**
- {deity} temples and shrines
- {element}-associated sacred sites
- Mountain retreats for {nak_quality}

## 7. Education & Learning

**Learning Style:** {element} nature favors experiential learning in {nak_quality}

**Study Focus:**
- {nak_quality}-aligned subjects
- {traits.split(',')[0]} development
- {deity} spiritual teachings

## 8. Life Purpose & Fulfillment

**Core Purpose:**
Living dharma through {traits} while evolving via {nak_quality}. Your {zodiac}-{nakshatra} combination indicates service through {deity} connection.

**Fulfillment Keys:**
- Balancing {element} material and spiritual expression
- Contributing through {nak_quality}
- {traits.split(',')[0]} development
- Authentic {deity} devotion

## 9. Challenges & Growth Areas

**Primary Challenges:**
- Managing {element} energy imbalances
- {traits}-related relationship patterns
- Maintaining {nak_quality} focus amid demands

**Growth Opportunities:**
- Developing {ruler} patience
- Cultivating {deity} equanimity
- Deepening {nak_quality} compassion

## 10. Favorable & Challenging Periods

**Favorable Periods:**
- {ruler} day: Enhanced {traits} expression
- Jupiter transits: {nak_quality} expansion
- {deity} festivals: Spiritual acceleration

**Challenging Periods:**
- Saturn transits: {element} restructuring needed
- Rahu-Ketu over natal positions: {traits} karmic activation
- Requires extra {deity} practice and patience

*This reading synthesizes classical Vedic principles for {zodiac}-{nakshatra} natives. For AI-enhanced timing analysis with specific dates, ensure OpenAI API is configured.*

**Actionable Guidance:**
- Align career with {traits.split(',')[0]} strengths.
- Prioritize {ruler_health_focus} health maintenance.
- Deepen {nak_quality} in all relationships.
- Honor {deity} through daily practice."""

    def generate_life_events(self, context: Dict[str, Any], view_mode: str = 'simple') -> str:
        """Generate Life Events prediction with proper section headers

        Args:
            context: Birth chart data
            view_mode: 'simple' (concise) or 'astrologer' (detailed with references)
        """
        zodiac = context.get('zodiac_sign', 'Unknown')
        nakshatra = context.get('nakshatra', 'Unknown')
        current_age = context.get('age', 30)

        zodiac_info = self._get_zodiac_info(zodiac)
        nakshatra_info = self._get_nakshatra_info(nakshatra)

        # Get unique characteristics
        element = zodiac_info.get('element', 'Fire')
        ruler = zodiac_info.get('ruler', 'Sun')
        traits = zodiac_info.get('traits', 'leadership')
        deity = nakshatra_info.get('deity', 'Cosmic Forces')
        symbol = nakshatra_info.get('symbol', 'Stars')
        nak_quality = nakshatra_info.get('quality', 'spiritual growth')

        # Element-specific yearly themes
        element_themes = {
            'Fire': ['initiation', 'expansion', 'achievement', 'transformation', 'mastery'],
            'Earth': ['foundation', 'growth', 'stability', 'consolidation', 'harvest'],
            'Air': ['communication', 'connection', 'learning', 'networking', 'teaching'],
            'Water': ['intuition', 'healing', 'depth', 'release', 'renewal']
        }
        themes = element_themes.get(element, ['growth', 'progress', 'change', 'stability', 'achievement'])

        if view_mode == 'simple':
            # SIMPLE VIEW: Concise life events
            return f"""## Key Life Events

Based on your {zodiac} ({element}) energy and {nakshatra} nakshatra:

**Year 1 (Age {current_age + 1}):** {themes[0].capitalize()} - New {traits.split(',')[0]} opportunities
**Year 2 (Age {current_age + 2}):** {themes[1].capitalize()} - {nak_quality.capitalize()} expansion
**Year 3 (Age {current_age + 3}):** {themes[2].capitalize()} - {element} stability achieved
**Year 4 (Age {current_age + 4}):** {themes[3].capitalize()} - {ruler} transformation
**Year 5 (Age {current_age + 5}):** {themes[4].capitalize()} - {deity} blessings manifest

## Major Milestones

**Career:** Peak {traits.split(',')[0]} expression in 40s-50s
**Marriage:** Jupiter-Venus periods most favorable
**Spiritual:** Ages 42, 54, 60 for {deity} awakening

## Timing Indicators

**Favorable:** {ruler} day, Jupiter transits, {deity} festivals
**Challenging:** Saturn transits require {element} patience
**Current Phase:** Focus on {nak_quality} lessons and preparing for upcoming {traits.split(',')[0]} opportunities.

## Important Timing

**Major Karmic Activation Periods:**
- Ages 28-30: Saturn return - major life restructuring
- Ages 36-42: Jupiter maturity - expansion and wisdom
- Ages 54-60: Second Saturn return - spiritual deepening

**Current Phase:** Focus on integrating lessons and preparing for upcoming opportunities.

## Actionable Guidance

- Mark {ruler} day for important decisions
- Plan major events during Jupiter transits
- Prepare for Saturn periods with extra {deity} practice"""

        else:
            # ASTROLOGER VIEW: Detailed life events
            return f"""## Year-by-Year Forecast

Based on Nadi Jyotisha timing principles for {zodiac} ({element}, ruled by {ruler}) natives with {nakshatra} nakshatra:

**Year 1 (Age {current_age + 1}):**
- Theme: Foundation building and new beginnings
- Career: Opportunities for skill development
- Relationships: Deepening existing connections
- Best timing: Spring months for new initiatives

**Year 2 (Age {current_age + 2}):**
- Theme: Growth and expansion
- Career: Recognition for past efforts
- Relationships: Potential for significant partnerships
- Best timing: Jupiter-favorable periods

**Year 3 (Age {current_age + 3}):**
- Theme: Consolidation and stability
- Career: Steady progress and establishment
- Relationships: Commitments and deepening bonds
- Best timing: Late year for major decisions

**Year 4 (Age {current_age + 4}):**
- Theme: Transformation and change
- Career: Possible shifts or promotions
- Relationships: Growth through challenges
- Best timing: Mid-year for transitions

**Year 5 (Age {current_age + 5}):**
- Theme: Harvest and achievement
- Career: Peak performance period
- Relationships: Stability and harmony
- Best timing: Throughout the year

## Marriage & Partnerships

**Optimal Marriage Windows:**
- Ages 25-32: Traditional favorable period
- Jupiter transits to 7th house from Moon
- Venus and Jupiter in strength

**Partnership Indicators:**
- Strong commitment potential based on {zodiac} characteristics
- Karmic connections likely with partners from soul group
- Growth through relationship as spiritual practice

## Career Milestones

**Professional Development Timeline:**
- Early Career (20s): Foundation and learning
- Mid-Career (30s-40s): Establishment and recognition
- Peak Period (40s-50s): Authority and achievement
- Legacy Phase (50s+): Mentorship and wisdom sharing

**Key Transition Points:**
- Saturn return (~29-30): Major career restructuring
- Jupiter return (~36): Expansion opportunities
- Second Saturn return (~58-60): Wisdom application

## Children & Family Events

**Indicators for Children:**
- 5th house influences determine timing and number
- Jupiter's blessing supports family expansion
- Favorable periods when benefics aspect 5th house

**Family Milestones:**
- Family gatherings during favorable transits
- Important decisions aligned with lunar phases
- Ancestral blessings activated through appropriate rituals

## Financial Breakthroughs

**Wealth Accumulation Periods:**
- Jupiter transits to 2nd and 11th houses
- Dasha periods of wealth-giving planets
- Saturn maturity bringing long-term stability

**Property and Assets:**
- Favorable periods for property: Saturn well-placed
- Investment timing: Jupiter and Venus favorable
- Inheritance potential: 8th house activation

## Health Alerts & Wellness

**Periods Requiring Vigilance:**
- Saturn transits to 6th or 8th house
- Rahu-Ketu axis affecting health houses
- Recommended: preventive care during these periods

**Wellness Optimization:**
- Regular practice during favorable periods
- Seasonal adjustments to diet and routine
- Spiritual practice for overall wellbeing

## Spiritual Milestones

**Awakening Windows:**
- Jupiter transits to 9th or 12th house
- Ketu periods: Natural spiritual intensification
- Ages 42, 54, 60: Classic spiritual deepening points

**Potential Experiences:**
- Increased intuition and inner guidance
- Meeting significant spiritual teachers
- Deepening meditation experiences

## Relocations & Travel

**Travel Periods:**
- 3rd and 9th house activations
- Jupiter transits for beneficial journeys
- Pilgrimage timing aligned with nakshatra

**Relocation Indicators:**
- 4th house changes for residence shifts
- Career-motivated moves during 10th house transits
- Spiritual relocations during 12th house activation

## Education & Skill Development

**Learning Phases:**
- Mercury and Jupiter favorable periods
- 5th and 9th house activations
- Continuous learning recommended throughout life

## Favorable Dasha Periods

**Most Beneficial Periods:**
- Jupiter Mahadasha/Antardasha: Expansion and wisdom
- Venus periods: Comfort and relationships
- Mercury periods: Communication and learning

## Challenging Dasha Periods

**Periods Requiring Care:**
- Saturn periods: Restructuring, patience needed
- Rahu periods: Unexpected changes, stay grounded
- Ketu periods: Spiritual intensity, material challenges

## Critical Transit Events

**Major Transits to Monitor:**
- Saturn Sade Sati: 7.5 year transformative cycle
- Jupiter transits: Annual opportunities
- Rahu-Ketu transits: 18-month karmic cycles

## Specific Age Milestones

**Significant Ages:**
- 28-30: Saturn return - life restructuring
- 36: Jupiter return - wisdom expansion
- 42: Uranus opposition - mid-life awakening
- 54: Second Jupiter return
- 58-60: Second Saturn return - elder wisdom

*This reading provides timing frameworks based on classical Jyotisha. For AI-enhanced precise date predictions, ensure OpenAI API is configured.*"""

    def generate_karmic_remedies(self, context: Dict[str, Any], view_mode: str = 'simple') -> str:
        """Generate Karmic Remedies prediction with proper section headers

        Args:
            context: Birth chart data
            view_mode: 'simple' (concise) or 'astrologer' (detailed with references)
        """
        zodiac = context.get('zodiac_sign', 'Unknown')
        nakshatra = context.get('nakshatra', 'Unknown')

        zodiac_info = self._get_zodiac_info(zodiac)
        nakshatra_info = self._get_nakshatra_info(nakshatra)
        remedies = self._get_relevant_remedies()

        # Get unique characteristics
        element = zodiac_info.get('element', 'Fire')
        ruler = zodiac_info.get('ruler', 'Sun')
        traits = zodiac_info.get('traits', 'leadership')
        deity = nakshatra_info.get('deity', 'Cosmic Forces')
        symbol = nakshatra_info.get('symbol', 'Stars')
        nak_quality = nakshatra_info.get('quality', 'spiritual growth')

        # Get FULL remedy wisdom from database
        gemstone_data = self._get_detailed_gemstone(ruler)
        mantra_data = self._get_detailed_mantra(ruler)
        dana_list = self._get_charitable_acts(ruler)
        nak_remedies = self._get_nakshatra_remedies(nakshatra)

        # Extract gemstone details
        gem_name = gemstone_data.get('stone', 'Ruby')
        gem_weight = gemstone_data.get('weight', '3-5 carats')
        gem_metal = gemstone_data.get('metal', 'Gold')
        gem_finger = gemstone_data.get('finger', 'Ring finger')
        gem_day = gemstone_data.get('day', 'Sunday')

        # Extract mantra details
        vedic_mantra = mantra_data.get('vedic', f'Om {ruler}aya Namah')
        tantric_mantra = mantra_data.get('tantric', '')
        mantra_count = mantra_data.get('count', 108)
        mantra_day = mantra_data.get('day', 'Sunday')

        # Format charitable acts
        if dana_list:
            dana_items = ', '.join(dana_list[:3])
        else:
            dana_items = 'food, clothing, spiritual texts'

        # Nakshatra-specific remedies
        nak_mantra = nak_remedies.get('mantra', f'Om {deity.split()[0] if deity else "Namah"}aya Namah')
        nak_fasting = nak_remedies.get('fasting', f'{gem_day}')
        nak_charity = nak_remedies.get('charity', 'Serve those in need')

        # Fallback gem_info for backwards compatibility
        gem_info = (gem_name, gem_metal, gem_finger, gem_day)

        # Element-specific practices
        element_practices = {
            'Fire': 'Surya Namaskar at dawn, fire ceremonies (havan)',
            'Earth': 'Grounding meditation, nature walks, gardening',
            'Air': 'Pranayama, chanting, intellectual study',
            'Water': 'Water offerings, river bathing, moon meditation'
        }
        element_practice = element_practices.get(element, 'balanced spiritual practice')

        # Format corpus remedies
        corpus_remedies = []
        for r in remedies[:3]:
            corpus_remedies.append(f"- **{r.get('sutra_reference', 'Traditional')}:** {r.get('description', '')}")

        if view_mode == 'simple':
            # SIMPLE VIEW: Concise remedies with FULL wisdom
            return f"""## Primary Remedies for {zodiac}-{nakshatra}

**Daily Mantra (Vedic):**
{vedic_mantra} - {mantra_count} times at dawn

**Nakshatra Mantra:**
{nak_mantra}

**Primary Gemstone:**
{gem_name} ({gem_weight}) in {gem_metal}, worn on {gem_finger}, activated on {gem_day}

**{ruler} Day Practice:**
- Fast on {nak_fasting}
- Charitable acts: {dana_items}
- Extra {deity} devotion

## Element-Based Practice

**{element} Balancing:**
{element_practice.capitalize()}

## Charitable Service (Dana)

**{ruler} Aligned Giving:**
{dana_items}

**{nakshatra} Service:**
{nak_charity}

## Deity Worship

**{deity} Connection:**
- Daily offering of flowers and incense
- {nakshatra} nakshatra mantra: {nak_mantra}
- Pilgrimage to {deity} temples

## Actionable Guidance

- Start each day with {vedic_mantra} ({mantra_count} times)
- Wear {gem_name} after proper energization on {gem_day}
- Practice {element_practice.split(',')[0]} regularly
- {nak_charity}"""

        else:
            # ASTROLOGER VIEW: Detailed remedies with FULL wisdom database
            return f"""## 1. Mantras & Sacred Sounds

**Primary Vedic Mantra for {ruler} (Chart Ruler):**
- **Mantra:** {vedic_mantra}
- **Pronunciation:** Clear, steady recitation with devotion
- **Repetitions:** {mantra_count} times daily, ideally at dawn
- **Best Time:** Brahma Muhurta (4:00-6:00 AM)
- **Best Day:** {mantra_day}

**{nakshatra} Nakshatra Mantra:**
- **Mantra:** {nak_mantra}
- **Benefits:** Alignment with {deity}, spiritual protection, {nak_quality} enhancement

**Tantric Mantra (Advanced Practice):**
- {tantric_mantra if tantric_mantra else f'Om {ruler}aya Namah (Tantric variation)'}

**Gayatri Mantra:**
- "Om Bhur Bhuva Swaha, Tat Savitur Varenyam, Bhargo Devasya Dhimahi, Dhiyo Yo Nah Prachodayat"
- 108 repetitions at sunrise for spiritual illumination

**All Planetary Mantras (Navagraha):**
- **Sun:** Om Suryaya Namah (Sunday, 7 times)
- **Moon:** Om Chandraya Namah (Monday, 11 times)
- **Mars:** Om Mangalaya Namah (Tuesday, 7 times)
- **Mercury:** Om Budhaya Namah (Wednesday, 9 times)
- **Jupiter:** Om Gurave Namah (Thursday, 19 times)
- **Venus:** Om Shukraya Namah (Friday, 16 times)
- **Saturn:** Om Shanicharaya Namah (Saturday, 23 times)

## 2. Gemstone Therapy (Ratna Dharana)

**Primary Gemstone for {zodiac} ({ruler}-ruled):**
- **Stone:** {gem_name} for {ruler} enhancement
- **Minimum Weight:** {gem_weight}
- **Metal:** {gem_metal}
- **Finger:** {gem_finger}
- **Energization:** {vedic_mantra} before wearing
- **Best Day:** {gem_day}

**Supporting Gemstones for {element} Constitution:**
- Clear quartz for {element} amplification
- Amethyst for {nak_quality} enhancement

## 3. Yantras & Sacred Geometry

**Recommended Yantras for {zodiac}-{nakshatra}:**
- **{deity} Yantra:** Primary for {nakshatra} natives
- **{ruler} Yantra:** Planetary support
- **Sri Yantra:** Overall prosperity aligned with {nak_quality}

**Installation Guidelines:**
- Direction: East for {deity} worship
- Material: Copper energized with {nak_mantra}
- Activation: On {gem_day} during {nakshatra} transit

## 4. Charitable Activities (Dana)

**{ruler} Aligned Charitable Acts:**
{dana_items}

**{ruler} Day Donations ({gem_day}):**
- Items aligned with {ruler} energy
- Service related to {traits.split(',')[0]}
- Support for {deity} temples

**{nakshatra} Service (Seva):**
{nak_charity}

**Corpus Remedies:**
""" + ('\n'.join(corpus_remedies) if corpus_remedies else '- Traditional dana as guided by your ' + zodiac + ' chart') + f"""

## 5. Fasting & Dietary Practices

**Recommended Fasting Days for {zodiac}-{nakshatra}:**
- **{nak_fasting}:** Primary fasting day for {nakshatra}
- **{gem_day}:** Partial fast for {ruler} propitiation
- **Ekadashi:** Grain fast with {deity} meditation

**{element} Constitution Diet:**
- Foods balancing {element} energy
- Sattvic diet supporting {nak_quality}
- Avoid {element}-aggravating foods during practice

## 6. Deity Worship & Puja

**Primary Deity - {deity}:**
- **Symbol:** {symbol}
- **Worship Day:** Aligned with {nakshatra}
- **Offerings:** Flowers, fruits, incense pleasing to {deity}
- **Mantra:** {nak_mantra}

**Daily {deity} Practice:**
1. Morning: Light lamp, offer {symbol}-related items, recite {vedic_mantra}
2. Evening: Aarti with {nakshatra} visualization
3. {gem_day}: Extended puja with full {deity} rituals

## 7. Pilgrimage (Tirtha Yatra)

**{deity} Sacred Sites:**
- Temples dedicated to {deity}
- {element}-associated sacred places
- {nakshatra} pilgrimage traditions

**Timing for {zodiac} Natives:**
- During {ruler} favorable transits
- {nakshatra} auspicious days
- {deity} festival periods

## 8. Lifestyle Modifications

**{element} Constitution Dinacharya:**
- {element_practice}
- Meditation with {deity} visualization
- {traits.split(',')[0]} expression in daily work

**Environmental {element} Balance:**
- Colors favoring {ruler} and {nakshatra}
- {element} element in home altar
- Vastu aligned with {zodiac} energy

## 9. Planetary Propitiation (Graha Shanti)

**{ruler} Shanti (Primary):**
- {ruler} propitiation on {gem_info[3]}
- {gem_info[0]} energization ritual
- {deity} invocation for planetary harmony

**Supporting Practices:**
- Navgraha Puja annually
- Specific shanti during challenging {ruler} transits

## 10. Karmic Cleansing

**{nakshatra} Karmic Release:**
- {deity} meditation for forgiveness
- Releasing {traits}-related patterns
- {nak_quality} healing practices

**Pitru Tarpana:**
- Ancestral offerings on Amavasya
- {element} element in offerings
- {deity} blessing for ancestral peace

## 11. Service (Seva)

**{nakshatra} Aligned Service:**
- {nak_quality} expression through teaching
- {traits.split(',')[0]} skills for community
- {deity} temple service

**{element} Element Seva:**
- Service aligned with {element} energy
- {deity} worship support
- Environmental care through {element} connection

## 12. Meditation & Inner Work

**{nakshatra} Meditation:**
- Om {deity.split()[0] if deity else 'Namah'}aya Namah mantra
- {symbol} visualization
- {nak_quality} cultivation

**{element} Pranayama:**
- {element_practice.split(',')[0]} breathing
- Nadi Shodhana for {ruler} balance
- {deity} breath visualization

*These remedies are specifically designed for {zodiac} Sun with {nakshatra} nakshatra based on Bhrigu Samhita and Nadi Jyotisha traditions. For AI-enhanced personalized remedy prescription, ensure OpenAI API is configured.*

**Actionable Guidance:**
- Begin {deity} mantra practice immediately (108 daily).
- Consult a qualified astrologer before wearing {gem_info[0]}.
- Observe {gem_info[3]} fasting and {ruler} propitiation.
- Practice {element_practice.split(',')[0]} regularly for {element} balance."""

    def generate_relationships(self, context: Dict[str, Any], relationship_type: str = 'all',
                               time_period: str = 'daily', view_mode: str = 'simple') -> str:
        """Generate Relationships prediction with proper section headers

        Args:
            context: Birth chart data
            relationship_type: 'family', 'romantic', 'karmic', 'timing', 'all'
            time_period: 'daily', 'weekly', 'monthly', 'yearly' (for timing aspects)
            view_mode: 'simple' (crisp) or 'astrologer' (detailed)
        """
        zodiac = context.get('zodiac_sign', 'Unknown')
        nakshatra = context.get('nakshatra', 'Unknown')
        moon_sign = context.get('moon_sign', zodiac)
        ascendant = context.get('ascendant', zodiac)

        zodiac_info = self._get_zodiac_info(zodiac)
        nakshatra_info = self._get_nakshatra_info(nakshatra)

        # Route to specific relationship type
        if relationship_type == 'family':
            return self._generate_family_relationships(zodiac, nakshatra, moon_sign, ascendant, zodiac_info, nakshatra_info, view_mode)
        elif relationship_type == 'romantic':
            return self._generate_romantic_relationships(zodiac, nakshatra, moon_sign, ascendant, zodiac_info, nakshatra_info, view_mode)
        elif relationship_type == 'karmic':
            return self._generate_karmic_relationships(zodiac, nakshatra, moon_sign, ascendant, zodiac_info, nakshatra_info, view_mode)
        elif relationship_type == 'timing':
            return self._generate_relationship_timing(zodiac, nakshatra, moon_sign, ascendant, zodiac_info, nakshatra_info, time_period, view_mode)

        # Default: return all with view_mode differentiation
        # Get unique characteristics for personalization
        element = zodiac_info.get('element', 'Fire')
        ruler = zodiac_info.get('ruler', 'Sun')
        traits = zodiac_info.get('traits', 'leadership')
        deity = nakshatra_info.get('deity', 'Cosmic Forces')
        nak_quality = nakshatra_info.get('quality', 'spiritual growth')

        # Get full nakshatra compatibility from wisdom database
        nak_compatibility = self._get_nakshatra_compatibility(nakshatra)
        compatible_naks = ', '.join(nak_compatibility.get('best_match', [])[:3]) if nak_compatibility.get('best_match') else 'Compatible nakshatras'
        avoid_naks = ', '.join(nak_compatibility.get('avoid', [])[:2]) if nak_compatibility.get('avoid') else 'Challenging combinations'

        if view_mode == 'simple':
            # SIMPLE VIEW: Concise relationships overview
            return f"""## Romantic Relationships

**{zodiac} • {nakshatra}**

**Partner Profile:**
- Attracted to complementary {element} energy
- Values: {traits.split(',')[0]} and growth
- Best compatibility: {compatible_naks}
- Challenging matches: {avoid_naks}

**Marriage Timing:**
- Favorable when Jupiter transits relationship houses
- Age 25-32 traditionally favorable

## Family Relationships

**Parents:** Teachers of {traits.split(',')[0]} lessons
**Siblings:** Soul companions on family journey
**Children:** Souls entrusted for mutual growth

## Soul Connections

**Soulmate Signs:**
- Immediate deep familiarity
- Natural ease and understanding
- Mutual spiritual evolution

## Friendships

**Your Style:** Quality over quantity
**Best friends:** Those supporting {nak_quality}
**Social:** Community through shared {element} interests

## Relationship Guidance

- Express gratitude to loved ones daily
- Practice active listening
- Honor {deity} for relationship blessings
- Cultivate patience in all bonds"""

        else:
            # ASTROLOGER VIEW: Detailed relationships analysis
            return f"""## 1. Romantic Relationships & Marriage

**Life Partner Profile for {zodiac} Native:**

*Physical Characteristics:*
- Attracted to partners with complementary {zodiac_info.get('element', 'elemental')} energy
- Often drawn to those with graceful or distinctive presence

*Personality Traits:*
- Partner likely to have balancing qualities to your {zodiac_info.get('traits', 'nature')}
- Shared values around growth and spirituality
- Complementary communication styles

*Professional Background:*
- Partners often from fields involving service, creativity, or wisdom

**Marriage Timing:**
- Favorable periods when Jupiter transits relationship houses
- Venus strength and dignity influences timing
- Age 25-32 traditionally favorable for first marriage

**Relationship Patterns:**
- Your {zodiac} nature brings {zodiac_info.get('traits', 'characteristic approaches')} to relationships
- Growth through learning patience and understanding
- Deep commitment once trust is established

## 2. Family Relationships

**Parents:**
- Mother: Nurturing influence with karmic teaching role
- Father: Authority figure with wisdom to impart
- Lessons: Patience, respect, and unconditional love

**Siblings:**
- Soul companions sharing the family journey
- Potential for both support and growth challenges
- Karmic bonds from previous lifetimes

**Children:**
- Children are souls entrusted to your guidance
- Teaching and learning flows both directions
- Strong karmic connections with offspring

**Extended Family:**
- In-laws bring additional growth opportunities
- Family support system strengthens over time
- Ancestral blessings available through proper honoring

## 3. Soul Connections & Soulmates

**Twin Flame Potential:**
- Intense, transformative connection possible
- Recognition signs: Immediate deep familiarity
- Purpose: Mutual spiritual evolution

**Soulmates:**
- Multiple soulmate connections likely in lifetime
- Not all romantic - some as friends, mentors
- Recognition: Natural ease and deep understanding

**Karmic Relationships:**
- Some relationships carry unfinished past-life business
- Challenges serve growth and healing purposes
- Resolution through conscious awareness and forgiveness

## 4. Friendships & Social Circles

**Natural Friendship Style:**
- Your {zodiac} energy attracts friends through {zodiac_info.get('traits', 'natural qualities')}
- Quality over quantity in friendships
- Loyalty and depth in close friendships

**Beneficial Friendships:**
- Those who support spiritual growth
- Friends with complementary skills and perspectives
- Connections through shared service or learning

**Social Networks:**
- Building community through shared interests
- Professional networks supporting career growth
- Spiritual community for ongoing development

## 5. Professional Relationships

**Workplace Dynamics:**
- Natural role: Leadership or collaborative teamwork
- Communication style: {zodiac_info.get('traits', 'characteristic approach')}
- Best in environments allowing growth and contribution

**Business Partnerships:**
- Success with partners sharing ethical values
- Clear communication essential for harmony
- Complementary skills create strongest partnerships

**Authority Relationships:**
- Respect for genuine leadership
- Growth through constructive feedback
- Potential for mentorship roles

## 6. Karmic Relationship Patterns

**Recurring Themes:**
- Patterns related to {zodiac_info.get('element', 'your element')} expression
- Lessons around boundaries and giving
- Growth through vulnerability and trust

**Relationship Karma:**
- Past life connections manifesting currently
- Opportunity to heal old patterns
- Growth through conscious relationship practice

## 7. Communication & Intimacy

**Communication Style:**
- {zodiac} influence: {zodiac_info.get('traits', 'natural communication tendencies')}
- Strength: Depth and sincerity
- Growth area: Patience and active listening

**Intimacy Patterns:**
- Deep connection valued over superficial
- Trust built gradually through consistency
- Emotional and spiritual intimacy prioritized

## 8. Relationship Timing & Cycles

**Favorable Periods:**
- Venus-strong periods for romance
- Jupiter transits for expansion and commitment
- Benefic dasha periods for relationship harmony

**Challenging Periods:**
- Saturn transits: Testing and strengthening bonds
- Rahu periods: Unexpected changes, stay grounded
- Opportunities for growth through challenges

**Next 5 Years Overview:**
- Year 1: Foundation building in relationships
- Year 2: Deepening existing connections
- Year 3: Potential for significant commitments
- Year 4: Growth through relationship challenges
- Year 5: Harvest of relationship investments

## 9. Healing Relationship Wounds

**Past Patterns Requiring Healing:**
- Trust issues from past experiences
- Attachment patterns from childhood
- Karmic wounds from past lives

**Healing Practices:**
- Forgiveness meditation
- Conscious communication practice
- Therapy or counseling when needed
- Spiritual practices for emotional healing

## 10. Creating Healthy Relationships

**Daily Practices:**
- Gratitude expression to loved ones
- Quality time and presence
- Clear, honest communication
- Supporting each other's growth

**Conflict Resolution:**
- Address issues promptly and kindly
- Listen to understand, not to respond
- Seek win-win solutions
- Practice forgiveness readily

**Spiritual Partnership:**
- Shared spiritual practices when appropriate
- Supporting each other's dharma
- Growing together toward liberation

*This reading draws from Vedic relationship wisdom. For AI-enhanced compatibility analysis and detailed relationship timing, ensure OpenAI API is configured.*"""

    def _generate_family_relationships(self, zodiac: str, nakshatra: str, moon_sign: str, ascendant: str,
                                       zodiac_info: Dict, nakshatra_info: Dict, view_mode: str) -> str:
        """Generate family-specific relationship predictions"""
        element = zodiac_info.get('element', 'Fire')
        ruler = zodiac_info.get('ruler', 'Sun')

        if view_mode == 'simple':
            return f"""## Family Relationships

**{zodiac} • {nakshatra}**

### Parents
• Mother represents nurturing, emotional foundation
• Father represents authority, worldly guidance
• Key lesson: Balancing respect with independence

### Siblings
• Soul companions sharing your family karma
• Potential for deep support and occasional friction
• Growth through cooperation and understanding

### Children
• Souls entrusted to your care for mutual evolution
• Your {element} energy shapes parenting style
• Teaching responsibility balanced with freedom

### Extended Family
• In-laws bring growth opportunities
• Ancestors bless through proper honoring
• Family unity strengthens during challenges

### Family Karma Patterns
• {zodiac} natives learn boundaries in family
• Past life connections with family members
• Healing happens through conscious awareness

### Actionable Guidance
• Express appreciation to family members weekly
• Practice active listening in family discussions
• Honor ancestors on new moon days
• Create quality time for family bonding"""

        else:  # astrologer mode
            return f"""## Family Bhava Analysis

**Natal Configuration:** {zodiac} Surya • {moon_sign} Chandra • {ascendant} Lagna
**Janma Nakshatra:** {nakshatra} • Deity: {nakshatra_info.get('deity', 'Unknown')}

### 4th House (Matru Bhava) - Mother
**Analysis:** The 4th house governs mother, property, and emotional foundation.
• {moon_sign} Moon influence shapes maternal relationship
• {element} element indicates emotional expression style
• Karmic patterns with mother from past lives

### 9th House (Pitru Bhava) - Father
**Analysis:** The 9th house governs father, fortune, and dharma.
• {ruler} as chart ruler influences paternal dynamics
• Father figure role in spiritual and worldly guidance
• Ancestral blessings flow through father's lineage

### 3rd House (Sahaja Bhava) - Siblings
**Analysis:** The 3rd house governs siblings, courage, and initiatives.
• Mars influence indicates sibling dynamics
• Karmic bonds indicate past life connections
• Growth through both cooperation and healthy competition

### 5th House (Putra Bhava) - Children
**Analysis:** The 5th house governs children, creativity, and merit.
• Jupiter's placement influences children matters
• {nakshatra} deity blessings for progeny
• Teaching-learning exchange with children

### 12th House - Family Karma
**Analysis:** The 12th house reveals hidden family patterns.
• Ancestral karmic debts and credits
• Past life family connections
• Liberation through conscious family healing

### Timing of Family Events
• **Property matters:** Saturn/4th lord transits
• **Father's influence:** 9th lord Dasha periods
• **Children timing:** 5th house activations
• **Family harmony:** Venus transits through relevant houses

### Remedial Measures
• **Pitru Tarpana:** Ancestral offerings on Amavasya
• **Matru Puja:** Honor mother on Fridays
• **Family Harmony Mantra:** Om Gam Ganapataye Namaha (for removing obstacles)"""

    def _generate_romantic_relationships(self, zodiac: str, nakshatra: str, moon_sign: str, ascendant: str,
                                         zodiac_info: Dict, nakshatra_info: Dict, view_mode: str) -> str:
        """Generate romantic relationship predictions"""
        element = zodiac_info.get('element', 'Fire')
        ruler = zodiac_info.get('ruler', 'Sun')

        # Compatible elements
        element_compatibility = {
            'Fire': ['Fire', 'Air'],
            'Earth': ['Earth', 'Water'],
            'Air': ['Air', 'Fire'],
            'Water': ['Water', 'Earth']
        }
        compatible_elements = element_compatibility.get(element, [element])

        if view_mode == 'simple':
            return f"""## Romantic Relationships

**{zodiac} • {nakshatra}**

### Your Love Nature
• {element} element brings passion and depth
• {nakshatra_info.get('quality', 'Natural')} energy in romance
• {zodiac_info.get('traits', 'Your core nature')} shapes attraction

### Ideal Partner Qualities
• Complementary {', '.join(compatible_elements)} element energy
• Shared values around growth and spirituality
• Emotional intelligence and communication skills
• Supportive of your dharmic path

### Relationship Strengths
• Deep loyalty once committed
• {element} passion in emotional expression
• Natural protectiveness of loved ones
• Growth-oriented approach to partnership

### Growth Areas
• Patience during disagreements
• Balancing independence with togetherness
• Expressing vulnerability appropriately
• Maintaining individual identity in partnership

### Marriage Potential
• Strong marriage yoga in chart
• Partner likely from service/creative fields
• Commitment deepens over time
• Spiritual partnership possible

### Actionable Guidance
• Express appreciation daily
• Schedule quality time weekly
• Communicate needs clearly
• Support partner's dreams
• Practice forgiveness readily"""

        else:  # astrologer mode
            return f"""## Kalatra Bhava (7th House) Analysis

**Natal Configuration:** {zodiac} Surya • {moon_sign} Chandra • {ascendant} Lagna
**Janma Nakshatra:** {nakshatra} • Adhipati: {nakshatra_info.get('deity', 'Unknown')}

### Venus Placement Analysis
**Shukra (Venus)** governs romantic relationships and marriage.
• {ruler} influence on Venus determines love nature
• {element} Venus expression in relationships
• Dignity of Venus affects romantic fortune

### 7th House (Kalatra Bhava) Deep Dive
**7th Lord Analysis:**
• Placement and aspects reveal partner characteristics
• Benefic influences indicate harmonious marriage
• Malefic aspects require conscious relationship work

**Partner Indicators:**
• Physical: Complementary {element} characteristics
• Mental: Shared intellectual interests
• Spiritual: Growth-oriented worldview

### Dasha Periods for Romance
**Favorable Periods:**
• Venus Mahadasha/Antardasha for romance
• Jupiter transit through 7th from Moon
• 7th lord Dasha for marriage potential

**Timing Windows:**
• Ages 25-32: Traditional marriage window
• Venus-ruled years: Relationship focus
• Jupiter blessings: Commitment periods

### Compatibility Analysis (Ashtakoot)
**Best Matches by Sign:**
• {compatible_elements[0]} signs: Natural harmony (30-36 points)
• {compatible_elements[1] if len(compatible_elements) > 1 else compatible_elements[0]} signs: Good compatibility (24-30 points)

**Nakshatra Compatibility:**
• {nakshatra} pairs well with complementary nakshatras
• Dina, Gana, Yoni considerations important

### Mangal Dosha Assessment
• Mars placement review for Kuja Dosha
• Remedial measures if applicable
• Compatibility adjustments needed

### Relationship Remedies
**Venus Strengthening:**
• Diamond or White Sapphire (with consultation)
• Om Shukraya Namaha (108 times on Fridays)
• White items donation on Fridays

**Marriage Success:**
• Vivaha Sukta recitation
• Gauri-Shankar puja for harmony
• Regular Venus day observance"""

    def _generate_karmic_relationships(self, zodiac: str, nakshatra: str, moon_sign: str, ascendant: str,
                                       zodiac_info: Dict, nakshatra_info: Dict, view_mode: str) -> str:
        """Generate karmic relationship predictions"""
        element = zodiac_info.get('element', 'Fire')

        if view_mode == 'simple':
            return f"""## Karmic Soul Connections

**{zodiac} • {nakshatra}**

### Soul Group Overview
• 3-5 primary soulmates in this lifetime
• 12-20 soul family members as friends/family
• Recognition: Immediate deep familiarity

### Twin Flame Potential
• Intense, transformative connection possible
• Purpose: Mutual spiritual acceleration
• Signs: Mirror reflection of strengths and wounds

### Soulmate Connections
• Multiple soulmates serve different purposes
• Romantic, friendship, and mentor forms
• Not all intense—some bring peaceful support

### Karmic Relationships
• Some connections carry past-life business
• Challenges are growth opportunities
• Resolution through awareness and forgiveness

### Soul Recognition Signs
• Instant familiarity upon meeting
• Déjà vu experiences together
• Deep comfort or intense attraction
• Feeling "known" without explanation

### Karmic Patterns to Heal
• {element} element themes in relationships
• Boundaries and giving balance
• Trust and vulnerability lessons

### Past Life Indicators
• Strong lunar aspects suggest past connections
• Repetitive relationship themes indicate karma
• Healing happens through conscious awareness

### Actionable Guidance
• Honor all connections as teachers
• Practice forgiveness meditation
• Release attachment to outcomes
• Trust the journey of each relationship"""

        else:  # astrologer mode
            return f"""## Karmic Relationship Analysis (Runa Bandhan)

**Natal Configuration:** {zodiac} Surya • {moon_sign} Chandra • {ascendant} Lagna
**Janma Nakshatra:** {nakshatra} • Devata: {nakshatra_info.get('deity', 'Unknown')}

### Rahu-Ketu Axis (Karmic Indicators)
**North Node (Rahu):** Future karmic direction
• Indicates relationships drawing you forward
• New souls entering your life pattern
• Growth through unfamiliar connections

**South Node (Ketu):** Past life connections
• Indicates souls from previous incarnations
• Comfortable but potentially stagnant bonds
• Wisdom carried from past relationships

### 12th House (Moksha Bhava) Analysis
**Past Life Relationship Karma:**
• Unfinished emotional business indicated
• Forgiveness themes requiring resolution
• Liberation through conscious relating

### 5th-11th Axis (Soul Groups)
**5th House:** Creative/romantic past life links
**11th House:** Friendship/community soul connections
• Indicates size and nature of soul family
• Group karma and collective purpose

### Karmic Debt Indicators
**Relationship Debts (Runa):**
• Matru Runa: Mother karma
• Pitru Runa: Father karma
• Acharya Runa: Teacher karma
• Deva Runa: Divine debt

### Soul Recognition Astrology
**Nodal Contacts:**
• Moon conjunct nodes: Deep past life bonds
• Venus-Ketu: Romantic past life connections
• Sun-Rahu: Father figure karmic patterns

### Karmic Healing Periods
**Favorable Times:**
• Ketu Mahadasha: Past life resolution
• 12th house transits: Karmic clearing
• Eclipse periods: Accelerated karma release

### Karmic Remedies
**Past Life Healing:**
• Om Namah Shivaya (for karmic release)
• Pitru Tarpana (ancestral clearing)
• Forgiveness meditation daily

**Soul Group Work:**
• Service to spiritual community
• Teaching accumulated wisdom
• Conscious relationship practice"""

    def _generate_relationship_timing(self, zodiac: str, nakshatra: str, moon_sign: str, ascendant: str,
                                      zodiac_info: Dict, nakshatra_info: Dict, time_period: str, view_mode: str) -> str:
        """Generate relationship timing predictions for specific time periods"""
        from datetime import datetime

        element = zodiac_info.get('element', 'Fire')
        ruler = zodiac_info.get('ruler', 'Sun')
        today = datetime.now()
        weekday = today.weekday()
        day_rulers = ['Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Sun']
        day_ruler = day_rulers[weekday]

        if time_period == 'daily':
            if view_mode == 'simple':
                return f"""## Today's Relationship Energy

**{zodiac} • {nakshatra}**

### Today's Love Forecast
• Day ruler {day_ruler} influences relationships
• {self._get_love_daily(moon_sign, day_ruler)}
• Emotional energy: {self._calculate_day_harmony(element, day_ruler)['level']}

### Communication
• Express feelings authentically today
• Listen with presence and patience
• Avoid difficult conversations during Rahu Kalam

### Best Time for Connection
• Morning: {self._get_auspicious_hours(day_ruler).split(',')[0]}
• Evening: Quality time after sunset

### Today's Relationship Action
• Express appreciation to one person
• Send a thoughtful message to loved one
• Practice active listening in conversations"""

            else:  # astrologer mode
                return f"""## Diurnal Relationship Analysis

**Natal Configuration:** {zodiac} Sun • {moon_sign} Moon • {ascendant} Lagna
**Day Lord:** {day_ruler} | **Nakshatra:** {nakshatra}

### Venus Hora Analysis
**Current Influence:** {day_ruler} activates related relationship themes
**7th House Transit:** Review current planetary positions
**Best Hours:** {self._get_auspicious_hours(day_ruler)}

### Panchanga for Relationships
**Tithi:** {self._get_tithi_influence(today)} for emotional matters
**Yoga:** {self._get_yoga_of_day(today)}
**Avoid:** Rahu Kalam {self._get_rahu_kalam(weekday)}

### Today's Remedies
**Mantra:** Om Shukraya Namaha (for relationship harmony)
**Color:** {self._get_lucky_color(day_ruler, element)}"""

        elif time_period == 'weekly':
            if view_mode == 'simple':
                return f"""## This Week's Relationship Energy

**{zodiac} • {nakshatra}**

### Weekly Love Overview
• Relationship focus builds mid-week
• Venus day (Friday) optimal for romance
• {element} energy shapes emotional expression

### Day-by-Day Relationship Guide
• **Mon:** Emotional depth, family time
• **Tue:** Passion heightened, avoid conflicts
• **Wed:** Communication flows, express feelings
• **Thu:** Generous love energy, commitments
• **Fri:** Romance peaks, date night ideal
• **Sat:** Serious conversations, commitments
• **Sun:** Warmth and playfulness

### Best Days for Love
• Friday (Venus) for romance
• Thursday (Jupiter) for commitments
• Monday for emotional bonding

### Weekly Relationship Action
• Schedule quality time on Friday
• Express appreciation daily
• Address any tensions mid-week
• Practice forgiveness readily"""

            else:  # astrologer mode
                return f"""## Saptahika Relationship Phala

**Natal Configuration:** {zodiac} • {moon_sign} • {ascendant}
**Birth Nakshatra:** {nakshatra}

### Weekly Venus Transits
**Day-wise Analysis:**
• Soma (Mon): Chandra activates emotions, family bonding
• Mangala (Tue): Kuja brings passion, potential friction
• Budha (Wed): Mercury aids communication, clarity
• Guru (Thu): Jupiter expands love, auspicious commitments
• Shukra (Fri): Venus rules, romance flourishes
• Shani (Sat): Saturn tests, deepen commitments
• Ravi (Sun): Sun brings vitality, mutual respect

### 7th House Weekly Aspects
**Favorable Days:** Thursday, Friday
**Challenging:** Tuesday (Mars aggression)
**Neutral:** Wednesday, Saturday

### Weekly Relationship Muhurta
**Romance:** Friday evening after sunset
**Serious Talks:** Saturday morning
**Family Time:** Sunday afternoon

### Weekly Remedies
**Venus Strengthening:** White flowers Friday
**Relationship Harmony:** Couple meditation Thursday"""

        elif time_period == 'monthly':
            month_name = today.strftime('%B')
            if view_mode == 'simple':
                return f"""## {month_name}'s Relationship Forecast

**{zodiac} • {nakshatra}**

### Month's Love Theme
• {ruler} influences relationships this month
• Growth through deeper commitment
• New connections possible mid-month

### Key Relationship Dates
• 7th & 14th: Romance energy peaks
• 11th: Spiritual connection deepens
• Full Moon: Emotions heightened
• New Moon: Fresh starts possible

### Monthly Love Focus
• Existing relationships: Deepening intimacy
• Singles: New connections around 7th-14th
• Commitments: Favorable around 11th

### Month's Challenges
• Potential friction around 8th & 22nd
• Patience needed during Saturn aspects
• Avoid major decisions on eclipse days

### Monthly Relationship Actions
• Set relationship intentions on 1st
• Plan special date around 14th
• Review relationship goals mid-month
• Express gratitude at month's end"""

            else:
                return f"""## Masika Kalatra Phala • {month_name}

**Natal Configuration:** {zodiac} • {moon_sign} • {ascendant}
**Nakshatra:** {nakshatra}

### Venus Monthly Transit Analysis
**Current Position:** Review Venus through houses
**Aspect to 7th:** Determines relationship energy
**Strength:** {ruler} influence enhances or challenges

### Week-by-Week Relationship Guide
**Week 1:** Foundation building, emotional clearing
**Week 2:** Active connection, romance peaks
**Week 3:** Review and adjustment, deeper communication
**Week 4:** Consolidation, commitment opportunities

### Auspicious Relationship Muhurtas
**Romance:** Venus-ruled days, Shukla Paksha
**Commitments:** Jupiter-ruled days, Panchami/Ekadashi
**Difficult Conversations:** Saturn-ruled periods for stability

### Monthly Relationship Remedies
**Venus Mantra:** Om Shukraya Namaha (1008 monthly)
**Couple Practice:** Joint meditation on Full Moon
**Charity:** White items donation on Fridays"""

        else:  # yearly
            year = today.year
            if view_mode == 'simple':
                return f"""## {year} Relationship Forecast

**{zodiac} • {nakshatra}**

### Year's Love Theme
• Significant relationship evolution ahead
• Deepening existing bonds
• New soul connections possible

### Quarterly Overview
**Q1 (Jan-Mar):** Foundation and healing
**Q2 (Apr-Jun):** Active growth, new connections
**Q3 (Jul-Sep):** Testing and strengthening
**Q4 (Oct-Dec):** Harvest and commitment

### Major Relationship Transits
• Jupiter brings expansion mid-year
• Saturn tests commitment but strengthens
• Venus retrograde period: Review existing bonds

### Singles Focus
• Best periods: April-June, October
• Soul connections likely in spiritual settings
• Quality over quantity approach favored

### Committed Relationships
• Deepening intimacy throughout year
• Milestone opportunities Q3-Q4
• Growth through challenges Q2

### Year's Relationship Actions
• Set clear relationship intentions January
• Review progress mid-year
• Celebrate milestones Q4
• Practice forgiveness continuously"""

            else:
                return f"""## Varshika Kalatra Phala • {year}

**Natal Configuration:** {zodiac} • {moon_sign} • {ascendant}
**Janma Nakshatra:** {nakshatra}

### Major Planetary Transits Affecting Relationships

**Jupiter (Guru) Transit:**
• Expansion through 7th house
• Blessing for commitments and growth
• Favorable periods for marriage

**Saturn (Shani) Transit:**
• Testing existing bonds
• Karmic relationship lessons
• Long-term commitment focus

**Venus (Shukra) Retrograde:**
• Review of relationship patterns
• Past connections may resurface
• Internal reflection on love needs

**Rahu-Ketu Nodal Shift:**
• Karmic relationships activated
• Soul connections entering/exiting
• Spiritual partnership focus

### Quarterly Kalatra Analysis

**Q1 - Vasanta:** Foundation building
• 7th lord positioning favorable
• New beginnings in love supported
• Healing past patterns

**Q2 - Grishma:** Active engagement
• Venus strength peaks
• Romance flourishes
• New connections likely

**Q3 - Varsha:** Testing period
• Saturn aspects relationships
• Commitment tests
• Strengthen through challenges

**Q4 - Hemanta:** Harvest time
• Jupiter blessings manifest
• Commitment milestones
• Relationship fruits ripen

### Annual Relationship Remedies
**Vivaha Sukta:** For marriage blessings
**Gauri-Shankar Puja:** For harmony
**Venus Vrata:** Friday observances
**Nakshatra Shanti:** For natal harmony"""

    def generate_general_predictions(self, context: Dict[str, Any], time_period: str = 'daily', view_mode: str = 'simple') -> str:
        """Generate time-period-specific predictions with view mode support

        Args:
            context: Birth chart data
            time_period: 'daily', 'weekly', 'monthly', or 'yearly'
            view_mode: 'simple' (crisp, precise) or 'astrologer' (detailed with references)
        """
        zodiac = context.get('zodiac_sign', 'Unknown')
        nakshatra = context.get('nakshatra', 'Unknown')
        moon_sign = context.get('moon_sign', zodiac)
        ascendant = context.get('ascendant', zodiac)

        zodiac_info = self._get_zodiac_info(zodiac)
        nakshatra_info = self._get_nakshatra_info(nakshatra)

        # Route to appropriate time-period method
        if time_period == 'daily':
            return self._generate_daily_prediction(zodiac, nakshatra, moon_sign, ascendant, zodiac_info, nakshatra_info, view_mode)
        elif time_period == 'weekly':
            return self._generate_weekly_prediction(zodiac, nakshatra, moon_sign, ascendant, zodiac_info, nakshatra_info, view_mode)
        elif time_period == 'monthly':
            return self._generate_monthly_prediction(zodiac, nakshatra, moon_sign, ascendant, zodiac_info, nakshatra_info, view_mode)
        elif time_period == 'yearly':
            return self._generate_yearly_prediction(zodiac, nakshatra, moon_sign, ascendant, zodiac_info, nakshatra_info, view_mode)
        else:
            return self._generate_daily_prediction(zodiac, nakshatra, moon_sign, ascendant, zodiac_info, nakshatra_info, view_mode)

    def _generate_daily_prediction(self, zodiac: str, nakshatra: str, moon_sign: str, ascendant: str,
                                   zodiac_info: Dict, nakshatra_info: Dict, view_mode: str) -> str:
        """Generate precise daily prediction based on Nadi Jyotisha Tithi-Nakshatra system"""
        from datetime import datetime

        today = datetime.now()
        weekday = today.weekday()
        day_rulers = ['Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Sun']
        day_ruler = day_rulers[weekday]
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

        # Calculate day energy based on planetary day lord and natal chart
        element = zodiac_info.get('element', 'Fire')
        day_element_harmony = self._calculate_day_harmony(element, day_ruler)

        # Lucky elements calculation using Nadi principles
        lucky_number = self._calculate_lucky_number(nakshatra, today.day)
        lucky_color = self._get_lucky_color(day_ruler, element)

        if view_mode == 'simple':
            return f"""## Today's Cosmic Energy: {day_element_harmony['level']}

**{zodiac} • {nakshatra} Nakshatra**

### Key Insight
{day_element_harmony['message']}

### Career & Work
• {self._get_career_daily(zodiac, day_ruler)}
• Best hours: {self._get_auspicious_hours(day_ruler)}

### Relationships
• {self._get_love_daily(moon_sign, day_ruler)}

### Health & Vitality
• {self._get_health_daily(element, nakshatra_info)}

### Lucky Elements
• Number: {lucky_number}
• Color: {lucky_color}
• Direction: {self._get_lucky_direction(day_ruler)}

### Actionable Guidance
{self._get_daily_action(zodiac, nakshatra, day_ruler)}"""

        else:  # astrologer mode
            return f"""## Diurnal Chart Analysis • {day_names[weekday]}

**Natal Configuration:** {zodiac} Sun • {moon_sign} Moon • {ascendant} Lagna
**Janma Nakshatra:** {nakshatra} ({nakshatra_info.get('deity', 'Deity')})

### Vara (Day Lord) Analysis
**Day Ruler:** {day_ruler}
**Planetary Hour Sequence:** {self._get_hora_sequence(day_ruler)}
**Day-Natal Harmony:** {day_element_harmony['score']}% ({day_element_harmony['level']})

### Panchanga Elements
**Tithi Influence:** {self._get_tithi_influence(today)}
**Yoga:** {self._get_yoga_of_day(today)}
**Karana:** {self._get_karana(today)}

### Career & Professional (10th House Transit)
{self._get_career_daily_detailed(zodiac, day_ruler, ascendant)}

### Relationships & Partnerships (7th House)
{self._get_love_daily_detailed(moon_sign, day_ruler, zodiac)}

### Health & Constitution (6th House)
{self._get_health_daily_detailed(element, nakshatra_info, ascendant)}

### Financial Prospects (2nd & 11th Houses)
{self._get_finance_daily_detailed(zodiac, day_ruler)}

### Spiritual Practice (9th & 12th Houses)
**Recommended Mantra:** {self._get_daily_mantra(nakshatra_info, day_ruler)}
**Meditation Focus:** {nakshatra_info.get('quality', 'Inner stillness')}

### Auspicious Timings (Muhurta)
**Best Hours:** {self._get_auspicious_hours(day_ruler)}
**Avoid:** Rahu Kalam {self._get_rahu_kalam(weekday)}
**Gulika Kalam:** {self._get_gulika_kalam(weekday)}

### Lucky Elements
• **Number:** {lucky_number} (derived from Nakshatra pada)
• **Color:** {lucky_color}
• **Gemstone:** {self._get_day_gemstone(day_ruler)}
• **Direction:** {self._get_lucky_direction(day_ruler)}
• **Metal:** {self._get_lucky_metal(day_ruler)}

### Actionable Guidance
{self._get_daily_action_detailed(zodiac, nakshatra, day_ruler, nakshatra_info)}"""

    def _generate_weekly_prediction(self, zodiac: str, nakshatra: str, moon_sign: str, ascendant: str,
                                    zodiac_info: Dict, nakshatra_info: Dict, view_mode: str) -> str:
        """Generate weekly prediction based on Bhrigu Samhita Graha Sthiti principles"""
        from datetime import datetime, timedelta

        today = datetime.now()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)

        element = zodiac_info.get('element', 'Fire')
        ruler = zodiac_info.get('ruler', 'Sun')

        # Determine week's dominant planetary energy
        week_theme = self._calculate_week_theme(zodiac, nakshatra, today)

        if view_mode == 'simple':
            return f"""## Weekly Forecast • {week_start.strftime('%b %d')} - {week_end.strftime('%b %d')}

**{zodiac} • {nakshatra}**

### Week's Theme
{week_theme['theme']}

### Day-by-Day Energy
• **Mon:** {self._get_day_brief('Moon', zodiac)}
• **Tue:** {self._get_day_brief('Mars', zodiac)}
• **Wed:** {self._get_day_brief('Mercury', zodiac)}
• **Thu:** {self._get_day_brief('Jupiter', zodiac)}
• **Fri:** {self._get_day_brief('Venus', zodiac)}
• **Sat:** {self._get_day_brief('Saturn', zodiac)}
• **Sun:** {self._get_day_brief('Sun', zodiac)}

### Best Days
{week_theme['best_days']}

### Career Focus
{self._get_career_weekly(zodiac, ruler)}

### Relationship Insights
{self._get_love_weekly(moon_sign, zodiac)}

### Financial Outlook
{self._get_finance_weekly(zodiac)}

### Weekly Guidance
{week_theme['guidance']}"""

        else:  # astrologer mode
            return f"""## Saptahika Phala (Weekly Analysis)
**Period:** {week_start.strftime('%B %d')} - {week_end.strftime('%B %d, %Y')}

**Natal Configuration:** {zodiac} Sun • {moon_sign} Chandra • {ascendant} Lagna
**Birth Nakshatra:** {nakshatra} • Presiding Deity: {nakshatra_info.get('deity', 'Unknown')}

### Graha Sthiti (Planetary Positions) Impact
**Week Ruler:** {week_theme['ruler']}
**Dominant Energy:** {element} tattva activated
**Transit Influence:** {self._get_transit_summary(zodiac)}

### Vara-wise Analysis (Day-by-Day)

**Somavara (Monday) - Chandra:**
{self._get_day_detailed('Moon', zodiac, moon_sign, 'Emotional sensitivity heightened. Honor lunar energies.')}

**Mangalavara (Tuesday) - Kuja:**
{self._get_day_detailed('Mars', zodiac, moon_sign, 'Action-oriented energy. Channel aggression constructively.')}

**Budhavara (Wednesday) - Budha:**
{self._get_day_detailed('Mercury', zodiac, moon_sign, 'Communication and commerce favored. Learning enhanced.')}

**Guruvara (Thursday) - Guru:**
{self._get_day_detailed('Jupiter', zodiac, moon_sign, 'Expansion and wisdom. Auspicious for new ventures.')}

**Shukravara (Friday) - Shukra:**
{self._get_day_detailed('Venus', zodiac, moon_sign, 'Harmony and beauty. Relationships flourish.')}

**Shanivara (Saturday) - Shani:**
{self._get_day_detailed('Saturn', zodiac, moon_sign, 'Discipline required. Long-term planning favored.')}

**Ravivara (Sunday) - Ravi:**
{self._get_day_detailed('Sun', zodiac, moon_sign, 'Self-expression and vitality. Leadership opportunities.')}

### Career & Profession (Karma Bhava)
{self._get_career_weekly_detailed(zodiac, ruler, ascendant)}

### Relationships & Marriage (Kalatra Bhava)
{self._get_love_weekly_detailed(moon_sign, zodiac, nakshatra)}

### Wealth & Resources (Dhana Bhava)
{self._get_finance_weekly_detailed(zodiac, ruler)}

### Health & Wellness (Roga Bhava)
{self._get_health_weekly_detailed(element, nakshatra_info)}

### Spiritual Practice Recommendations
**Mantra for the Week:** {self._get_weekly_mantra(nakshatra_info, ruler)}
**Fasting Day:** {self._get_fasting_day(ruler)}
**Pilgrimage/Temple:** {self._get_temple_recommendation(nakshatra_info)}

### Auspicious Activities
**Best Days:** {week_theme['best_days']}
**Avoid:** {week_theme['avoid_days']}
**Muhurta Windows:** {self._get_weekly_muhurta(zodiac)}"""

    def _generate_monthly_prediction(self, zodiac: str, nakshatra: str, moon_sign: str, ascendant: str,
                                     zodiac_info: Dict, nakshatra_info: Dict, view_mode: str) -> str:
        """Generate monthly prediction based on Bhrigu Samhita Masa Phala principles"""
        from datetime import datetime

        today = datetime.now()
        month_name = today.strftime('%B')
        year = today.year

        element = zodiac_info.get('element', 'Fire')
        ruler = zodiac_info.get('ruler', 'Sun')

        # Calculate month's planetary influences
        month_theme = self._calculate_month_theme(zodiac, nakshatra, today.month, year)

        if view_mode == 'simple':
            return f"""## Monthly Forecast • {month_name} {year}

**{zodiac} • {nakshatra}**

### Month's Energy
{month_theme['energy']}

### Career & Success
{self._get_career_monthly(zodiac, ruler, today.month)}

### Love & Relationships
{self._get_love_monthly(moon_sign, zodiac, today.month)}

### Health & Wellness
{self._get_health_monthly(element, nakshatra)}

### Financial Prosperity
{self._get_finance_monthly(zodiac, today.month)}

### Key Dates
• **Power Days:** {month_theme['power_days']}
• **Caution Days:** {month_theme['caution_days']}

### Monthly Guidance
{month_theme['guidance']}

### Actionable Steps
{self._get_monthly_actions(zodiac, nakshatra, today.month)}"""

        else:  # astrologer mode
            return f"""## Masika Phala (Monthly Analysis) • {month_name} {year}

**Natal Configuration:** {zodiac} Ravi • {moon_sign} Chandra • {ascendant} Lagna
**Janma Nakshatra:** {nakshatra} • Adhipati: {nakshatra_info.get('deity', 'Unknown')}

### Graha Gochar (Transit Analysis)
{self._get_monthly_transits(zodiac, today.month)}

### Month's Planetary Ruler
**Masa Adhipati:** {month_theme['ruler']}
**Elemental Dominance:** {element} with {month_theme['secondary_element']} influence
**Overall Potency:** {month_theme['potency']}%

### Week-by-Week Breakdown

**Week 1 (1st-7th):** {self._get_week_theme(zodiac, 1, today.month)}
**Week 2 (8th-14th):** {self._get_week_theme(zodiac, 2, today.month)}
**Week 3 (15th-21st):** {self._get_week_theme(zodiac, 3, today.month)}
**Week 4 (22nd-End):** {self._get_week_theme(zodiac, 4, today.month)}

### Karma Bhava Analysis (Career)
{self._get_career_monthly_detailed(zodiac, ruler, ascendant, today.month)}

### Kalatra Bhava Analysis (Relationships)
{self._get_love_monthly_detailed(moon_sign, zodiac, nakshatra, today.month)}

### Dhana Bhava Analysis (Wealth)
{self._get_finance_monthly_detailed(zodiac, ruler, today.month)}

### Arogya Analysis (Health)
{self._get_health_monthly_detailed(element, nakshatra_info, today.month)}

### Dharma & Moksha (Spiritual Path)
{self._get_spiritual_monthly(nakshatra_info, zodiac, today.month)}

### Important Muhurtas
**Shubha Tithis:** {month_theme['auspicious_tithis']}
**Nakshatra Alignment:** {self._get_monthly_nakshatra_days(nakshatra)}
**Avoid:** {month_theme['inauspicious_days']}

### Remedial Measures
**Mantra Japa:** {self._get_monthly_mantra(nakshatra_info, ruler)}
**Dana (Charity):** {self._get_monthly_charity(ruler)}
**Vrata (Fasting):** {self._get_monthly_fasting(zodiac)}

### Critical Dates
• **Power Days:** {month_theme['power_days']}
• **Caution Required:** {month_theme['caution_days']}
• **New/Full Moon Impact:** {self._get_lunar_impact(zodiac, today.month)}"""

    def _generate_yearly_prediction(self, zodiac: str, nakshatra: str, moon_sign: str, ascendant: str,
                                    zodiac_info: Dict, nakshatra_info: Dict, view_mode: str) -> str:
        """Generate yearly prediction based on Bhrigu Samhita Varsha Phala and Dasha system"""
        from datetime import datetime

        year = datetime.now().year
        element = zodiac_info.get('element', 'Fire')
        ruler = zodiac_info.get('ruler', 'Sun')

        # Calculate year's major themes using Vedic principles
        year_theme = self._calculate_year_theme(zodiac, nakshatra, year)

        if view_mode == 'simple':
            return f"""## Annual Forecast • {year}

**{zodiac} • {nakshatra}**

### Year's Theme
{year_theme['theme']}

### Quarter-by-Quarter

**Q1 (Jan-Mar):** {year_theme['q1']}
**Q2 (Apr-Jun):** {year_theme['q2']}
**Q3 (Jul-Sep):** {year_theme['q3']}
**Q4 (Oct-Dec):** {year_theme['q4']}

### Career & Professional Growth
{self._get_career_yearly(zodiac, ruler)}

### Love & Relationships
{self._get_love_yearly(moon_sign, zodiac)}

### Wealth & Prosperity
{self._get_finance_yearly(zodiac)}

### Health & Vitality
{self._get_health_yearly(element, nakshatra)}

### Key Months
• **Most Favorable:** {year_theme['best_months']}
• **Requires Care:** {year_theme['challenging_months']}

### Year's Guidance
{year_theme['guidance']}"""

        else:  # astrologer mode
            return f"""## Varsha Phala (Annual Analysis) • {year}

**Natal Configuration:** {zodiac} Surya • {moon_sign} Chandra • {ascendant} Lagna
**Janma Nakshatra:** {nakshatra} • Devata: {nakshatra_info.get('deity', 'Unknown')}

### Varshaphal Overview
**Year Lord (Varshesha):** {year_theme['varshesha']}
**Muntha Position:** {year_theme['muntha']}
**Sahama Points:** {self._get_sahama_points(zodiac, year)}

### Major Transit Impact

**Jupiter Transit:** {self._get_jupiter_transit_yearly(zodiac, year)}
**Saturn Transit:** {self._get_saturn_transit_yearly(zodiac, year)}
**Rahu-Ketu Axis:** {self._get_rahu_ketu_yearly(zodiac, year)}

### Trimsamsa (Quarter Analysis)

**Q1 - Vasanta Ritu (Jan-Mar):**
{self._get_quarter_detailed(zodiac, nakshatra, 1, year)}

**Q2 - Grishma Ritu (Apr-Jun):**
{self._get_quarter_detailed(zodiac, nakshatra, 2, year)}

**Q3 - Varsha Ritu (Jul-Sep):**
{self._get_quarter_detailed(zodiac, nakshatra, 3, year)}

**Q4 - Hemanta Ritu (Oct-Dec):**
{self._get_quarter_detailed(zodiac, nakshatra, 4, year)}

### Dasha Analysis
**Current Mahadasha:** {self._estimate_dasha(nakshatra)}
**Antardasha Flow:** {self._get_antardasha_flow(nakshatra, year)}

### Bhava-wise Predictions

**1st House (Self):** {self._get_house_yearly(1, zodiac, ascendant)}
**2nd House (Wealth):** {self._get_house_yearly(2, zodiac, ascendant)}
**4th House (Property):** {self._get_house_yearly(4, zodiac, ascendant)}
**5th House (Children):** {self._get_house_yearly(5, zodiac, ascendant)}
**7th House (Marriage):** {self._get_house_yearly(7, zodiac, ascendant)}
**9th House (Fortune):** {self._get_house_yearly(9, zodiac, ascendant)}
**10th House (Career):** {self._get_house_yearly(10, zodiac, ascendant)}
**11th House (Gains):** {self._get_house_yearly(11, zodiac, ascendant)}

### Career & Profession (Karma Yoga)
{self._get_career_yearly_detailed(zodiac, ruler, ascendant, year)}

### Relationships & Marriage (Vivaha Yoga)
{self._get_love_yearly_detailed(moon_sign, zodiac, nakshatra, year)}

### Wealth & Prosperity (Dhana Yoga)
{self._get_finance_yearly_detailed(zodiac, ruler, year)}

### Health & Longevity (Ayu Yoga)
{self._get_health_yearly_detailed(element, nakshatra_info, year)}

### Spiritual Evolution (Moksha Marga)
{self._get_spiritual_yearly(nakshatra_info, zodiac, year)}

### Annual Remedial Prescription
**Ishta Devata Worship:** {self._get_ishta_devata(nakshatra_info)}
**Annual Mantra:** {self._get_yearly_mantra(nakshatra_info, ruler)}
**Gemstone Recommendation:** {self._get_yearly_gemstone(ruler, zodiac)}
**Charitable Acts:** {self._get_yearly_charity(ruler)}
**Pilgrimage Sites:** {self._get_pilgrimage_sites(nakshatra_info)}

### Critical Periods
• **Most Auspicious:** {year_theme['best_months']}
• **Exercise Caution:** {year_theme['challenging_months']}
• **Saturn Transit Effects:** {year_theme['saturn_periods']}
• **Eclipse Impact:** {self._get_eclipse_impact(zodiac, year)}"""

    # Helper methods for precise calculations
    def _calculate_day_harmony(self, element: str, day_ruler: str) -> Dict[str, Any]:
        """Calculate harmony between natal element and day ruler"""
        ruler_elements = {
            'Sun': 'Fire', 'Moon': 'Water', 'Mars': 'Fire', 'Mercury': 'Earth',
            'Jupiter': 'Ether', 'Venus': 'Water', 'Saturn': 'Air'
        }
        day_element = ruler_elements.get(day_ruler, 'Fire')

        harmony_matrix = {
            ('Fire', 'Fire'): {'score': 90, 'level': 'Excellent', 'message': 'High energy alignment. Bold initiatives favored.'},
            ('Fire', 'Air'): {'score': 85, 'level': 'Very Good', 'message': 'Dynamic energy. Expansion and communication flow.'},
            ('Fire', 'Earth'): {'score': 60, 'level': 'Moderate', 'message': 'Balance action with grounding. Patience required.'},
            ('Fire', 'Water'): {'score': 50, 'level': 'Challenging', 'message': 'Emotional awareness needed. Avoid impulsive reactions.'},
            ('Fire', 'Ether'): {'score': 80, 'level': 'Good', 'message': 'Spiritual insights available. Wisdom guides action.'},
            ('Earth', 'Earth'): {'score': 90, 'level': 'Excellent', 'message': 'Stable foundation. Material progress supported.'},
            ('Earth', 'Water'): {'score': 85, 'level': 'Very Good', 'message': 'Nurturing energy. Growth and fertility.'},
            ('Earth', 'Fire'): {'score': 60, 'level': 'Moderate', 'message': 'Channel enthusiasm into practical results.'},
            ('Earth', 'Air'): {'score': 55, 'level': 'Challenging', 'message': 'Ground ideas before acting. Focus required.'},
            ('Earth', 'Ether'): {'score': 75, 'level': 'Good', 'message': 'Spiritual wisdom enhances material pursuits.'},
            ('Air', 'Air'): {'score': 90, 'level': 'Excellent', 'message': 'Mental clarity and communication excel.'},
            ('Air', 'Fire'): {'score': 85, 'level': 'Very Good', 'message': 'Ideas take flight. Creative expression flows.'},
            ('Air', 'Water'): {'score': 55, 'level': 'Challenging', 'message': 'Balance logic with intuition. Stay grounded.'},
            ('Air', 'Earth'): {'score': 60, 'level': 'Moderate', 'message': 'Practical application of ideas. Persistence helps.'},
            ('Air', 'Ether'): {'score': 90, 'level': 'Excellent', 'message': 'Higher knowledge accessible. Meditation beneficial.'},
            ('Water', 'Water'): {'score': 90, 'level': 'Excellent', 'message': 'Deep emotional clarity. Intuition strong.'},
            ('Water', 'Earth'): {'score': 85, 'level': 'Very Good', 'message': 'Emotional security supports growth.'},
            ('Water', 'Fire'): {'score': 50, 'level': 'Challenging', 'message': 'Manage intensity. Cool emotions before acting.'},
            ('Water', 'Air'): {'score': 55, 'level': 'Challenging', 'message': 'Don\'t overthink feelings. Trust inner guidance.'},
            ('Water', 'Ether'): {'score': 80, 'level': 'Good', 'message': 'Spiritual depth accessible. Dreams meaningful.'},
        }

        return harmony_matrix.get((element, day_element),
                                  {'score': 70, 'level': 'Balanced', 'message': 'Steady energy. Maintain equilibrium.'})

    def _calculate_lucky_number(self, nakshatra: str, day: int) -> int:
        """Calculate lucky number using Nakshatra-based numerology"""
        nakshatra_numbers = {
            'Ashwini': 1, 'Bharani': 2, 'Krittika': 3, 'Rohini': 4, 'Mrigashira': 5,
            'Ardra': 6, 'Punarvasu': 7, 'Pushya': 8, 'Ashlesha': 9, 'Magha': 1,
            'Purva Phalguni': 2, 'Uttara Phalguni': 3, 'Hasta': 4, 'Chitra': 5,
            'Swati': 6, 'Vishakha': 7, 'Anuradha': 8, 'Jyeshtha': 9, 'Moola': 1,
            'Purva Ashadha': 2, 'Uttara Ashadha': 3, 'Shravana': 4, 'Dhanishta': 5,
            'Shatabhisha': 6, 'Purva Bhadrapada': 7, 'Uttara Bhadrapada': 8, 'Revati': 9
        }
        base = nakshatra_numbers.get(nakshatra, 5)
        return ((base + day) % 9) + 1

    def _get_lucky_color(self, day_ruler: str, element: str) -> str:
        """Get lucky color based on day ruler and natal element"""
        ruler_colors = {
            'Sun': 'Gold, Orange, Ruby Red',
            'Moon': 'White, Silver, Pearl',
            'Mars': 'Red, Coral, Copper',
            'Mercury': 'Green, Emerald, Mixed colors',
            'Jupiter': 'Yellow, Gold, Saffron',
            'Venus': 'White, Pink, Pastels',
            'Saturn': 'Blue, Black, Indigo'
        }
        return ruler_colors.get(day_ruler, 'White')

    def _get_lucky_direction(self, day_ruler: str) -> str:
        """Get lucky direction based on planetary day lord"""
        directions = {
            'Sun': 'East', 'Moon': 'Northwest', 'Mars': 'South',
            'Mercury': 'North', 'Jupiter': 'Northeast', 'Venus': 'Southeast', 'Saturn': 'West'
        }
        return directions.get(day_ruler, 'East')

    def _get_auspicious_hours(self, day_ruler: str) -> str:
        """Get auspicious hora timings"""
        hora_times = {
            'Sun': '6:00-7:00 AM, 1:00-2:00 PM',
            'Moon': '7:00-8:00 AM, 2:00-3:00 PM',
            'Mars': '8:00-9:00 AM, 3:00-4:00 PM',
            'Mercury': '9:00-10:00 AM, 4:00-5:00 PM',
            'Jupiter': '10:00-11:00 AM, 5:00-6:00 PM',
            'Venus': '11:00-12:00 PM, 6:00-7:00 PM',
            'Saturn': '12:00-1:00 PM, 7:00-8:00 PM'
        }
        return hora_times.get(day_ruler, '6:00-7:00 AM')

    def _get_rahu_kalam(self, weekday: int) -> str:
        """Get Rahu Kalam timing for each day"""
        rahu_times = ['7:30-9:00 AM', '3:00-4:30 PM', '12:00-1:30 PM',
                      '1:30-3:00 PM', '10:30-12:00 PM', '9:00-10:30 AM', '4:30-6:00 PM']
        return rahu_times[weekday]

    def _get_gulika_kalam(self, weekday: int) -> str:
        """Get Gulika Kalam timing"""
        gulika_times = ['1:30-3:00 PM', '12:00-1:30 PM', '10:30-12:00 PM',
                        '9:00-10:30 AM', '7:30-9:00 AM', '6:00-7:30 AM', '3:00-4:30 PM']
        return gulika_times[weekday]

    def _get_career_daily(self, zodiac: str, day_ruler: str) -> str:
        """Get daily career insight"""
        insights = {
            'Sun': 'Leadership opportunities. Take initiative on important projects.',
            'Moon': 'Focus on team collaboration. Emotional intelligence serves you.',
            'Mars': 'Action day. Push forward on stalled projects.',
            'Mercury': 'Communication key. Negotiations and meetings favored.',
            'Jupiter': 'Expansion possible. Think strategically.',
            'Venus': 'Harmonize workplace relationships. Creative work flows.',
            'Saturn': 'Discipline rewarded. Complete pending tasks.'
        }
        return insights.get(day_ruler, 'Steady progress through consistent effort.')

    def _get_love_daily(self, moon_sign: str, day_ruler: str) -> str:
        """Get daily relationship insight"""
        insights = {
            'Sun': 'Express confidence. Your presence attracts.',
            'Moon': 'Deep emotional connection possible. Be vulnerable.',
            'Mars': 'Passion heightened. Channel intensity constructively.',
            'Mercury': 'Communication heals. Share your thoughts.',
            'Jupiter': 'Generosity in love brings joy.',
            'Venus': 'Romance flourishes. Express affection.',
            'Saturn': 'Commitment matters. Value stability.'
        }
        return insights.get(day_ruler, 'Balance giving and receiving.')

    def _get_health_daily(self, element: str, nakshatra_info: Dict) -> str:
        """Get daily health guidance"""
        element_health = {
            'Fire': 'Channel energy through exercise. Avoid excess heat.',
            'Earth': 'Grounding practices. Nature walks beneficial.',
            'Air': 'Breathing exercises. Calm the mind.',
            'Water': 'Hydration important. Emotional release through movement.'
        }
        return element_health.get(element, 'Balance activity and rest.')

    def _get_daily_action(self, zodiac: str, nakshatra: str, day_ruler: str) -> str:
        """Get specific actionable guidance"""
        return f"""• Set one clear intention for today
• Dedicate 10 minutes to meditation/prayer
• Express gratitude to one person
• Complete one pending task"""

    def _get_daily_mantra(self, nakshatra_info: Dict, day_ruler: str) -> str:
        """Get recommended daily mantra"""
        deity = nakshatra_info.get('deity', 'Divine')
        return f"Om {deity.split()[0] if deity else 'Namah'}aya Namaha (108 times)"

    # Placeholder methods for detailed astrologer mode - these provide the framework
    def _get_hora_sequence(self, day_ruler: str) -> str:
        return f"{day_ruler} → next in sequence"

    def _get_tithi_influence(self, date) -> str:
        tithi = (date.day % 15) + 1
        tithi_names = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
                      'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
                      'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima/Amavasya']
        return f"{tithi_names[tithi-1]} - {'Auspicious' if tithi in [2,3,5,7,10,11,13] else 'Moderate'}"

    def _get_yoga_of_day(self, date) -> str:
        yogas = ['Vishkumbha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda',
                'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata',
                'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva',
                'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti']
        return yogas[date.day % 27]

    def _get_karana(self, date) -> str:
        karanas = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti']
        return karanas[date.day % 7]

    def _get_career_daily_detailed(self, zodiac: str, day_ruler: str, ascendant: str) -> str:
        return f"10th house lord influenced by {day_ruler}. Professional activities supported in {zodiac} style."

    def _get_love_daily_detailed(self, moon_sign: str, day_ruler: str, zodiac: str) -> str:
        return f"7th house matters activated. {moon_sign} Moon enhances emotional connectivity."

    def _get_health_daily_detailed(self, element: str, nakshatra_info: Dict, ascendant: str) -> str:
        return f"{element} constitution requires balanced activity. {nakshatra_info.get('quality', 'Energy')} governs vitality."

    def _get_finance_daily_detailed(self, zodiac: str, day_ruler: str) -> str:
        return f"2nd and 11th houses under {day_ruler} influence. {'Favorable' if day_ruler in ['Jupiter', 'Venus'] else 'Moderate'} for financial decisions."

    def _get_daily_action_detailed(self, zodiac: str, nakshatra: str, day_ruler: str, nakshatra_info: Dict) -> str:
        return f"""1. Honor {day_ruler} with morning prayer
2. Wear {self._get_lucky_color(day_ruler, 'Fire')} for enhanced energy
3. Chant {nakshatra_info.get('deity', 'your nakshatra deity')} mantra 27 times
4. Perform one act of kindness aligned with your dharma"""

    def _get_day_gemstone(self, day_ruler: str) -> str:
        gemstones = {
            'Sun': 'Ruby', 'Moon': 'Pearl', 'Mars': 'Red Coral',
            'Mercury': 'Emerald', 'Jupiter': 'Yellow Sapphire',
            'Venus': 'Diamond', 'Saturn': 'Blue Sapphire'
        }
        return gemstones.get(day_ruler, 'Clear Quartz')

    def _get_lucky_metal(self, day_ruler: str) -> str:
        metals = {
            'Sun': 'Gold', 'Moon': 'Silver', 'Mars': 'Copper',
            'Mercury': 'Bronze', 'Jupiter': 'Gold', 'Venus': 'Silver', 'Saturn': 'Iron'
        }
        return metals.get(day_ruler, 'Silver')

    # Weekly helper methods
    def _calculate_week_theme(self, zodiac: str, nakshatra: str, date) -> Dict[str, str]:
        themes = {
            'Fire': {'theme': 'Dynamic action and leadership', 'guidance': 'Channel energy into meaningful projects'},
            'Earth': {'theme': 'Building and consolidation', 'guidance': 'Focus on practical achievements'},
            'Air': {'theme': 'Communication and networking', 'guidance': 'Share ideas and connect with others'},
            'Water': {'theme': 'Emotional depth and intuition', 'guidance': 'Trust your inner guidance'}
        }
        element = self._get_zodiac_info(zodiac).get('element', 'Fire')
        base = themes.get(element, themes['Fire'])
        return {
            **base,
            'ruler': self._get_zodiac_info(zodiac).get('ruler', 'Sun'),
            'best_days': 'Thursday (Jupiter) and Friday (Venus)',
            'avoid_days': 'Tuesday (Mars aggression) if {zodiac} is Water sign'
        }

    def _get_day_brief(self, day_ruler: str, zodiac: str) -> str:
        briefs = {
            'Moon': 'Emotional clarity, family matters',
            'Mars': 'Action, competitive energy',
            'Mercury': 'Communication, learning',
            'Jupiter': 'Expansion, wisdom, luck',
            'Venus': 'Harmony, relationships, beauty',
            'Saturn': 'Discipline, responsibility',
            'Sun': 'Self-expression, vitality'
        }
        return briefs.get(day_ruler, 'Balanced energy')

    def _get_career_weekly(self, zodiac: str, ruler: str) -> str:
        return f"Professional momentum builds mid-week. {ruler} energy supports your natural {zodiac} approach to work."

    def _get_love_weekly(self, moon_sign: str, zodiac: str) -> str:
        return f"Relationship harmony peaks on Venus day (Friday). {moon_sign} Moon deepens emotional bonds."

    def _get_finance_weekly(self, zodiac: str) -> str:
        return "Steady financial flow. Avoid impulsive purchases early week. Thursday favorable for investments."

    def _get_day_detailed(self, day_ruler: str, zodiac: str, moon_sign: str, guidance: str) -> str:
        return f"• {guidance}\n• {day_ruler} activates related house matters\n• Best activities: {self._get_day_activities(day_ruler)}"

    def _get_day_activities(self, day_ruler: str) -> str:
        activities = {
            'Sun': 'Leadership tasks, father/authority matters, health initiatives',
            'Moon': 'Mother/women matters, emotional work, travel',
            'Mars': 'Physical activity, property matters, competition',
            'Mercury': 'Studies, business, communication, travel',
            'Jupiter': 'Teaching, religious activities, children matters',
            'Venus': 'Romance, arts, luxury purchases, women matters',
            'Saturn': 'Long-term planning, elderly care, discipline'
        }
        return activities.get(day_ruler, 'General activities')

    def _get_career_weekly_detailed(self, zodiac: str, ruler: str, ascendant: str) -> str:
        return f"10th lord from {ascendant} lagna receives support. Best days for career: Thursday, Sunday. Avoid major decisions on Tuesday unless Mars is strong natally."

    def _get_love_weekly_detailed(self, moon_sign: str, zodiac: str, nakshatra: str) -> str:
        return f"7th house matters activated through {moon_sign} Moon. Venus day optimal for relationship discussions. {nakshatra} natives benefit from expressing devotion."

    def _get_finance_weekly_detailed(self, zodiac: str, ruler: str) -> str:
        return f"2nd and 11th houses influenced by weekly planetary movements. Thursday (Jupiter) excellent for expansion. Saturday for long-term planning."

    def _get_health_weekly_detailed(self, element: str, nakshatra_info: Dict) -> str:
        return f"{element} constitution requires attention to related body systems. {nakshatra_info.get('quality', 'Natural')} energy governs vitality cycles."

    def _get_weekly_mantra(self, nakshatra_info: Dict, ruler: str) -> str:
        return f"Daily: Om {nakshatra_info.get('deity', 'Namah').split()[0]}aya Namaha\n{ruler} day: Om {ruler}aya Namaha (108 times)"

    def _get_fasting_day(self, ruler: str) -> str:
        fasting = {
            'Sun': 'Sunday (Surya)', 'Moon': 'Monday (Chandra)', 'Mars': 'Tuesday (Hanuman)',
            'Mercury': 'Wednesday (Vishnu)', 'Jupiter': 'Thursday (Dakshinamurthy)',
            'Venus': 'Friday (Lakshmi)', 'Saturn': 'Saturday (Shani)'
        }
        return fasting.get(ruler, 'Ekadashi')

    def _get_temple_recommendation(self, nakshatra_info: Dict) -> str:
        return f"Temple of {nakshatra_info.get('deity', 'Nakshatra Lord')} or Navagraha temple"

    def _get_weekly_muhurta(self, zodiac: str) -> str:
        return "Brahma Muhurta (4:30-6:00 AM) daily, especially Thursday and Friday"

    def _get_transit_summary(self, zodiac: str) -> str:
        return f"Current transits support {zodiac} in relationship and career matters"

    # Monthly helper methods
    def _calculate_month_theme(self, zodiac: str, nakshatra: str, month: int, year: int) -> Dict[str, str]:
        month_rulers = ['Saturn', 'Saturn', 'Jupiter', 'Mars', 'Venus', 'Mercury',
                       'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter']
        ruler = month_rulers[month - 1]

        return {
            'ruler': ruler,
            'energy': f'{ruler} dominates this month, bringing focus on related matters',
            'secondary_element': 'Fire' if month in [1,5,9] else 'Earth' if month in [2,6,10] else 'Air' if month in [3,7,11] else 'Water',
            'potency': 75 + (month % 4) * 5,
            'power_days': f'{month}/5, {month}/14, {month}/23',
            'caution_days': f'{month}/8, {month}/22',
            'auspicious_tithis': 'Dwitiya, Panchami, Dashami, Ekadashi',
            'inauspicious_days': 'Ashtami, Chaturdashi',
            'guidance': f'Focus on {ruler}-related activities for maximum success'
        }

    def _get_career_monthly(self, zodiac: str, ruler: str, month: int) -> str:
        return f"Professional advancement indicated mid-month. {ruler} supports your {zodiac} work style. Key opportunities around {month}/10-15."

    def _get_love_monthly(self, moon_sign: str, zodiac: str, month: int) -> str:
        return f"Relationship energy peaks around {month}/14. {moon_sign} Moon enhances emotional depth. Singles: new connections possible {month}/7-12."

    def _get_health_monthly(self, element: str, nakshatra: str) -> str:
        return f"Overall vitality good. {element} constitution needs attention to related systems. Regular routine maintains energy."

    def _get_finance_monthly(self, zodiac: str, month: int) -> str:
        return f"Financial stability indicated. Best investment window: {month}/10-20. Avoid speculative risks early month."

    def _get_monthly_actions(self, zodiac: str, nakshatra: str, month: int) -> str:
        return f"""1. Set monthly intentions on {month}/1
2. Review progress mid-month ({month}/15)
3. Perform nakshatra-specific puja on your birth star day
4. Practice gratitude journaling daily"""

    def _get_monthly_transits(self, zodiac: str, month: int) -> str:
        return f"Major planets supporting {zodiac} this month. Pay attention to house transits."

    def _get_week_theme(self, zodiac: str, week: int, month: int) -> str:
        themes = ['Foundation and planning', 'Active implementation', 'Review and adjustment', 'Completion and harvest']
        return themes[week - 1]

    def _get_career_monthly_detailed(self, zodiac: str, ruler: str, ascendant: str, month: int) -> str:
        return f"10th house from {ascendant} receives {ruler} aspect. Professional recognition possible around {month}/10-18. Leadership opportunities mid-month."

    def _get_love_monthly_detailed(self, moon_sign: str, zodiac: str, nakshatra: str, month: int) -> str:
        return f"7th lord activation around {month}/7-14. {nakshatra} natives experience deep connections. Existing relationships deepen."

    def _get_finance_monthly_detailed(self, zodiac: str, ruler: str, month: int) -> str:
        return f"2nd house receives {ruler} influence. Wealth accumulation favorable {month}/10-20. Avoid major expenses {month}/22-25."

    def _get_health_monthly_detailed(self, element: str, nakshatra_info: Dict, month: int) -> str:
        return f"{element} element requires balance. {nakshatra_info.get('quality', 'Natural')} energy guides healing. Rest period needed around {month}/20-25."

    def _get_spiritual_monthly(self, nakshatra_info: Dict, zodiac: str, month: int) -> str:
        return f"Spiritual practices especially potent on {nakshatra_info.get('deity', 'nakshatra deity')} worship days. Meditation depth increases around {month}/11 (Ekadashi)."

    def _get_monthly_nakshatra_days(self, nakshatra: str) -> str:
        return f"Your nakshatra days this month are powerful for spiritual practices"

    def _get_monthly_mantra(self, nakshatra_info: Dict, ruler: str) -> str:
        return f"Primary: Om {nakshatra_info.get('deity', 'Namah').split()[0]}aya Namaha (1008 times monthly)\nSupport: Om {ruler}aya Namaha daily"

    def _get_monthly_charity(self, ruler: str) -> str:
        charity = {
            'Sun': 'Donate wheat, jaggery on Sundays',
            'Moon': 'Donate rice, white items on Mondays',
            'Mars': 'Donate red lentils, red cloth on Tuesdays',
            'Mercury': 'Donate green moong, green items on Wednesdays',
            'Jupiter': 'Donate yellow items, turmeric on Thursdays',
            'Venus': 'Donate white items, sugar on Fridays',
            'Saturn': 'Donate black sesame, oil on Saturdays'
        }
        return charity.get(ruler, 'Regular anna dana (food donation)')

    def _get_monthly_fasting(self, zodiac: str) -> str:
        return "Ekadashi fasting (11th lunar day) twice monthly, plus ruler-day fasting"

    def _get_lunar_impact(self, zodiac: str, month: int) -> str:
        return "Full Moon brings emotional clarity. New Moon good for new beginnings."

    # Yearly helper methods
    def _calculate_year_theme(self, zodiac: str, nakshatra: str, year: int) -> Dict[str, str]:
        # Simplified Varshaphal calculation
        varshesha = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'][year % 7]

        return {
            'varshesha': varshesha,
            'muntha': f'Moves through houses bringing focus to related matters',
            'theme': f'Year of {varshesha} influence - growth through {varshesha.lower()}-related activities',
            'q1': 'Foundation building. Set intentions and begin new practices.',
            'q2': 'Active growth. Implement plans and build relationships.',
            'q3': 'Review and adjust. Make corrections and deepen commitments.',
            'q4': 'Harvest achievements. Prepare for next cycle.',
            'best_months': 'April, July, October',
            'challenging_months': 'February, August',
            'saturn_periods': 'Requires discipline and patience when Saturn transits sensitive points',
            'guidance': f'Embrace {varshesha} energy for optimal growth this year'
        }

    def _get_sahama_points(self, zodiac: str, year: int) -> str:
        return "Punya Sahama (fortune), Vidya Sahama (education), Vivaha Sahama (marriage) calculated"

    def _get_jupiter_transit_yearly(self, zodiac: str, year: int) -> str:
        return f"Jupiter's annual transit brings expansion to specific houses for {zodiac}"

    def _get_saturn_transit_yearly(self, zodiac: str, year: int) -> str:
        return f"Saturn's 2.5 year transit requires attention to discipline and long-term planning"

    def _get_rahu_ketu_yearly(self, zodiac: str, year: int) -> str:
        return f"Nodal axis influences karmic lessons throughout the year for {zodiac}"

    def _get_quarter_detailed(self, zodiac: str, nakshatra: str, quarter: int, year: int) -> str:
        quarters = {
            1: "New beginnings and foundation. Set yearly intentions. Plant seeds for growth.",
            2: "Active implementation. Build momentum. Relationship expansion.",
            3: "Mid-year review. Adjust course. Deepen existing commitments.",
            4: "Harvest results. Complete projects. Prepare for new cycle."
        }
        return quarters.get(quarter, "Balanced growth and development")

    def _estimate_dasha(self, nakshatra: str) -> str:
        dasha_lords = {
            'Ashwini': 'Ketu', 'Magha': 'Ketu', 'Moola': 'Ketu',
            'Bharani': 'Venus', 'Purva Phalguni': 'Venus', 'Purva Ashadha': 'Venus',
            'Krittika': 'Sun', 'Uttara Phalguni': 'Sun', 'Uttara Ashadha': 'Sun',
            'Rohini': 'Moon', 'Hasta': 'Moon', 'Shravana': 'Moon',
            'Mrigashira': 'Mars', 'Chitra': 'Mars', 'Dhanishta': 'Mars',
            'Ardra': 'Rahu', 'Swati': 'Rahu', 'Shatabhisha': 'Rahu',
            'Punarvasu': 'Jupiter', 'Vishakha': 'Jupiter', 'Purva Bhadrapada': 'Jupiter',
            'Pushya': 'Saturn', 'Anuradha': 'Saturn', 'Uttara Bhadrapada': 'Saturn',
            'Ashlesha': 'Mercury', 'Jyeshtha': 'Mercury', 'Revati': 'Mercury'
        }
        return f"{dasha_lords.get(nakshatra, 'Unknown')} Mahadasha influence"

    def _get_antardasha_flow(self, nakshatra: str, year: int) -> str:
        return "Antardasha lords bring specific sub-period influences"

    def _get_house_yearly(self, house: int, zodiac: str, ascendant: str) -> str:
        house_themes = {
            1: "Self-development, health, new initiatives",
            2: "Wealth accumulation, family matters, speech",
            4: "Property, vehicles, mother, education",
            5: "Children, creativity, romance, speculation",
            7: "Marriage, partnerships, business relationships",
            9: "Fortune, father, long journeys, higher learning",
            10: "Career advancement, reputation, authority",
            11: "Gains, income, fulfillment of desires"
        }
        return house_themes.get(house, "Related matters developing")

    def _get_career_yearly(self, zodiac: str, ruler: str) -> str:
        return f"Professional growth through consistent effort. Major opportunities Q2-Q3. Leadership potential increases."

    def _get_love_yearly(self, moon_sign: str, zodiac: str) -> str:
        return f"Relationship deepening. New connections possible Q1-Q2. Commitment milestones Q4."

    def _get_finance_yearly(self, zodiac: str) -> str:
        return "Wealth accumulation favored. Best investment periods: April-June, October-November."

    def _get_health_yearly(self, element: str, nakshatra: str) -> str:
        return f"Overall vitality good with proper care. {element} constitution needs seasonal attention."

    def _get_career_yearly_detailed(self, zodiac: str, ruler: str, ascendant: str, year: int) -> str:
        return f"10th lord from {ascendant} receives support. Major career shifts possible when Saturn aspects. Recognition Q2-Q3."

    def _get_love_yearly_detailed(self, moon_sign: str, zodiac: str, nakshatra: str, year: int) -> str:
        return f"7th house activated throughout year. {nakshatra} natives experience significant relationship developments. Marriage yoga if applicable."

    def _get_finance_yearly_detailed(self, zodiac: str, ruler: str, year: int) -> str:
        return f"Dhana yoga activation based on 2nd and 11th lords. Wealth accumulation steady. Investment timing: Jupiter transits."

    def _get_health_yearly_detailed(self, element: str, nakshatra_info: Dict, year: int) -> str:
        return f"Ayu yoga indicates overall longevity. {element} constitution requires seasonal attention. {nakshatra_info.get('quality', 'Natural')} energy supports healing."

    def _get_spiritual_yearly(self, nakshatra_info: Dict, zodiac: str, year: int) -> str:
        return f"Moksha indicators active. {nakshatra_info.get('deity', 'Nakshatra deity')} worship accelerates spiritual progress. Pilgrimage recommended."

    def _get_ishta_devata(self, nakshatra_info: Dict) -> str:
        return f"{nakshatra_info.get('deity', 'Your nakshatra deity')} - daily worship recommended"

    def _get_yearly_mantra(self, nakshatra_info: Dict, ruler: str) -> str:
        return f"Nakshatra Mantra: Om {nakshatra_info.get('deity', 'Namah').split()[0]}aya Namaha (10,000 times annually)\nPlanetary: Om {ruler}aya Namaha (108 daily)"

    def _get_yearly_gemstone(self, ruler: str, zodiac: str) -> str:
        gemstones = {
            'Sun': 'Ruby (3+ carats)', 'Moon': 'Pearl/Moonstone (5+ carats)',
            'Mars': 'Red Coral (5+ carats)', 'Mercury': 'Emerald (3+ carats)',
            'Jupiter': 'Yellow Sapphire (3+ carats)', 'Venus': 'Diamond/White Sapphire',
            'Saturn': 'Blue Sapphire (3+ carats) - with caution'
        }
        return gemstones.get(ruler, 'Consult for specific recommendation')

    def _get_yearly_charity(self, ruler: str) -> str:
        return f"Regular dana on {ruler} day. Annual charity: Food, education, medical assistance."

    def _get_pilgrimage_sites(self, nakshatra_info: Dict) -> str:
        return f"Temple of {nakshatra_info.get('deity', 'nakshatra deity')}, Jyotirlinga, Shakti Peetha"

    def _get_eclipse_impact(self, zodiac: str, year: int) -> str:
        return "Solar/Lunar eclipses require fasting and spiritual practices. Avoid major decisions."


# Singleton instance
_offline_wisdom_generator = None

def get_offline_wisdom_generator():
    """Get or create offline wisdom generator singleton"""
    global _offline_wisdom_generator
    if _offline_wisdom_generator is None:
        _offline_wisdom_generator = BhriguOfflineWisdomGenerator()
    return _offline_wisdom_generator


def get_offline_wisdom_initialization_errors() -> List[str]:
    """Get initialization errors recorded during offline wisdom setup."""
    if _offline_wisdom_generator and getattr(_offline_wisdom_generator, "initialization_errors", None):
        return list(_offline_wisdom_generator.initialization_errors)
    return []

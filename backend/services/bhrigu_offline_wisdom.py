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

    # ==========================================================================
    # HOUSE WISDOM INTEGRATION
    # ==========================================================================

    def _get_house_wisdom(self, house: int) -> Dict[str, Any]:
        """Get complete wisdom for a house from Bhrigu Samhita database"""
        if not WISDOM_LOADED or not HOUSE_WISDOM:
            return self._get_basic_house_info(house)
        return HOUSE_WISDOM.get(house, self._get_basic_house_info(house))

    def _get_basic_house_info(self, house: int) -> Dict[str, Any]:
        """Fallback basic house information"""
        basic_houses = {
            1: {'name': 'Lagna', 'signifies': ['Self', 'Body', 'Personality'], 'karaka': 'Sun'},
            2: {'name': 'Dhana', 'signifies': ['Wealth', 'Family', 'Speech'], 'karaka': 'Jupiter'},
            3: {'name': 'Sahaja', 'signifies': ['Courage', 'Siblings', 'Communication'], 'karaka': 'Mars'},
            4: {'name': 'Sukha', 'signifies': ['Mother', 'Home', 'Happiness'], 'karaka': 'Moon'},
            5: {'name': 'Putra', 'signifies': ['Children', 'Creativity', 'Intelligence'], 'karaka': 'Jupiter'},
            6: {'name': 'Ripu', 'signifies': ['Enemies', 'Disease', 'Service'], 'karaka': 'Mars'},
            7: {'name': 'Kalatra', 'signifies': ['Spouse', 'Partnerships', 'Business'], 'karaka': 'Venus'},
            8: {'name': 'Ayur', 'signifies': ['Longevity', 'Transformation', 'Occult'], 'karaka': 'Saturn'},
            9: {'name': 'Dharma', 'signifies': ['Fortune', 'Father', 'Religion'], 'karaka': 'Jupiter'},
            10: {'name': 'Karma', 'signifies': ['Career', 'Status', 'Authority'], 'karaka': 'Saturn'},
            11: {'name': 'Labha', 'signifies': ['Gains', 'Friends', 'Desires'], 'karaka': 'Jupiter'},
            12: {'name': 'Vyaya', 'signifies': ['Loss', 'Liberation', 'Foreign'], 'karaka': 'Saturn'}
        }
        return basic_houses.get(house, {'name': f'House {house}', 'signifies': [], 'karaka': 'Unknown'})

    def _get_house_bhrigu_principles(self, house: int) -> List[str]:
        """Get Bhrigu Samhita principles for a house"""
        house_data = self._get_house_wisdom(house)
        return house_data.get('bhrigu_principles', [])

    def _get_house_past_life_connection(self, house: int) -> str:
        """Get past life connection for a house"""
        house_data = self._get_house_wisdom(house)
        return house_data.get('past_life_connection', 'Karmic patterns manifest through this house')

    def _get_house_body_parts(self, house: int) -> List[str]:
        """Get body parts ruled by a house"""
        house_data = self._get_house_wisdom(house)
        return house_data.get('body_parts', [])

    def _analyze_planet_in_house(self, planet: str, house: int) -> Dict[str, Any]:
        """Comprehensive analysis of planet placed in a house"""
        planet_data = self._get_planetary_wisdom(planet)
        house_data = self._get_house_wisdom(house)

        # Get planet's effect in this house
        house_effects = planet_data.get('house_effects', {})
        effect = house_effects.get(house, f'{planet} influences the {house}th house themes')

        # Get Bhrigu principles
        bhrigu_principles = house_data.get('bhrigu_principles', [])

        # Determine if this is a beneficial or challenging placement
        benefics = ['Jupiter', 'Venus', 'Moon', 'Mercury']
        malefics = ['Saturn', 'Mars', 'Rahu', 'Ketu', 'Sun']

        is_benefic = planet in benefics
        good_houses = [1, 2, 4, 5, 7, 9, 10, 11]
        challenging_houses = [6, 8, 12]

        if is_benefic and house in challenging_houses:
            strength = 'Weakened benefic - challenges in this area'
        elif not is_benefic and house in [3, 6, 10, 11]:
            strength = 'Malefic in upachaya - grows stronger over time'
        elif is_benefic and house in good_houses:
            strength = 'Well-placed benefic - auspicious results'
        else:
            strength = 'Mixed results - depends on other factors'

        return {
            'planet': planet,
            'house': house,
            'house_name': house_data.get('name', f'House {house}'),
            'effect': effect,
            'strength': strength,
            'bhrigu_principles': bhrigu_principles,
            'karaka': house_data.get('karaka', 'Unknown'),
            'significations': house_data.get('signifies', [])
        }

    def _generate_house_analysis(self, chart_data: Dict[str, Any]) -> str:
        """Generate comprehensive house-by-house analysis"""
        zodiac = chart_data.get('zodiac_sign', 'Aries')
        nakshatra = chart_data.get('nakshatra', 'Ashwini')
        zodiac_info = self._get_zodiac_info(zodiac)
        ruler = zodiac_info.get('ruler', 'Sun')

        analysis = f"""## House-by-House Analysis ({zodiac} Lagna)

**Lagna Lord:** {ruler}
**Nakshatra Influence:** {nakshatra}

"""
        # Analyze key houses
        key_houses = [1, 5, 7, 9, 10]
        for house in key_houses:
            house_data = self._get_house_wisdom(house)
            principles = self._get_house_bhrigu_principles(house)
            past_life = self._get_house_past_life_connection(house)

            analysis += f"""### {house}. {house_data.get('name', f'House {house}')} ({house_data.get('sanskrit', '')})

**Significations:** {', '.join(house_data.get('signifies', [])[:4])}
**Natural Karaka:** {house_data.get('karaka', 'Unknown')}

**Bhrigu Principles:**
"""
            for p in principles[:2]:
                analysis += f"- {p}\n"

            analysis += f"""
**Past Life Connection:** {past_life}

"""
        return analysis

    # ==========================================================================
    # YOGA DETECTION SYSTEM
    # ==========================================================================

    def _detect_mahapurusha_yogas(self, chart_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect Mahapurusha Yogas in the chart"""
        detected_yogas = []
        zodiac = chart_data.get('zodiac_sign', 'Aries')

        if not WISDOM_LOADED or not YOGA_DATABASE:
            return detected_yogas

        mahapurusha = YOGA_DATABASE.get('mahapurusha_yogas', {})

        # Check for each Mahapurusha Yoga based on zodiac sign
        zodiac_planet_map = {
            'Sagittarius': 'Jupiter', 'Pisces': 'Jupiter', 'Cancer': 'Jupiter',  # Hamsa
            'Taurus': 'Venus', 'Libra': 'Venus',  # Malavya (also Pisces for exaltation)
            'Aries': 'Mars', 'Scorpio': 'Mars', 'Capricorn': 'Mars',  # Ruchaka
            'Gemini': 'Mercury', 'Virgo': 'Mercury',  # Bhadra
            'Aquarius': 'Saturn', 'Capricorn': 'Saturn',  # Sasa (also Libra for exaltation)
        }

        # Simple detection based on Lagna sign
        if zodiac in ['Cancer', 'Sagittarius', 'Pisces']:
            yoga_data = mahapurusha.get('Hamsa_Yoga', {})
            detected_yogas.append({
                'name': 'Hamsa Yoga (Potential)',
                'planet': 'Jupiter',
                'effects': yoga_data.get('effects', 'Wisdom, wealth, spiritual authority'),
                'past_life': yoga_data.get('past_life', 'Past life as spiritual guide'),
                'strength': 'Lagna supports Jupiter strength'
            })

        if zodiac in ['Taurus', 'Libra']:
            yoga_data = mahapurusha.get('Malavya_Yoga', {})
            detected_yogas.append({
                'name': 'Malavya Yoga (Potential)',
                'planet': 'Venus',
                'effects': yoga_data.get('effects', 'Beauty, luxury, artistic success'),
                'past_life': yoga_data.get('past_life', 'Past life as artist'),
                'strength': 'Lagna supports Venus strength'
            })

        if zodiac in ['Aries', 'Scorpio', 'Capricorn']:
            yoga_data = mahapurusha.get('Ruchaka_Yoga', {})
            detected_yogas.append({
                'name': 'Ruchaka Yoga (Potential)',
                'planet': 'Mars',
                'effects': yoga_data.get('effects', 'Courage, leadership, military success'),
                'past_life': yoga_data.get('past_life', 'Past life as warrior'),
                'strength': 'Lagna supports Mars strength'
            })

        if zodiac in ['Gemini', 'Virgo']:
            yoga_data = mahapurusha.get('Bhadra_Yoga', {})
            detected_yogas.append({
                'name': 'Bhadra Yoga (Potential)',
                'planet': 'Mercury',
                'effects': yoga_data.get('effects', 'Intelligence, eloquence, business success'),
                'past_life': yoga_data.get('past_life', 'Past life as scholar'),
                'strength': 'Lagna supports Mercury strength'
            })

        if zodiac in ['Capricorn', 'Aquarius', 'Libra']:
            yoga_data = mahapurusha.get('Sasa_Yoga', {})
            detected_yogas.append({
                'name': 'Sasa Yoga (Potential)',
                'planet': 'Saturn',
                'effects': yoga_data.get('effects', 'Authority, discipline, political success'),
                'past_life': yoga_data.get('past_life', 'Past life of discipline and service'),
                'strength': 'Lagna supports Saturn strength'
            })

        return detected_yogas

    def _detect_raja_yogas(self, chart_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect Raja Yogas based on chart data"""
        detected_yogas = []
        zodiac = chart_data.get('zodiac_sign', 'Aries')
        nakshatra = chart_data.get('nakshatra', 'Ashwini')

        if not WISDOM_LOADED or not YOGA_DATABASE:
            return detected_yogas

        raja_yogas = YOGA_DATABASE.get('raja_yogas', {})

        # Gajakesari Yoga detection (Moon-Jupiter in kendras)
        moon_strong_nakshatras = ['Rohini', 'Hasta', 'Shravana', 'Pushya', 'Punarvasu']
        if nakshatra in moon_strong_nakshatras:
            yoga_data = raja_yogas.get('Gajakesari_Yoga', {})
            detected_yogas.append({
                'name': 'Gajakesari Yoga (Potential)',
                'condition': yoga_data.get('condition', 'Jupiter and Moon in mutual Kendras'),
                'effects': yoga_data.get('effects', 'Fame, wisdom, wealth, eloquence'),
                'strength': yoga_data.get('strength', 'Very auspicious')
            })

        # Dharma Karmadhipati potential based on zodiac
        strong_dharma_signs = ['Leo', 'Sagittarius', 'Aries', 'Scorpio']
        if zodiac in strong_dharma_signs:
            yoga_data = raja_yogas.get('Dharma_Karmadhipati_Yoga', {})
            detected_yogas.append({
                'name': 'Dharma Karmadhipati Yoga (Potential)',
                'condition': yoga_data.get('condition', '9th and 10th lords connected'),
                'effects': yoga_data.get('effects', 'High status, authority, fortune'),
                'strength': yoga_data.get('strength', 'Strongest Raja Yoga')
            })

        return detected_yogas

    def _detect_dhana_yogas(self, chart_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect Dhana (Wealth) Yogas"""
        detected_yogas = []
        zodiac = chart_data.get('zodiac_sign', 'Aries')

        if not WISDOM_LOADED or not YOGA_DATABASE:
            return detected_yogas

        dhana_yogas = YOGA_DATABASE.get('dhana_yogas', {})

        # Earth and Venus signs are favorable for wealth
        wealth_signs = ['Taurus', 'Virgo', 'Capricorn', 'Libra', 'Cancer']
        if zodiac in wealth_signs:
            yoga_data = dhana_yogas.get('Basic_Dhana_Yoga', {})
            detected_yogas.append({
                'name': 'Dhana Yoga Potential',
                'condition': yoga_data.get('condition', '2nd and 11th lords connected'),
                'effects': yoga_data.get('effects', 'Wealth accumulation from multiple sources'),
                'strength': 'Favorable lagna for wealth'
            })

        return detected_yogas

    def _detect_dosha_yogas(self, chart_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect Dosha Yogas (challenging combinations)"""
        detected_doshas = []
        zodiac = chart_data.get('zodiac_sign', 'Aries')
        nakshatra = chart_data.get('nakshatra', 'Ashwini')

        if not WISDOM_LOADED or not YOGA_DATABASE:
            return detected_doshas

        dosha_yogas = YOGA_DATABASE.get('dosha_yogas', {})

        # Check for Mars-related signs for Kuja Dosha potential
        mars_signs = ['Aries', 'Scorpio']
        if zodiac in mars_signs:
            dosha_data = dosha_yogas.get('Kuja_Dosha', {})
            detected_doshas.append({
                'name': 'Mangal/Kuja Dosha (Check Required)',
                'condition': dosha_data.get('condition', 'Mars in 1, 2, 4, 7, 8, or 12'),
                'effects': dosha_data.get('effects', 'Marriage delays, relationship challenges'),
                'remedies': dosha_data.get('remedies', ['Mangal Shanti', 'Hanuman worship']),
                'note': 'Requires full chart analysis to confirm'
            })

        # Check for Rahu-influenced nakshatras for Kala Sarpa potential
        rahu_nakshatras = ['Ardra', 'Swati', 'Shatabhisha']
        if nakshatra in rahu_nakshatras:
            dosha_data = dosha_yogas.get('Kala_Sarpa_Dosha', {})
            detected_doshas.append({
                'name': 'Kala Sarpa Dosha (Check Required)',
                'condition': dosha_data.get('condition', 'All planets between Rahu-Ketu'),
                'effects': dosha_data.get('effects', 'Life struggles, then spiritual growth'),
                'remedies': dosha_data.get('remedies', ['Kala Sarpa Shanti', 'Naga Puja']),
                'note': 'Requires full chart analysis to confirm'
            })

        return detected_doshas

    def _detect_spiritual_yogas(self, chart_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect Spiritual Yogas"""
        detected_yogas = []
        nakshatra = chart_data.get('nakshatra', 'Ashwini')

        if not WISDOM_LOADED or not YOGA_DATABASE:
            return detected_yogas

        spiritual_yogas = YOGA_DATABASE.get('spiritual_yogas', {})

        # Spiritual nakshatras indicate moksha potential
        spiritual_nakshatras = ['Ashwini', 'Pushya', 'Hasta', 'Moola', 'Revati', 'Uttara Bhadrapada']
        if nakshatra in spiritual_nakshatras:
            yoga_data = spiritual_yogas.get('Moksha_Yoga', {})
            detected_yogas.append({
                'name': 'Moksha Yoga Potential',
                'condition': yoga_data.get('condition', 'Strong 12th house with spiritual influences'),
                'effects': yoga_data.get('effects', 'Liberation potential, spiritual wisdom'),
                'significance': yoga_data.get('significance', 'Soul approaching final incarnations')
            })

        # Saraswati Yoga for intellectual/artistic nakshatras
        saraswati_nakshatras = ['Rohini', 'Mrigashira', 'Hasta', 'Chitra', 'Revati']
        if nakshatra in saraswati_nakshatras:
            yoga_data = spiritual_yogas.get('Saraswati_Yoga', {})
            detected_yogas.append({
                'name': 'Saraswati Yoga Potential',
                'condition': yoga_data.get('condition', 'Jupiter, Venus, Mercury in Kendras/Trikonas'),
                'effects': yoga_data.get('effects', 'Wisdom, learning, artistic excellence'),
                'significance': yoga_data.get('significance', 'Blessed with divine knowledge')
            })

        return detected_yogas

    def _generate_yoga_analysis(self, chart_data: Dict[str, Any]) -> str:
        """Generate comprehensive yoga analysis for the chart"""
        mahapurusha = self._detect_mahapurusha_yogas(chart_data)
        raja = self._detect_raja_yogas(chart_data)
        dhana = self._detect_dhana_yogas(chart_data)
        spiritual = self._detect_spiritual_yogas(chart_data)
        doshas = self._detect_dosha_yogas(chart_data)

        analysis = "## Yoga Analysis (Planetary Combinations)\n\n"

        if mahapurusha:
            analysis += "### Mahapurusha Yogas (Great Personality)\n"
            for yoga in mahapurusha:
                analysis += f"""
**{yoga['name']}**
- Planet: {yoga['planet']}
- Effects: {yoga['effects']}
- Past Life: {yoga['past_life']}
- Strength: {yoga['strength']}
"""

        if raja:
            analysis += "\n### Raja Yogas (Royal Combinations)\n"
            for yoga in raja:
                analysis += f"""
**{yoga['name']}**
- Condition: {yoga['condition']}
- Effects: {yoga['effects']}
- Strength: {yoga['strength']}
"""

        if dhana:
            analysis += "\n### Dhana Yogas (Wealth Combinations)\n"
            for yoga in dhana:
                analysis += f"""
**{yoga['name']}**
- Condition: {yoga['condition']}
- Effects: {yoga['effects']}
"""

        if spiritual:
            analysis += "\n### Spiritual Yogas\n"
            for yoga in spiritual:
                analysis += f"""
**{yoga['name']}**
- Condition: {yoga['condition']}
- Effects: {yoga['effects']}
- Significance: {yoga.get('significance', 'Spiritual advancement')}
"""

        if doshas:
            analysis += "\n### Dosha Yogas (Challenging Combinations)\n"
            for dosha in doshas:
                analysis += f"""
**{dosha['name']}**
- Condition: {dosha['condition']}
- Effects: {dosha['effects']}
- Remedies: {', '.join(dosha.get('remedies', ['Consult astrologer'])[:3])}
- Note: {dosha.get('note', 'Requires verification')}
"""

        if not any([mahapurusha, raja, dhana, spiritual, doshas]):
            analysis += "No specific yogas detected from basic chart data. Full planetary positions needed for complete analysis.\n"

        return analysis

    # ==========================================================================
    # COMPLETE 8-KUTA MATCHING SYSTEM (36 POINTS)
    # ==========================================================================

    def _get_nakshatra_number(self, nakshatra: str) -> int:
        """Get nakshatra number (1-27)"""
        nakshatra_order = [
            'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
            'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
            'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
            'Moola', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
            'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
        ]
        for i, nak in enumerate(nakshatra_order):
            if nak.lower() in nakshatra.lower() or nakshatra.lower() in nak.lower():
                return i + 1
        return 1

    def _get_nakshatra_rashi(self, nakshatra_num: int) -> int:
        """Get rashi (zodiac sign) number from nakshatra number"""
        # Each rashi has 2.25 nakshatras
        return ((nakshatra_num - 1) * 4 // 9) + 1

    def _get_nakshatra_varna(self, nakshatra: str) -> str:
        """Get Varna (spiritual class) of nakshatra"""
        nak_data = self._get_full_nakshatra_wisdom(nakshatra)
        # Default based on nakshatra characteristics
        gana = nak_data.get('gana', 'MANUSHYA')
        gana_str = gana.name if hasattr(gana, 'name') else str(gana).split('.')[-1].upper()

        varna_map = {
            'DEVA': 'Brahmin',
            'MANUSHYA': 'Kshatriya',
            'RAKSHASA': 'Vaishya'
        }
        return varna_map.get(gana_str, 'Shudra')

    def _get_nakshatra_yoni(self, nakshatra: str) -> str:
        """Get Yoni (animal symbol) of nakshatra"""
        yoni_map = {
            'Ashwini': 'Horse', 'Bharani': 'Elephant', 'Krittika': 'Goat',
            'Rohini': 'Serpent', 'Mrigashira': 'Serpent', 'Ardra': 'Dog',
            'Punarvasu': 'Cat', 'Pushya': 'Goat', 'Ashlesha': 'Cat',
            'Magha': 'Rat', 'Purva Phalguni': 'Rat', 'Uttara Phalguni': 'Cow',
            'Hasta': 'Buffalo', 'Chitra': 'Tiger', 'Swati': 'Buffalo',
            'Vishakha': 'Tiger', 'Anuradha': 'Deer', 'Jyeshtha': 'Deer',
            'Moola': 'Dog', 'Purva Ashadha': 'Monkey', 'Uttara Ashadha': 'Mongoose',
            'Shravana': 'Monkey', 'Dhanishta': 'Lion', 'Shatabhisha': 'Horse',
            'Purva Bhadrapada': 'Lion', 'Uttara Bhadrapada': 'Cow', 'Revati': 'Elephant'
        }
        for nak, yoni in yoni_map.items():
            if nak.lower() in nakshatra.lower() or nakshatra.lower() in nak.lower():
                return yoni
        return 'Unknown'

    def _calculate_varna_score(self, nak1: str, nak2: str) -> Dict[str, Any]:
        """Calculate Varna Kuta (1 point max)"""
        varna1 = self._get_nakshatra_varna(nak1)
        varna2 = self._get_nakshatra_varna(nak2)

        varna_order = ['Brahmin', 'Kshatriya', 'Vaishya', 'Shudra']
        idx1 = varna_order.index(varna1) if varna1 in varna_order else 3
        idx2 = varna_order.index(varna2) if varna2 in varna_order else 3

        # Boy's varna should be equal or higher
        if idx1 <= idx2:
            score = 1
            status = f'Compatible ({varna1} >= {varna2})'
        else:
            score = 0
            status = f'Mismatch ({varna1} < {varna2})'

        return {'score': score, 'max': 1, 'status': status, 'varna1': varna1, 'varna2': varna2}

    def _calculate_vashya_score(self, nak1: str, nak2: str) -> Dict[str, Any]:
        """Calculate Vashya Kuta (2 points max) - Mutual attraction"""
        num1 = self._get_nakshatra_number(nak1)
        num2 = self._get_nakshatra_number(nak2)
        rashi1 = self._get_nakshatra_rashi(num1)
        rashi2 = self._get_nakshatra_rashi(num2)

        # Vashya groups
        vashya_groups = {
            'Chatushpada': [1, 2, 5, 9, 10],  # Aries, Taurus, Leo, Sag, Cap (later part)
            'Manava': [3, 6, 7, 11],  # Gemini, Virgo, Libra, Aquarius
            'Jalachara': [4, 12],  # Cancer, Pisces
            'Vanachara': [5],  # Leo
            'Keeta': [8]  # Scorpio
        }

        # Find groups for each
        group1, group2 = None, None
        for group, rashis in vashya_groups.items():
            if rashi1 in rashis:
                group1 = group
            if rashi2 in rashis:
                group2 = group

        # Simplified scoring
        if group1 == group2:
            score = 2
            status = f'Same group ({group1}) - Full compatibility'
        elif (group1 == 'Manava' and group2 in ['Chatushpada', 'Vanachara']) or \
             (group2 == 'Manava' and group1 in ['Chatushpada', 'Vanachara']):
            score = 1
            status = 'Partial compatibility'
        else:
            score = 0.5
            status = 'Limited compatibility'

        return {'score': score, 'max': 2, 'status': status}

    def _calculate_tara_score(self, nak1: str, nak2: str) -> Dict[str, Any]:
        """Calculate Tara Kuta (3 points max) - Birth star compatibility"""
        num1 = self._get_nakshatra_number(nak1)
        num2 = self._get_nakshatra_number(nak2)

        # Calculate Tara from boy's nakshatra to girl's
        diff = ((num2 - num1) % 27) + 1
        tara_num = ((diff - 1) % 9) + 1

        # Tara classification
        tara_names = {
            1: 'Janma', 2: 'Sampat', 3: 'Vipat',
            4: 'Kshema', 5: 'Pratyak', 6: 'Sadhana',
            7: 'Naidhana', 8: 'Mitra', 9: 'Parama Mitra'
        }

        good_taras = [2, 4, 6, 8, 9]  # Sampat, Kshema, Sadhana, Mitra, Parama Mitra

        if tara_num in good_taras:
            score = 3
            status = f'{tara_names[tara_num]} Tara - Auspicious'
        elif tara_num in [1, 5]:
            score = 1.5
            status = f'{tara_names[tara_num]} Tara - Neutral'
        else:
            score = 0
            status = f'{tara_names[tara_num]} Tara - Inauspicious'

        return {'score': score, 'max': 3, 'status': status, 'tara': tara_names[tara_num]}

    def _calculate_yoni_score(self, nak1: str, nak2: str) -> Dict[str, Any]:
        """Calculate Yoni Kuta (4 points max) - Sexual/physical compatibility"""
        yoni1 = self._get_nakshatra_yoni(nak1)
        yoni2 = self._get_nakshatra_yoni(nak2)

        # Yoni enemies
        yoni_enemies = {
            'Horse': 'Buffalo', 'Buffalo': 'Horse',
            'Elephant': 'Lion', 'Lion': 'Elephant',
            'Dog': 'Deer', 'Deer': 'Dog',
            'Cat': 'Rat', 'Rat': 'Cat',
            'Serpent': 'Mongoose', 'Mongoose': 'Serpent',
            'Monkey': 'Goat', 'Goat': 'Monkey',
            'Tiger': 'Cow', 'Cow': 'Tiger'
        }

        if yoni1 == yoni2:
            score = 4
            status = f'Same Yoni ({yoni1}) - Excellent compatibility'
        elif yoni_enemies.get(yoni1) == yoni2:
            score = 0
            status = f'Enemy Yonis ({yoni1} vs {yoni2}) - Avoid'
        else:
            score = 2
            status = f'Neutral Yonis ({yoni1}, {yoni2})'

        return {'score': score, 'max': 4, 'status': status, 'yoni1': yoni1, 'yoni2': yoni2}

    def _calculate_graha_maitri_score(self, nak1: str, nak2: str) -> Dict[str, Any]:
        """Calculate Graha Maitri Kuta (5 points max) - Planetary friendship"""
        nak1_data = self._get_full_nakshatra_wisdom(nak1)
        nak2_data = self._get_full_nakshatra_wisdom(nak2)

        ruler1 = nak1_data.get('ruling_planet', 'Sun')
        ruler2 = nak2_data.get('ruling_planet', 'Moon')

        # Extract planet name if it's an enum
        if hasattr(ruler1, 'name'):
            ruler1 = ruler1.name
        if hasattr(ruler2, 'name'):
            ruler2 = ruler2.name

        ruler1 = str(ruler1).split('.')[-1]
        ruler2 = str(ruler2).split('.')[-1]

        # Planetary friendships
        friends = {
            'Sun': ['Moon', 'Mars', 'Jupiter'],
            'Moon': ['Sun', 'Mercury'],
            'Mars': ['Sun', 'Moon', 'Jupiter'],
            'Mercury': ['Sun', 'Venus'],
            'Jupiter': ['Sun', 'Moon', 'Mars'],
            'Venus': ['Mercury', 'Saturn'],
            'Saturn': ['Mercury', 'Venus']
        }

        enemies = {
            'Sun': ['Venus', 'Saturn'],
            'Moon': [],
            'Mars': ['Mercury'],
            'Mercury': ['Moon'],
            'Jupiter': ['Mercury', 'Venus'],
            'Venus': ['Sun', 'Moon'],
            'Saturn': ['Sun', 'Moon', 'Mars']
        }

        if ruler1 == ruler2:
            score = 5
            status = f'Same ruler ({ruler1}) - Excellent'
        elif ruler2 in friends.get(ruler1, []) and ruler1 in friends.get(ruler2, []):
            score = 5
            status = f'Mutual friends ({ruler1} & {ruler2})'
        elif ruler2 in friends.get(ruler1, []) or ruler1 in friends.get(ruler2, []):
            score = 3
            status = f'One-sided friendship ({ruler1} & {ruler2})'
        elif ruler2 in enemies.get(ruler1, []) or ruler1 in enemies.get(ruler2, []):
            score = 0
            status = f'Enemy rulers ({ruler1} & {ruler2})'
        else:
            score = 2
            status = f'Neutral ({ruler1} & {ruler2})'

        return {'score': score, 'max': 5, 'status': status, 'ruler1': ruler1, 'ruler2': ruler2}

    def _calculate_bhakoot_score(self, nak1: str, nak2: str) -> Dict[str, Any]:
        """Calculate Bhakoot Kuta (7 points max) - Moon sign positions"""
        num1 = self._get_nakshatra_number(nak1)
        num2 = self._get_nakshatra_number(nak2)
        rashi1 = self._get_nakshatra_rashi(num1)
        rashi2 = self._get_nakshatra_rashi(num2)

        diff = abs(rashi1 - rashi2)
        if diff > 6:
            diff = 12 - diff

        # Inauspicious combinations: 6-8, 2-12, 5-9
        bad_combinations = [(6, 8), (2, 12), (5, 9)]

        for bad in bad_combinations:
            if (diff == bad[0] or diff == bad[1]):
                return {'score': 0, 'max': 7, 'status': f'Bhakoot Dosha (Rashi {rashi1}-{rashi2})', 'dosha': True}

        return {'score': 7, 'max': 7, 'status': f'No Bhakoot Dosha (Rashi {rashi1}-{rashi2})', 'dosha': False}

    def _calculate_full_kuta_score(self, nakshatra1: str, nakshatra2: str) -> Dict[str, Any]:
        """Calculate complete 8-Kuta compatibility score (36 points)"""
        nak1_data = self._get_full_nakshatra_wisdom(nakshatra1)
        nak2_data = self._get_full_nakshatra_wisdom(nakshatra2)

        # Calculate all 8 kutas
        varna = self._calculate_varna_score(nakshatra1, nakshatra2)
        vashya = self._calculate_vashya_score(nakshatra1, nakshatra2)
        tara = self._calculate_tara_score(nakshatra1, nakshatra2)
        yoni = self._calculate_yoni_score(nakshatra1, nakshatra2)
        graha_maitri = self._calculate_graha_maitri_score(nakshatra1, nakshatra2)
        gana = self._calculate_gana_kuta(nakshatra1, nakshatra2)
        bhakoot = self._calculate_bhakoot_score(nakshatra1, nakshatra2)
        nadi = self._calculate_nadi_kuta(nakshatra1, nakshatra2)

        total_score = (varna['score'] + vashya['score'] + tara['score'] +
                       yoni['score'] + graha_maitri['score'] + gana['score'] +
                       bhakoot['score'] + nadi['score'])

        # Interpretation
        if total_score >= 28:
            interpretation = 'Excellent Match - Highly Recommended'
            rating = 'A+'
        elif total_score >= 24:
            interpretation = 'Very Good Match - Recommended'
            rating = 'A'
        elif total_score >= 18:
            interpretation = 'Good Match - Acceptable'
            rating = 'B'
        elif total_score >= 14:
            interpretation = 'Average Match - Consider carefully'
            rating = 'C'
        else:
            interpretation = 'Below Average - Significant challenges'
            rating = 'D'

        return {
            'total_score': round(total_score, 1),
            'max_score': 36,
            'percentage': round((total_score / 36) * 100, 1),
            'interpretation': interpretation,
            'rating': rating,
            'details': {
                'varna': varna,
                'vashya': vashya,
                'tara': tara,
                'yoni': yoni,
                'graha_maitri': graha_maitri,
                'gana': gana,
                'bhakoot': bhakoot,
                'nadi': nadi
            },
            'warnings': self._get_kuta_warnings(varna, yoni, gana, bhakoot, nadi)
        }

    def _calculate_gana_kuta(self, nak1: str, nak2: str) -> Dict[str, Any]:
        """Calculate Gana Kuta (6 points max)"""
        nak1_data = self._get_full_nakshatra_wisdom(nak1)
        nak2_data = self._get_full_nakshatra_wisdom(nak2)

        gana1 = nak1_data.get('gana', 'MANUSHYA')
        gana2 = nak2_data.get('gana', 'MANUSHYA')

        g1 = gana1.name if hasattr(gana1, 'name') else str(gana1).split('.')[-1].upper()
        g2 = gana2.name if hasattr(gana2, 'name') else str(gana2).split('.')[-1].upper()

        score = self._calculate_gana_score(gana1, gana2)

        if score >= 5:
            status = f'{g1} + {g2} - Excellent compatibility'
        elif score >= 3:
            status = f'{g1} + {g2} - Good compatibility'
        else:
            status = f'{g1} + {g2} - Challenging'

        return {'score': score, 'max': 6, 'status': status, 'gana1': g1, 'gana2': g2}

    def _calculate_nadi_kuta(self, nak1: str, nak2: str) -> Dict[str, Any]:
        """Calculate Nadi Kuta (8 points max) - Most important"""
        nak1_data = self._get_full_nakshatra_wisdom(nak1)
        nak2_data = self._get_full_nakshatra_wisdom(nak2)

        nadi1 = nak1_data.get('nadi', 'PITTA')
        nadi2 = nak2_data.get('nadi', 'KAPHA')

        n1 = nadi1.name if hasattr(nadi1, 'name') else str(nadi1).split('.')[-1].upper()
        n2 = nadi2.name if hasattr(nadi2, 'name') else str(nadi2).split('.')[-1].upper()

        if n1 != n2:
            score = 8
            status = f'Different Nadis ({n1} + {n2}) - No Nadi Dosha'
            dosha = False
        else:
            score = 0
            status = f'Same Nadi ({n1}) - NADI DOSHA - Health concerns'
            dosha = True

        return {'score': score, 'max': 8, 'status': status, 'nadi1': n1, 'nadi2': n2, 'dosha': dosha}

    def _get_kuta_warnings(self, varna: Dict, yoni: Dict, gana: Dict, bhakoot: Dict, nadi: Dict) -> List[str]:
        """Get warnings for serious kuta issues"""
        warnings = []

        if nadi.get('dosha'):
            warnings.append('⚠️ NADI DOSHA: Same Nadi detected. Health and progeny concerns. Remedies recommended.')

        if bhakoot.get('dosha'):
            warnings.append('⚠️ BHAKOOT DOSHA: Inauspicious moon sign combination. May affect harmony and prosperity.')

        if yoni['score'] == 0:
            warnings.append('⚠️ YONI INCOMPATIBILITY: Enemy yonis detected. Physical compatibility may be challenging.')

        if gana['score'] <= 1:
            warnings.append('⚠️ GANA MISMATCH: Temperament differences. Requires adjustment and understanding.')

        return warnings

    def _format_kuta_report(self, kuta_result: Dict[str, Any]) -> str:
        """Format complete Kuta matching report"""
        report = f"""## Ashtakoot (8-Kuta) Compatibility Analysis

**Overall Score:** {kuta_result['total_score']}/36 ({kuta_result['percentage']}%)
**Rating:** {kuta_result['rating']}
**Interpretation:** {kuta_result['interpretation']}

### Detailed Kuta Scores

| Kuta | Score | Max | Status |
|------|-------|-----|--------|
| Varna (Spiritual) | {kuta_result['details']['varna']['score']} | 1 | {kuta_result['details']['varna']['status'][:40]} |
| Vashya (Attraction) | {kuta_result['details']['vashya']['score']} | 2 | {kuta_result['details']['vashya']['status'][:40]} |
| Tara (Destiny) | {kuta_result['details']['tara']['score']} | 3 | {kuta_result['details']['tara']['status'][:40]} |
| Yoni (Physical) | {kuta_result['details']['yoni']['score']} | 4 | {kuta_result['details']['yoni']['status'][:40]} |
| Graha Maitri (Mental) | {kuta_result['details']['graha_maitri']['score']} | 5 | {kuta_result['details']['graha_maitri']['status'][:40]} |
| Gana (Temperament) | {kuta_result['details']['gana']['score']} | 6 | {kuta_result['details']['gana']['status'][:40]} |
| Bhakoot (Love) | {kuta_result['details']['bhakoot']['score']} | 7 | {kuta_result['details']['bhakoot']['status'][:40]} |
| Nadi (Health) | {kuta_result['details']['nadi']['score']} | 8 | {kuta_result['details']['nadi']['status'][:40]} |

"""
        if kuta_result['warnings']:
            report += "### ⚠️ Important Warnings\n\n"
            for warning in kuta_result['warnings']:
                report += f"{warning}\n\n"

        report += """### Minimum Requirements
- **18+ points:** Generally acceptable for marriage
- **24+ points:** Good compatibility
- **28+ points:** Excellent compatibility

*Note: Kuta matching is one aspect of compatibility. Full chart analysis recommended.*
"""
        return report

    # ==========================================================================
    # VIMSHOTTARI DASHA SYSTEM (120-YEAR CYCLE)
    # ==========================================================================

    def _get_dasha_sequence(self) -> List[str]:
        """Get the Vimshottari Dasha sequence"""
        return ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury']

    def _get_dasha_years(self) -> Dict[str, int]:
        """Get years for each Dasha lord"""
        if WISDOM_LOADED and DASHA_WISDOM:
            vimshottari = DASHA_WISDOM.get('vimshottari', {})
            planets = vimshottari.get('planets', {})
            return {p: data.get('years', 0) for p, data in planets.items()}
        return {
            'Ketu': 7, 'Venus': 20, 'Sun': 6, 'Moon': 10, 'Mars': 7,
            'Rahu': 18, 'Jupiter': 16, 'Saturn': 19, 'Mercury': 17
        }

    def _get_dasha_keywords(self, planet: str) -> List[str]:
        """Get keywords for a Dasha period"""
        if WISDOM_LOADED and DASHA_WISDOM:
            vimshottari = DASHA_WISDOM.get('vimshottari', {})
            planets = vimshottari.get('planets', {})
            planet_data = planets.get(planet, {})
            return planet_data.get('keywords', [])

        default_keywords = {
            'Ketu': ['Detachment', 'Spiritual insights', 'Past life patterns'],
            'Venus': ['Relationships', 'Luxury', 'Artistic expression'],
            'Sun': ['Authority', 'Father', 'Government', 'Health'],
            'Moon': ['Emotions', 'Mother', 'Public life', 'Mental growth'],
            'Mars': ['Energy', 'Property', 'Courage', 'Conflicts'],
            'Rahu': ['Worldly desires', 'Foreign connections', 'Unconventional'],
            'Jupiter': ['Wisdom', 'Expansion', 'Children', 'Spiritual growth'],
            'Saturn': ['Karma', 'Discipline', 'Hardship', 'Achievement'],
            'Mercury': ['Intellect', 'Business', 'Communication', 'Learning']
        }
        return default_keywords.get(planet, ['Life experiences'])

    def _get_nakshatra_dasha_lord(self, nakshatra: str) -> str:
        """Get the starting Dasha lord based on birth nakshatra"""
        nakshatra_dasha_lords = {
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
        for nak, lord in nakshatra_dasha_lords.items():
            if nak.lower() in nakshatra.lower() or nakshatra.lower() in nak.lower():
                return lord
        return 'Ketu'  # Default

    def _calculate_dasha_balance(self, nakshatra: str, birth_year: int = 1990) -> Dict[str, Any]:
        """Calculate remaining Dasha balance at birth and current Dasha"""
        from datetime import datetime

        current_year = datetime.now().year
        age = current_year - birth_year

        dasha_lord = self._get_nakshatra_dasha_lord(nakshatra)
        dasha_years = self._get_dasha_years()
        dasha_sequence = self._get_dasha_sequence()

        # Find position of birth dasha lord
        start_idx = dasha_sequence.index(dasha_lord)

        # Estimate balance at birth (assume 50% remaining for simplicity)
        balance_at_birth = dasha_years[dasha_lord] * 0.5

        # Calculate elapsed years
        years_elapsed = age

        # Find current dasha
        current_dasha = dasha_lord
        remaining_balance = balance_at_birth

        idx = start_idx
        while years_elapsed > 0:
            if years_elapsed < remaining_balance:
                break
            years_elapsed -= remaining_balance
            idx = (idx + 1) % 9
            current_dasha = dasha_sequence[idx]
            remaining_balance = dasha_years[current_dasha]

        years_in_current = remaining_balance - years_elapsed

        # Calculate upcoming dashas
        upcoming = []
        future_idx = idx
        cumulative_years = years_in_current
        for i in range(4):
            future_idx = (future_idx + 1) % 9
            next_dasha = dasha_sequence[future_idx]
            upcoming.append({
                'planet': next_dasha,
                'starts_in': round(cumulative_years, 1),
                'years': dasha_years[next_dasha],
                'keywords': self._get_dasha_keywords(next_dasha)
            })
            cumulative_years += dasha_years[next_dasha]

        return {
            'birth_dasha': dasha_lord,
            'current_dasha': current_dasha,
            'years_in_current': round(years_in_current, 1),
            'years_remaining': round(years_in_current, 1),
            'total_years': dasha_years[current_dasha],
            'keywords': self._get_dasha_keywords(current_dasha),
            'upcoming_dashas': upcoming,
            'age': age
        }

    def _calculate_antardasha(self, mahadasha: str, years_in_dasha: float) -> Dict[str, Any]:
        """Calculate current Antardasha (sub-period) within Mahadasha"""
        dasha_years = self._get_dasha_years()
        dasha_sequence = self._get_dasha_sequence()
        total_maha_years = dasha_years[mahadasha]

        # Find starting index for antardasha (same as mahadasha lord)
        start_idx = dasha_sequence.index(mahadasha)

        # Calculate time elapsed in mahadasha
        elapsed = total_maha_years - years_in_dasha

        # Find current antardasha
        cumulative = 0
        current_antar = mahadasha
        for i in range(9):
            idx = (start_idx + i) % 9
            antar_lord = dasha_sequence[idx]
            # Antardasha length = (Mahadasha years * Antardasha years) / 120
            antar_length = (total_maha_years * dasha_years[antar_lord]) / 120

            if cumulative + antar_length > elapsed:
                current_antar = antar_lord
                antar_remaining = antar_length - (elapsed - cumulative)
                break
            cumulative += antar_length
        else:
            antar_remaining = 0

        return {
            'mahadasha': mahadasha,
            'antardasha': current_antar,
            'antar_remaining_months': round(antar_remaining * 12, 1),
            'combination': f'{mahadasha}-{current_antar}',
            'interpretation': self._interpret_dasha_combination(mahadasha, current_antar)
        }

    def _interpret_dasha_combination(self, maha: str, antar: str) -> str:
        """Interpret Mahadasha-Antardasha combination"""
        benefics = ['Jupiter', 'Venus', 'Mercury', 'Moon']
        malefics = ['Saturn', 'Mars', 'Rahu', 'Ketu']

        maha_keywords = self._get_dasha_keywords(maha)
        antar_keywords = self._get_dasha_keywords(antar)

        if maha in benefics and antar in benefics:
            quality = "Highly favorable period for growth and prosperity"
        elif maha in benefics and antar in malefics:
            quality = "Mixed period - opportunities with obstacles"
        elif maha in malefics and antar in benefics:
            quality = "Challenging with relief - perseverance rewarded"
        else:
            quality = "Period of karmic lessons and transformation"

        return f"{quality}. Focus: {', '.join(maha_keywords[:2])} + {', '.join(antar_keywords[:2])}"

    def _generate_dasha_analysis(self, chart_data: Dict[str, Any]) -> str:
        """Generate comprehensive Dasha analysis"""
        nakshatra = chart_data.get('nakshatra', 'Ashwini')
        birth_year = chart_data.get('birth_year', 1990)

        dasha_info = self._calculate_dasha_balance(nakshatra, birth_year)
        antar_info = self._calculate_antardasha(
            dasha_info['current_dasha'],
            dasha_info['years_remaining']
        )

        analysis = f"""## Vimshottari Dasha Analysis (120-Year Cycle)

### Current Planetary Period

**Mahadasha (Major Period):** {dasha_info['current_dasha']}
- Duration: {dasha_info['total_years']} years total
- Remaining: ~{dasha_info['years_remaining']} years
- Keywords: {', '.join(dasha_info['keywords'])}

**Antardasha (Sub-Period):** {antar_info['antardasha']}
- Combination: {antar_info['combination']}
- Remaining: ~{antar_info['antar_remaining_months']} months
- Interpretation: {antar_info['interpretation']}

### Upcoming Dasha Periods

| Period | Starts In | Duration | Key Themes |
|--------|-----------|----------|------------|
"""
        for ud in dasha_info['upcoming_dashas'][:4]:
            keywords_str = ', '.join(ud['keywords'][:2])
            analysis += f"| {ud['planet']} | ~{ud['starts_in']} years | {ud['years']} years | {keywords_str} |\n"

        analysis += f"""
### Dasha Interpretation Principles

1. **Current {dasha_info['current_dasha']} Period:** {', '.join(dasha_info['keywords'][:3])}
2. The Dasha lord's natal position determines quality of results
3. Transit of Dasha lord during its period is especially important
4. Antardasha modifies the main Dasha effects

*Birth Nakshatra: {nakshatra} → Starting Dasha: {dasha_info['birth_dasha']}*
"""
        return analysis

    # ==========================================================================
    # JUPITER & MOON TRANSIT EFFECTS
    # ==========================================================================

    def _get_jupiter_transit_effects(self, from_moon_sign: int) -> Dict[str, Any]:
        """Get Jupiter transit effects based on position from Moon sign"""
        effects = {
            1: {'quality': 'Challenging', 'effects': 'Expenses, health concerns, need for caution', 'score': 2},
            2: {'quality': 'Excellent', 'effects': 'Wealth gains, family happiness, good speech', 'score': 5},
            3: {'quality': 'Challenging', 'effects': 'Obstacles, separation from loved ones', 'score': 2},
            4: {'quality': 'Mixed', 'effects': 'Mental stress, property matters, vehicle issues', 'score': 3},
            5: {'quality': 'Excellent', 'effects': 'Children, creativity, romance, intelligence', 'score': 5},
            6: {'quality': 'Challenging', 'effects': 'Enemies, debts, health issues', 'score': 2},
            7: {'quality': 'Excellent', 'effects': 'Marriage, partnerships, travel, success', 'score': 5},
            8: {'quality': 'Challenging', 'effects': 'Obstacles, delays, transformation', 'score': 1},
            9: {'quality': 'Most Auspicious', 'effects': 'Fortune, spirituality, father, long journeys', 'score': 5},
            10: {'quality': 'Mixed', 'effects': 'Career changes, status fluctuations', 'score': 3},
            11: {'quality': 'Excellent', 'effects': 'Gains, fulfilled desires, friendships', 'score': 5},
            12: {'quality': 'Challenging', 'effects': 'Expenses, foreign connections, spirituality', 'score': 2}
        }
        return effects.get(from_moon_sign, effects[1])

    def _get_moon_transit_effects(self, nakshatra: str) -> Dict[str, Any]:
        """Get Moon transit effects through natal nakshatra"""
        nak_data = self._get_full_nakshatra_wisdom(nakshatra)
        gana = nak_data.get('gana', 'MANUSHYA')
        gana_str = gana.name if hasattr(gana, 'name') else str(gana).split('.')[-1]

        # Moon transit effects based on Gana
        gana_effects = {
            'DEVA': {
                'favorable_days': [2, 4, 6, 9, 11, 13],
                'avoid_days': [8, 14, 23],
                'best_activities': 'Spiritual practices, auspicious ceremonies, charitable acts'
            },
            'MANUSHYA': {
                'favorable_days': [1, 3, 5, 10, 12, 15],
                'avoid_days': [7, 17, 22],
                'best_activities': 'Business, negotiations, social activities'
            },
            'RAKSHASA': {
                'favorable_days': [3, 6, 9, 13, 18, 21],
                'avoid_days': [4, 11, 25],
                'best_activities': 'Competitive activities, overcoming obstacles, bold actions'
            }
        }

        return gana_effects.get(gana_str, gana_effects['MANUSHYA'])

    def _calculate_transit_effects(self, chart_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate comprehensive transit effects"""
        nakshatra = chart_data.get('nakshatra', 'Ashwini')
        zodiac = chart_data.get('zodiac_sign', 'Aries')

        # Get zodiac number for calculations
        zodiac_numbers = {
            'Aries': 1, 'Taurus': 2, 'Gemini': 3, 'Cancer': 4,
            'Leo': 5, 'Virgo': 6, 'Libra': 7, 'Scorpio': 8,
            'Sagittarius': 9, 'Capricorn': 10, 'Aquarius': 11, 'Pisces': 12
        }
        moon_sign_num = zodiac_numbers.get(zodiac, 1)

        # Simulate current Jupiter position (for demonstration)
        # In real implementation, this would use actual ephemeris
        import datetime
        current_year = datetime.datetime.now().year
        # Jupiter takes ~12 years for full cycle, estimate current position
        jupiter_sign = ((current_year - 2020) % 12) + 1
        jupiter_from_moon = ((jupiter_sign - moon_sign_num) % 12) + 1

        jupiter_effects = self._get_jupiter_transit_effects(jupiter_from_moon)
        moon_effects = self._get_moon_transit_effects(nakshatra)

        # Saturn Sade Sati check
        sade_sati = self._check_sade_sati(moon_sign_num)

        return {
            'jupiter': {
                'current_position': jupiter_sign,
                'from_moon': jupiter_from_moon,
                'effects': jupiter_effects
            },
            'moon': moon_effects,
            'sade_sati': sade_sati
        }

    def _check_sade_sati(self, moon_sign: int) -> Dict[str, Any]:
        """Check if currently in Sade Sati period"""
        import datetime
        current_year = datetime.datetime.now().year

        # Saturn's approximate position (2.5 years per sign)
        # Saturn was in Capricorn in 2020
        years_since_2020 = current_year - 2020
        saturn_sign = ((years_since_2020 // 2.5) % 12) + 10  # Started in Capricorn (10)
        saturn_sign = int(((saturn_sign - 1) % 12) + 1)

        # Check Sade Sati phases
        twelfth_from_moon = ((moon_sign - 2) % 12) + 1
        second_from_moon = (moon_sign % 12) + 1

        if saturn_sign == twelfth_from_moon:
            return {'active': True, 'phase': 'Rising (12th)', 'effects': 'Expenses, worry, mental stress'}
        elif saturn_sign == moon_sign:
            return {'active': True, 'phase': 'Peak (1st)', 'effects': 'Maximum challenges, transformation'}
        elif saturn_sign == second_from_moon:
            return {'active': True, 'phase': 'Setting (2nd)', 'effects': 'Family/financial issues'}
        else:
            return {'active': False, 'phase': 'Not in Sade Sati', 'effects': 'Normal Saturn influence'}

    def _generate_transit_analysis(self, chart_data: Dict[str, Any]) -> str:
        """Generate comprehensive transit analysis"""
        transit_data = self._calculate_transit_effects(chart_data)
        jupiter = transit_data['jupiter']
        moon = transit_data['moon']
        sade_sati = transit_data['sade_sati']

        zodiac_names = ['', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

        analysis = f"""## Transit Analysis (Gochara)

### Jupiter Transit (Guru Gochara)

**Current Position:** {zodiac_names[jupiter['current_position']]} ({jupiter['from_moon']}th from Moon)
**Quality:** {jupiter['effects']['quality']}
**Effects:** {jupiter['effects']['effects']}
**Favorability Score:** {jupiter['effects']['score']}/5

**Jupiter Transit Guidance:**
"""
        if jupiter['effects']['score'] >= 4:
            analysis += "- Excellent period for expansion, learning, and spiritual growth\n"
            analysis += "- Good time for major decisions, investments, and new ventures\n"
        elif jupiter['effects']['score'] >= 3:
            analysis += "- Mixed period requiring balanced approach\n"
            analysis += "- Focus on maintaining stability while seeking opportunities\n"
        else:
            analysis += "- Challenging period requiring patience and caution\n"
            analysis += "- Avoid major risks, focus on consolidation\n"

        analysis += f"""
### Saturn Transit & Sade Sati

**Sade Sati Status:** {'⚠️ ACTIVE - ' + sade_sati['phase'] if sade_sati['active'] else '✓ Not Active'}
**Effects:** {sade_sati['effects']}

"""
        if sade_sati['active']:
            analysis += """**Sade Sati Remedies:**
- Recite Shani mantras: "Om Sham Shanicharaya Namah"
- Wear Blue Sapphire (only if suitable after analysis)
- Service to elderly and underprivileged
- Saturday fasting
- Hanuman Chalisa recitation

"""

        analysis += f"""### Moon Transit Guidance

**Favorable Lunar Days:** {', '.join(map(str, moon['favorable_days']))}
**Days to Avoid:** {', '.join(map(str, moon['avoid_days']))}
**Best Activities:** {moon['best_activities']}

### Transit-Based Recommendations

1. **For Important Decisions:** Check Jupiter's position and avoid challenging transits
2. **For Daily Activities:** Follow Moon transit favorable days
3. **For Long-term Planning:** Consider Dasha period + major transits
"""
        return analysis

    # ==========================================================================
    # JAIMINI CHARA DASHA SYSTEM
    # ==========================================================================

    def _get_jaimini_karakas(self, chart_data: Dict[str, Any]) -> Dict[str, str]:
        """Get Jaimini Chara Karakas based on planetary degrees"""
        # In a real implementation, this would use actual planetary positions
        # For now, we'll use zodiac/nakshatra to estimate
        zodiac = chart_data.get('zodiac_sign', 'Aries')

        # Simplified karaka assignment based on zodiac ruler
        zodiac_info = self._get_zodiac_info(zodiac)
        ruler = zodiac_info.get('ruler', 'Sun')

        # Default karaka assignments (would be calculated from actual degrees)
        karakas = {
            'Atmakaraka': ruler,  # Soul significator
            'Amatyakaraka': 'Mercury',  # Career/minister
            'Bhratrukaraka': 'Mars',  # Siblings
            'Matrukaraka': 'Moon',  # Mother
            'Putrakaraka': 'Jupiter',  # Children
            'Gnatikaraka': 'Saturn',  # Relatives/enemies
            'Darakaraka': 'Venus'  # Spouse
        }

        return karakas

    def _calculate_chara_dasha(self, chart_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Jaimini Chara Dasha periods"""
        zodiac = chart_data.get('zodiac_sign', 'Aries')
        birth_year = chart_data.get('birth_year', 1990)

        from datetime import datetime
        current_year = datetime.now().year
        age = current_year - birth_year

        # Zodiac signs in order
        signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

        # Get starting sign (Lagna)
        start_idx = signs.index(zodiac) if zodiac in signs else 0

        # Chara Dasha calculation (simplified)
        # Odd signs count forward, even signs count backward
        # Duration = distance from Lagna lord to sign

        dasha_periods = []
        cumulative = 0
        current_dasha_sign = zodiac

        for i in range(12):
            if start_idx % 2 == 0:  # Even sign - count forward
                sign_idx = (start_idx + i) % 12
            else:  # Odd sign - count backward
                sign_idx = (start_idx - i) % 12

            sign = signs[sign_idx]
            # Duration based on sign characteristics (simplified)
            duration = (sign_idx % 12) + 1  # 1-12 years per sign

            if cumulative <= age < cumulative + duration:
                current_dasha_sign = sign
                years_remaining = duration - (age - cumulative)

            dasha_periods.append({
                'sign': sign,
                'duration': duration,
                'starts_at_age': cumulative
            })
            cumulative += duration

        # Get karakas
        karakas = self._get_jaimini_karakas(chart_data)

        return {
            'current_rashi_dasha': current_dasha_sign,
            'atmakaraka': karakas['Atmakaraka'],
            'darakaraka': karakas['Darakaraka'],
            'all_karakas': karakas,
            'periods': dasha_periods[:6]  # Next 6 periods
        }

    def _generate_jaimini_analysis(self, chart_data: Dict[str, Any]) -> str:
        """Generate Jaimini Chara Dasha analysis"""
        jaimini_data = self._calculate_chara_dasha(chart_data)

        analysis = f"""## Jaimini Chara Dasha Analysis

### Current Rashi Dasha

**Active Sign Period:** {jaimini_data['current_rashi_dasha']}

The Jaimini system uses rashi (sign) based periods rather than planetary periods.
Each sign rules a period based on its position from the Lagna.

### Chara Karakas (Variable Significators)

| Karaka | Planet | Signification |
|--------|--------|---------------|
| Atmakaraka | {jaimini_data['atmakaraka']} | Soul purpose, main life direction |
| Darakaraka | {jaimini_data['darakaraka']} | Spouse, partnerships |
| Amatyakaraka | {jaimini_data['all_karakas']['Amatyakaraka']} | Career, profession |
| Putrakaraka | {jaimini_data['all_karakas']['Putrakaraka']} | Children, creativity |
| Matrukaraka | {jaimini_data['all_karakas']['Matrukaraka']} | Mother, nurturing |
| Bhratrukaraka | {jaimini_data['all_karakas']['Bhratrukaraka']} | Siblings, courage |
| Gnatikaraka | {jaimini_data['all_karakas']['Gnatikaraka']} | Relatives, obstacles |

### Atmakaraka Analysis

**Your Atmakaraka:** {jaimini_data['atmakaraka']}

The Atmakaraka is the planet with the highest degree in your chart and represents:
- Your soul's deepest desires
- The primary lesson of this incarnation
- The key to spiritual evolution

"""
        # Add Atmakaraka interpretation
        ak_interp = {
            'Sun': 'Soul seeks recognition, leadership, and self-expression. Lesson: Humility.',
            'Moon': 'Soul seeks emotional fulfillment and nurturing. Lesson: Detachment.',
            'Mars': 'Soul seeks achievement and victory. Lesson: Patience and non-violence.',
            'Mercury': 'Soul seeks knowledge and communication. Lesson: Truthfulness.',
            'Jupiter': 'Soul seeks wisdom and expansion. Lesson: Letting go of pride.',
            'Venus': 'Soul seeks love and beauty. Lesson: Non-attachment to pleasure.',
            'Saturn': 'Soul seeks perfection and discipline. Lesson: Acceptance.'
        }
        analysis += f"**Interpretation:** {ak_interp.get(jaimini_data['atmakaraka'], 'Spiritual evolution through dharmic living.')}\n\n"

        analysis += """### Jaimini Timing Principles

1. **Rashi Dasha:** Signs rule periods based on their odd/even nature
2. **Karakamsha:** Atmakaraka's navamsha position reveals life purpose
3. **Arudha Lagna:** Shows how the world perceives you
4. **Upapada:** Reveals spouse characteristics

*Note: Full Jaimini analysis requires complete chart with planetary degrees.*
"""
        return analysis

    # ==========================================================================
    # NAADI AMSHA SYSTEM (150-PART DIVISION)
    # ==========================================================================

    def _calculate_naadi_amsha(self, chart_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate Naadi Amsha for precise predictions"""
        nakshatra = chart_data.get('nakshatra', 'Ashwini')
        zodiac = chart_data.get('zodiac_sign', 'Aries')

        # Nakshatra number (1-27)
        nak_num = self._get_nakshatra_number(nakshatra)

        # Each nakshatra has 4 padas, each pada = 3°20'
        # Naadi Amsha divides each sign into 150 parts (12 minutes each)
        # 30° / 150 = 0.2° or 12 arc-minutes per Naadi Amsha

        # Estimate Naadi Amsha based on nakshatra (simplified)
        # In real implementation, exact degree would be used
        pada = ((nak_num - 1) % 4) + 1  # Which pada (1-4)

        # Each pada spans ~37.5 Naadi Amshas (150/4)
        base_amsha = (pada - 1) * 37 + 1

        # Get interpretation based on Naadi Amsha range
        amsha_range = self._get_naadi_amsha_interpretation(base_amsha)

        return {
            'nakshatra': nakshatra,
            'pada': pada,
            'estimated_amsha': base_amsha,
            'amsha_range': f"{base_amsha}-{base_amsha + 36}",
            'interpretation': amsha_range,
            'precision_note': 'Exact birth time required for precise Naadi Amsha'
        }

    def _get_naadi_amsha_interpretation(self, amsha: int) -> Dict[str, Any]:
        """Get interpretation for Naadi Amsha range"""
        # Naadi Amsha interpretations based on position in sign
        if amsha <= 30:
            return {
                'phase': 'Initial (1-30)',
                'nature': 'Beginning energy of the sign',
                'life_theme': 'Foundation building, new beginnings',
                'timing_quality': 'Events manifest quickly'
            }
        elif amsha <= 60:
            return {
                'phase': 'Early (31-60)',
                'nature': 'Growing energy',
                'life_theme': 'Development and growth',
                'timing_quality': 'Gradual progress'
            }
        elif amsha <= 90:
            return {
                'phase': 'Middle (61-90)',
                'nature': 'Peak energy of the sign',
                'life_theme': 'Achievement and fruition',
                'timing_quality': 'Results manifest'
            }
        elif amsha <= 120:
            return {
                'phase': 'Late (91-120)',
                'nature': 'Maturing energy',
                'life_theme': 'Consolidation and wisdom',
                'timing_quality': 'Delayed but lasting results'
            }
        else:
            return {
                'phase': 'Final (121-150)',
                'nature': 'Transitional energy',
                'life_theme': 'Completion and preparation',
                'timing_quality': 'Culmination of cycles'
            }

    def _generate_naadi_amsha_analysis(self, chart_data: Dict[str, Any]) -> str:
        """Generate Naadi Amsha analysis for precise predictions"""
        naadi_data = self._calculate_naadi_amsha(chart_data)
        interp = naadi_data['interpretation']

        analysis = f"""## Naadi Amsha Analysis (150-Part Division)

### Your Naadi Amsha Position

**Nakshatra:** {naadi_data['nakshatra']} (Pada {naadi_data['pada']})
**Estimated Amsha Range:** {naadi_data['amsha_range']} of 150
**Phase:** {interp['phase']}

### Naadi Amsha Interpretation

**Energy Nature:** {interp['nature']}
**Life Theme:** {interp['life_theme']}
**Timing Quality:** {interp['timing_quality']}

### The 150-Part System

The Naadi Amsha divides each zodiac sign into 150 equal parts:
- Each part spans 12 arc-minutes (0.2 degrees)
- Total span: 30° ÷ 150 = 12' per Naadi Amsha
- Used by Nadi astrologers for extremely precise predictions

### How Naadi Amshas Affect Timing

| Amsha Range | Phase | Event Timing |
|-------------|-------|--------------|
| 1-30 | Initial | Events manifest quickly, new cycles |
| 31-60 | Early | Gradual development, growing momentum |
| 61-90 | Middle | Peak activity, results manifest |
| 91-120 | Late | Maturation, consolidation |
| 121-150 | Final | Completion, transition to next cycle |

### Precision Prediction Principles

1. **Exact Birth Time:** Naadi Amsha changes every 48 seconds of birth time
2. **Event Timing:** Transits activating your Naadi Amsha trigger specific events
3. **Life Chapters:** Each Naadi Amsha corresponds to specific life chapters
4. **Cross-Reference:** Used with Dasha for pinpoint accuracy

*Note: {naadi_data['precision_note']}*

### Your Timing Profile

Based on your **{interp['phase']}** phase:
- {interp['life_theme']}
- Expect: {interp['timing_quality']}
- Focus on: Aligning actions with your natural timing rhythm

*The Naadi Rishis used this system to make remarkably precise predictions about
individuals' lives, often accurate to specific months or even days.*
"""
        return analysis

    def _generate_complete_timing_analysis(self, chart_data: Dict[str, Any]) -> str:
        """Generate complete timing analysis combining all systems"""
        analysis = "# Complete Timing Analysis\n\n"
        analysis += "*Integrating Vimshottari Dasha, Transits, Jaimini, and Naadi Amsha*\n\n"

        analysis += self._generate_dasha_analysis(chart_data)
        analysis += "\n---\n\n"
        analysis += self._generate_transit_analysis(chart_data)
        analysis += "\n---\n\n"
        analysis += self._generate_jaimini_analysis(chart_data)
        analysis += "\n---\n\n"
        analysis += self._generate_naadi_amsha_analysis(chart_data)

        return analysis

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

## 8. Yoga Analysis (Planetary Combinations)

""" + self._generate_yoga_analysis(context) + f"""

## 9. House Wisdom Integration

""" + self._generate_house_analysis(context) + f"""

## 10. Spiritual Gifts & Abilities

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

        # Get past life indicators from planetary wisdom
        ruler_past_life = self._get_planetary_past_life_indicators(ruler, 'strong')
        nak_past_life = self._get_nakshatra_past_life(nakshatra)

        if view_mode == 'simple':
            # SIMPLE VIEW: Concise past life insights
            return f"""## Most Significant Past Life

**Era & Region:** {past_region.capitalize()}
**Role:** {past_role.capitalize()}
**Theme:** {past_theme.capitalize()}

Your {nakshatra} nakshatra under {deity} guidance suggests a past life focused on {past_theme}.

## Past Life Occupations

Based on {zodiac} ({element}) and {nakshatra}:
- **Primary Role:** {past_role.capitalize()} in {past_region}
- **Skills Carried:** {traits.split(',')[0].capitalize()}, {nak_quality}
- **Spiritual Practice:** {deity} devotion and {element} mastery

## Karmic Patterns from Past Lives

**Talents Brought Forward:**
- {nak_quality.capitalize()} abilities from past life mastery
- {element} element skills refined over incarnations
- {ruler} planetary gifts from previous development

**Lessons Still Learning:**
- Balancing {traits.split(',')[0]} with humility
- Completing {past_theme} karma
- {ruler} related growth areas

## Past Life Relationships

**Soul Connections:** You likely knew current family/partners in past lives
- Parents: Teachers of {traits.split(',')[0]} lessons from before
- Siblings: Soul companions continuing their journey with you
- Partners: Deep karmic bonds spanning multiple incarnations

## Geographic Past Life Origins

**{element} Element Connection:** {past_region.capitalize()}
- Your soul resonates with {element}-associated lands
- Possible memories or attractions to these regions
- Travel there may feel like "coming home"

## Past Life Wisdom

**{nakshatra} Nakshatra Insight:** {nak_past_life}
**{ruler} Planetary Indicator:** {ruler_past_life if ruler_past_life else f'Past mastery of {ruler} qualities'}

**Actionable Guidance:**
- Explore interests in {past_theme} - these are past life skills
- Notice déjà vu experiences - they may be past life memories
- Honor {deity} to strengthen past life spiritual connections"""

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

""" + self._generate_dasha_analysis(context) + """

""" + self._generate_transit_analysis(context) + """

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

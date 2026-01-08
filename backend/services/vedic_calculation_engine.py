"""
Vedic Calculation Engine
Core deterministic calculations for Bhrigu Samhita and Nadi Jyotisha predictions
Provides accurate, reproducible calculations without AI dependency
"""
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum

logger = logging.getLogger(__name__)


class KarmicPhase(Enum):
    """Karmic phases based on age and dasha"""
    LEARNING = "learning"
    TESTING = "testing"
    MASTERY = "mastery"
    TEACHING = "teaching"


class VedicCalculationEngine:
    """
    Core engine for deterministic Vedic astrology calculations
    Based on authentic Bhrigu Samhita and Nadi Jyotisha principles
    """

    # Planetary periods in Vimshottari Dasha (years)
    VIMSHOTTARI_PERIODS = {
        'Ketu': 7,
        'Venus': 20,
        'Sun': 6,
        'Moon': 10,
        'Mars': 7,
        'Rahu': 18,
        'Jupiter': 16,
        'Saturn': 19,
        'Mercury': 17
    }

    # Nakshatra lords in sequence
    NAKSHATRA_LORDS = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
                       'Jupiter', 'Saturn', 'Mercury'] * 3

    # Nakshatra names in sequence
    NAKSHATRAS = [
        'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
        'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
        'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
        'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
        'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
    ]

    # Sign lords
    SIGN_LORDS = {
        'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury',
        'Cancer': 'Moon', 'Leo': 'Sun', 'Virgo': 'Mercury',
        'Libra': 'Venus', 'Scorpio': 'Mars', 'Sagittarius': 'Jupiter',
        'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
    }

    # Karmic significance of planets (Bhrigu Samhita)
    KARMIC_SIGNIFICATORS = {
        'Saturn': 'Past karma, debts, lessons, discipline',
        'Jupiter': 'Dharma, wisdom, expansion, grace',
        'Rahu': 'Unfulfilled desires, worldly ambitions, foreign connections',
        'Ketu': 'Moksha, spirituality, past-life skills, detachment',
        'Moon': 'Mind, emotions, mother, public relations',
        'Sun': 'Soul, father, authority, vitality',
        'Mars': 'Energy, courage, siblings, property',
        'Mercury': 'Intelligence, communication, business',
        'Venus': 'Relationships, luxury, creativity, spouse'
    }

    def __init__(self):
        """Initialize the Vedic calculation engine"""
        pass

    def calculate_soul_purpose(self, chart_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate soul purpose based on multiple indicators
        References: Bhrigu Samhita principles of soul mission
        """
        try:
            # Extract key positions
            ascendant = chart_data.get('ascendant', 'Unknown')
            moon_sign = chart_data.get('moon_sign', 'Unknown')
            nakshatra = chart_data.get('nakshatra', 'Unknown')

            # Get planetary positions
            planets = chart_data.get('planets', {})
            sun_sign = planets.get('Sun', {}).get('sign', 'Unknown')

            # Calculate soul purpose based on multiple factors
            purpose_indicators = []

            # 1. Ascendant indicates life path
            ascendant_purposes = {
                'Aries': 'Pioneer and leader, initiating new ventures',
                'Taurus': 'Builder of stability and material security',
                'Gemini': 'Communicator and knowledge disseminator',
                'Cancer': 'Nurturer and emotional healer',
                'Leo': 'Leader and creative expresser',
                'Virgo': 'Servant and perfectionist healer',
                'Libra': 'Harmonizer and relationship facilitator',
                'Scorpio': 'Transformer and depth psychologist',
                'Sagittarius': 'Teacher and philosophical explorer',
                'Capricorn': 'Administrator and structure builder',
                'Aquarius': 'Innovator and humanitarian reformer',
                'Pisces': 'Mystic and compassionate server'
            }

            purpose_indicators.append({
                'indicator': 'Ascendant',
                'value': ascendant,
                'purpose': ascendant_purposes.get(ascendant, 'Soul evolution through life experiences')
            })

            # 2. Moon sign indicates emotional fulfillment path
            moon_purposes = {
                'Aries': 'Finding emotional security through independence',
                'Taurus': 'Creating emotional stability through material comfort',
                'Gemini': 'Emotional fulfillment through learning and communication',
                'Cancer': 'Nurturing self and others for emotional completion',
                'Leo': 'Expressing authentic self for emotional joy',
                'Virgo': 'Serving others for emotional satisfaction',
                'Libra': 'Creating harmony in relationships for peace',
                'Scorpio': 'Deep transformation for emotional rebirth',
                'Sagittarius': 'Seeking truth and wisdom for emotional expansion',
                'Capricorn': 'Building legacy for emotional fulfillment',
                'Aquarius': 'Contributing to collective for emotional purpose',
                'Pisces': 'Spiritual connection for emotional transcendence'
            }

            purpose_indicators.append({
                'indicator': 'Moon Sign',
                'value': moon_sign,
                'purpose': moon_purposes.get(moon_sign, 'Emotional evolution through experiences')
            })

            # 3. Nakshatra indicates specific soul mission
            nakshatra_purposes = self._get_nakshatra_purpose(nakshatra)
            purpose_indicators.append({
                'indicator': 'Birth Nakshatra',
                'value': nakshatra,
                'purpose': nakshatra_purposes
            })

            # 4. Calculate primary life purpose synthesis
            primary_purpose = self._synthesize_soul_purpose(
                ascendant, moon_sign, nakshatra, sun_sign
            )

            return {
                'primary_purpose': primary_purpose,
                'purpose_indicators': purpose_indicators,
                'dharmic_path': self._calculate_dharmic_path(chart_data),
                'soul_lessons': self._identify_soul_lessons(chart_data),
                'success': True
            }

        except Exception as e:
            logger.error(f"Error calculating soul purpose: {e}")
            return {
                'primary_purpose': 'Soul evolution through life experiences',
                'error': str(e),
                'success': False
            }

    def calculate_karmic_debts(self, chart_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate karmic debts and credits from planetary positions
        References: Bhrigu Samhita karmic analysis
        """
        try:
            debts = []
            credits = []

            planets = chart_data.get('planets', {})
            houses = chart_data.get('houses', [])

            # Saturn placement indicates karmic debts
            saturn = planets.get('Saturn', {})
            saturn_sign = saturn.get('sign', 'Unknown')
            saturn_house = self._get_planet_house(saturn, houses)

            if saturn_house:
                debt_descriptions = {
                    1: 'Debt to self - learning self-discipline and responsibility',
                    2: 'Debt to family - financial and speech karma',
                    3: 'Debt to siblings - communication and courage karma',
                    4: 'Debt to mother/homeland - emotional and property karma',
                    5: 'Debt to children/students - creative and teaching karma',
                    6: 'Debt to servants/employees - service and health karma',
                    7: 'Debt to spouse/partners - relationship and commitment karma',
                    8: 'Debt related to longevity, inheritance, and transformation',
                    9: 'Debt to teachers/father - dharmic and philosophical karma',
                    10: 'Debt to career/society - professional and social karma',
                    11: 'Debt to friends/community - networking and gains karma',
                    12: 'Debt to spiritual realm - liberation and loss karma'
                }

                debts.append({
                    'planet': 'Saturn',
                    'house': saturn_house,
                    'sign': saturn_sign,
                    'description': debt_descriptions.get(saturn_house, 'General karmic lessons'),
                    'severity': 'High',
                    'remedy_focus': 'Discipline, patience, service to elders'
                })

            # Rahu indicates unfulfilled desires from past lives
            rahu = planets.get('Rahu', {})
            rahu_house = self._get_planet_house(rahu, houses)

            if rahu_house:
                rahu_debts = {
                    1: 'Unfulfilled desire for self-identity and recognition',
                    2: 'Unfulfilled desire for wealth and family stability',
                    3: 'Unfulfilled desire for communication and sibling bonds',
                    4: 'Unfulfilled desire for emotional security and home',
                    5: 'Unfulfilled desire for children and creative expression',
                    6: 'Unfulfilled desire to overcome enemies and serve',
                    7: 'Unfulfilled desire for ideal partnership',
                    8: 'Unfulfilled desire for mystical knowledge and transformation',
                    9: 'Unfulfilled desire for higher wisdom and foreign travel',
                    10: 'Unfulfilled desire for status and career achievement',
                    11: 'Unfulfilled desire for social network and gains',
                    12: 'Unfulfilled desire for liberation and foreign lands'
                }

                debts.append({
                    'planet': 'Rahu',
                    'house': rahu_house,
                    'description': rahu_debts.get(rahu_house, 'Worldly desires to fulfill'),
                    'severity': 'Medium',
                    'remedy_focus': 'Meditation, grounding practices, ethical pursuits'
                })

            # Ketu indicates past-life mastery and spiritual credits
            ketu = planets.get('Ketu', {})
            ketu_house = self._get_planet_house(ketu, houses)

            if ketu_house:
                ketu_credits = {
                    1: 'Past-life mastery in self-awareness and spirituality',
                    2: 'Past-life detachment from material wealth',
                    3: 'Past-life skills in communication and writing',
                    4: 'Past-life emotional wisdom and mothering',
                    5: 'Past-life creative and teaching abilities',
                    6: 'Past-life healing and service orientation',
                    7: 'Past-life relationship wisdom and counseling',
                    8: 'Past-life mystical and occult knowledge',
                    9: 'Past-life philosophical and spiritual teachings',
                    10: 'Past-life administrative and leadership skills',
                    11: 'Past-life community service and networking',
                    12: 'Past-life spiritual practices and liberation work'
                }

                credits.append({
                    'planet': 'Ketu',
                    'house': ketu_house,
                    'description': ketu_credits.get(ketu_house, 'Spiritual wisdom from past lives'),
                    'strength': 'Natural talent',
                    'application': 'Use this wisdom to help others'
                })

            # Jupiter aspects indicate grace and karmic credits
            jupiter = planets.get('Jupiter', {})
            if jupiter:
                credits.append({
                    'planet': 'Jupiter',
                    'description': 'Divine grace and accumulated good karma',
                    'strength': 'Protective influence',
                    'application': 'Share wisdom and blessings with others'
                })

            return {
                'karmic_debts': debts,
                'karmic_credits': credits,
                'balance': len(credits) - len(debts),
                'overall_assessment': self._assess_karmic_balance(debts, credits),
                'success': True
            }

        except Exception as e:
            logger.error(f"Error calculating karmic debts: {e}")
            return {
                'karmic_debts': [],
                'karmic_credits': [],
                'error': str(e),
                'success': False
            }

    def calculate_dasha_timing(self, birth_date: str, moon_longitude: float,
                              chart_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate Vimshottari Dasha periods with precise timing
        References: Nadi Jyotisha timing techniques
        """
        try:
            # Calculate birth nakshatra
            nakshatra_index = int(moon_longitude / (360 / 27))
            nakshatra_name = self.NAKSHATRAS[nakshatra_index]

            # Calculate position within nakshatra (0-13.333 degrees)
            nakshatra_span = 360 / 27
            position_in_nakshatra = moon_longitude % nakshatra_span

            # Get starting dasha lord
            nakshatra_lord = self.NAKSHATRA_LORDS[nakshatra_index]

            # Calculate balance of starting dasha at birth
            total_period = self.VIMSHOTTARI_PERIODS[nakshatra_lord]
            elapsed_fraction = position_in_nakshatra / nakshatra_span
            balance_years = total_period * (1 - elapsed_fraction)

            # Build dasha timeline
            birth_dt = datetime.fromisoformat(birth_date.replace('/', '-'))
            current_dt = datetime.now()

            dasha_timeline = []
            current_date = birth_dt

            # Start with partial period of birth nakshatra lord
            end_date = current_date + timedelta(days=balance_years * 365.25)
            dasha_timeline.append({
                'maha_dasha_lord': nakshatra_lord,
                'start_date': current_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'duration_years': balance_years,
                'is_current': current_date <= current_dt < end_date,
                'effects': self._get_dasha_effects(nakshatra_lord, chart_data)
            })
            current_date = end_date

            # Continue with full periods of remaining planets
            dasha_lords = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
                          'Jupiter', 'Saturn', 'Mercury']
            start_index = (dasha_lords.index(nakshatra_lord) + 1) % 9

            for i in range(9):
                lord_index = (start_index + i) % 9
                lord = dasha_lords[lord_index]
                duration = self.VIMSHOTTARI_PERIODS[lord]

                end_date = current_date + timedelta(days=duration * 365.25)
                dasha_timeline.append({
                    'maha_dasha_lord': lord,
                    'start_date': current_date.strftime('%Y-%m-%d'),
                    'end_date': end_date.strftime('%Y-%m-%d'),
                    'duration_years': duration,
                    'is_current': current_date <= current_dt < end_date,
                    'effects': self._get_dasha_effects(lord, chart_data)
                })
                current_date = end_date

            # Identify current dasha
            current_dasha = next(
                (d for d in dasha_timeline if d['is_current']),
                dasha_timeline[0]
            )

            # Calculate sub-periods (Bhukti) for current dasha
            current_bhuktis = self._calculate_bhuktis(
                current_dasha['maha_dasha_lord'],
                current_dasha['start_date'],
                current_dasha['duration_years'],
                chart_data
            )

            return {
                'dasha_timeline': dasha_timeline,
                'current_maha_dasha': current_dasha,
                'current_bhuktis': current_bhuktis,
                'birth_nakshatra': nakshatra_name,
                'birth_nakshatra_lord': nakshatra_lord,
                'success': True
            }

        except Exception as e:
            logger.error(f"Error calculating dasha timing: {e}")
            return {
                'error': str(e),
                'success': False
            }

    def calculate_life_events_timing(self, chart_data: Dict[str, Any],
                                    dasha_data: Dict[str, Any]) -> Dict[str, List[Dict]]:
        """
        Calculate timing of major life events based on dasha periods
        References: Nadi Jyotisha event prediction
        """
        try:
            events = {
                'marriage': [],
                'career': [],
                'children': [],
                'wealth': [],
                'health': [],
                'spiritual': [],
                'travel': []
            }

            dasha_timeline = dasha_data.get('dasha_timeline', [])
            planets = chart_data.get('planets', {})

            for dasha in dasha_timeline:
                lord = dasha['maha_dasha_lord']
                start = dasha['start_date']
                end = dasha['end_date']

                # Marriage timing - Venus, 7th lord dashas
                if lord in ['Venus', 'Jupiter']:
                    events['marriage'].append({
                        'period': f"{lord} Dasha",
                        'timing': f"{start} to {end}",
                        'description': f'Favorable period for marriage and partnerships',
                        'probability': 'High'
                    })

                # Career advancement - Sun, Jupiter, 10th lord dashas
                if lord in ['Sun', 'Jupiter', 'Saturn']:
                    events['career'].append({
                        'period': f"{lord} Dasha",
                        'timing': f"{start} to {end}",
                        'description': f'Career growth and professional recognition',
                        'probability': 'High' if lord == 'Jupiter' else 'Medium'
                    })

                # Children - Jupiter, 5th lord dashas
                if lord == 'Jupiter':
                    events['children'].append({
                        'period': f"{lord} Dasha",
                        'timing': f"{start} to {end}",
                        'description': f'Favorable for childbirth and creative projects',
                        'probability': 'High'
                    })

                # Wealth accumulation - Venus, Jupiter, Mercury dashas
                if lord in ['Venus', 'Jupiter', 'Mercury']:
                    events['wealth'].append({
                        'period': f"{lord} Dasha",
                        'timing': f"{start} to {end}",
                        'description': f'Financial gains and wealth accumulation',
                        'probability': 'Medium to High'
                    })

                # Health concerns - Saturn, Mars, 6th/8th lord dashas
                if lord in ['Saturn', 'Mars']:
                    events['health'].append({
                        'period': f"{lord} Dasha",
                        'timing': f"{start} to {end}",
                        'description': f'Period requiring health vigilance and care',
                        'probability': 'Medium',
                        'remedy': 'Regular exercise, proper diet, preventive checkups'
                    })

                # Spiritual growth - Ketu, Jupiter dashas
                if lord in ['Ketu', 'Jupiter']:
                    events['spiritual'].append({
                        'period': f"{lord} Dasha",
                        'timing': f"{start} to {end}",
                        'description': f'Spiritual awakening and growth period',
                        'probability': 'High'
                    })

                # Foreign travel - Rahu, 12th lord dashas
                if lord == 'Rahu':
                    events['travel'].append({
                        'period': f"{lord} Dasha",
                        'timing': f"{start} to {end}",
                        'description': f'Foreign travel and relocation opportunities',
                        'probability': 'Medium'
                    })

            return events

        except Exception as e:
            logger.error(f"Error calculating life events timing: {e}")
            return {}

    def generate_remedial_measures(self, chart_data: Dict[str, Any],
                                   specific_issue: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate specific remedial measures based on chart afflictions
        References: Bhrigu Samhita remedial principles
        """
        try:
            remedies = {
                'mantras': [],
                'gemstones': [],
                'yantras': [],
                'charity': [],
                'rituals': [],
                'lifestyle': []
            }

            planets = chart_data.get('planets', {})
            ascendant = chart_data.get('ascendant', 'Unknown')

            # 1. Mantra recommendations based on weak planets
            remedies['mantras'] = [
                {
                    'planet': 'Sun',
                    'mantra': 'Om Hraam Hreem Hraum Sah Suryaya Namah',
                    'count': '7,000 or 108 daily',
                    'timing': 'Sunday morning, facing east',
                    'benefits': 'Enhances vitality, confidence, father relationships'
                },
                {
                    'planet': 'Moon',
                    'mantra': 'Om Shraam Shreem Shraum Sah Chandraya Namah',
                    'count': '11,000 or 108 daily',
                    'timing': 'Monday evening, after sunset',
                    'benefits': 'Improves emotional stability, mental peace, mother relationships'
                },
                {
                    'planet': 'Mars',
                    'mantra': 'Om Kraam Kreem Kraum Sah Bhaumaya Namah',
                    'count': '10,000 or 108 daily',
                    'timing': 'Tuesday morning',
                    'benefits': 'Increases courage, energy, property matters'
                },
                {
                    'planet': 'Mercury',
                    'mantra': 'Om Braam Breem Braum Sah Budhaya Namah',
                    'count': '9,000 or 108 daily',
                    'timing': 'Wednesday morning',
                    'benefits': 'Enhances intelligence, communication, business success'
                },
                {
                    'planet': 'Jupiter',
                    'mantra': 'Om Graam Greem Graum Sah Gurave Namah',
                    'count': '19,000 or 108 daily',
                    'timing': 'Thursday morning',
                    'benefits': 'Brings wisdom, prosperity, children, spiritual growth'
                },
                {
                    'planet': 'Venus',
                    'mantra': 'Om Draam Dreem Draum Sah Shukraya Namah',
                    'count': '16,000 or 108 daily',
                    'timing': 'Friday morning',
                    'benefits': 'Improves relationships, luxury, artistic abilities'
                },
                {
                    'planet': 'Saturn',
                    'mantra': 'Om Praam Preem Praum Sah Shanaischaraya Namah',
                    'count': '23,000 or 108 daily',
                    'timing': 'Saturday morning',
                    'benefits': 'Reduces delays, karmic burdens, brings discipline'
                },
                {
                    'planet': 'Rahu',
                    'mantra': 'Om Bhraam Bhreem Bhraum Sah Rahave Namah',
                    'count': '18,000 or 108 daily',
                    'timing': 'Saturday evening',
                    'benefits': 'Controls desires, removes confusion, foreign success'
                },
                {
                    'planet': 'Ketu',
                    'mantra': 'Om Sraam Sreem Sraum Sah Ketave Namah',
                    'count': '7,000 or 108 daily',
                    'timing': 'Tuesday evening',
                    'benefits': 'Enhances spirituality, intuition, moksha'
                }
            ]

            # 2. Gemstone recommendations based on ascendant
            ascendant_gems = {
                'Aries': {'primary': 'Red Coral', 'weight': '5-8 carats', 'metal': 'Gold/Copper'},
                'Taurus': {'primary': 'Diamond', 'weight': '1-2 carats', 'metal': 'Platinum/Silver'},
                'Gemini': {'primary': 'Emerald', 'weight': '3-6 carats', 'metal': 'Gold'},
                'Cancer': {'primary': 'Pearl', 'weight': '5-8 carats', 'metal': 'Silver'},
                'Leo': {'primary': 'Ruby', 'weight': '3-6 carats', 'metal': 'Gold'},
                'Virgo': {'primary': 'Emerald', 'weight': '3-6 carats', 'metal': 'Gold'},
                'Libra': {'primary': 'Diamond', 'weight': '1-2 carats', 'metal': 'Platinum/Silver'},
                'Scorpio': {'primary': 'Red Coral', 'weight': '5-8 carats', 'metal': 'Gold/Copper'},
                'Sagittarius': {'primary': 'Yellow Sapphire', 'weight': '3-6 carats', 'metal': 'Gold'},
                'Capricorn': {'primary': 'Blue Sapphire', 'weight': '3-6 carats', 'metal': 'Silver'},
                'Aquarius': {'primary': 'Blue Sapphire', 'weight': '3-6 carats', 'metal': 'Silver'},
                'Pisces': {'primary': 'Yellow Sapphire', 'weight': '3-6 carats', 'metal': 'Gold'}
            }

            gem_rec = ascendant_gems.get(ascendant, {})
            if gem_rec:
                remedies['gemstones'].append({
                    'ascendant': ascendant,
                    'primary_stone': gem_rec.get('primary', 'Consult astrologer'),
                    'weight': gem_rec.get('weight', '3-5 carats'),
                    'metal': gem_rec.get('metal', 'Gold'),
                    'finger': 'Ring finger (Jupiter finger)',
                    'day_to_wear': 'Thursday morning during Shukla Paksha',
                    'energizing': 'Soak in Ganga jal or raw milk, chant respective mantra 108 times'
                })

            # 3. Yantra recommendations
            remedies['yantras'] = [
                {
                    'type': 'Navgraha Yantra',
                    'purpose': 'Balance all nine planetary energies',
                    'material': 'Copper or Gold',
                    'placement': 'Puja room, facing east',
                    'worship': 'Light incense daily, chant Navgraha Stotra'
                },
                {
                    'type': 'Shri Yantra',
                    'purpose': 'Overall prosperity and spiritual growth',
                    'material': 'Copper or Crystal',
                    'placement': 'Puja room or wealth corner (SE)',
                    'worship': 'Daily meditation, Lakshmi mantras'
                }
            ]

            # 4. Charity (Dana) recommendations
            remedies['charity'] = [
                {
                    'day': 'Sunday',
                    'items': 'Wheat, jaggery, copper items',
                    'recipients': 'Temples, poor people',
                    'planet': 'Sun'
                },
                {
                    'day': 'Monday',
                    'items': 'Rice, white clothes, silver items',
                    'recipients': 'Poor women, temples',
                    'planet': 'Moon'
                },
                {
                    'day': 'Tuesday',
                    'items': 'Red lentils, red clothes, jaggery',
                    'recipients': 'Soldiers, firefighters',
                    'planet': 'Mars'
                },
                {
                    'day': 'Wednesday',
                    'items': 'Green vegetables, books, pens',
                    'recipients': 'Students, libraries',
                    'planet': 'Mercury'
                },
                {
                    'day': 'Thursday',
                    'items': 'Yellow clothes, turmeric, books',
                    'recipients': 'Teachers, priests, temples',
                    'planet': 'Jupiter'
                },
                {
                    'day': 'Friday',
                    'items': 'White clothes, rice, sugar',
                    'recipients': 'Young girls, art institutions',
                    'planet': 'Venus'
                },
                {
                    'day': 'Saturday',
                    'items': 'Mustard oil, black sesame, iron items',
                    'recipients': 'Disabled persons, servants',
                    'planet': 'Saturn'
                }
            ]

            # 5. Ritual recommendations
            remedies['rituals'] = [
                {
                    'ritual': 'Navgraha Puja',
                    'frequency': 'Annually or during challenging dasha',
                    'benefits': 'Propitiates all nine planets',
                    'when': 'During planetary transitions or afflictions'
                },
                {
                    'ritual': 'Rudrabhishek',
                    'frequency': 'Monthly on Mondays',
                    'benefits': 'Removes obstacles, cleanses karma',
                    'when': 'During Sade Sati or difficult periods'
                },
                {
                    'ritual': 'Satyanarayan Puja',
                    'frequency': 'Monthly on Purnima',
                    'benefits': 'Overall prosperity and blessings',
                    'when': 'Regular practice for positive results'
                }
            ]

            # 6. Lifestyle modifications
            remedies['lifestyle'] = [
                {
                    'practice': 'Surya Namaskar',
                    'frequency': 'Daily, 12 rounds',
                    'benefits': 'Energizes body, propitiates Sun',
                    'timing': 'Early morning, facing east'
                },
                {
                    'practice': 'Gayatri Mantra',
                    'frequency': '108 times daily',
                    'benefits': 'Purifies mind, enhances intellect',
                    'timing': 'Dawn, noon, and dusk'
                },
                {
                    'practice': 'Meditation',
                    'frequency': '20-30 minutes daily',
                    'benefits': 'Mental peace, spiritual growth',
                    'timing': 'Early morning or evening'
                },
                {
                    'practice': 'Vegetarian Diet',
                    'frequency': 'Daily or on specific days',
                    'benefits': 'Purifies body, reduces karmic burden',
                    'timing': 'Especially during fasting days'
                }
            ]

            return {
                'remedies': remedies,
                'priority': self._prioritize_remedies(chart_data, specific_issue),
                'success': True
            }

        except Exception as e:
            logger.error(f"Error generating remedial measures: {e}")
            return {
                'error': str(e),
                'success': False
            }

    # Helper methods

    def _get_nakshatra_purpose(self, nakshatra: str) -> str:
        """Get soul purpose based on birth nakshatra"""
        purposes = {
            'Ashwini': 'Healing and pioneering new paths',
            'Bharani': 'Transformation and creative manifestation',
            'Krittika': 'Purification and cutting through illusions',
            'Rohini': 'Beauty creation and material abundance',
            'Mrigashira': 'Seeking truth and knowledge exploration',
            'Ardra': 'Destruction of old and renewal',
            'Punarvasu': 'Restoration and returning to source',
            'Pushya': 'Nourishment and spiritual teaching',
            'Ashlesha': 'Psychological depth and transformation',
            'Magha': 'Leadership and ancestral connection',
            'Purva Phalguni': 'Creative joy and pleasure',
            'Uttara Phalguni': 'Service through leadership',
            'Hasta': 'Skillful manifestation and healing',
            'Chitra': 'Artistic creation and divine beauty',
            'Swati': 'Independence and flexibility',
            'Vishakha': 'Goal achievement and transformation',
            'Anuradha': 'Devotion and friendship',
            'Jyeshtha': 'Protection and responsibility',
            'Mula': 'Root investigation and philosophical inquiry',
            'Purva Ashadha': 'Invincibility and purification',
            'Uttara Ashadha': 'Ultimate victory and permanence',
            'Shravana': 'Learning and disseminating knowledge',
            'Dhanishta': 'Prosperity and musical/rhythmic expression',
            'Shatabhisha': 'Healing through solitude and mysticism',
            'Purva Bhadrapada': 'Transformation through spiritual fire',
            'Uttara Bhadrapada': 'Deep wisdom and cosmic connection',
            'Revati': 'Nourishment and safe passage to next realm'
        }
        return purposes.get(nakshatra, 'Soul evolution through unique life experiences')

    def _synthesize_soul_purpose(self, ascendant: str, moon_sign: str,
                                nakshatra: str, sun_sign: str) -> str:
        """Synthesize primary soul purpose from multiple indicators"""
        purpose = f"Your soul incarnated with the mission of "

        # Ascendant contribution (life path)
        if ascendant in ['Aries', 'Leo', 'Sagittarius']:
            purpose += "inspiring and leading others through courageous action, "
        elif ascendant in ['Taurus', 'Virgo', 'Capricorn']:
            purpose += "building stable structures and serving practical needs, "
        elif ascendant in ['Gemini', 'Libra', 'Aquarius']:
            purpose += "connecting people and disseminating knowledge, "
        else:
            purpose += "nurturing emotional wellbeing and intuitive wisdom, "

        # Nakshatra contribution (specific mission)
        nakshatra_purpose = self._get_nakshatra_purpose(nakshatra)
        purpose += f"specifically through {nakshatra_purpose.lower()}. "

        # Sun sign contribution (essence)
        purpose += f"Your core essence as a {sun_sign} individual adds "
        if sun_sign in ['Aries', 'Leo', 'Sagittarius']:
            purpose += "fiery enthusiasm and visionary leadership to this mission."
        elif sun_sign in ['Taurus', 'Virgo', 'Capricorn']:
            purpose += "practical groundedness and methodical execution to this mission."
        elif sun_sign in ['Gemini', 'Libra', 'Aquarius']:
            purpose += "intellectual clarity and social consciousness to this mission."
        else:
            purpose += "emotional depth and intuitive guidance to this mission."

        return purpose

    def _calculate_dharmic_path(self, chart_data: Dict[str, Any]) -> Dict[str, str]:
        """Calculate four types of dharma"""
        return {
            'svadharma': 'Personal dharma aligned with your true nature',
            'kula_dharma': 'Family dharma and responsibilities',
            'varna_dharma': 'Professional dharma and social contribution',
            'sanatana_dharma': 'Universal dharma and spiritual evolution'
        }

    def _identify_soul_lessons(self, chart_data: Dict[str, Any]) -> List[str]:
        """Identify primary soul lessons for this lifetime"""
        lessons = [
            'Balancing material and spiritual pursuits',
            'Mastering ego and cultivating humility',
            'Developing compassion and service orientation',
            'Learning detachment while remaining engaged',
            'Transforming fear into faith and courage'
        ]
        return lessons

    def _get_planet_house(self, planet: Dict[str, Any], houses: List[str]) -> Optional[int]:
        """Determine which house a planet is in"""
        if not planet or not houses:
            return None

        planet_sign = planet.get('sign', '')
        try:
            house_number = houses.index(planet_sign) + 1
            return house_number
        except (ValueError, AttributeError):
            return None

    def _get_dasha_effects(self, lord: str, chart_data: Dict[str, Any]) -> str:
        """Get general effects of a dasha period"""
        effects = {
            'Sun': 'Period of authority, confidence, and father relationships. Focus on career advancement.',
            'Moon': 'Period of emotional experiences, mental peace, and mother relationships. Focus on home and family.',
            'Mars': 'Period of energy, courage, and property matters. Focus on assertive action and physical activities.',
            'Mercury': 'Period of intellect, communication, and business. Focus on learning and commercial activities.',
            'Jupiter': 'Period of wisdom, expansion, and blessings. Focus on spiritual growth and teaching.',
            'Venus': 'Period of relationships, luxury, and creativity. Focus on partnerships and artistic pursuits.',
            'Saturn': 'Period of discipline, delays, and karmic lessons. Focus on patience and hard work.',
            'Rahu': 'Period of worldly ambitions and foreign connections. Focus on material achievements and innovation.',
            'Ketu': 'Period of spirituality and detachment. Focus on inner growth and moksha.'
        }
        return effects.get(lord, 'Period of growth and evolution.')

    def _calculate_bhuktis(self, maha_lord: str, start_date: str,
                          duration_years: float, chart_data: Dict[str, Any]) -> List[Dict]:
        """Calculate sub-periods (Bhukti) within a Maha Dasha"""
        bhuktis = []
        dasha_lords = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
                      'Jupiter', 'Saturn', 'Mercury']

        # Start with maha dasha lord
        start_index = dasha_lords.index(maha_lord)
        start_dt = datetime.fromisoformat(start_date)
        current_dt = start_dt

        total_duration_days = duration_years * 365.25

        for i in range(9):
            lord_index = (start_index + i) % 9
            bhukti_lord = dasha_lords[lord_index]

            # Proportional duration
            lord_period = self.VIMSHOTTARI_PERIODS[bhukti_lord]
            maha_period = self.VIMSHOTTARI_PERIODS[maha_lord]
            bhukti_duration_days = (lord_period / 120) * total_duration_days

            end_dt = current_dt + timedelta(days=bhukti_duration_days)

            bhuktis.append({
                'maha_dasha_lord': maha_lord,
                'bhukti_lord': bhukti_lord,
                'start_date': current_dt.strftime('%Y-%m-%d'),
                'end_date': end_dt.strftime('%Y-%m-%d'),
                'duration_months': bhukti_duration_days / 30.44,
                'combined_effects': f'{maha_lord}-{bhukti_lord} period brings combined influences of both planets'
            })

            current_dt = end_dt

        return bhuktis

    def _assess_karmic_balance(self, debts: List[Dict], credits: List[Dict]) -> str:
        """Assess overall karmic balance"""
        debt_count = len(debts)
        credit_count = len(credits)

        if credit_count > debt_count:
            return 'Positive karmic balance - abundant grace and blessings available'
        elif debt_count > credit_count:
            return 'Karmic debts require attention - focus on remedies and service'
        else:
            return 'Balanced karma - continue righteous path with awareness'

    def _prioritize_remedies(self, chart_data: Dict[str, Any],
                            specific_issue: Optional[str]) -> List[str]:
        """Prioritize remedies based on chart analysis"""
        priorities = [
            'Daily mantra practice for ascendant lord',
            'Gemstone for ascendant or moon sign',
            'Saturday charity for Saturn (karmic debts)',
            'Jupiter worship for overall grace',
            'Meditation and spiritual practices'
        ]
        return priorities


# Singleton instance
_vedic_engine = None

def get_vedic_calculation_engine() -> VedicCalculationEngine:
    """Get or create Vedic calculation engine singleton"""
    global _vedic_engine
    if _vedic_engine is None:
        _vedic_engine = VedicCalculationEngine()
    return _vedic_engine

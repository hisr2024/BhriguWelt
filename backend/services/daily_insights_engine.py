"""
Daily Insights & Forecasts Engine
Comprehensive daily predictions based on Bhrigu Samhita and Nadi Jyotisha principles
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
import random

from utils.logger import setup_logger

logger = setup_logger(__name__)


class DailyInsightsEngine:
    """
    Daily Insights & Forecasts Engine
    Generates daily, weekly, monthly, and yearly insights based on Vedic astrology
    """

    # Planetary rulers for each day of the week
    DAY_RULERS = {
        0: {'planet': 'Sun', 'deity': 'Surya', 'color': 'Orange', 'element': 'Fire'},
        1: {'planet': 'Moon', 'deity': 'Chandra', 'color': 'White', 'element': 'Water'},
        2: {'planet': 'Mars', 'deity': 'Mangal', 'color': 'Red', 'element': 'Fire'},
        3: {'planet': 'Mercury', 'deity': 'Budha', 'color': 'Green', 'element': 'Earth'},
        4: {'planet': 'Jupiter', 'deity': 'Guru', 'color': 'Yellow', 'element': 'Ether'},
        5: {'planet': 'Venus', 'deity': 'Shukra', 'color': 'Pink', 'element': 'Water'},
        6: {'planet': 'Saturn', 'deity': 'Shani', 'color': 'Blue', 'element': 'Air'},
    }

    # Nakshatra energies
    NAKSHATRA_ENERGIES = {
        'Ashwini': {'quality': 'Swift', 'focus': 'New beginnings', 'energy': 'High'},
        'Bharani': {'quality': 'Transformative', 'focus': 'Deep work', 'energy': 'Intense'},
        'Krittika': {'quality': 'Purifying', 'focus': 'Cutting ties', 'energy': 'Sharp'},
        'Rohini': {'quality': 'Creative', 'focus': 'Material growth', 'energy': 'Fertile'},
        'Mrigashira': {'quality': 'Seeking', 'focus': 'Exploration', 'energy': 'Curious'},
        'Ardra': {'quality': 'Transformative', 'focus': 'Breaking patterns', 'energy': 'Storm'},
        'Punarvasu': {'quality': 'Restoring', 'focus': 'Return to roots', 'energy': 'Renewing'},
        'Pushya': {'quality': 'Nourishing', 'focus': 'Growth', 'energy': 'Auspicious'},
        'Ashlesha': {'quality': 'Mystical', 'focus': 'Hidden knowledge', 'energy': 'Deep'},
        'Magha': {'quality': 'Ancestral', 'focus': 'Legacy', 'energy': 'Royal'},
        'Purva Phalguni': {'quality': 'Creative', 'focus': 'Pleasure', 'energy': 'Joyful'},
        'Uttara Phalguni': {'quality': 'Generous', 'focus': 'Partnerships', 'energy': 'Stable'},
        'Hasta': {'quality': 'Skillful', 'focus': 'Craftsmanship', 'energy': 'Dexterous'},
        'Chitra': {'quality': 'Artistic', 'focus': 'Beauty creation', 'energy': 'Brilliant'},
        'Swati': {'quality': 'Independent', 'focus': 'Freedom', 'energy': 'Airy'},
        'Vishakha': {'quality': 'Determined', 'focus': 'Goals', 'energy': 'Driven'},
        'Anuradha': {'quality': 'Devotional', 'focus': 'Friendship', 'energy': 'Loyal'},
        'Jyeshtha': {'quality': 'Protective', 'focus': 'Leadership', 'energy': 'Senior'},
        'Mula': {'quality': 'Root-seeking', 'focus': 'Foundation', 'energy': 'Destructive'},
        'Purva Ashadha': {'quality': 'Invincible', 'focus': 'Victory', 'energy': 'Confident'},
        'Uttara Ashadha': {'quality': 'Unconquered', 'focus': 'Achievement', 'energy': 'Final'},
        'Shravana': {'quality': 'Listening', 'focus': 'Learning', 'energy': 'Receptive'},
        'Dhanishta': {'quality': 'Wealthy', 'focus': 'Abundance', 'energy': 'Rhythmic'},
        'Shatabhisha': {'quality': 'Healing', 'focus': 'Mystical cure', 'energy': 'Veiled'},
        'Purva Bhadrapada': {'quality': 'Scorching', 'focus': 'Purification', 'energy': 'Fiery'},
        'Uttara Bhadrapada': {'quality': 'Deep', 'focus': 'Spiritual depth', 'energy': 'Oceanic'},
        'Revati': {'quality': 'Nourishing', 'focus': 'Completion', 'energy': 'Gentle'},
    }

    # Zodiac sign daily themes
    ZODIAC_DAILY_THEMES = {
        'Aries': {
            'strength': 'Leadership and initiative',
            'challenge': 'Patience with delays',
            'focus': 'Bold action',
            'element': 'Fire'
        },
        'Taurus': {
            'strength': 'Stability and persistence',
            'challenge': 'Adapting to change',
            'focus': 'Building resources',
            'element': 'Earth'
        },
        'Gemini': {
            'strength': 'Communication and adaptability',
            'challenge': 'Maintaining focus',
            'focus': 'Learning and connecting',
            'element': 'Air'
        },
        'Cancer': {
            'strength': 'Emotional intelligence',
            'challenge': 'Setting boundaries',
            'focus': 'Home and family',
            'element': 'Water'
        },
        'Leo': {
            'strength': 'Creativity and confidence',
            'challenge': 'Ego management',
            'focus': 'Self-expression',
            'element': 'Fire'
        },
        'Virgo': {
            'strength': 'Analysis and service',
            'challenge': 'Perfectionism',
            'focus': 'Health and work',
            'element': 'Earth'
        },
        'Libra': {
            'strength': 'Harmony and diplomacy',
            'challenge': 'Decision making',
            'focus': 'Relationships',
            'element': 'Air'
        },
        'Scorpio': {
            'strength': 'Transformation and insight',
            'challenge': 'Releasing control',
            'focus': 'Deep healing',
            'element': 'Water'
        },
        'Sagittarius': {
            'strength': 'Expansion and optimism',
            'challenge': 'Following through',
            'focus': 'Adventure and learning',
            'element': 'Fire'
        },
        'Capricorn': {
            'strength': 'Discipline and ambition',
            'challenge': 'Work-life balance',
            'focus': 'Career advancement',
            'element': 'Earth'
        },
        'Aquarius': {
            'strength': 'Innovation and community',
            'challenge': 'Emotional connection',
            'focus': 'Humanitarian goals',
            'element': 'Air'
        },
        'Pisces': {
            'strength': 'Intuition and compassion',
            'challenge': 'Grounding energy',
            'focus': 'Spiritual connection',
            'element': 'Water'
        }
    }

    def __init__(self, openai_service=None):
        self.openai_service = openai_service

    def generate_daily_insight(
        self,
        birth_data: Dict[str, Any],
        target_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Generate comprehensive daily insight for a specific date
        """
        if target_date is None:
            target_date = datetime.now()

        zodiac_sign = birth_data.get('zodiac_sign', 'Aries')
        moon_sign = birth_data.get('moon_sign', zodiac_sign)
        nakshatra = birth_data.get('nakshatra', 'Ashwini')
        ascendant = birth_data.get('ascendant', zodiac_sign)

        # Get day ruler info
        day_info = self.DAY_RULERS.get(target_date.weekday(), self.DAY_RULERS[0])

        # Get nakshatra energy
        nakshatra_energy = self.NAKSHATRA_ENERGIES.get(
            nakshatra,
            {'quality': 'Balanced', 'focus': 'General', 'energy': 'Moderate'}
        )

        # Get zodiac themes
        zodiac_theme = self.ZODIAC_DAILY_THEMES.get(
            zodiac_sign,
            {'strength': 'Inner wisdom', 'challenge': 'Balance', 'focus': 'Growth', 'element': 'Spirit'}
        )

        # Calculate cosmic energy level
        energy_level = self._calculate_daily_energy(birth_data, target_date, day_info)

        # Generate category insights
        love = self._generate_love_insight(zodiac_sign, moon_sign, day_info, energy_level)
        career = self._generate_career_insight(zodiac_sign, ascendant, day_info, energy_level)
        health = self._generate_health_insight(zodiac_sign, nakshatra_energy, day_info)
        finance = self._generate_finance_insight(zodiac_sign, day_info, energy_level)
        spiritual = self._generate_spiritual_insight(nakshatra, nakshatra_energy, day_info)

        # Generate lucky elements
        lucky_elements = self._generate_lucky_elements(zodiac_sign, day_info, target_date)

        # Generate do/don't lists
        do_list = self._generate_do_list(zodiac_theme, day_info, nakshatra_energy)
        dont_list = self._generate_dont_list(zodiac_theme, day_info)

        # Generate overall summary
        overall_summary = self._generate_overall_summary(
            zodiac_sign, energy_level, zodiac_theme, day_info
        )

        return {
            'date': target_date.strftime('%Y-%m-%d'),
            'day_of_week': target_date.strftime('%A'),
            'day_ruler': day_info,
            'energy_level': energy_level,
            'overall': overall_summary,
            'categories': {
                'love': love,
                'career': career,
                'health': health,
                'finance': finance,
                'spiritual': spiritual
            },
            'do_list': do_list,
            'dont_list': dont_list,
            'lucky_elements': lucky_elements,
            'nakshatra_energy': nakshatra_energy,
            'zodiac_theme': zodiac_theme,
            'metadata': {
                'zodiac_sign': zodiac_sign,
                'moon_sign': moon_sign,
                'nakshatra': nakshatra,
                'ascendant': ascendant,
                'tradition': 'Bhrigu Samhita & Nadi Jyotisha',
                'generated_at': datetime.utcnow().isoformat()
            }
        }

    def generate_weekly_forecast(
        self,
        birth_data: Dict[str, Any],
        start_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Generate 7-day forecast
        """
        if start_date is None:
            start_date = datetime.now()

        # Ensure we start from the beginning of the week (Monday)
        days_since_monday = start_date.weekday()
        week_start = start_date - timedelta(days=days_since_monday)

        daily_insights = []
        for i in range(7):
            day = week_start + timedelta(days=i)
            insight = self.generate_daily_insight(birth_data, day)
            daily_insights.append({
                'date': day.strftime('%Y-%m-%d'),
                'day_name': day.strftime('%A'),
                'summary': insight['overall']['message'],
                'energy': insight['energy_level'],
                'focus': insight['zodiac_theme']['focus'],
                'lucky_number': insight['lucky_elements']['number']
            })

        # Generate weekly summary
        zodiac_sign = birth_data.get('zodiac_sign', 'Aries')
        weekly_theme = self._generate_weekly_theme(zodiac_sign, daily_insights)

        return {
            'week_start': week_start.strftime('%Y-%m-%d'),
            'week_end': (week_start + timedelta(days=6)).strftime('%Y-%m-%d'),
            'weekly_theme': weekly_theme,
            'daily_forecasts': daily_insights,
            'best_days': self._identify_best_days(daily_insights),
            'challenging_days': self._identify_challenging_days(daily_insights),
            'weekly_advice': self._generate_weekly_advice(zodiac_sign),
            'metadata': {
                'zodiac_sign': zodiac_sign,
                'moon_sign': birth_data.get('moon_sign'),
                'tradition': 'Bhrigu Samhita & Nadi Jyotisha',
                'generated_at': datetime.utcnow().isoformat()
            }
        }

    def generate_monthly_forecast(
        self,
        birth_data: Dict[str, Any],
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate monthly forecast
        """
        now = datetime.now()
        if year is None:
            year = now.year
        if month is None:
            month = now.month

        zodiac_sign = birth_data.get('zodiac_sign', 'Aries')
        moon_sign = birth_data.get('moon_sign', zodiac_sign)
        nakshatra = birth_data.get('nakshatra', 'Ashwini')

        # Generate monthly overview
        monthly_overview = self._generate_monthly_overview(zodiac_sign, month, year)

        # Generate category forecasts
        categories = {
            'love': self._generate_monthly_love(zodiac_sign, moon_sign, month),
            'career': self._generate_monthly_career(zodiac_sign, month),
            'health': self._generate_monthly_health(zodiac_sign, nakshatra, month),
            'finance': self._generate_monthly_finance(zodiac_sign, month),
            'spiritual': self._generate_monthly_spiritual(nakshatra, month)
        }

        # Important dates
        important_dates = self._calculate_important_dates(zodiac_sign, month, year)

        return {
            'month': month,
            'year': year,
            'month_name': datetime(year, month, 1).strftime('%B'),
            'overview': monthly_overview,
            'categories': categories,
            'important_dates': important_dates,
            'monthly_mantra': self._get_monthly_mantra(zodiac_sign, month),
            'power_days': self._calculate_power_days(zodiac_sign, month, year),
            'metadata': {
                'zodiac_sign': zodiac_sign,
                'moon_sign': moon_sign,
                'nakshatra': nakshatra,
                'tradition': 'Bhrigu Samhita & Nadi Jyotisha',
                'generated_at': datetime.utcnow().isoformat()
            }
        }

    def generate_yearly_forecast(
        self,
        birth_data: Dict[str, Any],
        year: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate comprehensive yearly forecast
        """
        if year is None:
            year = datetime.now().year

        zodiac_sign = birth_data.get('zodiac_sign', 'Aries')
        moon_sign = birth_data.get('moon_sign', zodiac_sign)
        nakshatra = birth_data.get('nakshatra', 'Ashwini')
        dasha = birth_data.get('dasha_period', {})

        # Generate yearly themes
        yearly_theme = self._generate_yearly_theme(zodiac_sign, year, dasha)

        # Quarter-by-quarter analysis
        quarters = []
        for q in range(1, 5):
            quarters.append(self._generate_quarter_forecast(zodiac_sign, year, q))

        # Category forecasts for the year
        categories = {
            'love': self._generate_yearly_love(zodiac_sign, moon_sign, year),
            'career': self._generate_yearly_career(zodiac_sign, year, dasha),
            'health': self._generate_yearly_health(zodiac_sign, nakshatra, year),
            'finance': self._generate_yearly_finance(zodiac_sign, year),
            'spiritual': self._generate_yearly_spiritual(nakshatra, year, dasha)
        }

        return {
            'year': year,
            'theme': yearly_theme,
            'quarters': quarters,
            'categories': categories,
            'key_months': self._identify_key_months(zodiac_sign, year),
            'annual_guidance': self._generate_annual_guidance(zodiac_sign, dasha),
            'metadata': {
                'zodiac_sign': zodiac_sign,
                'moon_sign': moon_sign,
                'nakshatra': nakshatra,
                'dasha': dasha.get('maha_dasha', 'Unknown'),
                'tradition': 'Bhrigu Samhita & Nadi Jyotisha',
                'generated_at': datetime.utcnow().isoformat()
            }
        }

    # Private helper methods

    def _calculate_daily_energy(
        self,
        birth_data: Dict[str, Any],
        target_date: datetime,
        day_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate the cosmic energy level for the day"""
        zodiac_sign = birth_data.get('zodiac_sign', 'Aries')
        element = self.ZODIAC_DAILY_THEMES.get(zodiac_sign, {}).get('element', 'Fire')
        day_element = day_info.get('element', 'Fire')

        # Calculate elemental harmony
        harmony_score = self._calculate_elemental_harmony(element, day_element)

        # Base energy levels
        levels = ['Low', 'Moderate', 'Good', 'High', 'Excellent']
        level_index = min(4, max(0, int(harmony_score * 4)))

        return {
            'level': levels[level_index],
            'score': round(harmony_score * 100),
            'description': self._get_energy_description(levels[level_index])
        }

    def _calculate_elemental_harmony(self, birth_element: str, day_element: str) -> float:
        """Calculate harmony between birth element and day element"""
        harmony_matrix = {
            ('Fire', 'Fire'): 0.9,
            ('Fire', 'Air'): 0.85,
            ('Fire', 'Earth'): 0.6,
            ('Fire', 'Water'): 0.5,
            ('Fire', 'Ether'): 0.8,
            ('Earth', 'Earth'): 0.9,
            ('Earth', 'Water'): 0.85,
            ('Earth', 'Fire'): 0.6,
            ('Earth', 'Air'): 0.55,
            ('Earth', 'Ether'): 0.75,
            ('Air', 'Air'): 0.9,
            ('Air', 'Fire'): 0.85,
            ('Air', 'Water'): 0.55,
            ('Air', 'Earth'): 0.6,
            ('Air', 'Ether'): 0.9,
            ('Water', 'Water'): 0.9,
            ('Water', 'Earth'): 0.85,
            ('Water', 'Fire'): 0.5,
            ('Water', 'Air'): 0.55,
            ('Water', 'Ether'): 0.8,
            ('Ether', 'Ether'): 1.0,
            ('Ether', 'Fire'): 0.85,
            ('Ether', 'Air'): 0.9,
            ('Ether', 'Water'): 0.8,
            ('Ether', 'Earth'): 0.75,
        }
        return harmony_matrix.get((birth_element, day_element), 0.7)

    def _get_energy_description(self, level: str) -> str:
        """Get description for energy level"""
        descriptions = {
            'Low': 'Rest and introspection recommended. Honor your need for restoration.',
            'Moderate': 'Steady energy for routine tasks. Focus on completion.',
            'Good': 'Positive flow supports your endeavors. Take measured action.',
            'High': 'Strong cosmic support. Excellent for important initiatives.',
            'Excellent': 'Peak cosmic alignment. Ideal for major decisions and bold moves.'
        }
        return descriptions.get(level, 'Balanced energy for the day.')

    def _generate_love_insight(
        self,
        zodiac_sign: str,
        moon_sign: str,
        day_info: Dict[str, Any],
        energy_level: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate love and relationship insight"""
        planet = day_info.get('planet', 'Sun')

        love_themes = {
            'Sun': 'Radiate confidence. Express your heart openly.',
            'Moon': 'Emotional depth. Nurture your connections.',
            'Mars': 'Passionate energy. Be bold but mindful.',
            'Mercury': 'Communication flows. Share your thoughts.',
            'Jupiter': 'Expansion in love. Generosity brings joy.',
            'Venus': 'Romance flourishes. Beauty and harmony prevail.',
            'Saturn': 'Commitment matters. Build lasting foundations.'
        }

        ratings = {'Low': 3, 'Moderate': 3, 'Good': 4, 'High': 4, 'Excellent': 5}

        return {
            'rating': ratings.get(energy_level['level'], 4),
            'message': love_themes.get(planet, 'Open your heart to love today.'),
            'advice': f"As a {zodiac_sign}, your {moon_sign} Moon enhances emotional awareness."
        }

    def _generate_career_insight(
        self,
        zodiac_sign: str,
        ascendant: str,
        day_info: Dict[str, Any],
        energy_level: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate career insight"""
        planet = day_info.get('planet', 'Sun')

        career_themes = {
            'Sun': 'Leadership opportunities arise. Take charge with confidence.',
            'Moon': 'Trust your instincts in professional matters.',
            'Mars': 'Drive and ambition peak. Pursue goals actively.',
            'Mercury': 'Negotiations and communications favored.',
            'Jupiter': 'Expansion and growth. Think big.',
            'Venus': 'Harmony in workplace. Collaboration succeeds.',
            'Saturn': 'Discipline rewarded. Focus on long-term goals.'
        }

        ratings = {'Low': 3, 'Moderate': 4, 'Good': 4, 'High': 5, 'Excellent': 5}

        return {
            'rating': ratings.get(energy_level['level'], 4),
            'message': career_themes.get(planet, 'Professional progress indicated.'),
            'advice': f"Your {ascendant} ascendant supports methodical advancement."
        }

    def _generate_health_insight(
        self,
        zodiac_sign: str,
        nakshatra_energy: Dict[str, Any],
        day_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate health insight"""
        energy_type = nakshatra_energy.get('energy', 'Balanced')

        health_guidance = {
            'High': 'Energy is abundant. Channel it through physical activity.',
            'Intense': 'Balance intensity with rest. Mind your stress levels.',
            'Sharp': 'Mental acuity high. Protect your eyes and nervous system.',
            'Fertile': 'Nourishing time. Focus on nutrition and self-care.',
            'Curious': 'Movement and exploration benefit you. Walk in nature.',
            'Storm': 'Emotional release needed. Practice breathing exercises.',
            'Renewing': 'Restoration time. Sleep and healing emphasized.',
            'Auspicious': 'Excellent for health practices and healing rituals.',
            'Deep': 'Inner work time. Meditation and rest favored.',
            'Royal': 'Vitality strong. Lead with energy.',
            'Joyful': 'Light-hearted activities boost wellbeing.',
            'Stable': 'Consistency in health routines pays off.',
            'Dexterous': 'Hand-eye coordination sharp. Good for yoga.',
            'Brilliant': 'Radiant energy. Share your light.',
            'Airy': 'Breathwork and pranayama especially beneficial.',
            'Driven': 'Focused energy. Avoid burnout.',
            'Loyal': 'Support systems matter. Connect with loved ones.',
            'Senior': 'Wisdom guides health choices.',
            'Destructive': 'Release what no longer serves. Detox time.',
            'Confident': 'Physical strength peaks. Exercise favored.',
            'Final': 'Completion energy. Finish health goals.',
            'Receptive': 'Listen to your body. Rest when needed.',
            'Rhythmic': 'Dance, music, rhythm healing beneficial.',
            'Veiled': 'Hidden health matters surface. Pay attention.',
            'Fiery': 'Cool the system. Avoid excessive heat.',
            'Oceanic': 'Deep rest and water therapies beneficial.',
            'Gentle': 'Soft, nurturing activities support wellbeing.',
            'Balanced': 'Maintain equilibrium in all health practices.',
            'Moderate': 'Steady approach to health works best.'
        }

        return {
            'rating': 4,
            'message': health_guidance.get(energy_type, 'Maintain balance in your daily routine.'),
            'advice': f"For {zodiac_sign}, focus on {day_info.get('element', 'balanced')} element practices."
        }

    def _generate_finance_insight(
        self,
        zodiac_sign: str,
        day_info: Dict[str, Any],
        energy_level: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate finance insight"""
        planet = day_info.get('planet', 'Sun')

        finance_themes = {
            'Sun': 'Investments in self pay dividends. Leadership brings rewards.',
            'Moon': 'Intuitive financial decisions favored. Trust your gut.',
            'Mars': 'Bold moves can pay off. Calculated risks acceptable.',
            'Mercury': 'Commerce and trade favored. Good for negotiations.',
            'Jupiter': 'Abundance flows. Generosity returns multiplied.',
            'Venus': 'Luxury and beauty investments shine.',
            'Saturn': 'Conservative approach wins. Long-term planning essential.'
        }

        ratings = {'Low': 3, 'Moderate': 4, 'Good': 4, 'High': 5, 'Excellent': 5}

        return {
            'rating': ratings.get(energy_level['level'], 4),
            'message': finance_themes.get(planet, 'Financial awareness guides your day.'),
            'advice': 'Review investments with clear intention.'
        }

    def _generate_spiritual_insight(
        self,
        nakshatra: str,
        nakshatra_energy: Dict[str, Any],
        day_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate spiritual insight"""
        deity = day_info.get('deity', 'Surya')
        quality = nakshatra_energy.get('quality', 'Balanced')

        spiritual_guidance = f"Channel the {quality.lower()} energy of {nakshatra}."

        return {
            'rating': 4,
            'message': spiritual_guidance,
            'deity': deity,
            'mantra': f"Om {deity}aya Namaha",
            'practice': f"Invoke {deity} through morning prayer or meditation."
        }

    def _generate_lucky_elements(
        self,
        zodiac_sign: str,
        day_info: Dict[str, Any],
        target_date: datetime
    ) -> Dict[str, Any]:
        """Generate lucky elements for the day"""
        # Calculate lucky number based on date and sign
        base_number = (target_date.day + target_date.month) % 9 + 1

        colors = {
            'Sun': 'Gold',
            'Moon': 'Silver',
            'Mars': 'Red',
            'Mercury': 'Green',
            'Jupiter': 'Yellow',
            'Venus': 'Pink',
            'Saturn': 'Blue'
        }

        gemstones = {
            'Sun': 'Ruby',
            'Moon': 'Pearl',
            'Mars': 'Red Coral',
            'Mercury': 'Emerald',
            'Jupiter': 'Yellow Sapphire',
            'Venus': 'Diamond',
            'Saturn': 'Blue Sapphire'
        }

        directions = {
            'Sun': 'East',
            'Moon': 'Northwest',
            'Mars': 'South',
            'Mercury': 'North',
            'Jupiter': 'Northeast',
            'Venus': 'Southeast',
            'Saturn': 'West'
        }

        planet = day_info.get('planet', 'Sun')

        # Calculate auspicious times
        sunrise_hour = 6
        auspicious_hours = [
            f"{(sunrise_hour + i * 2) % 24}:00"
            for i in range(3)
        ]

        return {
            'number': base_number,
            'color': colors.get(planet, 'White'),
            'gemstone': gemstones.get(planet, 'Clear Quartz'),
            'direction': directions.get(planet, 'East'),
            'time': auspicious_hours[0],
            'auspicious_hours': auspicious_hours
        }

    def _generate_do_list(
        self,
        zodiac_theme: Dict[str, Any],
        day_info: Dict[str, Any],
        nakshatra_energy: Dict[str, Any]
    ) -> List[str]:
        """Generate list of recommended actions"""
        focus = zodiac_theme.get('focus', 'Growth')
        strength = zodiac_theme.get('strength', 'Inner wisdom')
        nakshatra_focus = nakshatra_energy.get('focus', 'General')

        base_dos = [
            f"Leverage your {strength.lower()}",
            f"Focus on {focus.lower()} today",
            f"Embrace {nakshatra_focus.lower()} activities",
            f"Honor {day_info.get('deity', 'the divine')} through devotion",
            "Practice gratitude and mindfulness"
        ]

        return base_dos[:4]

    def _generate_dont_list(
        self,
        zodiac_theme: Dict[str, Any],
        day_info: Dict[str, Any]
    ) -> List[str]:
        """Generate list of things to avoid"""
        challenge = zodiac_theme.get('challenge', 'Impatience')

        base_donts = [
            f"Avoid {challenge.lower()}",
            "Don't rush important decisions",
            "Avoid unnecessary conflicts",
            "Don't neglect self-care"
        ]

        return base_donts[:3]

    def _generate_overall_summary(
        self,
        zodiac_sign: str,
        energy_level: Dict[str, Any],
        zodiac_theme: Dict[str, Any],
        day_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate overall day summary"""
        level = energy_level.get('level', 'Good')
        focus = zodiac_theme.get('focus', 'Growth')
        planet = day_info.get('planet', 'Sun')

        summaries = {
            'Low': f"A reflective day for {zodiac_sign}. Rest and plan for brighter times ahead.",
            'Moderate': f"Steady progress for {zodiac_sign}. Focus on {focus.lower()} with patience.",
            'Good': f"Positive energy supports {zodiac_sign} today. Embrace {focus.lower()}.",
            'High': f"Strong day for {zodiac_sign}! {planet} energy amplifies your efforts.",
            'Excellent': f"Peak cosmic alignment for {zodiac_sign}. Seize opportunities in {focus.lower()}."
        }

        return {
            'energy': level,
            'rating': energy_level.get('score', 75),
            'message': summaries.get(level, f"A balanced day awaits {zodiac_sign}.")
        }

    def _generate_weekly_theme(
        self,
        zodiac_sign: str,
        daily_insights: List[Dict[str, Any]]
    ) -> str:
        """Generate weekly theme based on daily insights"""
        avg_energy = sum(d.get('energy', {}).get('score', 70) for d in daily_insights) / 7

        if avg_energy >= 85:
            return f"A powerful week of expansion and success for {zodiac_sign}."
        elif avg_energy >= 70:
            return f"Steady progress and positive developments await {zodiac_sign}."
        elif avg_energy >= 55:
            return f"A week of balance and measured growth for {zodiac_sign}."
        else:
            return f"A restorative week for {zodiac_sign}. Rest and reflection bring clarity."

    def _identify_best_days(self, daily_insights: List[Dict[str, Any]]) -> List[str]:
        """Identify the best days of the week"""
        sorted_days = sorted(
            daily_insights,
            key=lambda x: x.get('energy', {}).get('score', 0) if isinstance(x.get('energy'), dict) else 0,
            reverse=True
        )
        return [d['day_name'] for d in sorted_days[:2]]

    def _identify_challenging_days(self, daily_insights: List[Dict[str, Any]]) -> List[str]:
        """Identify potentially challenging days"""
        sorted_days = sorted(
            daily_insights,
            key=lambda x: x.get('energy', {}).get('score', 100) if isinstance(x.get('energy'), dict) else 100
        )
        return [d['day_name'] for d in sorted_days[:1]]

    def _generate_weekly_advice(self, zodiac_sign: str) -> str:
        """Generate weekly advice"""
        advice = {
            'Aries': "Channel your fire wisely. Bold action paired with patience yields results.",
            'Taurus': "Build steadily. Your persistence is your greatest asset this week.",
            'Gemini': "Communication opens doors. Express your ideas clearly.",
            'Cancer': "Nurture your foundations. Home and family bring strength.",
            'Leo': "Let your light shine. Creative expression brings joy.",
            'Virgo': "Details matter. Your analytical mind serves you well.",
            'Libra': "Seek harmony. Balance in relationships is key.",
            'Scorpio': "Transformation beckons. Embrace change with courage.",
            'Sagittarius': "Expand your horizons. Learning and adventure call.",
            'Capricorn': "Structure supports success. Build your vision step by step.",
            'Aquarius': "Innovation inspires. Your unique perspective matters.",
            'Pisces': "Trust your intuition. Spiritual insights guide your path."
        }
        return advice.get(zodiac_sign, "Trust the cosmic flow and stay aligned with your purpose.")

    def _generate_monthly_overview(self, zodiac_sign: str, month: int, year: int) -> str:
        """Generate monthly overview"""
        month_name = datetime(year, month, 1).strftime('%B')
        themes = self.ZODIAC_DAILY_THEMES.get(zodiac_sign, {})
        focus = themes.get('focus', 'Growth')

        return f"{month_name} {year} brings {focus.lower()} opportunities for {zodiac_sign}. " \
               f"Leverage your natural {themes.get('strength', 'wisdom').lower()} while " \
               f"managing tendencies toward {themes.get('challenge', 'imbalance').lower()}."

    def _generate_monthly_love(self, zodiac_sign: str, moon_sign: str, month: int) -> Dict[str, Any]:
        """Generate monthly love forecast"""
        return {
            'rating': 4,
            'summary': f"Romantic energies are favorable for {zodiac_sign} this month.",
            'single': "New connections possible through social gatherings.",
            'coupled': "Deepen bonds through quality time and open communication."
        }

    def _generate_monthly_career(self, zodiac_sign: str, month: int) -> Dict[str, Any]:
        """Generate monthly career forecast"""
        return {
            'rating': 4,
            'summary': f"Professional growth indicated for {zodiac_sign}.",
            'focus': "Strategic planning and networking",
            'opportunity': "Leadership roles may emerge mid-month."
        }

    def _generate_monthly_health(self, zodiac_sign: str, nakshatra: str, month: int) -> Dict[str, Any]:
        """Generate monthly health forecast"""
        return {
            'rating': 4,
            'summary': "Overall vitality is good this month.",
            'focus': "Balance rest and activity for optimal wellbeing.",
            'practice': "Regular meditation and exercise recommended."
        }

    def _generate_monthly_finance(self, zodiac_sign: str, month: int) -> Dict[str, Any]:
        """Generate monthly finance forecast"""
        return {
            'rating': 4,
            'summary': "Financial stability indicated this month.",
            'opportunity': "Mid-month favorable for investments.",
            'caution': "Avoid impulsive large purchases."
        }

    def _generate_monthly_spiritual(self, nakshatra: str, month: int) -> Dict[str, Any]:
        """Generate monthly spiritual forecast"""
        nakshatra_energy = self.NAKSHATRA_ENERGIES.get(nakshatra, {})

        return {
            'rating': 5,
            'summary': f"Spiritual growth through {nakshatra_energy.get('quality', 'balanced')} energy.",
            'practice': f"Focus on {nakshatra_energy.get('focus', 'meditation')} this month.",
            'insight': "Inner wisdom deepens through regular practice."
        }

    def _calculate_important_dates(self, zodiac_sign: str, month: int, year: int) -> List[Dict[str, Any]]:
        """Calculate important dates for the month"""
        return [
            {'date': f"{year}-{month:02d}-01", 'event': 'New Month Energy - Set Intentions'},
            {'date': f"{year}-{month:02d}-15", 'event': 'Mid-Month Review'},
            {'date': f"{year}-{month:02d}-{28 if month == 2 else 30}", 'event': 'Month End Reflection'}
        ]

    def _get_monthly_mantra(self, zodiac_sign: str, month: int) -> str:
        """Get monthly mantra based on zodiac sign"""
        mantras = {
            'Aries': "Om Suryaya Namaha - I embody courage and leadership",
            'Taurus': "Om Shukraya Namaha - I attract abundance and beauty",
            'Gemini': "Om Budhaya Namaha - I communicate with clarity",
            'Cancer': "Om Chandraya Namaha - I nurture and protect",
            'Leo': "Om Suryaya Namaha - I shine with confidence",
            'Virgo': "Om Budhaya Namaha - I serve with precision",
            'Libra': "Om Shukraya Namaha - I create harmony",
            'Scorpio': "Om Mangalaya Namaha - I transform with power",
            'Sagittarius': "Om Gurave Namaha - I expand with wisdom",
            'Capricorn': "Om Shanaischaraya Namaha - I build with discipline",
            'Aquarius': "Om Shanaischaraya Namaha - I innovate for humanity",
            'Pisces': "Om Gurave Namaha - I connect with divine wisdom"
        }
        return mantras.get(zodiac_sign, "Om Namah Shivaya - I am one with the universe")

    def _calculate_power_days(self, zodiac_sign: str, month: int, year: int) -> List[str]:
        """Calculate power days for the month"""
        # Simplified calculation based on zodiac element
        element = self.ZODIAC_DAILY_THEMES.get(zodiac_sign, {}).get('element', 'Fire')

        # Power days based on element
        power_days_map = {
            'Fire': ['1', '9', '17', '25'],
            'Earth': ['4', '12', '20', '28'],
            'Air': ['3', '11', '19', '27'],
            'Water': ['2', '10', '18', '26']
        }

        return [f"{year}-{month:02d}-{day.zfill(2)}" for day in power_days_map.get(element, ['1', '15'])]

    def _generate_yearly_theme(
        self,
        zodiac_sign: str,
        year: int,
        dasha: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate yearly theme"""
        maha_dasha = dasha.get('maha_dasha', 'Unknown')

        return {
            'title': f"Year of {self.ZODIAC_DAILY_THEMES.get(zodiac_sign, {}).get('focus', 'Growth')}",
            'summary': f"{year} brings transformative energy for {zodiac_sign} under {maha_dasha} Dasha.",
            'keywords': ['Growth', 'Transformation', 'Opportunity']
        }

    def _generate_quarter_forecast(self, zodiac_sign: str, year: int, quarter: int) -> Dict[str, Any]:
        """Generate quarterly forecast"""
        quarter_names = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)']

        return {
            'quarter': quarter,
            'name': quarter_names[quarter - 1],
            'theme': f"Focus on stability and growth",
            'focus_areas': ['Career', 'Relationships', 'Personal Growth'],
            'energy': 'Positive'
        }

    def _generate_yearly_love(self, zodiac_sign: str, moon_sign: str, year: int) -> Dict[str, Any]:
        """Generate yearly love forecast"""
        return {
            'rating': 4,
            'summary': f"Love and relationships flourish for {zodiac_sign} in {year}.",
            'key_periods': ['February', 'May', 'October'],
            'guidance': "Open your heart to deep connection."
        }

    def _generate_yearly_career(
        self,
        zodiac_sign: str,
        year: int,
        dasha: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate yearly career forecast"""
        return {
            'rating': 4,
            'summary': f"Professional advancement indicated for {zodiac_sign}.",
            'key_periods': ['March', 'July', 'November'],
            'guidance': "Strategic moves bring lasting success."
        }

    def _generate_yearly_health(self, zodiac_sign: str, nakshatra: str, year: int) -> Dict[str, Any]:
        """Generate yearly health forecast"""
        return {
            'rating': 4,
            'summary': "Overall vitality supports your goals this year.",
            'focus': "Consistent self-care practices",
            'guidance': "Balance activity with adequate rest."
        }

    def _generate_yearly_finance(self, zodiac_sign: str, year: int) -> Dict[str, Any]:
        """Generate yearly finance forecast"""
        return {
            'rating': 4,
            'summary': f"Financial growth opportunities for {zodiac_sign} in {year}.",
            'key_periods': ['April', 'August', 'December'],
            'guidance': "Strategic investments and savings favored."
        }

    def _generate_yearly_spiritual(
        self,
        nakshatra: str,
        year: int,
        dasha: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate yearly spiritual forecast"""
        return {
            'rating': 5,
            'summary': "Deep spiritual growth available this year.",
            'practices': ['Meditation', 'Mantra', 'Study'],
            'guidance': "Regular practice opens doors to wisdom."
        }

    def _identify_key_months(self, zodiac_sign: str, year: int) -> List[Dict[str, Any]]:
        """Identify key months for the year"""
        return [
            {'month': 'March', 'theme': 'New Beginnings'},
            {'month': 'June', 'theme': 'Peak Energy'},
            {'month': 'September', 'theme': 'Harvest'},
            {'month': 'December', 'theme': 'Reflection'}
        ]

    def _generate_annual_guidance(self, zodiac_sign: str, dasha: Dict[str, Any]) -> str:
        """Generate annual guidance"""
        themes = self.ZODIAC_DAILY_THEMES.get(zodiac_sign, {})

        return f"As a {zodiac_sign}, embrace your natural {themes.get('strength', 'gifts')}. " \
               f"Work consciously with your tendency toward {themes.get('challenge', 'challenges')}. " \
               f"The year supports your focus on {themes.get('focus', 'growth')}."


# Singleton instance
_daily_insights_engine = None


def get_daily_insights_engine(openai_service=None) -> DailyInsightsEngine:
    """Get or create Daily Insights Engine singleton"""
    global _daily_insights_engine
    if _daily_insights_engine is None:
        _daily_insights_engine = DailyInsightsEngine(openai_service)
    return _daily_insights_engine

"""
Horoscope Engine
Comprehensive horoscope generation based on Bhrigu Samhita and Nadi Jyotisha principles
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json

from utils.logger import setup_logger

logger = setup_logger(__name__)


class HoroscopeEngine:
    """
    Horoscope Engine for generating daily, weekly, monthly, and yearly horoscopes
    Based on Bhrigu Samhita teachings and Vedic astrology principles
    """

    # Zodiac sign characteristics based on Bhrigu Samhita
    ZODIAC_WISDOM = {
        'Aries': {
            'ruler': 'Mars',
            'element': 'Fire',
            'quality': 'Cardinal',
            'symbol': 'Ram',
            'bhrigu_nature': 'Pioneering spirit with divine warrior energy',
            'strengths': ['Leadership', 'Courage', 'Initiative', 'Enthusiasm'],
            'growth_areas': ['Patience', 'Diplomacy', 'Follow-through'],
            'lucky_day': 'Tuesday',
            'lucky_numbers': [1, 9],
            'colors': ['Red', 'Orange'],
            'mantra': 'Om Mangalaya Namaha'
        },
        'Taurus': {
            'ruler': 'Venus',
            'element': 'Earth',
            'quality': 'Fixed',
            'symbol': 'Bull',
            'bhrigu_nature': 'Grounded abundance seeker with artistic soul',
            'strengths': ['Stability', 'Persistence', 'Sensuality', 'Loyalty'],
            'growth_areas': ['Flexibility', 'Detachment', 'Risk-taking'],
            'lucky_day': 'Friday',
            'lucky_numbers': [2, 6],
            'colors': ['Green', 'Pink'],
            'mantra': 'Om Shukraya Namaha'
        },
        'Gemini': {
            'ruler': 'Mercury',
            'element': 'Air',
            'quality': 'Mutable',
            'symbol': 'Twins',
            'bhrigu_nature': 'Divine messenger with quicksilver mind',
            'strengths': ['Communication', 'Adaptability', 'Curiosity', 'Wit'],
            'growth_areas': ['Focus', 'Consistency', 'Depth'],
            'lucky_day': 'Wednesday',
            'lucky_numbers': [3, 5],
            'colors': ['Yellow', 'Green'],
            'mantra': 'Om Budhaya Namaha'
        },
        'Cancer': {
            'ruler': 'Moon',
            'element': 'Water',
            'quality': 'Cardinal',
            'symbol': 'Crab',
            'bhrigu_nature': 'Nurturing soul with emotional depth',
            'strengths': ['Intuition', 'Nurturing', 'Protection', 'Memory'],
            'growth_areas': ['Boundaries', 'Letting go', 'Objectivity'],
            'lucky_day': 'Monday',
            'lucky_numbers': [2, 7],
            'colors': ['White', 'Silver'],
            'mantra': 'Om Chandraya Namaha'
        },
        'Leo': {
            'ruler': 'Sun',
            'element': 'Fire',
            'quality': 'Fixed',
            'symbol': 'Lion',
            'bhrigu_nature': 'Royal soul with creative fire',
            'strengths': ['Leadership', 'Creativity', 'Generosity', 'Confidence'],
            'growth_areas': ['Humility', 'Listening', 'Sharing spotlight'],
            'lucky_day': 'Sunday',
            'lucky_numbers': [1, 4],
            'colors': ['Gold', 'Orange'],
            'mantra': 'Om Suryaya Namaha'
        },
        'Virgo': {
            'ruler': 'Mercury',
            'element': 'Earth',
            'quality': 'Mutable',
            'symbol': 'Virgin',
            'bhrigu_nature': 'Service-oriented soul with discerning mind',
            'strengths': ['Analysis', 'Service', 'Precision', 'Health'],
            'growth_areas': ['Self-compassion', 'Big picture', 'Relaxation'],
            'lucky_day': 'Wednesday',
            'lucky_numbers': [5, 6],
            'colors': ['Green', 'Brown'],
            'mantra': 'Om Budhaya Namaha'
        },
        'Libra': {
            'ruler': 'Venus',
            'element': 'Air',
            'quality': 'Cardinal',
            'symbol': 'Scales',
            'bhrigu_nature': 'Harmony seeker with aesthetic soul',
            'strengths': ['Diplomacy', 'Balance', 'Partnership', 'Beauty'],
            'growth_areas': ['Decisiveness', 'Self-assertion', 'Independence'],
            'lucky_day': 'Friday',
            'lucky_numbers': [6, 7],
            'colors': ['Pink', 'Light Blue'],
            'mantra': 'Om Shukraya Namaha'
        },
        'Scorpio': {
            'ruler': 'Mars',
            'element': 'Water',
            'quality': 'Fixed',
            'symbol': 'Scorpion',
            'bhrigu_nature': 'Transformational soul with penetrating insight',
            'strengths': ['Intensity', 'Transformation', 'Intuition', 'Loyalty'],
            'growth_areas': ['Trust', 'Forgiveness', 'Letting go'],
            'lucky_day': 'Tuesday',
            'lucky_numbers': [8, 9],
            'colors': ['Deep Red', 'Black'],
            'mantra': 'Om Mangalaya Namaha'
        },
        'Sagittarius': {
            'ruler': 'Jupiter',
            'element': 'Fire',
            'quality': 'Mutable',
            'symbol': 'Archer',
            'bhrigu_nature': 'Wisdom seeker with expansive vision',
            'strengths': ['Optimism', 'Philosophy', 'Adventure', 'Teaching'],
            'growth_areas': ['Commitment', 'Details', 'Tactfulness'],
            'lucky_day': 'Thursday',
            'lucky_numbers': [3, 9],
            'colors': ['Purple', 'Blue'],
            'mantra': 'Om Gurave Namaha'
        },
        'Capricorn': {
            'ruler': 'Saturn',
            'element': 'Earth',
            'quality': 'Cardinal',
            'symbol': 'Sea-Goat',
            'bhrigu_nature': 'Disciplined achiever with enduring spirit',
            'strengths': ['Ambition', 'Discipline', 'Responsibility', 'Patience'],
            'growth_areas': ['Work-life balance', 'Emotional expression', 'Spontaneity'],
            'lucky_day': 'Saturday',
            'lucky_numbers': [4, 8],
            'colors': ['Brown', 'Black'],
            'mantra': 'Om Shanaischaraya Namaha'
        },
        'Aquarius': {
            'ruler': 'Saturn',
            'element': 'Air',
            'quality': 'Fixed',
            'symbol': 'Water Bearer',
            'bhrigu_nature': 'Humanitarian visionary with unique perspective',
            'strengths': ['Innovation', 'Humanitarianism', 'Independence', 'Vision'],
            'growth_areas': ['Emotional intimacy', 'Tradition', 'Consistency'],
            'lucky_day': 'Saturday',
            'lucky_numbers': [4, 7],
            'colors': ['Electric Blue', 'Violet'],
            'mantra': 'Om Shanaischaraya Namaha'
        },
        'Pisces': {
            'ruler': 'Jupiter',
            'element': 'Water',
            'quality': 'Mutable',
            'symbol': 'Fish',
            'bhrigu_nature': 'Compassionate mystic with transcendent soul',
            'strengths': ['Intuition', 'Compassion', 'Creativity', 'Spirituality'],
            'growth_areas': ['Boundaries', 'Practicality', 'Grounding'],
            'lucky_day': 'Thursday',
            'lucky_numbers': [3, 7],
            'colors': ['Sea Green', 'Lavender'],
            'mantra': 'Om Gurave Namaha'
        }
    }

    # Planetary transits effects based on Bhrigu Samhita
    PLANETARY_EFFECTS = {
        'Sun': {
            'positive': 'Vitality, leadership, recognition',
            'challenging': 'Ego conflicts, authority issues',
            'remedy': 'Surya Namaskar at sunrise'
        },
        'Moon': {
            'positive': 'Emotional harmony, intuition, nurturing',
            'challenging': 'Mood swings, emotional sensitivity',
            'remedy': 'Chandra worship on Mondays'
        },
        'Mars': {
            'positive': 'Energy, courage, initiative',
            'challenging': 'Aggression, impatience, conflicts',
            'remedy': 'Hanuman Chalisa on Tuesdays'
        },
        'Mercury': {
            'positive': 'Communication, intellect, commerce',
            'challenging': 'Confusion, miscommunication',
            'remedy': 'Vishnu worship on Wednesdays'
        },
        'Jupiter': {
            'positive': 'Wisdom, expansion, good fortune',
            'challenging': 'Overconfidence, excess',
            'remedy': 'Guru worship on Thursdays'
        },
        'Venus': {
            'positive': 'Love, beauty, harmony, wealth',
            'challenging': 'Indulgence, vanity',
            'remedy': 'Lakshmi puja on Fridays'
        },
        'Saturn': {
            'positive': 'Discipline, structure, karmic rewards',
            'challenging': 'Delays, restrictions, karma',
            'remedy': 'Shani worship on Saturdays'
        },
        'Rahu': {
            'positive': 'Ambition, innovation, material gains',
            'challenging': 'Illusion, obsession, confusion',
            'remedy': 'Durga worship, avoid tamasic foods'
        },
        'Ketu': {
            'positive': 'Spiritual insight, liberation, intuition',
            'challenging': 'Detachment, confusion, losses',
            'remedy': 'Ganesha worship, meditation'
        }
    }

    def __init__(self, openai_service=None):
        self.openai_service = openai_service

    def generate_daily_horoscope(
        self,
        birth_data: Dict[str, Any],
        target_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Generate comprehensive daily horoscope based on Bhrigu Samhita
        """
        if target_date is None:
            target_date = datetime.now()

        zodiac_sign = birth_data.get('zodiac_sign', 'Aries')
        moon_sign = birth_data.get('moon_sign', zodiac_sign)
        nakshatra = birth_data.get('nakshatra', 'Ashwini')
        ascendant = birth_data.get('ascendant', zodiac_sign)

        # Get zodiac wisdom
        wisdom = self.ZODIAC_WISDOM.get(zodiac_sign, self.ZODIAC_WISDOM['Aries'])

        # Calculate day energy
        day_ruler = self._get_day_ruler(target_date.weekday())
        is_lucky_day = target_date.strftime('%A') == wisdom['lucky_day']

        # Generate horoscope sections
        overall = self._generate_daily_overall(zodiac_sign, wisdom, day_ruler, is_lucky_day)
        love = self._generate_daily_love(zodiac_sign, moon_sign, day_ruler)
        career = self._generate_daily_career(zodiac_sign, ascendant, day_ruler)
        health = self._generate_daily_health(zodiac_sign, wisdom, day_ruler)
        finance = self._generate_daily_finance(zodiac_sign, day_ruler)

        # Generate ratings
        ratings = self._calculate_daily_ratings(zodiac_sign, day_ruler, is_lucky_day)

        # Lucky elements
        lucky_elements = {
            'number': wisdom['lucky_numbers'][target_date.day % len(wisdom['lucky_numbers'])],
            'color': wisdom['colors'][0],
            'time': self._get_auspicious_time(day_ruler),
            'direction': self._get_lucky_direction(day_ruler)
        }

        return {
            'date': target_date.strftime('%Y-%m-%d'),
            'day': target_date.strftime('%A'),
            'zodiac_sign': zodiac_sign,
            'overall': overall,
            'sections': {
                'love': love,
                'career': career,
                'health': health,
                'finance': finance
            },
            'ratings': ratings,
            'lucky_elements': lucky_elements,
            'daily_mantra': wisdom['mantra'],
            'bhrigu_guidance': self._get_bhrigu_daily_guidance(zodiac_sign, day_ruler),
            'metadata': {
                'zodiac_sign': zodiac_sign,
                'moon_sign': moon_sign,
                'nakshatra': nakshatra,
                'ascendant': ascendant,
                'day_ruler': day_ruler,
                'tradition': 'Bhrigu Samhita',
                'generated_at': datetime.utcnow().isoformat()
            }
        }

    def generate_weekly_horoscope(
        self,
        birth_data: Dict[str, Any],
        start_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Generate weekly horoscope based on Bhrigu Samhita
        """
        if start_date is None:
            start_date = datetime.now()

        # Get start of week (Monday)
        days_since_monday = start_date.weekday()
        week_start = start_date - timedelta(days=days_since_monday)

        zodiac_sign = birth_data.get('zodiac_sign', 'Aries')
        moon_sign = birth_data.get('moon_sign', zodiac_sign)
        wisdom = self.ZODIAC_WISDOM.get(zodiac_sign, self.ZODIAC_WISDOM['Aries'])

        # Generate weekly theme
        weekly_theme = self._generate_weekly_theme(zodiac_sign, wisdom)

        # Generate daily summaries
        daily_summaries = []
        for i in range(7):
            day = week_start + timedelta(days=i)
            daily_summaries.append({
                'date': day.strftime('%Y-%m-%d'),
                'day': day.strftime('%A'),
                'energy': self._get_day_energy(zodiac_sign, day.weekday()),
                'focus': self._get_daily_focus(day.weekday())
            })

        # Weekly sections
        sections = {
            'love': self._generate_weekly_love(zodiac_sign, moon_sign),
            'career': self._generate_weekly_career(zodiac_sign),
            'health': self._generate_weekly_health(zodiac_sign),
            'finance': self._generate_weekly_finance(zodiac_sign)
        }

        # Best and challenging days
        best_day = wisdom['lucky_day']
        challenging_day = self._get_challenging_day(zodiac_sign)

        return {
            'week_start': week_start.strftime('%Y-%m-%d'),
            'week_end': (week_start + timedelta(days=6)).strftime('%Y-%m-%d'),
            'zodiac_sign': zodiac_sign,
            'weekly_theme': weekly_theme,
            'sections': sections,
            'daily_summaries': daily_summaries,
            'best_day': best_day,
            'challenging_day': challenging_day,
            'weekly_mantra': wisdom['mantra'],
            'bhrigu_guidance': self._get_bhrigu_weekly_guidance(zodiac_sign),
            'metadata': {
                'zodiac_sign': zodiac_sign,
                'moon_sign': moon_sign,
                'tradition': 'Bhrigu Samhita',
                'generated_at': datetime.utcnow().isoformat()
            }
        }

    def generate_monthly_horoscope(
        self,
        birth_data: Dict[str, Any],
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate monthly horoscope based on Bhrigu Samhita
        """
        now = datetime.now()
        if year is None:
            year = now.year
        if month is None:
            month = now.month

        zodiac_sign = birth_data.get('zodiac_sign', 'Aries')
        moon_sign = birth_data.get('moon_sign', zodiac_sign)
        nakshatra = birth_data.get('nakshatra', 'Ashwini')
        wisdom = self.ZODIAC_WISDOM.get(zodiac_sign, self.ZODIAC_WISDOM['Aries'])

        month_name = datetime(year, month, 1).strftime('%B')

        # Generate monthly theme
        monthly_theme = self._generate_monthly_theme(zodiac_sign, month, year, wisdom)

        # Monthly sections
        sections = {
            'love': self._generate_monthly_love_detailed(zodiac_sign, moon_sign, month),
            'career': self._generate_monthly_career_detailed(zodiac_sign, month),
            'health': self._generate_monthly_health_detailed(zodiac_sign, nakshatra, month),
            'finance': self._generate_monthly_finance_detailed(zodiac_sign, month),
            'spiritual': self._generate_monthly_spiritual(zodiac_sign, nakshatra, month)
        }

        # Important dates
        important_dates = self._calculate_monthly_dates(zodiac_sign, month, year, wisdom)

        # Monthly guidance
        monthly_guidance = self._get_bhrigu_monthly_guidance(zodiac_sign, month)

        return {
            'month': month,
            'year': year,
            'month_name': month_name,
            'zodiac_sign': zodiac_sign,
            'monthly_theme': monthly_theme,
            'sections': sections,
            'important_dates': important_dates,
            'power_days': self._get_power_days(zodiac_sign, month, year),
            'caution_days': self._get_caution_days(zodiac_sign, month, year),
            'monthly_mantra': wisdom['mantra'],
            'monthly_ritual': self._get_monthly_ritual(zodiac_sign, month),
            'bhrigu_guidance': monthly_guidance,
            'metadata': {
                'zodiac_sign': zodiac_sign,
                'moon_sign': moon_sign,
                'nakshatra': nakshatra,
                'tradition': 'Bhrigu Samhita',
                'generated_at': datetime.utcnow().isoformat()
            }
        }

    def generate_yearly_horoscope(
        self,
        birth_data: Dict[str, Any],
        year: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate yearly horoscope based on Bhrigu Samhita
        """
        if year is None:
            year = datetime.now().year

        zodiac_sign = birth_data.get('zodiac_sign', 'Aries')
        moon_sign = birth_data.get('moon_sign', zodiac_sign)
        nakshatra = birth_data.get('nakshatra', 'Ashwini')
        dasha = birth_data.get('dasha_period', {})
        wisdom = self.ZODIAC_WISDOM.get(zodiac_sign, self.ZODIAC_WISDOM['Aries'])

        # Yearly theme
        yearly_theme = self._generate_yearly_theme(zodiac_sign, year, dasha, wisdom)

        # Quarterly forecasts
        quarters = []
        for q in range(1, 5):
            quarters.append(self._generate_quarterly_forecast(zodiac_sign, year, q, wisdom))

        # Yearly sections
        sections = {
            'love': self._generate_yearly_love_detailed(zodiac_sign, moon_sign, year),
            'career': self._generate_yearly_career_detailed(zodiac_sign, year, dasha),
            'health': self._generate_yearly_health_detailed(zodiac_sign, nakshatra, year),
            'finance': self._generate_yearly_finance_detailed(zodiac_sign, year),
            'spiritual': self._generate_yearly_spiritual_detailed(zodiac_sign, nakshatra, year, dasha)
        }

        # Key months
        key_months = self._identify_key_months_detailed(zodiac_sign, year)

        # Yearly guidance
        yearly_guidance = self._get_bhrigu_yearly_guidance(zodiac_sign, year, dasha)

        return {
            'year': year,
            'zodiac_sign': zodiac_sign,
            'yearly_theme': yearly_theme,
            'sections': sections,
            'quarters': quarters,
            'key_months': key_months,
            'yearly_mantra': wisdom['mantra'],
            'annual_ritual': self._get_annual_ritual(zodiac_sign, year),
            'bhrigu_guidance': yearly_guidance,
            'metadata': {
                'zodiac_sign': zodiac_sign,
                'moon_sign': moon_sign,
                'nakshatra': nakshatra,
                'dasha': dasha.get('maha_dasha', 'Unknown'),
                'tradition': 'Bhrigu Samhita',
                'generated_at': datetime.utcnow().isoformat()
            }
        }

    # Private helper methods

    def _get_day_ruler(self, weekday: int) -> str:
        """Get the planetary ruler of the day"""
        rulers = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']
        return rulers[weekday]

    def _generate_daily_overall(
        self,
        zodiac_sign: str,
        wisdom: Dict[str, Any],
        day_ruler: str,
        is_lucky_day: bool
    ) -> Dict[str, Any]:
        """Generate daily overall horoscope"""
        ruler = wisdom['ruler']
        element = wisdom['element']

        if is_lucky_day:
            energy = "Excellent"
            message = f"Your lucky day amplifies {zodiac_sign}'s natural strengths. "\
                      f"{wisdom['bhrigu_nature']}. Take bold action today."
        elif ruler == day_ruler:
            energy = "High"
            message = f"Your ruling planet {ruler} governs today, enhancing your natural abilities. "\
                      f"Channel your {element} energy productively."
        else:
            energy = "Good"
            message = f"A balanced day for {zodiac_sign}. Focus on {wisdom['strengths'][0].lower()} "\
                      f"while managing {wisdom['growth_areas'][0].lower()}."

        return {
            'energy': energy,
            'message': message,
            'rating': 5 if is_lucky_day else (4 if ruler == day_ruler else 3)
        }

    def _generate_daily_love(
        self,
        zodiac_sign: str,
        moon_sign: str,
        day_ruler: str
    ) -> Dict[str, Any]:
        """Generate daily love horoscope"""
        love_rulers = {'Venus': 5, 'Moon': 4, 'Jupiter': 4, 'Sun': 3, 'Mars': 3, 'Mercury': 3, 'Saturn': 2}
        rating = love_rulers.get(day_ruler, 3)

        messages = {
            'Venus': "Romance flourishes today. Express your feelings openly.",
            'Moon': "Emotional connections deepen. Nurture your relationships.",
            'Jupiter': "Expansion in love matters. Generosity brings joy.",
            'Sun': "Confidence attracts. Be your authentic self.",
            'Mars': "Passionate energy. Channel it constructively in relationships.",
            'Mercury': "Communication is key today. Share your heart through words.",
            'Saturn': "Commitment and loyalty take center stage. Value stability."
        }

        return {
            'rating': rating,
            'message': messages.get(day_ruler, "Love energy flows steadily today.")
        }

    def _generate_daily_career(
        self,
        zodiac_sign: str,
        ascendant: str,
        day_ruler: str
    ) -> Dict[str, Any]:
        """Generate daily career horoscope"""
        career_rulers = {'Sun': 5, 'Saturn': 5, 'Jupiter': 4, 'Mars': 4, 'Mercury': 4, 'Venus': 3, 'Moon': 3}
        rating = career_rulers.get(day_ruler, 3)

        messages = {
            'Sun': "Leadership opportunities arise. Take charge with confidence.",
            'Saturn': "Hard work pays off. Discipline leads to advancement.",
            'Jupiter': "Expansion and growth in career. Think big.",
            'Mars': "Drive and ambition peak. Pursue goals actively.",
            'Mercury': "Negotiations and communications favored. Network effectively.",
            'Venus': "Harmony in workplace. Collaboration succeeds.",
            'Moon': "Trust your instincts in professional matters."
        }

        return {
            'rating': rating,
            'message': messages.get(day_ruler, "Professional progress is indicated.")
        }

    def _generate_daily_health(
        self,
        zodiac_sign: str,
        wisdom: Dict[str, Any],
        day_ruler: str
    ) -> Dict[str, Any]:
        """Generate daily health horoscope"""
        element = wisdom['element']

        element_health = {
            'Fire': "Channel excess energy through physical activity.",
            'Earth': "Grounding practices support your wellbeing today.",
            'Air': "Breathing exercises and mental calm benefit you.",
            'Water': "Emotional balance affects physical health. Stay hydrated."
        }

        return {
            'rating': 4,
            'message': element_health.get(element, "Balance activity and rest today.")
        }

    def _generate_daily_finance(self, zodiac_sign: str, day_ruler: str) -> Dict[str, Any]:
        """Generate daily finance horoscope"""
        finance_rulers = {'Jupiter': 5, 'Venus': 5, 'Mercury': 4, 'Sun': 4, 'Saturn': 3, 'Mars': 3, 'Moon': 3}
        rating = finance_rulers.get(day_ruler, 3)

        messages = {
            'Jupiter': "Abundance flows. Good for investments and expansion.",
            'Venus': "Luxury and beauty investments shine. Attract wealth.",
            'Mercury': "Commerce and trade favored. Good for negotiations.",
            'Sun': "Self-investment pays dividends. Leadership brings rewards.",
            'Saturn': "Conservative approach wins. Long-term planning essential.",
            'Mars': "Bold moves can pay off. Calculated risks acceptable.",
            'Moon': "Intuitive financial decisions favored."
        }

        return {
            'rating': rating,
            'message': messages.get(day_ruler, "Financial awareness guides your day.")
        }

    def _calculate_daily_ratings(
        self,
        zodiac_sign: str,
        day_ruler: str,
        is_lucky_day: bool
    ) -> Dict[str, int]:
        """Calculate overall daily ratings"""
        base = 4 if is_lucky_day else 3

        wisdom = self.ZODIAC_WISDOM.get(zodiac_sign, self.ZODIAC_WISDOM['Aries'])
        ruler = wisdom['ruler']

        bonus = 1 if ruler == day_ruler else 0

        return {
            'overall': min(5, base + bonus),
            'love': min(5, base + (1 if day_ruler in ['Venus', 'Moon'] else 0)),
            'career': min(5, base + (1 if day_ruler in ['Sun', 'Saturn', 'Jupiter'] else 0)),
            'health': base,
            'finance': min(5, base + (1 if day_ruler in ['Jupiter', 'Venus'] else 0))
        }

    def _get_auspicious_time(self, day_ruler: str) -> str:
        """Get auspicious time based on day ruler"""
        times = {
            'Sun': '6:00 AM - 7:00 AM',
            'Moon': '6:00 PM - 7:00 PM',
            'Mars': '8:00 AM - 9:00 AM',
            'Mercury': '9:00 AM - 10:00 AM',
            'Jupiter': '7:00 AM - 8:00 AM',
            'Venus': '5:00 PM - 6:00 PM',
            'Saturn': '7:00 PM - 8:00 PM'
        }
        return times.get(day_ruler, '7:00 AM - 8:00 AM')

    def _get_lucky_direction(self, day_ruler: str) -> str:
        """Get lucky direction based on day ruler"""
        directions = {
            'Sun': 'East',
            'Moon': 'Northwest',
            'Mars': 'South',
            'Mercury': 'North',
            'Jupiter': 'Northeast',
            'Venus': 'Southeast',
            'Saturn': 'West'
        }
        return directions.get(day_ruler, 'East')

    def _get_bhrigu_daily_guidance(self, zodiac_sign: str, day_ruler: str) -> str:
        """Get Bhrigu Samhita daily guidance"""
        wisdom = self.ZODIAC_WISDOM.get(zodiac_sign, self.ZODIAC_WISDOM['Aries'])

        return f"According to Bhrigu Samhita, {zodiac_sign} natives should honor {day_ruler} today. "\
               f"Your {wisdom['bhrigu_nature'].lower()} serves you well. "\
               f"Chant '{wisdom['mantra']}' for enhanced blessings."

    def _generate_weekly_theme(self, zodiac_sign: str, wisdom: Dict[str, Any]) -> Dict[str, Any]:
        """Generate weekly theme"""
        return {
            'title': f"Week of {wisdom['strengths'][0]}",
            'summary': f"This week emphasizes {zodiac_sign}'s natural {wisdom['strengths'][0].lower()}. "\
                       f"Focus on {wisdom['strengths'][1].lower()} while managing {wisdom['growth_areas'][0].lower()}.",
            'focus': wisdom['strengths'][0]
        }

    def _get_day_energy(self, zodiac_sign: str, weekday: int) -> str:
        """Get energy level for a specific day"""
        wisdom = self.ZODIAC_WISDOM.get(zodiac_sign, self.ZODIAC_WISDOM['Aries'])
        day_ruler = self._get_day_ruler(weekday)
        day_name = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][weekday]

        if day_name == wisdom['lucky_day']:
            return 'Excellent'
        elif day_ruler == wisdom['ruler']:
            return 'High'
        else:
            return 'Good'

    def _get_daily_focus(self, weekday: int) -> str:
        """Get focus area for each day"""
        focuses = [
            'Emotional Balance',  # Monday - Moon
            'Action & Energy',    # Tuesday - Mars
            'Communication',      # Wednesday - Mercury
            'Expansion',          # Thursday - Jupiter
            'Love & Harmony',     # Friday - Venus
            'Discipline',         # Saturday - Saturn
            'Self-Expression'     # Sunday - Sun
        ]
        return focuses[weekday]

    def _get_challenging_day(self, zodiac_sign: str) -> str:
        """Get potentially challenging day for the sign"""
        wisdom = self.ZODIAC_WISDOM.get(zodiac_sign, self.ZODIAC_WISDOM['Aries'])
        element = wisdom['element']

        # Challenging days based on element
        challenging = {
            'Fire': 'Saturday',   # Saturn restricts fire
            'Earth': 'Sunday',    # Sun can overheat earth
            'Air': 'Tuesday',     # Mars can agitate air
            'Water': 'Tuesday'    # Mars can disturb water
        }

        return challenging.get(element, 'Saturday')

    def _generate_weekly_love(self, zodiac_sign: str, moon_sign: str) -> Dict[str, Any]:
        """Generate weekly love forecast"""
        return {
            'rating': 4,
            'summary': f"Love and relationships show positive momentum for {zodiac_sign}.",
            'single': "New connections possible through social activities.",
            'coupled': "Deepen bonds through quality time and communication.",
            'key_day': 'Friday'
        }

    def _generate_weekly_career(self, zodiac_sign: str) -> Dict[str, Any]:
        """Generate weekly career forecast"""
        return {
            'rating': 4,
            'summary': f"Professional growth opportunities await {zodiac_sign}.",
            'focus': "Strategic planning and networking",
            'opportunity': "Mid-week brings important developments.",
            'key_day': 'Thursday'
        }

    def _generate_weekly_health(self, zodiac_sign: str) -> Dict[str, Any]:
        """Generate weekly health forecast"""
        return {
            'rating': 4,
            'summary': "Overall vitality supports your activities.",
            'focus': "Balance rest and activity",
            'practice': "Regular exercise and meditation recommended.",
            'key_day': 'Sunday'
        }

    def _generate_weekly_finance(self, zodiac_sign: str) -> Dict[str, Any]:
        """Generate weekly finance forecast"""
        return {
            'rating': 4,
            'summary': "Financial stability is indicated this week.",
            'opportunity': "Mid-week favorable for financial decisions.",
            'caution': "Avoid impulsive spending.",
            'key_day': 'Thursday'
        }

    def _get_bhrigu_weekly_guidance(self, zodiac_sign: str) -> str:
        """Get Bhrigu Samhita weekly guidance"""
        wisdom = self.ZODIAC_WISDOM.get(zodiac_sign, self.ZODIAC_WISDOM['Aries'])

        return f"Bhrigu Samhita advises {zodiac_sign} to embrace their {wisdom['bhrigu_nature'].lower()} this week. "\
               f"Focus on developing {wisdom['strengths'][1].lower()} while remaining mindful of {wisdom['growth_areas'][0].lower()}."

    def _generate_monthly_theme(
        self,
        zodiac_sign: str,
        month: int,
        year: int,
        wisdom: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate monthly theme"""
        month_name = datetime(year, month, 1).strftime('%B')

        return {
            'title': f"Month of {wisdom['strengths'][month % len(wisdom['strengths'])]}",
            'summary': f"{month_name} {year} brings focus on {wisdom['strengths'][0].lower()} for {zodiac_sign}. "\
                       f"Your {wisdom['element']} nature guides you through opportunities and challenges.",
            'keywords': wisdom['strengths'][:3]
        }

    def _generate_monthly_love_detailed(
        self,
        zodiac_sign: str,
        moon_sign: str,
        month: int
    ) -> Dict[str, Any]:
        """Generate detailed monthly love forecast"""
        return {
            'rating': 4,
            'summary': f"Romantic energies are favorable for {zodiac_sign} this month.",
            'single': {
                'outlook': "New connections possible through expanded social circles.",
                'best_weeks': "First and third weeks"
            },
            'coupled': {
                'outlook': "Deepen bonds through meaningful experiences together.",
                'focus': "Communication and quality time"
            },
            'key_dates': [f"{month}/7", f"{month}/14", f"{month}/21"]
        }

    def _generate_monthly_career_detailed(self, zodiac_sign: str, month: int) -> Dict[str, Any]:
        """Generate detailed monthly career forecast"""
        return {
            'rating': 4,
            'summary': f"Professional advancement indicated for {zodiac_sign}.",
            'opportunities': [
                "Leadership recognition possible",
                "Networking brings valuable connections",
                "Skill development pays off"
            ],
            'challenges': "Avoid overcommitment",
            'best_week': "Second week",
            'key_dates': [f"{month}/5", f"{month}/15", f"{month}/25"]
        }

    def _generate_monthly_health_detailed(
        self,
        zodiac_sign: str,
        nakshatra: str,
        month: int
    ) -> Dict[str, Any]:
        """Generate detailed monthly health forecast"""
        return {
            'rating': 4,
            'summary': "Overall vitality is good this month.",
            'focus_areas': [
                "Consistent exercise routine",
                "Balanced nutrition",
                "Adequate rest"
            ],
            'caution': "Mid-month may require extra rest",
            'practices': ["Yoga", "Meditation", "Walking"],
            'best_week_for_health': "First week"
        }

    def _generate_monthly_finance_detailed(self, zodiac_sign: str, month: int) -> Dict[str, Any]:
        """Generate detailed monthly finance forecast"""
        return {
            'rating': 4,
            'summary': "Financial stability indicated this month.",
            'opportunities': [
                "Investment opportunities mid-month",
                "Savings growth possible",
                "Career-related income boost"
            ],
            'caution': "Avoid large unplanned expenses",
            'best_week_for_finance': "Third week",
            'key_dates': [f"{month}/10", f"{month}/20"]
        }

    def _generate_monthly_spiritual(
        self,
        zodiac_sign: str,
        nakshatra: str,
        month: int
    ) -> Dict[str, Any]:
        """Generate monthly spiritual forecast"""
        wisdom = self.ZODIAC_WISDOM.get(zodiac_sign, self.ZODIAC_WISDOM['Aries'])

        return {
            'rating': 5,
            'summary': "Spiritual growth is supported this month.",
            'practices': [
                f"Daily chanting of {wisdom['mantra']}",
                "Morning meditation",
                "Evening reflection"
            ],
            'insight': "Inner wisdom deepens through regular practice.",
            'best_days': [wisdom['lucky_day']]
        }

    def _calculate_monthly_dates(
        self,
        zodiac_sign: str,
        month: int,
        year: int,
        wisdom: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Calculate important monthly dates"""
        return [
            {'date': f"{year}-{month:02d}-01", 'event': 'New Month Intentions', 'type': 'auspicious'},
            {'date': f"{year}-{month:02d}-08", 'event': 'First Quarter Focus', 'type': 'important'},
            {'date': f"{year}-{month:02d}-15", 'event': 'Full Moon Energy Peak', 'type': 'powerful'},
            {'date': f"{year}-{month:02d}-22", 'event': 'Last Quarter Reflection', 'type': 'introspective'},
            {'date': f"{year}-{month:02d}-{28 if month == 2 else 30}", 'event': 'Month End Review', 'type': 'completion'}
        ]

    def _get_power_days(self, zodiac_sign: str, month: int, year: int) -> List[str]:
        """Get power days for the month"""
        wisdom = self.ZODIAC_WISDOM.get(zodiac_sign, self.ZODIAC_WISDOM['Aries'])
        lucky_numbers = wisdom['lucky_numbers']

        power_days = []
        for num in lucky_numbers:
            if num <= 28:
                power_days.append(f"{year}-{month:02d}-{num:02d}")
            day = num + 10
            if day <= 28:
                power_days.append(f"{year}-{month:02d}-{day:02d}")

        return power_days[:4]

    def _get_caution_days(self, zodiac_sign: str, month: int, year: int) -> List[str]:
        """Get caution days for the month"""
        return [
            f"{year}-{month:02d}-08",
            f"{year}-{month:02d}-22"
        ]

    def _get_monthly_ritual(self, zodiac_sign: str, month: int) -> Dict[str, Any]:
        """Get monthly ritual recommendation"""
        wisdom = self.ZODIAC_WISDOM.get(zodiac_sign, self.ZODIAC_WISDOM['Aries'])

        return {
            'name': f'{wisdom["ruler"]} Worship',
            'timing': f'Every {wisdom["lucky_day"]}',
            'mantra': wisdom['mantra'],
            'offering': 'Flowers and incense',
            'benefit': f'Enhances {wisdom["strengths"][0].lower()}'
        }

    def _get_bhrigu_monthly_guidance(self, zodiac_sign: str, month: int) -> str:
        """Get Bhrigu Samhita monthly guidance"""
        wisdom = self.ZODIAC_WISDOM.get(zodiac_sign, self.ZODIAC_WISDOM['Aries'])
        month_name = datetime(2024, month, 1).strftime('%B')

        return f"According to Bhrigu Samhita, {month_name} is a significant month for {zodiac_sign}. "\
               f"Your {wisdom['bhrigu_nature'].lower()} will be tested and strengthened. "\
               f"Honor {wisdom['ruler']} through regular worship on {wisdom['lucky_day']}s."

    def _generate_yearly_theme(
        self,
        zodiac_sign: str,
        year: int,
        dasha: Dict[str, Any],
        wisdom: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate yearly theme"""
        maha_dasha = dasha.get('maha_dasha', wisdom['ruler'])

        return {
            'title': f"Year of {wisdom['strengths'][0]} & {wisdom['strengths'][1]}",
            'summary': f"{year} brings transformative energy for {zodiac_sign} under {maha_dasha} Dasha. "\
                       f"Your {wisdom['bhrigu_nature'].lower()} guides you toward fulfillment.",
            'keywords': wisdom['strengths'],
            'ruling_energy': maha_dasha
        }

    def _generate_quarterly_forecast(
        self,
        zodiac_sign: str,
        year: int,
        quarter: int,
        wisdom: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate quarterly forecast"""
        quarter_names = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)']
        quarter_themes = ['Foundation', 'Growth', 'Harvest', 'Reflection']

        return {
            'quarter': quarter,
            'name': quarter_names[quarter - 1],
            'theme': quarter_themes[quarter - 1],
            'summary': f"A period of {quarter_themes[quarter - 1].lower()} for {zodiac_sign}.",
            'focus_areas': wisdom['strengths'][:2],
            'growth_opportunity': wisdom['growth_areas'][quarter % len(wisdom['growth_areas'])],
            'energy': 'Positive'
        }

    def _generate_yearly_love_detailed(
        self,
        zodiac_sign: str,
        moon_sign: str,
        year: int
    ) -> Dict[str, Any]:
        """Generate detailed yearly love forecast"""
        return {
            'rating': 4,
            'summary': f"Love and relationships show positive growth for {zodiac_sign} in {year}.",
            'single': {
                'outlook': "Significant connections possible",
                'best_periods': ["February-March", "May-June", "October-November"]
            },
            'coupled': {
                'outlook': "Deepening commitment and understanding",
                'growth_areas': ["Communication", "Quality time", "Shared goals"]
            },
            'key_months': ['February', 'May', 'October']
        }

    def _generate_yearly_career_detailed(
        self,
        zodiac_sign: str,
        year: int,
        dasha: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate detailed yearly career forecast"""
        return {
            'rating': 4,
            'summary': f"Professional advancement indicated for {zodiac_sign} in {year}.",
            'opportunities': [
                "Leadership recognition",
                "Skill development rewards",
                "Networking expansion"
            ],
            'challenges': ["Work-life balance", "Patience with processes"],
            'best_periods': ['March', 'July', 'November'],
            'growth_direction': "Strategic advancement"
        }

    def _generate_yearly_health_detailed(
        self,
        zodiac_sign: str,
        nakshatra: str,
        year: int
    ) -> Dict[str, Any]:
        """Generate detailed yearly health forecast"""
        wisdom = self.ZODIAC_WISDOM.get(zodiac_sign, self.ZODIAC_WISDOM['Aries'])

        return {
            'rating': 4,
            'summary': f"Overall vitality supports {zodiac_sign}'s goals in {year}.",
            'focus_areas': [
                f"{wisdom['element']} element balance",
                "Consistent routine",
                "Stress management"
            ],
            'practices': ["Regular exercise", "Meditation", "Balanced diet"],
            'caution_periods': ['Change of seasons'],
            'strength_periods': ['Spring', 'Autumn']
        }

    def _generate_yearly_finance_detailed(self, zodiac_sign: str, year: int) -> Dict[str, Any]:
        """Generate detailed yearly finance forecast"""
        return {
            'rating': 4,
            'summary': f"Financial growth opportunities for {zodiac_sign} in {year}.",
            'opportunities': [
                "Investment growth",
                "Career income increase",
                "Side venture potential"
            ],
            'caution': "Avoid speculative risks in volatile periods",
            'best_periods': ['April', 'August', 'December'],
            'planning_focus': "Long-term wealth building"
        }

    def _generate_yearly_spiritual_detailed(
        self,
        zodiac_sign: str,
        nakshatra: str,
        year: int,
        dasha: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate detailed yearly spiritual forecast"""
        wisdom = self.ZODIAC_WISDOM.get(zodiac_sign, self.ZODIAC_WISDOM['Aries'])

        return {
            'rating': 5,
            'summary': f"Deep spiritual growth available for {zodiac_sign} in {year}.",
            'practices': [
                f"Daily {wisdom['mantra']} chanting",
                "Morning meditation",
                "Monthly fasting"
            ],
            'insights': [
                "Inner wisdom develops",
                "Spiritual connections strengthen",
                "Karmic patterns clear"
            ],
            'key_periods': ['Navratri', 'Guru Purnima', 'Diwali'],
            'pilgrimage': "Consider visiting a sacred site"
        }

    def _identify_key_months_detailed(self, zodiac_sign: str, year: int) -> List[Dict[str, Any]]:
        """Identify key months for the year"""
        return [
            {'month': 'January', 'theme': 'New Beginnings', 'energy': 'Fresh'},
            {'month': 'March', 'theme': 'Spring Growth', 'energy': 'Rising'},
            {'month': 'June', 'theme': 'Peak Energy', 'energy': 'High'},
            {'month': 'September', 'theme': 'Harvest', 'energy': 'Fulfillment'},
            {'month': 'December', 'theme': 'Completion', 'energy': 'Reflective'}
        ]

    def _get_annual_ritual(self, zodiac_sign: str, year: int) -> Dict[str, Any]:
        """Get annual ritual recommendation"""
        wisdom = self.ZODIAC_WISDOM.get(zodiac_sign, self.ZODIAC_WISDOM['Aries'])

        return {
            'name': f'Annual {wisdom["ruler"]} Puja',
            'best_time': f'On your {wisdom["lucky_day"]} closest to birthday',
            'mantra': wisdom['mantra'],
            'ritual': 'Full puja with offerings to ruling planet',
            'benefit': f'Strengthens {wisdom["element"]} element and attracts blessings'
        }

    def _get_bhrigu_yearly_guidance(
        self,
        zodiac_sign: str,
        year: int,
        dasha: Dict[str, Any]
    ) -> str:
        """Get Bhrigu Samhita yearly guidance"""
        wisdom = self.ZODIAC_WISDOM.get(zodiac_sign, self.ZODIAC_WISDOM['Aries'])
        maha_dasha = dasha.get('maha_dasha', wisdom['ruler'])

        return f"According to Bhrigu Samhita, {year} is a pivotal year for {zodiac_sign}. "\
               f"Under the influence of {maha_dasha} Dasha, your {wisdom['bhrigu_nature'].lower()} "\
               f"will guide you toward significant achievements. "\
               f"Honor your ruling planet {wisdom['ruler']} through regular worship and "\
               f"the mantra '{wisdom['mantra']}'. "\
               f"Focus on developing {wisdom['strengths'][0].lower()} while consciously "\
               f"working on {wisdom['growth_areas'][0].lower()}."


# Singleton instance
_horoscope_engine = None


def get_horoscope_engine(openai_service=None) -> HoroscopeEngine:
    """Get or create Horoscope Engine singleton"""
    global _horoscope_engine
    if _horoscope_engine is None:
        _horoscope_engine = HoroscopeEngine(openai_service)
    return _horoscope_engine

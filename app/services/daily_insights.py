"""
Daily insights service for transit-based predictions.
Provides daily guidance based on current planetary transits.
"""
from datetime import date, datetime, timedelta
from typing import List, Dict, Any
from app.domain.models import (
    BirthInfo, DailyInsightsOutput, DailyInsight,
    TransitTrigger, RuleTrace, Planet, Chart
)
from app.services.chart import ChartService
from app.services.ephemeris import EphemerisService


class DailyInsightsService:
    """Service for daily astrological insights based on transits."""

    def __init__(self):
        """Initialize daily insights service."""
        self.chart_service = ChartService()
        self.ephemeris = EphemerisService()

    def generate_daily_insights(
        self,
        birth_info: BirthInfo,
        target_date: date = None
    ) -> DailyInsightsOutput:
        """
        Generate daily insights based on transits.

        Args:
            birth_info: Birth information
            target_date: Date for insights (default: today)

        Returns:
            Complete DailyInsightsOutput
        """
        if target_date is None:
            target_date = date.today()

        # Calculate natal chart
        natal_chart = self.chart_service.calculate_chart(birth_info)

        # Generate today's insight
        today_insight = self._generate_insight_for_date(target_date, natal_chart)

        # Generate next 7 days
        next_7_days = []
        for i in range(1, 8):
            future_date = target_date + timedelta(days=i)
            insight = self._generate_insight_for_date(future_date, natal_chart)
            next_7_days.append(insight)

        # Key transit triggers (significant transits)
        key_triggers = self._get_key_transit_triggers(target_date, natal_chart)

        # Meta
        meta = {
            "engine_version": "1.0.0",
            "target_date": target_date.isoformat(),
            "calculation_notes": [
                "Transit positions calculated for 12:00 UTC on target date",
                "Insights based on Nadi Jyotisha transit principles",
                "Focus on practical guidance for daily navigation"
            ]
        }

        # Disclaimers
        disclaimers = [
            "Daily insights are general guidance based on transits to your natal chart.",
            "Personal free will and conscious choice influence outcomes significantly.",
            "Use insights for awareness and planning, not rigid prediction.",
            "Major life decisions should consider comprehensive astrological consultation."
        ]

        return DailyInsightsOutput(
            meta=meta,
            today=today_insight,
            next_7_days=next_7_days,
            key_transit_triggers=key_triggers,
            rule_traces=[],  # Could add transit-specific rules
            disclaimers=disclaimers
        )

    def _generate_insight_for_date(self, target_date: date, natal_chart: Chart) -> DailyInsight:
        """Generate insight for a specific date."""
        # Calculate transit chart for target date
        transit_datetime = datetime(target_date.year, target_date.month, target_date.day, 12, 0, 0)
        jd = self.ephemeris.datetime_to_julian_day(transit_datetime, 'UTC')

        # Get transiting Moon
        transit_moon_lon, _ = self.ephemeris.get_planet_longitude(Planet.MOON, jd, sidereal=True)
        transit_moon_nak, transit_moon_pada, _ = self.ephemeris.longitude_to_nakshatra(transit_moon_lon)

        # Get natal Moon
        natal_moon = self.chart_service.get_planet_position(natal_chart, Planet.MOON)

        # Determine focus areas based on transiting Moon
        focus_areas = self._determine_focus_areas(transit_moon_nak.value, natal_moon.nakshatra.value)

        # Generate do/don't lists
        do_list = self._generate_do_list(transit_moon_nak.value)
        dont_list = self._generate_dont_list(transit_moon_nak.value)

        # Transit triggers
        transit_triggers = self._analyze_daily_transits(target_date, natal_chart, jd)

        # Energy level based on Moon phase and nakshatra
        energy_level = self._assess_energy_level(transit_moon_nak.value, transit_moon_pada)

        return DailyInsight(
            date=target_date,
            focus_areas=focus_areas,
            do_list=do_list,
            dont_list=dont_list,
            transit_triggers=transit_triggers,
            energy_level=energy_level
        )

    def _determine_focus_areas(self, transit_nak: str, natal_nak: str) -> List[str]:
        """Determine focus areas based on Moon nakshatras."""
        # Nakshatra-based focus
        nakshatra_focus = {
            "Ashwini": ["Health and healing", "New beginnings"],
            "Bharani": ["Transformation", "Creative projects"],
            "Krittika": ["Purification", "Critical thinking"],
            "Rohini": ["Material matters", "Beauty and comfort"],
            "Mrigashira": ["Learning", "Seeking new knowledge"],
            "Ardra": ["Research", "Emotional processing"],
            "Punarvasu": ["Renewal", "Returning to fundamentals"],
            "Pushya": ["Nourishment", "Spiritual practices"],
            "Ashlesha": ["Mystical studies", "Deep contemplation"],
            "Magha": ["Ancestral matters", "Authority and responsibility"],
            "Purva Phalguni": ["Creativity", "Relationships"],
            "Uttara Phalguni": ["Partnerships", "Generous actions"],
            "Hasta": ["Skills development", "Detailed work"],
            "Chitra": ["Artistic expression", "Brilliance"],
            "Swati": ["Independence", "Flexibility"],
            "Vishakha": ["Goal pursuit", "Determination"],
            "Anuradha": ["Devotion", "Friendship"],
            "Jyeshtha": ["Leadership", "Protection"],
            "Mula": ["Root investigation", "Foundation work"],
            "Purva Ashadha": ["Invincibility", "Purification"],
            "Uttara Ashadha": ["Victory", "Ethical action"],
            "Shravana": ["Listening", "Learning"],
            "Dhanishtha": ["Wealth creation", "Music and rhythm"],
            "Shatabhisha": ["Healing", "Alternative approaches"],
            "Purva Bhadrapada": ["Spiritual intensity", "Sacrifice"],
            "Uttara Bhadrapada": ["Deep wisdom", "Kundalini practices"],
            "Revati": ["Compassion", "Completion of cycles"]
        }

        return nakshatra_focus.get(transit_nak, ["General awareness", "Mindful action"])

    def _generate_do_list(self, transit_nak: str) -> List[str]:
        """Generate favorable activities based on transiting Moon nakshatra."""
        nakshatra_dos = {
            "Ashwini": ["Start new health routines", "Take initiative on pending projects"],
            "Rohini": ["Focus on financial planning", "Enjoy beauty and arts"],
            "Pushya": ["Spiritual practices", "Nurture relationships"],
            "Magha": ["Honor ancestors", "Take leadership roles"],
            "Hasta": ["Work with hands", "Pay attention to details"],
            "Swati": ["Network and trade", "Be flexible in approach"],
            "Anuradha": ["Cultivate devotion", "Strengthen friendships"],
            "Shravana": ["Listen more than speak", "Study and learn"],
            "Uttara Bhadrapada": ["Meditate deeply", "Seek profound wisdom"]
        }

        return nakshatra_dos.get(transit_nak, ["Maintain regular routines", "Act with awareness"])

    def _generate_dont_list(self, transit_nak: str) -> List[str]:
        """Generate unfavorable activities based on transiting Moon nakshatra."""
        nakshatra_donts = {
            "Ashwini": ["Delay health matters", "Procrastinate on important tasks"],
            "Ardra": ["Avoid emotional decisions", "Skip rest and recovery"],
            "Ashlesha": ["Distrust intuition", "Ignore subtle signs"],
            "Magha": ["Disrespect traditions", "Ignore responsibilities"],
            "Mula": ["Make superficial choices", "Avoid root causes"],
            "Uttara Ashadha": ["Compromise ethics", "Rush to conclusions"]
        }

        return nakshatra_donts.get(transit_nak, ["Avoid impulsive actions", "Don't ignore intuition"])

    def _analyze_daily_transits(
        self,
        target_date: date,
        natal_chart: Chart,
        jd: float
    ) -> List[TransitTrigger]:
        """Analyze specific transits for the day."""
        triggers: List[TransitTrigger] = []

        # Check transiting planets to natal Moon
        natal_moon = self.chart_service.get_planet_position(natal_chart, Planet.MOON)

        # Jupiter transit (expansion)
        transit_jupiter_lon, _ = self.ephemeris.get_planet_longitude(Planet.JUPITER, jd, sidereal=True)
        jupiter_orb = abs(transit_jupiter_lon - natal_moon.longitude)
        if jupiter_orb > 180:
            jupiter_orb = 360 - jupiter_orb

        if jupiter_orb < 5:  # Close conjunction
            triggers.append(TransitTrigger(
                transit_planet=Planet.JUPITER,
                natal_point="natal Moon",
                aspect_type="conjunction",
                orb_degrees=jupiter_orb,
                narrative="Jupiter transiting near your Moon brings emotional expansion and optimism. "
                         "Good time for learning and spiritual growth."
            ))

        # Saturn transit (discipline)
        transit_saturn_lon, _ = self.ephemeris.get_planet_longitude(Planet.SATURN, jd, sidereal=True)
        saturn_orb = abs(transit_saturn_lon - natal_moon.longitude)
        if saturn_orb > 180:
            saturn_orb = 360 - saturn_orb

        if saturn_orb < 5:
            triggers.append(TransitTrigger(
                transit_planet=Planet.SATURN,
                natal_point="natal Moon",
                aspect_type="conjunction",
                orb_degrees=saturn_orb,
                narrative="Saturn transiting near your Moon brings emotional discipline and maturity. "
                         "Time for serious reflection and responsibility."
            ))

        # If no close transits, add general guidance
        if not triggers:
            triggers.append(TransitTrigger(
                transit_planet=Planet.MOON,
                natal_point="general",
                aspect_type="daily_motion",
                orb_degrees=0,
                narrative="Daily Moon transit influences general emotional tone and receptivity."
            ))

        return triggers

    def _assess_energy_level(self, transit_nak: str, pada: int) -> str:
        """Assess energy level for the day."""
        # Simplified energy assessment
        high_energy_naks = ["Ashwini", "Magha", "Mula", "Uttara Ashadha"]
        medium_energy_naks = ["Rohini", "Pushya", "Hasta", "Shravana", "Revati"]

        if transit_nak in high_energy_naks:
            return "high"
        elif transit_nak in medium_energy_naks:
            return "medium"
        else:
            return "medium"  # Default

    def _get_key_transit_triggers(self, target_date: date, natal_chart: Chart) -> List[TransitTrigger]:
        """Get significant transit triggers for the period."""
        # Return today's triggers as key triggers
        transit_datetime = datetime(target_date.year, target_date.month, target_date.day, 12, 0, 0)
        jd = self.ephemeris.datetime_to_julian_day(transit_datetime, 'UTC')

        return self._analyze_daily_transits(target_date, natal_chart, jd)

    def close(self):
        """Clean up resources."""
        self.chart_service.close()
        self.ephemeris.close()

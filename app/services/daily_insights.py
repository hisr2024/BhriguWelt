"""
Daily Insights engine for transit-based predictions.
Provides today's insights and 7-day forecast using current transits.
"""

from datetime import datetime, timedelta
from typing import List
import pytz

from app.domain.models import (
    PersonInput, DailyInsightsOutput, DailyInsight,
    ChartData, TransitSnapshot, PlanetPosition, RuleTrace,
    Planet, ZodiacSign, Nakshatra
)
from app.services.chart import ChartService
from app.services.ephemeris import EphemerisService
from app.rules.engine import RulesEngine
from app.config import ENGINE_VERSION, STANDARD_DISCLAIMERS


class DailyInsightsService:
    """
    Service for generating daily insights based on transits.
    """

    def __init__(self):
        self.chart_service = ChartService()
        self.ephe = EphemerisService()
        self.rules_engine = RulesEngine()

    def generate_daily_insights(self, person: PersonInput) -> DailyInsightsOutput:
        """
        Generate daily insights for a person.

        Args:
            person: PersonInput with birth details

        Returns:
            DailyInsightsOutput with today and 7-day forecast
        """
        # Calculate natal chart
        natal_chart = self.chart_service.calculate_chart(person)

        # Get today's date in person's timezone
        tz = pytz.timezone(person.place_of_birth.tz)
        today = datetime.now(tz).date()

        # Generate today's insight
        today_insight = self._generate_day_insight(today, natal_chart, person.place_of_birth.tz)

        # Generate next 7 days
        next_7_days = []
        for i in range(1, 8):
            future_date = today + timedelta(days=i)
            day_insight = self._generate_day_insight(future_date, natal_chart, person.place_of_birth.tz)
            next_7_days.append(day_insight)

        # Generate summary
        summary = self._generate_summary(natal_chart, today_insight)

        # Collect all rule traces
        all_traces = today_insight.key_triggers  # These contain basic transit info

        # Create metadata
        meta = {
            "engine_version": ENGINE_VERSION,
            "calculation_notes": f"Transit analysis for {today.isoformat()} in timezone {person.place_of_birth.tz}",
            "assumptions": "Daily insights based on current planetary transits relative to natal positions",
            "timestamp_utc": datetime.utcnow().isoformat()
        }

        output = DailyInsightsOutput(
            meta=meta,
            summary=summary,
            today=today_insight,
            next_7_days=next_7_days,
            rule_traces=[],  # Transit rules would go here
            disclaimers=STANDARD_DISCLAIMERS
        )

        return output

    def _generate_day_insight(self, date, natal_chart: ChartData, timezone_str: str) -> DailyInsight:
        """
        Generate insight for a specific day.

        Args:
            date: Date object
            natal_chart: Person's natal chart
            timezone_str: IANA timezone string

        Returns:
            DailyInsight for the day
        """
        # Calculate transit positions for this date at noon
        tz = pytz.timezone(timezone_str)
        dt = tz.localize(datetime.combine(date, datetime.min.time().replace(hour=12)))
        utc_dt = dt.astimezone(pytz.UTC)
        jd = self.ephe.datetime_to_jd(utc_dt)

        # Get transit positions
        transit_snapshot = self._calculate_transit_snapshot(jd, date.isoformat())

        # Analyze transits against natal chart
        overview = self._analyze_day_overview(transit_snapshot, natal_chart, date)
        do_list = self._generate_do_list(transit_snapshot, natal_chart)
        dont_list = self._generate_dont_list(transit_snapshot, natal_chart)
        focus_areas = self._generate_focus_areas(transit_snapshot, natal_chart)
        key_triggers = self._identify_key_triggers(transit_snapshot, natal_chart)

        insight = DailyInsight(
            date=date.isoformat(),
            overview=overview,
            do_list=do_list,
            dont_list=dont_list,
            focus_areas=focus_areas,
            key_triggers=key_triggers
        )

        return insight

    def _calculate_transit_snapshot(self, jd: float, date_str: str) -> TransitSnapshot:
        """Calculate current transit positions."""
        planet_positions = []
        planet_data = self.ephe.get_all_planet_positions(jd)

        for planet_name, pos_data in planet_data.items():
            longitude = pos_data["longitude"]
            sign_name, sign_long = self.ephe.longitude_to_sign(longitude)
            nakshatra_name, pada, nak_lord, long_in_nak = self.ephe.longitude_to_nakshatra(longitude)

            planet_pos = PlanetPosition(
                planet=Planet[planet_name.upper()],
                longitude=longitude,
                sign=ZodiacSign[sign_name.upper()],
                sign_longitude=sign_long,
                house=1,  # House position not relevant for pure transits
                nakshatra=Nakshatra[nakshatra_name.upper().replace(" ", "_")],
                nakshatra_pada=pada,
                is_retrograde=pos_data["is_retrograde"]
            )
            planet_positions.append(planet_pos)

        return TransitSnapshot(
            date=date_str,
            planets=planet_positions
        )

    def _analyze_day_overview(self, transit: TransitSnapshot, natal: ChartData, date) -> str:
        """Generate overview for the day."""
        # Find significant transits
        weekday = date.strftime("%A")

        # Check Moon transit
        transit_moon = next((p for p in transit.planets if p.planet == Planet.MOON), None)
        if transit_moon:
            overview = (
                f"{weekday}: The Moon transits {transit_moon.sign.value}, "
                f"nakshatra {transit_moon.nakshatra.value}. "
            )
        else:
            overview = f"{weekday}: "

        # Add general guidance
        overview += "Focus on aligning daily actions with long-term dharmic goals."

        return overview

    def _generate_do_list(self, transit: TransitSnapshot, natal: ChartData) -> List[str]:
        """Generate recommended activities."""
        do_list = []

        # Based on transiting Moon
        transit_moon = next((p for p in transit.planets if p.planet == Planet.MOON), None)
        if transit_moon:
            # Moon in cardinal signs: initiate
            if transit_moon.sign.value in ["Aries", "Cancer", "Libra", "Capricorn"]:
                do_list.append("Initiate new projects or activities")

            # Moon in earth signs: practical work
            if transit_moon.sign.value in ["Taurus", "Virgo", "Capricorn"]:
                do_list.append("Focus on practical, tangible tasks")

            # Moon in water signs: emotional work
            if transit_moon.sign.value in ["Cancer", "Scorpio", "Pisces"]:
                do_list.append("Nurture relationships and emotional well-being")

        do_list.append("Maintain regular spiritual practice")
        do_list.append("Honor commitments and responsibilities")

        return do_list[:3]  # Top 3

    def _generate_dont_list(self, transit: TransitSnapshot, natal: ChartData) -> List[str]:
        """Generate activities to avoid."""
        dont_list = []

        # Check for challenging transits
        transit_saturn = next((p for p in transit.planets if p.planet == Planet.SATURN), None)
        transit_mars = next((p for p in transit.planets if p.planet == Planet.MARS), None)

        # If Mars is in a challenging position
        if transit_mars and transit_mars.is_retrograde:
            dont_list.append("Avoid impulsive actions or confrontations")

        # General wisdom
        dont_list.append("Avoid major financial decisions without due diligence")
        dont_list.append("Don't neglect health and rest")

        return dont_list[:3]  # Top 3

    def _generate_focus_areas(self, transit: TransitSnapshot, natal: ChartData) -> List[str]:
        """Generate focus areas for the day."""
        focus = []

        # Based on current mahadasha
        if natal.dasha_timeline.current_mahadasha:
            maha_planet = natal.dasha_timeline.current_mahadasha.planet.value
            focus.append(f"Continue working with {maha_planet} Mahadasha themes")

        # Transit-based focus
        transit_jupiter = next((p for p in transit.planets if p.planet == Planet.JUPITER), None)
        if transit_jupiter:
            focus.append(f"Jupiter in {transit_jupiter.sign.value}: Expansion and wisdom")

        focus.append("Maintain balance between material and spiritual pursuits")

        return focus[:3]

    def _identify_key_triggers(self, transit: TransitSnapshot, natal: ChartData) -> List[str]:
        """Identify key transit triggers."""
        triggers = []

        # Check if any transit planet is hitting natal Moon
        natal_moon = next(p for p in natal.planets if p.planet == Planet.MOON)

        for transit_planet in transit.planets:
            if transit_planet.planet in [Planet.JUPITER, Planet.SATURN]:
                diff = abs(transit_planet.longitude - natal_moon.longitude)
                if diff > 180:
                    diff = 360 - diff

                if diff < 5:  # Within 5 degrees
                    triggers.append(
                        f"{transit_planet.planet.value} transiting near natal Moon "
                        f"({transit_planet.sign.value})"
                    )

        # Check natal Sun
        natal_sun = next(p for p in natal.planets if p.planet == Planet.SUN)
        transit_saturn = next((p for p in transit.planets if p.planet == Planet.SATURN), None)

        if transit_saturn:
            diff = abs(transit_saturn.longitude - natal_sun.longitude)
            if diff > 180:
                diff = 360 - diff

            if diff < 5:
                triggers.append(
                    f"Saturn transiting near natal Sun: Lessons in authority and discipline"
                )

        if not triggers:
            triggers.append("No major exact transits today; focus on steady progress")

        return triggers

    def _generate_summary(self, natal_chart: ChartData, today_insight: DailyInsight) -> List[str]:
        """Generate summary for daily insights."""
        summary = []

        summary.append(f"Daily insights for {natal_chart.person.name}")

        if natal_chart.dasha_timeline.current_mahadasha:
            maha = natal_chart.dasha_timeline.current_mahadasha
            summary.append(
                f"Currently in {maha.planet.value} Mahadasha period"
            )

        summary.append(
            f"Today: {today_insight.overview[:100]}..."
        )

        return summary

    def close(self):
        """Clean up resources."""
        self.chart_service.close()
        self.ephe.close()

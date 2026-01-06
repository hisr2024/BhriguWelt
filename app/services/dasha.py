"""
Dasha calculation service for Vimshottari Dasha system.
Calculates dasha periods based on Moon's nakshatra at birth.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from dateutil.relativedelta import relativedelta

from app.domain.models import DashaPeriod, DashaTimeline, Planet
from app.config import VIMSHOTTARI_PERIODS, VIMSHOTTARI_TOTAL_YEARS, NAKSHATRA_DEGREES, NAKSHATRAS, NAKSHATRA_LORDS


class DashaService:
    """
    Service for calculating Vimshottari Dasha periods.
    The Vimshottari system is a 120-year cycle based on Moon's nakshatra.
    """

    # Dasha sequence (starting from Ketu)
    DASHA_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]

    def __init__(self):
        pass

    def calculate_vimshottari_dasha(self, birth_date_str: str, moon_longitude: float) -> DashaTimeline:
        """
        Calculate Vimshottari Dasha timeline from birth.

        Args:
            birth_date_str: Birth date in YYYY-MM-DD format
            moon_longitude: Moon's longitude in degrees (0-360)

        Returns:
            DashaTimeline with all mahadasha periods
        """
        # Determine Moon's nakshatra
        nakshatra_index = int(moon_longitude / NAKSHATRA_DEGREES) % 27
        nakshatra_name = NAKSHATRAS[nakshatra_index]
        nakshatra_lord = NAKSHATRA_LORDS[nakshatra_index]

        # Position within nakshatra (0 to 13.333333)
        position_in_nakshatra = moon_longitude % NAKSHATRA_DEGREES

        # Fraction of nakshatra elapsed
        fraction_elapsed = position_in_nakshatra / NAKSHATRA_DEGREES

        # Birth balance of starting dasha
        # If Moon is at the start of nakshatra, full period remains
        # If at the end, very little remains
        start_planet = nakshatra_lord
        total_years = VIMSHOTTARI_PERIODS[start_planet]
        birth_balance_years = total_years * (1 - fraction_elapsed)

        # Convert birth date to datetime
        birth_date = datetime.strptime(birth_date_str, "%Y-%m-%d")

        # Calculate mahadasha periods
        mahadashas = []
        current_date = birth_date

        # Find the index of starting planet in sequence
        start_index = self.DASHA_SEQUENCE.index(start_planet)

        # First dasha (partial)
        first_dasha = self._create_dasha_period(
            Planet[start_planet.upper()],
            current_date,
            birth_balance_years,
            "mahadasha"
        )
        mahadashas.append(first_dasha)
        current_date = datetime.strptime(first_dasha.end_date, "%Y-%m-%d")

        # Remaining dashas (full periods)
        for i in range(1, 9):  # 8 more dashas to complete the cycle
            planet_index = (start_index + i) % 9
            planet_name = self.DASHA_SEQUENCE[planet_index]
            period_years = VIMSHOTTARI_PERIODS[planet_name]

            dasha_period = self._create_dasha_period(
                Planet[planet_name.upper()],
                current_date,
                period_years,
                "mahadasha"
            )
            mahadashas.append(dasha_period)
            current_date = datetime.strptime(dasha_period.end_date, "%Y-%m-%d")

        # Determine current mahadasha and antardasha
        today = datetime.now().date()
        current_maha = None
        current_antar = None

        for maha in mahadashas:
            maha_start = datetime.strptime(maha.start_date, "%Y-%m-%d").date()
            maha_end = datetime.strptime(maha.end_date, "%Y-%m-%d").date()

            if maha_start <= today < maha_end:
                current_maha = maha
                # Calculate antardasha within this mahadasha
                current_antar = self._find_current_antardasha(maha, today)
                break

        dasha_timeline = DashaTimeline(
            system="Vimshottari",
            start_planet=Planet[start_planet.upper()],
            birth_balance_years=round(birth_balance_years, 4),
            mahadashas=mahadashas,
            current_mahadasha=current_maha,
            current_antardasha=current_antar
        )

        return dasha_timeline

    def _create_dasha_period(
        self,
        planet: Planet,
        start_date: datetime,
        duration_years: float,
        level: str
    ) -> DashaPeriod:
        """
        Create a DashaPeriod object.

        Args:
            planet: Planet for this dasha
            start_date: Start date
            duration_years: Duration in years
            level: "mahadasha", "antardasha", or "pratyantardasha"

        Returns:
            DashaPeriod object
        """
        # Calculate end date
        days = int(duration_years * 365.25)
        end_date = start_date + timedelta(days=days)

        return DashaPeriod(
            planet=planet,
            level=level,
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d"),
            duration_years=round(duration_years, 4)
        )

    def _find_current_antardasha(self, mahadasha: DashaPeriod, target_date) -> Optional[DashaPeriod]:
        """
        Find the current antardasha within a mahadasha.

        Args:
            mahadasha: The mahadasha period
            target_date: Date to find antardasha for

        Returns:
            Current antardasha period or None
        """
        # Calculate all antardashas for this mahadasha
        maha_planet_name = mahadasha.planet.value
        maha_start = datetime.strptime(mahadasha.start_date, "%Y-%m-%d")
        maha_years = mahadasha.duration_years

        # Find starting position in dasha sequence
        start_index = self.DASHA_SEQUENCE.index(maha_planet_name)

        current_date = maha_start

        # Generate all 9 antardashas
        for i in range(9):
            antar_index = (start_index + i) % 9
            antar_planet_name = self.DASHA_SEQUENCE[antar_index]
            antar_planet = Planet[antar_planet_name.upper()]

            # Antardasha duration is proportional to planet's full period
            antar_full_years = VIMSHOTTARI_PERIODS[antar_planet_name]
            antar_duration = (antar_full_years / VIMSHOTTARI_TOTAL_YEARS) * maha_years

            antar_period = self._create_dasha_period(
                antar_planet,
                current_date,
                antar_duration,
                "antardasha"
            )

            # Check if target date falls in this antardasha
            antar_start = datetime.strptime(antar_period.start_date, "%Y-%m-%d").date()
            antar_end = datetime.strptime(antar_period.end_date, "%Y-%m-%d").date()

            if antar_start <= target_date < antar_end:
                return antar_period

            current_date = datetime.strptime(antar_period.end_date, "%Y-%m-%d")

        return None

    def calculate_antardashas(self, mahadasha: DashaPeriod) -> List[DashaPeriod]:
        """
        Calculate all antardasha periods within a mahadasha.

        Args:
            mahadasha: The mahadasha period

        Returns:
            List of antardasha periods
        """
        maha_planet_name = mahadasha.planet.value
        maha_start = datetime.strptime(mahadasha.start_date, "%Y-%m-%d")
        maha_years = mahadasha.duration_years

        # Find starting position in dasha sequence
        start_index = self.DASHA_SEQUENCE.index(maha_planet_name)

        current_date = maha_start
        antardashas = []

        # Generate all 9 antardashas
        for i in range(9):
            antar_index = (start_index + i) % 9
            antar_planet_name = self.DASHA_SEQUENCE[antar_index]
            antar_planet = Planet[antar_planet_name.upper()]

            # Antardasha duration is proportional to planet's full period
            antar_full_years = VIMSHOTTARI_PERIODS[antar_planet_name]
            antar_duration = (antar_full_years / VIMSHOTTARI_TOTAL_YEARS) * maha_years

            antar_period = self._create_dasha_period(
                antar_planet,
                current_date,
                antar_duration,
                "antardasha"
            )

            antardashas.append(antar_period)
            current_date = datetime.strptime(antar_period.end_date, "%Y-%m-%d")

        return antardashas

    def get_dasha_periods_in_range(
        self,
        dasha_timeline: DashaTimeline,
        start_date_str: str,
        end_date_str: str
    ) -> List[DashaPeriod]:
        """
        Get all dasha periods that overlap with a date range.

        Args:
            dasha_timeline: Complete dasha timeline
            start_date_str: Range start date (YYYY-MM-DD)
            end_date_str: Range end date (YYYY-MM-DD)

        Returns:
            List of dasha periods overlapping the range
        """
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()

        overlapping = []

        for maha in dasha_timeline.mahadashas:
            maha_start = datetime.strptime(maha.start_date, "%Y-%m-%d").date()
            maha_end = datetime.strptime(maha.end_date, "%Y-%m-%d").date()

            # Check if maha overlaps with range
            if maha_start <= end_date and maha_end >= start_date:
                overlapping.append(maha)

        return overlapping

"""
Chart calculation service.
Builds complete birth charts using ephemeris service.
"""
from datetime import datetime, timedelta, date
from typing import List, Dict, Optional
from app.domain.models import (
    BirthInfo, Chart, PlanetPosition, HouseCusp,
    Planet, Sign, DashaPeriod, DashaTimeline
)
from app.services.ephemeris import EphemerisService


class ChartService:
    """Service for calculating birth charts."""

    def __init__(self):
        """Initialize with ephemeris service."""
        self.ephemeris = EphemerisService()

    def calculate_chart(self, birth_info: BirthInfo) -> Chart:
        """
        Calculate complete birth chart.

        Args:
            birth_info: Birth information

        Returns:
            Complete Chart object
        """
        # Combine date and time
        time_parts = birth_info.time_of_birth.split(':')
        birth_datetime = datetime(
            birth_info.date_of_birth.year,
            birth_info.date_of_birth.month,
            birth_info.date_of_birth.day,
            int(time_parts[0]),
            int(time_parts[1]),
            int(time_parts[2])
        )

        # Convert to Julian Day
        jd = self.ephemeris.datetime_to_julian_day(birth_datetime, birth_info.timezone)

        # Calculate ascendant
        asc_longitude = self.ephemeris.get_ascendant(
            jd, birth_info.latitude, birth_info.longitude, sidereal=True
        )
        asc_sign, _ = self.ephemeris.longitude_to_sign(asc_longitude)

        # Calculate house cusps
        house_cusp_longitudes = self.ephemeris.get_house_cusps(
            jd, birth_info.latitude, birth_info.longitude, sidereal=True
        )

        # Build house cusps
        house_cusps = []
        for i, cusp_lon in enumerate(house_cusp_longitudes):
            sign, deg = self.ephemeris.longitude_to_sign(cusp_lon)
            house_cusps.append(HouseCusp(
                house=i + 1,
                longitude=cusp_lon,
                sign=sign,
                degree_in_sign=deg
            ))

        # Calculate planet positions
        planets = []
        for planet in [Planet.SUN, Planet.MOON, Planet.MARS, Planet.MERCURY,
                       Planet.JUPITER, Planet.VENUS, Planet.SATURN,
                       Planet.RAHU, Planet.KETU]:
            longitude, retrograde = self.ephemeris.get_planet_longitude(planet, jd, sidereal=True)
            sign, degree_in_sign = self.ephemeris.longitude_to_sign(longitude)
            nakshatra, pada, nak_lord = self.ephemeris.longitude_to_nakshatra(longitude)
            house_num = self.ephemeris.get_house_for_planet(longitude, house_cusp_longitudes)

            planets.append(PlanetPosition(
                planet=planet,
                longitude=longitude,
                sign=sign,
                degree_in_sign=degree_in_sign,
                nakshatra=nakshatra,
                nakshatra_pada=pada,
                house=house_num,
                retrograde=retrograde
            ))

        return Chart(
            birth_info=birth_info,
            ascendant=asc_sign,
            ascendant_longitude=asc_longitude,
            planets=planets,
            house_cusps=house_cusps
        )

    def calculate_dasha_timeline(self, chart: Chart, num_years: int = 30) -> DashaTimeline:
        """
        Calculate Vimshottari Dasha timeline.

        Args:
            chart: Birth chart
            num_years: Number of years to calculate ahead

        Returns:
            DashaTimeline with current and upcoming dashas
        """
        # Get Moon position
        moon = next(p for p in chart.planets if p.planet == Planet.MOON)

        # Calculate dasha balance at birth
        birth_date = chart.birth_info.date_of_birth
        dasha_lord, years_remaining = self.ephemeris.calculate_vimshottari_balance(
            moon.longitude, datetime.combine(birth_date, datetime.min.time())
        )

        # Dasha sequence and durations
        dasha_sequence = [
            Planet.KETU, Planet.VENUS, Planet.SUN, Planet.MOON,
            Planet.MARS, Planet.RAHU, Planet.JUPITER, Planet.SATURN, Planet.MERCURY
        ]
        dasha_years = {
            Planet.KETU: 7,
            Planet.VENUS: 20,
            Planet.SUN: 6,
            Planet.MOON: 10,
            Planet.MARS: 7,
            Planet.RAHU: 18,
            Planet.JUPITER: 16,
            Planet.SATURN: 19,
            Planet.MERCURY: 17,
        }

        # Find starting index
        current_index = dasha_sequence.index(dasha_lord)

        # Build dasha periods
        maha_dashas: List[DashaPeriod] = []
        current_date = birth_date

        # First dasha (partial)
        first_end_date = current_date + timedelta(days=years_remaining * 365.25)
        maha_dashas.append(DashaPeriod(
            planet=dasha_lord,
            start_date=current_date,
            end_date=first_end_date,
            level="maha"
        ))
        current_date = first_end_date

        # Subsequent dashas
        index = (current_index + 1) % len(dasha_sequence)
        while (current_date - birth_date).days < num_years * 365.25:
            planet = dasha_sequence[index]
            years = dasha_years[planet]
            end_date = current_date + timedelta(days=years * 365.25)

            maha_dashas.append(DashaPeriod(
                planet=planet,
                start_date=current_date,
                end_date=end_date,
                level="maha"
            ))

            current_date = end_date
            index = (index + 1) % len(dasha_sequence)

        # Determine current dasha
        today = date.today()
        current_maha = None
        for dasha in maha_dashas:
            if dasha.start_date <= today <= dasha.end_date:
                current_maha = dasha
                break

        if current_maha is None:
            current_maha = maha_dashas[0]  # Fallback

        # Calculate current antar dasha (bhukti)
        antar_dashas = self._calculate_antar_dashas(current_maha, dasha_sequence, dasha_years)
        current_antar = None
        for antar in antar_dashas:
            if antar.start_date <= today <= antar.end_date:
                current_antar = antar
                break

        if current_antar is None:
            current_antar = antar_dashas[0]  # Fallback

        # Upcoming maha dashas (next 5)
        upcoming = []
        for dasha in maha_dashas:
            if dasha.start_date > today and len(upcoming) < 5:
                upcoming.append(dasha)

        return DashaTimeline(
            birth_date=birth_date,
            current_maha_dasha=current_maha,
            current_antar_dasha=current_antar,
            upcoming_maha_dashas=upcoming
        )

    def _calculate_antar_dashas(
        self,
        maha_dasha: DashaPeriod,
        dasha_sequence: List[Planet],
        dasha_years: Dict[Planet, int]
    ) -> List[DashaPeriod]:
        """Calculate antar dashas (bhuktis) within a maha dasha."""
        antar_dashas: List[DashaPeriod] = []

        # Start with maha dasha lord
        maha_lord = maha_dasha.planet
        maha_lord_index = dasha_sequence.index(maha_lord)

        # Total days in maha dasha
        total_days = (maha_dasha.end_date - maha_dasha.start_date).days

        current_date = maha_dasha.start_date

        # Each antar dasha is proportional
        for i in range(len(dasha_sequence)):
            antar_lord = dasha_sequence[(maha_lord_index + i) % len(dasha_sequence)]
            antar_years = dasha_years[antar_lord]
            maha_years = dasha_years[maha_lord]

            # Proportion of maha dasha
            fraction = antar_years / 120.0  # Total Vimshottari cycle is 120 years
            antar_days = maha_years * 365.25 * fraction

            end_date = current_date + timedelta(days=antar_days)

            # Don't exceed maha dasha end
            if end_date > maha_dasha.end_date:
                end_date = maha_dasha.end_date

            antar_dashas.append(DashaPeriod(
                planet=antar_lord,
                start_date=current_date,
                end_date=end_date,
                level="antar",
                parent_dasha=maha_lord
            ))

            current_date = end_date

            if current_date >= maha_dasha.end_date:
                break

        return antar_dashas

    def get_planet_in_house(self, chart: Chart, house: int) -> Optional[Planet]:
        """Get planet in a specific house (if any)."""
        for planet_pos in chart.planets:
            if planet_pos.house == house:
                return planet_pos.planet
        return None

    def get_planets_in_house(self, chart: Chart, house: int) -> List[Planet]:
        """Get all planets in a specific house."""
        return [p.planet for p in chart.planets if p.house == house]

    def get_planet_position(self, chart: Chart, planet: Planet) -> PlanetPosition:
        """Get position of a specific planet."""
        return next(p for p in chart.planets if p.planet == planet)

    def get_house_lord(self, chart: Chart, house: int) -> Planet:
        """Get the lord (ruler) of a house."""
        house_cusp = chart.house_cusps[house - 1]
        return self.ephemeris.get_sign_lord(house_cusp.sign)

    def are_planets_in_kendra(self, chart: Chart, planet1: Planet, planet2: Planet) -> bool:
        """Check if two planets are in kendra (1, 4, 7, 10) from each other."""
        pos1 = self.get_planet_position(chart, planet1)
        pos2 = self.get_planet_position(chart, planet2)

        house_diff = abs(pos1.house - pos2.house)

        return house_diff in [0, 3, 6, 9]

    def calculate_aspect(self, chart: Chart, planet: Planet, target_house: int) -> bool:
        """
        Check if a planet aspects a house.
        All planets aspect 7th house from their position.
        Mars also aspects 4th and 8th.
        Jupiter also aspects 5th and 9th.
        Saturn also aspects 3rd and 10th.
        """
        planet_pos = self.get_planet_position(chart, planet)
        planet_house = planet_pos.house

        # All planets aspect 7th house
        seventh_house = ((planet_house - 1) + 6) % 12 + 1
        if target_house == seventh_house:
            return True

        # Special aspects
        if planet == Planet.MARS:
            fourth_house = ((planet_house - 1) + 3) % 12 + 1
            eighth_house = ((planet_house - 1) + 7) % 12 + 1
            if target_house in [fourth_house, eighth_house]:
                return True

        if planet == Planet.JUPITER:
            fifth_house = ((planet_house - 1) + 4) % 12 + 1
            ninth_house = ((planet_house - 1) + 8) % 12 + 1
            if target_house in [fifth_house, ninth_house]:
                return True

        if planet == Planet.SATURN:
            third_house = ((planet_house - 1) + 2) % 12 + 1
            tenth_house = ((planet_house - 1) + 9) % 12 + 1
            if target_house in [third_house, tenth_house]:
                return True

        return False

    def is_conjunction(self, chart: Chart, planet1: Planet, planet2: Planet, orb: float = 10.0) -> bool:
        """Check if two planets are in conjunction (same house or within orb)."""
        pos1 = self.get_planet_position(chart, planet1)
        pos2 = self.get_planet_position(chart, planet2)

        # Same house is conjunction
        if pos1.house == pos2.house:
            # Check orb
            diff = abs(pos1.longitude - pos2.longitude)
            if diff > 180:
                diff = 360 - diff
            return diff <= orb

        return False

    def close(self):
        """Close ephemeris."""
        self.ephemeris.close()

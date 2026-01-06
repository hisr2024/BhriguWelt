"""
Chart calculation service for generating birth charts.
Calculates D1 (Rasi), D9 (Navamsa), and derives planetary relationships.
"""

from typing import Dict, List, Any
from datetime import datetime

from app.domain.models import (
    PersonInput, ChartData, PlanetPosition, HouseCusps,
    NakshatraInfo, Planet, ZodiacSign, Nakshatra
)
from app.services.ephemeris import EphemerisService
from app.config import ENGINE_VERSION, SIGN_LORDS


class ChartService:
    """
    Service for calculating birth charts with D1 and D9 analysis.
    """

    def __init__(self):
        self.ephe = EphemerisService()

    def calculate_chart(self, person: PersonInput) -> ChartData:
        """
        Calculate complete birth chart for a person.

        Args:
            person: PersonInput with birth details

        Returns:
            ChartData with all calculated positions
        """
        # Convert local time to UTC
        utc_dt = self.ephe.local_to_utc(
            person.date_of_birth,
            person.time_of_birth,
            person.place_of_birth.tz
        )

        # Calculate Julian Day
        jd = self.ephe.datetime_to_jd(utc_dt)

        # Get ayanamsa
        ayanamsa = self.ephe.get_ayanamsa(jd)

        # Calculate house cusps and angles
        house_cusps_list, ascendant_degree, mc_degree = self.ephe.get_house_cusps(
            jd,
            person.place_of_birth.lat,
            person.place_of_birth.lon
        )

        # Create HouseCusps object
        house_cusps = HouseCusps(
            cusps=house_cusps_list,
            ascendant=ascendant_degree,
            midheaven=mc_degree
        )

        # Calculate planetary positions
        planet_positions = []
        planet_data = self.ephe.get_all_planet_positions(jd)

        for planet_name, pos_data in planet_data.items():
            longitude = pos_data["longitude"]
            sign_name, sign_long = self.ephe.longitude_to_sign(longitude)
            nakshatra_name, pada, nak_lord, long_in_nak = self.ephe.longitude_to_nakshatra(longitude)
            house_num = self.ephe.get_house_number(longitude, house_cusps_list)

            planet_pos = PlanetPosition(
                planet=Planet[planet_name.upper()],
                longitude=longitude,
                sign=ZodiacSign[sign_name.upper()],
                sign_longitude=sign_long,
                house=house_num,
                nakshatra=Nakshatra[nakshatra_name.upper().replace(" ", "_")],
                nakshatra_pada=pada,
                is_retrograde=pos_data["is_retrograde"]
            )
            planet_positions.append(planet_pos)

        # Create ascendant position
        asc_sign_name, asc_sign_long = self.ephe.longitude_to_sign(ascendant_degree)
        asc_nak_name, asc_pada, asc_nak_lord, asc_long_in_nak = self.ephe.longitude_to_nakshatra(ascendant_degree)

        ascendant_position = PlanetPosition(
            planet=Planet.SUN,  # Placeholder; ascendant is not a planet
            longitude=ascendant_degree,
            sign=ZodiacSign[asc_sign_name.upper()],
            sign_longitude=asc_sign_long,
            house=1,
            nakshatra=Nakshatra[asc_nak_name.upper().replace(" ", "_")],
            nakshatra_pada=asc_pada,
            is_retrograde=False
        )

        # Nakshatra info for Moon and Ascendant
        moon_pos = next(p for p in planet_positions if p.planet == Planet.MOON)
        moon_nakshatra_info = NakshatraInfo(
            nakshatra=moon_pos.nakshatra,
            pada=moon_pos.nakshatra_pada,
            lord=Planet[self.ephe.longitude_to_nakshatra(moon_pos.longitude)[2].upper()],
            longitude_in_nakshatra=self.ephe.longitude_to_nakshatra(moon_pos.longitude)[3]
        )

        ascendant_nakshatra_info = NakshatraInfo(
            nakshatra=ascendant_position.nakshatra,
            pada=ascendant_position.nakshatra_pada,
            lord=Planet[asc_nak_lord.upper()],
            longitude_in_nakshatra=asc_long_in_nak
        )

        # Calculate house lordships
        house_lords = self._calculate_house_lords(house_cusps_list)

        # Calculate D9 (Navamsa) summary
        d9_summary = self._calculate_d9_summary(planet_positions)

        # Create D1 summary
        d1_summary = {
            "ascendant_sign": asc_sign_name,
            "ascendant_degree": ascendant_degree,
            "moon_sign": moon_pos.sign.value,
            "sun_sign": next(p for p in planet_positions if p.planet == Planet.SUN).sign.value,
        }

        # Import dasha service here to avoid circular dependency
        from app.services.dasha import DashaService
        dasha_service = DashaService()
        dasha_timeline = dasha_service.calculate_vimshottari_dasha(
            person.date_of_birth,
            moon_pos.longitude
        )

        # Create ChartData
        chart_data = ChartData(
            person=person,
            calculation_datetime_utc=utc_dt.isoformat(),
            julian_day=jd,
            ayanamsa=ayanamsa,
            ayanamsa_name="Lahiri",
            ascendant=ascendant_position,
            planets=planet_positions,
            house_cusps=house_cusps,
            moon_nakshatra=moon_nakshatra_info,
            ascendant_nakshatra=ascendant_nakshatra_info,
            d1_chart=d1_summary,
            d9_chart=d9_summary,
            dasha_timeline=dasha_timeline,
            house_lords=house_lords
        )

        return chart_data

    def _calculate_house_lords(self, house_cusps: List[float]) -> Dict[int, Planet]:
        """
        Calculate which planet rules each house based on cusp sign.

        Args:
            house_cusps: List of house cusp longitudes

        Returns:
            Dictionary mapping house number to ruling planet
        """
        house_lords = {}

        for i, cusp_long in enumerate(house_cusps):
            sign_name, _ = self.ephe.longitude_to_sign(cusp_long)
            lord_name = self.ephe.get_sign_lord(sign_name)
            house_lords[i + 1] = Planet[lord_name.upper()]

        return house_lords

    def _calculate_d9_summary(self, rasi_positions: List[PlanetPosition]) -> Dict[str, Any]:
        """
        Calculate Navamsa (D9) chart summary.

        Args:
            rasi_positions: Planet positions in Rasi chart

        Returns:
            Dictionary with D9 analysis
        """
        d9_planets = {}

        for planet_pos in rasi_positions:
            # Calculate navamsa longitude
            d9_long = self.ephe.calculate_navamsa_longitude(planet_pos.longitude)
            d9_sign, d9_sign_long = self.ephe.longitude_to_sign(d9_long)

            d9_planets[planet_pos.planet.value] = {
                "sign": d9_sign,
                "longitude": d9_long,
                "sign_longitude": d9_sign_long
            }

        # Check for Vargottama (same sign in D1 and D9)
        vargottama = []
        for planet_pos in rasi_positions:
            d1_sign = planet_pos.sign.value
            d9_sign = d9_planets[planet_pos.planet.value]["sign"]
            if d1_sign == d9_sign:
                vargottama.append(planet_pos.planet.value)

        d9_summary = {
            "planets": d9_planets,
            "vargottama_planets": vargottama,
            "description": "Navamsa chart shows relationship and spiritual destiny"
        }

        return d9_summary

    def get_planet_by_name(self, chart_data: ChartData, planet_name: str) -> PlanetPosition:
        """
        Retrieve a specific planet's position from chart data.

        Args:
            chart_data: Calculated chart data
            planet_name: Name of the planet (e.g., "Jupiter")

        Returns:
            PlanetPosition object
        """
        for planet_pos in chart_data.planets:
            if planet_pos.planet.value == planet_name:
                return planet_pos
        raise ValueError(f"Planet {planet_name} not found in chart")

    def get_planets_in_house(self, chart_data: ChartData, house_num: int) -> List[PlanetPosition]:
        """
        Get all planets in a specific house.

        Args:
            chart_data: Calculated chart data
            house_num: House number (1-12)

        Returns:
            List of PlanetPosition objects in that house
        """
        return [p for p in chart_data.planets if p.house == house_num]

    def get_planets_in_sign(self, chart_data: ChartData, sign: str) -> List[PlanetPosition]:
        """
        Get all planets in a specific sign.

        Args:
            chart_data: Calculated chart data
            sign: Sign name (e.g., "Aries")

        Returns:
            List of PlanetPosition objects in that sign
        """
        return [p for p in chart_data.planets if p.sign.value == sign]

    def are_planets_conjunct(self, pos1: PlanetPosition, pos2: PlanetPosition, orb: float = 10.0) -> bool:
        """
        Check if two planets are in conjunction.

        Args:
            pos1: First planet position
            pos2: Second planet position
            orb: Orb in degrees for conjunction

        Returns:
            True if conjunct within orb
        """
        diff = abs(pos1.longitude - pos2.longitude)
        # Handle wraparound at 360 degrees
        if diff > 180:
            diff = 360 - diff
        return diff <= orb

    def get_lord_of_house(self, chart_data: ChartData, house_num: int) -> Planet:
        """
        Get the ruling planet of a house.

        Args:
            chart_data: Calculated chart data
            house_num: House number (1-12)

        Returns:
            Planet that rules the house
        """
        return chart_data.house_lords[house_num]

    def get_house_of_planet(self, chart_data: ChartData, planet: Planet) -> int:
        """
        Get the house position of a planet.

        Args:
            chart_data: Calculated chart data
            planet: Planet enum

        Returns:
            House number (1-12)
        """
        for planet_pos in chart_data.planets:
            if planet_pos.planet == planet:
                return planet_pos.house
        # If planet is ascendant lord, etc.
        return 1

    def close(self):
        """Clean up resources."""
        self.ephe.close()

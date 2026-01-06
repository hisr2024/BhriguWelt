"""
Domain-Specific Language (DSL) parser and evaluator for astrological rules.
Supports expressions like:
- planet_in_house(Jupiter, 5)
- planet_in_sign(Venus, Taurus)
- lord_of_house_in_house(1, 10)
- nakshatra_of(Moon) == "Rohini"
- conjunction(Mars, Saturn, 10)
"""

import re
from typing import Any, Dict, List, Optional
from app.domain.models import ChartData, PlanetPosition, Planet, TransitSnapshot


class DSLEvaluator:
    """
    Evaluates DSL expressions against chart data.
    """

    def __init__(self, chart_data: ChartData, transit_data: Optional[TransitSnapshot] = None):
        """
        Initialize evaluator with chart and optional transit data.

        Args:
            chart_data: Birth chart data
            transit_data: Optional transit snapshot for daily insights
        """
        self.chart = chart_data
        self.transit = transit_data
        self.context = {}

    def evaluate(self, expression: str) -> bool:
        """
        Evaluate a DSL expression.

        Args:
            expression: DSL expression string

        Returns:
            Boolean result of evaluation
        """
        expression = expression.strip()

        # Handle OR conditions
        if " OR " in expression:
            parts = expression.split(" OR ")
            return any(self.evaluate(part.strip()) for part in parts)

        # Handle AND conditions
        if " AND " in expression:
            parts = expression.split(" AND ")
            return all(self.evaluate(part.strip()) for part in parts)

        # Handle comparison operators
        if " == " in expression:
            left, right = expression.split(" == ")
            left_val = self._evaluate_function(left.strip())
            right_val = right.strip().strip('"\'')
            return str(left_val) == right_val

        if " != " in expression:
            left, right = expression.split(" != ")
            left_val = self._evaluate_function(left.strip())
            right_val = right.strip().strip('"\'')
            return str(left_val) != right_val

        # Otherwise, evaluate as function call
        return self._evaluate_function(expression)

    def _evaluate_function(self, func_expr: str) -> Any:
        """
        Evaluate a function expression.

        Args:
            func_expr: Function expression like "planet_in_house(Jupiter, 5)"

        Returns:
            Result of function evaluation
        """
        # Parse function name and arguments
        match = re.match(r'(\w+)\((.*)\)', func_expr)
        if not match:
            # Not a function, return as literal
            return func_expr

        func_name = match.group(1)
        args_str = match.group(2)

        # Parse arguments
        args = [arg.strip().strip('"\'') for arg in args_str.split(',')]

        # Dispatch to appropriate handler
        method_name = f"_eval_{func_name}"
        if hasattr(self, method_name):
            return getattr(self, method_name)(*args)
        else:
            raise ValueError(f"Unknown DSL function: {func_name}")

    def _get_planet_position(self, planet_name: str) -> Optional[PlanetPosition]:
        """Get planet position from chart."""
        planet_name = planet_name.upper()
        try:
            planet = Planet[planet_name]
            for pos in self.chart.planets:
                if pos.planet == planet:
                    return pos
        except KeyError:
            return None
        return None

    def _eval_planet_in_house(self, planet_name: str, house_str: str) -> bool:
        """Check if planet is in specified house."""
        pos = self._get_planet_position(planet_name)
        if not pos:
            return False
        return pos.house == int(house_str)

    def _eval_planet_in_sign(self, planet_name: str, sign_name: str) -> bool:
        """Check if planet is in specified sign."""
        pos = self._get_planet_position(planet_name)
        if not pos:
            return False
        return pos.sign.value.lower() == sign_name.lower()

    def _eval_lord_of_house_in_house(self, source_house_str: str, target_house_str: str) -> bool:
        """Check if lord of source house is in target house."""
        source_house = int(source_house_str)
        target_house = int(target_house_str)

        lord = self.chart.house_lords.get(source_house)
        if not lord:
            return False

        lord_pos = self._get_planet_position(lord.value)
        if not lord_pos:
            return False

        return lord_pos.house == target_house

    def _eval_nakshatra_of(self, point: str) -> str:
        """Get nakshatra of a point or planet."""
        if point.upper() == "MOON":
            return self.chart.moon_nakshatra.nakshatra.value
        elif point.upper() == "ASCENDANT":
            return self.chart.ascendant_nakshatra.nakshatra.value
        else:
            pos = self._get_planet_position(point)
            if pos:
                return pos.nakshatra.value
        return ""

    def _eval_pada_of(self, point: str) -> int:
        """Get pada of a point or planet."""
        if point.upper() == "MOON":
            return self.chart.moon_nakshatra.pada
        elif point.upper() == "ASCENDANT":
            return self.chart.ascendant_nakshatra.pada
        else:
            pos = self._get_planet_position(point)
            if pos:
                return pos.nakshatra_pada
        return 0

    def _eval_conjunction(self, planet1: str, planet2: str, orb_str: str) -> bool:
        """Check if two planets are in conjunction within orb."""
        pos1 = self._get_planet_position(planet1)
        pos2 = self._get_planet_position(planet2)

        if not pos1 or not pos2:
            return False

        orb = float(orb_str)
        diff = abs(pos1.longitude - pos2.longitude)

        # Handle wraparound at 360 degrees
        if diff > 180:
            diff = 360 - diff

        return diff <= orb

    def _eval_planet_in_kendra(self, planet_name: str) -> bool:
        """Check if planet is in a kendra (1, 4, 7, 10)."""
        pos = self._get_planet_position(planet_name)
        if not pos:
            return False
        return pos.house in [1, 4, 7, 10]

    def _eval_planet_in_trikona(self, planet_name: str) -> bool:
        """Check if planet is in a trikona (1, 5, 9)."""
        pos = self._get_planet_position(planet_name)
        if not pos:
            return False
        return pos.house in [1, 5, 9]

    def _eval_lord_of_house_in_kendra(self, house_str: str) -> bool:
        """Check if lord of house is in a kendra."""
        house = int(house_str)
        lord = self.chart.house_lords.get(house)
        if not lord:
            return False

        lord_pos = self._get_planet_position(lord.value)
        if not lord_pos:
            return False

        return lord_pos.house in [1, 4, 7, 10]

    def _eval_lord_of_house_in_trikona(self, house_str: str) -> bool:
        """Check if lord of house is in a trikona."""
        house = int(house_str)
        lord = self.chart.house_lords.get(house)
        if not lord:
            return False

        lord_pos = self._get_planet_position(lord.value)
        if not lord_pos:
            return False

        return lord_pos.house in [1, 5, 9]

    def _eval_planet_in_own_sign(self, planet_name: str) -> bool:
        """Check if planet is in its own sign."""
        pos = self._get_planet_position(planet_name)
        if not pos:
            return False

        # Define planetary sign ownerships
        ownerships = {
            "Sun": ["Leo"],
            "Moon": ["Cancer"],
            "Mars": ["Aries", "Scorpio"],
            "Mercury": ["Gemini", "Virgo"],
            "Jupiter": ["Sagittarius", "Pisces"],
            "Venus": ["Taurus", "Libra"],
            "Saturn": ["Capricorn", "Aquarius"]
        }

        own_signs = ownerships.get(planet_name, [])
        return pos.sign.value in own_signs

    def _eval_planet_in_nakshatra(self, planet_name: str, nakshatra_name: str) -> bool:
        """Check if planet is in specified nakshatra."""
        pos = self._get_planet_position(planet_name)
        if not pos:
            return False
        return pos.nakshatra.value.lower() == nakshatra_name.lower()

    def _eval_planet_in_nakshatra_in_house(self, planet_name: str, nakshatra_name: str, house_str: str) -> bool:
        """Check if planet is in specified nakshatra and house."""
        pos = self._get_planet_position(planet_name)
        if not pos:
            return False
        return (pos.nakshatra.value.lower() == nakshatra_name.lower() and
                pos.house == int(house_str))

    def _eval_transit_hit(self, transit_planet: str, natal_point: str, orb_str: str) -> bool:
        """Check if transit planet is hitting a natal point."""
        if not self.transit:
            return False

        # Get transit planet position
        transit_pos = None
        for pos in self.transit.planets:
            if pos.planet.value.lower() == transit_planet.lower():
                transit_pos = pos
                break

        if not transit_pos:
            return False

        # Get natal point longitude
        natal_long = None
        if natal_point.lower() == "natal_moon":
            natal_pos = self._get_planet_position("Moon")
            if natal_pos:
                natal_long = natal_pos.longitude
        elif natal_point.lower() == "natal_sun":
            natal_pos = self._get_planet_position("Sun")
            if natal_pos:
                natal_long = natal_pos.longitude
        elif natal_point.lower() == "natal_venus":
            natal_pos = self._get_planet_position("Venus")
            if natal_pos:
                natal_long = natal_pos.longitude
        # Add more as needed

        if natal_long is None:
            return False

        orb = float(orb_str)
        diff = abs(transit_pos.longitude - natal_long)

        # Handle wraparound
        if diff > 180:
            diff = 360 - diff

        return diff <= orb

    def _eval_lord_of_house(self, house_str: str) -> str:
        """Get the lord of a house."""
        house = int(house_str)
        lord = self.chart.house_lords.get(house)
        return lord.value if lord else ""

    def _eval_moon_nakshatra_any(self) -> bool:
        """Always returns True, used as a trigger to capture Moon nakshatra."""
        return True

    def _eval_dasha_of_planet(self, planet_or_lord_expr: str) -> bool:
        """
        Check if currently in dasha of specified planet.
        Accepts either planet name or lord_of_house(X) expression.
        """
        # For now, return False as we need current date context
        # This should be evaluated differently in horoscope engine
        return False

    def _eval_gajakesari_yoga(self) -> bool:
        """Check for Gajakesari Yoga (Jupiter and Moon in mutual kendras)."""
        jupiter_pos = self._get_planet_position("Jupiter")
        moon_pos = self._get_planet_position("Moon")

        if not jupiter_pos or not moon_pos:
            return False

        # Calculate house difference
        house_diff = abs(jupiter_pos.house - moon_pos.house)

        # Kendras are 1, 4, 7, 10 houses apart
        # So difference should be 0, 3, 6, 9 (for 1, 4, 7, 10)
        return house_diff in [0, 3, 6, 9]

    def _eval_neechabhanga_raja_yoga(self) -> bool:
        """
        Check for Neechabhanga Raja Yoga (debilitation cancellation).
        This is a simplified check.
        """
        # Define debilitation signs
        debilitations = {
            "Sun": "Libra",
            "Moon": "Scorpio",
            "Mars": "Cancer",
            "Mercury": "Pisces",
            "Jupiter": "Capricorn",
            "Venus": "Virgo",
            "Saturn": "Aries"
        }

        for planet_name, debil_sign in debilitations.items():
            pos = self._get_planet_position(planet_name)
            if pos and pos.sign.value == debil_sign:
                # Check if lord of debilitation sign is in kendra
                lord = self.chart.house_lords.get(pos.house)
                if lord:
                    lord_pos = self._get_planet_position(lord.value)
                    if lord_pos and lord_pos.house in [1, 4, 7, 10]:
                        return True

        return False

    def get_computed_facts(self) -> Dict[str, Any]:
        """Get computed facts from last evaluation."""
        return self.context

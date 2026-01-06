"""
Domain-Specific Language (DSL) for rule triggers.
Parses and evaluates astrological rule expressions.
"""
import re
from typing import Any, Dict, List, Optional
from app.domain.models import Chart, Planet, Sign, Nakshatra, RuleTrigger
from app.services.chart import ChartService


class DSLEvaluator:
    """Evaluates DSL expressions against charts."""

    def __init__(self, chart_service: ChartService):
        """Initialize with chart service."""
        self.chart_service = chart_service

    def evaluate(self, expression: str, chart: Chart) -> RuleTrigger:
        """
        Evaluate a DSL expression against a chart.

        Args:
            expression: DSL expression (e.g., "planet_in_house(Sun, 10)")
            chart: Birth chart

        Returns:
            RuleTrigger with evaluation result
        """
        expression = expression.strip()
        context: Dict[str, Any] = {}

        try:
            result = self._evaluate_expression(expression, chart, context)
            return RuleTrigger(
                expression=expression,
                evaluated=result,
                context=context
            )
        except Exception as e:
            # If evaluation fails, return False
            return RuleTrigger(
                expression=expression,
                evaluated=False,
                context={"error": str(e)}
            )

    def _evaluate_expression(self, expr: str, chart: Chart, context: Dict[str, Any]) -> bool:
        """Internal expression evaluator."""

        # planet_in_house(planet, house)
        match = re.match(r'planet_in_house\((\w+),\s*(\d+)\)', expr)
        if match:
            planet_name = match.group(1)
            house = int(match.group(2))
            return self._eval_planet_in_house(planet_name, house, chart, context)

        # planet_in_sign(planet, sign)
        match = re.match(r'planet_in_sign\((\w+),\s*(\w+)\)', expr)
        if match:
            planet_name = match.group(1)
            sign_name = match.group(2)
            return self._eval_planet_in_sign(planet_name, sign_name, chart, context)

        # lord_of_house_in_house(source_house, target_house)
        match = re.match(r'lord_of_house_in_house\((\d+),\s*(\d+)\)', expr)
        if match:
            source_house = int(match.group(1))
            target_house = int(match.group(2))
            return self._eval_lord_of_house_in_house(source_house, target_house, chart, context)

        # nakshatra(planet) == nakshatra_name
        match = re.match(r'nakshatra\((\w+)\)\s*==\s*(.+)', expr)
        if match:
            planet_name = match.group(1)
            nakshatra_name = match.group(2).strip()
            return self._eval_nakshatra(planet_name, nakshatra_name, chart, context)

        # aspect(planet, target_house, type)
        match = re.match(r'aspect\((\w+),\s*(\d+),\s*(\w+)\)', expr)
        if match:
            planet_name = match.group(1)
            target = int(match.group(2))
            aspect_type = match.group(3)
            return self._eval_aspect(planet_name, target, aspect_type, chart, context)

        # conjunction(planet1, planet2, orb)
        match = re.match(r'conjunction\((\w+),\s*(\w+),\s*([\d.]+)\)', expr)
        if match:
            planet1_name = match.group(1)
            planet2_name = match.group(2)
            orb = float(match.group(3))
            return self._eval_conjunction(planet1_name, planet2_name, orb, chart, context)

        # planet_in_own_sign(planet)
        match = re.match(r'planet_in_own_sign\((.+)\)', expr)
        if match:
            planet_expr = match.group(1).strip()
            return self._eval_planet_in_own_sign(planet_expr, chart, context)

        # lord_of_house(house) - returns planet name
        match = re.match(r'lord_of_house\((\d+)\)', expr)
        if match:
            house = int(match.group(1))
            lord = self.chart_service.get_house_lord(chart, house)
            context[f'lord_of_house_{house}'] = lord.value
            return True  # This is a lookup, not a boolean check

        # jupiter_moon_kendra - special check
        match = re.match(r'jupiter_moon_kendra', expr)
        if match:
            return self._eval_jupiter_moon_kendra(chart, context)

        # planet_in_kendra(planet)
        match = re.match(r'planet_in_kendra\((\w+)\)', expr)
        if match:
            planet_name = match.group(1)
            return self._eval_planet_in_kendra(planet_name, chart, context)

        # ascendant_in_sign(sign)
        match = re.match(r'ascendant_in_sign\((\w+)\)', expr)
        if match:
            sign_name = match.group(1)
            return self._eval_ascendant_in_sign(sign_name, chart, context)

        # transit_sade_sati - placeholder for transit checks
        match = re.match(r'transit_sade_sati', expr)
        if match:
            # This would require current transit data
            # For now, return False as we focus on birth chart
            context['note'] = 'Transit checks require current date'
            return False

        # Unknown expression
        context['error'] = f'Unknown DSL expression: {expr}'
        return False

    def _eval_planet_in_house(self, planet_name: str, house: int, chart: Chart, context: Dict) -> bool:
        """Evaluate planet_in_house(planet, house)."""
        try:
            planet = Planet[planet_name.upper()]
            pos = self.chart_service.get_planet_position(chart, planet)
            context['planet'] = planet.value
            context['house'] = house
            context['actual_house'] = pos.house
            return pos.house == house
        except (KeyError, StopIteration):
            return False

    def _eval_planet_in_sign(self, planet_name: str, sign_name: str, chart: Chart, context: Dict) -> bool:
        """Evaluate planet_in_sign(planet, sign)."""
        try:
            planet = Planet[planet_name.upper()]
            sign = Sign[sign_name.upper()]
            pos = self.chart_service.get_planet_position(chart, planet)
            context['planet'] = planet.value
            context['expected_sign'] = sign.value
            context['actual_sign'] = pos.sign.value
            return pos.sign == sign
        except (KeyError, StopIteration):
            return False

    def _eval_lord_of_house_in_house(self, source: int, target: int, chart: Chart, context: Dict) -> bool:
        """Evaluate lord_of_house_in_house(source, target)."""
        try:
            lord = self.chart_service.get_house_lord(chart, source)
            lord_pos = self.chart_service.get_planet_position(chart, lord)
            context['source_house'] = source
            context['house_lord'] = lord.value
            context['target_house'] = target
            context['actual_house'] = lord_pos.house
            return lord_pos.house == target
        except (StopIteration, KeyError):
            return False

    def _eval_nakshatra(self, planet_name: str, nakshatra_name: str, chart: Chart, context: Dict) -> bool:
        """Evaluate nakshatra(planet) == nakshatra_name."""
        try:
            planet = Planet[planet_name.upper()]
            # Handle nakshatra names with spaces
            nakshatra_name_clean = nakshatra_name.strip().upper().replace(' ', '_')
            nakshatra = Nakshatra[nakshatra_name_clean]

            pos = self.chart_service.get_planet_position(chart, planet)
            context['planet'] = planet.value
            context['expected_nakshatra'] = nakshatra.value
            context['actual_nakshatra'] = pos.nakshatra.value
            return pos.nakshatra == nakshatra
        except (KeyError, StopIteration):
            return False

    def _eval_aspect(self, planet_name: str, target: int, aspect_type: str, chart: Chart, context: Dict) -> bool:
        """Evaluate aspect(planet, target, type)."""
        try:
            planet = Planet[planet_name.upper()]
            aspects = self.chart_service.calculate_aspect(chart, planet, target)
            context['planet'] = planet.value
            context['target_house'] = target
            context['aspects'] = aspects
            return aspects
        except (KeyError, StopIteration):
            return False

    def _eval_conjunction(self, p1_name: str, p2_name: str, orb: float, chart: Chart, context: Dict) -> bool:
        """Evaluate conjunction(planet1, planet2, orb)."""
        try:
            planet1 = Planet[p1_name.upper()]
            planet2 = Planet[p2_name.upper()]
            is_conj = self.chart_service.is_conjunction(chart, planet1, planet2, orb)
            context['planet1'] = planet1.value
            context['planet2'] = planet2.value
            context['orb'] = orb
            context['conjunction'] = is_conj
            return is_conj
        except (KeyError, StopIteration):
            return False

    def _eval_planet_in_own_sign(self, planet_expr: str, chart: Chart, context: Dict) -> bool:
        """Evaluate planet_in_own_sign(planet)."""
        try:
            # Handle lord_of_house(N) expressions
            match = re.match(r'lord_of_house\((\d+)\)', planet_expr)
            if match:
                house = int(match.group(1))
                planet = self.chart_service.get_house_lord(chart, house)
            else:
                planet = Planet[planet_expr.upper()]

            pos = self.chart_service.get_planet_position(chart, planet)
            lord_of_sign = self.chart_service.ephemeris.get_sign_lord(pos.sign)

            context['planet'] = planet.value
            context['sign'] = pos.sign.value
            context['sign_lord'] = lord_of_sign.value
            context['in_own_sign'] = (planet == lord_of_sign)

            return planet == lord_of_sign
        except (KeyError, StopIteration):
            return False

    def _eval_jupiter_moon_kendra(self, chart: Chart, context: Dict) -> bool:
        """Evaluate jupiter_moon_kendra (Gajakesari Yoga)."""
        in_kendra = self.chart_service.are_planets_in_kendra(chart, Planet.JUPITER, Planet.MOON)
        context['yoga'] = 'Gajakesari Yoga'
        context['jupiter_moon_kendra'] = in_kendra
        return in_kendra

    def _eval_planet_in_kendra(self, planet_name: str, chart: Chart, context: Dict) -> bool:
        """Evaluate planet_in_kendra(planet)."""
        try:
            planet = Planet[planet_name.upper()]
            pos = self.chart_service.get_planet_position(chart, planet)
            is_kendra = pos.house in [1, 4, 7, 10]
            context['planet'] = planet.value
            context['house'] = pos.house
            context['is_kendra'] = is_kendra
            return is_kendra
        except (KeyError, StopIteration):
            return False

    def _eval_ascendant_in_sign(self, sign_name: str, chart: Chart, context: Dict) -> bool:
        """Evaluate ascendant_in_sign(sign)."""
        try:
            sign = Sign[sign_name.upper()]
            context['expected_sign'] = sign.value
            context['actual_ascendant'] = chart.ascendant.value
            return chart.ascendant == sign
        except KeyError:
            return False

    def evaluate_all(self, expressions: List[str], chart: Chart) -> List[RuleTrigger]:
        """Evaluate multiple expressions."""
        return [self.evaluate(expr, chart) for expr in expressions]

    def all_match(self, expressions: List[str], chart: Chart) -> bool:
        """Check if all expressions match."""
        triggers = self.evaluate_all(expressions, chart)
        return all(t.evaluated for t in triggers)

    def any_match(self, expressions: List[str], chart: Chart) -> bool:
        """Check if any expression matches."""
        triggers = self.evaluate_all(expressions, chart)
        return any(t.evaluated for t in triggers)

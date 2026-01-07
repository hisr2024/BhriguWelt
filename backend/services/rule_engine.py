"""
Rule Engine for BhriguWelt
DSL-based trigger evaluation for astrological rules
Supports complex planetary configurations and yogas
"""
import re
from typing import Dict, Any, List, Optional, Callable
import logging

logger = logging.getLogger(__name__)


class RuleEngine:
    """
    Evaluates astrological rules against birth chart data using a DSL-based trigger system
    """

    def __init__(self):
        self.trigger_functions = self._initialize_trigger_functions()

    def _initialize_trigger_functions(self) -> Dict[str, Callable]:
        """Register all trigger evaluation functions"""
        return {
            'lord_of_house_in_house': self._eval_lord_of_house_in_house,
            'planet_in_house': self._eval_planet_in_house,
            'planet_in_nakshatra': self._eval_planet_in_nakshatra,
            'planet_in_own_sign': self._eval_planet_in_own_sign,
            'planet_in_kendra': self._eval_planet_in_kendra,
            'conjunction': self._eval_conjunction,
            'gajakesari_yoga': self._eval_gajakesari_yoga,
            'neechabhanga_raja_yoga': self._eval_neechabhanga_raja_yoga,
            'moon_nakshatra_any': self._eval_moon_nakshatra_any,
            'nakshatra_of': self._eval_nakshatra_of,
            'planet_in_nakshatra_in_house': self._eval_planet_in_nakshatra_in_house,
            'dasha_of_planet': self._eval_dasha_of_planet,
            'lord_of_house_in_kendra': self._eval_lord_of_house_in_kendra,
            'lord_of_house_in_trikona': self._eval_lord_of_house_in_trikona,
            'transit_hit': self._eval_transit_hit,
        }

    def evaluate_rules(self, rules: List[Dict[str, Any]], chart_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Evaluate a list of rules against birth chart data
        
        Args:
            rules: List of rule dictionaries with triggers and narrative templates
            chart_data: Birth chart data with planetary positions
            
        Returns:
            List of matched rules with interpreted narratives
        """
        matched_rules = []
        
        for rule in rules:
            if self._evaluate_rule(rule, chart_data):
                # Rule matched - generate interpretation
                interpretation = self._generate_interpretation(rule, chart_data)
                matched_rules.append({
                    'rule_id': rule.get('rule_id'),
                    'tradition': rule.get('tradition'),
                    'domain': rule.get('domain'),
                    'priority': rule.get('priority', 50),
                    'interpretation': interpretation,
                    'citations': rule.get('citations', [])
                })
        
        # Sort by priority (highest first)
        matched_rules.sort(key=lambda x: x['priority'], reverse=True)
        
        return matched_rules

    def _evaluate_rule(self, rule: Dict[str, Any], chart_data: Dict[str, Any]) -> bool:
        """
        Evaluate a single rule's triggers against chart data
        
        Returns True if all triggers are satisfied (AND logic)
        """
        triggers = rule.get('triggers', [])
        if not triggers:
            return False
        
        for trigger in triggers:
            if not self._evaluate_trigger(trigger, chart_data):
                return False
        
        return True

    def _evaluate_trigger(self, trigger: str, chart_data: Dict[str, Any]) -> bool:
        """
        Evaluate a single trigger expression
        
        Supports:
        - Simple function calls: lord_of_house_in_house(1, 10)
        - OR logic: planet_in_house(Jupiter, 5) OR planet_in_house(Jupiter, 9)
        - AND logic (implicit): Multiple triggers in list
        - Comparison operators: nakshatra_of(Moon) == Pushya
        """
        try:
            # Handle OR logic
            if ' OR ' in trigger:
                parts = trigger.split(' OR ')
                return any(self._evaluate_trigger(part.strip(), chart_data) for part in parts)
            
            # Handle comparison operators
            if ' == ' in trigger:
                left, right = trigger.split(' == ')
                left_val = self._evaluate_expression(left.strip(), chart_data)
                right_val = right.strip().strip('"\'')
                return str(left_val).lower() == str(right_val).lower()
            
            # Handle function calls
            return self._evaluate_expression(trigger, chart_data)
            
        except Exception as e:
            logger.warning(f"Failed to evaluate trigger '{trigger}': {e}")
            return False

    def _evaluate_expression(self, expression: str, chart_data: Dict[str, Any]) -> Any:
        """Evaluate a single expression (function call or value)"""
        # Match function call pattern: function_name(arg1, arg2, ...)
        func_match = re.match(r'(\w+)\((.*)\)', expression)
        
        if func_match:
            func_name = func_match.group(1)
            args_str = func_match.group(2)
            
            # Parse arguments
            args = [arg.strip().strip('"\'') for arg in args_str.split(',')] if args_str else []
            
            # Get trigger function
            trigger_func = self.trigger_functions.get(func_name)
            if trigger_func:
                return trigger_func(chart_data, *args)
            else:
                logger.warning(f"Unknown trigger function: {func_name}")
                return False
        
        # Not a function call - return as literal value
        return expression

    def _generate_interpretation(self, rule: Dict[str, Any], chart_data: Dict[str, Any]) -> str:
        """Generate human-readable interpretation from narrative template"""
        template = rule.get('narrative_template', '')
        
        # Replace placeholders
        interpretation = template.replace('{name}', chart_data.get('name', 'the native'))
        
        # Replace nakshatra placeholder
        if '{moon_nakshatra}' in interpretation:
            nakshatra = chart_data.get('nakshatra', 'Unknown')
            interpretation = interpretation.replace('{moon_nakshatra}', nakshatra)
        
        return interpretation

    # ============================================================
    # Trigger Evaluation Functions
    # ============================================================

    def _eval_lord_of_house_in_house(self, chart_data: Dict[str, Any], house_num: str, target_house: str) -> bool:
        """Check if lord of house X is in house Y"""
        houses = chart_data.get('houses', {})
        house_num = int(house_num)
        target_house = int(target_house)
        
        # Get the lord of the specified house
        house_info = houses.get(f'house_{house_num}', {})
        lord = house_info.get('lord')
        
        if not lord:
            return False
        
        # Check if lord is in target house
        planets = chart_data.get('planets', {})
        lord_info = planets.get(lord, {})
        lord_house = lord_info.get('house')
        
        return lord_house == target_house

    def _eval_planet_in_house(self, chart_data: Dict[str, Any], planet: str, house_num: str) -> bool:
        """Check if planet is in specified house"""
        planets = chart_data.get('planets', {})
        house_num = int(house_num)
        
        planet_info = planets.get(planet, {})
        return planet_info.get('house') == house_num

    def _eval_planet_in_nakshatra(self, chart_data: Dict[str, Any], planet: str, nakshatra: str) -> bool:
        """Check if planet is in specified nakshatra"""
        planets = chart_data.get('planets', {})
        
        planet_info = planets.get(planet, {})
        planet_nakshatra = planet_info.get('nakshatra', '')
        
        return planet_nakshatra.lower() == nakshatra.lower()

    def _eval_planet_in_own_sign(self, chart_data: Dict[str, Any], planet: str) -> bool:
        """Check if planet is in its own sign"""
        planets = chart_data.get('planets', {})
        planet_info = planets.get(planet, {})
        
        # Define rulerships
        rulerships = {
            'Sun': ['Leo'],
            'Moon': ['Cancer'],
            'Mars': ['Aries', 'Scorpio'],
            'Mercury': ['Gemini', 'Virgo'],
            'Jupiter': ['Sagittarius', 'Pisces'],
            'Venus': ['Taurus', 'Libra'],
            'Saturn': ['Capricorn', 'Aquarius']
        }
        
        planet_sign = planet_info.get('sign', '')
        own_signs = rulerships.get(planet, [])
        
        return planet_sign in own_signs

    def _eval_planet_in_kendra(self, chart_data: Dict[str, Any], planet: str) -> bool:
        """Check if planet is in a kendra (1, 4, 7, 10)"""
        planets = chart_data.get('planets', {})
        planet_info = planets.get(planet, {})
        house = planet_info.get('house')
        
        return house in [1, 4, 7, 10]

    def _eval_conjunction(self, chart_data: Dict[str, Any], *args) -> bool:
        """Check if planets are in conjunction (same house)"""
        if len(args) < 2:
            return False
        
        planets = chart_data.get('planets', {})
        
        # Get house of first planet
        first_planet = args[0]
        first_house = planets.get(first_planet, {}).get('house')
        
        if not first_house:
            return False
        
        # Check if all other planets are in same house
        for planet in args[1:]:
            if isinstance(planet, str) and not planet.isdigit():
                planet_house = planets.get(planet, {}).get('house')
                if planet_house != first_house:
                    return False
        
        return True

    def _eval_gajakesari_yoga(self, chart_data: Dict[str, Any]) -> bool:
        """Check for Gajakesari Yoga (Jupiter and Moon in mutual kendras)"""
        planets = chart_data.get('planets', {})
        
        jupiter_house = planets.get('Jupiter', {}).get('house')
        moon_house = planets.get('Moon', {}).get('house')
        
        if not jupiter_house or not moon_house:
            return False
        
        # Check if they are in mutual kendras (1-4-7-10 relationship)
        diff = abs(jupiter_house - moon_house)
        return diff in [0, 3, 6, 9] and jupiter_house in [1, 4, 7, 10]

    def _eval_neechabhanga_raja_yoga(self, chart_data: Dict[str, Any]) -> bool:
        """Check for Neechabhanga Raja Yoga (debilitation cancellation)"""
        # Simplified check - would need more complex logic in production
        planets = chart_data.get('planets', {})
        
        # Debilitation signs
        debilitation = {
            'Sun': 'Libra',
            'Moon': 'Scorpio',
            'Mars': 'Cancer',
            'Mercury': 'Pisces',
            'Jupiter': 'Capricorn',
            'Venus': 'Virgo',
            'Saturn': 'Aries'
        }
        
        for planet, debil_sign in debilitation.items():
            planet_info = planets.get(planet, {})
            if planet_info.get('sign') == debil_sign:
                # Check if debilitation lord is in kendra
                # Simplified - true neechabhanga has more conditions
                return True
        
        return False

    def _eval_moon_nakshatra_any(self, chart_data: Dict[str, Any]) -> bool:
        """Check if Moon has any nakshatra (always true if nakshatra exists)"""
        return bool(chart_data.get('nakshatra'))

    def _eval_nakshatra_of(self, chart_data: Dict[str, Any], planet: str) -> str:
        """Get nakshatra of a planet"""
        planets = chart_data.get('planets', {})
        planet_info = planets.get(planet, {})
        return planet_info.get('nakshatra', '')

    def _eval_planet_in_nakshatra_in_house(self, chart_data: Dict[str, Any], 
                                           planet: str, nakshatra: str, house: str) -> bool:
        """Check if planet is in specific nakshatra AND specific house"""
        house_num = int(house)
        return (self._eval_planet_in_nakshatra(chart_data, planet, nakshatra) and 
                self._eval_planet_in_house(chart_data, planet, str(house_num)))

    def _eval_dasha_of_planet(self, chart_data: Dict[str, Any], planet: str) -> bool:
        """Check if current dasha is of specified planet"""
        dasha_period = chart_data.get('dasha_period', {})
        current_dasha = dasha_period.get('maha_dasha', '')
        
        return planet.lower() in current_dasha.lower()

    def _eval_lord_of_house_in_kendra(self, chart_data: Dict[str, Any], house_num: str) -> bool:
        """Check if lord of house is in a kendra"""
        houses = chart_data.get('houses', {})
        house_num = int(house_num)
        
        house_info = houses.get(f'house_{house_num}', {})
        lord = house_info.get('lord')
        
        if not lord:
            return False
        
        planets = chart_data.get('planets', {})
        lord_info = planets.get(lord, {})
        lord_house = lord_info.get('house')
        
        return lord_house in [1, 4, 7, 10]

    def _eval_lord_of_house_in_trikona(self, chart_data: Dict[str, Any], house_num: str) -> bool:
        """Check if lord of house is in a trikona (1, 5, 9)"""
        houses = chart_data.get('houses', {})
        house_num = int(house_num)
        
        house_info = houses.get(f'house_{house_num}', {})
        lord = house_info.get('lord')
        
        if not lord:
            return False
        
        planets = chart_data.get('planets', {})
        lord_info = planets.get(lord, {})
        lord_house = lord_info.get('house')
        
        return lord_house in [1, 5, 9]

    def _eval_transit_hit(self, chart_data: Dict[str, Any], 
                         transiting_planet: str, natal_planet: str, orb: str) -> bool:
        """Check if transiting planet is within orb of natal planet"""
        # This would require current transit data
        # Simplified implementation - always returns False in offline mode
        transits = chart_data.get('current_transits', {})
        if not transits:
            return False
        
        # Would need to calculate actual degrees and check orb
        # Placeholder implementation
        return False


# Singleton instance
_rule_engine = None

def get_rule_engine() -> RuleEngine:
    """Get or create rule engine singleton"""
    global _rule_engine
    if _rule_engine is None:
        _rule_engine = RuleEngine()
    return _rule_engine

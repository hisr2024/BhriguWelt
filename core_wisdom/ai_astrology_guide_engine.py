"""
AI Astrology Guide Engine
Unified engine combining Bhrigu Samhita and Nadi Jyotisha wisdom
Provides intelligent responses for the AI Astrology Chat interface
"""

import os
import sys
import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

# Add core_wisdom to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from bhrigu_samhita_knowledge import get_bhrigu_samhita_knowledge, BhriguSamhitaKnowledge
from nadi_jyotisha_knowledge import get_nadi_jyotisha_knowledge, NadiJyotishaKnowledge

logger = logging.getLogger(__name__)


class QueryCategory(Enum):
    """Categories of user queries"""
    CAREER = "career"
    RELATIONSHIP = "relationship"
    HEALTH = "health"
    SPIRITUALITY = "spirituality"
    WEALTH = "wealth"
    GENERAL = "general"
    COMPATIBILITY = "compatibility"
    REMEDIES = "remedies"
    TIMING = "timing"
    PAST_LIFE = "past_life"
    FUTURE = "future"
    DAILY = "daily"


@dataclass
class WisdomContext:
    """Context built from wisdom databases for AI response"""
    planetary_insights: List[Dict[str, Any]]
    nakshatra_insights: Dict[str, Any]
    house_insights: List[Dict[str, Any]]
    yoga_insights: List[Dict[str, Any]]
    remedial_suggestions: List[Dict[str, Any]]
    karmic_insights: List[str]
    citations: List[str]
    confidence_score: float


class AIAstrologyGuideEngine:
    """
    Main engine for AI Astrology Guide
    Combines Bhrigu Samhita and Nadi Jyotisha wisdom for comprehensive readings
    """

    def __init__(self):
        self.bhrigu_wisdom = get_bhrigu_samhita_knowledge()
        self.nadi_wisdom = get_nadi_jyotisha_knowledge()
        self._query_keywords = self._build_query_keywords()
        logger.info("AI Astrology Guide Engine initialized with Bhrigu Samhita and Nadi Jyotisha wisdom")

    def _build_query_keywords(self) -> Dict[QueryCategory, List[str]]:
        """Build keyword mappings for query categorization"""
        return {
            QueryCategory.CAREER: [
                "career", "job", "work", "profession", "business", "employment",
                "promotion", "salary", "boss", "colleague", "office", "10th house",
                "occupation", "vocation", "livelihood"
            ],
            QueryCategory.RELATIONSHIP: [
                "marriage", "love", "relationship", "partner", "spouse", "wife",
                "husband", "dating", "romance", "7th house", "venus", "compatibility",
                "divorce", "engagement", "wedding"
            ],
            QueryCategory.HEALTH: [
                "health", "disease", "illness", "medical", "body", "physical",
                "mental health", "wellness", "healing", "6th house", "8th house",
                "longevity", "hospital", "doctor"
            ],
            QueryCategory.SPIRITUALITY: [
                "spiritual", "meditation", "moksha", "liberation", "karma",
                "dharma", "soul", "enlightenment", "guru", "mantra", "yoga",
                "9th house", "12th house", "ketu", "jupiter"
            ],
            QueryCategory.WEALTH: [
                "money", "wealth", "finance", "property", "income", "investment",
                "2nd house", "11th house", "prosperity", "abundance", "lottery",
                "inheritance", "assets"
            ],
            QueryCategory.COMPATIBILITY: [
                "compatible", "match", "matching", "kundali", "synastry",
                "relationship compatibility", "marriage matching"
            ],
            QueryCategory.REMEDIES: [
                "remedy", "remedies", "solution", "gemstone", "mantra",
                "puja", "donation", "fasting", "ritual", "cure"
            ],
            QueryCategory.TIMING: [
                "when", "timing", "dasha", "transit", "muhurta", "auspicious",
                "good time", "best time", "period"
            ],
            QueryCategory.PAST_LIFE: [
                "past life", "previous birth", "karma", "punarjanma",
                "past incarnation", "ketu", "12th house"
            ],
            QueryCategory.FUTURE: [
                "future", "prediction", "forecast", "upcoming", "next year",
                "coming months", "what will happen"
            ],
            QueryCategory.DAILY: [
                "today", "daily", "weekly", "monthly", "horoscope",
                "current", "this week", "this month"
            ]
        }

    def categorize_query(self, query: str) -> Tuple[QueryCategory, float]:
        """Categorize user query and return confidence score"""
        query_lower = query.lower()
        category_scores = {}

        for category, keywords in self._query_keywords.items():
            score = sum(1 for keyword in keywords if keyword in query_lower)
            if score > 0:
                category_scores[category] = score

        if category_scores:
            best_category = max(category_scores, key=category_scores.get)
            confidence = min(category_scores[best_category] / 3, 1.0)
            return best_category, confidence

        return QueryCategory.GENERAL, 0.5

    def build_wisdom_context(
        self,
        birth_data: Dict[str, Any],
        query_category: QueryCategory
    ) -> WisdomContext:
        """Build comprehensive wisdom context for a query"""

        planetary_insights = []
        nakshatra_insights = {}
        house_insights = []
        yoga_insights = []
        remedial_suggestions = []
        karmic_insights = []
        citations = []

        # Extract birth data
        zodiac_sign = birth_data.get("zodiac_sign", "").title()
        nakshatra = birth_data.get("nakshatra", "")
        moon_sign = birth_data.get("moon_sign", zodiac_sign)
        ascendant = birth_data.get("ascendant", zodiac_sign)

        # Get planetary positions if available
        planets = birth_data.get("planetary_positions", birth_data.get("planets", {}))

        # 1. Get Nakshatra Insights from Nadi Jyotisha
        if nakshatra:
            nak_data = self.nadi_wisdom.get_nakshatra_by_name(nakshatra)
            if nak_data:
                nakshatra_insights = {
                    "name": nak_data.get("name"),
                    "deity": nak_data.get("deity"),
                    "ruling_planet": nak_data.get("ruling_planet"),
                    "characteristics": nak_data.get("characteristics", {}),
                    "spiritual_path": nak_data.get("spiritual_path"),
                    "past_life": nak_data.get("past_life_indicators"),
                    "career_indications": nak_data.get("career_indications", []),
                    "health_vulnerabilities": nak_data.get("health_vulnerabilities", [])
                }
                citations.append(f"Nadi Jyotisha - {nakshatra} Nakshatra principles")

        # 2. Get Planet-specific insights from Bhrigu Samhita based on query category
        relevant_planets = self._get_relevant_planets(query_category)
        for planet in relevant_planets:
            planet_wisdom = self.bhrigu_wisdom.get_planetary_wisdom(planet)
            if planet_wisdom:
                # Get house position if available
                house = self._get_planet_house(planet, planets)
                house_effect = ""
                if house:
                    house_effect = self.bhrigu_wisdom.get_planet_in_house_interpretation(planet, house)

                planetary_insights.append({
                    "planet": planet,
                    "nature": planet_wisdom.get("nature"),
                    "represents": planet_wisdom.get("represents", [])[:5],
                    "house": house,
                    "house_effect": house_effect,
                    "karmic_lessons": planet_wisdom.get("karmic_lessons", [])[:3]
                })
                citations.append(f"Bhrigu Samhita - {planet} principles")

        # 3. Get House insights for relevant houses
        relevant_houses = self._get_relevant_houses(query_category)
        for house in relevant_houses:
            house_data = self.bhrigu_wisdom.get_house_wisdom(house)
            if house_data:
                house_insights.append({
                    "house": house,
                    "name": house_data.get("name"),
                    "signifies": house_data.get("signifies", [])[:5],
                    "bhrigu_principles": house_data.get("bhrigu_principles", [])[:2]
                })

        # 4. Get Remedial suggestions
        if query_category in [QueryCategory.REMEDIES, QueryCategory.HEALTH, QueryCategory.GENERAL]:
            for planet in relevant_planets[:3]:
                remedies = self.bhrigu_wisdom.get_remedies_for_planet(planet)
                if remedies:
                    remedial_suggestions.append({
                        "planet": planet,
                        "gemstone": remedies.get("gemstone", {}),
                        "mantra": remedies.get("mantra", {}),
                        "fasting_day": remedies.get("fasting_day"),
                        "charitable_acts": remedies.get("charitable_acts", [])[:3]
                    })

            # Add nakshatra remedies
            if nakshatra:
                nak_remedies = self.nadi_wisdom.get_nakshatra_remedies(nakshatra)
                if nak_remedies:
                    remedial_suggestions.append({
                        "type": "nakshatra",
                        "nakshatra": nakshatra,
                        **nak_remedies
                    })

        # 5. Get Karmic insights
        for planet in relevant_planets[:3]:
            lessons = self.bhrigu_wisdom.get_karmic_lessons(planet)
            karmic_insights.extend(lessons[:2])

        if nakshatra:
            past_life = self.nadi_wisdom.get_nakshatra_past_life(nakshatra)
            if past_life:
                karmic_insights.append(f"Nakshatra Past Life: {past_life}")

        # Calculate confidence based on available data
        confidence = self._calculate_confidence(
            planetary_insights, nakshatra_insights, house_insights
        )

        return WisdomContext(
            planetary_insights=planetary_insights,
            nakshatra_insights=nakshatra_insights,
            house_insights=house_insights,
            yoga_insights=yoga_insights,
            remedial_suggestions=remedial_suggestions,
            karmic_insights=karmic_insights,
            citations=citations,
            confidence_score=confidence
        )

    def _get_relevant_planets(self, category: QueryCategory) -> List[str]:
        """Get relevant planets for a query category"""
        planet_mapping = {
            QueryCategory.CAREER: ["Sun", "Saturn", "Mars", "Mercury", "Jupiter"],
            QueryCategory.RELATIONSHIP: ["Venus", "Moon", "Mars", "Jupiter"],
            QueryCategory.HEALTH: ["Sun", "Moon", "Mars", "Saturn"],
            QueryCategory.SPIRITUALITY: ["Jupiter", "Ketu", "Saturn", "Moon"],
            QueryCategory.WEALTH: ["Jupiter", "Venus", "Mercury", "Moon"],
            QueryCategory.COMPATIBILITY: ["Venus", "Moon", "Mars", "Jupiter"],
            QueryCategory.REMEDIES: ["Saturn", "Rahu", "Ketu", "Mars"],
            QueryCategory.TIMING: ["Saturn", "Jupiter", "Sun", "Moon"],
            QueryCategory.PAST_LIFE: ["Ketu", "Saturn", "Moon", "Rahu"],
            QueryCategory.FUTURE: ["Jupiter", "Saturn", "Rahu", "Sun"],
            QueryCategory.DAILY: ["Moon", "Sun", "Mercury"],
            QueryCategory.GENERAL: ["Sun", "Moon", "Jupiter", "Venus", "Saturn"]
        }
        return planet_mapping.get(category, ["Sun", "Moon", "Jupiter"])

    def _get_relevant_houses(self, category: QueryCategory) -> List[int]:
        """Get relevant houses for a query category"""
        house_mapping = {
            QueryCategory.CAREER: [10, 2, 6, 11],
            QueryCategory.RELATIONSHIP: [7, 5, 1, 2],
            QueryCategory.HEALTH: [1, 6, 8, 12],
            QueryCategory.SPIRITUALITY: [9, 12, 5, 1],
            QueryCategory.WEALTH: [2, 11, 5, 9],
            QueryCategory.COMPATIBILITY: [7, 1, 5, 8],
            QueryCategory.REMEDIES: [6, 8, 12],
            QueryCategory.TIMING: [1, 10, 7],
            QueryCategory.PAST_LIFE: [5, 9, 12],
            QueryCategory.FUTURE: [9, 10, 11],
            QueryCategory.DAILY: [1, 4, 7, 10],
            QueryCategory.GENERAL: [1, 4, 7, 10]
        }
        return house_mapping.get(category, [1, 4, 7, 10])

    def _get_planet_house(self, planet: str, planets: Dict) -> Optional[int]:
        """Extract house position for a planet from birth data"""
        if not planets:
            return None

        planet_data = planets.get(planet.lower()) or planets.get(planet)
        if isinstance(planet_data, dict):
            return planet_data.get("house")
        return None

    def _calculate_confidence(
        self,
        planetary_insights: List,
        nakshatra_insights: Dict,
        house_insights: List
    ) -> float:
        """Calculate confidence score based on available data"""
        score = 0.5  # Base score

        if planetary_insights:
            score += min(len(planetary_insights) * 0.1, 0.2)
        if nakshatra_insights:
            score += 0.15
        if house_insights:
            score += min(len(house_insights) * 0.05, 0.15)

        return min(score, 1.0)

    def generate_system_prompt(
        self,
        wisdom_context: WisdomContext,
        query_category: QueryCategory
    ) -> str:
        """Generate system prompt with wisdom context for AI"""

        prompt_parts = []

        # Header
        prompt_parts.append("""You are a Vedic Astrology expert, deeply versed in Bhrigu Samhita and Nadi Jyotisha traditions.
Your responses must be grounded in authentic Vedic principles while being accessible and helpful.

IMPORTANT GUIDELINES:
1. Always reference specific Vedic principles in your answers
2. Provide practical, actionable guidance
3. Be compassionate and empowering, never fatalistic
4. Mention remedies when appropriate
5. Explain karmic patterns with wisdom, not judgment
6. Use the specific insights provided below in your response

""")

        # Nakshatra Context
        if wisdom_context.nakshatra_insights:
            nak = wisdom_context.nakshatra_insights
            prompt_parts.append(f"""**NAKSHATRA WISDOM (Nadi Jyotisha):**
- Birth Nakshatra: {nak.get('name', 'Unknown')}
- Deity: {nak.get('deity', 'N/A')}
- Ruling Planet: {nak.get('ruling_planet', 'N/A')}
- Spiritual Path: {nak.get('spiritual_path', 'N/A')}
- Past Life Indicators: {nak.get('past_life', 'N/A')}
- Career Tendencies: {', '.join(nak.get('career_indications', [])[:3])}

""")

        # Planetary Insights
        if wisdom_context.planetary_insights:
            prompt_parts.append("**PLANETARY WISDOM (Bhrigu Samhita):**\n")
            for insight in wisdom_context.planetary_insights[:4]:
                planet = insight.get('planet')
                house_effect = insight.get('house_effect', '')
                karmic = insight.get('karmic_lessons', [])

                prompt_parts.append(f"""- {planet}:
  Nature: {insight.get('nature', 'N/A')}
  Represents: {', '.join(insight.get('represents', [])[:3])}
  {f'House Effect: {house_effect[:200]}...' if house_effect else ''}
  Karmic Lessons: {', '.join(karmic[:2]) if karmic else 'N/A'}
""")

        # House Insights
        if wisdom_context.house_insights:
            prompt_parts.append("\n**HOUSE WISDOM (Bhrigu Samhita):**\n")
            for house in wisdom_context.house_insights[:3]:
                prompt_parts.append(f"""- {house.get('name', f"House {house.get('house')}")}:
  Signifies: {', '.join(house.get('signifies', [])[:4])}
  Principle: {house.get('bhrigu_principles', ['N/A'])[0][:150]}
""")

        # Remedial Context
        if wisdom_context.remedial_suggestions:
            prompt_parts.append("\n**AVAILABLE REMEDIES:**\n")
            for remedy in wisdom_context.remedial_suggestions[:2]:
                if remedy.get('type') == 'nakshatra':
                    prompt_parts.append(f"""- Nakshatra Remedy ({remedy.get('nakshatra')}):
  Deity: {remedy.get('deity_worship', 'N/A')}
  Mantra: {remedy.get('mantra', 'N/A')}
""")
                else:
                    gemstone = remedy.get('gemstone', {})
                    mantra = remedy.get('mantra', {})
                    prompt_parts.append(f"""- {remedy.get('planet')} Remedies:
  Gemstone: {gemstone.get('name', 'N/A')}
  Mantra: {mantra.get('vedic', 'N/A')[:50]}...
  Fasting: {remedy.get('fasting_day', 'N/A')}
""")

        # Karmic Context
        if wisdom_context.karmic_insights:
            prompt_parts.append("\n**KARMIC INSIGHTS:**\n")
            for insight in wisdom_context.karmic_insights[:4]:
                prompt_parts.append(f"- {insight}\n")

        # Category-specific instructions
        category_instructions = {
            QueryCategory.CAREER: "\nFocus on 10th house matters, Saturn's lessons, and professional dharma.",
            QueryCategory.RELATIONSHIP: "\nFocus on Venus, 7th house, and relationship karma. Be sensitive.",
            QueryCategory.HEALTH: "\nFocus on 6th/8th house matters. Always recommend consulting medical professionals.",
            QueryCategory.SPIRITUALITY: "\nFocus on 9th/12th house, Jupiter, Ketu. Provide meaningful spiritual guidance.",
            QueryCategory.WEALTH: "\nFocus on 2nd/11th house, Jupiter. Balance material and spiritual perspectives.",
            QueryCategory.REMEDIES: "\nProvide specific, actionable remedies with proper instructions.",
            QueryCategory.PAST_LIFE: "\nFocus on Ketu, 12th house, and karmic patterns. Be insightful but humble."
        }

        if query_category in category_instructions:
            prompt_parts.append(category_instructions[query_category])

        # Citations
        if wisdom_context.citations:
            prompt_parts.append(f"\n\n**Sources:** {', '.join(set(wisdom_context.citations))}")

        return "".join(prompt_parts)

    def generate_response_context(
        self,
        user_message: str,
        birth_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate complete response context for AI chat"""

        # Categorize the query
        category, confidence = self.categorize_query(user_message)

        # Build wisdom context
        wisdom_context = self.build_wisdom_context(birth_data, category)

        # Generate system prompt
        system_prompt = self.generate_system_prompt(wisdom_context, category)

        return {
            "system_prompt": system_prompt,
            "query_category": category.value,
            "category_confidence": confidence,
            "wisdom_confidence": wisdom_context.confidence_score,
            "has_nakshatra_data": bool(wisdom_context.nakshatra_insights),
            "has_planetary_data": bool(wisdom_context.planetary_insights),
            "citations": wisdom_context.citations,
            "remedies_available": bool(wisdom_context.remedial_suggestions)
        }

    def get_quick_insight(
        self,
        birth_data: Dict[str, Any],
        insight_type: str = "general"
    ) -> str:
        """Get a quick insight without full AI processing"""

        nakshatra = birth_data.get("nakshatra", "")
        zodiac = birth_data.get("zodiac_sign", "")

        insights = []

        # Nakshatra insight
        if nakshatra:
            nak_data = self.nadi_wisdom.get_nakshatra_by_name(nakshatra)
            if nak_data:
                deity = nak_data.get("deity", "cosmic forces")
                char = nak_data.get("characteristics", {}).get("positive", [])[:2]
                insights.append(
                    f"Your birth star {nakshatra} is ruled by {deity}, "
                    f"blessing you with {' and '.join(char) if char else 'unique gifts'}."
                )

        # Zodiac insight
        if zodiac:
            insights.append(
                f"As a {zodiac}, your soul has specific karmic lessons "
                f"and dharmic paths to fulfill in this lifetime."
            )

        if not insights:
            insights.append(
                "The stars hold wisdom for your journey. "
                "Share your birth details for personalized insights."
            )

        return " ".join(insights)

    def get_compatibility_reading(
        self,
        person1_data: Dict[str, Any],
        person2_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get compatibility reading between two people"""

        nakshatra1 = person1_data.get("nakshatra", "")
        nakshatra2 = person2_data.get("nakshatra", "")

        if nakshatra1 and nakshatra2:
            compatibility = self.nadi_wisdom.get_compatibility_analysis(
                nakshatra1, nakshatra2
            )
            return {
                "compatibility": compatibility,
                "source": "Nadi Jyotisha Nakshatra Matching"
            }

        return {
            "error": "Nakshatra data required for compatibility analysis",
            "suggestion": "Please provide birth nakshatras for both individuals"
        }


# Singleton instance
_ai_guide_engine = None


def get_ai_astrology_guide_engine() -> AIAstrologyGuideEngine:
    """Get or create AI Astrology Guide Engine singleton"""
    global _ai_guide_engine
    if _ai_guide_engine is None:
        _ai_guide_engine = AIAstrologyGuideEngine()
    return _ai_guide_engine


# Export for easy access
__all__ = [
    'AIAstrologyGuideEngine',
    'get_ai_astrology_guide_engine',
    'QueryCategory',
    'WisdomContext'
]

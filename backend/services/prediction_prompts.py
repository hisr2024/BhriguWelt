"""
User-Friendly Prediction Prompt Builder
Generates natural, accessible prompts for AI prediction generation
Focuses on hope, growth, and practical guidance
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass


@dataclass
class PromptContext:
    """Context for building prompts"""
    category: str
    birth_data: Dict[str, Any]
    corpus_context: str
    language: str = 'en'
    tone: str = 'friendly'  # friendly, professional, spiritual
    max_words: int = 500


class UserFriendlyPromptBuilder:
    """
    Builds user-friendly prompts for prediction generation
    """

    def __init__(self):
        self.category_guidelines = self._init_category_guidelines()
        self.tone_guidelines = self._init_tone_guidelines()

    def _init_category_guidelines(self) -> Dict[str, Dict[str, Any]]:
        """Initialize category-specific guidelines"""
        return {
            'karmic_journey': {
                'focus': 'life purpose, soul mission, spiritual growth',
                'avoid': 'harsh judgments, fatalism, unchangeable destiny',
                'emphasize': 'free will, personal agency, learning opportunities',
                'structure': [
                    'Soul\'s Purpose',
                    'Key Life Lessons',
                    'Growth Opportunities',
                    'Practical Guidance'
                ]
            },
            'past_lives': {
                'focus': 'wisdom gained, talents carried forward, healing opportunities',
                'avoid': 'dramatic past life stories, unverifiable claims',
                'emphasize': 'present-day relevance, practical insights, healing',
                'structure': [
                    'Wisdom from the Past',
                    'Talents and Gifts',
                    'Patterns to Understand',
                    'Healing Opportunities'
                ]
            },
            'present_life': {
                'focus': 'current circumstances, immediate opportunities, practical actions',
                'avoid': 'vague predictions, overwhelming advice',
                'emphasize': 'actionable steps, realistic timeframes, encouragement',
                'structure': [
                    'Current Life Path',
                    'Key Opportunities',
                    'Practical Actions',
                    'Short-term Focus'
                ]
            },
            'future_lives': {
                'focus': 'soul evolution, potential directions, hopeful possibilities',
                'avoid': 'definitive predictions, fear-based scenarios',
                'emphasize': 'growth potential, positive outcomes, free will',
                'structure': [
                    'Soul Evolution Path',
                    'Potential Directions',
                    'Growth Possibilities',
                    'Hopeful Outlook'
                ]
            },
            'karmic_remedies': {
                'focus': 'practical healing actions, accessible practices, daily habits',
                'avoid': 'expensive remedies, complex rituals, mandatory requirements',
                'emphasize': 'simple practices, personal choice, gradual progress',
                'structure': [
                    'Daily Practices',
                    'Healing Actions',
                    'Supportive Habits',
                    'Gentle Guidance'
                ]
            },
            'relationships': {
                'focus': 'connection patterns, healthy dynamics, mutual growth',
                'avoid': 'deterministic predictions, partner judgments',
                'emphasize': 'self-awareness, healthy boundaries, mutual respect',
                'structure': [
                    'Connection Patterns',
                    'Relationship Strengths',
                    'Growth Areas',
                    'Healthy Dynamics'
                ]
            },
            'life_events': {
                'focus': 'natural life cycles, timing indicators, preparation guidance',
                'avoid': 'specific date predictions, fear-based warnings',
                'emphasize': 'general timeframes, preparation strategies, adaptability',
                'structure': [
                    'Life Cycles',
                    'Timing Indicators',
                    'Preparation Guidance',
                    'Adaptive Strategies'
                ]
            }
        }

    def _init_tone_guidelines(self) -> Dict[str, str]:
        """Initialize tone-specific guidelines"""
        return {
            'friendly': '''
                Use warm, conversational language
                Address the reader directly with "you"
                Be encouraging and supportive
                Use simple, accessible vocabulary
                Include gentle guidance and hope
            ''',
            'professional': '''
                Use clear, precise language
                Maintain respectful tone
                Balance insight with actionability
                Provide structured information
                Focus on practical application
            ''',
            'spiritual': '''
                Honor sacred traditions respectfully
                Use inclusive spiritual language
                Balance mystical and practical
                Emphasize inner wisdom
                Respect diverse beliefs
            '''
        }

    def build_friendly_prompt(
        self,
        category: str,
        birth_data: Dict[str, Any],
        corpus_context: str,
        max_words: int = 500,
        tone: str = 'friendly'
    ) -> str:
        """
        Build a user-friendly prompt for prediction generation
        """

        guidelines = self.category_guidelines.get(category, {})

        # Extract key birth data
        zodiac = birth_data.get('zodiac_sign', 'Unknown')
        moon = birth_data.get('moon_sign', 'Unknown')
        ascendant = birth_data.get('ascendant', 'Unknown')

        # Build the prompt
        prompt = f"""You are a compassionate Vedic astrology guide helping someone understand their {category.replace('_', ' ')} with warmth and wisdom.

**IMPORTANT CONTEXT:**
Based on authentic Vedic wisdom from Bhrigu Samhita and Nadi Jyotisha:
{corpus_context}

**Birth Chart Summary:**
- Sun Sign (Zodiac): {zodiac}
- Moon Sign: {moon}
- Ascendant (Rising): {ascendant}

**Your Task:**
Create a {max_words}-word prediction about their {category.replace('_', ' ')} that is:

1. **Warm and Hopeful**: Use encouraging, supportive language that inspires confidence
2. **Practical and Actionable**: Provide specific, realistic guidance they can implement
3. **Balanced and Authentic**: Ground insights in Vedic wisdom while being accessible
4. **Empowering**: Emphasize free will, personal agency, and growth potential
5. **Clear and Structured**: Organize using these sections: {', '.join(guidelines.get('structure', ['Overview', 'Insights', 'Guidance']))}

**Focus Areas:**
{guidelines.get('focus', 'personal growth, life journey, spiritual development')}

**What to AVOID:**
{guidelines.get('avoid', 'harsh predictions, fatalism, fear-based language')}

**What to EMPHASIZE:**
{guidelines.get('emphasize', 'hope, empowerment, practical wisdom')}

**Tone Guidelines:**
{self.tone_guidelines.get(tone, self.tone_guidelines['friendly'])}

**Additional Requirements:**
- Write in second person ("you", "your") to be personal and engaging
- Use short paragraphs (2-3 sentences each) for easy reading
- Include at least one specific, actionable suggestion
- End with an encouraging, hopeful message
- Keep technical jargon to a minimum - explain any Vedic terms used
- Be specific to their birth chart, not generic horoscope content
- Root ALL insights in the provided Vedic corpus context above

Write the prediction now, following all guidelines above:
"""

        return prompt

    def build_diversity_prompt(
        self,
        category: str,
        birth_data: Dict[str, Any],
        corpus_context: str,
        similar_predictions: List[str],
        max_words: int = 500
    ) -> str:
        """
        Build a prompt that ensures diverse predictions
        """

        # Extract unique aspects to emphasize
        unique_aspects = self._extract_unique_aspects(birth_data)

        prompt = f"""You are creating a UNIQUE prediction that must be DISTINCTLY DIFFERENT from previous ones.

**IMPORTANT: Make this prediction UNIQUE**
Previous predictions covered: {', '.join(similar_predictions[:3])}
You MUST focus on DIFFERENT aspects and use DIFFERENT language.

**Birth Chart Unique Aspects:**
{unique_aspects}

**Vedic Corpus Context:**
{corpus_context}

**Your Task:**
Create a {max_words}-word prediction about {category.replace('_', ' ')} that:

1. **Explores DIFFERENT dimensions** than previous predictions
2. **Uses UNIQUE language and examples**
3. **Highlights SPECIFIC aspects** from the birth chart not yet emphasized
4. **Draws from DIFFERENT Vedic sources** or principles
5. **Provides FRESH insights and perspectives**

Focus on making this prediction distinctly different while maintaining quality and authenticity.

Write the unique prediction now:
"""

        return prompt

    def _extract_unique_aspects(self, birth_data: Dict[str, Any]) -> str:
        """Extract unique aspects from birth data"""

        aspects = []

        # Planetary positions
        if 'planets' in birth_data:
            for planet, data in birth_data.get('planets', {}).items():
                sign = data.get('sign', 'Unknown')
                house = data.get('house', 'Unknown')
                aspects.append(f"{planet} in {sign} (House {house})")

        # Yogas
        if 'yogas' in birth_data:
            for yoga in birth_data.get('yogas', [])[:5]:  # Top 5 yogas
                aspects.append(f"Yoga: {yoga.get('name', 'Unknown')}")

        # Special combinations
        if 'special_combinations' in birth_data:
            aspects.extend(birth_data.get('special_combinations', [])[:3])

        return '\n'.join(f"- {aspect}" for aspect in aspects[:10]) if aspects else "Standard birth chart aspects"

    def build_enhancement_prompt(
        self,
        original_prediction: str,
        enhancement_needed: str,
        corpus_context: str
    ) -> str:
        """
        Build a prompt to enhance an existing prediction
        """

        prompt = f"""You are enhancing a prediction to address a specific issue.

**Original Prediction:**
{original_prediction}

**Enhancement Needed:**
{enhancement_needed}

**Additional Vedic Context:**
{corpus_context}

**Your Task:**
Rewrite the prediction to address the enhancement needed while:

1. **Maintaining the core insights** from the original
2. **Adding the missing elements** identified
3. **Improving readability** and user-friendliness
4. **Ensuring Vedic authenticity** using the corpus context
5. **Keeping the encouraging, hopeful tone**

Write the enhanced prediction now:
"""

        return prompt

    def get_category_title(self, category: str) -> str:
        """Get user-friendly title for category"""
        titles = {
            'karmic_journey': 'Your Soul\'s Beautiful Journey',
            'past_lives': 'Wisdom from Your Past',
            'present_life': 'Your Current Path',
            'future_lives': 'Hopeful Possibilities Ahead',
            'karmic_remedies': 'Gentle Practices for Wellbeing',
            'relationships': 'Heart-Centered Connections',
            'life_events': 'Life\'s Natural Flow'
        }
        return titles.get(category, category.replace('_', ' ').title())

    def get_category_description(self, category: str) -> str:
        """Get user-friendly description for category"""
        descriptions = {
            'karmic_journey': 'Discover your life\'s purpose and the beautiful lessons your soul is here to learn',
            'past_lives': 'Explore the wisdom and gifts you\'ve carried forward from your soul\'s journey',
            'present_life': 'Understand your current path and the opportunities that await you',
            'future_lives': 'Glimpse the hopeful possibilities and growth your soul may experience',
            'karmic_remedies': 'Learn gentle, practical ways to support your wellbeing and spiritual growth',
            'relationships': 'Understand your connection patterns and how to nurture healthy, loving relationships',
            'life_events': 'Discover the natural rhythms and timing of important life transitions'
        }
        return descriptions.get(category, f'Insights about your {category.replace("_", " ")}')

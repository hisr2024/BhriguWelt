"""
AI Service for secure AI integration
Handles AI-powered features with privacy controls
"""
import os
from typing import Dict, Any, List, Optional
from services.openai_service import openai_service
from services.bhrigu_core_wisdom import get_bhrigu_core_wisdom
from middleware.sanitizer import RequestSanitizer
from middleware.ai_constants import PII_FIELDS
import logging

logger = logging.getLogger(__name__)


class AIService:
    """
    Service for AI-powered features with privacy and security controls
    
    All methods ensure:
    - PII is redacted before API calls
    - Responses are sanitized
    - Graceful fallback to offline mode
    """
    
    def __init__(self):
        self.openai = openai_service
        self.ai_enabled = bool(os.getenv('OPENAI_API_KEY'))
        self.core_wisdom = None
        self.offline_ready = False
        try:
            self.core_wisdom = get_bhrigu_core_wisdom()
            self.offline_ready = True
        except Exception as exc:
            logger.warning(f"Core wisdom database unavailable: {exc}")
    
    def refine_report_section(
        self,
        section_type: str,
        astrological_data: Dict[str, Any],
        mode: str = 'hybrid'
    ) -> str:
        """
        Refine a specific report section using AI
        
        Args:
            section_type: Type of report section (e.g., 'karmic_journey', 'past_lives')
            astrological_data: Sanitized astrological data (no PII)
            mode: AI mode ('hybrid' or 'conversational')
        
        Returns:
            Refined report section text
        """
        if not self.ai_enabled:
            return self._offline_fallback(section_type, astrological_data)
        
        try:
            # Validate astrological data is sanitized
            self._validate_no_pii(astrological_data)
            
            # Build prompt based on section type
            prompt = self._build_section_prompt(section_type, astrological_data)
            
            # Get AI response
            response = self.openai.generate_prediction(prompt, astrological_data)
            
            # Sanitize response
            sanitized_response = RequestSanitizer.sanitize_ai_response(response)
            
            return sanitized_response
            
        except Exception as e:
            logger.error(f"AI refine error: {e}")
            return self._offline_fallback(section_type, astrological_data)
    
    def chat_response(
        self,
        user_message: str,
        astrological_data: Dict[str, Any],
        history: List[Dict[str, str]] = None
    ) -> str:
        """
        Generate conversational AI response about astrology report
        
        Args:
            user_message: User's question or message
            astrological_data: Sanitized astrological data
            history: Previous conversation messages
        
        Returns:
            AI response text
        """
        if not self.ai_enabled:
            return self._offline_chat_response(
                user_message=user_message,
                astrological_data=astrological_data,
                history=history or []
            )
        
        try:
            # Validate no PII
            self._validate_no_pii(astrological_data)
            
            # Build conversational prompt
            prompt = self._build_chat_prompt(
                user_message,
                astrological_data,
                history or []
            )
            
            # Get AI response
            response = self.openai.generate_prediction(prompt, astrological_data)
            
            # Sanitize response
            sanitized_response = RequestSanitizer.sanitize_ai_response(response)
            if not sanitized_response or not sanitized_response.strip():
                raise ValueError("Empty AI response")

            if "actionable" not in sanitized_response.lower():
                category = self._detect_chat_category(user_message)
                zodiac = astrological_data.get('zodiac_sign', 'your sign')
                moon_sign = astrological_data.get('moon_sign', 'your Moon sign')
                steps = "\n".join(self._actionable_next_steps(category, zodiac, moon_sign))
                sanitized_response = f"{sanitized_response.strip()}\n\nActionable Next Steps\n{steps}"

            return sanitized_response
            
        except Exception as e:
            logger.error(f"AI chat error: {e}")
            return self._offline_chat_response(
                user_message=user_message,
                astrological_data=astrological_data,
                history=history or []
            )
    
    def generate_summary(
        self,
        report_content: str,
        astrological_data: Dict[str, Any],
        summary_type: str = 'overview'
    ) -> str:
        """
        Generate AI-powered summary of report
        
        Args:
            report_content: Full report text to summarize
            astrological_data: Sanitized astrological data
            summary_type: Type of summary ('overview', 'key_insights', 'action_items', 'detailed')
        
        Returns:
            Summary text
        """
        if not self.ai_enabled:
            return self._generate_offline_summary(report_content, summary_type)
        
        try:
            # Validate no PII
            self._validate_no_pii(astrological_data)
            
            # Build summary prompt
            prompt = self._build_summary_prompt(
                report_content,
                astrological_data,
                summary_type
            )
            
            # Get AI response
            response = self.openai.generate_prediction(prompt, astrological_data)
            
            # Sanitize response
            sanitized_response = RequestSanitizer.sanitize_ai_response(response)
            
            return sanitized_response
            
        except Exception as e:
            logger.error(f"AI summary error: {e}")
            return self._generate_offline_summary(report_content, summary_type)
    
    def _validate_no_pii(self, data: Dict[str, Any]) -> None:
        """
        Validate that no PII is present in data
        Raises ValueError if PII detected
        """
        # Use centralized PII fields list
        for field in PII_FIELDS:
            if field in data:
                raise ValueError(f"PII field '{field}' should not be present")
    
    def _build_section_prompt(
        self,
        section_type: str,
        data: Dict[str, Any]
    ) -> str:
        """Build prompt for refining a report section"""
        
        prompts = {
            'karmic_journey': f"""
                Provide enhanced karmic journey insights based on:
                Zodiac Sign: {data.get('zodiac_sign', 'Unknown')}
                Nakshatra: {data.get('nakshatra', 'Unknown')}
                Moon Sign: {data.get('moon_sign', 'Unknown')}
                
                Focus on:
                1. Soul's purpose and mission
                2. Karmic lessons to learn
                3. Dharmic path guidance
                
                Provide compassionate, actionable insights.
            """,
            'past_lives': f"""
                Analyze past life influences based on:
                Zodiac Sign: {data.get('zodiac_sign', 'Unknown')}
                Nakshatra: {data.get('nakshatra', 'Unknown')}
                
                Explore:
                1. Significant past life patterns
                2. Karmic connections
                3. Talents and skills carried forward
            """,
            'present_life': f"""
                Provide present life guidance based on:
                Zodiac Sign: {data.get('zodiac_sign', 'Unknown')}
                Nakshatra: {data.get('nakshatra', 'Unknown')}
                Dasha Period: {data.get('dasha_period', 'Unknown')}
                
                Analyze:
                1. Current life phase and challenges
                2. Career and relationship guidance
                3. Spiritual growth opportunities
            """,
            'remedies': f"""
                Suggest Vedic remedies based on:
                Zodiac Sign: {data.get('zodiac_sign', 'Unknown')}
                Nakshatra: {data.get('nakshatra', 'Unknown')}
                
                Recommend:
                1. Mantras and meditations
                2. Gemstone therapy
                3. Lifestyle modifications
            """
        }
        
        return prompts.get(
            section_type,
            f"Provide astrological insights for {data.get('zodiac_sign', 'Unknown')}"
        )
    
    def _build_chat_prompt(
        self,
        message: str,
        data: Dict[str, Any],
        history: List[Dict[str, str]]
    ) -> str:
        """Build prompt for conversational AI"""
        
        # Build context from history
        context = ""
        if history:
            context = "Previous conversation:\n"
            for msg in history[-5:]:  # Last 5 messages only
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                context += f"{role}: {content}\n"
        
        wisdom_context = ""
        if self.core_wisdom:
            category = self._detect_chat_category(message)
            wisdom_payload = self.core_wisdom.get_wisdom_context_for_prediction(category, data)
            wisdom_context = self.core_wisdom.format_rules_for_prompt(wisdom_payload.get('rules', []))
            nakshatra_info = wisdom_payload.get('nakshatra_info', {}) or {}
            if nakshatra_info:
                wisdom_context += (
                    f"\n\nNakshatra context: {nakshatra_info.get('characteristics', '')} "
                    f"Deity: {nakshatra_info.get('deity', '')}."
                )

        prompt = f"""
        You are a compassionate Vedic astrology expert helping someone understand their birth chart.
        Ground every answer in Bhrigu Samhita and Nadi Jyotisha principles, using the core wisdom rules below.
        Use clear, readable language and end with an "Actionable Next Steps" list of 2-3 bullet points.
        
        Birth chart summary:
        - Zodiac Sign: {data.get('zodiac_sign', 'Unknown')}
        - Nakshatra: {data.get('nakshatra', 'Unknown')}
        - Moon Sign: {data.get('moon_sign', 'Unknown')}
        - Ascendant: {data.get('ascendant', 'Unknown')}

        {wisdom_context}

        {context}
        
        User question: {message}
        
        Provide a helpful, compassionate response focused on their astrological insights.
        """
        
        return prompt

    def _detect_chat_category(self, message: str) -> str:
        message_lower = message.lower()
        if any(word in message_lower for word in ['past life', 'past lives', 'previous incarnation']):
            return 'past_lives'
        if any(word in message_lower for word in ['future life', 'future lives', 'next life', 'moksha']):
            return 'future_lives'
        if any(word in message_lower for word in ['relationship', 'marriage', 'partner', 'love']):
            return 'relationships'
        if any(word in message_lower for word in ['remedy', 'mantra', 'gemstone', 'puja', 'ritual']):
            return 'karmic_remedies'
        if any(word in message_lower for word in ['career', 'profession', 'job', 'wealth', 'money']):
            return 'present_life'
        if any(word in message_lower for word in ['daily', 'weekly', 'monthly', 'yearly', 'horoscope']):
            return 'predictions'
        return 'karmic_journey'

    def _offline_chat_response(
        self,
        user_message: str,
        astrological_data: Dict[str, Any],
        history: List[Dict[str, str]]
    ) -> str:
        """Generate offline chat response using Bhrigu core wisdom database."""
        zodiac = astrological_data.get('zodiac_sign', 'Unknown')
        moon_sign = astrological_data.get('moon_sign', zodiac)
        ascendant = astrological_data.get('ascendant', 'Unknown')
        nakshatra = astrological_data.get('nakshatra', 'Unknown')
        category = self._detect_chat_category(user_message)

        if not self.core_wisdom:
            fallback_steps = "\n".join(self._actionable_next_steps(category))
            return (
                "The Bhrigu core wisdom database is unavailable right now. "
                "Here is a gentle, practical outline you can use while we reconnect:\n\n"
                f"Actionable Next Steps:\n{fallback_steps}\n\n"
                "Please try again later for a detailed Bhrigu/Nadi reading."
            )

        wisdom_payload = self.core_wisdom.get_wisdom_context_for_prediction(category, astrological_data)
        rules = wisdom_payload.get('rules', [])[:3]
        remedies = wisdom_payload.get('remedies', [])[:3]
        citations = wisdom_payload.get('citations', [])[:3]
        nakshatra_info = wisdom_payload.get('nakshatra_info', {}) or {}

        rules_lines = []
        for rule in rules:
            narrative = rule.get('narrative_template') or rule.get('description') or ''
            rule_id = rule.get('rule_id', 'Rule')
            tradition = rule.get('tradition', 'Bhrigu/Nadi')
            if narrative:
                rules_lines.append(f"- {rule_id} ({tradition}): {narrative}")

        remedy_lines = []
        for remedy in remedies:
            data = remedy.get('data', {})
            title = ''
            description = ''
            if isinstance(data, dict):
                title = data.get('name') or data.get('title') or data.get('mantra') or data.get('gemstone') or ''
                description = data.get('description') or data.get('meaning') or data.get('use') or ''
            else:
                title = str(data)
            line = f"- {title}" if title else "- Traditional remedy"
            if description:
                line += f": {description}"
            remedy_lines.append(line)

        citation_text = ", ".join(citations) if citations else "Bhrigu Samhita & Nadi Jyotisa core rules"
        nakshatra_focus = nakshatra_info.get('characteristics') or nakshatra_info.get('career') or 'unique spiritual gifts'

        actionable_steps = "\n".join(self._actionable_next_steps(category, zodiac, moon_sign))
        return f"""## Bhrigu-Nadi Guidance (Offline Wisdom)

**Chart Snapshot:** Sun/Zodiac {zodiac}, Moon {moon_sign}, Ascendant {ascendant}, Nakshatra {nakshatra}.
**Nakshatra Focus:** {nakshatra_focus}.

### Key Principles Activated
{chr(10).join(rules_lines) if rules_lines else "- Core spiritual alignment and karmic duty are emphasized."}

### Guidance for Your Question
Your inquiry points toward **{category.replace('_', ' ')}** themes. In Bhrigu Samhita and Nadi Jyotisa, this area is refined by steady self-discipline, timing awareness, and honoring your dharmic responsibilities. Use your {zodiac} strengths with the emotional steadiness of {moon_sign} to stay grounded while you act.

### Remedies & Practices
{chr(10).join(remedy_lines) if remedy_lines else "- Daily mantra, mindful routines, and disciplined action are advised."}

### Actionable Next Steps
{actionable_steps}

**References:** {citation_text}
"""

    def _actionable_next_steps(
        self,
        category: str,
        zodiac: str = "your sign",
        moon_sign: str = "your Moon sign"
    ) -> List[str]:
        steps_by_category = {
            'past_lives': [
                "Journal recurring life patterns and note how they mirror current choices.",
                "Spend 10 minutes in quiet reflection to release past-life fears.",
                "Choose one habit that closes a lingering karmic loop and act on it this week."
            ],
            'future_lives': [
                "Clarify one long-term intention and align this week's actions with it.",
                "Practice a grounding ritual each morning to stabilize future-focused energy.",
                "Select a service-oriented goal that strengthens your dharma."
            ],
            'relationships': [
                "Name one relationship boundary that supports emotional steadiness.",
                "Schedule a meaningful conversation to clarify expectations.",
                "Offer a small act of service to strengthen trust."
            ],
            'karmic_remedies': [
                "Begin a 7-day mantra or meditation routine at a consistent time.",
                "Limit one draining habit and replace it with a supportive ritual.",
                "Choose a charity or seva practice aligned with your values."
            ],
            'present_life': [
                "Prioritize one career or life goal and outline three next actions.",
                "Balance {zodiac} initiative with {moon_sign} emotional pacing.",
                "Review your weekly schedule to protect time for spiritual practices."
            ],
            'predictions': [
                "Set a weekly intention and review it every evening.",
                "Track one mood or energy pattern to sync with planetary rhythms.",
                "Make one practical adjustment that supports stability."
            ],
            'karmic_journey': [
                "Write a short statement of your soul purpose and read it daily.",
                "Commit to one spiritual practice that keeps you aligned with dharma.",
                "Identify a mentor or guide who supports your growth."
            ],
        }
        steps = steps_by_category.get(category, steps_by_category['karmic_journey'])
        return [f"- {step.format(zodiac=zodiac, moon_sign=moon_sign)}" for step in steps]
    
    def _build_summary_prompt(
        self,
        content: str,
        data: Dict[str, Any],
        summary_type: str
    ) -> str:
        """Build prompt for report summary"""
        
        prompts = {
            'overview': f"""
                Provide a concise overview summary of this astrological report.
                Focus on the most important insights and key themes.
                
                Report content:
                {content[:2000]}  # Limit content size
            """,
            'key_insights': f"""
                Extract and list the key insights from this astrological report.
                Present them as actionable bullet points.
                
                Report content:
                {content[:2000]}
            """,
            'action_items': f"""
                From this astrological report, identify specific action items
                and recommendations the person can implement.
                
                Report content:
                {content[:2000]}
            """,
            'detailed': f"""
                Provide a detailed summary that captures all major themes
                and insights from this astrological report.
                
                Report content:
                {content[:2000]}
            """
        }
        
        return prompts.get(summary_type, prompts['overview'])
    
    def _offline_fallback(
        self,
        section_type: str,
        data: Dict[str, Any]
    ) -> str:
        """Fallback response when AI is unavailable"""
        
        fallback_messages = {
            'karmic_journey': f"""
                Based on traditional Vedic astrology for {data.get('zodiac_sign', 'your sign')}:
                
                Your karmic journey is influenced by your nakshatra {data.get('nakshatra', '')}.
                Focus on fulfilling your dharmic duties and learning life lessons with patience.
                Spiritual growth comes through self-awareness and service to others.
            """,
            'past_lives': f"""
                Traditional analysis suggests that {data.get('zodiac_sign', 'your sign')} 
                individuals carry forward specific karmic patterns.
                
                Reflect on recurring themes in your life as they may indicate 
                unresolved karmic patterns from previous incarnations.
            """,
            'present_life': f"""
                Your current life phase as {data.get('zodiac_sign', 'your sign')} 
                is best understood through your dasha period.
                
                Focus on personal growth, career advancement, and spiritual development
                according to traditional Vedic principles.
            """,
            'remedies': f"""
                Traditional Vedic remedies for {data.get('zodiac_sign', 'your sign')}:
                
                - Daily meditation and mantra practice
                - Gemstone therapy as per your chart
                - Charitable acts and service
                - Fasting on specific days
            """
        }
        
        return fallback_messages.get(
            section_type,
            "Traditional Vedic analysis available. Enable AI for enhanced insights."
        )
    
    def _generate_offline_summary(
        self,
        content: str,
        summary_type: str
    ) -> str:
        """Generate basic summary without AI"""
        
        # Simple extraction of first few sentences
        sentences = content.split('.')[:3]
        basic_summary = '. '.join(sentences) + '.'
        
        return f"{basic_summary}\n\nNote: Enable AI features for enhanced summaries."

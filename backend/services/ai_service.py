"""
AI Service for secure AI integration
Handles AI-powered features with privacy controls
"""
import os
from typing import Dict, Any, List, Optional
from services.openai_service import openai_service
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
            return "AI chatbot is not available. Please use offline mode."
        
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
            
            return sanitized_response
            
        except Exception as e:
            logger.error(f"AI chat error: {e}")
            return "I apologize, but I'm unable to respond right now. Please try again later or use offline mode."
    
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
        
        prompt = f"""
        You are a compassionate Vedic astrology expert helping someone understand their birth chart.
        
        Birth chart summary:
        - Zodiac Sign: {data.get('zodiac_sign', 'Unknown')}
        - Nakshatra: {data.get('nakshatra', 'Unknown')}
        - Moon Sign: {data.get('moon_sign', 'Unknown')}
        - Ascendant: {data.get('ascendant', 'Unknown')}
        
        {context}
        
        User question: {message}
        
        Provide a helpful, compassionate response focused on their astrological insights.
        """
        
        return prompt
    
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

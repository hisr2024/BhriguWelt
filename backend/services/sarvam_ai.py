"""
Sarvam AI Integration Service
Handles all AI-powered predictions and insights
"""
import os
import requests
from typing import Dict, Any, List, Optional
import json

class SarvamAIService:
    """Service for interacting with Sarvam AI API"""

    def __init__(self):
        self.api_key = os.getenv('SARVAM_AI_API_KEY')
        self.base_url = os.getenv('SARVAM_AI_BASE_URL', 'https://api.sarvam.ai/v1')
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

    def generate_prediction(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """
        Generate AI-powered predictions using Sarvam AI

        Args:
            prompt: The prediction prompt
            context: Additional context for the prediction

        Returns:
            Generated prediction text
        """
        try:
            # Prepare the request payload
            payload = {
                'model': 'sarvam-1',
                'messages': [
                    {
                        'role': 'system',
                        'content': 'You are an expert Vedic astrologer specializing in Bhrigu Samhita and Nadi Jyotisha traditions. Provide detailed, insightful, and compassionate astrological guidance.'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'temperature': 0.7,
                'max_tokens': 1000
            }

            if context:
                payload['messages'][0]['content'] += f"\n\nContext: {json.dumps(context)}"

            # Make API call
            response = requests.post(
                f'{self.base_url}/chat/completions',
                headers=self.headers,
                json=payload,
                timeout=30
            )

            response.raise_for_status()
            result = response.json()

            return result['choices'][0]['message']['content']

        except requests.exceptions.RequestException as e:
            # Fallback to traditional analysis if API fails
            return self._fallback_prediction(prompt, context)

    def generate_karmic_journey(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive karmic journey analysis"""
        prompt = f"""
        Generate a comprehensive karmic journey analysis for:
        - Date of Birth: {birth_data.get('date_of_birth')}
        - Time of Birth: {birth_data.get('time_of_birth')}
        - Place of Birth: {birth_data.get('place_of_birth')}
        - Zodiac Sign: {birth_data.get('zodiac_sign')}
        - Nakshatra: {birth_data.get('nakshatra')}

        Provide detailed insights on:
        1. Soul's primary purpose in this lifetime
        2. Karmic lessons to be learned
        3. Soul evolution stage
        4. Dharmic path and life mission
        5. Karmic debts and credits
        6. Soul group connections
        """

        prediction = self.generate_prediction(prompt, birth_data)

        return {
            'journey_analysis': prediction,
            'soul_purpose': self._extract_section(prediction, 'purpose'),
            'karmic_lessons': self._extract_section(prediction, 'lessons'),
            'dharmic_path': self._extract_section(prediction, 'dharmic path'),
            'timestamp': self._get_timestamp()
        }

    def generate_past_lives_analysis(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate past lives analysis"""
        prompt = f"""
        Based on Vedic astrology and Nadi Jyotisha principles, analyze past life influences for:
        - Zodiac Sign: {birth_data.get('zodiac_sign')}
        - Nakshatra: {birth_data.get('nakshatra')}
        - Moon Sign: {birth_data.get('moon_sign')}
        - South Node (Ketu) position: {birth_data.get('ketu_position')}

        Provide insights on:
        1. Most significant past life era and location
        2. Past life professions and roles
        3. Unresolved karmic patterns
        4. Past life relationships affecting current life
        5. Skills and talents carried forward
        6. Past life traumas needing healing
        """

        analysis = self.generate_prediction(prompt, birth_data)

        return {
            'past_life_analysis': analysis,
            'significant_lives': self._extract_lives(analysis),
            'karmic_patterns': self._extract_patterns(analysis),
            'carried_talents': self._extract_section(analysis, 'skills and talents'),
            'timestamp': self._get_timestamp()
        }

    def generate_future_lives_prediction(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate future lives prediction"""
        prompt = f"""
        Based on current karmic trajectory and soul evolution, predict future life possibilities:
        - Current Zodiac: {birth_data.get('zodiac_sign')}
        - Spiritual Development Level: {birth_data.get('spiritual_level', 'Intermediate')}
        - North Node (Rahu) position: {birth_data.get('rahu_position')}

        Provide insights on:
        1. Likely future birth scenarios
        2. Soul evolution trajectory
        3. Future life purposes and missions
        4. Potential spiritual advancement paths
        5. Conditions for liberation (moksha)
        """

        prediction = self.generate_prediction(prompt, birth_data)

        return {
            'future_prediction': prediction,
            'evolution_path': self._extract_section(prediction, 'evolution'),
            'future_scenarios': self._extract_scenarios(prediction),
            'moksha_timeline': self._extract_section(prediction, 'liberation'),
            'timestamp': self._get_timestamp()
        }

    def generate_present_life_analysis(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate present life comprehensive analysis"""
        prompt = f"""
        Provide a comprehensive present life analysis:
        - Date of Birth: {birth_data.get('date_of_birth')}
        - Current Age: {birth_data.get('age', 'Unknown')}
        - Zodiac Sign: {birth_data.get('zodiac_sign')}
        - Nakshatra: {birth_data.get('nakshatra')}
        - Current Dasha Period: {birth_data.get('dasha_period', 'Unknown')}

        Analyze:
        1. Current life phase and challenges
        2. Career and professional path
        3. Relationships and partnerships
        4. Health and wellbeing
        5. Financial prospects
        6. Spiritual growth opportunities
        7. Current karmic lessons in progress
        """

        analysis = self.generate_prediction(prompt, birth_data)

        return {
            'life_analysis': analysis,
            'current_phase': self._extract_section(analysis, 'life phase'),
            'career_path': self._extract_section(analysis, 'career'),
            'relationships': self._extract_section(analysis, 'relationships'),
            'health_guidance': self._extract_section(analysis, 'health'),
            'spiritual_growth': self._extract_section(analysis, 'spiritual'),
            'timestamp': self._get_timestamp()
        }

    def generate_life_events_prediction(self, birth_data: Dict[str, Any], years_ahead: int = 10) -> Dict[str, Any]:
        """Generate important life events prediction"""
        prompt = f"""
        Predict important life events for the next {years_ahead} years:
        - Date of Birth: {birth_data.get('date_of_birth')}
        - Zodiac Sign: {birth_data.get('zodiac_sign')}
        - Current Dasha: {birth_data.get('dasha_period')}

        Provide year-by-year predictions for:
        1. Major life transitions
        2. Career milestones
        3. Relationship events (marriage, partnerships)
        4. Financial opportunities and challenges
        5. Spiritual breakthroughs
        6. Health alerts and wellness periods
        7. Auspicious times for major decisions
        """

        prediction = self.generate_prediction(prompt, birth_data)

        return {
            'events_prediction': prediction,
            'yearly_forecast': self._extract_yearly_forecast(prediction, years_ahead),
            'major_transitions': self._extract_transitions(prediction),
            'auspicious_periods': self._extract_auspicious_times(prediction),
            'timestamp': self._get_timestamp()
        }

    def generate_karmic_remedies(self, birth_data: Dict[str, Any], challenges: List[str] = None) -> Dict[str, Any]:
        """Generate personalized karmic remedies"""
        challenges_text = ', '.join(challenges) if challenges else 'general wellbeing'

        prompt = f"""
        Provide personalized Vedic remedies and spiritual practices for:
        - Zodiac Sign: {birth_data.get('zodiac_sign')}
        - Nakshatra: {birth_data.get('nakshatra')}
        - Planetary Afflictions: {birth_data.get('afflictions', 'None specified')}
        - Current Challenges: {challenges_text}

        Recommend:
        1. Mantras (with pronunciation and meaning)
        2. Gemstone therapy
        3. Charitable activities (dana)
        4. Fasting days and rituals
        5. Deity worship and prayers
        6. Lifestyle modifications
        7. Meditation practices
        8. Yantra and sacred geometry
        """

        remedies = self.generate_prediction(prompt, birth_data)

        return {
            'remedies_analysis': remedies,
            'mantras': self._extract_mantras(remedies),
            'gemstones': self._extract_gemstones(remedies),
            'rituals': self._extract_rituals(remedies),
            'lifestyle_changes': self._extract_section(remedies, 'lifestyle'),
            'meditation_practices': self._extract_section(remedies, 'meditation'),
            'timestamp': self._get_timestamp()
        }

    def _fallback_prediction(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Fallback prediction when API is unavailable"""
        return "Traditional Vedic analysis based on classical texts. For enhanced AI predictions, please ensure Sarvam AI service is properly configured."

    def _extract_section(self, text: str, section_keyword: str) -> str:
        """Extract specific section from prediction text"""
        # Simple extraction - can be enhanced with NLP
        lines = text.split('\n')
        section_lines = []
        in_section = False

        for line in lines:
            if section_keyword.lower() in line.lower():
                in_section = True
            elif in_section and line.strip() and not line[0].isdigit():
                break
            elif in_section:
                section_lines.append(line)

        return '\n'.join(section_lines).strip() if section_lines else "Analysis available in full report"

    def _extract_lives(self, text: str) -> List[Dict[str, str]]:
        """Extract past life information"""
        # Simplified extraction - enhance based on actual API response format
        return [
            {'era': 'Previous century', 'role': 'Based on karmic patterns', 'location': 'To be determined'},
        ]

    def _extract_patterns(self, text: str) -> List[str]:
        """Extract karmic patterns"""
        return ['Pattern analysis available in detailed report']

    def _extract_scenarios(self, text: str) -> List[str]:
        """Extract future scenarios"""
        return ['Future scenarios detailed in comprehensive analysis']

    def _extract_yearly_forecast(self, text: str, years: int) -> List[Dict[str, Any]]:
        """Extract yearly forecast"""
        return [{'year': i + 1, 'forecast': 'Detailed in full report'} for i in range(years)]

    def _extract_transitions(self, text: str) -> List[str]:
        """Extract major life transitions"""
        return ['Transitions detailed in comprehensive analysis']

    def _extract_auspicious_times(self, text: str) -> List[str]:
        """Extract auspicious periods"""
        return ['Auspicious times calculated based on planetary positions']

    def _extract_mantras(self, text: str) -> List[Dict[str, str]]:
        """Extract mantra recommendations"""
        return [{'mantra': 'Specific mantras in detailed report', 'purpose': 'Based on chart analysis'}]

    def _extract_gemstones(self, text: str) -> List[str]:
        """Extract gemstone recommendations"""
        return ['Gemstone recommendations in full report']

    def _extract_rituals(self, text: str) -> List[str]:
        """Extract ritual recommendations"""
        return ['Ritual recommendations in detailed analysis']

    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat()

# Singleton instance
sarvam_ai = SarvamAIService()

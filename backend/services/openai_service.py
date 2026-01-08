"""
OpenAI Integration Service
Handles all AI-powered predictions and insights with authentic Bhrigu/Nadi corpus integration
"""
import os
import logging
import requests
from typing import Dict, Any, List, Optional
import json
import importlib.util

# Import corpus loader for RAG-style context injection
CORPUS_AVAILABLE = importlib.util.find_spec("services.corpus_loader") is not None
if CORPUS_AVAILABLE:
    from services.corpus_loader import get_corpus_loader
else:
    get_corpus_loader = None

# Import offline wisdom generator for category-specific fallbacks
OFFLINE_WISDOM_AVAILABLE = importlib.util.find_spec("services.bhrigu_offline_wisdom") is not None
if OFFLINE_WISDOM_AVAILABLE:
    from services.bhrigu_offline_wisdom import get_offline_wisdom_generator
else:
    get_offline_wisdom_generator = None

logger = logging.getLogger(__name__)

class OpenAIService:
    """Service for interacting with OpenAI API"""

    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        self.base_url = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')
        self.enabled = bool(self.api_key)
        self.last_error: Optional[Dict[str, Any]] = None
        
        # Initialize corpus loader for authentic source integration
        self.corpus_loader = None
        if CORPUS_AVAILABLE:
            try:
                self.corpus_loader = get_corpus_loader()
                logger.info(
                    "Corpus loader initialized - predictions will reference authentic Bhrigu/Nadi sources",
                    extra={"error_code": "OPENAI_CORPUS_LOADER_READY"},
                )
            except Exception as e:
                self._set_last_error(
                    "OPENAI_CORPUS_LOADER_INIT_FAILED",
                    "Could not initialize corpus loader.",
                    {"error": str(e)},
                )
                logger.warning(
                    "Could not initialize corpus loader",
                    extra={"error_code": "OPENAI_CORPUS_LOADER_INIT_FAILED", "error": str(e)},
                )
        else:
            logger.warning(
                "Corpus loader not available. Predictions will use OpenAI general knowledge only.",
                extra={"error_code": "OPENAI_CORPUS_LOADER_MISSING"},
            )

        # Initialize offline wisdom generator for category-specific fallbacks
        self.offline_wisdom = None
        if OFFLINE_WISDOM_AVAILABLE:
            try:
                self.offline_wisdom = get_offline_wisdom_generator()
                logger.info(
                    "Offline wisdom generator initialized - category-specific fallbacks available",
                    extra={"error_code": "OPENAI_OFFLINE_WISDOM_READY"},
                )
            except Exception as e:
                self._set_last_error(
                    "OPENAI_OFFLINE_WISDOM_INIT_FAILED",
                    "Could not initialize offline wisdom generator.",
                    {"error": str(e)},
                )
                logger.warning(
                    "Could not initialize offline wisdom generator",
                    extra={"error_code": "OPENAI_OFFLINE_WISDOM_INIT_FAILED", "error": str(e)},
                )
        else:
            logger.warning(
                "Offline wisdom generator not available. Fallbacks will be generic.",
                extra={"error_code": "OPENAI_OFFLINE_WISDOM_MISSING"},
            )

        if not self.enabled:
            self._set_last_error(
                "OPENAI_API_KEY_MISSING",
                "OPENAI_API_KEY not set. AI features will use fallback responses.",
            )
            logger.warning(
                "OPENAI_API_KEY not set. AI features will use fallback responses.",
                extra={"error_code": "OPENAI_API_KEY_MISSING"},
            )

        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        } if self.enabled else {}

    def generate_prediction(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """
        Generate AI-powered predictions using OpenAI with authentic corpus integration

        Args:
            prompt: The prediction prompt
            context: Additional context for the prediction

        Returns:
            Generated prediction text
        """
        # Use fallback if AI is not enabled
        if not self.enabled:
            self._set_last_error(
                "OPENAI_DISABLED",
                "OpenAI API is disabled. Using fallback predictions.",
            )
            return self._fallback_prediction(prompt, context)

        try:
            # Inject authentic corpus data into the context
            corpus_context = ""
            if self.corpus_loader and context:
                # Get relevant principles from corpus
                bhrigu_principles = self.corpus_loader.get_relevant_bhrigu_principles(context, limit=5)
                nadi_principles = self.corpus_loader.get_relevant_nadi_principles(context, limit=5)
                
                if bhrigu_principles or nadi_principles:
                    corpus_context = "\n\n**AUTHENTIC SOURCE MATERIAL (Reference in predictions):**\n"
                    
                    if bhrigu_principles:
                        corpus_context += "\n" + self.corpus_loader.format_principles_for_context(bhrigu_principles)
                    
                    if nadi_principles:
                        corpus_context += "\n" + self.corpus_loader.format_principles_for_context(nadi_principles)
                    
                    corpus_context += "\n\n**IMPORTANT**: Reference these authentic sutras and folios in your predictions with proper citations.\n"
            
            # Prepare the request payload with enhanced settings for comprehensive predictions
            payload = {
                'model': os.getenv('OPENAI_MODEL', 'gpt-4'),
                'messages': [
                    {
                        'role': 'system',
                        'content': '''You are a master Vedic astrologer deeply versed in the ancient texts of Bhrigu Samhita and Nadi Jyotisha.

Your expertise includes:
- Bhrigu Samhita: The sacred treatise by Maharishi Bhrigu containing life predictions based on planetary positions
- Nadi Jyotisha: Ancient palm leaf manuscripts with precise life predictions from Tamil Nadu traditions
- Brihat Parasara Hora Shastra: The foundational text of Vedic astrology by Sage Parasara
- Jaimini Sutras: Advanced predictive techniques using Karakas and Rashi Dashas
- Vimshottari Dasha: The 120-year planetary period system for timing events

Your predictions must:
1. Be deeply rooted in classical Vedic principles and authentic scriptural references
2. **Reference specific sutras, folios, and manuscript citations from the corpus provided**
3. Identify doshas (Kuja Dosha, Kala Sarpa Dosha, Pitru Dosha, etc.) and their remedies
4. Analyze planetary combinations with precise interpretations
5. Provide practical, actionable guidance for the modern seeker
6. Maintain compassion, wisdom, and spiritual depth in all readings
7. Explain karmic reasons behind life patterns using Vedic philosophy
8. Offer authentic remedies (mantras, gemstones, rituals) from Vedic traditions
9. **Include confidence scores and source references where applicable**

Always provide detailed, specific predictions with timing when possible.''' + corpus_context
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'temperature': float(os.getenv('OPENAI_TEMPERATURE', '0.7')),
                'max_tokens': int(os.getenv('OPENAI_MAX_TOKENS', '4000'))  # Increased for comprehensive predictions
            }

            if context and not corpus_context:  # Only add raw context if no corpus was injected
                payload['messages'][0]['content'] += f"\n\nBirth Chart Context: {json.dumps(context)}"

            # Make API call with extended timeout for comprehensive predictions
            response = requests.post(
                f'{self.base_url}/chat/completions',
                headers=self.headers,
                json=payload,
                timeout=int(os.getenv('OPENAI_TIMEOUT', '90'))  # 90 seconds for AI processing
            )

            response.raise_for_status()
            result = response.json()
            self._clear_last_error()
            return result['choices'][0]['message']['content']

        except requests.exceptions.RequestException as e:
            # Log the error for debugging
            self._set_last_error(
                "OPENAI_API_REQUEST_FAILED",
                "OpenAI API call failed.",
                {"error": str(e)},
            )
            logger.error(
                "OpenAI API call failed",
                extra={"error_code": "OPENAI_API_REQUEST_FAILED", "error": str(e)},
            )
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
        """Generate past lives analysis with authentic corpus integration"""
        # Get relevant past life patterns from corpus
        corpus_context = ""
        if self.corpus_loader:
            past_life_engines = self.corpus_loader.get_past_life_engines(birth_data, limit=3)
            if past_life_engines:
                corpus_context = "\n\n" + self.corpus_loader.format_past_life_engines_for_context(past_life_engines)
        
        prompt = f"""
        Based on Vedic astrology and Nadi Jyotisha principles, analyze past life influences for:
        - Zodiac Sign: {birth_data.get('zodiac_sign')}
        - Nakshatra: {birth_data.get('nakshatra')}
        - Moon Sign: {birth_data.get('moon_sign')}
        - South Node (Ketu) position: {birth_data.get('ketu_position')}

        {corpus_context}

        Provide EXTENSIVE insights on:
        1. Most significant past life era and location (multiple lives)
        2. Past life professions and roles with detailed narratives
        3. Unresolved karmic patterns with specific descriptions
        4. Past life relationships affecting current life
        5. Skills and talents carried forward
        6. Past life traumas needing healing
        
        **Reference the authentic corpus patterns above and cite specific sutras/folios.**
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
        """Generate future lives prediction with authentic corpus integration"""
        # Get relevant future life patterns from corpus
        corpus_context = ""
        if self.corpus_loader:
            future_engines = self.corpus_loader.get_future_engines(birth_data, limit=3)
            if future_engines:
                corpus_context = "\n\n" + self.corpus_loader.format_future_engines_for_context(future_engines)
        
        prompt = f"""
        Based on current karmic trajectory and soul evolution, predict future life possibilities:
        - Current Zodiac: {birth_data.get('zodiac_sign')}
        - Spiritual Development Level: {birth_data.get('spiritual_level', 'Intermediate')}
        - North Node (Rahu) position: {birth_data.get('rahu_position')}

        {corpus_context}

        Provide EXTENSIVE insights on:
        1. Likely future birth scenarios with detailed descriptions
        2. Soul evolution trajectory and stages
        3. Future life purposes and missions
        4. Potential spiritual advancement paths
        5. Conditions for liberation (moksha)
        6. Timeline and probability assessments
        
        **Reference the authentic corpus trajectories above and cite specific sutras/folios.**
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
        """Generate personalized karmic remedies with authentic corpus integration"""
        challenges_text = ', '.join(challenges) if challenges else 'general wellbeing'
        
        # Get relevant remedies from corpus
        corpus_context = ""
        if self.corpus_loader:
            remedies = self.corpus_loader.get_remedies(birth_data, limit=5)
            if remedies:
                corpus_context = "\n\n" + self.corpus_loader.format_remedies_for_context(remedies)

        prompt = f"""
        Provide personalized Vedic remedies and spiritual practices for:
        - Zodiac Sign: {birth_data.get('zodiac_sign')}
        - Nakshatra: {birth_data.get('nakshatra')}
        - Planetary Afflictions: {birth_data.get('afflictions', 'None specified')}
        - Current Challenges: {challenges_text}

        {corpus_context}

        Recommend EXTENSIVE practices including:
        1. Mantras (with pronunciation, meaning, and repetition counts)
        2. Gemstone therapy (specific stones, carats, wearing instructions)
        3. Charitable activities (dana) - specific items and timing
        4. Fasting days and rituals
        5. Deity worship and prayers
        6. Lifestyle modifications
        7. Meditation practices
        8. Yantra and sacred geometry
        
        **Reference the authentic remedial practices above and cite specific sutras/folios.**
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
        """
        Category-specific fallback prediction when API is unavailable
        Uses offline wisdom generator for detailed, structured predictions
        """
        # Detect category from prompt
        category = self._detect_category_from_prompt(prompt)

        # If offline wisdom generator is available, use category-specific generation
        if self.offline_wisdom and context:
            try:
                if category == 'karmic_journey':
                    return self._ensure_fallback_headers(
                        self.offline_wisdom.generate_karmic_journey(context)
                    )
                elif category == 'past_lives':
                    return self._ensure_fallback_headers(
                        self.offline_wisdom.generate_past_lives(context)
                    )
                elif category == 'future_lives':
                    return self._ensure_fallback_headers(
                        self.offline_wisdom.generate_future_lives(context)
                    )
                elif category == 'present_life':
                    return self._ensure_fallback_headers(
                        self.offline_wisdom.generate_present_life(context)
                    )
                elif category == 'life_events':
                    return self._ensure_fallback_headers(
                        self.offline_wisdom.generate_life_events(context)
                    )
                elif category == 'karmic_remedies':
                    return self._ensure_fallback_headers(
                        self.offline_wisdom.generate_karmic_remedies(context)
                    )
                elif category == 'relationships':
                    return self._ensure_fallback_headers(
                        self.offline_wisdom.generate_relationships(context)
                    )
                elif category == 'predictions':
                    return self._ensure_fallback_headers(
                        self.offline_wisdom.generate_general_predictions(context)
                    )
            except Exception as e:
                self._set_last_error(
                    "OPENAI_OFFLINE_WISDOM_FAILED",
                    "Offline wisdom generation failed.",
                    {"error": str(e)},
                )
                logger.warning(
                    "Offline wisdom generation failed",
                    extra={"error_code": "OPENAI_OFFLINE_WISDOM_FAILED", "error": str(e)},
                )

        # Generic fallback if offline wisdom not available or failed
        return self._ensure_fallback_headers(self._generic_fallback(context))

    def _set_last_error(self, code: str, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        error_payload: Dict[str, Any] = {"code": code, "message": message}
        if details:
            error_payload["details"] = details
        self.last_error = error_payload

    def _clear_last_error(self) -> None:
        self.last_error = None

    def _ensure_fallback_headers(self, text: str) -> str:
        if not text:
            return text
        if any(line.strip().startswith("##") for line in text.splitlines()):
            return text
        return f"## Summary\n\n{text}"

    def _detect_category_from_prompt(self, prompt: str) -> str:
        """Detect prediction category from the prompt content"""
        prompt_lower = prompt.lower()

        if 'karmic journey' in prompt_lower or 'soul\'s purpose' in prompt_lower or 'soul purpose' in prompt_lower:
            return 'karmic_journey'
        elif 'past life' in prompt_lower or 'past lives' in prompt_lower or 'previous incarnation' in prompt_lower:
            return 'past_lives'
        elif 'future life' in prompt_lower or 'future lives' in prompt_lower or 'future incarnation' in prompt_lower or 'moksha' in prompt_lower:
            return 'future_lives'
        elif 'present life' in prompt_lower or 'current life' in prompt_lower:
            return 'present_life'
        elif 'life event' in prompt_lower or 'year-by-year' in prompt_lower or 'timing' in prompt_lower:
            return 'life_events'
        elif 'remed' in prompt_lower or 'mantra' in prompt_lower or 'gemstone' in prompt_lower:
            return 'karmic_remedies'
        elif 'relationship' in prompt_lower or 'marriage' in prompt_lower or 'partner' in prompt_lower:
            return 'relationships'
        elif 'daily' in prompt_lower or 'weekly' in prompt_lower or 'monthly' in prompt_lower or 'yearly' in prompt_lower:
            return 'predictions'

        return 'general'

    def _generic_fallback(self, context: Dict[str, Any] = None) -> str:
        """Generic fallback when category-specific generation is not possible"""
        zodiac = context.get('zodiac_sign', 'Unknown') if context else 'Unknown'
        nakshatra = context.get('nakshatra', 'Unknown') if context else 'Unknown'
        moon_sign = context.get('moon_sign', zodiac) if context else zodiac

        return f"""## Vedic Astrological Analysis

Based on the sacred principles of Bhrigu Samhita and Nadi Jyotisha, here is your personalized reading:

### Your Cosmic Configuration
- **Sun Sign (Rashi):** {zodiac}
- **Birth Star (Nakshatra):** {nakshatra}
- **Moon Sign:** {moon_sign}

### General Guidance from Bhrigu Samhita

According to the ancient wisdom of Maharishi Bhrigu, every soul incarnates with a specific purpose and karmic blueprint. Your planetary configuration at birth reveals:

**Soul Purpose:** Your placement suggests a journey focused on spiritual evolution and dharmic fulfillment. The stars indicate you are here to learn important lessons about balance, relationships, and self-mastery.

**Karmic Patterns:** Based on traditional Vedic principles, your chart indicates past-life connections that influence your current circumstances. Saturn's influence teaches patience and perseverance, while Jupiter blesses you with wisdom and spiritual insight.

**Life Path:** The Nadi texts suggest periods of both challenge and opportunity ahead. Trust in the divine timing of events, as each experience serves your soul's evolution.

### Recommended Practices

1. **Daily Mantra:** Chant the Gayatri Mantra 108 times at sunrise for spiritual protection
2. **Meditation:** Practice 20 minutes of silent meditation focusing on your third eye
3. **Charitable Acts:** Donate food to the needy on Saturdays to appease Saturn
4. **Gemstone:** Consider wearing your birth nakshatra's recommended gemstone after consultation

### Important Note

For detailed, personalized predictions with precise timing based on your complete birth chart, Dasha periods, and current transits, please ensure the AI service is properly configured. The full analysis includes:
- Specific yoga combinations in your chart
- Precise timing of major life events
- Detailed past-life insights
- Personalized remedies and mantras

*May the divine light of the Navagrahas guide your path.*

---
*This reading is based on classical Vedic principles. For complete AI-enhanced predictions, please contact the administrator.*"""

    def _extract_section(self, text: str, section_keyword: str) -> str:
        """Extract specific section from prediction text with intelligent parsing"""
        if not text:
            return "Analysis available in full report"

        lines = text.split('\n')
        section_lines = []
        in_section = False
        section_level = 0

        for i, line in enumerate(lines):
            stripped = line.strip()

            # Detect section header with keyword
            if section_keyword.lower() in stripped.lower():
                if stripped.startswith('#'):
                    in_section = True
                    section_level = len(stripped) - len(stripped.lstrip('#'))
                    section_lines.append(line)
                    continue
                elif ':' in stripped or stripped.endswith(':'):
                    in_section = True
                    section_level = 0
                    section_lines.append(line)
                    continue

            # If in section, add content until next section of same or higher level
            if in_section:
                if stripped.startswith('#'):
                    current_level = len(stripped) - len(stripped.lstrip('#'))
                    if current_level <= section_level and section_level > 0:
                        break
                    elif section_level == 0:
                        break
                section_lines.append(line)

        result = '\n'.join(section_lines).strip()
        return result if result else f"See full analysis for {section_keyword}"

    def _extract_lives(self, text: str) -> List[Dict[str, str]]:
        """Extract past life information with intelligent parsing"""
        lives = []
        lines = text.split('\n')
        current_life = {}

        for line in lines:
            lower_line = line.lower()
            # Look for era indicators
            if any(term in lower_line for term in ['century', 'era', 'period', 'bc', 'ad', 'ancient']):
                if current_life:
                    lives.append(current_life)
                current_life = {'era': line.strip(), 'role': '', 'location': ''}
            # Look for role/profession
            elif any(term in lower_line for term in ['profession', 'role', 'occupation', 'worked as', 'served as']):
                if current_life:
                    current_life['role'] = line.strip()
            # Look for location
            elif any(term in lower_line for term in ['location', 'place', 'region', 'country', 'city']):
                if current_life:
                    current_life['location'] = line.strip()

        if current_life:
            lives.append(current_life)

        return lives if lives else [{'era': 'See full analysis', 'role': 'Detailed in report', 'location': 'Detailed in report'}]

    def _extract_patterns(self, text: str) -> List[str]:
        """Extract karmic patterns with intelligent parsing"""
        patterns = []
        lines = text.split('\n')

        for line in lines:
            lower_line = line.lower()
            # Look for pattern indicators
            if any(term in lower_line for term in ['pattern', 'recurring', 'repeating', 'cycle', 'theme']):
                stripped = line.strip().lstrip('-*•123456789. ')
                if len(stripped) > 10:  # Meaningful content
                    patterns.append(stripped)

        return patterns[:10] if patterns else ['Karmic patterns detailed in comprehensive analysis']

    def _extract_scenarios(self, text: str) -> List[str]:
        """Extract future scenarios with intelligent parsing"""
        scenarios = []
        lines = text.split('\n')

        for line in lines:
            lower_line = line.lower()
            # Look for scenario indicators
            if any(term in lower_line for term in ['scenario', 'possibility', 'likely', 'potential', 'future']):
                stripped = line.strip().lstrip('-*•123456789. ')
                if len(stripped) > 15:
                    scenarios.append(stripped)

        return scenarios[:8] if scenarios else ['Future scenarios detailed in comprehensive analysis']

    def _extract_yearly_forecast(self, text: str, years: int) -> List[Dict[str, Any]]:
        """Extract yearly forecast with intelligent parsing"""
        forecasts = []
        lines = text.split('\n')
        current_year = None
        current_forecast = []

        for line in lines:
            # Look for year indicators
            if any(term in line.lower() for term in ['year', 'age']):
                if any(char.isdigit() for char in line):
                    if current_year and current_forecast:
                        forecasts.append({
                            'year': current_year,
                            'forecast': '\n'.join(current_forecast)
                        })
                    current_year = line.strip()
                    current_forecast = []
            elif current_year and line.strip():
                current_forecast.append(line.strip())

        if current_year and current_forecast:
            forecasts.append({
                'year': current_year,
                'forecast': '\n'.join(current_forecast)
            })

        return forecasts if forecasts else [{'year': f'Year {i+1}', 'forecast': 'Detailed in full report'} for i in range(years)]

    def _extract_transitions(self, text: str) -> List[str]:
        """Extract major life transitions with intelligent parsing"""
        transitions = []
        lines = text.split('\n')

        for line in lines:
            lower_line = line.lower()
            # Look for transition indicators
            if any(term in lower_line for term in ['transition', 'change', 'milestone', 'shift', 'transformation']):
                stripped = line.strip().lstrip('-*•123456789. ')
                if len(stripped) > 10:
                    transitions.append(stripped)

        return transitions[:10] if transitions else ['Major transitions detailed in comprehensive analysis']

    def _extract_auspicious_times(self, text: str) -> List[str]:
        """Extract auspicious periods with intelligent parsing"""
        times = []
        lines = text.split('\n')

        for line in lines:
            lower_line = line.lower()
            # Look for auspicious time indicators
            if any(term in lower_line for term in ['auspicious', 'favorable', 'beneficial', 'lucky', 'good time', 'best time']):
                stripped = line.strip().lstrip('-*•123456789. ')
                if len(stripped) > 10:
                    times.append(stripped)

        return times[:12] if times else ['Auspicious times calculated based on planetary positions']

    def _extract_mantras(self, text: str) -> List[Dict[str, str]]:
        """Extract mantra recommendations with intelligent parsing"""
        mantras = []
        lines = text.split('\n')
        current_mantra = {}

        for line in lines:
            lower_line = line.lower()
            # Look for mantra indicators
            if 'mantra' in lower_line or 'om' in lower_line or 'namah' in lower_line:
                if current_mantra and 'mantra' in current_mantra:
                    mantras.append(current_mantra)
                    current_mantra = {}
                current_mantra['mantra'] = line.strip()
            elif current_mantra and any(term in lower_line for term in ['purpose', 'benefit', 'for']):
                current_mantra['purpose'] = line.strip()
            elif current_mantra and any(term in lower_line for term in ['times', 'repetitions', 'count']):
                current_mantra['repetitions'] = line.strip()

        if current_mantra:
            mantras.append(current_mantra)

        return mantras if mantras else [{'mantra': 'See full analysis for specific mantras', 'purpose': 'Based on chart analysis'}]

    def _extract_gemstones(self, text: str) -> List[str]:
        """Extract gemstone recommendations with intelligent parsing"""
        gemstones = []
        lines = text.split('\n')

        for line in lines:
            lower_line = line.lower()
            # Look for gemstone names
            if any(gem in lower_line for gem in ['ruby', 'pearl', 'coral', 'emerald', 'yellow sapphire', 'diamond', 'blue sapphire', 'hessonite', 'cat\'s eye', 'sapphire']):
                stripped = line.strip().lstrip('-*•123456789. ')
                if stripped:
                    gemstones.append(stripped)

        return gemstones[:5] if gemstones else ['Gemstone recommendations available in full report']

    def _extract_rituals(self, text: str) -> List[str]:
        """Extract ritual recommendations with intelligent parsing"""
        rituals = []
        lines = text.split('\n')

        for line in lines:
            lower_line = line.lower()
            # Look for ritual indicators
            if any(term in lower_line for term in ['ritual', 'puja', 'ceremony', 'worship', 'offering', 'fast', 'fasting']):
                stripped = line.strip().lstrip('-*•123456789. ')
                if len(stripped) > 10:
                    rituals.append(stripped)

        return rituals[:10] if rituals else ['Ritual recommendations detailed in comprehensive analysis']

    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat()

# Lazy singleton instance
_openai_service_instance = None

def get_openai_service():
    """Get or create the OpenAI service singleton instance"""
    global _openai_service_instance
    if _openai_service_instance is None:
        _openai_service_instance = OpenAIService()
    return _openai_service_instance

# Backwards compatibility - creates instance on first access
class _LazyProxy:
    def __getattr__(self, name):
        return getattr(get_openai_service(), name)

openai_service = _LazyProxy()

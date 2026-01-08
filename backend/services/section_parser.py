"""
Advanced Section Parser for Bhrigu Predictions
Ensures 100% structured output with AI-powered section generation
"""
import re
import logging
import difflib
from typing import Dict, List, Any, Optional, Tuple

# Configure logging
logger = logging.getLogger(__name__)


class SectionParser:
    """
    Parse AI responses into structured sections
    Never return unstructured-only results
    """
    
    # Content validation thresholds
    MINIMUM_SECTION_LENGTH = 100  # Minimum characters for a valid section
    HEADER_EXTRACTION_MIN_LENGTH = 50  # Minimum for header-based extraction
    
    # Required sections for each category
    REQUIRED_SECTIONS = {
        'karmic_journey': [
            'soul_purpose',
            'karmic_blueprint',
            'evolution_stage',
            'life_mission',
            'karmic_lessons',
            'soul_connections',
            'timing',
            'spiritual_gifts'
        ],
        'life_events': [
            'yearly_forecast',
            'marriage_timing',
            'career_milestones',
            'children_family',
            'financial_events',
            'health_alerts',
            'spiritual_milestones',
            'relocations',
            'education',
            'favorable_periods',
            'challenging_periods',
            'transits',
            'age_milestones'
        ],
        'predictions': [
            'daily',
            'weekly',
            'monthly',
            'yearly'
        ],
        'past_lives': [
            'recent_life',
            'significant_lives',
            'karmic_patterns',
            'past_skills',
            'traumas_healing',
            'past_relationships',
            'karmic_debts',
            'spiritual_progress'
        ],
        'future_lives': [
            'next_incarnation',
            'evolution_trajectory',
            'final_birth_conditions',
            'future_scenarios',
            'moksha_timeline',
            'higher_realms',
            'bodhisattva_path',
            'ultimate_destiny'
        ],
        'present_life': [
            'current_phase',
            'career',
            'relationships',
            'health',
            'finances',
            'spiritual_growth',
            'education',
            'life_purpose',
            'challenges',
            'timing'
        ],
        'karmic_remedies': [
            'mantras',
            'gemstones',
            'yantras',
            'charitable_activities',
            'fasting',
            'deity_worship',
            'pilgrimage',
            'lifestyle',
            'planetary_rituals',
            'karmic_cleansing',
            'service',
            'meditation'
        ],
        'relationships': [
            'romantic_marriage',
            'family',
            'soul_connections',
            'friendships',
            'professional',
            'karmic_patterns',
            'communication',
            'timing',
            'healing',
            'healthy_practices'
        ]
    }
    
    # Section header patterns for extraction
    SECTION_HEADERS = {
        'soul_purpose': [
            'Soul\'s Primary Purpose',
            'Primary Purpose',
            'Soul Purpose',
            'Soul\'s Purpose'
        ],
        'karmic_blueprint': [
            'Karmic Blueprint',
            'Karmic Patterns'
        ],
        'evolution_stage': [
            'Soul Evolution Stage',
            'Evolution Stage',
            'Spiritual Evolution'
        ],
        'life_mission': [
            'Life Mission & Dharma',
            'Life Mission',
            'Dharma'
        ],
        'karmic_lessons': [
            'Karmic Lessons',
            'Lessons'
        ],
        'soul_connections': [
            'Soul Group Connections',
            'Soul Connections',
            'Soulmates'
        ],
        'timing': [
            'Timing of Karmic Events',
            'Timing',
            'Key Timing',
            'Favorable & Challenging Periods'
        ],
        'spiritual_gifts': [
            'Spiritual Gifts',
            'Spiritual Gifts & Abilities',
            'Gifts'
        ],
        'yearly_forecast': [
            'Year-by-Year Forecast',
            'Yearly Forecast',
            'Annual Forecast'
        ],
        'marriage_timing': [
            'Marriage & Partnerships',
            'Marriage Timing',
            'Marriage'
        ],
        'career_milestones': [
            'Career Milestones',
            'Career'
        ],
        'children_family': [
            'Children & Family',
            'Family Events',
            'Children'
        ],
        'financial_events': [
            'Financial Breakthroughs',
            'Financial Events',
            'Finances'
        ],
        'health_alerts': [
            'Health Alerts',
            'Health',
            'Wellness'
        ],
        'spiritual_milestones': [
            'Spiritual Milestones',
            'Spiritual Growth'
        ],
        'relocations': [
            'Relocations & Travel',
            'Relocations',
            'Travel'
        ],
        'education': [
            'Education',
            'Education & Skill Development',
            'Learning'
        ],
        'favorable_periods': [
            'Favorable Dasha Periods',
            'Favorable Periods',
            'Auspicious Times'
        ],
        'challenging_periods': [
            'Challenging Dasha Periods',
            'Challenging Periods',
            'Difficult Times'
        ],
        'transits': [
            'Critical Transit Events',
            'Transits',
            'Planetary Transits'
        ],
        'age_milestones': [
            'Specific Age Milestones',
            'Age Milestones',
            'Key Ages'
        ],
        'daily': [
            'Daily Forecast',
            'Daily',
            'Today'
        ],
        'weekly': [
            'Weekly Forecast',
            'Weekly',
            'This Week'
        ],
        'monthly': [
            'Monthly Forecast',
            'Monthly',
            'This Month'
        ],
        'yearly': [
            'Yearly Forecast',
            'Yearly',
            'Annual',
            'This Year'
        ]
    }
    
    def __init__(self, openai_service=None):
        """Initialize section parser with optional OpenAI service for generation"""
        self.openai_service = openai_service
        
    def extract_sections(self, raw_text: str, category: str, birth_data: Dict = None) -> Dict[str, Any]:
        """
        Extract all required sections from raw text
        Generate missing sections using AI
        
        Args:
            raw_text: Full prediction text
            category: Category name (karmic_journey, life_events, etc.)
            birth_data: Birth chart data for generating missing sections
            
        Returns:
            Dictionary with all section keys mapped to their content
        """
        sections = {}
        required = self.REQUIRED_SECTIONS.get(category, [])
        
        for section_key in required:
            section_data, extraction_source = self._extract_section_content_with_status(raw_text, section_key)
            
            # If parsing fails, inline full analysis for display
            if extraction_source == "none" and raw_text:
                logger.warning(
                    f"Section '{section_key}' missing after all parsers; inlining full analysis"
                )
                self._track_fallback_usage(
                    "inline_full_analysis",
                    section_key,
                    category
                )
                section_data = raw_text
            elif not section_data or len(section_data.strip()) < self.MINIMUM_SECTION_LENGTH:
                logger.warning(f"Section '{section_key}' missing or insufficient, generating...")
                section_data = self.generate_missing_section(
                    section_key, 
                    raw_text, 
                    category, 
                    birth_data or {}
                )
                
            sections[section_key] = section_data
            
        return sections
    
    def extract_section_content(self, text: str, section_key: str) -> str:
        """
        Extract specific section content using flexible header patterns

        Args:
            text: Full text to search
            section_key: Key of section to extract

        Returns:
            Extracted section content or empty string
        """
        content, _ = self._extract_section_content_with_status(text, section_key)
        return content

    def _extract_section_content_with_status(self, text: str, section_key: str) -> Tuple[str, str]:
        """
        Extract section content while returning the source of extraction.
        """
        if not text:
            logger.debug(f"Section '{section_key}': No text provided for extraction")
            return "", "none"

        headers = self.SECTION_HEADERS.get(section_key, [])
        logger.info(f"Extracting section '{section_key}' with {len(headers)} header patterns")

        for header in headers:
            # Try multiple pattern variations for maximum flexibility
            patterns = [
                # Standard markdown with ## (most common)
                rf'##\s*\d*\. ?\s*{re.escape(header)}\s*\n(.*?)(?=\n##|\n#[^#]|\Z)',
                # Markdown with any number of # symbols
                rf'#+\s*\d*\.?\s*{re.escape(header)}\s*[:\n](.*?)(?=\n#+\s|\Z)',
                # Numbered sections (1., 2., etc.) - IMPROVED
                rf'\n\d+\.\s*{re.escape(header)}\s*[:\n]?(.*?)(?=\n\d+\. |\n##|\Z)',
                # Without markdown symbols (plain text headers)
                rf'\n{re.escape(header)}\s*[:\n](.*?)(?=\n[A-Z][a-z]+[^\n]*[:\n]|\n\d+\. |\Z)',
                # Bold or emphasized headers
                rf'\*\*\d*\.?\s*{re. escape(header)}\*\*\s*[:\n]?(.*?)(?=\n\*\*|\n##|\Z)',
                # Header with colon on same line
                rf'{re.escape(header)}:\s*(.*?)(?=\n[A-Z][a-z]+.*? :|\n##|\n\d+\.|\Z)',
            ]

            for i, pattern in enumerate(patterns):
                try:
                    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE | re.MULTILINE)

                    if match:
                        content = match.group(1).strip()
                        if len(content) > self.HEADER_EXTRACTION_MIN_LENGTH:
                            logger.info(
                                f"Section '{section_key}': Extracted {len(content)} chars using pattern {i+1} with header '{header}'"
                            )
                            return content, "header"
                        logger.debug(
                            f"Section '{section_key}': Match found with header '{header}' but content too short ({len(content)} chars)"
                        )
                except Exception as e:
                    logger.warning(f"Section '{section_key}': Pattern {i+1} failed: {e}")
                    continue

        # Try generic extraction by section number or keywords
        logger.info(f"Section '{section_key}': No header match found, trying keyword extraction")
        keyword_result = self._extract_by_keywords(text, section_key)

        if keyword_result:
            logger.info(f"Section '{section_key}': Extracted {len(keyword_result)} chars via keyword search")
            return keyword_result, "keyword"

        logger.info(f"Section '{section_key}': No keyword match, trying title similarity")
        similarity_result = self._extract_by_title_similarity(text, section_key)
        if similarity_result:
            logger.info(
                f"Section '{section_key}': Extracted {len(similarity_result)} chars via title similarity"
            )
            self._track_fallback_usage("title_similarity", section_key)
            return similarity_result, "title_similarity"

        logger.warning(f"Section '{section_key}': No content extracted by any method")
        return "", "none"
    
    def _extract_by_keywords(self, text: str, section_key: str) -> str:
        """
        Extract content based on keywords in section key with improved matching

        Args:
            text: Full text to search
            section_key: Section key to derive keywords from

        Returns:
            Extracted content or empty string
        """
        keywords = section_key.replace('_', ' ').split()
        logger.debug(f"Keyword extraction for '{section_key}' using keywords: {keywords}")

        # Look for paragraphs containing all keywords
        paragraphs = text.split('\n\n')
        relevant_paras = []

        # Try exact keyword matching first
        for para in paragraphs:
            if all(kw.lower() in para.lower() for kw in keywords):
                relevant_paras.append(para)
                logger.debug(f"Found paragraph with all keywords: {para[:100]}...")

        # If no exact matches, try partial matching (at least 50% of keywords)
        if not relevant_paras and len(keywords) > 1:
            threshold = max(1, len(keywords) // 2)
            logger.debug(f"No exact matches, trying partial match with threshold {threshold}/{len(keywords)}")

            for para in paragraphs:
                matches = sum(1 for kw in keywords if kw.lower() in para.lower())
                if matches >= threshold and len(para.strip()) > 100:
                    relevant_paras.append(para)
                    logger.debug(f"Found paragraph with {matches}/{len(keywords)} keywords")

        result = '\n\n'.join(relevant_paras)
        logger.debug(f"Keyword extraction returned {len(result)} characters")
        return result

    def _extract_by_title_similarity(self, text: str, section_key: str) -> str:
        """
        Extract content by comparing paragraph starts to section titles.
        """
        headers = self.SECTION_HEADERS.get(section_key, [])
        if not headers:
            return ""

        normalized_headers = [self._normalize_title(header) for header in headers]
        paragraphs = [para.strip() for para in text.split('\n\n') if para.strip()]
        best_match = ("", 0.0)

        for para in paragraphs:
            first_line = para.splitlines()[0].strip()
            normalized_start = self._normalize_title(first_line)
            for header in normalized_headers:
                similarity = difflib.SequenceMatcher(None, normalized_start, header).ratio()
                if similarity > best_match[1]:
                    best_match = (para, similarity)

        if best_match[1] >= 0.65:
            return self._strip_title_line(best_match[0])

        return ""

    def _normalize_title(self, title: str) -> str:
        title = re.sub(r'^[#*\s\d\.\-:]+', '', title)
        title = re.sub(r'[^a-zA-Z\s]', '', title)
        return re.sub(r'\s+', ' ', title).strip().lower()

    def _strip_title_line(self, paragraph: str) -> str:
        lines = paragraph.splitlines()
        if len(lines) <= 1:
            return paragraph.strip()
        remaining = "\n".join(lines[1:]).strip()
        return remaining or paragraph.strip()
    
    def generate_missing_section(
        self, 
        section_key: str, 
        full_text: str, 
        category: str, 
        birth_data: Dict
    ) -> str:
        """
        Generate missing section using AI with specific prompts
        
        Args:
            section_key: Key of missing section
            full_text: Full prediction text for context
            category: Category name
            birth_data: Birth chart data
            
        Returns:
            Generated section content or fallback text
        """
        
        if not self.openai_service:
            self._track_fallback_usage("missing_section_fallback", section_key, category)
            return self._get_fallback_section(section_key, birth_data)
        
        # Create targeted prompt for missing section
        section_prompt = self._create_section_specific_prompt(
            section_key, 
            category, 
            birth_data,
            full_text
        )
        
        # Generate just this section
        try:
            generated = self.openai_service.generate_prediction(
                section_prompt,
                birth_data
            )
            return generated
        except Exception as e:
            logger.error(f"Error generating section {section_key}: {e}")
            self._track_fallback_usage("missing_section_fallback", section_key, category)
            return self._get_fallback_section(section_key, birth_data)
    
    def _create_section_specific_prompt(
        self, 
        section_key: str, 
        category: str, 
        birth_data: Dict,
        context: str
    ) -> str:
        """
        Create a targeted prompt for specific section
        
        Args:
            section_key: Section to generate
            category: Category name
            birth_data: Birth data
            context: Context from full analysis
            
        Returns:
            Specialized prompt for the section
        """
        
        section_prompts = {
            'soul_purpose': f"""
Based on the following birth details, provide a detailed analysis of the Soul's Primary Purpose:

Birth Data:
- Zodiac Sign: {birth_data.get('zodiac_sign', 'N/A')}
- Nakshatra: {birth_data.get('nakshatra', 'N/A')}
- Ascendant: {birth_data.get('ascendant', 'N/A')}
- Moon Sign: {birth_data.get('moon_sign', 'N/A')}

Context from full analysis:
{context[:500] if context else 'No additional context'}...

Provide 3-5 paragraphs specifically about:
1. The fundamental reason this soul incarnated
2. Unique dharmic path and cosmic mission
3. Core spiritual lessons to master
4. How this purpose manifests in daily life
5. Signs they are aligned with their purpose

Make this specific to the chart and actionable.
""",
            'karmic_blueprint': f"""
Based on the birth chart, provide detailed Karmic Blueprint analysis:

Birth Data:
- Zodiac Sign: {birth_data.get('zodiac_sign', 'N/A')}
- Nakshatra: {birth_data.get('nakshatra', 'N/A')}
- Rahu/Ketu: {birth_data.get('rahu_position', 'N/A')}, {birth_data.get('ketu_position', 'N/A')}

Analyze:
1. Major karmic patterns from past lives
2. Specific karmic debts (Rinanubandha)
3. Karmic credits and blessings
4. Planetary yogas indicating karmic destiny
5. How past life actions affect current situations

Provide specific, detailed analysis (minimum 200 words).
""",
            'yearly_forecast': f"""
Provide a comprehensive yearly forecast for someone born with:
- Zodiac: {birth_data.get('zodiac_sign', 'N/A')}
- Nakshatra: {birth_data.get('nakshatra', 'N/A')}
- Current Age: {birth_data.get('age', 'N/A')}

Include month-by-month predictions for the coming year covering:
- Career developments
- Relationship events
- Financial matters
- Health considerations
- Spiritual growth
- Key timing for major decisions

Be specific with months and actionable advice.
""",
            'daily': f"""
Provide today's detailed forecast for:
- Zodiac: {birth_data.get('zodiac_sign', 'N/A')}
- Nakshatra: {birth_data.get('nakshatra', 'N/A')}

Include:
- Overall energy and mood
- Career focus areas
- Relationship guidance
- Health tips
- Lucky color and number
- Auspicious timing
- Things to avoid

Be specific and actionable for today.
""",
            'weekly': f"""
Provide this week's forecast for:
- Zodiac: {birth_data.get('zodiac_sign', 'N/A')}
- Nakshatra: {birth_data.get('nakshatra', 'N/A')}

Cover:
- Week's theme
- Major opportunities
- Challenges to navigate
- Best days for activities
- Relationship dynamics
- Financial matters

Provide day-by-day highlights.
""",
            'monthly': f"""
Provide this month's comprehensive forecast for:
- Zodiac: {birth_data.get('zodiac_sign', 'N/A')}
- Nakshatra: {birth_data.get('nakshatra', 'N/A')}

Include:
- Month's theme
- Career developments
- Relationship evolution
- Financial prospects
- Health considerations
- Spiritual growth
- Best timing for decisions

Break down by weeks with specific guidance.
"""
        }
        
        # Return specific prompt or generic one
        if section_key in section_prompts:
            return section_prompts[section_key]
        
        return self._generic_section_prompt(section_key, birth_data, category)
    
    def _generic_section_prompt(self, section_key: str, birth_data: Dict, category: str) -> str:
        """
        Generic prompt for any section
        
        Args:
            section_key: Section key
            birth_data: Birth data
            category: Category name
            
        Returns:
            Generic prompt
        """
        section_name = section_key.replace('_', ' ').title()
        return f"""
Based on the birth chart, provide a comprehensive analysis for: {section_name}

Birth Data:
- Zodiac Sign: {birth_data.get('zodiac_sign', 'N/A')}
- Nakshatra: {birth_data.get('nakshatra', 'N/A')}
- Date of Birth: {birth_data.get('date_of_birth', 'N/A')}
- Moon Sign: {birth_data.get('moon_sign', 'N/A')}
- Ascendant: {birth_data.get('ascendant', 'N/A')}

Category: {category.replace('_', ' ').title()}

Provide detailed, actionable insights specific to {section_name}.
Include practical guidance and specific examples.
Structure the response with clear sub-sections and bullet points where appropriate.
Minimum 200 words with specific astrological references.
"""
    
    def _get_fallback_section(self, section_key: str, birth_data: Dict) -> str:
        """
        Fallback content when AI generation fails
        
        Args:
            section_key: Section key
            birth_data: Birth data
            
        Returns:
            Fallback text
        """
        section_name = section_key.replace('_', ' ').title()
        zodiac = birth_data.get('zodiac_sign', 'your zodiac')
        nakshatra = birth_data.get('nakshatra', 'your nakshatra')
        
        return f"""
### {section_name}

Based on traditional Bhrigu Samhita wisdom for {zodiac} zodiac and {nakshatra} nakshatra:

This section is being enhanced with additional insights from ancient texts. 
The analysis for {section_name} requires deeper integration with the complete birth chart.

**General Guidance:**
The {section_name} aspect of your chart shows significant potential for growth and development. 
According to classical Vedic principles, individuals with {zodiac} as their zodiac sign and 
{nakshatra} nakshatra have unique characteristics that influence this area.

**Recommendations:**
- Consult with a qualified Vedic astrologer for detailed analysis
- Consider regenerating this prediction for more comprehensive insights
- Focus on the other sections which provide valuable guidance

[More comprehensive data will be available in the next update]
"""
    
    def validate_sections(self, sections: Dict[str, Any], category: str) -> Dict[str, bool]:
        """
        Validate that all required sections are present and have content
        
        Args:
            sections: Dictionary of sections
            category: Category name
            
        Returns:
            Dictionary mapping section keys to validation status
        """
        required = self.REQUIRED_SECTIONS.get(category, [])
        validation = {}
        
        for section_key in required:
            has_content = (
                section_key in sections and 
                sections[section_key] and 
                len(str(sections[section_key]).strip()) >= self.MINIMUM_SECTION_LENGTH
            )
            validation[section_key] = has_content
            
        return validation
    
    def get_missing_sections(self, sections: Dict[str, Any], category: str) -> List[str]:
        """
        Get list of missing or insufficient sections
        
        Args:
            sections: Dictionary of sections
            category: Category name
            
        Returns:
            List of missing section keys
        """
        validation = self.validate_sections(sections, category)
        return [key for key, valid in validation.items() if not valid]

    def _track_fallback_usage(self, event: str, section_key: str, category: Optional[str] = None) -> None:
        logger.info(
            "Telemetry: section_parser_fallback_used event=%s section=%s category=%s",
            event,
            section_key,
            category or "unknown"
        )


# Module-level singleton
_section_parser = None


def get_section_parser(openai_service=None):
    """Get or create section parser singleton"""
    global _section_parser
    if _section_parser is None:
        _section_parser = SectionParser(openai_service)
    elif openai_service and _section_parser.openai_service is None:
        _section_parser.openai_service = openai_service
    return _section_parser

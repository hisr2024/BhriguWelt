"""
Advanced Section Parser for Bhrigu Predictions
Ensures 100% structured output with AI-powered section generation
"""
import json
import logging
import math
import os
import unicodedata
from pathlib import Path
from typing import Dict, List, Any, Optional

# Configure logging
logger = logging.getLogger(__name__)


def _read_int_env(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def _read_ratio_env(name: str, default: float) -> float:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        ratio = float(value)
    except ValueError:
        return default
    if ratio <= 0 or ratio > 1:
        return default
    return ratio


class SectionParser:
    """
    Parse AI responses into structured sections
    Never return unstructured-only results
    """
    
    # Content validation thresholds
    MINIMUM_SECTION_LENGTH = _read_int_env("SECTION_PARSER_MIN_LENGTH", 100)
    HEADER_EXTRACTION_MIN_LENGTH = _read_int_env("SECTION_PARSER_HEADER_MIN_LENGTH", 50)
    KEYWORD_MATCH_RATIO = _read_ratio_env("SECTION_PARSER_KEYWORD_MATCH_RATIO", 0.5)
    
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
    SECTION_HEADERS = _load_section_headers()
    
    def __init__(self, openai_service=None):
        """Initialize section parser with optional OpenAI service for generation"""
        self.openai_service = openai_service
        self.normalized_title_map = self._build_normalized_title_map()

    def _build_normalized_title_map(self) -> Dict[str, str]:
        normalized_map = {}
        for section_key, headers in self.SECTION_HEADERS.items():
            titles = list(headers) + [section_key.replace('_', ' ')]
            for title in titles:
                normalized = self._normalize_title(title)
                if normalized:
                    normalized_map.setdefault(normalized, section_key)
        return normalized_map

    def _normalize_title(self, title: str) -> str:
        if not title:
            return ""
        cleaned = re.sub(r"^[#>*\-\+\d\.\)\s]+", "", title.strip())
        cleaned = re.sub(r"[^\w\s]", "", cleaned.lower())
        return re.sub(r"\s+", " ", cleaned).strip()

    def _match_normalized_title(self, normalized: str) -> str:
        if normalized in self.normalized_title_map:
            return self.normalized_title_map[normalized]
        close = difflib.get_close_matches(
            normalized,
            self.normalized_title_map.keys(),
            n=1,
            cutoff=0.82
        )
        if close:
            return self.normalized_title_map[close[0]]
        return ""
        
    def extract_sections(
        self,
        raw_text: str,
        category: str,
        birth_data: Dict = None,
        max_repairs_per_request: int = 3
    ) -> Dict[str, Any]:
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
        section_generation_status = {}
        required = self.REQUIRED_SECTIONS.get(category, [])
        request_id = str(uuid.uuid4())
        repairs_used = 0
        
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

        sections['section_generation_status'] = section_generation_status
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
            markdown_section = self._extract_markdown_section(text, header)
            if markdown_section:
                logger.info(
                    "Section '%s': Extracted %s chars using markdown header '%s'",
                    section_key,
                    len(markdown_section),
                    header
                )
                return markdown_section

            # Try multiple pattern variations for maximum flexibility
            patterns = [
                # Standard markdown with ## (most common)
                rf'##\s*\d*\. ?\s*{re.escape(header)}\s*\n(.*?)(?=\n##|\n#[^#]|\Z)',
                # Markdown with any number of # symbols
                rf'#+\s*\d*\.?\s*{re.escape(header)}\s*[:\n](.*?)(?=\n#+\s|\Z)',
                # Markdown with # or ### headers
                rf'^\s*#{1,3}\s*\d*\.?\s*{re.escape(header)}\s*[:\n](.*?)(?=\n\s*#{1,3}\s|\Z)',
                # Numbered sections (1., 2., etc.) - IMPROVED
                rf'\n\d+(?:\.\d+)*\.?\s*{re.escape(header)}\s*[:\n]?(.*?)(?=\n\d+(?:\.\d+)*\.?\s|\n##|\Z)',
                # Without markdown symbols (plain text headers)
                rf'\n{re.escape(header)}\s*[:\n](.*?)(?=\n[A-Z][a-z]+[^\n]*[:\n]|\n\d+\. |\Z)',
                # Bold or emphasized headers
                rf'\*\*\d*\.?\s*{re.escape(header)}\*\*\s*[:\n]?(.*?)(?=\n\*\*|\n##|\Z)',
                # Bullet list headers
                rf'^\s*[-*+]\s*\d*\.?\s*{re.escape(header)}\s*[:\n](.*?)(?=\n\s*[-*+]\s|\n#+\s|\Z)',
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

        normalized_result = self._extract_by_normalized_headers(text, section_key)
        if normalized_result:
            logger.info(f"Section '{section_key}': Extracted {len(normalized_result)} chars via normalized header match")
            return normalized_result

        # Try generic extraction by section number or keywords
        fuzzy_result = self._extract_by_fuzzy_title(text, section_key)
        if fuzzy_result:
            logger.info(f"Section '{section_key}': Extracted {len(fuzzy_result)} chars via fuzzy title matching")
            return fuzzy_result

        logger.info(f"Section '{section_key}': No header match found, trying keyword extraction")
        keyword_result = self._extract_by_keywords(text, section_key)

        if keyword_result:
            logger.info(f"Section '{section_key}': Extracted {len(keyword_result)} chars via keyword search")
            return keyword_result, "keyword"

        return keyword_result

    def _normalize_header_text(self, text: str) -> str:
        """
        Normalize header text by stripping punctuation and diacritics.

        Args:
            text: Header text to normalize

        Returns:
            Normalized text for matching
        """
        if not text:
            return ""
        normalized = unicodedata.normalize("NFKD", text)
        normalized = "".join(char for char in normalized if not unicodedata.combining(char))
        normalized = re.sub(r"[^\w\s]", "", normalized)
        normalized = re.sub(r"\s+", " ", normalized).strip().lower()
        return normalized

    def _strip_header_markers(self, line: str) -> str:
        """Strip common markdown or numbering markers from a header line."""
        if not line:
            return ""
        cleaned = line.strip()
        cleaned = re.sub(r"^\s*#{1,6}\s*", "", cleaned)
        cleaned = re.sub(r"^\s*\d+\.\s*", "", cleaned)
        cleaned = re.sub(r"^\s*\*\*\s*", "", cleaned)
        cleaned = re.sub(r"\s*\*\*\s*$", "", cleaned)
        cleaned = cleaned.rstrip(":").strip()
        return cleaned

    def _is_header_line(self, line: str) -> bool:
        """Check if a line looks like a header."""
        stripped = line.strip()
        if not stripped:
            return False
        if stripped.startswith("#"):
            return True
        if re.match(r"^\d+\.\s+\S", stripped):
            return True
        if re.match(r"^\*\*.+\*\*$", stripped):
            return True
        if stripped.endswith(":") and len(stripped.split()) <= 6:
            return True
        return False

    def _extract_by_normalized_headers(self, text: str, section_key: str) -> str:
        """
        Extract section content by matching normalized header text.

        Args:
            text: Full text to search
            section_key: Section key to extract

        Returns:
            Extracted section content or empty string
        """
        headers = self.SECTION_HEADERS.get(section_key, [])
        if not headers or not text:
            return ""

        normalized_headers = {
            self._normalize_header_text(header) for header in headers if header
        }
        lines = text.splitlines()

        for index, line in enumerate(lines):
            if not self._is_header_line(line):
                continue
            candidate = self._strip_header_markers(line)
            normalized_candidate = self._normalize_header_text(candidate)
            if normalized_candidate not in normalized_headers:
                continue

            next_index = None
            for following in range(index + 1, len(lines)):
                if self._is_header_line(lines[following]):
                    next_index = following
                    break

            content_lines = lines[index + 1:next_index] if next_index else lines[index + 1:]
            content = "\n".join(content_lines).strip()
            if len(content) > self.HEADER_EXTRACTION_MIN_LENGTH:
                return content
        return ""
    
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
            threshold = max(1, math.ceil(len(keywords) * self.KEYWORD_MATCH_RATIO))
            logger.debug(
                "No exact matches, trying partial match with threshold %s/%s (ratio %.2f)",
                threshold,
                len(keywords),
                self.KEYWORD_MATCH_RATIO
            )

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
        birth_data: Dict,
        request_id: Optional[str] = None
    ) -> str:
        """
        Generate missing section using AI with specific prompts
        
        Args:
            section_key: Key of missing section
            full_text: Full prediction text for context
            category: Category name
            birth_data: Birth chart data
            
        Returns:
            Generated section content or fallback text. When include_status is True,
            returns a tuple of (content, status, fallback_reason).
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
            if include_status:
                return generated, "generated", None
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

    def _get_offline_wisdom_fallback(
        self,
        section_key: str,
        category: str,
        birth_data: Dict
    ) -> str:
        """Deterministic fallback content using offline wisdom corpus."""
        offline_wisdom = get_offline_wisdom_generator()
        category_generators = {
            'karmic_journey': offline_wisdom.generate_karmic_journey,
            'past_lives': offline_wisdom.generate_past_lives,
            'future_lives': offline_wisdom.generate_future_lives,
            'present_life': offline_wisdom.generate_present_life,
            'life_events': offline_wisdom.generate_life_events,
            'karmic_remedies': offline_wisdom.generate_karmic_remedies,
            'relationships': offline_wisdom.generate_relationships,
            'predictions': offline_wisdom.generate_general_predictions
        }

        generator = category_generators.get(category)
        if not generator:
            return self._get_fallback_section(section_key, birth_data)

        offline_text = generator(birth_data)
        section_data = self.extract_section_content(offline_text, section_key)
        if section_data and len(section_data.strip()) >= self.MINIMUM_SECTION_LENGTH:
            return section_data

        return self._get_fallback_section(section_key, birth_data)
    
    def validate_sections(self, sections: Dict[str, Any], category: str) -> Dict[str, str]:
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
            if section_key not in sections or not sections[section_key]:
                validation[section_key] = "missing"
                continue

            content = str(sections[section_key]).strip()
            if len(content) < self.MINIMUM_SECTION_LENGTH:
                validation[section_key] = "short"
            else:
                validation[section_key] = "ok"
            
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
        return [key for key, status in validation.items() if status != "ok"]

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

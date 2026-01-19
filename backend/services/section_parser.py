"""
Advanced Section Parser for Bhrigu Predictions
Ensures 100% structured output with AI-powered section generation
"""
import difflib
import logging
import os
import re
import unicodedata
import uuid
from typing import Any, Dict, List, Optional, Tuple

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


def _get_default_section_headers() -> Dict[str, List[str]]:
    """Return CATEGORY-SPECIFIC section header patterns - each category has unique sections"""
    return {
        # KARMIC JOURNEY specific headers
        'soul_purpose': ["soul's primary purpose", 'soul purpose', 'primary purpose', 'cosmic mission'],
        'karmic_blueprint': ['karmic blueprint', 'karmic patterns', 'past-life imprints', 'destiny patterns'],
        'evolution_stage': ['soul evolution stage', 'evolution stage', 'spiritual development', 'soul maturity'],
        'life_mission': ['life mission', 'dharma', 'dharmic path', 'life purpose alignment'],
        'karmic_lessons': ['karmic lessons', 'lessons in this lifetime', 'core lessons', 'spiritual lessons'],
        'soul_connections': ['soul connections', 'soul group', 'karmic bonds', 'soulmate indicators'],
        'timing': ['timing of karmic events', 'karmic timing', 'activation periods', 'key timing'],
        'spiritual_gifts': ['spiritual gifts', 'abilities', 'innate talents', 'past-life skills'],

        # PAST LIVES specific headers
        'recent_life': ['most recent past life', 'recent life', 'previous incarnation', 'last life'],
        'significant_lives': ['significant past lives', 'major incarnations', '3-5 lives', 'important lives'],
        'karmic_patterns': ['recurring karmic patterns', 'karmic patterns', 'repeating patterns'],
        'past_skills': ['past life skills', 'talents carried forward', 'natural abilities'],
        'traumas_healing': ['past life traumas', 'traumas needing healing', 'fears and blocks'],
        'past_relationships': ['past life relationships', 'karmic connections', 'soulmate recognition'],
        'karmic_debts': ['karmic debts', 'debts from past lives', 'unfulfilled promises'],
        'spiritual_progress': ['past life spiritual progress', 'spiritual development', 'enlightenment level'],

        # FUTURE LIVES specific headers
        'next_incarnation': ['next immediate incarnation', 'next incarnation', 'next life'],
        'evolution_trajectory': ['soul evolution trajectory', 'next 3-5 lives', 'projected development'],
        'final_birth_conditions': ['conditions for final birth', 'final birth', 'karmic completion'],
        'future_scenarios': ['future life scenarios', 'future scenarios', 'possible trajectories'],
        'moksha_timeline': ['moksha timeline', 'liberation timeline', 'estimated lifetimes'],
        'higher_realms': ['higher realms', 'deva realms', 'realm accessibility'],
        'bodhisattva_path': ['bodhisattva path', 'service incarnations', 'return as guide'],
        'ultimate_destiny': ["soul's ultimate destiny", 'ultimate destiny', 'final destination'],

        # PRESENT LIFE specific headers
        'current_phase': ['current life phase', 'current phase', 'life now', 'present circumstances'],
        'career': ['career', 'professional path', 'vocation', 'work'],
        'relationships': ['relationships', 'partnerships', 'romantic dynamics'],
        'health': ['health', 'wellbeing', 'vitality', 'health tendencies'],
        'finances': ['financial prospects', 'finances', 'wealth', 'money patterns'],
        'spiritual_growth': ['spiritual growth', 'inner development', 'spiritual opportunities'],
        'education': ['education', 'skill development', 'learning', 'study'],
        'life_purpose': ['life purpose alignment', 'purpose', 'daily alignment'],
        'challenges': ['challenges', 'lessons', 'obstacles', 'karmic roots'],

        # LIFE EVENTS specific headers
        'yearly_forecast': ['year-by-year forecast', 'yearly forecast', 'annual forecast'],
        'marriage_timing': ['marriage', 'partnerships', 'marriage timing', 'commitment'],
        'career_milestones': ['career milestones', 'career peaks', 'promotions'],
        'children_family': ['children', 'family', 'family growth', 'family expansion'],
        'financial_events': ['financial breakthroughs', 'financial events', 'wealth timing'],
        'health_alerts': ['health alerts', 'health windows', 'health sensitive'],
        'spiritual_milestones': ['spiritual milestones', 'spiritual breakthroughs'],
        'relocations': ['relocations', 'travel', 'move timing'],
        'favorable_periods': ['favorable periods', 'favorable dasha', 'growth periods'],
        'challenging_periods': ['challenging periods', 'difficult periods', 'testing phases'],
        'transits': ['critical transits', 'transit events', 'major transits'],
        'age_milestones': ['age milestones', 'specific ages', 'key ages'],

        # KARMIC REMEDIES specific headers
        'mantras': ['mantras', 'sacred sounds', 'chanting'],
        'gemstones': ['gemstones', 'gem therapy', 'stones'],
        'yantras': ['yantras', 'sacred geometry', 'yantra worship'],
        'charitable_activities': ['charitable activities', 'dana', 'donations', 'charity'],
        'fasting': ['fasting', 'austerities', 'vrata'],
        'deity_worship': ['deity worship', 'prayers', 'puja'],
        'pilgrimage': ['pilgrimage', 'sacred sites', 'tirth yatra'],
        'lifestyle': ['lifestyle', 'daily routine', 'behavioral practices'],
        'planetary_rituals': ['planetary rituals', 'graha shanti', 'homa'],
        'karmic_cleansing': ['karmic cleansing', 'purification', 'forgiveness'],
        'service': ['seva', 'service', 'community service'],
        'meditation': ['meditation', 'inner practices', 'contemplation'],

        # RELATIONSHIPS specific headers
        'romantic_marriage': ['romantic relationships', 'marriage', 'romantic'],
        'family': ['family dynamics', 'family', 'parent-child'],
        'soul_connections': ['soul connections', 'soulmate', 'soul group'],
        'friendships': ['friendships', 'community', 'friends'],
        'professional': ['professional relationships', 'workplace', 'colleagues'],
        'communication': ['communication', 'conflict resolution', 'expression'],
        'healing': ['relationship healing', 'forgiveness', 'trust building'],
        'healthy_practices': ['healthy relationship practices', 'harmony', 'nurturing'],

        # PREDICTIONS specific headers
        'daily': ['daily forecast', 'daily', "today's forecast"],
        'weekly': ['weekly forecast', 'weekly', 'this week'],
        'monthly': ['monthly forecast', 'monthly', 'this month'],
        'yearly': ['yearly forecast', 'yearly', 'this year', 'annual'],

        # KARMA RESET specific headers
        'reset_overview': ['karma reset overview', 'reset overview', 'release patterns'],
        'release_practices': ['release practices', 'letting go', 'closure'],
        'daily_reset': ['daily reset ritual', 'daily reset', 'grounding'],
        'affirmations': ['affirmations', 'anchor affirmations', 'mantras'],
        'integration': ['integration guidance', 'integration', 'sustainability'],
    }


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
        'karma_reset': [
            'reset_overview',
            'release_practices',
            'daily_reset',
            'affirmations',
            'integration'
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
    SECTION_HEADERS = _get_default_section_headers()
    
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
                return markdown_section, "markdown"

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
                # Numbered sections with parentheses or separators
                rf'\n\(?\d+(?:\.\d+)*\)?[\).\-\:]\s*{re.escape(header)}\s*[:\n]?(.*?)(?=\n\(?\d+(?:\.\d+)*\)?[\).\-\:]|\n##|\Z)',
                # Roman numeral numbering (I., II., etc.)
                rf'\n[IVXLCDM]+[\).\-\:]\s*{re.escape(header)}\s*[:\n]?(.*?)(?=\n[IVXLCDM]+[\).\-\:]|\n##|\Z)',
                # Without markdown symbols (plain text headers)
                rf'\n{re.escape(header)}\s*[:\n](.*?)(?=\n[A-Z][a-z]+[^\n]*[:\n]|\n\d+\. |\Z)',
                # Bold or emphasized headers
                rf'\*\*\s*(?:\(?\d+(?:\.\d+)*\)?|[IVXLCDM]+)?\s*[\).\-\:]?\s*{re.escape(header)}\*\*\s*[:\n]?(.*?)(?=\n\*\*|\n##|\Z)',
                # Bullet list headers
                rf'^\s*[-*+]\s*\d*\.?\s*{re.escape(header)}\s*[:\n](.*?)(?=\n\s*[-*+]\s|\n#+\s|\Z)',
                # Header with colon on same line
                rf'{re.escape(header)}:\s*(.*?)(?=\n[A-Z][a-z]+.*? :|\n##|\n\d+\.|\Z)',
                # "Section 1: Header" style
                rf'\nSection\s+\d+(?:\.\d+)*\s*[:\-\)]\s*{re.escape(header)}\s*[:\n]?(.*?)(?=\nSection\s+\d+(?:\.\d+)*\s*[:\-\)]|\n##|\Z)',
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
            return normalized_result, "normalized"

        # Try generic extraction by section number or keywords
        fuzzy_result = self._extract_by_fuzzy_title(text, section_key)
        if fuzzy_result:
            logger.info(f"Section '{section_key}': Extracted {len(fuzzy_result)} chars via fuzzy title matching")
            return fuzzy_result, "fuzzy"

        logger.info(f"Section '{section_key}': No header match found, trying keyword extraction")
        keyword_result = self._extract_by_keywords(text, section_key)

        if keyword_result:
            logger.info(f"Section '{section_key}': Extracted {len(keyword_result)} chars via keyword search")
            return keyword_result, "keyword"

        return "", "none"

    def _extract_markdown_section(self, text: str, header: str) -> str:
        """
        Extract a markdown section by header, preserving nested subheaders.
        """
        if not text or not header:
            return ""
        target = self._normalize_title(header)
        if not target:
            return ""

        lines = text.splitlines()
        for index, line in enumerate(lines):
            match = re.match(r"^(#{1,6})\s*(.+)$", line.strip())
            if not match:
                continue
            level = len(match.group(1))
            candidate = self._strip_header_markers(match.group(2))
            if self._normalize_title(candidate) != target:
                continue

            content_lines = []
            for following in range(index + 1, len(lines)):
                next_line = lines[following]
                next_match = re.match(r"^(#{1,6})\s+.+$", next_line.strip())
                if next_match and len(next_match.group(1)) <= level:
                    break
                content_lines.append(next_line)
            content = "\n".join(content_lines).strip()
            if content:
                return content

        return ""

    def _extract_by_fuzzy_title(self, text: str, section_key: str) -> str:
        """
        Extract content using fuzzy title similarity against paragraph headings.
        """
        return self._extract_by_title_similarity(text, section_key)

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
        cleaned = re.sub(r"^\s*[-*+]\s*", "", cleaned)
        cleaned = re.sub(
            r"^\s*section\s+\d+(?:\.\d+)*\s*[:\-\)]\s*",
            "",
            cleaned,
            flags=re.IGNORECASE
        )
        cleaned = re.sub(r"^\s*\(?\d+(?:\.\d+)*\)?\s*[\).\-\:]?\s*", "", cleaned)
        cleaned = re.sub(r"^\s*[IVXLCDM]+\s*[\).\-\:]?\s*", "", cleaned, flags=re.IGNORECASE)
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
        if re.match(r"^\(?\d+(?:\.\d+)*\)?[\).\-\:]\s+\S", stripped):
            return True
        if re.match(r"^[IVXLCDM]+[\).\-\:]\s+\S", stripped, re.IGNORECASE):
            return True
        if re.match(r"^section\s+\d+(?:\.\d+)*\s*[:\-\)]\s+\S", stripped, re.IGNORECASE):
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
        if not title:
            return ""
        cleaned = self._strip_header_markers(title)
        cleaned = re.sub(r"[^\w\s]", "", cleaned.lower())
        return re.sub(r"\s+", " ", cleaned).strip()

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
        request_id: Optional[str] = None,
        include_status: bool = False
    ) -> str:
        """
        Generate missing section using AI with specific prompts

        Args:
            section_key: Key of missing section
            full_text: Full prediction text for context
            category: Category name
            birth_data: Birth chart data
            request_id: Optional request ID for tracking
            include_status: If True, returns tuple (content, status, fallback_reason)

        Returns:
            Generated section content or fallback text. When include_status is True,
            returns a tuple of (content, status, fallback_reason).
        """

        if not self.openai_service:
            self._track_fallback_usage("missing_section_fallback", section_key, category)
            fallback_content = self._get_category_specific_fallback(section_key, category, birth_data)
            if include_status:
                return fallback_content, "fallback", "openai_unavailable"
            return fallback_content

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
            fallback_content = self._get_category_specific_fallback(section_key, category, birth_data)
            if include_status:
                return fallback_content, "fallback", str(e)
            return fallback_content
    
    def _get_category_specific_fallback(self, section_key: str, category: str, birth_data: Dict) -> str:
        """
        Get category-specific fallback content for a section.

        Args:
            section_key: Section key
            category: Category name
            birth_data: Birth data

        Returns:
            Category-specific fallback content
        """
        zodiac = birth_data.get('zodiac_sign', 'your zodiac sign')
        nakshatra = birth_data.get('nakshatra', 'your nakshatra')

        # Category-specific fallback content
        fallbacks = {
            'life_events': {
                'yearly_forecast': f"Based on your {zodiac} zodiac and {nakshatra} nakshatra, the upcoming year brings significant opportunities for growth. Key periods to watch include Saturn and Jupiter transits that may affect your career and personal development.",
                'marriage_timing': f"For {zodiac} natives, favorable marriage timing typically aligns with Venus and Jupiter dashas. Look for periods when benefic planets transit your 7th house for optimal partnership opportunities.",
                'career_milestones': f"Career advancement for {zodiac} typically comes during Sun and Jupiter dasha periods. Focus on building skills and networking during Saturn transits for long-term success.",
                'children_family': f"Family growth is favored during Jupiter's influence on your 5th house. For {nakshatra} natives, auspicious timing for children relates to your nakshatra lord's position.",
                'financial_events': f"Financial breakthroughs for {zodiac} often occur during Jupiter and Venus dasha periods. Strategic investments during favorable transits can yield significant returns.",
                'health_alerts': f"Health requires attention during Saturn transits for {zodiac} natives. Preventive care and healthy lifestyle choices are emphasized during challenging planetary periods.",
                'spiritual_milestones': f"Spiritual breakthroughs occur during Ketu periods and when Jupiter aspects your 9th house. {nakshatra} natives have natural spiritual inclinations to develop.",
                'relocations': f"Relocation opportunities arise during Rahu transits for {zodiac} natives. Consider moves during favorable dasha periods for career or personal growth.",
                'education': f"Educational pursuits are favored during Mercury and Jupiter dashas for {zodiac}. Higher learning timing aligns with beneficial planetary combinations.",
                'favorable_periods': f"Jupiter and Venus dashas bring overall favorable conditions for {zodiac} natives. These periods support growth, relationships, and prosperity.",
                'challenging_periods': f"Saturn and Rahu dashas bring tests and lessons. For {nakshatra} natives, approach these periods with patience and spiritual practice.",
                'transits': f"Major transits of Jupiter and Saturn significantly impact life direction for {zodiac}. Plan important decisions when benefic planets support your chart.",
                'age_milestones': f"Key ages for {zodiac} include Saturn return cycles (28-30, 58-60) and Jupiter returns (every 12 years). These bring major life shifts and opportunities."
            },
            'relationships': {
                'romantic_marriage': f"For {zodiac} natives, romantic connections thrive when Venus is well-placed. Your {nakshatra} influences attraction patterns and partner compatibility.",
                'family': f"Family dynamics for {zodiac} involve karmic lessons in nurturing and boundaries. Your {nakshatra} shapes your approach to family responsibilities.",
                'soul_connections': f"Soul connections for {nakshatra} natives are recognized through immediate familiarity and shared purpose. Trust your intuition when meeting karmic partners.",
                'friendships': f"Friendships for {zodiac} are built on shared values and mutual growth. Your {nakshatra} influences your social circle and community alignment.",
                'professional': f"Professional relationships for {zodiac} thrive with clear communication and respect. Build strategic alliances during favorable Mercury periods.",
                'karmic_patterns': f"Relationship patterns for {nakshatra} natives often reflect past-life dynamics. Awareness of recurring themes helps break limiting cycles.",
                'communication': f"Communication style for {zodiac} benefits from mindful expression. Active listening and compassionate speech strengthen all relationships.",
                'timing': f"Relationship milestones align with Venus and Jupiter transits for {zodiac}. Use favorable periods for commitments and deepening connections.",
                'healing': f"Relationship healing for {nakshatra} involves forgiveness and self-awareness. Energy work and conscious practices support emotional restoration.",
                'healthy_practices': f"Daily practices for relationship harmony include gratitude, quality time, and maintaining individuality while partnering for {zodiac} natives."
            },
            'karmic_remedies': {
                'mantras': f"For {zodiac} natives, mantra practice strengthens planetary energies. The Gayatri Mantra (108 repetitions daily) supports overall spiritual protection.",
                'gemstones': f"Gemstone recommendations for {zodiac} depend on ascendant lord. Wear 3-5 carats in appropriate metal after proper energization ceremony.",
                'yantras': f"Sri Yantra benefits all signs for prosperity and spiritual growth. For {nakshatra} natives, specific planetary yantras enhance remedial effects.",
                'charitable_activities': f"Charitable activities for {zodiac} include Saturday donations for Saturn and Thursday offerings for Jupiter. Dana purifies karma effectively.",
                'fasting': f"Fasting practices for {nakshatra} align with planetary days. Ekadashi fasting twice monthly supports spiritual purification.",
                'deity_worship': f"Deity worship for {zodiac} connects with your ishta devata. Daily prayers and offerings deepen spiritual connection.",
                'pilgrimage': f"Sacred sites aligned with {nakshatra} support karmic healing. Timing pilgrimages during favorable dashas enhances benefits.",
                'lifestyle': f"Lifestyle modifications for {zodiac} include early rising, meditation, and sattvic diet. These practices support planetary balance.",
                'planetary_rituals': f"Graha shanti rituals for {nakshatra} natives appease afflicted planets. Consult a qualified priest for proper procedure.",
                'karmic_cleansing': f"Karmic cleansing for {zodiac} involves forgiveness practice and conscious release. Weekly meditation supports this process.",
                'service': f"Seva activities for {nakshatra} balance karma through selfless service. Community contribution aligned with your skills is most effective.",
                'meditation': f"Meditation practice for {zodiac} brings peace and clarity. 20-30 minutes daily, morning and evening, transforms consciousness."
            },
            'predictions': {
                'daily': f"Today's energy for {zodiac} with {nakshatra} nakshatra favors focused work and mindful communication. Auspicious timing: morning and early evening.",
                'weekly': f"This week brings opportunities for {zodiac} natives. Mid-week is most favorable for important meetings. Weekend supports rest and spiritual practice.",
                'monthly': f"This month emphasizes growth for {nakshatra} natives. Financial matters improve in the second half. Schedule important activities during favorable lunar phases.",
                'yearly': f"This year offers significant growth for {zodiac}. Stay focused on goals while maintaining balance. Major breakthroughs expected during Jupiter's favorable transits."
            }
        }

        category_fallbacks = fallbacks.get(category, {})
        if section_key in category_fallbacks:
            return category_fallbacks[section_key]

        # Generic fallback
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

        # Category-specific prompts
        category_prompts = {
            'karmic_journey': {
                'soul_purpose': f"""Generate ONLY the Soul's Primary Purpose section for KARMIC JOURNEY category.
Birth Data: Zodiac: {birth_data.get('zodiac_sign', 'N/A')}, Nakshatra: {birth_data.get('nakshatra', 'N/A')}, Ascendant: {birth_data.get('ascendant', 'N/A')}
Focus on: Why this soul incarnated, cosmic mission, core spiritual lessons.
Minimum 200 words with actionable guidance.""",
                'karmic_blueprint': f"""Generate ONLY the Karmic Blueprint section for KARMIC JOURNEY category.
Birth Data: Zodiac: {birth_data.get('zodiac_sign', 'N/A')}, Nakshatra: {birth_data.get('nakshatra', 'N/A')}, Rahu: {birth_data.get('rahu_position', 'N/A')}, Ketu: {birth_data.get('ketu_position', 'N/A')}
Focus on: Past-life imprints, karmic debts/credits, planetary yogas indicating destiny.
Minimum 200 words with specific astrological references.""",
                'evolution_stage': f"""Generate ONLY the Soul Evolution Stage section for KARMIC JOURNEY category.
Birth Data: Zodiac: {birth_data.get('zodiac_sign', 'N/A')}, Nakshatra: {birth_data.get('nakshatra', 'N/A')}
Focus on: Current stage of soul development, progress toward moksha, indicators of spiritual maturity.
Minimum 200 words.""",
            },
            'life_events': {
                'yearly_forecast': f"""Generate ONLY the Year-by-Year Forecast section for LIFE EVENTS category.
Birth Data: Zodiac: {birth_data.get('zodiac_sign', 'N/A')}, Nakshatra: {birth_data.get('nakshatra', 'N/A')}, Age: {birth_data.get('age', 'N/A')}
Focus on: Yearly themes, turning points, key focus areas based on dashas and transits.
Include month-by-month highlights with specific timing. Minimum 250 words.""",
                'marriage_timing': f"""Generate ONLY the Marriage & Partnerships section for LIFE EVENTS category.
Birth Data: Zodiac: {birth_data.get('zodiac_sign', 'N/A')}, Nakshatra: {birth_data.get('nakshatra', 'N/A')}, Age: {birth_data.get('age', 'N/A')}
Focus on: Timing windows for marriage/commitment, relationship event predictions, Venus/Jupiter influence.
Provide specific timing with month-level accuracy. Minimum 200 words.""",
                'career_milestones': f"""Generate ONLY the Career Milestones section for LIFE EVENTS category.
Birth Data: Zodiac: {birth_data.get('zodiac_sign', 'N/A')}, Nakshatra: {birth_data.get('nakshatra', 'N/A')}, Age: {birth_data.get('age', 'N/A')}
Focus on: Career peaks, promotions, job changes, best timing for professional moves.
Minimum 200 words with specific dasha timing.""",
            },
            'relationships': {
                'romantic_marriage': f"""Generate ONLY the Romantic Relationships & Marriage section for RELATIONSHIPS category.
Birth Data: Zodiac: {birth_data.get('zodiac_sign', 'N/A')}, Nakshatra: {birth_data.get('nakshatra', 'N/A')}
Focus on: Romantic patterns, partner qualities, marriage dynamics, compatibility factors.
Minimum 200 words with practical relationship guidance.""",
                'family': f"""Generate ONLY the Family Dynamics section for RELATIONSHIPS category.
Birth Data: Zodiac: {birth_data.get('zodiac_sign', 'N/A')}, Nakshatra: {birth_data.get('nakshatra', 'N/A')}
Focus on: Family karma, parent-child dynamics, healing family patterns, responsibilities.
Minimum 200 words.""",
                'soul_connections': f"""Generate ONLY the Soul Connections section for RELATIONSHIPS category.
Birth Data: Zodiac: {birth_data.get('zodiac_sign', 'N/A')}, Nakshatra: {birth_data.get('nakshatra', 'N/A')}
Focus on: Soulmate indicators, karmic bonds, recognition signs, soul group lessons.
Minimum 200 words.""",
            },
            'karmic_remedies': {
                'mantras': f"""Generate ONLY the Mantras section for KARMIC REMEDIES category.
Birth Data: Zodiac: {birth_data.get('zodiac_sign', 'N/A')}, Nakshatra: {birth_data.get('nakshatra', 'N/A')}
Focus on: Specific mantras with Sanskrit text, pronunciation, counts (108 times), best timing for chanting.
Include at least 3 specific mantras for this chart. Minimum 200 words.""",
                'gemstones': f"""Generate ONLY the Gemstones section for KARMIC REMEDIES category.
Birth Data: Zodiac: {birth_data.get('zodiac_sign', 'N/A')}, Nakshatra: {birth_data.get('nakshatra', 'N/A')}, Ascendant: {birth_data.get('ascendant', 'N/A')}
Focus on: Recommended stones with carats, metal, finger, energization process.
Include primary and secondary stone recommendations. Minimum 200 words.""",
                'yantras': f"""Generate ONLY the Yantras section for KARMIC REMEDIES category.
Birth Data: Zodiac: {birth_data.get('zodiac_sign', 'N/A')}, Nakshatra: {birth_data.get('nakshatra', 'N/A')}
Focus on: Specific yantras, activation methods, placement guidance, worship rituals.
Minimum 200 words.""",
            },
            'predictions': {
                'daily': f"""Generate ONLY the Daily Forecast section for PREDICTIONS category.
Birth Data: Zodiac: {birth_data.get('zodiac_sign', 'N/A')}, Nakshatra: {birth_data.get('nakshatra', 'N/A')}
Focus on: Today's energy, focus areas, auspicious timing, cautions.
Include lucky color, number, and specific hourly guidance. Minimum 150 words.""",
                'weekly': f"""Generate ONLY the Weekly Forecast section for PREDICTIONS category.
Birth Data: Zodiac: {birth_data.get('zodiac_sign', 'N/A')}, Nakshatra: {birth_data.get('nakshatra', 'N/A')}
Focus on: Week's themes, opportunities, challenges, best days for activities.
Provide day-by-day highlights. Minimum 200 words.""",
                'monthly': f"""Generate ONLY the Monthly Forecast section for PREDICTIONS category.
Birth Data: Zodiac: {birth_data.get('zodiac_sign', 'N/A')}, Nakshatra: {birth_data.get('nakshatra', 'N/A')}
Focus on: Monthly themes, important dates, progress checkpoints.
Break down by weeks. Minimum 250 words.""",
                'yearly': f"""Generate ONLY the Yearly Forecast section for PREDICTIONS category.
Birth Data: Zodiac: {birth_data.get('zodiac_sign', 'N/A')}, Nakshatra: {birth_data.get('nakshatra', 'N/A')}, Age: {birth_data.get('age', 'N/A')}
Focus on: Year-long themes, major milestones, growth areas.
Include quarter-by-quarter guidance. Minimum 300 words.""",
            }
        }

        # Check for category-specific prompt
        if category in category_prompts and section_key in category_prompts[category]:
            return category_prompts[category][section_key]

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

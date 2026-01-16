"""
Response Polisher Service
Enhances AI-generated predictions for readability, authenticity, and user-friendliness
"""

import re
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass


@dataclass
class PolishingResult:
    """Result of polishing operation"""
    polished_text: str
    improvements: List[str]
    readability_score: float
    word_count: int
    sentence_count: int
    avg_sentence_length: float


class ResponsePolisher:
    """
    Polishes AI-generated predictions to ensure high quality,
    readability, and user-friendliness
    """

    def __init__(self):
        self.unwanted_phrases = self._init_unwanted_phrases()
        self.replacement_patterns = self._init_replacement_patterns()

    def _init_unwanted_phrases(self) -> List[Tuple[str, str]]:
        """Initialize phrases to avoid and their replacements"""
        return [
            # Remove AI-like meta commentary
            (r"as an ai", ""),
            (r"i cannot", "this analysis focuses on"),
            (r"i don't have", "this reading explores"),
            (r"it's important to note", ""),
            (r"please note that", ""),
            (r"it should be noted", ""),

            # Remove hedging language
            (r"might possibly", "may"),
            (r"could potentially", "can"),
            (r"seems to suggest", "suggests"),
            (r"appears to indicate", "indicates"),
            (r"tends to show", "shows"),

            # Remove disclaimers (we'll add appropriate ones separately)
            (r"this is not professional advice", ""),
            (r"consult a professional", ""),
            (r"disclaimer:.*?\.", ""),

            # Remove generic transitions
            (r"in conclusion,", ""),
            (r"to summarize,", ""),
            (r"in summary,", ""),
        ]

    def _init_replacement_patterns(self) -> List[Tuple[str, str]]:
        """Initialize text improvement patterns"""
        return [
            # Improve readability
            (r'\s+', ' '),  # Multiple spaces to single space
            (r'\n\n\n+', '\n\n'),  # Multiple newlines to double newline
            (r'([.!?])\s*([A-Z])', r'\1 \2'),  # Ensure space after punctuation

            # Fix common grammar issues
            (r'\s+([.,!?;:])', r'\1'),  # Remove space before punctuation
            (r'([.!?])([A-Za-z])', r'\1 \2'),  # Add space after punctuation

            # Enhance formatting
            (r'\*\*([^*]+)\*\*', r'\1'),  # Remove markdown bold (we'll add headers differently)
        ]

    def polish_prediction(
        self,
        raw_text: str,
        category: str = 'general',
        max_words: Optional[int] = None
    ) -> str:
        """
        Polish a raw prediction for optimal readability and user-friendliness
        """

        if not raw_text or not raw_text.strip():
            return ""

        text = raw_text

        # Step 1: Remove unwanted phrases
        text = self._remove_unwanted_phrases(text)

        # Step 2: Improve formatting
        text = self._improve_formatting(text)

        # Step 3: Enhance structure
        text = self._enhance_structure(text)

        # Step 4: Improve readability
        text = self._improve_readability(text)

        # Step 5: Add appropriate section headers
        text = self._add_section_headers(text, category)

        # Step 6: Trim to max words if specified
        if max_words:
            text = self._trim_to_max_words(text, max_words)

        # Step 7: Final cleanup
        text = self._final_cleanup(text)

        return text.strip()

    def _remove_unwanted_phrases(self, text: str) -> str:
        """Remove unwanted phrases and AI-like language"""
        for pattern, replacement in self.unwanted_phrases:
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        return text

    def _improve_formatting(self, text: str) -> str:
        """Improve text formatting"""
        for pattern, replacement in self.replacement_patterns:
            text = re.sub(pattern, replacement, text)
        return text

    def _enhance_structure(self, text: str) -> str:
        """Enhance text structure with proper paragraphs"""

        # Split into paragraphs
        paragraphs = text.split('\n\n')

        # Process each paragraph
        enhanced_paragraphs = []
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # Break up very long paragraphs
            if len(para.split()) > 100:
                # Split at sentence boundaries
                sentences = re.split(r'([.!?])\s+', para)
                current_para = ""
                for i in range(0, len(sentences), 2):
                    sentence = sentences[i] + (sentences[i+1] if i+1 < len(sentences) else "")
                    current_para += sentence + " "

                    # Break after ~50 words
                    if len(current_para.split()) > 50:
                        enhanced_paragraphs.append(current_para.strip())
                        current_para = ""

                if current_para:
                    enhanced_paragraphs.append(current_para.strip())
            else:
                enhanced_paragraphs.append(para)

        return '\n\n'.join(enhanced_paragraphs)

    def _improve_readability(self, text: str) -> str:
        """Improve overall readability"""

        # Replace complex words with simpler alternatives
        simple_replacements = {
            'utilize': 'use',
            'facilitate': 'help',
            'implement': 'use',
            'endeavor': 'try',
            'commence': 'begin',
            'terminate': 'end',
            'approximately': 'about',
            'sufficient': 'enough',
            'assistance': 'help',
            'demonstrate': 'show',
            'establish': 'set up',
            'subsequent': 'next',
            'prior to': 'before',
            'in order to': 'to',
        }

        for complex_word, simple_word in simple_replacements.items():
            text = re.sub(
                r'\b' + complex_word + r'\b',
                simple_word,
                text,
                flags=re.IGNORECASE
            )

        return text

    def _add_section_headers(self, text: str, category: str) -> str:
        """Add clear section headers"""

        # Detect potential sections based on content
        paragraphs = text.split('\n\n')

        if len(paragraphs) < 3:
            return text  # Too short to need headers

        # Add headers based on content patterns
        enhanced_text = []

        for i, para in enumerate(paragraphs):
            # First paragraph - Introduction
            if i == 0:
                enhanced_text.append(para)
                continue

            # Detect action/remedy paragraphs
            if any(word in para.lower() for word in ['practice', 'try', 'consider', 'focus', 'engage']):
                if not any(header in para for header in ['**', '###', '##']):
                    enhanced_text.append(f"**Practical Guidance:**\n\n{para}")
                else:
                    enhanced_text.append(para)
            else:
                enhanced_text.append(para)

        return '\n\n'.join(enhanced_text)

    def _trim_to_max_words(self, text: str, max_words: int) -> str:
        """Trim text to maximum word count while preserving complete sentences"""

        words = text.split()

        if len(words) <= max_words:
            return text

        # Find the last complete sentence within word limit
        trimmed_text = ' '.join(words[:max_words])

        # Find last sentence ending
        last_sentence_end = max(
            trimmed_text.rfind('.'),
            trimmed_text.rfind('!'),
            trimmed_text.rfind('?')
        )

        if last_sentence_end > 0:
            return trimmed_text[:last_sentence_end + 1]

        # If no sentence ending found, just add ellipsis
        return trimmed_text + '...'

    def _final_cleanup(self, text: str) -> str:
        """Final cleanup and polish"""

        # Remove multiple consecutive punctuation
        text = re.sub(r'([.!?]){2,}', r'\1', text)

        # Ensure single space after punctuation
        text = re.sub(r'([.!?])\s+', r'\1 ', text)

        # Remove trailing/leading whitespace
        text = text.strip()

        # Ensure text ends with punctuation
        if text and text[-1] not in '.!?':
            text += '.'

        return text

    def calculate_readability_score(self, text: str) -> float:
        """
        Calculate a readability score (0-1, higher is better)
        Based on Flesch Reading Ease adapted for predictions
        """

        if not text or not text.strip():
            return 0.0

        # Count sentences
        sentences = len(re.findall(r'[.!?]+', text))
        if sentences == 0:
            sentences = 1

        # Count words
        words = len(text.split())
        if words == 0:
            return 0.0

        # Count syllables (approximation)
        syllables = self._count_syllables(text)

        # Average sentence length
        avg_sentence_length = words / sentences

        # Average syllables per word
        avg_syllables_per_word = syllables / words

        # Modified Flesch Reading Ease
        # Formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
        # We normalize to 0-1 range
        flesch_score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables_per_word)

        # Normalize to 0-1 (original range is roughly 0-100)
        normalized_score = max(0.0, min(1.0, flesch_score / 100))

        # Additional factors
        # Penalize very long paragraphs
        paragraphs = text.split('\n\n')
        avg_para_length = sum(len(p.split()) for p in paragraphs) / max(len(paragraphs), 1)
        para_penalty = 1.0 if avg_para_length < 80 else 0.9

        # Reward clear structure
        has_headers = '**' in text or '###' in text
        structure_bonus = 1.05 if has_headers else 1.0

        # Calculate final score
        final_score = normalized_score * para_penalty * structure_bonus

        return max(0.0, min(1.0, final_score))

    def _count_syllables(self, text: str) -> int:
        """Approximate syllable count"""
        # Simple approximation: count vowel groups
        text = text.lower()
        count = 0
        vowels = 'aeiouy'
        previous_was_vowel = False

        for char in text:
            is_vowel = char in vowels
            if is_vowel and not previous_was_vowel:
                count += 1
            previous_was_vowel = is_vowel

        # Adjust for common patterns
        count -= text.count('e ') + text.count('e\n') + text.count('e.')
        count = max(1, count)  # At least one syllable per word

        return count

    def get_detailed_analysis(self, text: str) -> PolishingResult:
        """Get detailed analysis of polished text"""

        words = text.split()
        word_count = len(words)

        sentences = re.findall(r'[.!?]+', text)
        sentence_count = len(sentences)

        avg_sentence_length = word_count / max(sentence_count, 1)

        readability_score = self.calculate_readability_score(text)

        improvements = []
        if readability_score > 0.7:
            improvements.append("Excellent readability")
        if avg_sentence_length < 20:
            improvements.append("Good sentence length")
        if '\n\n' in text:
            improvements.append("Well-structured paragraphs")

        return PolishingResult(
            polished_text=text,
            improvements=improvements,
            readability_score=readability_score,
            word_count=word_count,
            sentence_count=sentence_count,
            avg_sentence_length=avg_sentence_length
        )

    def ensure_vedic_authenticity(self, text: str, corpus_refs: List[str]) -> str:
        """Ensure text maintains Vedic authenticity"""

        # Add subtle references to Vedic sources if not present
        if corpus_refs and not any(ref.lower() in text.lower() for ref in ['bhrigu', 'nadi', 'vedic']):
            # Add a gentle attribution
            attribution = "\n\n*This guidance draws from ancient Vedic wisdom preserved in sacred texts.*"
            text = text + attribution

        return text

    def add_hope_and_encouragement(self, text: str) -> str:
        """Ensure text ends on a hopeful, encouraging note"""

        encouraging_endings = [
            "Remember, your journey is unique and filled with potential.",
            "Trust in your path and the wisdom within you.",
            "Your growth and evolution are beautiful processes.",
            "May this guidance support you on your journey.",
            "You have the strength and wisdom to navigate your path beautifully.",
        ]

        # Check if text already ends encouragingly
        last_sentence = text.split('.')[-2] if '.' in text else text

        has_encouragement = any(
            word in last_sentence.lower()
            for word in ['trust', 'believe', 'potential', 'growth', 'journey', 'wisdom', 'beautiful']
        )

        if not has_encouragement:
            # Add an encouraging ending
            import random
            text = text.rstrip('.') + '. ' + random.choice(encouraging_endings)

        return text

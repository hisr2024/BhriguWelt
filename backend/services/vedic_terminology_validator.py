"""
Vedic Terminology Validator - Ensure Authentic Vedic Language

Features:
- Validates AI responses use authentic Vedic terminology
- Checks for proper Sanskrit transliteration
- Verifies Sutra references and citations
- Flags modern/Western astrology terms
- Suggests Vedic alternatives

Author: BhriguWelt Team
Version: 2.0.0
"""

import re
from typing import List, Dict, Optional, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class TerminologyType(Enum):
    """Types of terminology issues"""
    AUTHENTIC = "authentic"  # Proper Vedic term
    ACCEPTABLE = "acceptable"  # Western term with Vedic equivalent
    QUESTIONABLE = "questionable"  # Potentially inauthentic
    FORBIDDEN = "forbidden"  # Modern/pop astrology term


@dataclass
class ValidationIssue:
    """Represents a terminology validation issue"""
    term: str
    type: TerminologyType
    line_number: int
    context: str
    suggestion: Optional[str] = None
    severity: str = "warning"  # info, warning, error


@dataclass
class ValidationResult:
    """Result of terminology validation"""
    is_valid: bool
    score: float  # 0.0 to 1.0
    issues: List[ValidationIssue]
    vedic_term_count: int
    total_term_count: int
    authenticity_percentage: float
    suggestions: List[str]


class VedicTerminologyValidator:
    """
    Validates that predictions use authentic Vedic terminology
    and avoid modern pop-astrology language
    """

    # Authentic Vedic terms (high confidence)
    AUTHENTIC_TERMS = {
        # Planets (Grahas)
        'surya', 'sun', 'chandra', 'moon', 'mangal', 'mars', 'budh', 'mercury',
        'guru', 'jupiter', 'shukra', 'venus', 'shani', 'saturn', 'rahu', 'ketu',
        'graha', 'grahas',

        # Signs (Rashis)
        'mesha', 'aries', 'vrishabha', 'taurus', 'mithuna', 'gemini',
        'karka', 'cancer', 'simha', 'leo', 'kanya', 'virgo',
        'tula', 'libra', 'vrishchika', 'scorpio', 'dhanu', 'sagittarius',
        'makara', 'capricorn', 'kumbha', 'aquarius', 'meena', 'pisces',
        'rashi', 'rashis',

        # Houses (Bhavas)
        'lagna', 'ascendant', 'bhava', 'bhavas', 'kendra', 'trikona', 'dusthana',

        # Nakshatras
        'nakshatra', 'nakshatras', 'ashwini', 'bharani', 'krittika', 'rohini',
        'mrigashira', 'ardra', 'punarvasu', 'pushya', 'ashlesha', 'magha',
        'purva phalguni', 'uttara phalguni', 'hasta', 'chitra', 'swati',
        'vishakha', 'anuradha', 'jyeshtha', 'mula', 'purva ashadha',
        'uttara ashadha', 'shravana', 'dhanishta', 'shatabhisha',
        'purva bhadrapada', 'uttara bhadrapada', 'revati',

        # Dashas
        'dasha', 'dashas', 'mahadasha', 'antardasha', 'vimshottari',

        # Yogas
        'yoga', 'yogas', 'raja yoga', 'dhana yoga', 'pancha mahapurusha',
        'gaja kesari', 'neecha bhanga', 'vipareeta raja',

        # Concepts
        'karma', 'dharma', 'moksha', 'artha', 'kama', 'purushartha',
        'prarabdha', 'sanchita', 'kriyamana', 'samskara', 'vasana',
        'atman', 'jyotish', 'jyotisha', 'vedic', 'bhrigu', 'nadi',
        'parashara', 'sutra', 'folio', 'leaf', 'manuscript',

        # Technical terms
        'retrograde', 'combustion', 'exaltation', 'debilitation', 'mooltrikona',
        'vargottama', 'pushkara navamsha', 'ashtakavarga',
    }

    # Western/Modern terms that should be avoided or have Vedic equivalents
    WESTERN_TERMS = {
        'horoscope': 'kundali or birth chart',
        'zodiac': 'rashi chakra',
        'star sign': 'sun sign or surya rashi',
        'birth chart': 'kundali or janma patrika',
        'midheaven': '10th house or karma bhava',
        'descendant': '7th house or kalatra bhava',
        'ic': '4th house or sukha bhava',
        'aspects': 'drishtis or planetary aspects',
        'transit': 'gochara',
        'progression': 'used sparingly, prefer dasha timing',
    }

    # Forbidden pop-astrology terms
    FORBIDDEN_TERMS = {
        'vibe', 'vibes', 'energy vampire', 'mercury retrograde shade',
        'big dick energy', 'BDE', 'leo season', 'scorpio energy',
        'toxic', 'red flag', 'green flag', 'gaslight', 'gatekeep', 'girlboss',
        'manifesting', 'manifestation' # unless in proper spiritual context
    }

    # Required citation patterns
    CITATION_PATTERNS = [
        r'Bhrigu Samhita.*Folio \d+',
        r'Nadi Jyotisha.*Leaf \d+',
        r'Parashara.*Chapter \d+',
        r'Brihat Parashara Hora Shastra',
        r'BPHS',
    ]

    def __init__(
        self,
        require_citations: bool = True,
        min_authenticity: float = 0.75,
        strict_mode: bool = False
    ):
        """
        Initialize validator

        Args:
            require_citations: Whether to require Sutra citations
            min_authenticity: Minimum authenticity score (0.0-1.0)
            strict_mode: Reject any Western terms
        """
        self.require_citations = require_citations
        self.min_authenticity = min_authenticity
        self.strict_mode = strict_mode

    def validate(self, text: str, require_citations: Optional[bool] = None) -> ValidationResult:
        """
        Validate text for Vedic authenticity

        Args:
            text: Text to validate
            require_citations: Override instance setting

        Returns:
            ValidationResult with score and issues
        """
        if require_citations is None:
            require_citations = self.require_citations

        issues: List[ValidationIssue] = []
        lines = text.split('\n')

        # Count term usage
        vedic_count = self._count_vedic_terms(text)
        western_count = self._count_western_terms(text)
        forbidden_count = self._count_forbidden_terms(text)
        total_count = vedic_count + western_count + forbidden_count

        # Check each line for issues
        for line_num, line in enumerate(lines, 1):
            # Check for forbidden terms
            forbidden_issues = self._check_forbidden_terms(line, line_num)
            issues.extend(forbidden_issues)

            # Check for Western terms
            western_issues = self._check_western_terms(line, line_num)
            issues.extend(western_issues)

        # Check for citations if required
        if require_citations:
            citation_issues = self._check_citations(text)
            issues.extend(citation_issues)

        # Check Sanskrit transliteration
        transliteration_issues = self._check_transliteration(text)
        issues.extend(transliteration_issues)

        # Calculate authenticity score
        authenticity = self._calculate_authenticity(
            vedic_count, western_count, forbidden_count, len(issues)
        )

        # Determine if valid
        is_valid = (
            authenticity >= self.min_authenticity and
            forbidden_count == 0 and
            (not self.strict_mode or western_count == 0)
        )

        # Generate suggestions
        suggestions = self._generate_suggestions(issues)

        return ValidationResult(
            is_valid=is_valid,
            score=authenticity,
            issues=issues,
            vedic_term_count=vedic_count,
            total_term_count=total_count,
            authenticity_percentage=authenticity * 100,
            suggestions=suggestions
        )

    def _count_vedic_terms(self, text: str) -> int:
        """Count Vedic terminology usage"""
        text_lower = text.lower()
        count = 0
        for term in self.AUTHENTIC_TERMS:
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(term) + r'\b'
            count += len(re.findall(pattern, text_lower))
        return count

    def _count_western_terms(self, text: str) -> int:
        """Count Western terminology usage"""
        text_lower = text.lower()
        count = 0
        for term in self.WESTERN_TERMS.keys():
            pattern = r'\b' + re.escape(term) + r'\b'
            count += len(re.findall(pattern, text_lower))
        return count

    def _count_forbidden_terms(self, text: str) -> int:
        """Count forbidden pop-astrology terms"""
        text_lower = text.lower()
        count = 0
        for term in self.FORBIDDEN_TERMS:
            pattern = r'\b' + re.escape(term) + r'\b'
            count += len(re.findall(pattern, text_lower))
        return count

    def _check_forbidden_terms(self, line: str, line_num: int) -> List[ValidationIssue]:
        """Check for forbidden terms in line"""
        issues = []
        line_lower = line.lower()

        for term in self.FORBIDDEN_TERMS:
            pattern = r'\b' + re.escape(term) + r'\b'
            if re.search(pattern, line_lower):
                issues.append(ValidationIssue(
                    term=term,
                    type=TerminologyType.FORBIDDEN,
                    line_number=line_num,
                    context=line.strip(),
                    suggestion=f"Remove '{term}' - not appropriate for traditional Vedic astrology",
                    severity="error"
                ))

        return issues

    def _check_western_terms(self, line: str, line_num: int) -> List[ValidationIssue]:
        """Check for Western terms that have Vedic equivalents"""
        issues = []
        line_lower = line.lower()

        for western_term, vedic_alternative in self.WESTERN_TERMS.items():
            pattern = r'\b' + re.escape(western_term) + r'\b'
            if re.search(pattern, line_lower):
                severity = "error" if self.strict_mode else "warning"
                issues.append(ValidationIssue(
                    term=western_term,
                    type=TerminologyType.QUESTIONABLE,
                    line_number=line_num,
                    context=line.strip(),
                    suggestion=f"Consider using '{vedic_alternative}' instead of '{western_term}'",
                    severity=severity
                ))

        return issues

    def _check_citations(self, text: str) -> List[ValidationIssue]:
        """Check if text includes proper citations"""
        issues = []
        has_citation = False

        for pattern in self.CITATION_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                has_citation = True
                break

        if not has_citation:
            issues.append(ValidationIssue(
                term="missing_citation",
                type=TerminologyType.QUESTIONABLE,
                line_number=0,
                context="Entire text",
                suggestion="Include at least one citation from Bhrigu Samhita, Nadi Jyotisha, or Parashara",
                severity="warning"
            ))

        return issues

    def _check_transliteration(self, text: str) -> List[ValidationIssue]:
        """Check Sanskrit transliteration consistency"""
        issues = []

        # Common transliteration issues
        problematic_patterns = [
            (r'\bshree\b', 'sri', 'Use standard IAST transliteration: "sri" not "shree"'),
            (r'\bOm\b(?!$)', 'OM', 'Use uppercase OM or Sanskrit ॐ'),
            (r'\bgrah\b', 'graha', 'Use full word "graha" not abbreviated "grah"'),
        ]

        for pattern, correction, suggestion in problematic_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                line_num = text[:match.start()].count('\n') + 1
                context_start = max(0, match.start() - 30)
                context_end = min(len(text), match.end() + 30)
                context = text[context_start:context_end].strip()

                issues.append(ValidationIssue(
                    term=match.group(),
                    type=TerminologyType.ACCEPTABLE,
                    line_number=line_num,
                    context=context,
                    suggestion=suggestion,
                    severity="info"
                ))

        return issues

    def _calculate_authenticity(
        self,
        vedic_count: int,
        western_count: int,
        forbidden_count: int,
        issue_count: int
    ) -> float:
        """
        Calculate authenticity score

        Formula:
        - Base score from term ratio
        - Penalty for Western terms
        - Heavy penalty for forbidden terms
        - Penalty for issues
        """
        total_terms = vedic_count + western_count + forbidden_count

        if total_terms == 0:
            return 0.5  # Neutral if no terminology detected

        # Base score: ratio of Vedic to total terms
        base_score = vedic_count / total_terms if total_terms > 0 else 0

        # Penalty for Western terms (mild)
        western_penalty = (western_count / total_terms) * 0.15 if total_terms > 0 else 0

        # Heavy penalty for forbidden terms
        forbidden_penalty = (forbidden_count / total_terms) * 0.5 if total_terms > 0 else 0

        # Penalty for issues (capped)
        issue_penalty = min(issue_count * 0.05, 0.3)

        # Calculate final score
        score = max(0, min(1.0, base_score - western_penalty - forbidden_penalty - issue_penalty))

        return score

    def _generate_suggestions(self, issues: List[ValidationIssue]) -> List[str]:
        """Generate actionable suggestions from issues"""
        suggestions = set()

        # Count issue types
        forbidden_count = sum(1 for i in issues if i.type == TerminologyType.FORBIDDEN)
        western_count = sum(1 for i in issues if i.type == TerminologyType.QUESTIONABLE)
        missing_citations = any(i.term == "missing_citation" for i in issues)

        # Generate suggestions
        if forbidden_count > 0:
            suggestions.add(
                f"Remove {forbidden_count} forbidden pop-astrology term(s) and use traditional Vedic language"
            )

        if western_count > 0:
            suggestions.add(
                f"Replace {western_count} Western term(s) with authentic Vedic equivalents"
            )

        if missing_citations:
            suggestions.add(
                "Add citations from traditional texts (Bhrigu Samhita, Nadi Jyotisha, or Parashara)"
            )

        # Add specific term suggestions
        for issue in issues[:3]:  # Top 3 issues
            if issue.suggestion and issue.suggestion not in suggestions:
                suggestions.add(issue.suggestion)

        return sorted(list(suggestions))

    def get_vedic_alternative(self, western_term: str) -> Optional[str]:
        """Get Vedic alternative for a Western term"""
        return self.WESTERN_TERMS.get(western_term.lower())

    def is_authentic_term(self, term: str) -> bool:
        """Check if a term is authentically Vedic"""
        return term.lower() in self.AUTHENTIC_TERMS

    def suggest_vedic_terms(self, context: str) -> List[str]:
        """Suggest Vedic terms based on context"""
        suggestions = []
        context_lower = context.lower()

        # Context-based suggestions
        if 'planet' in context_lower or 'celestial' in context_lower:
            suggestions.extend(['graha', 'surya', 'chandra', 'mangal', 'budh', 'guru', 'shukra', 'shani'])

        if 'house' in context_lower or 'area of life' in context_lower:
            suggestions.extend(['bhava', 'lagna', 'kendra', 'trikona'])

        if 'sign' in context_lower or 'zodiac' in context_lower:
            suggestions.extend(['rashi', 'mesha', 'vrishabha', 'mithuna'])

        if 'timing' in context_lower or 'period' in context_lower:
            suggestions.extend(['dasha', 'mahadasha', 'antardasha', 'gochara'])

        if 'soul' in context_lower or 'spiritual' in context_lower:
            suggestions.extend(['atman', 'karma', 'dharma', 'moksha'])

        return suggestions[:5]  # Return top 5


def validate_prediction(
    text: str,
    require_citations: bool = True,
    min_authenticity: float = 0.75
) -> ValidationResult:
    """
    Convenience function to validate a prediction

    Args:
        text: Prediction text to validate
        require_citations: Whether citations are required
        min_authenticity: Minimum authenticity threshold

    Returns:
        ValidationResult
    """
    validator = VedicTerminologyValidator(
        require_citations=require_citations,
        min_authenticity=min_authenticity
    )
    return validator.validate(text)


def format_validation_report(result: ValidationResult) -> str:
    """Format validation result as readable report"""
    report_lines = [
        "=" * 60,
        "VEDIC TERMINOLOGY VALIDATION REPORT",
        "=" * 60,
        f"Overall Status: {'✓ VALID' if result.is_valid else '✗ INVALID'}",
        f"Authenticity Score: {result.authenticity_percentage:.1f}%",
        f"Vedic Terms: {result.vedic_term_count}",
        f"Total Terms: {result.total_term_count}",
        "",
    ]

    if result.issues:
        report_lines.append(f"Issues Found: {len(result.issues)}")
        report_lines.append("-" * 60)

        for i, issue in enumerate(result.issues, 1):
            report_lines.append(f"\n{i}. {issue.severity.upper()}: {issue.term}")
            report_lines.append(f"   Line {issue.line_number}: {issue.context[:60]}...")
            if issue.suggestion:
                report_lines.append(f"   → {issue.suggestion}")

    if result.suggestions:
        report_lines.append("\n" + "=" * 60)
        report_lines.append("SUGGESTIONS FOR IMPROVEMENT:")
        report_lines.append("-" * 60)
        for i, suggestion in enumerate(result.suggestions, 1):
            report_lines.append(f"{i}. {suggestion}")

    report_lines.append("\n" + "=" * 60)

    return "\n".join(report_lines)

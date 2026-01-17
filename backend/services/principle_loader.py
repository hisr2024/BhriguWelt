"""
Unified Principle Loader
Loads all Bhrigu Samhita and Nadi Jyotisha principles from multiple sources
Provides unified access to 155+ rules with source attribution
"""
import os
import json
import yaml
from typing import Dict, Any, List, Optional
from pathlib import Path
from utils.logger import setup_logger

logger = setup_logger(__name__)


class Principle:
    """Represents a single astrological principle with full metadata"""

    def __init__(
        self,
        rule_id: str,
        tradition: str,  # 'bhrigu', 'nadi', or 'derived'
        source_reference: str,
        description: str,
        triggers: Optional[List[str]] = None,
        conditions: Optional[Dict[str, Any]] = None,
        weights: Optional[Dict[str, float]] = None,
        focus_tags: Optional[List[str]] = None,
        narrative: Optional[str] = None,
        confidence: Optional[float] = None,
        panchang_context: Optional[Dict[str, Any]] = None
    ):
        self.rule_id = rule_id
        self.tradition = tradition
        self.source_reference = source_reference
        self.description = description
        self.triggers = triggers or []
        self.conditions = conditions or {}
        self.weights = weights or {}
        self.focus_tags = focus_tags or []
        self.narrative = narrative or description
        self.confidence = confidence or 0.7
        self.panchang_context = panchang_context or {}

    def matches_chart(self, chart_features: Dict[str, Any]) -> bool:
        """Check if this principle applies to the given chart features"""
        if not self.conditions:
            return False  # Rules without conditions require manual evaluation

        for key, condition in self.conditions.items():
            if key not in chart_features:
                return False

            chart_value = chart_features[key]

            if isinstance(condition, dict):
                if 'equals' in condition and chart_value != condition['equals']:
                    return False
                if 'any_of' in condition and chart_value not in condition['any_of']:
                    return False
                if 'min' in condition and chart_value < condition['min']:
                    return False
                if 'max' in condition and chart_value > condition['max']:
                    return False
            else:
                if chart_value != condition:
                    return False

        return True

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation"""
        return {
            'rule_id': self.rule_id,
            'tradition': self.tradition,
            'source_reference': self.source_reference,
            'description': self.description,
            'triggers': self.triggers,
            'conditions': self.conditions,
            'weights': self.weights,
            'focus_tags': self.focus_tags,
            'narrative': self.narrative,
            'confidence': self.confidence,
            'panchang_context': self.panchang_context
        }


class PrincipleLoader:
    """
    Loads and manages all Bhrigu & Nadi principles from multiple sources
    Provides unified access with source attribution
    """

    def __init__(self):
        self.principles: List[Principle] = []
        self.principles_by_id: Dict[str, Principle] = {}
        self.principles_by_tradition: Dict[str, List[Principle]] = {
            'bhrigu': [],
            'nadi': [],
            'derived': []
        }
        self.principles_by_domain: Dict[str, List[Principle]] = {}
        self.loaded = False

        # Dynamic path resolution - try multiple locations
        self.backend_data_path = Path(__file__).parent.parent / 'data'
        self.core_wisdom_paths = self._resolve_core_wisdom_paths()

    def _resolve_core_wisdom_paths(self) -> List[Path]:
        """
        Resolve core_wisdom directory from multiple possible locations.
        Tries locations in order of likelihood based on deployment environment.

        Returns:
            List of Path objects to try for core_wisdom directory
        """
        possible_paths = [
            # Docker/production paths
            Path('/app/core_wisdom'),
            Path('/app/backend/core_wisdom'),

            # Relative to this file (backend/services/principle_loader.py)
            Path(__file__).parent.parent.parent / 'core_wisdom',  # Go up to project root
            Path(__file__).parent.parent / 'core_wisdom',  # Inside backend

            # Development paths
            Path.cwd() / 'core_wisdom',
            Path.cwd() / 'backend' / 'core_wisdom',

            # Environment variable override
        ]

        # Allow environment variable to override
        env_path = os.getenv('CORE_WISDOM_PATH')
        if env_path:
            possible_paths.insert(0, Path(env_path))

        logger.info(f"Attempting to locate core_wisdom directory in {len(possible_paths)} possible locations")

        # Log which paths we're trying
        for i, path in enumerate(possible_paths, 1):
            logger.debug(f"  {i}. {path} (exists: {path.exists()})")

        return possible_paths

    def _find_file(self, filename: str) -> Optional[Path]:
        """
        Find a file in core_wisdom directory by trying all possible paths.

        Args:
            filename: Name of the file to find

        Returns:
            Path object if found, None otherwise
        """
        for base_path in self.core_wisdom_paths:
            file_path = base_path / filename
            if file_path.exists():
                logger.info(f"Found {filename} at {file_path}")
                return file_path

        logger.warning(f"Could not find {filename} in any of the {len(self.core_wisdom_paths)} core_wisdom locations")
        return None

    def load_all(self) -> None:
        """Load all principles from all sources"""
        if self.loaded:
            logger.info("Principles already loaded, skipping")
            return

        logger.info("Loading all Bhrigu & Nadi principles...")

        try:
            # Load from YAML files
            self._load_bhrigu_yaml()
            self._load_nadi_yaml()

            # Load from Markdown files
            self._load_bhrigu_markdown()
            self._load_nadi_markdown()

            # Build indices
            self._build_indices()

            self.loaded = True
            logger.info(f"✓ Loaded {len(self.principles)} total principles")
            logger.info(f"  - Bhrigu: {len(self.principles_by_tradition['bhrigu'])}")
            logger.info(f"  - Nadi: {len(self.principles_by_tradition['nadi'])}")
            logger.info(f"  - Derived: {len(self.principles_by_tradition['derived'])}")

        except Exception as e:
            logger.error(f"Error loading principles: {e}")
            raise

    def _load_bhrigu_yaml(self) -> None:
        """Load principles from bhrigu_samhita_principles.yml"""
        yaml_path = self.backend_data_path / 'bhrigu_samhita_principles.yml'

        if not yaml_path.exists():
            logger.warning(f"Bhrigu YAML not found: {yaml_path}")
            return

        try:
            with open(yaml_path, 'r', encoding='utf-8') as f:
                data = json.load(f)  # It's actually JSON format

            # Load core principles
            for p in data.get('principles', []):
                principle = Principle(
                    rule_id=p['id'],
                    tradition='bhrigu',
                    source_reference=p.get('sutra_reference', ''),
                    description=p['description'],
                    conditions={},
                    weights=p.get('weights', {}),
                    panchang_context=p.get('panchang_context', {}),
                    confidence=max(p.get('weights', {}).values()) if p.get('weights') else 0.7
                )
                self.principles.append(principle)

            # Load past life engines
            for p in data.get('past_life_engines', []):
                principle = Principle(
                    rule_id=p['id'],
                    tradition='bhrigu',
                    source_reference=p.get('sutra_reference', ''),
                    description=p['description'],
                    conditions=p.get('conditions', {}),
                    narrative=p.get('narrative', ''),
                    confidence=p.get('confidence', 0.7)
                )
                principle.focus_tags = ['past_lives']
                self.principles.append(principle)

            # Load future engines
            for p in data.get('future_engines', []):
                principle = Principle(
                    rule_id=p['id'],
                    tradition='bhrigu',
                    source_reference=p.get('sutra_reference', ''),
                    description=p['description'],
                    conditions=p.get('conditions', {}),
                    narrative=p.get('trajectory', ''),
                    confidence=p.get('certainty', 0.7)
                )
                principle.focus_tags = ['future_lives']
                self.principles.append(principle)

            # Load transit rules
            for p in data.get('transit_rules', []):
                principle = Principle(
                    rule_id=p['id'],
                    tradition='bhrigu',
                    source_reference=p.get('sutra_reference', ''),
                    description=f"Transit of {p.get('planet', 'Unknown')}: {p.get('influence', '')}",
                    conditions=p.get('conditions', {}),
                    confidence=p.get('certainty', 0.7)
                )
                principle.focus_tags = ['transits', 'timing']
                self.principles.append(principle)

            logger.info(f"✓ Loaded Bhrigu YAML principles")

        except Exception as e:
            logger.error(f"Error loading Bhrigu YAML: {e}")

    def _load_nadi_yaml(self) -> None:
        """Load principles from nadi_jyotisha_principles.yml"""
        yaml_path = self.backend_data_path / 'nadi_jyotisha_principles.yml'

        if not yaml_path.exists():
            logger.warning(f"Nadi YAML not found: {yaml_path}")
            return

        try:
            with open(yaml_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Load core principles
            for p in data.get('principles', []):
                principle = Principle(
                    rule_id=p['id'],
                    tradition='nadi',
                    source_reference=p.get('sutra_reference', ''),
                    description=p['description'],
                    focus_tags=p.get('focus_tags', [])
                )
                self.principles.append(principle)

            logger.info(f"✓ Loaded Nadi YAML principles")

        except Exception as e:
            logger.error(f"Error loading Nadi YAML: {e}")

    def _load_bhrigu_markdown(self) -> None:
        """Load structured rules from bhrigu_samhita_rules.md"""
        md_path = self._find_file('bhrigu_samhita_rules.md')

        if not md_path or not md_path.exists():
            logger.warning(f"Bhrigu MD not found in any location. Using embedded fallback.")
            self._load_bhrigu_fallback()
            return

        try:
            with open(md_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Validate file has minimum content
            if len(content) < 1000:
                logger.warning(f"Bhrigu MD file too small ({len(content)} bytes). Using embedded fallback.")
                self._load_bhrigu_fallback()
                return

            # Parse markdown rules (BS-001 to BS-270)
            import re
            pattern = r'\*\*Rule (BS-\d+)\*\*:\s*(.+?)(?=\n\n|\*\*Rule|$)'
            matches = re.findall(pattern, content, re.DOTALL)

            if len(matches) == 0:
                logger.warning("No Bhrigu rules found in markdown file. Using embedded fallback.")
                self._load_bhrigu_fallback()
                return

            for rule_id, description in matches:
                principle = Principle(
                    rule_id=rule_id,
                    tradition='bhrigu',
                    source_reference='Bhrigu Samhita Core Rules',
                    description=description.strip()
                )
                self.principles.append(principle)

            logger.info(f"✓ Loaded {len(matches)} Bhrigu MD rules from {md_path}")

        except Exception as e:
            logger.error(f"Error loading Bhrigu MD: {e}. Using embedded fallback.")
            self._load_bhrigu_fallback()

    def _load_nadi_markdown(self) -> None:
        """Load structured rules from nadi_jyotisha_rules.md"""
        md_path = self._find_file('nadi_jyotisha_rules.md')

        if not md_path or not md_path.exists():
            logger.warning(f"Nadi MD not found in any location. Using embedded fallback.")
            self._load_nadi_fallback()
            return

        try:
            with open(md_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Validate file has minimum content
            if len(content) < 1000:
                logger.warning(f"Nadi MD file too small ({len(content)} bytes). Using embedded fallback.")
                self._load_nadi_fallback()
                return

            # Parse markdown rules (ND-001 to ND-243)
            import re
            pattern = r'\*\*Rule (ND-\d+)\*\*:\s*(.+?)(?=\n\n|\*\*Rule|$)'
            matches = re.findall(pattern, content, re.DOTALL)

            if len(matches) == 0:
                logger.warning("No Nadi rules found in markdown file. Using embedded fallback.")
                self._load_nadi_fallback()
                return

            for rule_id, description in matches:
                principle = Principle(
                    rule_id=rule_id,
                    tradition='nadi',
                    source_reference='Nadi Jyotisha Core Rules',
                    description=description.strip()
                )
                self.principles.append(principle)

            logger.info(f"✓ Loaded {len(matches)} Nadi MD rules from {md_path}")

        except Exception as e:
            logger.error(f"Error loading Nadi MD: {e}. Using embedded fallback.")
            self._load_nadi_fallback()

    def _load_bhrigu_fallback(self) -> None:
        """Load embedded fallback Bhrigu principles when files not available"""
        logger.info("Loading embedded Bhrigu fallback principles")

        fallback_principles = [
            ("BS-001", "The Ascendant (Lagna) represents the soul's entry point into the current incarnation and reveals the primary life purpose."),
            ("BS-002", "The Moon's position and Nakshatra at birth determine the emotional blueprint and mind patterns carried from past lives."),
            ("BS-003", "The Sun's house placement indicates the father's karma and its influence on the native's life path."),
            ("BS-004", "Saturn's position reveals the most significant karmic debts that must be repaid in this lifetime."),
            ("BS-005", "Jupiter's placement shows accumulated spiritual merit (punya) from past lives and protective blessings."),
            ("BS-020", "Sun in 2nd house indicates wealth earned through father's lineage or government connections in past lives."),
            ("BS-044", "Jupiter in 5th house (most auspicious) indicates highly meritorious children and abundant creativity from past spiritual practices."),
            ("BS-061", "Mars in 7th house creates Kuja Dosha (Mangal Dosha) indicating aggressive spouse or delayed marriage requiring remedies."),
            ("BS-087", "Sun in 10th house (excellent placement) indicates government career or leadership position with strong public reputation."),
            ("BS-114", "When lords of 9th and 10th houses conjoin or aspect each other, Raja Yoga forms granting wealth, status, and authority."),
        ]

        for rule_id, description in fallback_principles:
            principle = Principle(
                rule_id=rule_id,
                tradition='bhrigu',
                source_reference='Bhrigu Samhita Core Rules (Embedded Fallback)',
                description=description
            )
            self.principles.append(principle)

        logger.info(f"✓ Loaded {len(fallback_principles)} embedded Bhrigu fallback principles")

    def _load_nadi_fallback(self) -> None:
        """Load embedded fallback Nadi principles when files not available"""
        logger.info("Loading embedded Nadi fallback principles")

        fallback_principles = [
            ("ND-001", "The thumb impression reveals the soul's karmic category through 108 primary classifications based on whorl patterns."),
            ("ND-011", "First chapter reveals name, birth details, parents' names, siblings count, and spouse information with precise accuracy."),
            ("ND-016", "Detailed wealth patterns across entire life span from birth to death predicted."),
            ("ND-036", "Exact number of children the seeker will have across lifetime predicted."),
            ("ND-053", "Timing of marriage predicted to specific year and often month of occurrence."),
            ("ND-064", "Approximate age of death predicted within 5-year range for the seeker."),
            ("ND-112", "Detailed narrative of immediate past life including era, location, and identity."),
            ("ND-120", "Specific mantras with exact repetition counts for resolving major life obstacles."),
            ("ND-166", "Nadi uses Vimshottari Dasha but interprets through karmic lens of past-life actions."),
            ("ND-242", "Nadi reminds: predictions are roadmap, not prison; awareness empowers conscious living."),
        ]

        for rule_id, description in fallback_principles:
            principle = Principle(
                rule_id=rule_id,
                tradition='nadi',
                source_reference='Nadi Jyotisha Core Rules (Embedded Fallback)',
                description=description
            )
            self.principles.append(principle)

        logger.info(f"✓ Loaded {len(fallback_principles)} embedded Nadi fallback principles")

    def _build_indices(self) -> None:
        """Build lookup indices for fast access"""
        for principle in self.principles:
            # By ID
            self.principles_by_id[principle.rule_id] = principle

            # By tradition
            if principle.tradition in self.principles_by_tradition:
                self.principles_by_tradition[principle.tradition].append(principle)

            # By domain/focus tags
            for tag in principle.focus_tags:
                if tag not in self.principles_by_domain:
                    self.principles_by_domain[tag] = []
                self.principles_by_domain[tag].append(principle)

    def get_all_principles(self) -> List[Principle]:
        """Get all loaded principles"""
        if not self.loaded:
            self.load_all()
        return self.principles

    def get_by_tradition(self, tradition: str) -> List[Principle]:
        """Get principles by tradition (bhrigu, nadi, derived)"""
        if not self.loaded:
            self.load_all()
        return self.principles_by_tradition.get(tradition, [])

    def get_by_domain(self, domain: str) -> List[Principle]:
        """Get principles by domain/focus tag"""
        if not self.loaded:
            self.load_all()
        return self.principles_by_domain.get(domain, [])

    def get_matching_principles(
        self,
        chart_features: Dict[str, Any],
        domain: Optional[str] = None,
        tradition: Optional[str] = None
    ) -> List[Principle]:
        """
        Get all principles matching the chart features
        This is EXHAUSTIVE - returns ALL matching rules, not just first match
        """
        if not self.loaded:
            self.load_all()

        # Start with all principles
        candidates = self.principles

        # Filter by domain if specified
        if domain and domain in self.principles_by_domain:
            candidates = self.principles_by_domain[domain]

        # Filter by tradition if specified
        if tradition:
            candidates = [p for p in candidates if p.tradition == tradition]

        # Find all matches
        matches = []
        for principle in candidates:
            if principle.matches_chart(chart_features):
                matches.append(principle)

        # Sort by confidence (highest first)
        matches.sort(key=lambda p: p.confidence, reverse=True)

        return matches


# Singleton instance
_principle_loader = None


def get_principle_loader() -> PrincipleLoader:
    """Get singleton principle loader instance"""
    global _principle_loader
    if _principle_loader is None:
        _principle_loader = PrincipleLoader()
        _principle_loader.load_all()
    return _principle_loader

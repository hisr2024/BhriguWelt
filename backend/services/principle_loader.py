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

        # Base paths
        self.backend_data_path = Path(__file__).parent.parent / 'data'
        self.core_wisdom_path = Path(__file__).parent.parent.parent / 'core_wisdom'

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
        md_path = self.core_wisdom_path / 'bhrigu_samhita_rules.md'

        if not md_path.exists():
            logger.warning(f"Bhrigu MD not found: {md_path}")
            return

        try:
            with open(md_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Parse markdown rules (BS-001 to BS-050)
            import re
            pattern = r'\*\*Rule (BS-\d+)\*\*:\s*(.+?)(?=\n\n|\*\*Rule|$)'
            matches = re.findall(pattern, content, re.DOTALL)

            for rule_id, description in matches:
                principle = Principle(
                    rule_id=rule_id,
                    tradition='bhrigu',
                    source_reference='Bhrigu Samhita Core Rules',
                    description=description.strip()
                )
                self.principles.append(principle)

            logger.info(f"✓ Loaded {len(matches)} Bhrigu MD rules")

        except Exception as e:
            logger.error(f"Error loading Bhrigu MD: {e}")

    def _load_nadi_markdown(self) -> None:
        """Load structured rules from nadi_jyotisha_rules.md"""
        md_path = self.core_wisdom_path / 'nadi_jyotisha_rules.md'

        if not md_path.exists():
            logger.warning(f"Nadi MD not found: {md_path}")
            return

        try:
            with open(md_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Parse markdown rules (ND-001 to ND-070)
            import re
            pattern = r'\*\*Rule (ND-\d+)\*\*:\s*(.+?)(?=\n\n|\*\*Rule|$)'
            matches = re.findall(pattern, content, re.DOTALL)

            for rule_id, description in matches:
                principle = Principle(
                    rule_id=rule_id,
                    tradition='nadi',
                    source_reference='Nadi Jyotisha Core Rules',
                    description=description.strip()
                )
                self.principles.append(principle)

            logger.info(f"✓ Loaded {len(matches)} Nadi MD rules")

        except Exception as e:
            logger.error(f"Error loading Nadi MD: {e}")

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

"""
Bhrigu Core Wisdom Connector
Loads and indexes all rules from core_wisdom/ directory
Provides context for each prediction category with trilingual support
"""
import os
import json
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)


class BhriguCoreWisdom:
    """
    Central connector for Bhrigu Samhita and Nadi Jyotisha wisdom database
    Supports trilingual output (Sanskrit, Hindi, English)
    """

    def __init__(self):
        self.core_wisdom_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'core_wisdom')
        self.rules_index = {}
        self.bhrigu_rules = {}
        self.nadi_rules = {}
        self.nakshatra_data = {}
        self.remedies = {}
        self.glossary = {}
        
        self._load_wisdom_database()

    def _load_wisdom_database(self):
        """Load all wisdom data from core_wisdom directory"""
        try:
            # Load main rule index
            rule_index_path = os.path.join(self.core_wisdom_dir, 'rule_index.json')
            if os.path.exists(rule_index_path):
                with open(rule_index_path, 'r', encoding='utf-8') as f:
                    self.rules_index = json.load(f)
                logger.info(f"✓ Loaded {len(self.rules_index.get('rules', []))} rules from rule_index.json")
            
            # Load category-specific rules
            self._load_category_rules()
            
            # Load nakshatra data
            self._load_nakshatra_rules()
            
            # Load remedies
            self._load_remedies()
            
            # Load glossary
            self._load_glossary()
            
        except Exception as e:
            logger.error(f"Failed to load wisdom database: {e}")

    def _load_category_rules(self):
        """Load category-specific rule files"""
        categories = ['career', 'wealth', 'marriage', 'spirituality']
        
        for category in categories:
            bhrigu_path = os.path.join(self.core_wisdom_dir, 'bhrigu_samhita', 'rules', f'{category}_rules.json')
            if os.path.exists(bhrigu_path):
                with open(bhrigu_path, 'r', encoding='utf-8') as f:
                    self.bhrigu_rules[category] = json.load(f)
                logger.info(f"✓ Loaded Bhrigu {category} rules")

    def _load_nakshatra_rules(self):
        """Load nakshatra-specific rules"""
        nakshatra_path = os.path.join(self.core_wisdom_dir, 'nadi_jyotisa', 'rules', 'nakshatra_rules.json')
        if os.path.exists(nakshatra_path):
            with open(nakshatra_path, 'r', encoding='utf-8') as f:
                self.nakshatra_data = json.load(f)
            logger.info("✓ Loaded nakshatra rules")

    def _load_remedies(self):
        """Load remedy data"""
        remedies_dir = os.path.join(self.core_wisdom_dir, 'remedies')
        
        for remedy_file in ['mantras.json', 'gemstones.json']:
            remedy_path = os.path.join(remedies_dir, remedy_file)
            if os.path.exists(remedy_path):
                with open(remedy_path, 'r', encoding='utf-8') as f:
                    remedy_type = remedy_file.replace('.json', '')
                    self.remedies[remedy_type] = json.load(f)
                logger.info(f"✓ Loaded {remedy_type} remedies")

    def _load_glossary(self):
        """Load trilingual glossary"""
        glossary_dir = os.path.join(self.core_wisdom_dir, 'glossary')
        
        for lang in ['sa', 'hi', 'en']:
            glossary_path = os.path.join(glossary_dir, f'terms_{lang}.json')
            if os.path.exists(glossary_path):
                with open(glossary_path, 'r', encoding='utf-8') as f:
                    self.glossary[lang] = json.load(f)
                logger.info(f"✓ Loaded {lang} glossary")

    def get_rules_for_category(self, category: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get relevant rules for a prediction category
        
        Args:
            category: Prediction category (karmic_journey, past_lives, etc.)
            limit: Maximum number of rules to return
            
        Returns:
            List of relevant rules
        """
        # Map categories to domains
        domain_mapping = {
            'karmic_journey': ['spirituality', 'personality'],
            'past_lives': ['spirituality', 'personality'],
            'future_lives': ['spirituality'],
            'present_life': ['career', 'wealth', 'marriage', 'health'],
            'life_events': ['timing', 'daily'],
            'karmic_remedies': ['spirituality'],
            'relationships': ['marriage', 'family'],
            'predictions': ['daily', 'timing'],
            'cosmic_blueprint_overview': ['personality', 'spirituality'],
            'soul_purpose': ['spirituality'],
            'karmic_debts': ['spirituality'],
            'dharmic_path': ['spirituality', 'career'],
            'spiritual_evolution': ['spirituality'],
            'moksha_indicators': ['spirituality']
        }
        
        domains = domain_mapping.get(category, ['personality'])
        
        # Get rules from main index
        all_rules = self.rules_index.get('rules', [])
        relevant_rules = [
            rule for rule in all_rules 
            if rule.get('domain') in domains
        ]
        
        # Sort by priority and limit
        relevant_rules.sort(key=lambda x: x.get('priority', 50), reverse=True)
        return relevant_rules[:limit]

    def get_nakshatra_info(self, nakshatra: str, language: str = 'en') -> Dict[str, Any]:
        """
        Get complete nakshatra information in specified language
        
        Args:
            nakshatra: Nakshatra name
            language: Language code (en, hi, sa)
            
        Returns:
            Dictionary with nakshatra details
        """
        # Get nakshatra data
        nakshatras = self.nakshatra_data.get('nakshatras', [])
        
        for nak_data in nakshatras:
            if nak_data.get('name', '').lower() == nakshatra.lower():
                # Return data in requested language
                if language in nak_data.get('translations', {}):
                    return nak_data['translations'][language]
                return nak_data
        
        # Return default if not found
        return {
            'name': nakshatra,
            'deity': 'Cosmic forces',
            'symbol': 'Stars',
            'characteristics': 'Unique spiritual gifts',
            'career': 'Varied opportunities',
            'remedies': 'General spiritual practices'
        }

    def get_remedies_for_category(self, category: str, chart_data: Dict[str, Any] = None, 
                                   limit: int = 5) -> List[Dict[str, Any]]:
        """
        Get relevant remedies for a category
        
        Args:
            category: Prediction category
            chart_data: Birth chart data for personalization
            limit: Maximum number of remedies
            
        Returns:
            List of remedy recommendations
        """
        remedies_list = []
        
        # Get mantras
        if 'mantras' in self.remedies:
            mantras = self.remedies['mantras'].get('mantras', [])
            remedies_list.extend([
                {'type': 'mantra', 'data': mantra} 
                for mantra in mantras[:limit//2]
            ])
        
        # Get gemstones
        if 'gemstones' in self.remedies:
            gemstones = self.remedies['gemstones'].get('gemstones', [])
            remedies_list.extend([
                {'type': 'gemstone', 'data': gemstone} 
                for gemstone in gemstones[:limit//2]
            ])
        
        return remedies_list[:limit]

    def get_wisdom_context_for_prediction(self, category: str, chart_data: Dict[str, Any], 
                                         language: str = 'en') -> Dict[str, Any]:
        """
        Get comprehensive wisdom context for a prediction
        
        Args:
            category: Prediction category
            chart_data: Birth chart data
            language: Output language (en, hi, sa)
            
        Returns:
            Dictionary with rules, nakshatra info, remedies, and citations
        """
        context = {
            'category': category,
            'language': language,
            'rules': self.get_rules_for_category(category),
            'nakshatra_info': {},
            'remedies': self.get_remedies_for_category(category, chart_data),
            'citations': [],
            'glossary_terms': {}
        }
        
        # Add nakshatra information
        if chart_data.get('nakshatra'):
            context['nakshatra_info'] = self.get_nakshatra_info(
                chart_data['nakshatra'], 
                language
            )
        
        # Collect citations from rules
        for rule in context['rules']:
            context['citations'].extend(rule.get('citations', []))
        
        # Add relevant glossary terms
        if language in self.glossary:
            # Add key astrological terms for the category
            context['glossary_terms'] = self._get_category_glossary_terms(category, language)
        
        return context

    def _get_category_glossary_terms(self, category: str, language: str) -> Dict[str, str]:
        """Get relevant glossary terms for a category"""
        # Define key terms per category
        category_terms = {
            'karmic_journey': ['karma', 'dharma', 'moksha', 'samskara'],
            'past_lives': ['punarjanma', 'prarabdha', 'sanchita'],
            'future_lives': ['moksha', 'nirvana', 'liberation'],
            'karmic_remedies': ['mantra', 'yantra', 'tantra', 'puja'],
            'spirituality': ['yoga', 'meditation', 'sadhana']
        }
        
        terms = category_terms.get(category, ['karma', 'dharma'])
        glossary = self.glossary.get(language, {}).get('terms', {})
        
        return {term: glossary.get(term, term) for term in terms}

    def format_rules_for_prompt(self, rules: List[Dict[str, Any]]) -> str:
        """Format rules as context for AI prompt"""
        if not rules:
            return ""
        
        formatted = "\n\n**AUTHENTIC VEDIC PRINCIPLES:**\n"
        for rule in rules:
            formatted += f"\n- **{rule.get('rule_id')}** ({rule.get('tradition')}): {rule.get('narrative_template', '')}"
            if rule.get('citations'):
                formatted += f"\n  Citations: {', '.join(rule['citations'])}"
        
        return formatted

    def get_all_categories(self) -> List[Dict[str, str]]:
        """Get list of all supported prediction categories"""
        return [
            {'id': 'karmic_journey', 'name': 'Karmic Journey', 'description': 'Soul purpose and karmic lessons'},
            {'id': 'past_lives', 'name': 'Past Lives', 'description': 'Previous incarnations and patterns'},
            {'id': 'future_lives', 'name': 'Future Lives', 'description': 'Future incarnations and soul evolution'},
            {'id': 'present_life', 'name': 'Present Life', 'description': 'Current life analysis'},
            {'id': 'life_events', 'name': 'Life Events', 'description': 'Year-by-year predictions'},
            {'id': 'karmic_remedies', 'name': 'Karmic Remedies', 'description': 'Spiritual practices and remedies'},
            {'id': 'relationships', 'name': 'Relationships', 'description': 'All relationship types'},
            {'id': 'predictions', 'name': 'General Predictions', 'description': 'Daily/weekly/monthly forecasts'},
            {'id': 'cosmic_blueprint_overview', 'name': 'Cosmic Blueprint', 'description': 'Complete soul overview'},
            {'id': 'soul_purpose', 'name': 'Soul Purpose', 'description': 'Life mission and purpose'},
            {'id': 'karmic_debts', 'name': 'Karmic Debts', 'description': 'Debts and credits analysis'},
            {'id': 'dharmic_path', 'name': 'Dharmic Path', 'description': 'Righteous life path'},
            {'id': 'spiritual_evolution', 'name': 'Spiritual Evolution', 'description': 'Spiritual development stage'},
            {'id': 'moksha_indicators', 'name': 'Moksha Indicators', 'description': 'Liberation potential'}
        ]


# Singleton instance
_bhrigu_core_wisdom = None

def get_bhrigu_core_wisdom() -> BhriguCoreWisdom:
    """Get or create Bhrigu Core Wisdom singleton"""
    global _bhrigu_core_wisdom
    if _bhrigu_core_wisdom is None:
        _bhrigu_core_wisdom = BhriguCoreWisdom()
    return _bhrigu_core_wisdom

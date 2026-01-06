"""
Comprehensive Bhrigu Corpus Database
Integrates local corpus with online search capabilities
"""
import os
import json
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path

# Configure logging
logger = logging.getLogger(__name__)


class BhriguCorpusDatabase:
    """
    Comprehensive database integrating:
    - Bhrigu Samhita manuscripts
    - Nadi Jyotisa texts
    - Online scholarly resources
    - Real-time AI-enhanced interpretation
    """
    
    def __init__(self):
        self.local_corpus = self.load_local_corpus()
        self.online_search_enabled = False  # Disabled by default
        self.cache = {}
        
    def load_local_corpus(self) -> Dict[str, Any]:
        """
        Load all local Bhrigu/Nadi texts
        
        Returns:
            Dictionary with corpus data organized by source
        """
        corpus = {
            'bhrigu_samhita': {},
            'nadi_jyotisa': {},
            'commentaries': {},
            'nakshatra_mappings': {},
            'life_events': {},
            'timing_rules': {}
        }
        
        # Try to load from data directory
        data_dir = Path(__file__).parent.parent / 'data'
        
        # Load Bhrigu Samhita core texts
        bhrigu_path = data_dir / 'bhrigu_samhita' / 'core_texts.json'
        if bhrigu_path.exists():
            try:
                with open(bhrigu_path, 'r', encoding='utf-8') as f:
                    corpus['bhrigu_samhita'] = json.load(f)
                logger.info(f"Loaded Bhrigu Samhita core texts from {bhrigu_path}")
            except Exception as e:
                logger.warning(f"Could not load Bhrigu Samhita texts: {e}")
        
        # Load Nadi Jyotisa manuscripts
        nadi_path = data_dir / 'nadi_jyotisa' / 'manuscripts.json'
        if nadi_path.exists():
            try:
                with open(nadi_path, 'r', encoding='utf-8') as f:
                    corpus['nadi_jyotisa'] = json.load(f)
                logger.info(f"Loaded Nadi Jyotisa manuscripts from {nadi_path}")
            except Exception as e:
                logger.warning(f"Could not load Nadi Jyotisa texts: {e}")
        
        # Load commentaries
        commentaries_path = data_dir / 'bhrigu_samhita' / 'commentaries.json'
        if commentaries_path.exists():
            try:
                with open(commentaries_path, 'r', encoding='utf-8') as f:
                    corpus['commentaries'] = json.load(f)
                logger.info(f"Loaded commentaries from {commentaries_path}")
            except Exception as e:
                logger.warning(f"Could not load commentaries: {e}")
        
        # Load nakshatra mappings
        nakshatra_path = data_dir / 'bhrigu_samhita' / 'nakshatra_mappings.json'
        if nakshatra_path.exists():
            try:
                with open(nakshatra_path, 'r', encoding='utf-8') as f:
                    corpus['nakshatra_mappings'] = json.load(f)
                logger.info(f"Loaded nakshatra mappings from {nakshatra_path}")
            except Exception as e:
                logger.warning(f"Could not load nakshatra mappings: {e}")
        
        # Load life events patterns
        life_events_path = data_dir / 'nadi_jyotisa' / 'life_events_patterns.json'
        if life_events_path.exists():
            try:
                with open(life_events_path, 'r', encoding='utf-8') as f:
                    corpus['life_events'] = json.load(f)
                logger.info(f"Loaded life events patterns from {life_events_path}")
            except Exception as e:
                logger.warning(f"Could not load life events patterns: {e}")
        
        # Load timing rules
        timing_path = data_dir / 'nadi_jyotisa' / 'timing_rules.json'
        if timing_path.exists():
            try:
                with open(timing_path, 'r', encoding='utf-8') as f:
                    corpus['timing_rules'] = json.load(f)
                logger.info(f"Loaded timing rules from {timing_path}")
            except Exception as e:
                logger.warning(f"Could not load timing rules: {e}")
        
        return corpus
        
    def get_karmic_analysis(self, birth_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Get comprehensive karmic analysis from corpus
        
        Args:
            birth_data: Birth chart data
            
        Returns:
            List of relevant corpus entries
        """
        zodiac = birth_data.get('zodiac_sign', '')
        nakshatra = birth_data.get('nakshatra', '')
        
        # Search local corpus first
        local_result = self.search_local(zodiac, nakshatra, 'karmic_journey')
        
        # If insufficient, search online (when enabled)
        if not self.is_comprehensive(local_result) and self.online_search_enabled:
            online_result = self.search_online_corpus(birth_data, 'karmic_journey')
            return self.merge_results(local_result, online_result)
            
        return local_result
    
    def search_local(self, zodiac: str, nakshatra: str, category: str) -> List[Dict[str, Any]]:
        """
        Search local corpus for specific category
        
        Args:
            zodiac: Zodiac sign
            nakshatra: Nakshatra
            category: Category name
            
        Returns:
            List of relevant corpus entries
        """
        results = []
        
        # Search Bhrigu Samhita texts
        bhrigu_data = self.local_corpus.get('bhrigu_samhita', {})
        if category in bhrigu_data:
            category_data = bhrigu_data[category]
            filtered = self._filter_by_zodiac_nakshatra(category_data, zodiac, nakshatra)
            results.extend(filtered)
        
        # Search Nadi Jyotisa texts
        nadi_data = self.local_corpus.get('nadi_jyotisa', {})
        if category in nadi_data:
            category_data = nadi_data[category]
            filtered = self._filter_by_zodiac_nakshatra(category_data, zodiac, nakshatra)
            results.extend(filtered)
            
        return results
    
    def _filter_by_zodiac_nakshatra(
        self, 
        data: Any, 
        zodiac: str, 
        nakshatra: str
    ) -> List[Dict[str, Any]]:
        """
        Filter corpus data by zodiac and nakshatra
        
        Args:
            data: Corpus data structure
            zodiac: Zodiac sign
            nakshatra: Nakshatra
            
        Returns:
            Filtered list of entries
        """
        results = []
        
        if not data or not isinstance(data, dict):
            return results
        
        # Look for zodiac-specific data
        if zodiac in data:
            zodiac_data = data[zodiac]
            
            # Look for nakshatra-specific data within zodiac
            if isinstance(zodiac_data, dict) and nakshatra in zodiac_data:
                nakshatra_data = zodiac_data[nakshatra]
                if isinstance(nakshatra_data, dict):
                    results.append(nakshatra_data)
                elif isinstance(nakshatra_data, list):
                    results.extend(nakshatra_data)
            elif isinstance(zodiac_data, dict):
                # Add all entries for this zodiac
                results.append(zodiac_data)
            elif isinstance(zodiac_data, list):
                results.extend(zodiac_data)
        
        return results
    
    def search_online_corpus(self, birth_data: Dict[str, Any], category: str) -> List[Dict[str, Any]]:
        """
        Fallback to online search for missing data
        Currently disabled - returns empty list
        
        Args:
            birth_data: Birth chart data
            category: Category name
            
        Returns:
            List of online corpus entries (empty for now)
        """
        # This would integrate with external APIs or web scraping
        # For now, return empty to be filled by AI
        return []
    
    def is_comprehensive(self, result: List[Dict[str, Any]]) -> bool:
        """
        Check if result has sufficient data
        
        Args:
            result: List of corpus entries
            
        Returns:
            True if comprehensive, False otherwise
        """
        return len(result) >= 3  # At least 3 relevant entries
    
    def merge_results(
        self, 
        local: List[Dict[str, Any]], 
        online: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Merge local and online results
        
        Args:
            local: Local corpus results
            online: Online corpus results
            
        Returns:
            Merged list
        """
        return local + online
    
    def get_life_events_patterns(self, birth_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Get life events patterns from corpus
        
        Args:
            birth_data: Birth chart data
            
        Returns:
            List of relevant patterns
        """
        zodiac = birth_data.get('zodiac_sign', '')
        nakshatra = birth_data.get('nakshatra', '')
        
        return self.search_local(zodiac, nakshatra, 'life_events')
    
    def get_timing_rules(self, birth_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Get timing rules from corpus
        
        Args:
            birth_data: Birth chart data
            
        Returns:
            List of timing rules
        """
        results = []
        
        timing_rules = self.local_corpus.get('timing_rules', {})
        if timing_rules:
            results.append(timing_rules)
        
        return results
    
    def format_corpus_for_context(self, corpus_entries: List[Dict[str, Any]]) -> str:
        """
        Format corpus entries for context injection
        
        Args:
            corpus_entries: List of corpus entries
            
        Returns:
            Formatted string for prompt injection
        """
        if not corpus_entries:
            return ""
        
        formatted = "\n\n**AUTHENTIC BHRIGU/NADI CORPUS:**\n"
        
        for i, entry in enumerate(corpus_entries, 1):
            formatted += f"\n{i}. "
            if isinstance(entry, dict):
                for key, value in entry.items():
                    formatted += f"{key}: {value}\n   "
            else:
                formatted += str(entry)
        
        return formatted


# Module-level singleton
_corpus_db = None


def get_corpus_database():
    """Get or create corpus database singleton"""
    global _corpus_db
    if _corpus_db is None:
        _corpus_db = BhriguCorpusDatabase()
    return _corpus_db

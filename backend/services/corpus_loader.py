"""
Bhrigu and Nadi Corpus Data Loader
Loads authentic wisdom from YAML corpus files for RAG-style context injection
"""
import os
import json
import yaml
from typing import Dict, List, Any, Optional
from pathlib import Path


class CorpusLoader:
    """Load and access Bhrigu Samhita and Nadi Jyotisha corpus data"""
    
    def __init__(self):
        self.bhrigu_data = None
        self.nadi_data = None
        self.initialization_errors: List[str] = []
        self._load_corpus()
    
    def _load_corpus(self):
        """Load corpus data from YAML files"""
        # Try different possible paths
        possible_paths = [
            Path(__file__).parent.parent.parent / "archive" / "legacy_backend" / "data",
            Path(__file__).parent.parent / "archive" / "legacy_backend" / "data",
            Path("/home/runner/work/BhriguWelt/BhriguWelt/archive/legacy_backend/data"),
        ]
        
        for base_path in possible_paths:
            bhrigu_path = base_path / "bhrigu_samhita_principles.yml"
            nadi_path = base_path / "nadi_jyotisha_principles.yml"
            
            if bhrigu_path.exists() and nadi_path.exists():
                try:
                    with open(bhrigu_path, 'r', encoding='utf-8') as f:
                        self.bhrigu_data = json.load(f)  # Files are JSON format
                    with open(nadi_path, 'r', encoding='utf-8') as f:
                        self.nadi_data = json.load(f)
                    print(f"✓ Loaded Bhrigu and Nadi corpus from: {base_path}")
                    return
                except Exception as e:
                    message = f"Error loading corpus from {base_path}: {e}"
                    self.initialization_errors.append(message)
                    print(f"Warning: {message}")
        
        message = "Could not load Bhrigu/Nadi corpus files. Predictions will rely on OpenAI general knowledge."
        self.initialization_errors.append(message)
        print(f"Warning: {message}")
        self.bhrigu_data = {"principles": [], "remedies": [], "past_life_engines": [], "future_engines": []}
        self.nadi_data = {"principles": [], "remedies": [], "observances": []}
    
    def get_relevant_bhrigu_principles(self, context: Dict[str, Any], limit: int = 5) -> List[Dict]:
        """
        Get relevant Bhrigu Samhita principles based on chart context
        
        Args:
            context: Birth chart data and context
            limit: Maximum number of principles to return
            
        Returns:
            List of relevant principle dictionaries
        """
        if not self.bhrigu_data or "principles" not in self.bhrigu_data:
            return []
        
        principles = self.bhrigu_data.get("principles", [])
        
        # Simple relevance filtering - can be enhanced with more sophisticated matching
        relevant = []
        
        # Get chart indicators
        moon_sign = context.get('moon_sign', '')
        zodiac_sign = context.get('zodiac_sign', '')
        nakshatra = context.get('nakshatra', '')
        
        for principle in principles:
            # Add all for now - can add smart filtering based on tags/conditions
            relevant.append(principle)
            if len(relevant) >= limit:
                break
        
        return relevant[:limit]
    
    def get_relevant_nadi_principles(self, context: Dict[str, Any], limit: int = 5) -> List[Dict]:
        """
        Get relevant Nadi Jyotisha principles based on chart context
        
        Args:
            context: Birth chart data and context
            limit: Maximum number of principles to return
            
        Returns:
            List of relevant principle dictionaries
        """
        if not self.nadi_data or "principles" not in self.nadi_data:
            return []
        
        principles = self.nadi_data.get("principles", [])
        
        relevant = []
        for principle in principles:
            relevant.append(principle)
            if len(relevant) >= limit:
                break
        
        return relevant[:limit]
    
    def get_past_life_engines(self, context: Dict[str, Any], limit: int = 3) -> List[Dict]:
        """Get relevant past life engine patterns"""
        if not self.bhrigu_data or "past_life_engines" not in self.bhrigu_data:
            return []
        
        engines = self.bhrigu_data.get("past_life_engines", [])
        return engines[:limit]
    
    def get_future_engines(self, context: Dict[str, Any], limit: int = 3) -> List[Dict]:
        """Get relevant future life engine patterns"""
        if not self.bhrigu_data or "future_engines" not in self.bhrigu_data:
            return []
        
        engines = self.bhrigu_data.get("future_engines", [])
        return engines[:limit]
    
    def get_remedies(self, context: Dict[str, Any], limit: int = 5) -> List[Dict]:
        """Get relevant remedies from both Bhrigu and Nadi sources"""
        remedies = []
        
        if self.bhrigu_data and "remedies" in self.bhrigu_data:
            remedies.extend(self.bhrigu_data["remedies"][:limit//2])
        
        if self.nadi_data and "remedies" in self.nadi_data:
            remedies.extend(self.nadi_data["remedies"][:limit//2])
        
        return remedies[:limit]
    
    def format_principles_for_context(self, principles: List[Dict]) -> str:
        """Format principles into readable text for AI context"""
        if not principles:
            return ""
        
        formatted = ["**Authentic Corpus References:**\n"]
        for p in principles:
            sutra_ref = p.get('sutra_reference', 'Unknown')
            description = p.get('description', '')
            principle_id = p.get('id', '')
            formatted.append(f"- [{principle_id}] {sutra_ref}: {description}")
        
        return "\n".join(formatted)
    
    def format_past_life_engines_for_context(self, engines: List[Dict]) -> str:
        """Format past life engines for AI context"""
        if not engines:
            return ""
        
        formatted = ["**Past Life Patterns from Corpus:**\n"]
        for engine in engines:
            sutra = engine.get('sutra_reference', 'Unknown')
            narrative = engine.get('narrative', '')
            confidence = engine.get('confidence', 0)
            formatted.append(f"- {sutra} (Confidence: {confidence:.0%}): {narrative}")
        
        return "\n".join(formatted)
    
    def format_future_engines_for_context(self, engines: List[Dict]) -> str:
        """Format future life engines for AI context"""
        if not engines:
            return ""
        
        formatted = ["**Future Life Trajectories from Corpus:**\n"]
        for engine in engines:
            sutra = engine.get('sutra_reference', 'Unknown')
            trajectory = engine.get('trajectory', '')
            certainty = engine.get('certainty', 0)
            formatted.append(f"- {sutra} (Certainty: {certainty:.0%}): {trajectory}")
        
        return "\n".join(formatted)
    
    def format_remedies_for_context(self, remedies: List[Dict]) -> str:
        """Format remedies for AI context"""
        if not remedies:
            return ""
        
        formatted = ["**Authentic Remedial Practices:**\n"]
        for remedy in remedies:
            sutra_ref = remedy.get('sutra_reference', 'Unknown')
            description = remedy.get('description', '')
            remedy_id = remedy.get('id', '')
            formatted.append(f"- [{remedy_id}] {sutra_ref}: {description}")
        
        return "\n".join(formatted)


# Singleton instance
_corpus_loader = None

def get_corpus_loader():
    """Get or create corpus loader singleton"""
    global _corpus_loader
    if _corpus_loader is None:
        _corpus_loader = CorpusLoader()
    return _corpus_loader


def get_corpus_loader_initialization_errors() -> List[str]:
    """Get initialization errors recorded during corpus loader setup."""
    if _corpus_loader and getattr(_corpus_loader, "initialization_errors", None):
        return list(_corpus_loader.initialization_errors)
    return []

"""
Prediction Orchestrator
Central hub connecting ALL prediction categories to Bhrigu Core Wisdom
Supports three modes: online, offline, hybrid
Ensures guaranteed fallback to offline wisdom when OpenAI API fails
Enhanced with Nadi Jyotisha integration across all prediction modes
"""
import logging
from typing import Dict, Any, Optional, List
from enum import Enum

logger = logging.getLogger(__name__)

# Import Nadi Integration for enriched predictions
try:
    from services.bhrigu_nadi_integration import BhriguNadiIntegration
    NADI_AVAILABLE = True
except ImportError:
    NADI_AVAILABLE = False
    logger.warning("Nadi integration not available")


class PredictionMode(Enum):
    """Prediction generation modes"""
    ONLINE = "online"      # Use OpenAI API with corpus context
    OFFLINE = "offline"    # Use only local wisdom database
    HYBRID = "hybrid"      # Try online, fallback to offline


class PredictionOrchestrator:
    """
    Central orchestrator for all prediction categories
    Routes requests through appropriate services with guaranteed results
    """

    def __init__(self):
        # Import services (lazy loading to avoid circular imports)
        self.openai_service = None
        self.offline_wisdom = None
        self.core_wisdom = None
        self.rule_engine = None
        
        self._initialize_services()

    def _initialize_services(self):
        """Initialize all required services"""
        try:
            from services.openai_service import get_openai_service
            self.openai_service = get_openai_service()
            logger.info("✓ OpenAI service initialized")
        except Exception as e:
            logger.warning(f"OpenAI service not available: {e}")
        
        try:
            from services.bhrigu_offline_wisdom import get_offline_wisdom_generator
            self.offline_wisdom = get_offline_wisdom_generator()
            logger.info("✓ Offline wisdom generator initialized")
        except Exception as e:
            logger.error(f"Failed to initialize offline wisdom: {e}")
        
        try:
            from services.bhrigu_core_wisdom import get_bhrigu_core_wisdom
            self.core_wisdom = get_bhrigu_core_wisdom()
            logger.info("✓ Core wisdom database initialized")
        except Exception as e:
            logger.error(f"Failed to initialize core wisdom: {e}")
        
        try:
            from services.rule_engine import get_rule_engine
            self.rule_engine = get_rule_engine()
            logger.info("✓ Rule engine initialized")
        except Exception as e:
            logger.warning(f"Rule engine not available: {e}")

    def generate_prediction(self, category: str, chart_data: Dict[str, Any],
                          mode: str = "hybrid", language: str = "en",
                          client_online: Optional[bool] = None,
                          prompt: Optional[str] = None,
                          **options: Any) -> Dict[str, Any]:
        """
        Generate prediction for any category with guaranteed results

        Args:
            category: Prediction category (karmic_journey, past_lives, etc.)
            chart_data: Birth chart data
            mode: Generation mode (online/offline/hybrid)
            language: Output language (en/hi/sa)

        Returns:
            Dictionary with prediction and metadata
        """
        try:
            # Validate inputs
            if not category or not isinstance(category, str):
                raise ValueError("Invalid category: must be a non-empty string")

            if not chart_data or not isinstance(chart_data, dict):
                raise ValueError("Invalid chart_data: must be a non-empty dictionary")

            # Validate category is supported
            valid_categories = {
                'karmic_journey', 'past_lives', 'future_lives', 'present_life',
                'life_events', 'karmic_remedies', 'relationships', 'predictions'
            }
            normalized_category = category.lower().strip()
            if normalized_category not in valid_categories:
                logger.warning(f"Unknown category '{category}', proceeding with caution")

            # Validate essential chart data fields
            required_fields = ['zodiac_sign']
            missing_fields = [f for f in required_fields if f not in chart_data]
            if missing_fields:
                logger.warning(f"Missing recommended fields in chart_data: {missing_fields}")

            # Normalize mode
            try:
                pred_mode = PredictionMode(mode.lower())
            except ValueError:
                pred_mode = PredictionMode.HYBRID
                logger.warning(f"Invalid mode '{mode}', using hybrid")

            if client_online is False:
                pred_mode = PredictionMode.OFFLINE
            
            # Route to appropriate generation method
            if pred_mode == PredictionMode.OFFLINE:
                return self._generate_offline(category, chart_data, language)
            elif pred_mode == PredictionMode.ONLINE:
                return self._generate_online(category, chart_data, language, prompt=prompt, **options)
            else:  # HYBRID
                return self._generate_hybrid(category, chart_data, language, prompt=prompt, **options)
                
        except Exception as e:
            logger.error(f"Prediction generation failed: {e}")
            # GUARANTEED fallback - never fail
            return self._emergency_fallback(category, chart_data, language)

    def _generate_online(self, category: str, chart_data: Dict[str, Any], 
                        language: str, prompt: Optional[str] = None,
                        **options: Any) -> Dict[str, Any]:
        """Generate prediction using OpenAI with corpus context"""
        if not self.openai_service or not self.openai_service.enabled:
            # Fallback to offline if OpenAI not available
            logger.info("OpenAI not available, falling back to offline")
            return self._generate_offline(category, chart_data, language)
        
        try:
            # Get wisdom context from core wisdom database
            wisdom_context = None
            if self.core_wisdom:
                wisdom_context = self.core_wisdom.get_wisdom_context_for_prediction(
                    category, chart_data, language
                )
            
            # Generate using category-specific method
            prediction_text = self._call_openai_for_category(
                category, chart_data, wisdom_context, language, prompt=prompt, **options
            )
            
            # Evaluate rules if rule engine available
            matched_rules = []
            if self.rule_engine and wisdom_context:
                matched_rules = self.rule_engine.evaluate_rules(
                    wisdom_context.get('rules', []),
                    chart_data
                )

            result = {
                'status': 'success',
                'mode': 'online',
                'category': category,
                'language': language,
                'prediction': prediction_text,
                'matched_rules': matched_rules,
                'citations': wisdom_context.get('citations', []) if wisdom_context else [],
                'source': 'OpenAI + Bhrigu Core Wisdom'
            }

            # Enrich with Nadi insights
            if NADI_AVAILABLE:
                try:
                    nadi_reading = BhriguNadiIntegration.generate_for_category(
                        category, chart_data, depth='comprehensive'
                    )
                    result['nadi_insights'] = nadi_reading.get('data', {})
                    logger.info(f"✓ Nadi enrichment added to online prediction for {category}")
                except Exception as e:
                    logger.warning(f"Nadi enrichment failed for {category}: {e}")

            return result
            
        except Exception as e:
            logger.error(f"Online generation failed: {e}")
            # Fallback to offline
            return self._generate_offline(category, chart_data, language)

    def _generate_offline(self, category: str, chart_data: Dict[str, Any],
                         language: str) -> Dict[str, Any]:
        """Generate prediction using only offline wisdom database - NEVER FAILS"""
        try:
            # First try offline wisdom service if available
            if self.offline_wisdom:
                try:
                    # Route to category-specific offline generator
                    prediction_text = self._call_offline_for_category(category, chart_data, language)

                    # Get matched rules
                    matched_rules = []
                    if self.rule_engine and self.core_wisdom:
                        try:
                            rules = self.core_wisdom.get_rules_for_category(category)
                            matched_rules = self.rule_engine.evaluate_rules(rules, chart_data)
                        except Exception as rule_err:
                            logger.warning(f"Rule evaluation failed: {rule_err}")

                    result = {
                        'status': 'success',
                        'mode': 'offline',
                        'category': category,
                        'language': language,
                        'prediction': prediction_text,
                        'matched_rules': matched_rules,
                        'source': 'Bhrigu Samhita & Nadi Jyotisha (Offline Database)'
                    }

                    # Enrich with Nadi insights
                    if NADI_AVAILABLE:
                        try:
                            nadi_reading = BhriguNadiIntegration.generate_for_category(
                                category, chart_data, depth='comprehensive'
                            )
                            result['nadi_insights'] = nadi_reading.get('data', {})
                            logger.info(f"✓ Nadi enrichment added to offline prediction for {category}")
                        except Exception as e:
                            logger.warning(f"Nadi enrichment failed for {category}: {e}")

                    return result

                except Exception as offline_err:
                    logger.error(f"Offline wisdom service failed: {offline_err}", exc_info=True)

            # If offline wisdom failed or unavailable, use emergency fallback
            return self._emergency_fallback(category, chart_data, language)

        except Exception as e:
            logger.error(f"Offline generation completely failed: {e}", exc_info=True)
            # Absolute last resort - manually construct response
            return {
                'status': 'success',
                'mode': 'emergency_offline',
                'category': category,
                'language': language,
                'prediction': self._emergency_fallback_text(category, chart_data),
                'source': 'Emergency Offline Generator',
                'note': 'This is a basic prediction. Services are temporarily unavailable.'
            }

    def _generate_hybrid(self, category: str, chart_data: Dict[str, Any], 
                        language: str, prompt: Optional[str] = None,
                        **options: Any) -> Dict[str, Any]:
        """Try online first, fallback to offline if it fails"""
        try:
            # Attempt online generation
            result = self._generate_online(category, chart_data, language, prompt=prompt, **options)
            
            # Check if it actually used online mode
            if result.get('mode') == 'online':
                return result
            
            # If online wasn't available, result is already offline
            return result
            
        except Exception as e:
            logger.error(f"Hybrid generation error: {e}")
            # Fallback to offline
            return self._generate_offline(category, chart_data, language)

    def _online_dependencies_ready(self) -> bool:
        """Check if online dependencies are available for prediction generation."""
        return bool(self.openai_service and getattr(self.openai_service, "enabled", False))

    def _call_openai_for_category(self, category: str, chart_data: Dict[str, Any],
                                  wisdom_context: Optional[Dict[str, Any]], 
                                  language: str, prompt: Optional[str] = None,
                                  **options: Any) -> str:
        """Call appropriate OpenAI method based on category"""
        if prompt:
            return self.openai_service.generate_prediction(prompt, chart_data)
        # Map categories to OpenAI service methods
        category_methods = {
            'karmic_journey': lambda: self.openai_service.generate_karmic_journey(chart_data),
            'past_lives': lambda: self.openai_service.generate_past_lives_analysis(chart_data),
            'future_lives': lambda: self.openai_service.generate_future_lives_prediction(chart_data),
            'present_life': lambda: self.openai_service.generate_present_life_analysis(chart_data),
            'life_events': lambda: self.openai_service.generate_life_events_prediction(
                chart_data, options.get('years_ahead', 10)
            ),
            'karmic_remedies': lambda: self.openai_service.generate_karmic_remedies(
                chart_data, options.get('challenges', [])
            ),
        }
        
        # Check if category has dedicated method
        if category in category_methods:
            result = category_methods[category]()
            # Extract text from response
            if isinstance(result, dict):
                # Get the main text field
                for key in ['journey_analysis', 'past_life_analysis', 'future_prediction', 
                           'life_analysis', 'events_prediction', 'remedies_analysis']:
                    if key in result:
                        return result[key]
                return str(result)
            return str(result)
        
        # For new categories, generate generic prediction with context
        prompt = self._build_category_prompt(category, chart_data, wisdom_context, language)
        return self.openai_service.generate_prediction(prompt, chart_data)

    def _call_offline_for_category(self, category: str, chart_data: Dict[str, Any], 
                                   language: str) -> str:
        """Call appropriate offline generator based on category"""
        # Map categories to offline methods
        category_methods = {
            'karmic_journey': self.offline_wisdom.generate_karmic_journey,
            'past_lives': self.offline_wisdom.generate_past_lives,
            'future_lives': self.offline_wisdom.generate_future_lives,
            'present_life': self.offline_wisdom.generate_present_life,
            'life_events': self.offline_wisdom.generate_life_events,
            'karmic_remedies': self.offline_wisdom.generate_karmic_remedies,
            'relationships': self.offline_wisdom.generate_relationships,
            'predictions': self.offline_wisdom.generate_general_predictions,
        }
        
        # Get method for category
        method = category_methods.get(category)
        if method:
            return method(chart_data)
        
        # For new categories, generate using generic method
        return self._generate_generic_offline(category, chart_data, language)

    def _build_category_prompt(self, category: str, chart_data: Dict[str, Any],
                               wisdom_context: Optional[Dict[str, Any]], 
                               language: str) -> str:
        """Build prompt for new categories"""
        category_descriptions = {
            'cosmic_blueprint_overview': 'Complete cosmic blueprint analysis covering all aspects of the soul journey',
            'soul_purpose': 'Deep analysis of the soul\'s primary purpose and mission in this lifetime',
            'karmic_debts': 'Detailed examination of karmic debts and credits from past lives',
            'dharmic_path': 'Righteous path and dharmic duties for this incarnation',
            'spiritual_evolution': 'Current stage of spiritual evolution and next steps',
            'moksha_indicators': 'Indicators and timeline for potential liberation'
        }
        
        description = category_descriptions.get(category, 'Comprehensive astrological analysis')
        
        prompt = f"""
        Generate a comprehensive {category.replace('_', ' ')} prediction:
        {description}
        
        Birth Details:
        - Zodiac Sign: {chart_data.get('zodiac_sign')}
        - Nakshatra: {chart_data.get('nakshatra')}
        - Moon Sign: {chart_data.get('moon_sign')}
        
        Language: {language}
        """
        
        # Add wisdom context if available
        if wisdom_context:
            rules = wisdom_context.get('rules', [])
            if rules:
                prompt += "\n\nReference these authentic Vedic principles:\n"
                for rule in rules[:5]:
                    prompt += f"- {rule.get('narrative_template', '')}\n"
        
        prompt += f"\n\nProvide detailed, specific insights with proper citations from Bhrigu Samhita and Nadi Jyotisha."
        
        return prompt

    def _generate_generic_offline(self, category: str, chart_data: Dict[str, Any], 
                                  language: str) -> str:
        """Generate generic offline prediction for new categories"""
        zodiac = chart_data.get('zodiac_sign', 'Unknown')
        nakshatra = chart_data.get('nakshatra', 'Unknown')
        
        category_content = {
            'cosmic_blueprint_overview': f"""## Cosmic Blueprint Overview
            
Your complete cosmic blueprint as a {zodiac} native with {nakshatra} nakshatra reveals a soul on a journey of evolution and dharmic fulfillment. This lifetime represents a specific chapter in your eternal journey.

**Soul Configuration:** Your planetary arrangement at birth creates a unique energetic signature that influences all aspects of your life.

**Life Purpose:** According to Bhrigu Samhita, you are here to learn specific lessons and contribute to the collective evolution.

**Karmic Balance:** Your current incarnation balances past-life patterns with future evolutionary goals.

*For complete AI-enhanced cosmic blueprint analysis, use online mode.*""",
            
            'soul_purpose': f"""## Soul Purpose Analysis
            
As a {zodiac} native born under {nakshatra} nakshatra, your soul's primary purpose is spiritual evolution through practical life experience.

**Core Mission:** Integrating material and spiritual dimensions of existence.

**Service Path:** Using your natural talents for collective benefit.

**Growth Direction:** Moving from ego-based action to soul-guided service.

*For detailed soul purpose with specific guidance, use online mode.*""",
            
            'karmic_debts': f"""## Karmic Debts & Credits
            
**Karmic Debts:** 
- Lessons around patience and perseverance
- Relationship patterns requiring healing
- Service obligations to soul group members

**Karmic Credits:**
- Accumulated spiritual merit from past lives
- Natural talents and abilities
- Protective grace and guidance

*For comprehensive karmic analysis with specific remedies, use online mode.*""",
            
            'dharmic_path': f"""## Dharmic Path
            
Your {zodiac} energy combined with {nakshatra} influence indicates a dharmic path focused on:

**Professional Dharma:** Using your skills for righteous work
**Family Dharma:** Fulfilling responsibilities with love
**Spiritual Dharma:** Daily practice and self-development
**Social Dharma:** Contributing to collective welfare

*For specific dharmic guidance and timing, use online mode.*""",
            
            'spiritual_evolution': f"""## Spiritual Evolution Stage
            
**Current Stage:** Intermediate level of soul development
**Evolution Progress:** Approximately 60-70% complete
**Next Steps:** Deepening meditation and service
**Challenges:** Balancing material and spiritual life

*For detailed evolution roadmap, use online mode.*""",
            
            'moksha_indicators': f"""## Moksha Indicators
            
**Liberation Potential:** Moderate to high based on your configuration
**Estimated Timeline:** 7-12 incarnations remaining
**Key Indicators:** Spiritual inclination, detachment capacity
**Preparation:** Regular practice, selfless service, study of scriptures

*For precise moksha timeline and specific practices, use online mode.*"""
        }
        
        return category_content.get(category, self._emergency_fallback_text(category, chart_data))

    def _emergency_fallback(self, category: str, chart_data: Dict[str, Any], 
                           language: str) -> Dict[str, Any]:
        """Emergency fallback that never fails"""
        return {
            'status': 'success',
            'mode': 'emergency_offline',
            'category': category,
            'language': language,
            'prediction': self._emergency_fallback_text(category, chart_data),
            'source': 'Emergency Offline Generator',
            'note': 'This is a basic prediction. For detailed analysis, please ensure services are properly configured.'
        }

    def _emergency_fallback_text(self, category: str, chart_data: Dict[str, Any]) -> str:
        """Generate emergency fallback text"""
        zodiac = chart_data.get('zodiac_sign', 'Unknown')
        nakshatra = chart_data.get('nakshatra', 'Unknown')
        
        return f"""## {category.replace('_', ' ').title()} Analysis

Based on Vedic astrology principles:

**Your Configuration:** {zodiac} with {nakshatra} nakshatra

**General Guidance:** According to Bhrigu Samhita and Nadi Jyotisha, your birth chart indicates a soul on a journey of growth and evolution. Every placement serves your karmic lessons and spiritual development.

**Recommendations:**
1. Regular spiritual practice (meditation, mantra)
2. Selfless service to others
3. Study of sacred texts
4. Gratitude and compassion cultivation

**Note:** This is a basic reading. For comprehensive analysis with specific timing and detailed predictions, please ensure AI services are configured or use offline mode with full database access.

*May the divine grace guide your path.*"""

    def get_supported_categories(self) -> List[Dict[str, str]]:
        """Get list of all supported categories"""
        if self.core_wisdom:
            return self.core_wisdom.get_all_categories()
        
        # Fallback list
        return [
            {'id': 'karmic_journey', 'name': 'Karmic Journey'},
            {'id': 'past_lives', 'name': 'Past Lives'},
            {'id': 'future_lives', 'name': 'Future Lives'},
            {'id': 'present_life', 'name': 'Present Life'},
            {'id': 'life_events', 'name': 'Life Events'},
            {'id': 'karmic_remedies', 'name': 'Karmic Remedies'},
            {'id': 'relationships', 'name': 'Relationships'},
            {'id': 'predictions', 'name': 'General Predictions'},
        ]

    def generate_cosmic_blueprint(self, chart_data: Dict[str, Any],
                                 mode: str = "hybrid", language: str = "en",
                                 client_online: Optional[bool] = None) -> Dict[str, Any]:
        """
        Generate complete cosmic blueprint with all subcategories
        
        Returns comprehensive analysis combining multiple categories
        """
        blueprint = {
            'status': 'success',
            'mode': mode,
            'language': language,
            'sections': {}
        }
        
        # Key sections for cosmic blueprint
        sections = [
            'karmic_journey',
            'soul_purpose',
            'karmic_debts',
            'dharmic_path',
            'spiritual_evolution',
            'moksha_indicators',
            'present_life',
            'life_events'
        ]
        
        # Generate each section
        for section in sections:
            try:
                result = self.generate_prediction(
                    section,
                    chart_data,
                    mode,
                    language,
                    client_online=client_online,
                )
                blueprint['sections'][section] = result.get('prediction', '')
            except Exception as e:
                logger.error(f"Failed to generate {section}: {e}")
                blueprint['sections'][section] = f"Section temporarily unavailable"
        
        # Combine into comprehensive blueprint
        blueprint['complete_blueprint'] = self._format_cosmic_blueprint(blueprint['sections'])
        
        return blueprint

    def _format_cosmic_blueprint(self, sections: Dict[str, str]) -> str:
        """Format all sections into a comprehensive cosmic blueprint"""
        blueprint_text = """# Complete Cosmic Blueprint
        
*Comprehensive analysis based on Bhrigu Samhita and Nadi Jyotisha*

---

"""
        for section_id, section_text in sections.items():
            section_title = section_id.replace('_', ' ').title()
            blueprint_text += f"\n\n# {section_title}\n\n{section_text}\n\n---\n"
        
        return blueprint_text


# Singleton instance
_prediction_orchestrator = None

def get_prediction_orchestrator() -> PredictionOrchestrator:
    """Get or create prediction orchestrator singleton"""
    global _prediction_orchestrator
    if _prediction_orchestrator is None:
        _prediction_orchestrator = PredictionOrchestrator()
    return _prediction_orchestrator

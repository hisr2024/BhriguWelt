"""
Prediction Orchestrator
Central hub connecting ALL prediction categories to Bhrigu Core Wisdom
Supports three modes: online, offline, hybrid
Ensures guaranteed fallback to offline wisdom when OpenAI API fails
Enhanced with Nadi Jyotisha integration across all prediction modes
FORTIFIED: Thread-safe with locks for concurrent request handling
ENHANCED: Category-specific offline predictions for precise, non-repetitive content
"""
import logging
import threading
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

# Import Category-Specific Offline Predictor
try:
    from services.category_specific_offline_predictions import get_category_specific_predictor
    CATEGORY_SPECIFIC_AVAILABLE = True
except ImportError:
    CATEGORY_SPECIFIC_AVAILABLE = False
    logger.warning("Category-specific predictor not available, using fallback")


class PredictionMode(Enum):
    """Prediction generation modes"""
    ONLINE = "online"      # Use OpenAI API with corpus context
    OFFLINE = "offline"    # Use only local wisdom database
    HYBRID = "hybrid"      # Try online, fallback to offline


class PredictionOrchestrator:
    """
    Central orchestrator for all prediction categories
    Routes requests through appropriate services with guaranteed results
    THREAD-SAFE: Uses locks to handle concurrent requests safely
    """

    COSMIC_BLUEPRINT_SECTIONS = [
        'karmic_journey',
        'soul_purpose',
        'karmic_debts',
        'dharmic_path',
        'spiritual_evolution',
        'moksha_indicators',
        'present_life',
        'life_events',
    ]

    def __init__(self):
        # Import services (lazy loading to avoid circular imports)
        self.openai_service = None
        self.offline_wisdom = None
        self.core_wisdom = None
        self.rule_engine = None

        # Thread safety lock for concurrent request handling
        self.lock = threading.RLock()
        logger.info("✓ Concurrency lock initialized for thread-safe operations")

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
                          time_period: str = "daily",
                          view_mode: str = "simple",
                          relationship_type: str = "all",
                          **options: Any) -> Dict[str, Any]:
        """
        Generate prediction for any category with guaranteed results
        THREAD-SAFE: Uses lock to prevent race conditions in concurrent requests

        Args:
            category: Prediction category (karmic_journey, past_lives, etc.)
            chart_data: Birth chart data
            mode: Generation mode (online/offline/hybrid)
            language: Output language (en/hi/sa)
            time_period: For predictions category - 'daily', 'weekly', 'monthly', 'yearly'
            view_mode: 'simple' (crisp, precise) or 'astrologer' (detailed with references)

        Returns:
            Dictionary with prediction and metadata
        """
        # Use lock for thread-safe concurrent request handling
        with self.lock:
            try:
                # Validate inputs
                if not category or not isinstance(category, str):
                    raise ValueError("Invalid category: must be a non-empty string")

                if not chart_data or not isinstance(chart_data, dict):
                    raise ValueError("Invalid chart_data: must be a non-empty dictionary")

                # Validate category is supported
                valid_categories = {
                    'karmic_journey',
                    'past_lives',
                    'future_lives',
                    'present_life',
                    'life_events',
                    'karmic_remedies',
                    'relationships',
                    'predictions',
                    'soul_purpose',
                    'karmic_debts',
                    'dharmic_path',
                    'spiritual_evolution',
                    'moksha_indicators',
                    'daily',
                    'weekly',
                    'monthly',
                    'yearly',
                }
                normalized_category = category.lower().strip()
                if normalized_category not in valid_categories:
                    logger.warning(f"Unknown category '{category}', proceeding with caution")

                # Map time-period categories to predictions
                if normalized_category in ['daily', 'weekly', 'monthly', 'yearly']:
                    time_period = normalized_category
                    normalized_category = 'predictions'

                # Validate time_period
                if time_period not in ['daily', 'weekly', 'monthly', 'yearly']:
                    time_period = 'daily'

                # Validate view_mode
                if view_mode not in ['simple', 'astrologer']:
                    view_mode = 'simple'

                # Validate essential chart data fields
                required_fields = ['zodiac_sign']
                missing_fields = [f for f in required_fields if f not in chart_data]
                if missing_fields:
                    logger.warning(f"Missing recommended fields in chart_data: {missing_fields}")

                # Validate relationship_type
                if relationship_type not in ['family', 'romantic', 'karmic', 'timing', 'all']:
                    relationship_type = 'all'

                # Store parameters in options for downstream use
                options['time_period'] = time_period
                options['view_mode'] = view_mode
                options['relationship_type'] = relationship_type

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
                    return self._generate_offline(normalized_category, chart_data, language, time_period=time_period, view_mode=view_mode, relationship_type=relationship_type)
                elif pred_mode == PredictionMode.ONLINE:
                    return self._generate_online(normalized_category, chart_data, language, prompt=prompt, time_period=time_period, view_mode=view_mode, relationship_type=relationship_type, **options)
                else:  # HYBRID
                    return self._generate_hybrid(normalized_category, chart_data, language, prompt=prompt, time_period=time_period, view_mode=view_mode, relationship_type=relationship_type, **options)

            except Exception as e:
                logger.error(f"Prediction generation failed: {e}")
                # GUARANTEED fallback - never fail
                return self._emergency_fallback(category, chart_data, language)

    def _generate_online(self, category: str, chart_data: Dict[str, Any],
                        language: str, prompt: Optional[str] = None,
                        time_period: str = "daily", view_mode: str = "simple",
                        relationship_type: str = "all",
                        **options: Any) -> Dict[str, Any]:
        """Generate prediction using OpenAI with corpus context"""
        if not self.openai_service or not self.openai_service.enabled:
            # Fallback to offline if OpenAI not available
            logger.info("OpenAI not available, falling back to offline")
            return self._generate_offline(category, chart_data, language, time_period=time_period, view_mode=view_mode, relationship_type=relationship_type)
        
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
            # Fallback to offline with time_period, view_mode, and relationship_type
            return self._generate_offline(category, chart_data, language, time_period=time_period, view_mode=view_mode, relationship_type=relationship_type)

    def _generate_offline(self, category: str, chart_data: Dict[str, Any],
                         language: str, time_period: str = "daily",
                         view_mode: str = "simple",
                         relationship_type: str = "all") -> Dict[str, Any]:
        """Generate prediction using only offline wisdom database - NEVER FAILS

        Returns structured response with subcategories for proper frontend display
        """
        try:
            # First try offline wisdom service if available
            if self.offline_wisdom:
                try:
                    # Route to category-specific offline generator
                    # This now returns a dict with full_analysis AND subcategories
                    prediction_result = self._call_offline_for_category(category, chart_data, language, time_period=time_period, view_mode=view_mode, relationship_type=relationship_type)

                    # Get matched rules
                    matched_rules = []
                    if self.rule_engine and self.core_wisdom:
                        try:
                            rules = self.core_wisdom.get_rules_for_category(category)
                            matched_rules = self.rule_engine.evaluate_rules(rules, chart_data)
                        except Exception as rule_err:
                            logger.warning(f"Rule evaluation failed: {rule_err}")

                    # Extract components from the structured result
                    if isinstance(prediction_result, dict):
                        full_analysis = prediction_result.get('full_analysis', '')
                        subcategories = prediction_result.get('subcategories', {})
                        title = prediction_result.get('title', category.replace('_', ' ').title())
                        metadata = prediction_result.get('metadata', {})
                    else:
                        # Fallback for string responses
                        full_analysis = str(prediction_result)
                        subcategories = {}
                        title = category.replace('_', ' ').title()
                        metadata = {}

                    result = {
                        'status': 'success',
                        'mode': 'offline',
                        'category': category,
                        'engine': category,
                        'title': title,
                        'language': language,
                        'prediction': full_analysis,
                        'full_analysis': full_analysis,
                        'subcategories': subcategories,
                        'matched_rules': matched_rules,
                        'source': 'Bhrigu Samhita & Nadi Jyotisha (Offline Database)',
                        'metadata': {
                            **metadata,
                            'zodiac_sign': chart_data.get('zodiac_sign', 'Unknown'),
                            'nakshatra': chart_data.get('nakshatra', 'Unknown'),
                            'moon_sign': chart_data.get('moon_sign', chart_data.get('zodiac_sign', 'Unknown')),
                            'tradition': 'Bhrigu Samhita & Nadi Jyotisha'
                        }
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
                'engine': category,
                'language': language,
                'prediction': self._emergency_fallback_text(category, chart_data),
                'full_analysis': self._emergency_fallback_text(category, chart_data),
                'subcategories': {},
                'source': 'Emergency Offline Generator',
                'note': 'This is a basic prediction. Services are temporarily unavailable.'
            }

    def _generate_hybrid(self, category: str, chart_data: Dict[str, Any],
                        language: str, prompt: Optional[str] = None,
                        time_period: str = "daily", view_mode: str = "simple",
                        relationship_type: str = "all",
                        **options: Any) -> Dict[str, Any]:
        """Try online first, fallback to offline if it fails"""
        try:
            # Attempt online generation
            result = self._generate_online(category, chart_data, language, prompt=prompt,
                                          time_period=time_period, view_mode=view_mode,
                                          relationship_type=relationship_type, **options)

            # Check if it actually used online mode
            if result.get('mode') == 'online':
                return result

            # If online wasn't available, result is already offline
            return result

        except Exception as e:
            logger.error(f"Hybrid generation error: {e}")
            # Fallback to offline with time_period, view_mode, and relationship_type
            return self._generate_offline(category, chart_data, language, time_period=time_period, view_mode=view_mode, relationship_type=relationship_type)

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
                                   language: str, time_period: str = "daily",
                                   view_mode: str = "simple",
                                   relationship_type: str = "all") -> Dict[str, Any]:
        """Call appropriate offline generator based on category

        All category methods now support view_mode for differentiated Simple/Astrologer views
        Returns a dict with full_analysis AND subcategories for proper section display
        """
        # Use Category-Specific Offline Predictor for precise, non-repetitive predictions
        if CATEGORY_SPECIFIC_AVAILABLE:
            try:
                category_predictor = get_category_specific_predictor()
                result = category_predictor.generate(category, chart_data)

                # Return full structured result with sections, not just full_analysis
                if isinstance(result, dict) and result.get('full_analysis'):
                    result['source'] = 'category_specific_offline'
                    result['bhrigu_wisdom'] = True

                    # Build subcategories from the result sections
                    subcategories = {}
                    section_keys = self._get_category_section_keys(category)
                    for key in section_keys:
                        if key in result and result[key]:
                            subcategories[key] = {
                                'title': key.replace('_', ' ').title(),
                                'content': result[key]
                            }

                    result['subcategories'] = subcategories
                    logger.info(f"✓ Generated category-specific prediction for: {category} with {len(subcategories)} sections")
                    return result

            except Exception as e:
                logger.warning(f"Category-specific predictor failed for {category}: {e}, using fallback")

        # Fallback to original offline wisdom generator with structured response
        # These methods return strings, so we wrap them in a dict with subcategories
        fallback_text = None

        # Special handling for predictions category with time_period and view_mode
        if category == 'predictions':
            fallback_text = self.offline_wisdom.generate_general_predictions(chart_data, time_period=time_period, view_mode=view_mode)
        elif category == 'relationships':
            fallback_text = self.offline_wisdom.generate_relationships(chart_data, relationship_type=relationship_type, time_period=time_period, view_mode=view_mode)
        elif category == 'karmic_journey':
            fallback_text = self.offline_wisdom.generate_karmic_journey(chart_data, view_mode=view_mode)
        elif category == 'past_lives':
            fallback_text = self.offline_wisdom.generate_past_lives(chart_data, view_mode=view_mode)
        elif category == 'future_lives':
            fallback_text = self.offline_wisdom.generate_future_lives(chart_data, view_mode=view_mode)
        elif category == 'present_life':
            fallback_text = self.offline_wisdom.generate_present_life(chart_data, view_mode=view_mode)
        elif category == 'life_events':
            fallback_text = self.offline_wisdom.generate_life_events(chart_data, view_mode=view_mode)
        elif category == 'karmic_remedies':
            fallback_text = self.offline_wisdom.generate_karmic_remedies(chart_data, view_mode=view_mode)
        else:
            # For new categories, generate using generic method
            fallback_text = self._generate_generic_offline(category, chart_data, language)

        # Parse the fallback text into sections and wrap in structured response
        return self._parse_fallback_to_sections(category, fallback_text, chart_data)

    def _get_category_section_keys(self, category: str) -> List[str]:
        """Return the expected section keys for each category"""
        section_keys = {
            'life_events': [
                'yearly_forecast', 'marriage_timing', 'career_milestones', 'children_family',
                'financial_events', 'health_alerts', 'spiritual_milestones', 'relocations',
                'education', 'favorable_periods', 'challenging_periods', 'transits', 'age_milestones'
            ],
            'relationships': [
                'romantic_marriage', 'family', 'soul_connections', 'friendships', 'professional',
                'karmic_patterns', 'communication', 'timing', 'healing', 'healthy_practices'
            ],
            'predictions': [
                'daily', 'weekly', 'monthly', 'yearly', 'overall', 'love', 'career', 'health', 'finance'
            ],
            'karmic_journey': [
                'soul_purpose', 'karmic_blueprint', 'evolution_stage', 'life_mission',
                'karmic_lessons', 'soul_connections', 'timing', 'spiritual_gifts'
            ],
            'past_lives': [
                'recent_life', 'significant_lives', 'karmic_patterns', 'past_skills',
                'traumas_healing', 'past_relationships', 'karmic_debts', 'spiritual_progress'
            ],
            'future_lives': [
                'next_incarnation', 'evolution_trajectory', 'final_birth_conditions', 'future_scenarios',
                'moksha_timeline', 'higher_realms', 'bodhisattva_path', 'ultimate_destiny'
            ],
            'present_life': [
                'current_phase', 'career', 'relationships', 'health', 'finances',
                'spiritual_growth', 'education', 'life_purpose', 'challenges', 'timing'
            ],
            'karmic_remedies': [
                'mantras', 'gemstones', 'yantras', 'charitable_activities', 'fasting',
                'deity_worship', 'pilgrimage', 'lifestyle', 'planetary_rituals',
                'karmic_cleansing', 'service', 'meditation'
            ]
        }
        return section_keys.get(category, [])

    def _parse_fallback_to_sections(self, category: str, text: str, chart_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse fallback text into sections for structured response"""
        if not text:
            text = self._emergency_fallback_text(category, chart_data)

        # Try to extract sections from the text using headers
        subcategories = {}
        section_keys = self._get_category_section_keys(category)

        # Parse text to find sections
        current_section = None
        current_content = []
        lines = text.split('\n')

        for line in lines:
            # Check if this line is a section header
            stripped = line.strip()
            if stripped.startswith('##') or stripped.startswith('**') or stripped.endswith(':'):
                # Save previous section
                if current_section and current_content:
                    content = '\n'.join(current_content).strip()
                    if content:
                        subcategories[current_section] = {
                            'title': current_section.replace('_', ' ').title(),
                            'content': content
                        }

                # Identify new section
                section_title = stripped.strip('#* :').lower().replace(' ', '_')
                current_section = None
                for key in section_keys:
                    if key in section_title or section_title in key:
                        current_section = key
                        break
                current_content = []
            elif current_section:
                current_content.append(line)

        # Save last section
        if current_section and current_content:
            content = '\n'.join(current_content).strip()
            if content:
                subcategories[current_section] = {
                    'title': current_section.replace('_', ' ').title(),
                    'content': content
                }

        # If no sections were extracted, create a default section structure
        if not subcategories:
            subcategories = self._create_default_subcategories(category, text, chart_data)

        return {
            'category': category,
            'title': category.replace('_', ' ').title(),
            'full_analysis': text,
            'subcategories': subcategories,
            'metadata': {
                'zodiac_sign': chart_data.get('zodiac_sign', 'Unknown'),
                'nakshatra': chart_data.get('nakshatra', 'Unknown'),
                'tradition': 'Bhrigu Samhita & Nadi Jyotisha'
            }
        }

    def _create_default_subcategories(self, category: str, text: str, chart_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create default subcategories when text parsing fails"""
        zodiac = chart_data.get('zodiac_sign', 'Unknown')
        nakshatra = chart_data.get('nakshatra', 'Unknown')
        element = self._get_zodiac_element(zodiac)
        ruler = self._get_zodiac_ruler(zodiac)

        # Category-specific default content
        if category == 'life_events':
            return self._create_life_events_subcategories(zodiac, nakshatra, element, ruler)
        elif category == 'relationships':
            return self._create_relationships_subcategories(zodiac, nakshatra, element, ruler)
        elif category == 'predictions':
            return self._create_predictions_subcategories(zodiac, nakshatra, element, ruler)
        else:
            # Generic subcategories
            return {
                'overview': {
                    'title': 'Overview',
                    'content': text if text else f'Your {zodiac} energy with {nakshatra} nakshatra creates a unique karmic path.'
                }
            }

    def _create_life_events_subcategories(self, zodiac: str, nakshatra: str, element: str, ruler: str) -> Dict[str, Any]:
        """Create Life Events specific subcategories"""
        return {
            'yearly_forecast': {
                'title': 'Yearly Forecast',
                'content': f"""Your {zodiac} Sun sign influenced by {nakshatra} nakshatra indicates significant developments this year.

**Key Themes:** The {element} energy combined with {ruler}'s influence suggests a period of transformation and growth.

**Major Events:** Important career and personal milestones are indicated during the current planetary cycles."""
            },
            'marriage_timing': {
                'title': 'Marriage & Partnerships',
                'content': f"""**Favorable Periods:** Based on your {zodiac} chart, relationship developments are indicated when Venus aspects your 7th house.

**Compatibility:** {element} signs and complementary nakshatras offer best partnership potential.

**Guidance:** Focus on emotional authenticity and spiritual connection in relationships."""
            },
            'career_milestones': {
                'title': 'Career Milestones',
                'content': f"""**Professional Growth:** Your {ruler}-ruled chart indicates opportunities for advancement through dedication and skill development.

**Key Periods:** Career shifts often align with Jupiter and Saturn transits to career houses.

**Path:** Leadership and creative expression aligned with your {zodiac} nature bring success."""
            },
            'financial_events': {
                'title': 'Financial Events',
                'content': f"""**Wealth Indicators:** Your {zodiac} chart shows potential for prosperity through disciplined effort.

**Timing:** Financial gains often manifest during favorable dasha periods and planetary transits.

**Guidance:** Save during abundant periods, invest wisely during stable phases."""
            },
            'health_alerts': {
                'title': 'Health Considerations',
                'content': f"""**Constitutional Type:** As a {zodiac} native, pay attention to {element}-related health matters.

**Preventive Care:** Regular exercise, balanced diet, and stress management support wellbeing.

**Alert Periods:** Extra care needed during challenging planetary transits."""
            },
            'education': {
                'title': 'Education & Learning',
                'content': f"""**Learning Style:** Your {nakshatra} influence supports specific learning approaches.

**Areas of Excellence:** Studies aligned with {ruler}'s domain bring natural aptitude.

**Timing:** Educational pursuits flourish during Mercury and Jupiter favorable periods."""
            }
        }

    def _create_relationships_subcategories(self, zodiac: str, nakshatra: str, element: str, ruler: str) -> Dict[str, Any]:
        """Create Relationships specific subcategories"""
        return {
            'romantic_marriage': {
                'title': 'Romantic & Marriage',
                'content': f"""**Soul's Primary Purpose:** Your {zodiac} soul incarnated seeking deep, transformative connections that support spiritual growth.

**Key Insight:** {element} nature combined with {nakshatra} energy creates a need for partners who understand your depth and intensity.

**Guidance:** Authentic emotional expression and spiritual alignment lead to lasting bonds."""
            },
            'family': {
                'title': 'Family Dynamics',
                'content': f"""**Family Role:** As a {zodiac} native, you serve as a source of {element} energy within your family structure.

**Ancestral Patterns:** {nakshatra} influence connects you to specific ancestral karma requiring resolution.

**Healing:** Compassion and understanding transform family challenges into growth opportunities."""
            },
            'soul_connections': {
                'title': 'Soul Connections',
                'content': f"""**Karmic Bonds:** Your chart indicates significant soul group members incarnated alongside you.

**Recognition:** Soul connections often feel immediately familiar and carry a sense of destiny.

**Purpose:** These relationships serve specific karmic lessons and mutual evolution."""
            },
            'friendships': {
                'title': 'Friendships',
                'content': f"""**Friend Circle:** {zodiac} natives attract friends who appreciate authenticity and depth.

**Best Companions:** {element} and compatible signs form lasting friendship bonds.

**Growth:** True friendships support your spiritual journey and personal development."""
            },
            'karmic_patterns': {
                'title': 'Karmic Patterns',
                'content': f"""**Relationship Karma:** Past life connections influence current relationship dynamics.

**Patterns to Transform:** Recurring themes indicate areas requiring conscious healing.

**Resolution:** Awareness and compassionate action dissolve limiting karmic patterns."""
            },
            'timing': {
                'title': 'Relationship Timing',
                'content': f"""**Favorable Periods:** Venus and Jupiter transits activate relationship potential.

**Current Cycle:** Your present dasha period influences relationship manifestation.

**Guidance:** Divine timing brings the right connections when you're spiritually prepared."""
            }
        }

    def _create_predictions_subcategories(self, zodiac: str, nakshatra: str, element: str, ruler: str) -> Dict[str, Any]:
        """Create Predictions specific subcategories"""
        return {
            'daily': {
                'title': 'Daily Forecast',
                'content': f"""**Today's Energy:** Your {zodiac} energy receives supportive planetary influences.

**Focus Areas:** {element} activities and {ruler}-aligned pursuits bring positive results.

**Guidance:** Balance action with reflection for optimal outcomes today."""
            },
            'weekly': {
                'title': 'Weekly Overview',
                'content': f"""**Week Ahead:** Multiple planetary aspects shape your experience this week.

**Best Days:** Mid-week typically favors {zodiac} initiatives and creative endeavors.

**Challenges:** Patience required when navigating obstacles; they serve your growth."""
            },
            'monthly': {
                'title': 'Monthly Trends',
                'content': f"""**Monthly Theme:** This month emphasizes {element} qualities in your life.

**Opportunities:** Career and personal projects gain momentum during favorable transits.

**Growth Areas:** Spiritual practices deepen your connection to higher guidance."""
            },
            'yearly': {
                'title': 'Yearly Forecast',
                'content': f"""**Year Overview:** Your {zodiac} journey this year features significant evolutionary themes.

**Major Transits:** Saturn and Jupiter movements create foundational shifts.

**Soul Growth:** This year offers profound opportunities for karmic resolution and spiritual advancement."""
            }
        }

    def _get_zodiac_element(self, zodiac: str) -> str:
        """Get element for a zodiac sign"""
        elements = {
            'Aries': 'Fire', 'Leo': 'Fire', 'Sagittarius': 'Fire',
            'Taurus': 'Earth', 'Virgo': 'Earth', 'Capricorn': 'Earth',
            'Gemini': 'Air', 'Libra': 'Air', 'Aquarius': 'Air',
            'Cancer': 'Water', 'Scorpio': 'Water', 'Pisces': 'Water'
        }
        return elements.get(zodiac, 'Fire')

    def _get_zodiac_ruler(self, zodiac: str) -> str:
        """Get planetary ruler for a zodiac sign"""
        rulers = {
            'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury',
            'Cancer': 'Moon', 'Leo': 'Sun', 'Virgo': 'Mercury',
            'Libra': 'Venus', 'Scorpio': 'Mars', 'Sagittarius': 'Jupiter',
            'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
        }
        return rulers.get(zodiac, 'Sun')

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
        sections = list(self.COSMIC_BLUEPRINT_SECTIONS)
        blueprint['sections'] = {section: "" for section in sections}
        
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

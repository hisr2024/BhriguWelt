"""
Comprehensive Prediction Service
Unified service for all prediction engines with complete error handling
Implements all categories and subcategories with deterministic fallbacks
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from enum import Enum

# Import helper functions
from services.prediction_helpers import (
    format_soul_purpose, format_karmic_debts, format_mantras, format_gemstones,
    format_yantras, format_charity, format_rituals, format_lifestyle,
    format_life_events, format_dharmic_path,
    fallback_soul_purpose, fallback_karmic_journey, fallback_past_lives,
    fallback_future_lives, fallback_present_life, fallback_life_events,
    fallback_karmic_remedies, fallback_relationships, fallback_predictions
)

logger = logging.getLogger(__name__)


class PredictionEngine(Enum):
    """Prediction engine types"""
    KARMIC_JOURNEY = "karmic_journey"
    PAST_LIVES = "past_lives"
    FUTURE_LIVES = "future_lives"
    PRESENT_LIFE = "present_life"
    LIFE_EVENTS = "life_events"
    KARMIC_REMEDIES = "karmic_remedies"
    RELATIONSHIPS = "relationships"
    PREDICTIONS = "predictions"


class ComprehensivePredictionService:
    """
    Comprehensive prediction service implementing all engines
    Ensures no failures through multi-layer fallback system
    """

    def __init__(self):
        """Initialize the comprehensive prediction service"""
        # Initialize sub-services with lazy loading
        self._vedic_engine = None
        self._chart_service = None
        self._astrology_calculator = None
        self._ai_service = None

        logger.info("Comprehensive Prediction Service initialized")

    @property
    def vedic_engine(self):
        """Lazy load Vedic calculation engine"""
        if self._vedic_engine is None:
            try:
                from services.vedic_calculation_engine import get_vedic_calculation_engine
                self._vedic_engine = get_vedic_calculation_engine()
            except Exception as e:
                logger.error(f"Failed to load Vedic engine: {e}")
        return self._vedic_engine

    @property
    def chart_service(self):
        """Lazy load chart service"""
        if self._chart_service is None:
            try:
                from app.services.chart import ChartService
                self._chart_service = ChartService()
            except Exception as e:
                logger.error(f"Failed to load chart service: {e}")
        return self._chart_service

    @property
    def astrology_calculator(self):
        """Lazy load astrology calculator"""
        if self._astrology_calculator is None:
            try:
                from services.astrology_calculator import AstrologyCalculator
                self._astrology_calculator = AstrologyCalculator()
            except Exception as e:
                logger.error(f"Failed to load astrology calculator: {e}")
        return self._astrology_calculator

    @property
    def ai_service(self):
        """Lazy load AI service"""
        if self._ai_service is None:
            try:
                from services.openai_service import get_openai_service
                self._ai_service = get_openai_service()
            except Exception as e:
                logger.warning(f"AI service not available: {e}")
        return self._ai_service

    def generate_prediction(self, engine: str, birth_data: Dict[str, Any],
                          use_ai: bool = True, language: str = "en") -> Dict[str, Any]:
        """
        Generate prediction for any engine with guaranteed results

        Args:
            engine: Engine type (karmic_journey, past_lives, etc.)
            birth_data: Birth details and chart data
            use_ai: Whether to enhance with AI
            language: Output language

        Returns:
            Complete prediction with all subcategories
        """
        try:
            # Step 1: Validate and prepare input
            validated_data = self._validate_input(birth_data)
            if not validated_data['valid']:
                return self._error_response(engine, validated_data['error'])

            # Step 2: Calculate or get chart data
            chart_data = self._ensure_chart_data(birth_data)

            # Step 3: Route to appropriate engine
            engine_methods = {
                'karmic_journey': self.generate_karmic_journey,
                'past_lives': self.generate_past_lives,
                'future_lives': self.generate_future_lives,
                'present_life': self.generate_present_life,
                'life_events': self.generate_life_events,
                'karmic_remedies': self.generate_karmic_remedies,
                'relationships': self.generate_relationships,
                'predictions': self.generate_predictions
            }

            method = engine_methods.get(engine)
            if not method:
                return self._error_response(engine, f"Unknown engine: {engine}")

            # Step 4: Generate prediction
            result = method(chart_data, use_ai, language)

            # Step 5: Add metadata
            result['metadata'] = self._generate_metadata(engine, chart_data, use_ai)
            result['generated_at'] = datetime.utcnow().isoformat()

            return result

        except Exception as e:
            logger.error(f"Prediction generation failed for {engine}: {e}")
            return self._emergency_fallback(engine, birth_data)

    def generate_karmic_journey(self, chart_data: Dict[str, Any],
                               use_ai: bool, language: str) -> Dict[str, Any]:
        """
        Generate Karmic Journey predictions with all subcategories
        Subcategories: Soul purpose, karmic lessons, soul evolution, dharmic path,
                      karmic debts, soul group connections
        """
        try:
            result = {
                'engine': 'karmic_journey',
                'title': 'Your Karmic Journey & Soul Purpose',
                'subcategories': {}
            }

            # Subcategory 1: Soul Purpose
            if self.vedic_engine:
                soul_purpose = self.vedic_engine.calculate_soul_purpose(chart_data)
                result['subcategories']['soul_purpose'] = {
                    'title': 'Soul Purpose',
                    'content': self._format_soul_purpose(soul_purpose),
                    'data': soul_purpose
                }
            else:
                result['subcategories']['soul_purpose'] = self._fallback_soul_purpose(chart_data)

            # Subcategory 2: Karmic Lessons
            result['subcategories']['karmic_lessons'] = self._calculate_karmic_lessons(chart_data)

            # Subcategory 3: Soul Evolution
            result['subcategories']['soul_evolution'] = self._calculate_soul_evolution(chart_data)

            # Subcategory 4: Dharmic Path
            if self.vedic_engine:
                dharmic_path = self.vedic_engine._calculate_dharmic_path(chart_data)
                result['subcategories']['dharmic_path'] = {
                    'title': 'Your Dharmic Path',
                    'content': self._format_dharmic_path(dharmic_path),
                    'data': dharmic_path
                }
            else:
                result['subcategories']['dharmic_path'] = self._fallback_dharmic_path(chart_data)

            # Subcategory 5: Karmic Debts
            if self.vedic_engine:
                karmic_debts = self.vedic_engine.calculate_karmic_debts(chart_data)
                result['subcategories']['karmic_debts'] = {
                    'title': 'Karmic Debts & Credits',
                    'content': self._format_karmic_debts(karmic_debts),
                    'data': karmic_debts
                }
            else:
                result['subcategories']['karmic_debts'] = self._fallback_karmic_debts(chart_data)

            # Subcategory 6: Soul Group Connections
            result['subcategories']['soul_group_connections'] = self._calculate_soul_connections(chart_data)

            # Generate complete synthesis if AI available
            if use_ai and self.ai_service and self.ai_service.enabled:
                try:
                    result['ai_synthesis'] = self._generate_ai_synthesis(result, 'karmic_journey')
                except Exception as e:
                    logger.warning(f"AI synthesis failed: {e}")
                    result['ai_synthesis'] = "See individual subcategories for detailed analysis."

            result['success'] = True
            return result

        except Exception as e:
            logger.error(f"Karmic journey generation failed: {e}")
            return self._fallback_karmic_journey(chart_data)

    def generate_past_lives(self, chart_data: Dict[str, Any],
                           use_ai: bool, language: str) -> Dict[str, Any]:
        """
        Generate Past Lives predictions with all subcategories
        Subcategories: Era/location/role, significant events, karmic patterns,
                      carried talents, unresolved issues
        """
        try:
            result = {
                'engine': 'past_lives',
                'title': 'Your Past Lives Analysis',
                'subcategories': {}
            }

            # Subcategory 1: Most Recent Past Life
            result['subcategories']['recent_past_life'] = self._analyze_recent_past_life(chart_data)

            # Subcategory 2: Era and Location
            result['subcategories']['era_location'] = self._determine_past_life_era(chart_data)

            # Subcategory 3: Past Life Role
            result['subcategories']['past_life_role'] = self._determine_past_life_role(chart_data)

            # Subcategory 4: Significant Events
            result['subcategories']['significant_events'] = self._identify_past_life_events(chart_data)

            # Subcategory 5: Karmic Patterns
            result['subcategories']['karmic_patterns'] = self._identify_karmic_patterns(chart_data)

            # Subcategory 6: Carried Talents
            result['subcategories']['carried_talents'] = self._identify_carried_talents(chart_data)

            # Subcategory 7: Unresolved Issues
            result['subcategories']['unresolved_issues'] = self._identify_unresolved_issues(chart_data)

            # AI enhancement
            if use_ai and self.ai_service and self.ai_service.enabled:
                try:
                    result['ai_synthesis'] = self._generate_ai_synthesis(result, 'past_lives')
                except Exception as e:
                    logger.warning(f"AI synthesis failed: {e}")

            result['success'] = True
            return result

        except Exception as e:
            logger.error(f"Past lives generation failed: {e}")
            return self._fallback_past_lives(chart_data)

    def generate_future_lives(self, chart_data: Dict[str, Any],
                             use_ai: bool, language: str) -> Dict[str, Any]:
        """
        Generate Future Lives predictions with all subcategories
        Subcategories: Predicted incarnations, karmic resolution, future roles,
                      timeline projections
        """
        try:
            result = {
                'engine': 'future_lives',
                'title': 'Your Future Lives & Soul Evolution',
                'subcategories': {}
            }

            # Subcategory 1: Next Incarnation
            result['subcategories']['next_incarnation'] = self._predict_next_incarnation(chart_data)

            # Subcategory 2: Soul Evolution Trajectory
            result['subcategories']['evolution_trajectory'] = self._calculate_evolution_trajectory(chart_data)

            # Subcategory 3: Karmic Resolution Path
            result['subcategories']['karmic_resolution'] = self._calculate_karmic_resolution(chart_data)

            # Subcategory 4: Future Roles
            result['subcategories']['future_roles'] = self._predict_future_roles(chart_data)

            # Subcategory 5: Timeline Projections (2024-2032+)
            result['subcategories']['timeline_projections'] = self._generate_timeline_projections(chart_data)

            # Subcategory 6: Moksha Timeline
            result['subcategories']['moksha_timeline'] = self._calculate_moksha_timeline(chart_data)

            # AI enhancement
            if use_ai and self.ai_service and self.ai_service.enabled:
                try:
                    result['ai_synthesis'] = self._generate_ai_synthesis(result, 'future_lives')
                except Exception as e:
                    logger.warning(f"AI synthesis failed: {e}")

            result['success'] = True
            return result

        except Exception as e:
            logger.error(f"Future lives generation failed: {e}")
            return self._fallback_future_lives(chart_data)

    def generate_present_life(self, chart_data: Dict[str, Any],
                             use_ai: bool, language: str) -> Dict[str, Any]:
        """
        Generate Present Life predictions with all subcategories
        Subcategories: Current challenges/gifts, karmic phase, planetary influences,
                      life purpose alignment
        """
        try:
            result = {
                'engine': 'present_life',
                'title': 'Your Present Life Analysis',
                'subcategories': {}
            }

            # Subcategory 1: Current Life Phase
            result['subcategories']['current_phase'] = self._identify_current_phase(chart_data)

            # Subcategory 2: Current Challenges
            result['subcategories']['current_challenges'] = self._identify_current_challenges(chart_data)

            # Subcategory 3: Current Gifts
            result['subcategories']['current_gifts'] = self._identify_current_gifts(chart_data)

            # Subcategory 4: Karmic Phase
            result['subcategories']['karmic_phase'] = self._determine_karmic_phase(chart_data)

            # Subcategory 5: Planetary Influences
            result['subcategories']['planetary_influences'] = self._analyze_planetary_influences(chart_data)

            # Subcategory 6: Life Purpose Alignment
            result['subcategories']['life_purpose_alignment'] = self._assess_purpose_alignment(chart_data)

            # Subcategory 7: Current Opportunities
            result['subcategories']['current_opportunities'] = self._identify_opportunities(chart_data)

            # AI enhancement
            if use_ai and self.ai_service and self.ai_service.enabled:
                try:
                    result['ai_synthesis'] = self._generate_ai_synthesis(result, 'present_life')
                except Exception as e:
                    logger.warning(f"AI synthesis failed: {e}")

            result['success'] = True
            return result

        except Exception as e:
            logger.error(f"Present life generation failed: {e}")
            return self._fallback_present_life(chart_data)

    def generate_life_events(self, chart_data: Dict[str, Any],
                            use_ai: bool, language: str) -> Dict[str, Any]:
        """
        Generate Life Events predictions with all subcategories
        Subcategories: Major events (marriage, career, health), timings via dasha/bhukti,
                      event significance
        """
        try:
            result = {
                'engine': 'life_events',
                'title': 'Your Life Events with Precision Timing',
                'subcategories': {}
            }

            # Calculate dasha timing first
            birth_date = chart_data.get('birth_details', {}).get('date', chart_data.get('date_of_birth'))
            moon_longitude = chart_data.get('planets', {}).get('Moon', {}).get('longitude', 0)

            dasha_data = None
            if self.vedic_engine and birth_date:
                dasha_data = self.vedic_engine.calculate_dasha_timing(
                    birth_date, moon_longitude, chart_data
                )
                result['dasha_timeline'] = dasha_data

            # Subcategory 1: Marriage Timing
            result['subcategories']['marriage_timing'] = self._predict_marriage_timing(chart_data, dasha_data)

            # Subcategory 2: Career Events
            result['subcategories']['career_events'] = self._predict_career_events(chart_data, dasha_data)

            # Subcategory 3: Health Events
            result['subcategories']['health_events'] = self._predict_health_events(chart_data, dasha_data)

            # Subcategory 4: Children Timing
            result['subcategories']['children_timing'] = self._predict_children_timing(chart_data, dasha_data)

            # Subcategory 5: Wealth Events
            result['subcategories']['wealth_events'] = self._predict_wealth_events(chart_data, dasha_data)

            # Subcategory 6: Travel and Relocation
            result['subcategories']['travel_relocation'] = self._predict_travel_events(chart_data, dasha_data)

            # Subcategory 7: Event Significance
            if dasha_data:
                life_events = self.vedic_engine.calculate_life_events_timing(chart_data, dasha_data)
                result['subcategories']['major_events_by_category'] = {
                    'title': 'Major Life Events by Category',
                    'content': self._format_life_events(life_events),
                    'data': life_events
                }

            # AI enhancement
            if use_ai and self.ai_service and self.ai_service.enabled:
                try:
                    result['ai_synthesis'] = self._generate_ai_synthesis(result, 'life_events')
                except Exception as e:
                    logger.warning(f"AI synthesis failed: {e}")

            result['success'] = True
            return result

        except Exception as e:
            logger.error(f"Life events generation failed: {e}")
            return self._fallback_life_events(chart_data)

    def generate_karmic_remedies(self, chart_data: Dict[str, Any],
                                use_ai: bool, language: str) -> Dict[str, Any]:
        """
        Generate Karmic Remedies with all subcategories
        Subcategories: Mantras, gemstones, yantras, rituals, daily practices,
                      remedial timelines
        """
        try:
            result = {
                'engine': 'karmic_remedies',
                'title': 'Your Personalized Karmic Remedies',
                'subcategories': {}
            }

            # Get comprehensive remedies from Vedic engine
            if self.vedic_engine:
                remedies_data = self.vedic_engine.generate_remedial_measures(chart_data)

                if remedies_data.get('success'):
                    remedies = remedies_data.get('remedies', {})

                    # Subcategory 1: Mantras
                    result['subcategories']['mantras'] = {
                        'title': 'Sacred Mantras',
                        'content': self._format_mantras(remedies.get('mantras', [])),
                        'data': remedies.get('mantras', [])
                    }

                    # Subcategory 2: Gemstones
                    result['subcategories']['gemstones'] = {
                        'title': 'Gemstone Recommendations',
                        'content': self._format_gemstones(remedies.get('gemstones', [])),
                        'data': remedies.get('gemstones', [])
                    }

                    # Subcategory 3: Yantras
                    result['subcategories']['yantras'] = {
                        'title': 'Sacred Yantras',
                        'content': self._format_yantras(remedies.get('yantras', [])),
                        'data': remedies.get('yantras', [])
                    }

                    # Subcategory 4: Charitable Activities
                    result['subcategories']['charity'] = {
                        'title': 'Charitable Activities (Dana)',
                        'content': self._format_charity(remedies.get('charity', [])),
                        'data': remedies.get('charity', [])
                    }

                    # Subcategory 5: Rituals
                    result['subcategories']['rituals'] = {
                        'title': 'Recommended Rituals',
                        'content': self._format_rituals(remedies.get('rituals', [])),
                        'data': remedies.get('rituals', [])
                    }

                    # Subcategory 6: Daily Practices
                    result['subcategories']['daily_practices'] = {
                        'title': 'Daily Spiritual Practices',
                        'content': self._format_lifestyle(remedies.get('lifestyle', [])),
                        'data': remedies.get('lifestyle', [])
                    }

                    # Subcategory 7: Remedial Timeline
                    result['subcategories']['remedial_timeline'] = self._create_remedial_timeline(chart_data, remedies)

                else:
                    # Use fallback
                    result['subcategories'] = self._fallback_remedies_subcategories(chart_data)
            else:
                result['subcategories'] = self._fallback_remedies_subcategories(chart_data)

            # AI enhancement
            if use_ai and self.ai_service and self.ai_service.enabled:
                try:
                    result['ai_synthesis'] = self._generate_ai_synthesis(result, 'karmic_remedies')
                except Exception as e:
                    logger.warning(f"AI synthesis failed: {e}")

            result['success'] = True
            return result

        except Exception as e:
            logger.error(f"Karmic remedies generation failed: {e}")
            return self._fallback_karmic_remedies(chart_data)

    def generate_relationships(self, chart_data: Dict[str, Any],
                              use_ai: bool, language: str) -> Dict[str, Any]:
        """
        Generate Relationships predictions with all subcategories
        Subcategories: Compatibility analysis, karmic bonds, partnership guidance,
                      marriage karma
        """
        try:
            result = {
                'engine': 'relationships',
                'title': 'Your Relationships & Soul Connections',
                'subcategories': {}
            }

            # Subcategory 1: Romantic Relationships
            result['subcategories']['romantic_relationships'] = self._analyze_romantic_relationships(chart_data)

            # Subcategory 2: Marriage Karma
            result['subcategories']['marriage_karma'] = self._analyze_marriage_karma(chart_data)

            # Subcategory 3: Compatibility Factors
            result['subcategories']['compatibility'] = self._analyze_compatibility_factors(chart_data)

            # Subcategory 4: Karmic Bonds
            result['subcategories']['karmic_bonds'] = self._analyze_karmic_bonds(chart_data)

            # Subcategory 5: Family Relationships
            result['subcategories']['family_relationships'] = self._analyze_family_relationships(chart_data)

            # Subcategory 6: Partnership Guidance
            result['subcategories']['partnership_guidance'] = self._generate_partnership_guidance(chart_data)

            # Subcategory 7: Soul Connections
            result['subcategories']['soul_connections'] = self._identify_soul_connections(chart_data)

            # AI enhancement
            if use_ai and self.ai_service and self.ai_service.enabled:
                try:
                    result['ai_synthesis'] = self._generate_ai_synthesis(result, 'relationships')
                except Exception as e:
                    logger.warning(f"AI synthesis failed: {e}")

            result['success'] = True
            return result

        except Exception as e:
            logger.error(f"Relationships generation failed: {e}")
            return self._fallback_relationships(chart_data)

    def generate_predictions(self, chart_data: Dict[str, Any],
                           use_ai: bool, language: str) -> Dict[str, Any]:
        """
        Generate General Predictions with all subcategories
        Subcategories: Daily, Weekly, Monthly, Yearly predictions
        """
        try:
            result = {
                'engine': 'predictions',
                'title': 'Your Astrological Predictions',
                'subcategories': {}
            }

            # Subcategory 1: Daily Predictions
            result['subcategories']['daily'] = self._generate_daily_predictions(chart_data)

            # Subcategory 2: Weekly Predictions
            result['subcategories']['weekly'] = self._generate_weekly_predictions(chart_data)

            # Subcategory 3: Monthly Predictions
            result['subcategories']['monthly'] = self._generate_monthly_predictions(chart_data)

            # Subcategory 4: Yearly Predictions
            result['subcategories']['yearly'] = self._generate_yearly_predictions(chart_data)

            # AI enhancement
            if use_ai and self.ai_service and self.ai_service.enabled:
                try:
                    result['ai_synthesis'] = self._generate_ai_synthesis(result, 'predictions')
                except Exception as e:
                    logger.warning(f"AI synthesis failed: {e}")

            result['success'] = True
            return result

        except Exception as e:
            logger.error(f"Predictions generation failed: {e}")
            return self._fallback_predictions(chart_data)

    # ========== Helper Methods ==========

    def _validate_input(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate input birth data"""
        try:
            required_fields = ['date_of_birth']

            for field in required_fields:
                if field not in birth_data and 'birth_details' not in birth_data:
                    return {'valid': False, 'error': f'Missing required field: {field}'}

            return {'valid': True}

        except Exception as e:
            return {'valid': False, 'error': str(e)}

    def _ensure_chart_data(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure chart data is calculated"""
        # If already has chart data, return it
        if 'planets' in birth_data and 'zodiac_sign' in birth_data:
            return birth_data

        # Try to calculate using astrology calculator
        if self.astrology_calculator:
            try:
                chart = self.astrology_calculator.calculate_birth_chart(
                    birth_data.get('date_of_birth'),
                    birth_data.get('time_of_birth', '12:00'),
                    birth_data.get('place_of_birth', 'New Delhi'),
                    birth_data.get('latitude'),
                    birth_data.get('longitude')
                )
                birth_data.update(chart)
                return birth_data
            except Exception as e:
                logger.error(f"Chart calculation failed: {e}")

        # Return with defaults
        birth_data.setdefault('zodiac_sign', 'Unknown')
        birth_data.setdefault('moon_sign', 'Unknown')
        birth_data.setdefault('ascendant', 'Unknown')
        birth_data.setdefault('nakshatra', 'Unknown')
        birth_data.setdefault('planets', {})

        return birth_data

    def _generate_metadata(self, engine: str, chart_data: Dict[str, Any], use_ai: bool) -> Dict[str, Any]:
        """Generate metadata for prediction"""
        return {
            'engine': engine,
            'zodiac_sign': chart_data.get('zodiac_sign', 'Unknown'),
            'moon_sign': chart_data.get('moon_sign', 'Unknown'),
            'ascendant': chart_data.get('ascendant', 'Unknown'),
            'nakshatra': chart_data.get('nakshatra', 'Unknown'),
            'ai_enhanced': use_ai and self.ai_service and self.ai_service.enabled,
            'corpus_available': bool(self.ai_service and self.ai_service.corpus_available),
            'tradition': 'Bhrigu Samhita & Nadi Jyotisha',
            'calculation_method': 'Vedic astrology with Swiss Ephemeris'
        }

    def _error_response(self, engine: str, error: str) -> Dict[str, Any]:
        """Generate error response"""
        return {
            'engine': engine,
            'success': False,
            'error': error,
            'message': 'Unable to generate prediction. Please check input data.'
        }

    def _emergency_fallback(self, engine: str, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Emergency fallback that never fails"""
        zodiac = birth_data.get('zodiac_sign', 'Unknown')
        nakshatra = birth_data.get('nakshatra', 'Unknown')

        return {
            'engine': engine,
            'title': f'{engine.replace("_", " ").title()} Analysis',
            'success': True,
            'mode': 'emergency_fallback',
            'content': f"""## {engine.replace('_', ' ').title()} Analysis

**Your Configuration:** {zodiac} with {nakshatra} nakshatra

**General Guidance:** According to Bhrigu Samhita and Nadi Jyotisha, your birth chart indicates a soul on a journey of growth and evolution. Every planetary placement serves your karmic lessons and spiritual development.

**Recommendations:**
1. Regular spiritual practice (meditation, mantra)
2. Selfless service to others
3. Study of sacred texts
4. Gratitude and compassion cultivation

*Note: This is a basic reading. For comprehensive analysis, please ensure complete birth details are provided.*

*May the divine grace guide your path.*""",
            'subcategories': {
                'general': {
                    'title': 'General Analysis',
                    'content': 'See main content above for guidance.'
                }
            }
        }

    # Continue in next part due to length...

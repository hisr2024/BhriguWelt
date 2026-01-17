"""
Bhrigu Samhita and Nadi Jyotisa Predictions Service
Comprehensive predictions based on ancient Vedic wisdom
"""
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

from services.openai_service import get_openai_service
from services.astrology_calculator import AstrologyCalculator
from services.section_parser import get_section_parser
from services.bhrigu_corpus_db import get_corpus_database
from services.bhrigu_core_wisdom import BhriguCoreWisdom
from utils.logger import setup_logger, log_exception, secure_log, sanitize_error

# Initialize logger first
logger = setup_logger(__name__)

# Import Nadi Integration for enriched predictions
try:
    from services.bhrigu_nadi_integration import BhriguNadiIntegration
    NADI_AVAILABLE = True
except ImportError:
    NADI_AVAILABLE = False
    logger.warning("Nadi integration not available")


_DEFAULT_DEPENDENCY = object()


class BhriguPredictionsService:
    """
    Comprehensive Bhrigu Samhita and Nadi Jyotisa predictions service
    Implements all 8 prediction categories with extensive AI-powered analysis
    Enhanced with structured section extraction and corpus integration
    """

    def __init__(
        self,
        openai_service: Any = _DEFAULT_DEPENDENCY,
        astrology_calculator: Any = _DEFAULT_DEPENDENCY,
        section_parser: Any = _DEFAULT_DEPENDENCY,
        corpus_db: Any = _DEFAULT_DEPENDENCY,
    ):
        self.init_errors: List[Dict[str, Any]] = []

        if openai_service is _DEFAULT_DEPENDENCY:
            try:
                self.openai_service = get_openai_service()
            except Exception as exc:
                self.openai_service = None
                self._record_init_error('openai_service', exc)
        else:
            self.openai_service = openai_service

        if astrology_calculator is _DEFAULT_DEPENDENCY:
            try:
                self.astrology_calculator = AstrologyCalculator()
            except Exception as exc:
                self.astrology_calculator = None
                self._record_init_error('astrology_calculator', exc)
        else:
            self.astrology_calculator = astrology_calculator

        if section_parser is _DEFAULT_DEPENDENCY:
            try:
                self.section_parser = get_section_parser(self.openai_service)
            except Exception as exc:
                self.section_parser = None
                self._record_init_error('section_parser', exc)
        else:
            self.section_parser = section_parser

        if corpus_db is _DEFAULT_DEPENDENCY:
            try:
                self.corpus_db = get_corpus_database()
            except Exception as exc:
                self.corpus_db = None
                self._record_init_error('corpus_db', exc)
        else:
            self.corpus_db = corpus_db

        self.core_wisdom = BhriguCoreWisdom()

        # Bhrigu Samhita system prompts for enhanced accuracy and precision
        self.bhrigu_system_prompt = """You are a master Vedic astrologer deeply versed in the ancient texts of Bhrigu Samhita and Nadi Jyotisha. 

## ABSOLUTELY CRITICAL FORMATTING RULES - MUST FOLLOW EXACTLY: 

1. ALWAYS use ## (double hash) for section headers - NO EXCEPTIONS
2. NEVER use numbered lists like "1. Soul Purpose" for main sections
3. NEVER use bold text like "**Soul Purpose**" for headers
4. Each section header MUST be on its own line
5. Format MUST be exactly:  ## Section Title (newline) content

CORRECT FORMAT EXAMPLE:
## Soul's Primary Purpose
Your soul incarnated with a sacred mission to... 

## Karmic Blueprint
The planetary alignments reveal karmic patterns... 

WRONG FORMATS (DO NOT USE):
❌ 1. Soul's Primary Purpose
❌ **Soul's Primary Purpose**
❌ Soul's Primary Purpose: 
❌ # Soul's Primary Purpose (single hash)

## Section Title
[Comprehensive content here - minimum 200 words]

[More detailed analysis with specific astrological references]

[Actionable guidance and practical wisdom]

## Next Section Title
[Continue with next section...]

## BHRIGU SAMHITA PRINCIPLES:
Bhrigu Samhita is the sacred treatise by Maharishi Bhrigu, containing life predictions for every soul based on planetary positions. Key principles:
- Every soul's destiny is pre-recorded based on past karma
- Planetary positions at birth reveal the soul's karmic blueprint
- Jupiter's position indicates wisdom, children, and spiritual progress
- Saturn reveals karmic debts, delays, and life lessons
- Rahu shows unfulfilled desires from past lives
- Ketu indicates spiritual liberation and past-life skills

## NADI JYOTISHA PRINCIPLES:
Nadi Jyotisha provides precise predictions from palm leaf manuscripts. Key techniques:
- Thumb impression classification for manuscript identification
- Precise timing using Dasha-Bhukti-Antardasha systems
- Specific life events with month-level accuracy
- Past life details and karmic connections
- Remedial measures (parihara) for planetary afflictions

## YOUR PREDICTIONS MUST:
1. Be deeply rooted in classical Vedic principles with scriptural references
2. Reference SPECIFIC yogas with their effects:
   - Raja Yogas (Gaja Kesari, Pancha Mahapurusha, Neecha Bhanga)
   - Dhana Yogas (wealth combinations)
   - Arishta Yogas (afflictions and challenges)
   - Viparita Raja Yoga (success through adversity)
3. Identify SPECIFIC doshas and their precise remedies:
   - Mangal Dosha (Mars affliction in marriage houses)
   - Kala Sarpa Dosha (all planets between Rahu-Ketu)
   - Pitru Dosha (ancestral karmic debts)
   - Shani Dosha (Saturn afflictions)
4. Analyze planetary combinations with PRECISE interpretations
5. Provide TIMING using Vimshottari Dasha, Yogini Dasha, and transits
6. Offer authentic remedies: specific mantras (with counts), gemstones (with carats), rituals
7. Explain karmic reasons using Vedic philosophy (karma, dharma, moksha)
8. Maintain compassion while delivering difficult predictions

## SACRED TEXTS TO REFERENCE:
- Bhrigu Samhita: Life predictions and karmic blueprints
- Nadi Granthas: Precise timing and specific events
- Brihat Parasara Hora Shastra: Foundational principles
- Jaimini Sutras: Karakas and advanced timing
- Phaladeepika: Yogas and planetary effects
- Saravali: Detailed planetary interpretations
- Uttara Kalamrita: Remedial measures"""

    def _record_init_error(self, component: str, exception: Exception) -> None:
        """
        Record initialization error for a component with secure logging

        Stores error details and logs securely without exposing sensitive data
        """
        error_message = sanitize_error(str(exception))
        error_info = {
            'component': component,
            'error': error_message,
            'type': exception.__class__.__name__,
            'timestamp': datetime.utcnow().isoformat()
        }
        self.init_errors.append(error_info)

        # Use secure logging to prevent API key leakage
        secure_log(
            logger,
            'error',
            f"Failed to initialize {component}: {error_message}",
            extra={
                'component': component,
                'error_type': exception.__class__.__name__,
                'initialization_context': 'BhriguPredictionsService'
            }
        )

        # Also log full exception with traceback (will be sanitized)
        log_exception(logger, exception, context=f"Initialization of {component}")

    def _is_healthy(self) -> bool:
        """Check if critical services are operational"""
        return bool(
            self.openai_service and
            self.section_parser and
            not self.init_errors
        )

    def get_health_status(self) -> Dict[str, Any]:
        """
        Get detailed health status of all services

        Returns:
            Dictionary with service health details for monitoring
        """
        return {
            'healthy': self._is_healthy(),
            'services': {
                'openai_service': {
                    'available': bool(self.openai_service),
                    'enabled': getattr(self.openai_service, 'enabled', False) if self.openai_service else False
                },
                'astrology_calculator': {
                    'available': bool(self.astrology_calculator)
                },
                'section_parser': {
                    'available': bool(self.section_parser)
                },
                'corpus_db': {
                    'available': bool(self.corpus_db)
                }
            },
            'initialization_errors': len(self.init_errors),
            'errors': self.init_errors,
            'timestamp': datetime.utcnow().isoformat()
        }

    def _get_fallback_if_unavailable(self, category: str, birth_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Check service availability and return emergency fallback if needed

        This method ensures predictions ALWAYS return valid data even when services fail.
        It checks service health and returns category-specific fallbacks from prediction_helpers.

        Args:
            category: Prediction category (karmic_journey, past_lives, etc.)
            birth_data: User's birth details

        Returns:
            Fallback prediction dict if services unavailable, None if services OK
        """
        # Check if critical services are missing or initialization failed
        if not self._is_healthy():
            logger.warning(
                f"Critical services unavailable for {category}. "
                f"Services status: openai={bool(self.openai_service)}, "
                f"parser={bool(self.section_parser)}, "
                f"errors={len(self.init_errors)}"
            )

            # Import fallback functions
            from services.prediction_helpers import (
                fallback_karmic_journey,
                fallback_past_lives,
                fallback_future_lives,
                fallback_present_life,
                fallback_life_events,
                fallback_karmic_remedies,
                fallback_karma_reset,
                fallback_relationships,
                fallback_predictions
            )

            # Map categories to their fallback functions
            fallbacks = {
                'karmic_journey': fallback_karmic_journey,
                'past_lives': fallback_past_lives,
                'future_lives': fallback_future_lives,
                'present_life': fallback_present_life,
                'life_events': fallback_life_events,
                'karmic_remedies': fallback_karmic_remedies,
                'karma_reset': fallback_karma_reset,
                'relationships': fallback_relationships,
                'predictions': fallback_predictions
            }

            # Get the appropriate fallback function
            fallback_func = fallbacks.get(category)
            if fallback_func:
                try:
                    result = fallback_func(birth_data)
                    logger.info(f"Emergency fallback activated for {category}")
                    # Ensure result has required structure
                    if isinstance(result, dict):
                        # Add metadata to indicate fallback mode
                        if 'metadata' not in result:
                            result['metadata'] = {}
                        result['metadata']['fallback_mode'] = True
                        result['metadata']['service_errors'] = len(self.init_errors)
                        return result
                except Exception as e:
                    logger.error(f"Fallback generation failed for {category}: {str(e)}", exc_info=True)
            else:
                logger.warning(f"No fallback function found for category: {category}")

        # Services are healthy or no fallback needed
        return None

    def _has_required_birth_inputs(self, birth_data: Dict[str, Any]) -> bool:
        if not isinstance(birth_data, dict):
            return False
        required_keys = ['date_of_birth', 'time_of_birth', 'place_of_birth']
        return all(birth_data.get(key) for key in required_keys)

    def _validate_section_payload(self, payload: Dict[str, Any], category: str) -> Optional[str]:
        if not isinstance(payload, dict):
            return 'invalid_payload'
        sections = payload.get('sections')
        full_analysis = payload.get('full_analysis')
        if not isinstance(sections, dict):
            return 'missing_sections'
        if not full_analysis:
            return 'missing_full_analysis'
        required_sections = self.section_parser.REQUIRED_SECTIONS.get(category, [])
        if required_sections and not any(sections.get(key) for key in required_sections):
            return 'missing_required_sections'
        return None

    def _build_remedies_fallback(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        remedies = self.core_wisdom.get_remedies_for_category('karmic_remedies', birth_data, limit=6)
        mantra_items = [r['data'] for r in remedies if r.get('type') == 'mantra']
        gemstone_items = [r['data'] for r in remedies if r.get('type') == 'gemstone']

        mantras = [
            f"{item.get('name', {}).get('en', 'Mantra')}: {item.get('mantra', '')}".strip()
            for item in mantra_items
            if isinstance(item, dict)
        ]
        gemstones = [
            f"{item.get('name', {}).get('en', 'Gemstone')} - {item.get('planet', 'Planetary support')}"
            for item in gemstone_items
            if isinstance(item, dict)
        ]

        if not mantras:
            mantras = [
                'Om Namah Shivaya - Daily grounding for transformation',
                'Gayatri Mantra - Morning clarity and protection'
            ]
        if not gemstones:
            gemstones = [
                'Pearl - Emotional balance and calm',
                'Emerald - Mental clarity and communication'
            ]

        return {
            'category': 'karmic_remedies',
            'title': 'Your Personalized Karmic Remedies',
            'full_analysis': "## Core Wisdom Remedies\n" + "\n".join(
                [f"- {item}" for item in (mantras + gemstones)]
            ),
            'mantras': "\n".join(mantras),
            'gemstones': "\n".join(gemstones),
            'yantras': 'Sri Yantra - For harmony and spiritual alignment.',
            'charitable_activities': 'Offer food or education support weekly.',
            'fasting': 'Observe a light fast on Ekadashi or Mondays.',
            'deity_worship': 'Simple daily prayer to your chosen deity.',
            'pilgrimage': 'Visit a nearby sacred space with mindfulness.',
            'lifestyle': 'Prioritize sleep, clean food, and mindful speech.',
            'planetary_rituals': 'Light a lamp on Saturdays for Saturn balance.',
            'karmic_cleansing': 'Practice forgiveness journaling weekly.',
            'service': 'Volunteer or mentor to balance karma.',
            'meditation': '10-minute breath meditation daily.',
            'metadata': {
                'zodiac_sign': birth_data.get('zodiac_sign', 'Unknown'),
                'ai_model': 'core_wisdom_fallback',
                'corpus_available': False,
                'tradition': 'Bhrigu Samhita & Nadi Jyotisa',
                'fallback_mode': True
            },
            'generated_at': datetime.utcnow().isoformat()
        }

    def _build_karma_reset_fallback(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        from services.prediction_helpers import fallback_karma_reset
        return fallback_karma_reset(birth_data)

    def _enrich_with_nadi(self, result: Dict[str, Any], category: str, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enrich prediction result with Nadi Jyotisha insights

        Args:
            result: Prediction result dictionary
            category: Prediction category
            birth_data: User's birth data

        Returns:
            Enriched result dictionary with nadi_insights field
        """
        if not NADI_AVAILABLE:
            return result

        try:
            nadi_reading = BhriguNadiIntegration.generate_for_category(
                category,
                birth_data,
                depth='comprehensive'
            )
            result['nadi_insights'] = nadi_reading.get('data', {})
            if 'metadata' in result:
                result['metadata']['nadi_integrated'] = True
            logger.info(f"✓ Nadi enrichment successful for {category}")
        except Exception as e:
            logger.warning(f"Nadi integration failed for {category}: {e}")
            if 'metadata' in result:
                result['metadata']['nadi_integrated'] = False

        return result

    # Section specifications for all 8 prediction categories
    # Defines the structure and required sections for each category
    SECTION_SPECS = {
        'karmic_journey': [
                {
                    'key': 'soul_purpose',
                    'title': "Soul's Primary Purpose",
                    'bullets': [
                        "Fundamental reason this soul incarnated in this lifetime",
                        "Unique dharmic path and cosmic mission",
                        "Core spiritual lessons to master"
                    ]
                },
                {
                    'key': 'karmic_blueprint',
                    'title': 'Karmic Blueprint',
                    'bullets': [
                        "Main karmic patterns and past-life imprints",
                        "Influence of Jupiter, Saturn, Rahu, and Ketu",
                        "Key yogas shaping destiny"
                    ]
                },
                {
                    'key': 'evolution_stage',
                    'title': 'Soul Evolution Stage',
                    'bullets': [
                        "Current stage in soul evolution",
                        "Indicators of maturity or remaining lessons",
                        "Progress toward moksha"
                    ]
                },
                {
                    'key': 'life_mission',
                    'title': 'Life Mission & Dharma',
                    'bullets': [
                        "Primary life mission across career, service, and dharma",
                        "How to align daily choices with higher purpose",
                        "Key responsibilities for this incarnation"
                    ]
                },
                {
                    'key': 'karmic_lessons',
                    'title': 'Karmic Lessons in This Lifetime',
                    'bullets': [
                        "Top lessons the soul must integrate",
                        "Recurring challenges and their spiritual purpose",
                        "Behavioral shifts needed for growth"
                    ]
                },
                {
                    'key': 'soul_connections',
                    'title': 'Soul Group Connections',
                    'bullets': [
                        "Key soulmates and soul family indicators",
                        "Relationship dynamics tied to karma",
                        "Recognition signs for karmic connections"
                    ]
                },
                {
                    'key': 'timing',
                    'title': 'Timing of Karmic Events',
                    'bullets': [
                        "Major activation periods and turning points",
                        "Dasha and transit timing insights",
                        "Upcoming windows for growth"
                    ]
                },
                {
                    'key': 'spiritual_gifts',
                    'title': 'Spiritual Gifts & Abilities',
                    'bullets': [
                        "Innate talents carried from past lives",
                        "Spiritual practices best suited",
                        "Hidden capabilities to awaken"
                    ]
                }
            ],
            'past_lives': [
                {
                    'key': 'recent_life',
                    'title': 'Most Recent Past Life (Previous Incarnation)',
                    'bullets': [
                        "Time period, location, social status, profession",
                        "Major life events and circumstances of passing",
                        "Unfinished business carried forward"
                    ]
                },
                {
                    'key': 'significant_lives',
                    'title': 'Significant Past Lives (3-5 Major Incarnations)',
                    'bullets': [
                        "Historical era, culture, role, key relationships",
                        "Achievements or failures and karmic lessons",
                        "Connections to current life themes"
                    ]
                },
                {
                    'key': 'karmic_patterns',
                    'title': 'Recurring Karmic Patterns',
                    'bullets': [
                        "Patterns repeating across lifetimes",
                        "Unresolved conflicts and themes requiring resolution",
                        "Recurring relationships or roles"
                    ]
                },
                {
                    'key': 'past_skills',
                    'title': 'Past Life Skills & Talents',
                    'bullets': [
                        "Abilities mastered in previous lives",
                        "Natural talents carried forward",
                        "Arts, languages, or professions"
                    ]
                },
                {
                    'key': 'traumas_healing',
                    'title': 'Past Life Traumas Needing Healing',
                    'bullets': [
                        "Traumas creating current fears or blocks",
                        "Losses or betrayals influencing trust",
                        "Healing approaches and remedies"
                    ]
                },
                {
                    'key': 'past_relationships',
                    'title': 'Past Life Relationships in Current Life',
                    'bullets': [
                        "Recognizing past-life connections",
                        "Karmic contracts with current relationships",
                        "Soulmates and unfinished relational lessons"
                    ]
                },
                {
                    'key': 'karmic_debts',
                    'title': 'Karmic Debts from Past Lives',
                    'bullets': [
                        "Debts owed or owed to the native",
                        "Unfulfilled promises or duties",
                        "Restorative actions for balance"
                    ]
                },
                {
                    'key': 'spiritual_progress',
                    'title': 'Past Life Spiritual Progress',
                    'bullets': [
                        "Spiritual practices from previous lives",
                        "Temples or traditions served",
                        "Level of enlightenment achieved"
                    ]
                }
            ],
            'future_lives': [
                {
                    'key': 'next_incarnation',
                    'title': 'Next Immediate Incarnation',
                    'bullets': [
                        "Likely time period, location, and social circumstances",
                        "Primary life purpose in the next life",
                        "Karmic lessons continuing forward"
                    ]
                },
                {
                    'key': 'evolution_trajectory',
                    'title': 'Soul Evolution Trajectory (Next 3-5 Lives)',
                    'bullets': [
                        "Projected spiritual development levels",
                        "Major themes, purposes, and progress",
                        "Relationships with current-life souls"
                    ]
                },
                {
                    'key': 'final_birth_conditions',
                    'title': 'Conditions for This Being the Final Birth',
                    'bullets': [
                        "Current karmic completion percentage",
                        "Remaining lessons before moksha",
                        "Practices that accelerate liberation"
                    ]
                },
                {
                    'key': 'future_scenarios',
                    'title': 'Future Life Scenarios Based on Current Actions',
                    'bullets': [
                        "Trajectories for spiritual, materialistic, and balanced paths",
                        "Karmic consequences and benefits",
                        "How choices alter outcomes"
                    ]
                },
                {
                    'key': 'moksha_timeline',
                    'title': 'Moksha Timeline & Preparation',
                    'bullets': [
                        "Estimated lifetimes until liberation",
                        "Current progress toward enlightenment",
                        "Practices to remove obstacles"
                    ]
                },
                {
                    'key': 'higher_realms',
                    'title': 'Higher Realms Accessibility',
                    'bullets': [
                        "Eligibility for Deva realms or higher lokas",
                        "Requirements for higher plane incarnations",
                        "Merit needed for elevation"
                    ]
                },
                {
                    'key': 'bodhisattva_path',
                    'title': 'Bodhisattva Path Potential',
                    'bullets': [
                        "Capacity to return as a guide or teacher",
                        "Service incarnations and leadership potential",
                        "Signals of compassionate return"
                    ]
                },
                {
                    'key': 'ultimate_destiny',
                    'title': "Soul's Ultimate Destiny",
                    'bullets': [
                        "Ultimate spiritual destination",
                        "Final liberation pathway",
                        "Long-term destiny summary"
                    ]
                }
            ],
            'present_life': [
                {
                    'key': 'current_phase',
                    'title': 'Current Life Phase & Karmic Context',
                    'bullets': [
                        "Current life phase and challenges",
                        "Core karmic themes at play",
                        "Immediate priorities for balance"
                    ]
                },
                {
                    'key': 'career',
                    'title': 'Career & Professional Path',
                    'bullets': [
                        "Career strengths and suitable roles",
                        "Timing for career breakthroughs",
                        "How dharma influences vocation"
                    ]
                },
                {
                    'key': 'relationships',
                    'title': 'Relationships & Partnerships',
                    'bullets': [
                        "Romantic and partnership dynamics",
                        "Key relationship lessons",
                        "Karmic patterns to resolve"
                    ]
                },
                {
                    'key': 'health',
                    'title': 'Health & Wellbeing',
                    'bullets': [
                        "Health tendencies and vulnerabilities",
                        "Preventive practices and remedies",
                        "Timing for healing or rest"
                    ]
                },
                {
                    'key': 'finances',
                    'title': 'Financial Prospects',
                    'bullets': [
                        "Financial patterns and opportunities",
                        "Wealth yogas or cautions",
                        "Practical money guidance"
                    ]
                },
                {
                    'key': 'spiritual_growth',
                    'title': 'Spiritual Growth Opportunities',
                    'bullets': [
                        "Practices to deepen spiritual alignment",
                        "Teachers, paths, or traditions aligned",
                        "Inner development goals"
                    ]
                },
                {
                    'key': 'education',
                    'title': 'Education & Skill Development',
                    'bullets': [
                        "Learning pathways that strengthen dharma",
                        "Skills to prioritize",
                        "Timing for study or certifications"
                    ]
                },
                {
                    'key': 'life_purpose',
                    'title': 'Life Purpose Alignment',
                    'bullets': [
                        "How to align daily life with purpose",
                        "Service and contribution guidance",
                        "Personal growth targets"
                    ]
                },
                {
                    'key': 'challenges',
                    'title': 'Challenges & Lessons',
                    'bullets': [
                        "Key challenges and their karmic roots",
                        "Habits or patterns to transform",
                        "Resilience practices"
                    ]
                },
                {
                    'key': 'timing',
                    'title': 'Key Timing & Transits',
                    'bullets': [
                        "Upcoming timing windows",
                        "Dasha or transit highlights",
                        "Periods to initiate or pause"
                    ]
                }
            ],
            'life_events': [
                {
                    'key': 'yearly_forecast',
                    'title': 'Year-by-Year Forecast',
                    'bullets': [
                        "Yearly overview for key themes",
                        "Major turning points and focus areas",
                        "Supportive vs challenging years"
                    ]
                },
                {
                    'key': 'marriage_timing',
                    'title': 'Marriage & Partnerships',
                    'bullets': [
                        "Timing windows for relationships or marriage",
                        "Indicators of partnership growth",
                        "Cautions or delays"
                    ]
                },
                {
                    'key': 'career_milestones',
                    'title': 'Career Milestones',
                    'bullets': [
                        "Career peaks, shifts, promotions",
                        "Best periods for advancement",
                        "Industry or role guidance"
                    ]
                },
                {
                    'key': 'children_family',
                    'title': 'Children & Family',
                    'bullets': [
                        "Family growth timelines",
                        "Children-related milestones",
                        "Caretaking responsibilities"
                    ]
                },
                {
                    'key': 'financial_events',
                    'title': 'Financial Breakthroughs',
                    'bullets': [
                        "Financial windfalls or cautions",
                        "Investment and savings timing",
                        "Wealth-building periods"
                    ]
                },
                {
                    'key': 'health_alerts',
                    'title': 'Health Alerts',
                    'bullets': [
                        "Health-sensitive windows",
                        "Preventive measures",
                        "Recovery or rest periods"
                    ]
                },
                {
                    'key': 'spiritual_milestones',
                    'title': 'Spiritual Milestones',
                    'bullets': [
                        "Breakthroughs in spiritual growth",
                        "Practice intensification periods",
                        "Mentor or teacher encounters"
                    ]
                },
                {
                    'key': 'relocations',
                    'title': 'Relocations & Travel',
                    'bullets': [
                        "Likely relocation or travel windows",
                        "Places of karmic significance",
                        "Travel-based opportunities"
                    ]
                },
                {
                    'key': 'education',
                    'title': 'Education & Skill Development',
                    'bullets': [
                        "Study or training timelines",
                        "Skill upgrades and certifications",
                        "Mentorship opportunities"
                    ]
                },
                {
                    'key': 'favorable_periods',
                    'title': 'Favorable Dasha Periods',
                    'bullets': [
                        "Dasha periods offering growth",
                        "Periods for new beginnings",
                        "Strengthening influences"
                    ]
                },
                {
                    'key': 'challenging_periods',
                    'title': 'Challenging Periods',
                    'bullets': [
                        "Difficult or testing phases",
                        "Themes to navigate carefully",
                        "Protective practices"
                    ]
                },
                {
                    'key': 'transits',
                    'title': 'Critical Transit Events',
                    'bullets': [
                        "Major transits affecting life events",
                        "Planetary shifts with strong impact",
                        "Actionable timing guidance"
                    ]
                },
                {
                    'key': 'age_milestones',
                    'title': 'Specific Age Milestones',
                    'bullets': [
                        "Key ages to watch for major changes",
                        "Significant rites of passage",
                        "Peak potential windows"
                    ]
                }
            ],
            'karmic_remedies': [
                {
                    'key': 'mantras',
                    'title': 'Mantras',
                    'bullets': [
                        "Specific mantras with counts and meanings",
                        "Pronunciation guidance",
                        "Best timing for recitation"
                    ]
                },
                {
                    'key': 'gemstones',
                    'title': 'Gemstones',
                    'bullets': [
                        "Recommended gemstones with carats",
                        "How and when to wear them",
                        "Precautions or alternatives"
                    ]
                },
                {
                    'key': 'yantras',
                    'title': 'Yantras & Sacred Geometry',
                    'bullets': [
                        "Yantras to use and activation methods",
                        "Placement guidance",
                        "Ritual instructions"
                    ]
                },
                {
                    'key': 'charitable_activities',
                    'title': 'Charitable Activities (Dana)',
                    'bullets': [
                        "Specific donations and timing",
                        "Charity aligned with planetary remedies",
                        "Service acts that balance karma"
                    ]
                },
                {
                    'key': 'fasting',
                    'title': 'Fasting & Austerities',
                    'bullets': [
                        "Recommended fasts and observances",
                        "Days aligned with planets",
                        "Guidance for safe practice"
                    ]
                },
                {
                    'key': 'deity_worship',
                    'title': 'Deity Worship & Prayers',
                    'bullets': [
                        "Primary deities to invoke",
                        "Ritual guidance and mantras",
                        "Festival timings"
                    ]
                },
                {
                    'key': 'pilgrimage',
                    'title': 'Pilgrimage & Sacred Sites',
                    'bullets': [
                        "Places that align with karmic healing",
                        "Timing for pilgrimage",
                        "Rituals to perform"
                    ]
                },
                {
                    'key': 'lifestyle',
                    'title': 'Lifestyle Modifications',
                    'bullets': [
                        "Daily habits that strengthen karma",
                        "Diet or routine adjustments",
                        "Behavioral disciplines"
                    ]
                },
                {
                    'key': 'planetary_rituals',
                    'title': 'Planetary Rituals',
                    'bullets': [
                        "Graha shanti or homa rituals",
                        "Procedure and timing",
                        "Priest or self-performed guidance"
                    ]
                },
                {
                    'key': 'karmic_cleansing',
                    'title': 'Karmic Cleansing Practices',
                    'bullets': [
                        "Methods to clear karmic residue",
                        "Forgiveness and release practices",
                        "Meditative purification"
                    ]
                },
                {
                    'key': 'service',
                    'title': 'Seva & Service',
                    'bullets': [
                        "Service activities to balance karma",
                        "Community contribution paths",
                        "Service tied to life purpose"
                    ]
                },
                {
                    'key': 'meditation',
                    'title': 'Meditation & Inner Practices',
                    'bullets': [
                        "Meditation methods best suited",
                        "Timing and duration guidance",
                        "Focus areas for transformation"
                    ]
                }
            ],
            'karma_reset': [
                {
                    'key': 'reset_overview',
                    'title': 'Karma Reset Overview',
                    'bullets': [
                        "Key themes for this reset cycle",
                        "Primary karmic patterns to release",
                        "Overall energetic focus"
                    ]
                },
                {
                    'key': 'release_practices',
                    'title': 'Release Practices',
                    'bullets': [
                        "Practices to let go of burdens",
                        "Journaling and forgiveness rituals",
                        "Supportive habits for closure"
                    ]
                },
                {
                    'key': 'daily_reset',
                    'title': 'Daily Reset Ritual',
                    'bullets': [
                        "Morning grounding steps",
                        "Evening integration routine",
                        "Mantra or breath anchor"
                    ]
                },
                {
                    'key': 'affirmations',
                    'title': 'Anchor Affirmations',
                    'bullets': [
                        "Short affirmations for clarity",
                        "Statements for emotional release",
                        "Mantra suggestions"
                    ]
                },
                {
                    'key': 'integration',
                    'title': 'Integration Guidance',
                    'bullets': [
                        "How to sustain the reset",
                        "Service or seva recommendations",
                        "Next steps for spiritual alignment"
                    ]
                }
            ],
            'relationships': [
                {
                    'key': 'romantic_marriage',
                    'title': 'Romantic Relationships & Marriage',
                    'bullets': [
                        "Romantic themes and partner qualities",
                        "Marriage timing and partnership lessons",
                        "Compatibility considerations"
                    ]
                },
                {
                    'key': 'family',
                    'title': 'Family Dynamics',
                    'bullets': [
                        "Family karma and responsibilities",
                        "Parent-child dynamics",
                        "Healing family patterns"
                    ]
                },
                {
                    'key': 'soul_connections',
                    'title': 'Soul Connections',
                    'bullets': [
                        "Soulmate indicators and recognition signs",
                        "Karmic bonds with key people",
                        "Lessons from soul group"
                    ]
                },
                {
                    'key': 'friendships',
                    'title': 'Friendships & Community',
                    'bullets': [
                        "Friendship patterns and support network",
                        "Allies and mentors",
                        "Community alignment"
                    ]
                },
                {
                    'key': 'professional',
                    'title': 'Professional Relationships',
                    'bullets': [
                        "Workplace dynamics and alliances",
                        "Mentors and rivals",
                        "Leadership and collaboration guidance"
                    ]
                },
                {
                    'key': 'karmic_patterns',
                    'title': 'Karmic Relationship Patterns',
                    'bullets': [
                        "Repeating relationship themes",
                        "Healing karmic loops",
                        "Boundaries and growth"
                    ]
                },
                {
                    'key': 'communication',
                    'title': 'Communication & Conflict Resolution',
                    'bullets': [
                        "Communication style and pitfalls",
                        "Conflict resolution practices",
                        "Ways to strengthen understanding"
                    ]
                },
                {
                    'key': 'timing',
                    'title': 'Timing for Relationship Events',
                    'bullets': [
                        "Timing windows for relationship milestones",
                        "Periods to initiate or avoid commitments",
                        "Dasha or transit indicators"
                    ]
                },
                {
                    'key': 'healing',
                    'title': 'Relationship Healing Practices',
                    'bullets': [
                        "Healing rituals and meditations",
                        "Forgiveness and release practices",
                        "Building trust and safety"
                    ]
                },
                {
                    'key': 'healthy_practices',
                    'title': 'Healthy Relationship Practices',
                    'bullets': [
                        "Daily habits for harmony",
                        "Values and boundaries",
                        "Long-term partnership nurturing"
                    ]
                }
            ],
            'predictions': [
                {
                    'key': 'daily',
                    'title': 'Daily Forecast',
                    'bullets': [
                        "Daily focus areas",
                        "Simple, actionable guidance",
                        "Astrological influence summary"
                    ]
                },
                {
                    'key': 'weekly',
                    'title': 'Weekly Forecast',
                    'bullets': [
                        "Themes for the coming week",
                        "Key opportunities and cautions",
                        "Practical actions"
                    ]
                },
                {
                    'key': 'monthly',
                    'title': 'Monthly Forecast',
                    'bullets': [
                        "Major monthly themes",
                        "Important dates or windows",
                        "Progress checkpoints"
                    ]
                },
                {
                    'key': 'yearly',
                    'title': 'Yearly Forecast',
                    'bullets': [
                        "Year-long themes and growth focus",
                        "Major milestones and opportunities",
                        "Areas to prioritize"
                    ]
                }
            ]
        }

    @staticmethod
    def _clean_value(value: Any) -> Any:
        if value is None:
            return "Unknown"
        if isinstance(value, str):
            cleaned = value.strip()
            return cleaned if cleaned else "Unknown"
        return value

    def _safe_get(self, data: Optional[Dict[str, Any]], key: str) -> Any:
        if not data:
            return "Unknown"
        return self._clean_value(data.get(key))

    def generate_comprehensive_prediction(self, birth_data: Dict[str, Any],
                                         category: str,
                                         question: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate comprehensive prediction for any category with separate complete analysis

        Args:
            birth_data: User's birth details and calculated chart
            category: Prediction category (karmic_journey, past_lives, etc.)
            question: Optional specific question

        Returns:
            Comprehensive prediction dictionary with standalone sections and complete_analysis
        """
        fallback = self._get_fallback_if_unavailable(category, birth_data)
        if fallback:
            return fallback

        # Calculate birth chart if not already provided
        if 'zodiac_sign' not in birth_data:
            if self.astrology_calculator:
                try:
                    chart_data = self.astrology_calculator.calculate_birth_chart(
                        birth_data['date_of_birth'],
                        birth_data['time_of_birth'],
                        birth_data['latitude'],
                        birth_data['longitude']
                    )
                    birth_data.update(chart_data)
                except Exception as e:
                    log_exception(logger, e, context="bhrigu_predictions.calculate_birth_chart")
            else:
                logger.warning("Astrology calculator unavailable; proceeding without chart enrichment.")

        # Route to specific prediction method
        category_methods = {
            'karmic_journey': self.generate_karmic_journey_prediction,
            'past_lives': self.generate_past_lives_prediction,
            'future_lives': self.generate_future_lives_prediction,
            'present_life': self.generate_present_life_prediction,
            'life_events': self.generate_life_events_prediction,
            'karmic_remedies': self.generate_karmic_remedies_prediction,
            'karma_reset': self.generate_karma_reset,
            'relationships': self.generate_relationships_prediction,
            'predictions': self.generate_general_predictions
        }

        method = category_methods.get(category, self.generate_general_predictions)
        result = method(birth_data, question)
        
        # Add complete analysis synthesis for appropriate categories
        if category in ['past_lives', 'future_lives', 'karmic_remedies', 'relationships']:
            result['complete_analysis'] = self._generate_complete_analysis(result, category)
        
        return result
    
    def _generate_complete_analysis(self, section_result: Dict[str, Any], category: str) -> str:
        """
        Generate a synthesized complete analysis that integrates all section content
        
        This is separate from individual sections and provides an integrated view
        """
        full_text = section_result.get('full_analysis', '')
        if not self.openai_service:
            return (
                f"Complete analysis synthesis unavailable due to missing AI services. "
                f"Review the detailed sections for insights into your {category.replace('_', ' ')}."
            )
        
        synthesis_prompt = f"""
        Based on the following extensive {category.replace('_', ' ')} analysis, create a 
        SYNTHESIZED SUMMARY that integrates all the key insights into a cohesive narrative.
        
        This summary should:
        1. Provide an integrated view of the soul journey
        2. Connect themes across different subsections
        3. Offer final actionable wisdom
        4. Be distinct from the detailed sections (not a repetition)
        5. Be 3-5 paragraphs of synthesis
        
        Original Analysis:
        {full_text[:3000]}  # Limit for synthesis
        
        Generate the complete synthesis:
        """
        
        try:
            synthesis = self.openai_service.generate_prediction(synthesis_prompt, {})
            return synthesis
        except Exception as e:
            return f"Complete analysis synthesis: See detailed sections above for comprehensive insights into your {category.replace('_', ' ')}."

    def _format_birth_details(self, birth_data: Dict[str, Any]) -> str:
        detail_map = [
            ('date_of_birth', 'Date of Birth'),
            ('time_of_birth', 'Time of Birth'),
            ('place_of_birth', 'Place of Birth'),
            ('age', 'Current Age'),
            ('zodiac_sign', 'Zodiac Sign (Rashi)'),
            ('moon_sign', 'Moon Sign'),
            ('ascendant', 'Ascendant (Lagna)'),
            ('nakshatra', 'Nakshatra'),
            ('rahu_position', 'North Node (Rahu)'),
            ('ketu_position', 'South Node (Ketu)'),
            ('jupiter_position', 'Jupiter Position'),
            ('saturn_position', 'Saturn Position'),
            ('dasha_period', 'Current Dasha Period')
        ]
        lines = []
        for key, label in detail_map:
            value = birth_data.get(key)
            if value not in (None, '', []):
                lines.append(f"- {label}: {value}")
        return "\n".join(lines) if lines else "- Birth details unavailable"

    def _build_section_prompt(
        self,
        category: str,
        section_spec: Dict[str, Any],
        birth_data: Dict[str, Any],
        question: Optional[str] = None
    ) -> str:
        focus_lines = "\n".join(f"- {item}" for item in section_spec.get('bullets', []))
        question_line = f"Specific Question: {question}" if question else ""
        return f"""{self.bhrigu_system_prompt}

Generate ONLY the section titled "{section_spec['title']}" for the {category.replace('_', ' ')} analysis.

Birth Details:
{self._format_birth_details(birth_data)}

{question_line}

Focus on:
{focus_lines}

Return only the section body (no header). Use at least 200 words with concrete astrological references."""

    def _strip_section_header(self, text: str, section_title: str) -> str:
        if not text:
            return ""
        lines = text.strip().splitlines()
        if lines and lines[0].lstrip().startswith('#') and section_title.lower() in lines[0].lower():
            return "\n".join(lines[1:]).strip()
        return text.strip()

    def _assemble_full_analysis(self, section_specs: List[Dict[str, Any]], sections: Dict[str, Any]) -> str:
        parts: List[str] = []
        for spec in section_specs:
            content = sections.get(spec['key'], '')
            if content:
                parts.append(f"## {spec['title']}\n{content.strip()}")
        return "\n\n".join(parts).strip()

    def _is_long_profile(self, birth_data: Dict[str, Any]) -> bool:
        profile_text = json.dumps(birth_data, ensure_ascii=False)
        token_estimate = len(profile_text) // 4
        if self.openai_service:
            token_estimate = self.openai_service._estimate_tokens(profile_text)
        threshold = int(os.getenv('PROFILE_CHUNK_TOKEN_THRESHOLD', '2000'))
        return token_estimate >= threshold

    def _generate_sectioned_prediction(
        self,
        category: str,
        birth_data: Dict[str, Any],
        question: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate sectioned prediction with crash prevention"""
        try:
            section_specs = self.SECTION_SPECS.get(category, [])
            sections: Dict[str, Any] = {}
            status_map: Dict[str, Any] = {}

            for section_spec in section_specs:
                try:
                    prompt = self._build_section_prompt(category, section_spec, birth_data, question)
                    section_text = self.openai_service.generate_prediction(prompt, birth_data)
                    sections[section_spec['key']] = self._strip_section_header(
                        section_text,
                        section_spec['title']
                    )
                    status_map[section_spec['key']] = {'status': 'generated'}
                except Exception as e:
                    logger.error(f"Section generation failed for {section_spec['key']}: {e}")
                    sections[section_spec['key']] = f"Section temporarily unavailable. {section_spec['title']} content will be available shortly."
                    status_map[section_spec['key']] = {'status': 'fallback', 'error': str(e)}

            sections['section_generation_status'] = status_map
            full_analysis = self._assemble_full_analysis(section_specs, sections)
            sections = self._auto_repair_sections(sections, full_analysis, category, birth_data)
            full_analysis = self._assemble_full_analysis(section_specs, sections)

            return {
                'full_analysis': full_analysis,
                'sections': sections,
                'chunking': self._is_long_profile(birth_data)
            }
        except Exception as e:
            logger.error(f"Critical error in _generate_sectioned_prediction: {e}", exc_info=True)
            # Return minimal valid structure
            return {
                'full_analysis': f"Prediction generation encountered an error. Category: {category}",
                'sections': {},
                'chunking': False,
                'error': str(e)
            }

    def generate_karmic_journey_prediction(self, birth_data: Dict[str, Any],
                                          question: Optional[str] = None) -> Dict[str, Any]:
        """
        Karmic Journey: Discover your soul's purpose and life mission
        Based on Bhrigu Samhita principles of soul evolution
        Enhanced with Nadi Jyotisha integration
        GUARANTEED to return a valid dict - never fails
        """
        try:
            fallback = self._get_fallback_if_unavailable('karmic_journey', birth_data)
            if fallback:
                return fallback

            prediction_payload = self._generate_sectioned_prediction(
                'karmic_journey',
                birth_data,
                question
            )
            prediction_text = prediction_payload['full_analysis']
            sections = prediction_payload['sections']
            metadata = self._generate_metadata(birth_data, 'karmic_journey')
            metadata['chunking'] = prediction_payload.get('chunking', False)

            result = {
                'category': 'karmic_journey',
                'title': 'Your Karmic Journey & Soul Purpose',
                'full_analysis': prediction_text,
                **sections,  # Include all extracted/generated sections
                'metadata': metadata,
                'generated_at': datetime.utcnow().isoformat()
            }

            # Enrich with Nadi integration if available
            if NADI_AVAILABLE:
                try:
                    nadi_reading = BhriguNadiIntegration.generate_for_category(
                        'karmic_journey',
                        birth_data,
                        depth='comprehensive'
                    )
                    result['nadi_insights'] = nadi_reading.get('data', {})
                    metadata['nadi_integrated'] = True
                except Exception as e:
                    logger.warning(f"Nadi integration failed for karmic_journey: {e}")
                    metadata['nadi_integrated'] = False

            return result
        except Exception as e:
            logger.error(f"Karmic journey prediction failed: {e}", exc_info=True)
            # GUARANTEED fallback - always return valid dict
            return self._get_fallback_if_unavailable('karmic_journey', birth_data) or {
                'category': 'karmic_journey',
                'title': 'Your Karmic Journey & Soul Purpose',
                'full_analysis': 'Prediction temporarily unavailable. Please try again.',
                'error': 'generation_failed',
                'metadata': {'error': str(e)},
                'generated_at': datetime.utcnow().isoformat()
            }

    def generate_past_lives_prediction(self, birth_data: Dict[str, Any],
                                      question: Optional[str] = None) -> Dict[str, Any]:
        """
        Past Lives: Explore previous incarnations and karmic patterns
        Enhanced with Nadi Jyotisha integration
        GUARANTEED to return a valid dict - never fails
        """
        try:
            fallback = self._get_fallback_if_unavailable('past_lives', birth_data)
            if fallback:
                return fallback

            prediction_payload = self._generate_sectioned_prediction(
                'past_lives',
                birth_data,
                question
            )
            prediction_text = prediction_payload['full_analysis']
            sections = prediction_payload['sections']
            metadata = self._generate_metadata(birth_data, 'past_lives')
            metadata['chunking'] = prediction_payload.get('chunking', False)

            result = {
                'category': 'past_lives',
                'title': 'Your Past Lives & Karmic Patterns',
                'full_analysis': prediction_text,
                **sections,  # Include all extracted/generated sections
                'metadata': metadata,
                'generated_at': datetime.utcnow().isoformat()
            }

            # Enrich with Nadi integration if available
            if NADI_AVAILABLE:
                try:
                    nadi_reading = BhriguNadiIntegration.generate_for_category(
                        'past_lives',
                        birth_data,
                        depth='comprehensive'
                    )
                    result['nadi_insights'] = nadi_reading.get('data', {})
                    metadata['nadi_integrated'] = True
                except Exception as e:
                    logger.warning(f"Nadi integration failed for past_lives: {e}")
                    metadata['nadi_integrated'] = False

            return result
        except Exception as e:
            logger.error(f"Past lives prediction failed: {e}", exc_info=True)
            return self._get_fallback_if_unavailable('past_lives', birth_data) or {
                'category': 'past_lives',
                'title': 'Your Past Lives & Karmic Patterns',
                'full_analysis': 'Prediction temporarily unavailable. Please try again.',
                'error': 'generation_failed',
                'metadata': {'error': str(e)},
                'generated_at': datetime.utcnow().isoformat()
            }

    def generate_future_lives_prediction(self, birth_data: Dict[str, Any],
                                        question: Optional[str] = None) -> Dict[str, Any]:
        """
        Future Lives: Envision soul's evolution and future incarnations
        Enhanced with Nadi Jyotisha integration
        GUARANTEED to return a valid dict - never fails
        """
        try:
            fallback = self._get_fallback_if_unavailable('future_lives', birth_data)
            if fallback:
                return fallback

            prediction_payload = self._generate_sectioned_prediction(
                'future_lives',
                birth_data,
                question
            )
            prediction_text = prediction_payload['full_analysis']
            sections = prediction_payload['sections']
            metadata = self._generate_metadata(birth_data, 'future_lives')
            metadata['chunking'] = prediction_payload.get('chunking', False)

            result = {
                'category': 'future_lives',
                'title': 'Your Future Lives & Soul Evolution',
                'full_analysis': prediction_text,
                **sections,  # Include all extracted/generated sections
                'metadata': metadata,
                'generated_at': datetime.utcnow().isoformat()
            }

            # Enrich with Nadi integration if available
            if NADI_AVAILABLE:
                try:
                    nadi_reading = BhriguNadiIntegration.generate_for_category(
                        'future_lives',
                        birth_data,
                        depth='comprehensive'
                    )
                    result['nadi_insights'] = nadi_reading.get('data', {})
                    metadata['nadi_integrated'] = True
                except Exception as e:
                    logger.warning(f"Nadi integration failed for future_lives: {e}")
                    metadata['nadi_integrated'] = False

            return result
        except Exception as e:
            logger.error(f"Future lives prediction failed: {e}", exc_info=True)
            return self._get_fallback_if_unavailable('future_lives', birth_data) or {
                'category': 'future_lives',
                'title': 'Your Future Lives & Soul Evolution',
                'full_analysis': 'Prediction temporarily unavailable. Please try again.',
                'error': 'generation_failed',
                'metadata': {'error': str(e)},
                'generated_at': datetime.utcnow().isoformat()
            }

    def generate_present_life_prediction(self, birth_data: Dict[str, Any],
                                        question: Optional[str] = None) -> Dict[str, Any]:
        """
        Present Life: Comprehensive analysis of current life and opportunities
        Enhanced with Nadi Jyotisha integration
        GUARANTEED to return a valid dict - never fails
        """
        try:
            fallback = self._get_fallback_if_unavailable('present_life', birth_data)
            if fallback:
                return fallback

            prediction_payload = self._generate_sectioned_prediction(
                'present_life',
                birth_data,
                question
            )
            prediction_text = prediction_payload['full_analysis']
            sections = prediction_payload['sections']
            metadata = self._generate_metadata(birth_data, 'present_life')
            metadata['chunking'] = prediction_payload.get('chunking', False)

            result = {
                'category': 'present_life',
                'title': 'Your Present Life Comprehensive Analysis',
                'full_analysis': prediction_text,
                **sections,  # Include all extracted/generated sections
                'metadata': metadata,
                'generated_at': datetime.utcnow().isoformat()
            }

            return self._enrich_with_nadi(result, 'present_life', birth_data)
        except Exception as e:
            logger.error(f"Present life prediction failed: {e}", exc_info=True)
            return self._get_fallback_if_unavailable('present_life', birth_data) or {
                'category': 'present_life',
                'title': 'Your Present Life Comprehensive Analysis',
                'full_analysis': 'Prediction temporarily unavailable. Please try again.',
                'error': 'generation_failed',
                'metadata': {'error': str(e)},
                'generated_at': datetime.utcnow().isoformat()
            }

    def generate_life_events_prediction(self, birth_data: Dict[str, Any],
                                       question: Optional[str] = None) -> Dict[str, Any]:
        """
        Life Events: Predict major transitions with precision timing
        Enhanced with Nadi Jyotisha integration
        GUARANTEED to return a valid dict - never fails
        """
        try:
            fallback = self._get_fallback_if_unavailable('life_events', birth_data)
            if fallback:
                return fallback

            current_age_value = birth_data.get('age')
            if current_age_value is None:
                current_age_value = self._calculate_age(birth_data.get('date_of_birth'))
            if isinstance(current_age_value, (int, float)) and current_age_value > 0:
                current_age_display = current_age_value
                age_next = current_age_value + 1
            else:
                current_age_display = "Unknown"
                age_next = "Unknown"

            if birth_data.get('age') is None:
                birth_data['age'] = current_age_display

            prediction_payload = self._generate_sectioned_prediction(
                'life_events',
                birth_data,
                question
            )
            prediction_text = prediction_payload['full_analysis']
            sections = prediction_payload['sections']
            metadata = self._generate_metadata(birth_data, 'life_events')
            metadata['chunking'] = prediction_payload.get('chunking', False)

            result = {
                'category': 'life_events',
                'title': 'Your Life Events with Precision Timing',
                'full_analysis': prediction_text,
                **sections,  # Include all extracted/generated sections
                'metadata': metadata,
                'generated_at': datetime.utcnow().isoformat()
            }

            return self._enrich_with_nadi(result, 'life_events', birth_data)
        except Exception as e:
            logger.error(f"Life events prediction failed: {e}", exc_info=True)
            return self._get_fallback_if_unavailable('life_events', birth_data) or {
                'category': 'life_events',
                'title': 'Your Life Events with Precision Timing',
                'full_analysis': 'Prediction temporarily unavailable. Please try again.',
                'error': 'generation_failed',
                'metadata': {'error': str(e)},
                'generated_at': datetime.utcnow().isoformat()
            }

    def generate_karmic_remedies_prediction(self, birth_data: Dict[str, Any],
                                           question: Optional[str] = None) -> Dict[str, Any]:
        """
        Karmic Remedies: Personalized spiritual practices and remedies
        Enhanced with Nadi Jyotisha integration
        GUARANTEED to return a valid dict - never fails
        """
        try:
            fallback = self._get_fallback_if_unavailable('karmic_remedies', birth_data)
            if fallback:
                return fallback
            if not self._has_required_birth_inputs(birth_data):
                logger.warning("Missing birth data for karmic remedies; returning core wisdom fallback")
                return self._build_remedies_fallback(birth_data)
            prediction_payload = self._generate_sectioned_prediction(
                'karmic_remedies',
                birth_data,
                question
            )
            validation_error = self._validate_section_payload(prediction_payload, 'karmic_remedies')
            if validation_error:
                logger.warning(
                    f"Karmic remedies payload invalid ({validation_error}); using core wisdom fallback"
                )
                return self._build_remedies_fallback(birth_data)
            prediction_text = prediction_payload['full_analysis']
            sections = prediction_payload['sections']
            metadata = self._generate_metadata(birth_data, 'karmic_remedies')
            metadata['chunking'] = prediction_payload.get('chunking', False)

            result = {
                'category': 'karmic_remedies',
                'title': 'Your Personalized Karmic Remedies',
                'full_analysis': prediction_text,
                **sections,  # Include all extracted/generated sections
                'metadata': metadata,
                'generated_at': datetime.utcnow().isoformat()
            }

            return self._enrich_with_nadi(result, 'karmic_remedies', birth_data)
        except Exception as e:
            logger.error(f"Karmic remedies prediction failed: {e}", exc_info=True)
            return self._get_fallback_if_unavailable('karmic_remedies', birth_data) or {
                'category': 'karmic_remedies',
                'title': 'Your Personalized Karmic Remedies',
                'full_analysis': 'Prediction temporarily unavailable. Please try again.',
                'error': 'generation_failed',
                'metadata': {'error': str(e)},
                'generated_at': datetime.utcnow().isoformat()
            }

    def generate_karma_reset(self, birth_data: Dict[str, Any],
                             question: Optional[str] = None) -> Dict[str, Any]:
        """
        Karma Reset: Guided reset plan with default template fallback
        GUARANTEED to return a valid dict - never fails
        """
        try:
            fallback = self._get_fallback_if_unavailable('karma_reset', birth_data)
            if fallback:
                return fallback
            if not self._has_required_birth_inputs(birth_data):
                logger.warning("Missing birth data for karma reset; returning default template")
                return self._build_karma_reset_fallback(birth_data)

            prediction_payload = self._generate_sectioned_prediction(
                'karma_reset',
                birth_data,
                question
            )
            validation_error = self._validate_section_payload(prediction_payload, 'karma_reset')
            if validation_error:
                logger.warning(
                    f"Karma reset payload invalid ({validation_error}); using default template"
                )
                return self._build_karma_reset_fallback(birth_data)

            prediction_text = prediction_payload['full_analysis']
            sections = prediction_payload['sections']
            metadata = self._generate_metadata(birth_data, 'karma_reset')
            metadata['chunking'] = prediction_payload.get('chunking', False)

            result = {
                'category': 'karma_reset',
                'title': 'Your Karma Reset Plan',
                'full_analysis': prediction_text,
                **sections,
                'metadata': metadata,
                'generated_at': datetime.utcnow().isoformat()
            }

            return self._enrich_with_nadi(result, 'karma_reset', birth_data)
        except Exception as e:
            logger.error(f"Karma reset prediction failed: {e}", exc_info=True)
            return self._get_fallback_if_unavailable('karma_reset', birth_data) or self._build_karma_reset_fallback(birth_data)

    def generate_relationships_prediction(self, birth_data: Dict[str, Any],
                                         question: Optional[str] = None) -> Dict[str, Any]:
        """
        Relationships: Soul connections and compatibility analysis
        Enhanced with Nadi Jyotisha integration
        GUARANTEED to return a valid dict - never fails
        """
        try:
            fallback = self._get_fallback_if_unavailable('relationships', birth_data)
            if fallback:
                return fallback
            prediction_payload = self._generate_sectioned_prediction(
                'relationships',
                birth_data,
                question
            )
            prediction_text = prediction_payload['full_analysis']
            sections = prediction_payload['sections']
            metadata = self._generate_metadata(birth_data, 'relationships')
            metadata['chunking'] = prediction_payload.get('chunking', False)

            result = {
                'category': 'relationships',
                'title': 'Your Relationships & Soul Connections',
                'full_analysis': prediction_text,
                **sections,  # Include all extracted/generated sections
                'metadata': metadata,
                'generated_at': datetime.utcnow().isoformat()
            }

            return self._enrich_with_nadi(result, 'relationships', birth_data)
        except Exception as e:
            logger.error(f"Relationships prediction failed: {e}", exc_info=True)
            return self._get_fallback_if_unavailable('relationships', birth_data) or {
                'category': 'relationships',
                'title': 'Your Relationships & Soul Connections',
                'full_analysis': 'Prediction temporarily unavailable. Please try again.',
                'error': 'generation_failed',
                'metadata': {'error': str(e)},
                'generated_at': datetime.utcnow().isoformat()
            }

    def generate_general_predictions(self, birth_data: Dict[str, Any],
                                    question: Optional[str] = None) -> Dict[str, Any]:
        """
        General Predictions: Daily, weekly, monthly forecasts
        Enhanced with Nadi Jyotisha integration
        GUARANTEED to return a valid dict - never fails
        """
        try:
            fallback = self._get_fallback_if_unavailable('predictions', birth_data)
            if fallback:
                return fallback
            prediction_payload = self._generate_sectioned_prediction(
                'predictions',
                birth_data,
                question
            )
            prediction_text = prediction_payload['full_analysis']
            sections = prediction_payload['sections']
            metadata = self._generate_metadata(birth_data, 'predictions')
            metadata['chunking'] = prediction_payload.get('chunking', False)

            result = {
                'category': 'predictions',
                'title': 'Your General Predictions',
                'full_analysis': prediction_text,
                **sections,  # Include all extracted/generated sections
                'metadata': metadata,
                'generated_at': datetime.utcnow().isoformat()
            }

            return self._enrich_with_nadi(result, 'predictions', birth_data)
        except Exception as e:
            logger.error(f"General predictions failed: {e}", exc_info=True)
            return self._get_fallback_if_unavailable('predictions', birth_data) or {
                'category': 'predictions',
                'title': 'Your General Predictions',
                'full_analysis': 'Prediction temporarily unavailable. Please try again.',
                'error': 'generation_failed',
                'metadata': {'error': str(e)},
                'generated_at': datetime.utcnow().isoformat()
            }

    # Helper methods

    def _auto_repair_sections(
        self,
        sections: Dict[str, Any],
        prediction_text: str,
        category: str,
        birth_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate any missing or insufficient sections and update status metadata."""
        missing_sections = self.section_parser.get_missing_sections(sections, category)
        if missing_sections:
            logger.info(f"Auto-repairing {len(missing_sections)} missing sections for {category}")
            status_map = sections.get('section_generation_status', {})
            for section_key in missing_sections:
                section_data, generation_status, fallback_reason = self.section_parser.generate_missing_section(
                    section_key,
                    prediction_text,
                    category,
                    birth_data,
                    include_status=True
                )
                sections[section_key] = section_data
                status_entry = {'status': generation_status}
                if generation_status == "generated":
                    status_entry['fallback_reason'] = "post_validation_missing"
                else:
                    combined_reason = "post_validation_missing"
                    if fallback_reason:
                        combined_reason = f"{combined_reason};{fallback_reason}"
                    status_entry['fallback_reason'] = combined_reason
                status_map[section_key] = status_entry
            sections['section_generation_status'] = status_map
        return sections

    def _extract_section(self, text: str, section_header: str) -> str:
        """Extract a specific section from the prediction text"""
        if not text:
            return ""

        lines = text.split('\n')
        section_lines = []
        in_section = False
        header_found = False

        for i, line in enumerate(lines):
            # Check if we found the section header
            if section_header.lower() in line.lower() and line.strip().startswith('#'):
                in_section = True
                header_found = True
                continue

            # If in section and hit another header of same or higher level, stop
            if in_section and line.strip().startswith('#'):
                # Check if it's a new major section
                if header_found and line.strip().startswith('##'):
                    if not line.strip().startswith('###'):  # Allow subsections
                        break
                elif line.strip().startswith('#') and not line.strip().startswith('#' * 4):
                    break

            # Add lines if in the section
            if in_section:
                section_lines.append(line)

        result = '\n'.join(section_lines).strip()
        return result if result else f"See full analysis for {section_header}"

    def _generate_metadata(self, birth_data: Dict[str, Any], category: Optional[str] = None) -> Dict[str, Any]:
        """Generate metadata for the prediction"""
        selected_model = os.getenv('OPENAI_MODEL', 'gpt-4')
        if self.openai_service:
            selected_model = self.openai_service.get_selected_model()
        metadata = {
            'zodiac_sign': birth_data.get('zodiac_sign'),
            'nakshatra': birth_data.get('nakshatra'),
            'moon_sign': birth_data.get('moon_sign'),
            'ascendant': birth_data.get('ascendant'),
            'ai_model': selected_model,
            'corpus_available': self.openai_service.corpus_available,
            'tradition': 'Bhrigu Samhita & Nadi Jyotisa'
        }
        if category:
            section_keys = self.section_parser.REQUIRED_SECTIONS.get(category, [])
            if section_keys:
                metadata['section_keys'] = section_keys
        return metadata

    def get_selected_model(self) -> str:
        if self.openai_service:
            return self.openai_service.get_selected_model()
        return os.getenv('OPENAI_MODEL', 'gpt-4')

    def _calculate_age(self, date_of_birth: str) -> int:
        """Calculate age from date of birth"""
        if not date_of_birth:
            return 0
        try:
            from datetime import datetime
            dob = datetime.fromisoformat(date_of_birth.replace('/', '-'))
            today = datetime.now()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            return age
        except (ValueError, AttributeError) as e:
            # Return 0 if date format invalid
            return 0


# Singleton instance
_bhrigu_service = None
_bhrigu_service_init_error = None


def get_bhrigu_service(
    force_reinit: bool = False,
    openai_service: Any = _DEFAULT_DEPENDENCY,
    astrology_calculator: Any = _DEFAULT_DEPENDENCY,
    section_parser: Any = _DEFAULT_DEPENDENCY,
    corpus_db: Any = _DEFAULT_DEPENDENCY,
):
    """Get or create Bhrigu Predictions Service singleton"""
    global _bhrigu_service, _bhrigu_service_init_error
    if force_reinit:
        _bhrigu_service = None
    if _bhrigu_service is None:
        try:
            _bhrigu_service = BhriguPredictionsService(
                openai_service=openai_service,
                astrology_calculator=astrology_calculator,
                section_parser=section_parser,
                corpus_db=corpus_db,
            )
            _bhrigu_service_init_error = None
        except Exception as exc:
            _bhrigu_service_init_error = {
                'error': str(exc),
                'type': exc.__class__.__name__,
                'timestamp': datetime.utcnow().isoformat()
            }
            raise
    return _bhrigu_service


def get_bhrigu_service_init_error() -> Optional[Dict[str, str]]:
    """Return the last initialization error for the Bhrigu service."""
    return _bhrigu_service_init_error

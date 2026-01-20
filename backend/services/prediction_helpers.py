"""
Prediction Helpers
Helper functions for formatting and fallback predictions

UPDATED: Now uses EnhancedPredictionEngine for unique, category-specific content
based on authentic Bhrigu Samhita & Nadi Jyotisha wisdom databases.
"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Import EnhancedPredictionEngine for unique fallback predictions
_enhanced_engine = None

def _get_enhanced_engine():
    """Lazy load the enhanced prediction engine to avoid circular imports"""
    global _enhanced_engine
    if _enhanced_engine is None:
        try:
            from services.category_specific_offline_predictions import get_category_specific_predictor
            _enhanced_engine = get_category_specific_predictor()
            logger.info("EnhancedPredictionEngine loaded for unique fallback predictions")
        except Exception as e:
            logger.warning(f"Could not load EnhancedPredictionEngine: {e}")
            _enhanced_engine = False  # Mark as failed so we don't retry
    return _enhanced_engine if _enhanced_engine else None


def format_soul_purpose(soul_purpose_data: Dict[str, Any]) -> str:
    """Format soul purpose data into readable text"""
    if not soul_purpose_data.get('success'):
        return "Soul purpose calculation unavailable. See fallback guidance."

    content = f"""## Your Soul's Primary Purpose

{soul_purpose_data.get('primary_purpose', 'Your soul has incarnated for growth and evolution.')}

### Purpose Indicators

"""
    for indicator in soul_purpose_data.get('purpose_indicators', []):
        content += f"""
**{indicator['indicator']}: {indicator['value']}**
{indicator['purpose']}

"""

    content += f"""
### Soul Lessons
"""
    for lesson in soul_purpose_data.get('soul_lessons', []):
        content += f"- {lesson}\n"

    return content


def format_karmic_debts(karmic_debts_data: Dict[str, Any]) -> str:
    """Format karmic debts data"""
    if not karmic_debts_data.get('success'):
        return "Karmic analysis unavailable."

    content = """## Karmic Debts & Credits

### Karmic Debts to Resolve

"""
    for debt in karmic_debts_data.get('karmic_debts', []):
        content += f"""
**{debt['planet']} in House {debt.get('house', 'Unknown')}**
- {debt['description']}
- Severity: {debt.get('severity', 'Medium')}
- Remedy Focus: {debt.get('remedy_focus', 'Spiritual practice')}

"""

    content += """
### Karmic Credits & Blessings

"""
    for credit in karmic_debts_data.get('karmic_credits', []):
        content += f"""
**{credit['planet']}**
- {credit['description']}
- Strength: {credit.get('strength', 'Natural gift')}
- Application: {credit.get('application', 'Use wisely')}

"""

    content += f"""
### Overall Assessment
{karmic_debts_data.get('overall_assessment', 'Your karmic balance shows opportunities for growth.')}
"""

    return content


def format_mantras(mantras: List[Dict]) -> str:
    """Format mantra recommendations"""
    if not mantras:
        return "Mantra recommendations unavailable. Practice Om meditation daily."

    content = """## Sacred Mantras for Planetary Strength

"""
    for mantra_data in mantras[:5]:  # Show top 5
        content += f"""
### {mantra_data['planet']} Mantra
**Mantra:** {mantra_data['mantra']}
**Count:** {mantra_data['count']}
**Timing:** {mantra_data['timing']}
**Benefits:** {mantra_data['benefits']}

"""
    return content


def format_gemstones(gemstones: List[Dict]) -> str:
    """Format gemstone recommendations"""
    if not gemstones:
        return "Gemstone recommendations unavailable. Consult with an astrologer."

    content = """## Gemstone Recommendations

"""
    for gem in gemstones:
        content += f"""
### {gem.get('primary_stone', 'Consult Astrologer')}
**For:** {gem.get('ascendant', 'Your ascendant')}
**Weight:** {gem.get('weight', '3-5 carats')}
**Metal:** {gem.get('metal', 'Gold or Silver')}
**Finger:** {gem.get('finger', 'Ring finger')}
**Day to Wear:** {gem.get('day_to_wear', 'Auspicious Thursday')}
**Energizing Process:** {gem.get('energizing', 'Chant planetary mantra 108 times')}

"""
    return content


def format_yantras(yantras: List[Dict]) -> str:
    """Format yantra recommendations"""
    if not yantras:
        return "Yantra recommendations unavailable."

    content = """## Sacred Yantras

"""
    for yantra in yantras:
        content += f"""
### {yantra['type']}
**Purpose:** {yantra['purpose']}
**Material:** {yantra['material']}
**Placement:** {yantra['placement']}
**Worship:** {yantra['worship']}

"""
    return content


def format_charity(charity_items: List[Dict]) -> str:
    """Format charity recommendations"""
    if not charity_items:
        return "Charitable activities unavailable."

    content = """## Charitable Activities (Dana)

Regular charity purifies karma and brings blessings.

"""
    for item in charity_items:
        content += f"""
### {item['day']} - {item['planet']}
**Items to Donate:** {item['items']}
**Recipients:** {item['recipients']}

"""
    return content


def format_rituals(rituals: List[Dict]) -> str:
    """Format ritual recommendations"""
    if not rituals:
        return "Ritual recommendations unavailable."

    content = """## Recommended Rituals

"""
    for ritual in rituals:
        content += f"""
### {ritual['ritual']}
**Frequency:** {ritual['frequency']}
**Benefits:** {ritual['benefits']}
**When to Perform:** {ritual['when']}

"""
    return content


def format_lifestyle(lifestyle_practices: List[Dict]) -> str:
    """Format lifestyle recommendations"""
    if not lifestyle_practices:
        return "Lifestyle recommendations unavailable."

    content = """## Daily Spiritual Practices

"""
    for practice in lifestyle_practices:
        content += f"""
### {practice['practice']}
**Frequency:** {practice['frequency']}
**Benefits:** {practice['benefits']}
**Timing:** {practice['timing']}

"""
    return content


def format_life_events(events: Dict[str, List[Dict]]) -> str:
    """Format life events by category"""
    if not events:
        return "Life events timing unavailable."

    content = """## Major Life Events by Category

"""
    categories = {
        'marriage': 'Marriage & Partnerships',
        'career': 'Career & Professional Growth',
        'children': 'Children & Family Expansion',
        'wealth': 'Wealth & Financial Events',
        'health': 'Health Considerations',
        'spiritual': 'Spiritual Growth',
        'travel': 'Travel & Relocation'
    }

    for category_key, category_title in categories.items():
        category_events = events.get(category_key, [])
        if category_events:
            content += f"\n### {category_title}\n\n"
            for event in category_events:
                content += f"""
**{event['period']}** ({event['timing']})
- {event['description']}
- Probability: {event.get('probability', 'Medium')}
{f"- Remedy: {event['remedy']}" if 'remedy' in event else ''}

"""
    return content


def format_dharmic_path(dharmic_data: Dict[str, str]) -> str:
    """Format dharmic path data"""
    content = """## Your Dharmic Path

### Four Types of Dharma

"""
    dharma_titles = {
        'svadharma': 'Personal Dharma (Svadharma)',
        'kula_dharma': 'Family Dharma (Kula Dharma)',
        'varna_dharma': 'Professional Dharma (Varna Dharma)',
        'sanatana_dharma': 'Universal Dharma (Sanatana Dharma)'
    }

    for key, title in dharma_titles.items():
        value = dharmic_data.get(key, 'Fulfill your duties with awareness')
        content += f"**{title}:** {value}\n\n"

    return content


# Fallback functions

def fallback_soul_purpose(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Fallback soul purpose when calculation fails"""
    zodiac = chart_data.get('zodiac_sign', 'Unknown')
    nakshatra = chart_data.get('nakshatra', 'Unknown')

    return {
        'title': 'Soul Purpose',
        'content': f"""## Your Soul Purpose

As a {zodiac} native with {nakshatra} nakshatra, your soul has incarnated with a specific mission in this lifetime.

### Primary Purpose
Your primary soul purpose is spiritual evolution through practical life experiences. Every challenge and opportunity serves your growth.

### Key Themes
- Learning patience and perseverance
- Developing compassion and wisdom
- Serving others while fulfilling personal goals
- Balancing material and spiritual pursuits

*For detailed AI-enhanced analysis, please use online mode with complete birth details.*"""
    }


def fallback_karmic_journey(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for karmic journey - uses EnhancedPredictionEngine for unique content"""
    # Try to use EnhancedPredictionEngine for unique predictions
    engine = _get_enhanced_engine()
    if engine:
        try:
            return engine.generate('karmic_journey', chart_data)
        except Exception as e:
            logger.warning(f"EnhancedPredictionEngine failed for karmic_journey: {e}")

    # Ultimate fallback if engine unavailable
    zodiac = chart_data.get('zodiac_sign', 'Unknown')
    nakshatra = chart_data.get('nakshatra', 'Unknown')

    return {
        'category': 'karmic_journey',
        'title': 'Your Karmic Journey & Soul Purpose',
        'full_analysis': f"As a {zodiac} native with {nakshatra} nakshatra, your karmic journey analysis requires the enhanced wisdom engine. Please ensure the system is properly configured.",
        'metadata': {
            'zodiac_sign': zodiac,
            'nakshatra': nakshatra,
            'ai_model': 'minimal_fallback',
            'fallback_mode': True
        },
        'generated_at': datetime.utcnow().isoformat()
    }


def fallback_past_lives(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for past lives - uses EnhancedPredictionEngine for unique content"""
    engine = _get_enhanced_engine()
    if engine:
        try:
            return engine.generate('past_lives', chart_data)
        except Exception as e:
            logger.warning(f"EnhancedPredictionEngine failed for past_lives: {e}")

    zodiac = chart_data.get('zodiac_sign', 'Unknown')
    nakshatra = chart_data.get('nakshatra', 'Unknown')

    return {
        'category': 'past_lives',
        'title': 'Your Past Lives & Karmic Patterns',
        'full_analysis': f"As a {zodiac} native with {nakshatra} nakshatra, your past lives analysis requires the enhanced wisdom engine.",
        'metadata': {
            'zodiac_sign': zodiac,
            'nakshatra': nakshatra,
            'ai_model': 'minimal_fallback',
            'fallback_mode': True
        },
        'generated_at': datetime.utcnow().isoformat()
    }


def fallback_future_lives(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for future lives - uses EnhancedPredictionEngine for unique content"""
    engine = _get_enhanced_engine()
    if engine:
        try:
            return engine.generate('future_lives', chart_data)
        except Exception as e:
            logger.warning(f"EnhancedPredictionEngine failed for future_lives: {e}")

    zodiac = chart_data.get('zodiac_sign', 'Unknown')
    nakshatra = chart_data.get('nakshatra', 'Unknown')

    return {
        'category': 'future_lives',
        'title': 'Your Future Lives & Soul Evolution',
        'full_analysis': f"As a {zodiac} native with {nakshatra} nakshatra, your future lives analysis requires the enhanced wisdom engine.",
        'metadata': {
            'zodiac_sign': zodiac,
            'nakshatra': nakshatra,
            'ai_model': 'minimal_fallback',
            'fallback_mode': True
        },
        'generated_at': datetime.utcnow().isoformat()
    }


def fallback_present_life(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for present life - uses EnhancedPredictionEngine for unique content"""
    engine = _get_enhanced_engine()
    if engine:
        try:
            return engine.generate('present_life', chart_data)
        except Exception as e:
            logger.warning(f"EnhancedPredictionEngine failed for present_life: {e}")

    zodiac = chart_data.get('zodiac_sign', 'Unknown')

    return {
        'category': 'present_life',
        'title': 'Your Present Life Comprehensive Analysis',
        'full_analysis': f"As a {zodiac} native, your present life analysis requires the enhanced wisdom engine.",
        'metadata': {
            'zodiac_sign': zodiac,
            'ai_model': 'minimal_fallback',
            'fallback_mode': True
        },
        'generated_at': datetime.utcnow().isoformat()
    }


def fallback_life_events(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for life events - uses EnhancedPredictionEngine for unique content"""
    engine = _get_enhanced_engine()
    if engine:
        try:
            return engine.generate('life_events', chart_data)
        except Exception as e:
            logger.warning(f"EnhancedPredictionEngine failed for life_events: {e}")

    zodiac = chart_data.get('zodiac_sign', 'Unknown')

    return {
        'category': 'life_events',
        'title': 'Your Life Events with Precision Timing',
        'full_analysis': f"As a {zodiac} native, your life events analysis requires the enhanced wisdom engine.",
        'metadata': {
            'zodiac_sign': zodiac,
            'ai_model': 'minimal_fallback',
            'fallback_mode': True
        },
        'generated_at': datetime.utcnow().isoformat()
    }


def fallback_karmic_remedies(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for karmic remedies - uses EnhancedPredictionEngine for unique content"""
    engine = _get_enhanced_engine()
    if engine:
        try:
            return engine.generate('karmic_remedies', chart_data)
        except Exception as e:
            logger.warning(f"EnhancedPredictionEngine failed for karmic_remedies: {e}")

    zodiac = chart_data.get('zodiac_sign', 'Unknown')

    return {
        'category': 'karmic_remedies',
        'title': 'Your Personalized Karmic Remedies',
        'full_analysis': f"As a {zodiac} native, your karmic remedies analysis requires the enhanced wisdom engine.",
        'metadata': {
            'zodiac_sign': zodiac,
            'ai_model': 'minimal_fallback',
            'fallback_mode': True
        },
        'generated_at': datetime.utcnow().isoformat()
    }


def fallback_karma_reset(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Default fallback for karma reset predictions - uses EnhancedPredictionEngine"""
    engine = _get_enhanced_engine()
    if engine:
        try:
            # karma_reset uses karmic_remedies category in the engine
            return engine.generate('karmic_remedies', chart_data)
        except Exception as e:
            logger.warning(f"EnhancedPredictionEngine failed for karma_reset: {e}")

    zodiac = chart_data.get('zodiac_sign', 'Unknown')

    return {
        'category': 'karma_reset',
        'title': 'Your Karma Reset Plan',
        'full_analysis': f"As a {zodiac} native, your karma reset analysis requires the enhanced wisdom engine.",
        'metadata': {
            'zodiac_sign': zodiac,
            'ai_model': 'minimal_fallback',
            'fallback_mode': True
        },
        'generated_at': datetime.utcnow().isoformat()
    }


def fallback_relationships(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for relationships - uses EnhancedPredictionEngine for unique content"""
    engine = _get_enhanced_engine()
    if engine:
        try:
            return engine.generate('relationships', chart_data)
        except Exception as e:
            logger.warning(f"EnhancedPredictionEngine failed for relationships: {e}")

    zodiac = chart_data.get('zodiac_sign', 'Unknown')

    return {
        'category': 'relationships',
        'title': 'Your Relationships & Soul Connections',
        'full_analysis': f"As a {zodiac} native, your relationships analysis requires the enhanced wisdom engine.",
        'metadata': {
            'zodiac_sign': zodiac,
            'ai_model': 'minimal_fallback',
            'fallback_mode': True
        },
        'generated_at': datetime.utcnow().isoformat()
    }


def fallback_predictions(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for predictions - uses EnhancedPredictionEngine for unique content"""
    engine = _get_enhanced_engine()
    if engine:
        try:
            return engine.generate('predictions', chart_data)
        except Exception as e:
            logger.warning(f"EnhancedPredictionEngine failed for predictions: {e}")

    zodiac = chart_data.get('zodiac_sign', 'Unknown')

    return {
        'category': 'predictions',
        'title': 'Your General Predictions',
        'full_analysis': f"As a {zodiac} native, your predictions analysis requires the enhanced wisdom engine.",
        'metadata': {
            'zodiac_sign': zodiac,
            'ai_model': 'minimal_fallback',
            'fallback_mode': True
        },
        'generated_at': datetime.utcnow().isoformat()
    }


# Export all functions
__all__ = [
    'format_soul_purpose',
    'format_karmic_debts',
    'format_mantras',
    'format_gemstones',
    'format_yantras',
    'format_charity',
    'format_rituals',
    'format_lifestyle',
    'format_life_events',
    'format_dharmic_path',
    'fallback_soul_purpose',
    'fallback_karmic_journey',
    'fallback_past_lives',
    'fallback_future_lives',
    'fallback_present_life',
    'fallback_life_events',
    'fallback_karmic_remedies',
    'fallback_karma_reset',
    'fallback_relationships',
    'fallback_predictions'
]

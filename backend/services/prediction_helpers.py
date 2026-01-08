"""
Prediction Helpers
Helper functions for formatting and fallback predictions
"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


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
    """Complete fallback for karmic journey"""
    zodiac = chart_data.get('zodiac_sign', 'Unknown')

    return {
        'engine': 'karmic_journey',
        'title': 'Your Karmic Journey',
        'success': True,
        'mode': 'offline_fallback',
        'subcategories': {
            'soul_purpose': fallback_soul_purpose(chart_data),
            'karmic_lessons': {
                'title': 'Karmic Lessons',
                'content': '## Karmic Lessons\n\nYour primary karmic lessons include developing patience, cultivating compassion, and balancing material with spiritual pursuits.'
            },
            'soul_evolution': {
                'title': 'Soul Evolution',
                'content': '## Soul Evolution\n\nYou are at an intermediate stage of soul development, progressing toward higher consciousness.'
            },
            'dharmic_path': {
                'title': 'Dharmic Path',
                'content': '## Dharmic Path\n\nYour dharmic path involves fulfilling family duties while pursuing spiritual growth.'
            },
            'karmic_debts': {
                'title': 'Karmic Debts',
                'content': '## Karmic Debts\n\nFocus on service to others and regular spiritual practice to clear karmic obligations.'
            },
            'soul_group_connections': {
                'title': 'Soul Group Connections',
                'content': '## Soul Group Connections\n\nYou will meet soul family members who support your growth and evolution.'
            }
        }
    }


def fallback_past_lives(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for past lives"""
    return {
        'engine': 'past_lives',
        'title': 'Past Lives Analysis',
        'success': True,
        'mode': 'offline_fallback',
        'subcategories': {
            'recent_past_life': {
                'title': 'Recent Past Life',
                'content': '## Most Recent Past Life\n\nYour most recent incarnation was likely in the 18th-19th century, carrying forward unresolved lessons into this life.'
            },
            'era_location': {
                'title': 'Era and Location',
                'content': '## Era and Location\n\nBased on planetary positions, past incarnations span multiple cultures and time periods.'
            },
            'karmic_patterns': {
                'title': 'Karmic Patterns',
                'content': '## Karmic Patterns\n\nRecurring patterns include relationship dynamics and professional challenges requiring resolution.'
            },
            'carried_talents': {
                'title': 'Carried Talents',
                'content': '## Talents from Past Lives\n\nYou carry natural abilities in communication, healing, or creative expression from previous incarnations.'
            }
        }
    }


def fallback_future_lives(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for future lives"""
    return {
        'engine': 'future_lives',
        'title': 'Future Lives Prediction',
        'success': True,
        'mode': 'offline_fallback',
        'subcategories': {
            'next_incarnation': {
                'title': 'Next Incarnation',
                'content': '## Next Incarnation\n\nYour next incarnation will build upon lessons learned in this life, with opportunities for accelerated spiritual growth.'
            },
            'evolution_trajectory': {
                'title': 'Evolution Trajectory',
                'content': '## Soul Evolution Trajectory\n\nYou are on a progressive path toward liberation, estimated 7-12 incarnations remaining.'
            },
            'moksha_timeline': {
                'title': 'Moksha Timeline',
                'content': '## Path to Liberation\n\nThrough dedicated spiritual practice, moksha is achievable within the current cosmic cycle.'
            }
        }
    }


def fallback_present_life(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for present life"""
    return {
        'engine': 'present_life',
        'title': 'Present Life Analysis',
        'success': True,
        'mode': 'offline_fallback',
        'subcategories': {
            'current_phase': {
                'title': 'Current Life Phase',
                'content': '## Current Life Phase\n\nYou are in a period of growth and consolidation, building foundations for future success.'
            },
            'current_challenges': {
                'title': 'Current Challenges',
                'content': '## Current Challenges\n\nChallenges include balancing responsibilities and finding time for personal growth.'
            },
            'current_gifts': {
                'title': 'Current Gifts',
                'content': '## Current Gifts\n\nYour natural gifts include intuition, communication skills, and the ability to help others.'
            }
        }
    }


def fallback_life_events(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for life events"""
    return {
        'engine': 'life_events',
        'title': 'Life Events Timing',
        'success': True,
        'mode': 'offline_fallback',
        'subcategories': {
            'marriage_timing': {
                'title': 'Marriage Timing',
                'content': '## Marriage Timing\n\nFavorable periods for marriage occur during Venus and Jupiter dasha periods.'
            },
            'career_events': {
                'title': 'Career Events',
                'content': '## Career Events\n\nCareer advancement likely during Sun, Jupiter, and Saturn dasha periods.'
            },
            'wealth_events': {
                'title': 'Wealth Events',
                'content': '## Wealth Events\n\nFinancial gains indicated during Jupiter, Venus, and Mercury periods.'
            }
        }
    }


def fallback_karmic_remedies(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for karmic remedies"""
    return {
        'engine': 'karmic_remedies',
        'title': 'Karmic Remedies',
        'success': True,
        'mode': 'offline_fallback',
        'subcategories': {
            'mantras': {
                'title': 'Mantras',
                'content': '## Mantras\n\nChant Gayatri Mantra 108 times daily for overall spiritual protection and growth.'
            },
            'daily_practices': {
                'title': 'Daily Practices',
                'content': '## Daily Practices\n\nMeditation, Surya Namaskar, and gratitude practice recommended daily.'
            },
            'charity': {
                'title': 'Charitable Activities',
                'content': '## Charity\n\nRegular donations on Saturdays help clear karmic debts.'
            }
        }
    }


def fallback_relationships(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for relationships"""
    return {
        'engine': 'relationships',
        'title': 'Relationships Analysis',
        'success': True,
        'mode': 'offline_fallback',
        'subcategories': {
            'romantic_relationships': {
                'title': 'Romantic Relationships',
                'content': '## Romantic Relationships\n\nYou seek deep, meaningful connections based on mutual respect and growth.'
            },
            'marriage_karma': {
                'title': 'Marriage Karma',
                'content': '## Marriage Karma\n\nMarriage represents a significant karmic contract for mutual evolution.'
            },
            'family_relationships': {
                'title': 'Family Relationships',
                'content': '## Family Relationships\n\nFamily relationships provide opportunities for karmic healing and growth.'
            }
        }
    }


def fallback_predictions(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for predictions"""
    today = datetime.now()

    return {
        'engine': 'predictions',
        'title': 'Astrological Predictions',
        'success': True,
        'mode': 'offline_fallback',
        'subcategories': {
            'daily': {
                'title': 'Daily Prediction',
                'content': f'## Daily Forecast ({today.strftime("%B %d, %Y")})\n\nToday favors meditation, communication, and completing pending tasks. Avoid conflicts and practice patience.'
            },
            'weekly': {
                'title': 'Weekly Prediction',
                'content': '## Weekly Forecast\n\nThis week brings opportunities for personal growth and professional advancement. Mid-week is most favorable.'
            },
            'monthly': {
                'title': 'Monthly Prediction',
                'content': f'## Monthly Forecast ({today.strftime("%B %Y")})\n\nThis month emphasizes relationship harmony and career focus. Financial matters improve in the second half.'
            },
            'yearly': {
                'title': 'Yearly Prediction',
                'content': f'## Yearly Forecast ({today.year})\n\nThis year offers significant growth opportunities in career and personal development. Stay focused on goals.'
            }
        }
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
    'fallback_relationships',
    'fallback_predictions'
]

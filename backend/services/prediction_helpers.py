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
    """Complete fallback for karmic journey - matches bhrigu_predictions structure"""
    zodiac = chart_data.get('zodiac_sign', 'Unknown')
    nakshatra = chart_data.get('nakshatra', 'Unknown')

    # Build section content
    soul_purpose_content = f"""As a {zodiac} native with {nakshatra} nakshatra, your soul has incarnated with a specific mission in this lifetime.

Your primary soul purpose is spiritual evolution through practical life experiences. Every challenge and opportunity serves your growth.

**Key Themes:**
- Learning patience and perseverance
- Developing compassion and wisdom
- Serving others while fulfilling personal goals
- Balancing material and spiritual pursuits"""

    karmic_blueprint_content = """The planetary alignments at your birth reveal karmic patterns from past lives. Your current challenges are opportunities to resolve these patterns and achieve spiritual growth.

**Karmic Influences:**
- Past-life tendencies influencing current behavior
- Soul contracts with family and close relationships
- Unresolved lessons requiring attention"""

    evolution_stage_content = """You are at an intermediate stage of soul development, progressing steadily toward higher consciousness. Your current incarnation represents significant progress on the path to liberation.

**Evolution Indicators:**
- Awareness of spiritual principles
- Capacity for self-reflection and growth
- Recognition of karmic patterns"""

    life_mission_content = f"""Your dharmic path as a {zodiac} native involves fulfilling family duties while pursuing spiritual growth. Balance worldly responsibilities with inner development.

**Mission Elements:**
- Service to family and community
- Professional excellence with integrity
- Spiritual practice and self-study"""

    karmic_lessons_content = """Your primary karmic lessons include developing patience, cultivating compassion, and balancing material with spiritual pursuits. Each challenge offers opportunity for growth.

**Core Lessons:**
- Patience in face of delays and obstacles
- Compassion toward self and others
- Detachment from material outcomes"""

    soul_connections_content = """You will meet soul family members who support your growth and evolution. These connections are karmic and serve your mutual development.

**Connection Signs:**
- Immediate sense of familiarity
- Shared values and spiritual interests
- Mutual support and understanding"""

    timing_content = """Major karmic activations occur during planetary dasha periods, particularly Jupiter, Saturn, Rahu, and Ketu dashas. These periods bring lessons and opportunities for growth.

**Key Periods:**
- Jupiter periods: Expansion and wisdom
- Saturn periods: Discipline and maturity
- Rahu/Ketu periods: Karmic resolution"""

    spiritual_gifts_content = """You carry innate spiritual gifts from past lives. Trust your intuition and develop these natural abilities through regular practice.

**Natural Abilities:**
- Intuitive understanding of spiritual principles
- Capacity for deep meditation
- Natural healing or teaching abilities"""

    # Compile full analysis
    full_analysis = f"""## Soul's Primary Purpose
{soul_purpose_content}

## Karmic Blueprint
{karmic_blueprint_content}

## Soul Evolution Stage
{evolution_stage_content}

## Life Mission & Dharma
{life_mission_content}

## Karmic Lessons in This Lifetime
{karmic_lessons_content}

## Soul Group Connections
{soul_connections_content}

## Timing of Karmic Events
{timing_content}

## Spiritual Gifts & Abilities
{spiritual_gifts_content}"""

    return {
        'category': 'karmic_journey',
        'title': 'Your Karmic Journey & Soul Purpose',
        'full_analysis': full_analysis,
        'soul_purpose': soul_purpose_content,
        'karmic_blueprint': karmic_blueprint_content,
        'evolution_stage': evolution_stage_content,
        'life_mission': life_mission_content,
        'karmic_lessons': karmic_lessons_content,
        'soul_connections': soul_connections_content,
        'timing': timing_content,
        'spiritual_gifts': spiritual_gifts_content,
        'metadata': {
            'zodiac_sign': zodiac,
            'nakshatra': nakshatra,
            'ai_model': 'offline_fallback',
            'corpus_available': False,
            'tradition': 'Bhrigu Samhita & Nadi Jyotisa',
            'fallback_mode': True
        },
        'generated_at': datetime.utcnow().isoformat()
    }


def fallback_past_lives(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for past lives - matches bhrigu_predictions structure"""
    zodiac = chart_data.get('zodiac_sign', 'Unknown')
    nakshatra = chart_data.get('nakshatra', 'Unknown')

    recent_life = """Your most recent incarnation was likely in the 18th-19th century, carrying forward unresolved lessons into this life. The soul memories influence your current inclinations and fears."""

    significant_lives = """Based on planetary positions, past incarnations span multiple cultures and time periods. Each life contributed specific lessons and abilities to your current incarnation."""

    karmic_patterns = """Recurring patterns include relationship dynamics and professional challenges requiring resolution. These patterns repeat until the underlying lesson is mastered."""

    past_skills = """You carry natural abilities in communication, healing, or creative expression from previous incarnations. These talents feel innate because they were developed over multiple lifetimes."""

    traumas_healing = """Past-life traumas may create current fears or blocks. Healing practices include meditation, energy work, and conscious awareness of these patterns."""

    past_relationships = """Key relationships in your current life are karmic connections from previous incarnations. You've reunited to complete unfinished business and support mutual growth."""

    karmic_debts = """Karmic debts from past lives manifest as current life challenges and obligations. Service, forgiveness, and spiritual practice help clear these debts."""

    spiritual_progress = """Your spiritual journey spans many lifetimes. Previous incarnations involved spiritual practices and service, contributing to your current level of awareness."""

    full_analysis = f"""## Most Recent Past Life (Previous Incarnation)
{recent_life}

## Significant Past Lives (3-5 Major Incarnations)
{significant_lives}

## Recurring Karmic Patterns
{karmic_patterns}

## Past Life Skills & Talents
{past_skills}

## Past Life Traumas Needing Healing
{traumas_healing}

## Past Life Relationships in Current Life
{past_relationships}

## Karmic Debts from Past Lives
{karmic_debts}

## Past Life Spiritual Progress
{spiritual_progress}"""

    return {
        'category': 'past_lives',
        'title': 'Your Past Lives & Karmic Patterns',
        'full_analysis': full_analysis,
        'recent_life': recent_life,
        'significant_lives': significant_lives,
        'karmic_patterns': karmic_patterns,
        'past_skills': past_skills,
        'traumas_healing': traumas_healing,
        'past_relationships': past_relationships,
        'karmic_debts': karmic_debts,
        'spiritual_progress': spiritual_progress,
        'metadata': {
            'zodiac_sign': zodiac,
            'nakshatra': nakshatra,
            'ai_model': 'offline_fallback',
            'corpus_available': False,
            'tradition': 'Bhrigu Samhita & Nadi Jyotisa',
            'fallback_mode': True
        },
        'generated_at': datetime.utcnow().isoformat()
    }


def fallback_future_lives(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for future lives - matches bhrigu_predictions structure"""
    zodiac = chart_data.get('zodiac_sign', 'Unknown')
    nakshatra = chart_data.get('nakshatra', 'Unknown')

    next_incarnation = """Your next incarnation will build upon lessons learned in this life, with opportunities for accelerated spiritual growth. The soul will carry forward wisdom gained in this lifetime."""

    evolution_trajectory = """You are on a progressive path toward liberation, estimated 7-12 incarnations remaining. Each life brings deeper understanding and closer alignment with divine consciousness."""

    final_birth_conditions = """Liberation potential exists if you deepen spiritual practice and complete karmic obligations. The final births focus primarily on service and spiritual teaching."""

    future_scenarios = """Your future incarnations depend on current choices. Spiritual focus leads to higher realms and accelerated evolution. Material focus extends the karmic cycle."""

    moksha_timeline = """Through dedicated spiritual practice, moksha is achievable within the current cosmic cycle. Daily meditation, selfless service, and scriptural study accelerate liberation."""

    higher_realms = """Based on current spiritual development, you have access to higher realms between incarnations. Continued practice increases vibrational frequency and realm accessibility."""

    bodhisattva_path = """You have potential to return as a spiritual teacher or guide after achieving liberation. Compassion for suffering beings may draw you back for service incarnations."""

    ultimate_destiny = """Your soul's ultimate destiny is reunion with divine source consciousness. The journey involves progressive refinement through learning, service, and spiritual practice."""

    full_analysis = f"""## Next Immediate Incarnation
{next_incarnation}

## Soul Evolution Trajectory (Next 3-5 Lives)
{evolution_trajectory}

## Conditions for This Being the Final Birth
{final_birth_conditions}

## Future Life Scenarios Based on Current Actions
{future_scenarios}

## Moksha Timeline & Preparation
{moksha_timeline}

## Higher Realms Accessibility
{higher_realms}

## Bodhisattva Path Potential
{bodhisattva_path}

## Soul's Ultimate Destiny
{ultimate_destiny}"""

    return {
        'category': 'future_lives',
        'title': 'Your Future Lives & Soul Evolution',
        'full_analysis': full_analysis,
        'next_incarnation': next_incarnation,
        'evolution_trajectory': evolution_trajectory,
        'final_birth_conditions': final_birth_conditions,
        'future_scenarios': future_scenarios,
        'moksha_timeline': moksha_timeline,
        'higher_realms': higher_realms,
        'bodhisattva_path': bodhisattva_path,
        'ultimate_destiny': ultimate_destiny,
        'metadata': {
            'zodiac_sign': zodiac,
            'nakshatra': nakshatra,
            'ai_model': 'offline_fallback',
            'corpus_available': False,
            'tradition': 'Bhrigu Samhita & Nadi Jyotisa',
            'fallback_mode': True
        },
        'generated_at': datetime.utcnow().isoformat()
    }


def fallback_present_life(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for present life - matches bhrigu_predictions structure"""
    zodiac = chart_data.get('zodiac_sign', 'Unknown')

    current_phase = """You are in a period of growth and consolidation, building foundations for future success. This phase focuses on practical development and skill mastery."""

    career = """Your career path aligns with your natural talents. Focus on consistent effort and skill development for professional advancement."""

    relationships = """Relationship dynamics require balance between independence and partnership. Open communication strengthens bonds."""

    health = """Maintain health through regular exercise, balanced diet, and stress management. Prevention is key."""

    finances = """Financial stability comes through disciplined saving and wise investments. Avoid impulsive spending."""

    spiritual_growth = """Spiritual growth accelerates through daily meditation and self-reflection. Inner peace manifests outer harmony."""

    education = """Continuous learning enhances professional and personal growth. Pursue courses aligned with your goals."""

    life_purpose = """Align daily actions with your higher purpose. Service to others while fulfilling personal goals creates fulfillment."""

    challenges = """Current challenges include balancing responsibilities and finding time for personal growth. These strengthen character."""

    timing = """Favorable periods occur during beneficial planetary transits. Use these windows for important initiatives."""

    full_analysis = f"""## Current Life Phase & Karmic Context
{current_phase}

## Career & Professional Path
{career}

## Relationships & Partnerships
{relationships}

## Health & Wellbeing
{health}

## Financial Prospects
{finances}

## Spiritual Growth Opportunities
{spiritual_growth}

## Education & Skill Development
{education}

## Life Purpose Alignment
{life_purpose}

## Challenges & Lessons
{challenges}

## Key Timing & Transits
{timing}"""

    return {
        'category': 'present_life',
        'title': 'Your Present Life Comprehensive Analysis',
        'full_analysis': full_analysis,
        'current_phase': current_phase,
        'career': career,
        'relationships': relationships,
        'health': health,
        'finances': finances,
        'spiritual_growth': spiritual_growth,
        'education': education,
        'life_purpose': life_purpose,
        'challenges': challenges,
        'timing': timing,
        'metadata': {
            'zodiac_sign': zodiac,
            'ai_model': 'offline_fallback',
            'corpus_available': False,
            'tradition': 'Bhrigu Samhita & Nadi Jyotisa',
            'fallback_mode': True
        },
        'generated_at': datetime.utcnow().isoformat()
    }


def fallback_life_events(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for life events - matches bhrigu_predictions structure"""
    zodiac = chart_data.get('zodiac_sign', 'Unknown')

    yearly_forecast = """Year-by-year forecast shows progressive growth with key turning points during major dasha transitions."""
    marriage_timing = """Favorable periods for marriage occur during Venus and Jupiter dasha periods. Look for opportunities during these windows."""
    career_milestones = """Career advancement likely during Sun, Jupiter, and Saturn dasha periods. Prepare for leadership opportunities."""
    children_family = """Family expansion favored during Jupiter's influence. Plan accordingly for optimal timing."""
    financial_events = """Financial gains indicated during Jupiter, Venus, and Mercury periods. Strategic investments yield returns."""
    health_alerts = """Health requires attention during Saturn transits. Maintain preventive care and healthy lifestyle."""
    spiritual_milestones = """Spiritual breakthroughs occur during Ketu periods. Deepen practice for maximum benefit."""
    relocations = """Relocation opportunities arise during Rahu transits. Consider changes for growth."""
    education = """Educational pursuits favored during Mercury and Jupiter dashas. Pursue higher learning during these periods."""
    favorable_periods = """Jupiter and Venus dashas bring overall favorable conditions. Maximize opportunities during these times."""
    challenging_periods = """Saturn and Rahu dashas bring tests and lessons. Approach with patience and spiritual practice."""
    transits = """Major transits of Jupiter and Saturn significantly impact life direction. Plan important decisions accordingly."""
    age_milestones = """Key ages include 28, 36, 42, and 49 - Saturn return cycles bringing major life shifts."""

    full_analysis = f"""## Year-by-Year Forecast
{yearly_forecast}

## Marriage & Partnerships
{marriage_timing}

## Career Milestones
{career_milestones}

## Children & Family
{children_family}

## Financial Breakthroughs
{financial_events}

## Health Alerts
{health_alerts}

## Spiritual Milestones
{spiritual_milestones}

## Relocations & Travel
{relocations}

## Education & Skill Development
{education}

## Favorable Dasha Periods
{favorable_periods}

## Challenging Periods
{challenging_periods}

## Critical Transit Events
{transits}

## Specific Age Milestones
{age_milestones}"""

    return {
        'category': 'life_events',
        'title': 'Your Life Events with Precision Timing',
        'full_analysis': full_analysis,
        'yearly_forecast': yearly_forecast,
        'marriage_timing': marriage_timing,
        'career_milestones': career_milestones,
        'children_family': children_family,
        'financial_events': financial_events,
        'health_alerts': health_alerts,
        'spiritual_milestones': spiritual_milestones,
        'relocations': relocations,
        'education': education,
        'favorable_periods': favorable_periods,
        'challenging_periods': challenging_periods,
        'transits': transits,
        'age_milestones': age_milestones,
        'metadata': {
            'zodiac_sign': zodiac,
            'ai_model': 'offline_fallback',
            'corpus_available': False,
            'tradition': 'Bhrigu Samhita & Nadi Jyotisa',
            'fallback_mode': True
        },
        'generated_at': datetime.utcnow().isoformat()
    }


def fallback_karmic_remedies(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for karmic remedies - matches bhrigu_predictions structure"""
    zodiac = chart_data.get('zodiac_sign', 'Unknown')

    mantras = """**Gayatri Mantra**: Chant 108 times daily for overall spiritual protection and growth. Best time: sunrise.

**Om Namah Shivaya**: 108 repetitions for removing obstacles. Chant on Mondays.

**Om Namo Narayanaya**: For peace and prosperity. 108 times during morning prayers."""

    gemstones = """**Primary Stone**: Based on ascendant lord. Wear 3-5 carats in appropriate metal on prescribed finger after proper energization."""

    yantras = """**Sri Yantra**: For overall prosperity and spiritual growth. Worship daily with offerings.

**Navagraha Yantra**: To balance planetary energies. Place in puja room."""

    charitable_activities = """**Saturday Donations**: Feed the needy to appease Saturn. Donate black items, iron, or oil.

**Thursday Charity**: Offer yellow items, books, or sweets to appease Jupiter."""

    fasting = """**Ekadashi Fasting**: Fast twice monthly for spiritual purification.

**Planetary Fasts**: Saturday for Saturn, Thursday for Jupiter. Observe with devotion."""

    deity_worship = """**Primary Deity**: Based on your chart. Worship with daily prayers and offerings.

**Ishta Devata**: Personalized deity worship deepens spiritual connection."""

    pilgrimage = """**Sacred Sites**: Visit temples aligned with your planetary needs. Char Dham yatra brings blessings.

**Timing**: Undertake during favorable dasha periods."""

    lifestyle = """**Daily Routine**: Wake early, meditate, exercise. Maintain vegetarian diet for spiritual clarity.

**Behavioral Practices**: Practice non-violence, truthfulness, and compassion in daily life."""

    planetary_rituals = """**Graha Shanti**: Perform planetary peace rituals to mitigate afflictions.

**Homam**: Fire rituals for specific planetary appeasement. Consult priest for proper procedure."""

    karmic_cleansing = """**Forgiveness Practice**: Release grudges and resentments. Forgive self and others.

**Meditation**: Daily practice clears karmic residue and brings peace."""

    service = """**Seva**: Regular service to community and needy. This balances karma effectively.

**Teaching**: Share knowledge and wisdom. Service through education is highly meritorious."""

    meditation = """**Daily Meditation**: 20-30 minutes morning and evening. Focus on breath or mantra.

**Vipassana**: Annual 10-day retreat for deep cleansing and insight."""

    full_analysis = f"""## Mantras
{mantras}

## Gemstones
{gemstones}

## Yantras & Sacred Geometry
{yantras}

## Charitable Activities (Dana)
{charitable_activities}

## Fasting & Austerities
{fasting}

## Deity Worship & Prayers
{deity_worship}

## Pilgrimage & Sacred Sites
{pilgrimage}

## Lifestyle Modifications
{lifestyle}

## Planetary Rituals
{planetary_rituals}

## Karmic Cleansing Practices
{karmic_cleansing}

## Seva & Service
{service}

## Meditation & Inner Practices
{meditation}"""

    return {
        'category': 'karmic_remedies',
        'title': 'Your Personalized Karmic Remedies',
        'full_analysis': full_analysis,
        'mantras': mantras,
        'gemstones': gemstones,
        'yantras': yantras,
        'charitable_activities': charitable_activities,
        'fasting': fasting,
        'deity_worship': deity_worship,
        'pilgrimage': pilgrimage,
        'lifestyle': lifestyle,
        'planetary_rituals': planetary_rituals,
        'karmic_cleansing': karmic_cleansing,
        'service': service,
        'meditation': meditation,
        'metadata': {
            'zodiac_sign': zodiac,
            'ai_model': 'offline_fallback',
            'corpus_available': False,
            'tradition': 'Bhrigu Samhita & Nadi Jyotisa',
            'fallback_mode': True
        },
        'generated_at': datetime.utcnow().isoformat()
    }


def fallback_relationships(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for relationships - matches bhrigu_predictions structure"""
    zodiac = chart_data.get('zodiac_sign', 'Unknown')

    romantic_marriage = """You seek deep, meaningful connections based on mutual respect and growth. Marriage represents a significant karmic contract for mutual evolution."""

    family = """Family relationships provide opportunities for karmic healing and growth. Honor family bonds while maintaining healthy boundaries."""

    soul_connections = """Soul connections feel instantly familiar. These relationships serve your spiritual evolution and mutual support."""

    friendships = """Build friendships based on shared values and mutual support. Quality matters more than quantity."""

    professional = """Professional relationships thrive on respect and clear communication. Network strategically for career growth."""

    karmic_patterns = """Recognize recurring relationship patterns. These reveal karmic lessons requiring resolution."""

    communication = """Clear, compassionate communication strengthens all relationships. Practice active listening and honest expression."""

    timing = """Relationship milestones align with Venus and Jupiter transits. Use favorable periods for commitments."""

    healing = """Heal relationship wounds through forgiveness and self-awareness. Energy work and therapy support healing."""

    healthy_practices = """Daily practices for harmony include gratitude, quality time, and maintaining individuality while partnering."""

    full_analysis = f"""## Romantic Relationships & Marriage
{romantic_marriage}

## Family Dynamics
{family}

## Soul Connections
{soul_connections}

## Friendships & Community
{friendships}

## Professional Relationships
{professional}

## Karmic Relationship Patterns
{karmic_patterns}

## Communication & Conflict Resolution
{communication}

## Timing for Relationship Events
{timing}

## Relationship Healing Practices
{healing}

## Healthy Relationship Practices
{healthy_practices}"""

    return {
        'category': 'relationships',
        'title': 'Your Relationships & Soul Connections',
        'full_analysis': full_analysis,
        'romantic_marriage': romantic_marriage,
        'family': family,
        'soul_connections': soul_connections,
        'friendships': friendships,
        'professional': professional,
        'karmic_patterns': karmic_patterns,
        'communication': communication,
        'timing': timing,
        'healing': healing,
        'healthy_practices': healthy_practices,
        'metadata': {
            'zodiac_sign': zodiac,
            'ai_model': 'offline_fallback',
            'corpus_available': False,
            'tradition': 'Bhrigu Samhita & Nadi Jyotisa',
            'fallback_mode': True
        },
        'generated_at': datetime.utcnow().isoformat()
    }


def fallback_predictions(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """Complete fallback for predictions - matches bhrigu_predictions structure"""
    zodiac = chart_data.get('zodiac_sign', 'Unknown')
    today = datetime.now()

    daily = f"""**Daily Forecast ({today.strftime("%B %d, %Y")})**

Today favors meditation, communication, and completing pending tasks. Avoid conflicts and practice patience. Favorable hours for important activities are morning and evening."""

    weekly = """**Weekly Forecast**

This week brings opportunities for personal growth and professional advancement. Mid-week is most favorable for important meetings and decisions. Weekend supports rest and spiritual practice."""

    monthly = f"""**Monthly Forecast ({today.strftime("%B %Y")})**

This month emphasizes relationship harmony and career focus. Financial matters improve in the second half. Schedule important activities during favorable lunar phases."""

    yearly = f"""**Yearly Forecast ({today.year})**

This year offers significant growth opportunities in career and personal development. Stay focused on goals while maintaining work-life balance. Major breakthroughs expected mid-year."""

    full_analysis = f"""## Daily Forecast
{daily}

## Weekly Forecast
{weekly}

## Monthly Forecast
{monthly}

## Yearly Forecast
{yearly}"""

    return {
        'category': 'predictions',
        'title': 'Your General Predictions',
        'full_analysis': full_analysis,
        'daily': daily,
        'weekly': weekly,
        'monthly': monthly,
        'yearly': yearly,
        'metadata': {
            'zodiac_sign': zodiac,
            'ai_model': 'offline_fallback',
            'corpus_available': False,
            'tradition': 'Bhrigu Samhita & Nadi Jyotisa',
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
    'fallback_relationships',
    'fallback_predictions'
]

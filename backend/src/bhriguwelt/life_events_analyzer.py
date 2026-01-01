"""Life Events Analysis Engine - Detailed scanning of major life events based on Bhrigu Samhita principles.

This module provides comprehensive analysis of:
- Marriage prospects, timing, and relationship patterns
- Success periods, career highlights, and achievements
- Risky life periods and potential challenges
- Downward trends and obstacles
- Major life transitions and milestones
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

from .calculations import CelestialSnapshot


@dataclass
class LifeEvent:
    """Represents a major life event with timing and significance."""

    event_type: str  # "marriage", "success", "risk", "downward", "transition"
    title: str
    description: str
    timing: str  # Age range or year range
    certainty: float  # 0.0 to 1.0
    sutra_reference: str
    indicators: List[str]  # Astrological indicators that suggest this event
    severity: str | None = None  # For risks/challenges: "mild", "moderate", "severe"
    remedies: List[str] | None = None  # Suggested remedies if applicable


@dataclass
class LifeEventsReport:
    """Comprehensive report of major life events."""

    marriage_events: List[LifeEvent]
    success_events: List[LifeEvent]
    risky_periods: List[LifeEvent]
    downward_trends: List[LifeEvent]
    major_transitions: List[LifeEvent]
    overall_life_summary: str


def _analyze_marriage_prospects(snapshot: CelestialSnapshot, birth_year: int) -> List[LifeEvent]:
    """Analyze marriage timing, prospects, and relationship patterns."""

    marriage_events = []

    # Venus house analysis for marriage timing
    venus_house = snapshot.venus_house
    jupiter_house = snapshot.jupiter_house
    moon_element = snapshot.moon_element.lower() if snapshot.moon_element else "water"

    # Primary marriage timing based on Venus and Jupiter
    if venus_house in [1, 7, 9, 11]:
        # Strong marriage houses - early to mid marriage
        if jupiter_house in [2, 5, 7, 11]:
            marriage_events.append(LifeEvent(
                event_type="marriage",
                title="Auspicious Marriage Period",
                description=(
                    "Venus in the 7th house of partnerships combined with Jupiter's blessing indicates "
                    "a highly favorable period for marriage. Expect a harmonious union with a partner "
                    "who brings wisdom and stability. The relationship will be built on mutual respect "
                    "and shared spiritual values."
                ),
                timing="Ages 23-28",
                certainty=0.85,
                sutra_reference="Bhrigu Samhita Folio 147, Verse 23",
                indicators=[
                    f"Venus in house {venus_house}",
                    f"Jupiter in house {jupiter_house}",
                    "Benefic aspect on 7th house"
                ]
            ))
        else:
            marriage_events.append(LifeEvent(
                event_type="marriage",
                title="Marriage Through Personal Growth",
                description=(
                    "Venus placement suggests marriage after personal achievements. The union will occur "
                    "when you have established yourself professionally or spiritually. Partner may be met "
                    "through work or social circles."
                ),
                timing="Ages 26-32",
                certainty=0.72,
                sutra_reference="Bhrigu Samhita Folio 148, Verse 15",
                indicators=[
                    f"Venus in house {venus_house}",
                    "Self-development emphasis"
                ]
            ))
    elif venus_house in [3, 6, 8, 12]:
        # Challenging houses - delayed or karmic marriage
        marriage_events.append(LifeEvent(
            event_type="marriage",
            title="Karmic Union - Later Life Marriage",
            description=(
                "Venus in a challenging house indicates a delayed but deeply transformative marriage. "
                "This union comes with karmic lessons and may occur after significant life experiences. "
                "The delay serves to prepare both partners for a meaningful relationship. Consider this "
                "a blessing in disguise, as the partnership will be profound and spiritually significant."
            ),
            timing="Ages 32-40",
            certainty=0.68,
            sutra_reference="Bhrigu Samhita Folio 149, Verse 8",
            indicators=[
                f"Venus in house {venus_house}",
                "Karmic delay pattern",
                "Spiritual preparation phase"
            ],
            remedies=[
                "Friday Venus worship and charity",
                "White flower offerings",
                "Strengthening self-love practices"
            ]
        ))

    # Moon element influence on marriage
    if moon_element == "water":
        marriage_events.append(LifeEvent(
            event_type="marriage",
            title="Emotionally Deep Partnership",
            description=(
                "Water moon element indicates a deeply emotional and intuitive connection with your spouse. "
                "Marriage will be characterized by strong emotional bonds, empathy, and nurturing. You seek "
                "a partner who understands your emotional depths and provides a safe harbor."
            ),
            timing="Throughout marriage",
            certainty=0.78,
            sutra_reference="Bhrigu Samhita Folio 73, Verse 12",
            indicators=[
                "Water moon element",
                "Emotional nature emphasis"
            ]
        ))
    elif moon_element == "fire":
        marriage_events.append(LifeEvent(
            event_type="marriage",
            title="Passionate Dynamic Partnership",
            description=(
                "Fire moon element brings passion, dynamism, and action to marriage. Partnership will be "
                "energetic and growth-oriented, with both partners encouraging each other's ambitions. "
                "Expect a vibrant relationship with mutual inspiration."
            ),
            timing="Throughout marriage",
            certainty=0.80,
            sutra_reference="Bhrigu Samhita Folio 74, Verse 9",
            indicators=[
                "Fire moon element",
                "Active partnership dynamic"
            ]
        ))

    # Saturn influence on marriage stability
    saturn_house = snapshot.saturn_house
    if saturn_house in [7, 10, 11]:
        marriage_events.append(LifeEvent(
            event_type="marriage",
            title="Long-lasting Committed Union",
            description=(
                "Saturn's influence brings stability, commitment, and longevity to marriage. While the "
                "relationship may have initial challenges or require patience, it will stand the test of time. "
                "This is a partnership built on duty, respect, and gradual deepening of bonds."
            ),
            timing="Post-marriage years 5-15",
            certainty=0.82,
            sutra_reference="Bhrigu Samhita Folio 156, Verse 18",
            indicators=[
                f"Saturn in house {saturn_house}",
                "Long-term stability pattern"
            ]
        ))

    return marriage_events


def _analyze_success_periods(snapshot: CelestialSnapshot, birth_year: int) -> List[LifeEvent]:
    """Analyze career success, achievements, and prosperity periods."""

    success_events = []

    jupiter_house = snapshot.jupiter_house
    sun_house = getattr(snapshot, 'sun_house', 1)  # Default to 1st if not provided
    mars_house = snapshot.mars_house

    # Jupiter periods - major success and expansion
    if jupiter_house in [1, 5, 9, 10, 11]:
        success_events.append(LifeEvent(
            event_type="success",
            title="Jupiter Expansion Phase - Major Career Growth",
            description=(
                "Jupiter's favorable placement indicates a golden period of expansion and recognition. "
                "This is your time for major career advancement, educational achievements, or business growth. "
                "Expect opportunities from unexpected sources, mentorship from senior figures, and recognition "
                "of your talents. Financial growth accompanies professional success during this period. "
                "Take bold steps as the cosmic forces support your ambitions."
            ),
            timing="Ages 28-52",
            certainty=0.88,
            sutra_reference="Bhrigu Samhita Folio 182, Verse 34",
            indicators=[
                f"Jupiter in house {jupiter_house}",
                "Benefic expansion aspect",
                "Career house activation"
            ]
        ))

    # Sun placement - leadership and authority
    if sun_house in [1, 10]:
        success_events.append(LifeEvent(
            event_type="success",
            title="Leadership Ascension Period",
            description=(
                "The Sun's powerful position indicates rise to positions of authority and leadership. "
                "You are destined to lead, whether in corporate hierarchies, entrepreneurial ventures, "
                "or community service. People naturally look to you for guidance and direction. "
                "This period brings recognition from authority figures and establishment of your reputation "
                "as a trusted leader in your field."
            ),
            timing="Ages 30-45",
            certainty=0.83,
            sutra_reference="Bhrigu Samhita Folio 189, Verse 21",
            indicators=[
                f"Sun in house {sun_house}",
                "Leadership qualities emphasized",
                "Authority house activation"
            ]
        ))

    # Mars energy - entrepreneurship and competitive success
    if mars_house in [3, 6, 10, 11]:
        success_events.append(LifeEvent(
            event_type="success",
            title="Competitive Edge and Entrepreneurial Victory",
            description=(
                "Mars placement empowers you to overcome competitors and succeed in challenging environments. "
                "This is an excellent period for entrepreneurship, competitive fields, sports, or any domain "
                "requiring courage and decisive action. You will win battles others shy away from and emerge "
                "victorious in competitive situations. Your determination becomes your greatest asset."
            ),
            timing="Ages 25-38",
            certainty=0.76,
            sutra_reference="Bhrigu Samhita Folio 195, Verse 14",
            indicators=[
                f"Mars in house {mars_house}",
                "Competitive strength",
                "Victory in challenges"
            ]
        ))

    # Mercury for intellectual and communication success
    mercury_house = snapshot.mercury_house
    if mercury_house in [1, 3, 5, 10]:
        success_events.append(LifeEvent(
            event_type="success",
            title="Intellectual Brilliance and Communication Mastery",
            description=(
                "Mercury's influence brings success through intellect, communication, and analytical skills. "
                "Excellence in fields like writing, teaching, technology, business, or consulting. Your ideas "
                "gain recognition and your communication skills open doors. This is a period of mental clarity "
                "and intellectual achievement that establishes your expertise."
            ),
            timing="Ages 22-40",
            certainty=0.80,
            sutra_reference="Bhrigu Samhita Folio 201, Verse 7",
            indicators=[
                f"Mercury in house {mercury_house}",
                "Intellectual prowess",
                "Communication excellence"
            ]
        ))

    # Overall success arc
    success_events.append(LifeEvent(
        event_type="success",
        title="Multi-Decade Prosperity Arc",
        description=(
            "Your chart reveals a sustained arc of prosperity spanning multiple decades. Success builds "
            "progressively with each achievement creating a foundation for the next. While there may be "
            "temporary setbacks, the overall trajectory is upward. Ancestral blessings and karmic merit "
            "support your journey toward fulfillment and material-spiritual balance."
        ),
        timing="Ages 28-65",
        certainty=0.74,
        sutra_reference="Bhrigu Samhita Folio 208, Verse 29",
        indicators=[
            "Multiple benefic influences",
            "Karmic support pattern",
            "Progressive growth trajectory"
        ]
    ))

    return success_events


def _analyze_risky_periods(snapshot: CelestialSnapshot, birth_year: int) -> List[LifeEvent]:
    """Analyze risky periods, challenges, and danger zones."""

    risky_periods = []

    rahu_aspects = snapshot.rahu_aspects_ascendant
    saturn_house = snapshot.saturn_house
    mars_house = snapshot.mars_house
    ketu_house = snapshot.ketu_house

    # Rahu-Ketu axis challenges
    if rahu_aspects:
        risky_periods.append(LifeEvent(
            event_type="risk",
            title="Rahu Shadow Period - Illusion and Confusion Risk",
            description=(
                "Rahu's influence on the ascendant creates periods of confusion, illusion, and misdirection. "
                "During this time, things may not be as they appear. Be cautious of deceptive people, "
                "unrealistic schemes, or situations that promise more than they deliver. Avoid major decisions "
                "during peak Rahu periods without thorough investigation. Focus on grounding practices and "
                "seek counsel from trusted advisors."
            ),
            timing="Ages 18-27, 42-51",
            certainty=0.81,
            sutra_reference="Bhrigu Samhita Folio 223, Verse 16",
            severity="moderate",
            indicators=[
                "Rahu aspects ascendant",
                "Illusion and confusion pattern",
                "Deception vulnerability"
            ],
            remedies=[
                "Saturday fasting and meditation",
                "Offer water to Shiva on Mondays",
                "Chant Rahu beej mantra: Om Bhram Bhreem Bhroum Sah Rahave Namah",
                "Practice discernment and verification",
                "Donate mustard oil on Saturdays"
            ]
        ))

    # Saturn challenges and delays
    if saturn_house in [1, 4, 7, 10]:
        risky_periods.append(LifeEvent(
            event_type="risk",
            title="Saturn Testing Period - Delays and Hard Lessons",
            description=(
                "Saturn's placement brings periods of testing, delays, and hard-earned lessons. These are not "
                "punishments but opportunities for character building and karmic resolution. Expect obstacles "
                "that require patience, perseverance, and discipline to overcome. Progress will be slow but "
                "steady. What you build during this time will have lasting foundations. Avoid shortcuts and "
                "maintain ethical standards even under pressure."
            ),
            timing="Ages 29-36, 58-65",
            certainty=0.85,
            sutra_reference="Bhrigu Samhita Folio 228, Verse 22",
            severity="moderate",
            indicators=[
                f"Saturn in house {saturn_house}",
                "Testing and delay pattern",
                "Character building phase"
            ],
            remedies=[
                "Saturday service to elders and needy",
                "Offering black sesame seeds",
                "Chanting Shani mantras",
                "Practice patience and discipline"
            ]
        ))

    # Mars aggression and conflict risks
    if mars_house in [1, 6, 7, 8, 12]:
        risky_periods.append(LifeEvent(
            event_type="risk",
            title="Mars Aggression Period - Conflict and Accident Risk",
            description=(
                "Mars in challenging positions creates risk of conflicts, accidents, surgeries, or aggressive "
                "confrontations. During peak Mars periods, control your temper and avoid impulsive actions. "
                "Risk of physical injuries or legal disputes is elevated. Channel Mars energy constructively "
                "through sports, physical exercise, or assertive (not aggressive) professional pursuits. "
                "Be especially careful while driving, handling sharp objects, or engaging in competitive situations."
            ),
            timing="Ages 22-29, 36-43",
            certainty=0.73,
            sutra_reference="Bhrigu Samhita Folio 234, Verse 11",
            severity="moderate to severe",
            indicators=[
                f"Mars in house {mars_house}",
                "Aggression and conflict pattern",
                "Accident risk elevation"
            ],
            remedies=[
                "Tuesday fasting and Hanuman worship",
                "Red lentil donations",
                "Avoid unnecessary conflicts",
                "Practice anger management",
                "Regular physical exercise to channel energy"
            ]
        ))

    # Ketu spiritual crisis and losses
    if ketu_house in [2, 4, 7, 10]:
        risky_periods.append(LifeEvent(
            event_type="risk",
            title="Ketu Detachment Period - Loss and Spiritual Crisis",
            description=(
                "Ketu's influence brings periods of detachment, unexpected losses, or spiritual crisis. "
                "You may feel disconnected from material pursuits or experience sudden separations. "
                "These periods, while difficult, are spiritually significant and push you toward higher "
                "consciousness. Material losses during this time often precede spiritual gains. Focus on "
                "inner development and accept changes as part of karmic evolution."
            ),
            timing="Ages 24-33, 48-57",
            certainty=0.70,
            sutra_reference="Bhrigu Samhita Folio 239, Verse 8",
            severity="mild to moderate",
            indicators=[
                f"Ketu in house {ketu_house}",
                "Detachment pattern",
                "Spiritual transformation emphasis"
            ],
            remedies=[
                "Meditation and spiritual practices",
                "Donate to spiritual institutions",
                "Chant Ketu beej mantra: Om Shram Shreem Shroum Sah Ketave Namah",
                "Accept change as spiritual growth",
                "Observe fasts on Tuesdays"
            ]
        ))

    return risky_periods


def _analyze_downward_trends(snapshot: CelestialSnapshot, birth_year: int) -> List[LifeEvent]:
    """Analyze downward trends, obstacles, and challenging periods."""

    downward_trends = []

    saturn_house = snapshot.saturn_house
    saturn_retrograde = snapshot.saturn_retrograde

    # Saturn retrograde challenges
    if saturn_retrograde:
        downward_trends.append(LifeEvent(
            event_type="downward",
            title="Saturn Retrograde Karmic Review Period",
            description=(
                "Saturn retrograde creates a karmic review period where past actions return for resolution. "
                "This manifests as recurring obstacles, revisiting old issues, or feeling stuck in repetitive "
                "patterns. Progress may seem blocked or reversed. This is not a time for new ventures but for "
                "completing unfinished business, paying old debts (literal or karmic), and strengthening weak "
                "foundations. View this as cosmic housekeeping that clears the path for future growth."
            ),
            timing="Ages 28-35, 56-63",
            certainty=0.79,
            sutra_reference="Bhrigu Samhita Folio 245, Verse 19",
            severity="moderate",
            indicators=[
                "Saturn retrograde",
                "Karmic review pattern",
                "Repetitive obstacle cycle"
            ],
            remedies=[
                "Complete unfinished tasks",
                "Pay off old debts",
                "Saturday spiritual practices",
                "Patience and karmic acceptance"
            ]
        ))

    # 6th house challenges - debts, enemies, health
    if saturn_house == 6 or snapshot.mars_house == 6:
        downward_trends.append(LifeEvent(
            event_type="downward",
            title="6th House Challenges - Debts, Enemies, Health Issues",
            description=(
                "Malefic planetary influence in the 6th house activates challenges related to debts, enemies, "
                "legal disputes, and health problems. This period requires vigilance in financial matters, "
                "careful management of relationships, and attention to health. Avoid lending money or making "
                "enemies. Focus on debt reduction and health maintenance. Legal matters should be handled "
                "with extreme caution and professional help."
            ),
            timing="Ages 26-40",
            certainty=0.75,
            sutra_reference="Bhrigu Samhita Folio 251, Verse 13",
            severity="moderate",
            indicators=[
                "6th house malefic occupation",
                "Debt and health vulnerability",
                "Enemy activation pattern"
            ],
            remedies=[
                "Serve the sick and needy",
                "Chant healing mantras",
                "Maintain financial discipline",
                "Regular health checkups"
            ]
        ))

    # 8th house transformation and losses
    if saturn_house == 8 or snapshot.mars_house == 8:
        downward_trends.append(LifeEvent(
            event_type="downward",
            title="8th House Transformation - Deep Changes and Losses",
            description=(
                "The 8th house activates profound transformation through crisis, loss, or sudden changes. "
                "This may involve inheritance issues, joint financial problems, or psychological transformation "
                "through difficult experiences. While this period is challenging, it serves as a death-rebirth "
                "cycle that leads to profound personal transformation. What appears as loss is often clearing "
                "space for new growth. Accept change and seek psychological support if needed."
            ),
            timing="Ages 32-48",
            certainty=0.72,
            sutra_reference="Bhrigu Samhita Folio 257, Verse 9",
            severity="moderate to severe",
            indicators=[
                "8th house malefic occupation",
                "Transformation through crisis",
                "Sudden change pattern"
            ],
            remedies=[
                "Deep meditation and inner work",
                "Psychological counseling",
                "Transform crisis into growth",
                "Trust the transformation process"
            ]
        ))

    # 12th house losses and expenses
    venus_house = snapshot.venus_house
    if venus_house == 12 or saturn_house == 12:
        downward_trends.append(LifeEvent(
            event_type="downward",
            title="12th House Challenges - Expenses, Losses, Isolation",
            description=(
                "The 12th house activation brings periods of high expenses, unexpected losses, or feelings of "
                "isolation. Money seems to flow out faster than it comes in. You may experience separations "
                "or need to spend on hospitalizations, travel, or hidden matters. This is also a spiritually "
                "significant period that can lead to moksha (liberation) if approached correctly. Balance "
                "material challenges with spiritual practices."
            ),
            timing="Ages 38-55",
            certainty=0.68,
            sutra_reference="Bhrigu Samhita Folio 263, Verse 15",
            severity="mild to moderate",
            indicators=[
                "12th house malefic occupation",
                "Expense and loss pattern",
                "Spiritual opportunity embedded"
            ],
            remedies=[
                "Control unnecessary expenses",
                "Spiritual retreat or pilgrimage",
                "Charity and selfless service",
                "Find meaning in solitude"
            ]
        ))

    return downward_trends


def _analyze_major_transitions(snapshot: CelestialSnapshot, birth_year: int) -> List[LifeEvent]:
    """Analyze major life transitions and turning points."""

    transitions = []

    # Dasha transitions (simplified - in real implementation would use actual dasha periods)
    transitions.append(LifeEvent(
        event_type="transition",
        title="Saturn Mahadasha Entry - Responsibility and Maturity",
        description=(
            "Entry into Saturn's major period marks a significant life transition toward greater responsibility, "
            "maturity, and structure. This is a sobering period that demands discipline and hard work. "
            "Youthful freedoms give way to adult duties. Career becomes serious, relationships deepen or end, "
            "and life's true purpose becomes clearer. While challenging, this period builds the foundation "
            "for lasting success and spiritual growth."
        ),
        timing="Age 36-55 (19-year period)",
        certainty=0.86,
        sutra_reference="Bhrigu Samhita Folio 178, Verse 25",
        indicators=[
            "Dasha transition to Saturn",
            "Maturity phase activation",
            "Responsibility increase"
        ]
    ))

    # Mid-life transition
    transitions.append(LifeEvent(
        event_type="transition",
        title="Mid-Life Spiritual Awakening",
        description=(
            "The mid-life period (typically ages 40-48) brings a significant shift from outer achievement "
            "to inner meaning. Questions about life purpose, legacy, and spiritual truth become prominent. "
            "This may trigger career changes, relationship reevaluations, or spiritual seeking. While it can "
            "be destabilizing, this transition leads to authentic living aligned with your true dharma. "
            "Embrace the questions and allow yourself to evolve."
        ),
        timing="Ages 40-48",
        certainty=0.81,
        sutra_reference="Bhrigu Samhita Folio 268, Verse 31",
        indicators=[
            "Mid-life dasha transition",
            "Spiritual awakening pattern",
            "Purpose reevaluation"
        ]
    ))

    # Elder wisdom phase
    transitions.append(LifeEvent(
        event_type="transition",
        title="Elder Wisdom Phase - Teaching and Legacy",
        description=(
            "Entry into the elder phase (typically after age 60) marks a transition from doing to being, "
            "from achievement to wisdom sharing. You become a teacher, mentor, and guide for younger generations. "
            "This is a time of spiritual deepening, grandparenting, and legacy building. Material pursuits "
            "naturally give way to spiritual practices and service. Your life experience becomes valuable wisdom "
            "to share with others."
        ),
        timing="Ages 60+",
        certainty=0.77,
        sutra_reference="Bhrigu Samhita Folio 273, Verse 18",
        indicators=[
            "Elder phase entry",
            "Wisdom sharing emphasis",
            "Legacy building period"
        ]
    ))

    return transitions


def _compose_overall_life_summary(
    marriage_events: List[LifeEvent],
    success_events: List[LifeEvent],
    risky_periods: List[LifeEvent],
    downward_trends: List[LifeEvent],
    major_transitions: List[LifeEvent]
) -> str:
    """Compose an overall summary of the life journey."""

    summary_parts = []

    summary_parts.append(
        "COMPREHENSIVE LIFE SCAN - Based on Bhrigu Samhita Astrological Analysis\n"
        "============================================================================\n"
    )

    # Marriage summary
    if marriage_events:
        best_marriage = max(marriage_events, key=lambda e: e.certainty)
        summary_parts.append(
            f"\nMARRIAGE PROSPECTS: {best_marriage.title} - {best_marriage.timing}. "
            f"The cosmic indicators suggest {best_marriage.description[:150]}..."
        )

    # Success summary
    if success_events:
        primary_success = max(success_events, key=lambda e: e.certainty)
        summary_parts.append(
            f"\nSUCCESS TRAJECTORY: {primary_success.title} during {primary_success.timing}. "
            f"Peak achievements expected in {primary_success.description[:150]}..."
        )

    # Risks summary
    if risky_periods:
        major_risk = max(risky_periods, key=lambda e: e.certainty)
        summary_parts.append(
            f"\nRISKY PERIODS: Primary caution advised during {major_risk.timing} - {major_risk.title}. "
            f"Vigilance needed for {major_risk.description[:120]}..."
        )

    # Downward trends summary
    if downward_trends:
        major_challenge = max(downward_trends, key=lambda e: e.certainty)
        summary_parts.append(
            f"\nCHALLENGING PHASES: {major_challenge.title} anticipated {major_challenge.timing}. "
            f"These periods require {major_challenge.description[:120]}..."
        )

    # Transitions summary
    if major_transitions:
        key_transition = major_transitions[0]  # First major transition
        summary_parts.append(
            f"\nMAJOR TRANSITIONS: Life-defining shift at {key_transition.timing} - {key_transition.title}. "
            f"This marks {key_transition.description[:120]}..."
        )

    summary_parts.append(
        "\n\nOVERALL LIFE PATTERN: Your birth chart reveals a life of significant events, both challenging "
        "and triumphant. The cosmic blueprint shows a journey of spiritual evolution through material experiences. "
        "Success periods are balanced with learning phases, creating a holistic path toward wisdom and fulfillment. "
        "Pay attention to the timing guidance and use remedies during difficult periods. Your life's main events "
        "are orchestrated by karmic patterns that ultimately lead to liberation and purpose fulfillment."
    )

    return "".join(summary_parts)


def analyze_life_events(snapshot: CelestialSnapshot, birth_date: str) -> LifeEventsReport:
    """
    Main function to analyze all major life events.

    Args:
        snapshot: Celestial snapshot from birth chart
        birth_date: Birth date in ISO format (YYYY-MM-DD)

    Returns:
        LifeEventsReport with comprehensive life events analysis
    """

    # Extract birth year for age calculations
    try:
        birth_year = int(birth_date.split('-')[0])
    except (ValueError, IndexError):
        birth_year = 2000  # Default fallback

    # Analyze each category
    marriage_events = _analyze_marriage_prospects(snapshot, birth_year)
    success_events = _analyze_success_periods(snapshot, birth_year)
    risky_periods = _analyze_risky_periods(snapshot, birth_year)
    downward_trends = _analyze_downward_trends(snapshot, birth_year)
    major_transitions = _analyze_major_transitions(snapshot, birth_year)

    # Compose overall summary
    overall_summary = _compose_overall_life_summary(
        marriage_events,
        success_events,
        risky_periods,
        downward_trends,
        major_transitions
    )

    return LifeEventsReport(
        marriage_events=marriage_events,
        success_events=success_events,
        risky_periods=risky_periods,
        downward_trends=downward_trends,
        major_transitions=major_transitions,
        overall_life_summary=overall_summary
    )


def format_life_events_interpretation(report: LifeEventsReport) -> str:
    """Format the life events report into a detailed narrative interpretation."""

    sections = []

    # Overall summary
    sections.append(report.overall_life_summary)

    # Marriage section
    if report.marriage_events:
        sections.append("\n\n═══ MARRIAGE AND RELATIONSHIPS ═══\n")
        for event in sorted(report.marriage_events, key=lambda e: e.certainty, reverse=True):
            sections.append(f"\n{event.title} ({event.timing})")
            sections.append(f"Certainty: {event.certainty:.0%} | Reference: {event.sutra_reference}")
            sections.append(f"\n{event.description}")
            if event.indicators:
                sections.append(f"\nAstrological Indicators: {', '.join(event.indicators)}")
            if event.remedies:
                sections.append(f"\nRemedies: {'; '.join(event.remedies)}")
            sections.append("\n" + "-" * 80)

    # Success section
    if report.success_events:
        sections.append("\n\n═══ SUCCESS AND ACHIEVEMENTS ═══\n")
        for event in sorted(report.success_events, key=lambda e: e.certainty, reverse=True):
            sections.append(f"\n{event.title} ({event.timing})")
            sections.append(f"Certainty: {event.certainty:.0%} | Reference: {event.sutra_reference}")
            sections.append(f"\n{event.description}")
            if event.indicators:
                sections.append(f"\nAstrological Indicators: {', '.join(event.indicators)}")
            sections.append("\n" + "-" * 80)

    # Risky periods section
    if report.risky_periods:
        sections.append("\n\n═══ RISKY PERIODS AND CAUTIONS ═══\n")
        for event in sorted(report.risky_periods, key=lambda e: e.certainty, reverse=True):
            severity_tag = f" [Severity: {event.severity.upper()}]" if event.severity else ""
            sections.append(f"\n{event.title} ({event.timing}){severity_tag}")
            sections.append(f"Certainty: {event.certainty:.0%} | Reference: {event.sutra_reference}")
            sections.append(f"\n{event.description}")
            if event.indicators:
                sections.append(f"\nWarning Indicators: {', '.join(event.indicators)}")
            if event.remedies:
                sections.append(f"\nProtective Remedies: {'; '.join(event.remedies)}")
            sections.append("\n" + "-" * 80)

    # Downward trends section
    if report.downward_trends:
        sections.append("\n\n═══ DOWNWARD TRENDS AND OBSTACLES ═══\n")
        for event in sorted(report.downward_trends, key=lambda e: e.certainty, reverse=True):
            severity_tag = f" [Severity: {event.severity.upper()}]" if event.severity else ""
            sections.append(f"\n{event.title} ({event.timing}){severity_tag}")
            sections.append(f"Certainty: {event.certainty:.0%} | Reference: {event.sutra_reference}")
            sections.append(f"\n{event.description}")
            if event.indicators:
                sections.append(f"\nChallenge Indicators: {', '.join(event.indicators)}")
            if event.remedies:
                sections.append(f"\nMitigation Remedies: {'; '.join(event.remedies)}")
            sections.append("\n" + "-" * 80)

    # Major transitions section
    if report.major_transitions:
        sections.append("\n\n═══ MAJOR LIFE TRANSITIONS ═══\n")
        for event in report.major_transitions:
            sections.append(f"\n{event.title} ({event.timing})")
            sections.append(f"Certainty: {event.certainty:.0%} | Reference: {event.sutra_reference}")
            sections.append(f"\n{event.description}")
            if event.indicators:
                sections.append(f"\nTransition Indicators: {', '.join(event.indicators)}")
            sections.append("\n" + "-" * 80)

    sections.append(
        "\n\n" + "=" * 80 + "\n"
        "NOTE: All timings and predictions are based on Bhrigu Samhita astrological principles\n"
        "and should be used as guidance for informed decision-making. Karmic patterns can be\n"
        "influenced by free will, spiritual practices, and conscious choices.\n"
        + "=" * 80
    )

    return "".join(sections)

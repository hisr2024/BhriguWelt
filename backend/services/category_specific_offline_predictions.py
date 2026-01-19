"""
Category-Specific Offline Predictions Service
Generates precise, unique predictions for each category using Bhrigu Core Wisdom Database
NO REPETITIONS - Each category has completely unique content
"""
import os
import sys
from typing import Dict, Any, List, Optional
from datetime import datetime
import random

# Import core wisdom databases
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'core_wisdom'))

try:
    from bhrigu_samhita_knowledge import PLANETARY_CORE_WISDOM, HOUSE_WISDOM, YOGA_DATABASE, DASHA_WISDOM, REMEDIAL_WISDOM
    from nadi_jyotisha_knowledge import NAKSHATRA_WISDOM, NADI_COMPATIBILITY, NADI_PREDICTION_TECHNIQUES, TRANSIT_WISDOM
    WISDOM_LOADED = True
except ImportError:
    WISDOM_LOADED = False
    PLANETARY_CORE_WISDOM = {}
    NAKSHATRA_WISDOM = {}
    HOUSE_WISDOM = {}
    YOGA_DATABASE = {}
    DASHA_WISDOM = {}
    REMEDIAL_WISDOM = {}
    NADI_COMPATIBILITY = {}
    NADI_PREDICTION_TECHNIQUES = {}
    TRANSIT_WISDOM = {}


class CategorySpecificOfflinePredictions:
    """
    Generates CATEGORY-SPECIFIC predictions with NO REPETITIONS
    Each category produces unique, focused content
    """

    def __init__(self):
        self.zodiac_data = self._init_zodiac_data()
        self.nakshatra_data = self._init_nakshatra_data()
        self.house_data = self._init_house_data()
        self.planetary_data = self._init_planetary_data()

    def _init_zodiac_data(self) -> Dict[str, Dict]:
        return {
            'Aries': {'element': 'Fire', 'ruler': 'Mars', 'quality': 'Cardinal', 'nature': 'leadership and initiative'},
            'Taurus': {'element': 'Earth', 'ruler': 'Venus', 'quality': 'Fixed', 'nature': 'stability and abundance'},
            'Gemini': {'element': 'Air', 'ruler': 'Mercury', 'quality': 'Mutable', 'nature': 'communication and learning'},
            'Cancer': {'element': 'Water', 'ruler': 'Moon', 'quality': 'Cardinal', 'nature': 'nurturing and protection'},
            'Leo': {'element': 'Fire', 'ruler': 'Sun', 'quality': 'Fixed', 'nature': 'creativity and authority'},
            'Virgo': {'element': 'Earth', 'ruler': 'Mercury', 'quality': 'Mutable', 'nature': 'analysis and service'},
            'Libra': {'element': 'Air', 'ruler': 'Venus', 'quality': 'Cardinal', 'nature': 'harmony and partnerships'},
            'Scorpio': {'element': 'Water', 'ruler': 'Mars', 'quality': 'Fixed', 'nature': 'transformation and depth'},
            'Sagittarius': {'element': 'Fire', 'ruler': 'Jupiter', 'quality': 'Mutable', 'nature': 'wisdom and expansion'},
            'Capricorn': {'element': 'Earth', 'ruler': 'Saturn', 'quality': 'Cardinal', 'nature': 'discipline and achievement'},
            'Aquarius': {'element': 'Air', 'ruler': 'Saturn', 'quality': 'Fixed', 'nature': 'innovation and humanitarianism'},
            'Pisces': {'element': 'Water', 'ruler': 'Jupiter', 'quality': 'Mutable', 'nature': 'spirituality and compassion'}
        }

    def _init_nakshatra_data(self) -> Dict[str, Dict]:
        return {
            'Ashwini': {'ruler': 'Ketu', 'deity': 'Ashwini Kumaras', 'quality': 'healing and speed', 'past_life': 'healer or physician'},
            'Bharani': {'ruler': 'Venus', 'deity': 'Yama', 'quality': 'transformation', 'past_life': 'caretaker of souls'},
            'Krittika': {'ruler': 'Sun', 'deity': 'Agni', 'quality': 'purification', 'past_life': 'fire priest or warrior'},
            'Rohini': {'ruler': 'Moon', 'deity': 'Brahma', 'quality': 'creativity and growth', 'past_life': 'artist or cultivator'},
            'Mrigashira': {'ruler': 'Mars', 'deity': 'Soma', 'quality': 'searching and curiosity', 'past_life': 'seeker or hunter'},
            'Ardra': {'ruler': 'Rahu', 'deity': 'Rudra', 'quality': 'transformation through storms', 'past_life': 'one who faced destruction'},
            'Punarvasu': {'ruler': 'Jupiter', 'deity': 'Aditi', 'quality': 'renewal and return', 'past_life': 'traveler who returned home'},
            'Pushya': {'ruler': 'Saturn', 'deity': 'Brihaspati', 'quality': 'nourishment and wisdom', 'past_life': 'spiritual teacher'},
            'Ashlesha': {'ruler': 'Mercury', 'deity': 'Nagas', 'quality': 'mystical powers', 'past_life': 'serpent worshipper or mystic'},
            'Magha': {'ruler': 'Ketu', 'deity': 'Pitris', 'quality': 'ancestral authority', 'past_life': 'royalty or ancestor guide'},
            'Purva Phalguni': {'ruler': 'Venus', 'deity': 'Bhaga', 'quality': 'enjoyment and creativity', 'past_life': 'entertainer or artist'},
            'Uttara Phalguni': {'ruler': 'Sun', 'deity': 'Aryaman', 'quality': 'patronage and contracts', 'past_life': 'benefactor or healer'},
            'Hasta': {'ruler': 'Moon', 'deity': 'Savitar', 'quality': 'skill and craftsmanship', 'past_life': 'craftsman or surgeon'},
            'Chitra': {'ruler': 'Mars', 'deity': 'Vishvakarma', 'quality': 'architecture and beauty', 'past_life': 'architect or jeweler'},
            'Swati': {'ruler': 'Rahu', 'deity': 'Vayu', 'quality': 'independence and movement', 'past_life': 'merchant or traveler'},
            'Vishakha': {'ruler': 'Jupiter', 'deity': 'Indra-Agni', 'quality': 'determination and goals', 'past_life': 'conqueror or achiever'},
            'Anuradha': {'ruler': 'Saturn', 'deity': 'Mitra', 'quality': 'friendship and devotion', 'past_life': 'devoted friend or disciple'},
            'Jyeshtha': {'ruler': 'Mercury', 'deity': 'Indra', 'quality': 'seniority and protection', 'past_life': 'elder or protector'},
            'Moola': {'ruler': 'Ketu', 'deity': 'Nirriti', 'quality': 'getting to the root', 'past_life': 'investigator or destroyer'},
            'Purva Ashadha': {'ruler': 'Venus', 'deity': 'Apas', 'quality': 'invincibility', 'past_life': 'purifier or victor'},
            'Uttara Ashadha': {'ruler': 'Sun', 'deity': 'Vishvadevas', 'quality': 'final victory', 'past_life': 'righteous leader'},
            'Shravana': {'ruler': 'Moon', 'deity': 'Vishnu', 'quality': 'listening and learning', 'past_life': 'scholar or listener'},
            'Dhanishta': {'ruler': 'Mars', 'deity': 'Vasus', 'quality': 'wealth and rhythm', 'past_life': 'musician or wealthy person'},
            'Shatabhisha': {'ruler': 'Rahu', 'deity': 'Varuna', 'quality': 'healing and secrecy', 'past_life': 'healer or recluse'},
            'Purva Bhadrapada': {'ruler': 'Jupiter', 'deity': 'Aja Ekapada', 'quality': 'transformation through fire', 'past_life': 'ascetic or renunciant'},
            'Uttara Bhadrapada': {'ruler': 'Saturn', 'deity': 'Ahir Budhnya', 'quality': 'deep wisdom', 'past_life': 'serpent of the deep or sage'},
            'Revati': {'ruler': 'Mercury', 'deity': 'Pushan', 'quality': 'nourishment and journey completion', 'past_life': 'guide or shepherd'}
        }

    def _init_house_data(self) -> Dict[int, Dict]:
        return {
            1: {'name': 'Lagna', 'domain': 'self and body', 'karaka': 'Sun'},
            2: {'name': 'Dhana', 'domain': 'wealth and family', 'karaka': 'Jupiter'},
            3: {'name': 'Sahaja', 'domain': 'courage and siblings', 'karaka': 'Mars'},
            4: {'name': 'Sukha', 'domain': 'mother and happiness', 'karaka': 'Moon'},
            5: {'name': 'Putra', 'domain': 'children and creativity', 'karaka': 'Jupiter'},
            6: {'name': 'Ripu', 'domain': 'enemies and health', 'karaka': 'Mars'},
            7: {'name': 'Kalatra', 'domain': 'spouse and partnerships', 'karaka': 'Venus'},
            8: {'name': 'Ayur', 'domain': 'longevity and transformation', 'karaka': 'Saturn'},
            9: {'name': 'Dharma', 'domain': 'fortune and father', 'karaka': 'Jupiter'},
            10: {'name': 'Karma', 'domain': 'career and status', 'karaka': 'Saturn'},
            11: {'name': 'Labha', 'domain': 'gains and friends', 'karaka': 'Jupiter'},
            12: {'name': 'Vyaya', 'domain': 'liberation and losses', 'karaka': 'Saturn'}
        }

    def _init_planetary_data(self) -> Dict[str, Dict]:
        return {
            'Sun': {'nature': 'soul and authority', 'exalted': 'Aries', 'debilitated': 'Libra'},
            'Moon': {'nature': 'mind and emotions', 'exalted': 'Taurus', 'debilitated': 'Scorpio'},
            'Mars': {'nature': 'energy and courage', 'exalted': 'Capricorn', 'debilitated': 'Cancer'},
            'Mercury': {'nature': 'intellect and communication', 'exalted': 'Virgo', 'debilitated': 'Pisces'},
            'Jupiter': {'nature': 'wisdom and expansion', 'exalted': 'Cancer', 'debilitated': 'Capricorn'},
            'Venus': {'nature': 'love and beauty', 'exalted': 'Pisces', 'debilitated': 'Virgo'},
            'Saturn': {'nature': 'karma and discipline', 'exalted': 'Libra', 'debilitated': 'Aries'},
            'Rahu': {'nature': 'desires and obsession', 'exalted': 'Taurus', 'debilitated': 'Scorpio'},
            'Ketu': {'nature': 'liberation and detachment', 'exalted': 'Scorpio', 'debilitated': 'Taurus'}
        }

    def _get_context(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract and enrich context from birth data"""
        zodiac = birth_data.get('zodiac_sign', 'Aries')
        nakshatra = birth_data.get('nakshatra', 'Ashwini')
        moon_sign = birth_data.get('moon_sign', zodiac)

        zodiac_info = self.zodiac_data.get(zodiac, self.zodiac_data['Aries'])
        nakshatra_info = self.nakshatra_data.get(nakshatra, self.nakshatra_data['Ashwini'])

        return {
            'zodiac': zodiac,
            'nakshatra': nakshatra,
            'moon_sign': moon_sign,
            'element': zodiac_info['element'],
            'ruler': zodiac_info['ruler'],
            'quality': zodiac_info['quality'],
            'nature': zodiac_info['nature'],
            'nak_ruler': nakshatra_info['ruler'],
            'nak_deity': nakshatra_info['deity'],
            'nak_quality': nakshatra_info['quality'],
            'past_life_hint': nakshatra_info['past_life']
        }

    # =========================================================================
    # PAST LIVES - Unique sections about previous incarnations
    # =========================================================================
    def generate_past_lives(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate PAST LIVES specific predictions - NO generic content"""
        ctx = self._get_context(birth_data)

        sections = {}

        # Section 1: Most Recent Past Life
        sections['recent_life'] = f"""Your most recent incarnation was during the 17th-18th century period. Based on {ctx['nakshatra']} nakshatra ruled by {ctx['nak_ruler']}, you lived as a {ctx['past_life_hint']}.

The {ctx['nak_deity']} deity connection indicates you were involved in {ctx['nak_quality']}. Your passing was peaceful, leaving unfinished work in {ctx['nature']} which you now continue.

**Era:** 17th-18th Century
**Role:** {ctx['past_life_hint'].title()}
**Location:** A land connected to {ctx['element']} element traditions
**Unfinished Business:** Mastering {ctx['nak_quality']}"""

        # Section 2: Significant Past Lives (3-5)
        lives = self._generate_past_life_narratives(ctx)
        sections['significant_lives'] = f"""**Life 1 - Ancient Period (3000+ years ago):**
You served as a temple priest/priestess devoted to {ctx['nak_deity']}. Your work involved sacred rituals and {ctx['nak_quality']}.

**Life 2 - Classical Era (1000-2000 years ago):**
As a {ctx['element'].lower()} element practitioner, you mastered {ctx['nature']}. You held respected position in society.

**Life 3 - Medieval Period (500-800 years ago):**
Born into a family of {ctx['past_life_hint']}s. You developed skills that you now carry as natural talents.

**Life 4 - Recent Past (200-400 years ago):**
A life of {ctx['quality'].lower()} energy, working with {ctx['ruler']} themes. This life shaped your current approach to challenges."""

        # Section 3: Recurring Karmic Patterns
        sections['karmic_patterns'] = f"""**Pattern 1 - Authority & Power:**
Across lifetimes, you've dealt with {ctx['ruler']} themes - learning to use power wisely without dominance.

**Pattern 2 - Relationships:**
Recurring lessons around {ctx['nak_quality']} in partnerships. The same souls appear teaching trust and boundaries.

**Pattern 3 - Material vs Spiritual:**
A constant theme of balancing {ctx['element']} element desires with spiritual growth.

**Pattern 4 - Service:**
Multiple lives involving service through {ctx['nature']}. This pattern continues seeking resolution."""

        # Section 4: Past Life Skills & Talents
        sections['past_skills'] = f"""**Innate Abilities from Past Lives:**

1. **{ctx['nak_quality'].title()}** - Mastered over multiple incarnations, feels natural now
2. **{ctx['nature'].title()}** - Deep expertise carried from {ctx['zodiac']} past-life work
3. **{ctx['nak_deity']} Connection** - Spiritual abilities developed through devotion
4. **{ctx['element']} Element Mastery** - Intuitive understanding of {ctx['element'].lower()} principles

These talents surface without formal training because your soul already knows them."""

        # Section 5: Past Life Traumas Needing Healing
        sections['traumas_healing'] = f"""**Trauma 1 - Betrayal Memory:**
A deep-seated fear related to {ctx['ruler']} themes stems from past-life betrayal. Healing: Trust-building practices.

**Trauma 2 - Loss Pattern:**
{ctx['nakshatra']} indicates past sudden losses. Current anxiety around security connects to this. Healing: Grounding rituals.

**Trauma 3 - Unexpressed Potential:**
Past life where your {ctx['nak_quality']} was suppressed. Current frustration when creativity is blocked. Healing: Creative expression.

**Healing Approach:**
- {ctx['nak_deity']} meditation for soul healing
- {ctx['element']} element balancing practices
- Past-life regression with qualified practitioner"""

        # Section 6: Past Life Relationships in Current Life
        sections['past_relationships'] = f"""**Recognition Signs for Past-Life Connections:**
- Instant comfort or discomfort upon meeting
- Feeling you've known someone forever
- Intense emotional reactions without logical cause

**Current Relationships with Past-Life Roots:**
- **Family Members:** Soul contracts from {ctx['nak_deity']} lineage work
- **Close Friends:** Companions from temple or learning communities
- **Challenging People:** Teachers returning to complete lessons

**Your {ctx['nakshatra']} nakshatra attracts souls connected to {ctx['nak_quality']} themes.**"""

        # Section 7: Karmic Debts from Past Lives
        sections['karmic_debts'] = f"""**Debts You Carry:**
1. Service debt to community - resolve through helping others with {ctx['nature']}
2. Knowledge debt - share wisdom you gained, especially about {ctx['nak_quality']}
3. Family lineage debt - honor ancestors through {ctx['nak_deity']} practices

**Debts Owed to You:**
1. Recognition for past-life service
2. Support from souls you helped before
3. Resources returning from past generosity

**Resolution Timeline:** Active resolution through current {ctx['ruler']} dasha periods."""

        # Section 8: Past Life Spiritual Progress
        sections['spiritual_progress'] = f"""**Spiritual Level Achieved:**
Your {ctx['nakshatra']} placement indicates approximately 60-70% progress toward liberation.

**Past Spiritual Practices:**
- Devotion to {ctx['nak_deity']} across multiple lives
- Mastery of {ctx['element']} element meditation
- Service through {ctx['nak_quality']}

**Temples/Traditions Served:**
- {ctx['nak_deity']} temple lineages
- {ctx['element']} element mystery schools
- {ctx['ruler']}-focused spiritual communities

**What Remains:**
Integration of {ctx['nature']} with complete detachment. 7-12 incarnations estimated for liberation with dedicated practice."""

        full_analysis = self._compile_sections(sections, 'Past Lives')

        return {
            'category': 'past_lives',
            'title': 'Your Past Lives Analysis',
            'full_analysis': full_analysis,
            **sections,
            'metadata': {
                'tradition': 'Bhrigu Samhita & Nadi Jyotisha',
                'generated_at': datetime.utcnow().isoformat()
            }
        }

    # =========================================================================
    # FUTURE LIVES - Unique sections about coming incarnations
    # =========================================================================
    def generate_future_lives(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate FUTURE LIVES specific predictions - NO generic content"""
        ctx = self._get_context(birth_data)

        sections = {}

        # Section 1: Next Immediate Incarnation
        sections['next_incarnation'] = f"""**Projected Next Life (if current lessons incomplete):**

**Era:** 22nd-23rd Century
**Location:** A technologically advanced society aligned with {ctx['element']} element
**Role:** Advanced practitioner of {ctx['nak_quality']}
**Primary Purpose:** Completing mastery of {ctx['nature']}

Your {ctx['nakshatra']} trajectory suggests your next birth will offer opportunities to apply {ctx['nak_deity']} teachings in new contexts. The {ctx['ruler']} influence continues, but with greater wisdom."""

        # Section 2: Soul Evolution Trajectory (Next 3-5 Lives)
        sections['evolution_trajectory'] = f"""**Life +1:** Focus on {ctx['nak_quality']} mastery in service role
**Life +2:** Leadership position utilizing {ctx['nature']}
**Life +3:** Teacher/guide role sharing {ctx['element']} wisdom
**Life +4:** Minimal karma - choice incarnation for service
**Life +5:** Potential final birth if moksha conditions met

**Progression Theme:**
Each life reduces {ctx['ruler']} attachment while increasing {ctx['nak_deity']} alignment. Soul moves from doing to being."""

        # Section 3: Conditions for Final Birth
        sections['final_birth_conditions'] = f"""**Current Liberation Progress:** 65-75%

**Remaining Requirements:**
1. Complete detachment from {ctx['element']} element desires
2. Full resolution of {ctx['ruler']} karmic themes
3. Service debt completion through {ctx['nak_quality']}
4. Ego dissolution regarding {ctx['nature']}

**Accelerators:**
- Daily {ctx['nak_deity']} meditation
- Selfless service without recognition
- Teaching what you've mastered
- Forgiveness of all past-life connections

**This CAN be your final birth with intensive spiritual practice.**"""

        # Section 4: Future Life Scenarios
        sections['future_scenarios'] = f"""**Scenario A - Spiritual Focus Path:**
Next 2-3 births in contemplative roles. Quick liberation. Less worldly achievement but rapid soul progress.

**Scenario B - Balanced Path:**
5-7 births balancing {ctx['nature']} work with spiritual growth. Moderate pace, rich experiences.

**Scenario C - Material Focus Path:**
10+ births if {ctx['element']} attachments strengthen. Success but delayed liberation.

**Your Current Trajectory:** Between A and B based on {ctx['nakshatra']} indicators. Choices in this life determine the path."""

        # Section 5: Moksha Timeline & Preparation
        sections['moksha_timeline'] = f"""**Estimated Incarnations to Liberation:** 7-12 (reducible to 3-5 with practice)

**Current Progress Indicators:**
- {ctx['nakshatra']} placement: Intermediate soul maturity
- {ctx['element']} element: 70% mastered
- {ctx['ruler']} lessons: 60% integrated

**Preparation Practices:**
1. {ctx['nak_deity']} sadhana - daily devotion
2. {ctx['element']} element purification
3. Karma yoga through {ctx['nak_quality']}
4. Study of liberation texts

**Key Windows:** Major progress possible during {ctx['ruler']} mahadasha periods."""

        # Section 6: Higher Realms Accessibility
        sections['higher_realms'] = f"""**Current Realm Eligibility:**
Based on {ctx['nakshatra']} and {ctx['zodiac']}, you have access to:

**Accessible Between Lives:**
- Pitru Loka (Ancestral realm) - ✓ Available
- Swarga (Heaven realm) - ✓ Partial access
- {ctx['nak_deity']} Loka - ✓ Through devotion

**Requirements for Higher Access:**
- Brahma Loka: Complete {ctx['element']} mastery + selfless service
- Vishnu Loka: Surrender of {ctx['ruler']} ego completely
- Shiva Loka: Transcendence of all {ctx['nature']} attachment

**Your {ctx['nak_deity']} connection provides special access to devotee realms.**"""

        # Section 7: Bodhisattva Path Potential
        sections['bodhisattva_path'] = f"""**Service Return Capacity:** HIGH

Your {ctx['nakshatra']} indicates strong potential to return as guide after liberation.

**Likely Service Role:**
- Teacher of {ctx['nak_quality']}
- Guide for souls working with {ctx['element']} themes
- {ctx['nak_deity']} tradition lineage holder

**Signs of Bodhisattva Inclination:**
- Natural desire to help others
- Teaching comes easily
- Compassion for those struggling with {ctx['nature']}

**If You Choose Return:**
You would incarnate as a realized teacher, free from karma but choosing to serve."""

        # Section 8: Ultimate Destiny
        sections['ultimate_destiny'] = f"""**Soul's Final Destination:**

Your {ctx['nakshatra']} under {ctx['nak_deity']} guidance leads toward merger with cosmic consciousness while retaining {ctx['nak_quality']} essence.

**The Journey:**
Current life → 7-12 refinement births → Liberation choice → Service or merger

**Ultimate State:**
Complete freedom from {ctx['element']} binding. {ctx['ruler']} energy becomes cosmic rather than personal. Your {ctx['nature']} transforms into universal blessing.

**Legacy:**
The wisdom you accumulate through {ctx['nak_quality']} becomes part of the collective consciousness, helping future souls on similar paths."""

        full_analysis = self._compile_sections(sections, 'Future Lives')

        return {
            'category': 'future_lives',
            'title': 'Your Future Lives Trajectory',
            'full_analysis': full_analysis,
            **sections,
            'metadata': {
                'tradition': 'Bhrigu Samhita & Nadi Jyotisha',
                'generated_at': datetime.utcnow().isoformat()
            }
        }

    # =========================================================================
    # PRESENT LIFE - Current circumstances and practical guidance
    # =========================================================================
    def generate_present_life(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate PRESENT LIFE specific predictions - practical current guidance"""
        ctx = self._get_context(birth_data)

        sections = {}

        # Section 1: Current Life Phase
        sections['current_phase'] = f"""**Current Phase:** Growth and Consolidation

Your {ctx['zodiac']} Sun with {ctx['nakshatra']} nakshatra indicates you are in a phase of building foundations. The {ctx['ruler']} influence brings focus on {ctx['nature']}.

**Immediate Focus Areas:**
- Strengthening {ctx['element']} element expression
- Developing {ctx['nak_quality']} professionally
- Balancing ambition with inner peace

**Phase Duration:** This consolidation continues for 2-3 years before expansion."""

        # Section 2: Career & Professional Path
        sections['career'] = f"""**Ideal Career Directions:**
- Fields involving {ctx['nak_quality']}
- {ctx['element']} element industries
- Roles requiring {ctx['nature']}

**Strengths to Leverage:**
- Natural ability in {ctx['nak_quality']} (from {ctx['nakshatra']})
- {ctx['ruler']} energy for leadership
- {ctx['quality']} approach to challenges

**Career Timing:**
- Growth period: Current to next 3 years
- Major advancement: During {ctx['ruler']} favorable transits
- Peak achievement: Mid-40s to early 50s

**Recommended Actions:**
- Develop expertise in {ctx['nak_quality']}
- Network with {ctx['element']} industry professionals
- Seek mentors who embody {ctx['nature']}"""

        # Section 3: Relationships & Partnerships
        sections['relationships'] = f"""**Relationship Patterns:**
Your {ctx['nakshatra']} creates attraction to partners who complement your {ctx['nak_quality']}.

**Ideal Partner Qualities:**
- Appreciates your {ctx['nature']}
- Balances your {ctx['element']} intensity
- Supports your {ctx['nak_deity']} spiritual connection

**Current Relationship Guidance:**
- Communicate needs around {ctx['nak_quality']}
- Allow partner space for their growth
- Practice {ctx['element']} element harmony

**Timing for Commitments:**
Favorable periods during Venus and Jupiter transits through compatible signs."""

        # Section 4: Health & Wellbeing
        sections['health'] = f"""**Health Tendencies:**
{ctx['element']} element dominance affects your constitution.

**Areas Requiring Attention:**
- {ctx['element']}-related imbalances
- Stress from excessive {ctx['nature']} focus
- {ctx['nakshatra']}-indicated vulnerabilities

**Preventive Practices:**
- {ctx['element']} element balancing diet
- Regular exercise suited to {ctx['quality']} energy
- {ctx['nak_deity']} meditation for mental peace

**Optimal Health Routines:**
- Morning: {ctx['element']} element practices
- Evening: Calming {ctx['nak_quality']} activities
- Weekly: Nature connection for grounding"""

        # Section 5: Financial Prospects
        sections['finances'] = f"""**Wealth Patterns:**
{ctx['zodiac']} with {ctx['nakshatra']} indicates wealth through {ctx['nak_quality']}.

**Income Sources:**
- Primary: Career in {ctx['nature']} fields
- Secondary: Investments in {ctx['element']} industries
- Potential: Teaching or consulting on {ctx['nak_quality']}

**Financial Strengths:**
- {ctx['quality']} approach to money management
- {ctx['ruler']} energy for earning capacity

**Wealth Building Periods:**
- Current to age 45: Building phase
- Age 45-55: Peak earning potential
- Age 55+: Consolidation and giving

**Practical Guidance:**
- Invest in {ctx['element']}-related assets
- Save during {ctx['ruler']} favorable periods
- Avoid speculation during challenging transits"""

        # Section 6: Spiritual Growth Opportunities
        sections['spiritual_growth'] = f"""**Spiritual Path:**
{ctx['nak_deity']} devotion is your natural spiritual alignment.

**Recommended Practices:**
- Daily: {ctx['nak_deity']} meditation (20 minutes)
- Weekly: {ctx['element']} element purification
- Monthly: Full moon {ctx['nakshatra']} observances

**Teachers & Traditions:**
- Seek teachers connected to {ctx['nak_deity']} lineage
- Study {ctx['element']} element spiritual texts
- Practice {ctx['nak_quality']} as spiritual discipline

**Growth Indicators:**
- Increasing peace during {ctx['nature']} activities
- Dreams featuring {ctx['nak_deity']} or related symbols
- Synchronicities around {ctx['nak_quality']} themes"""

        # Section 7: Education & Skill Development
        sections['education'] = f"""**Learning Strengths:**
{ctx['nakshatra']} provides natural aptitude for {ctx['nak_quality']}.

**Recommended Studies:**
- Formal: Degrees in {ctx['nature']}-related fields
- Informal: {ctx['nak_quality']} skill development
- Spiritual: {ctx['nak_deity']} tradition texts

**Learning Style:**
- {ctx['quality']} approach - {ctx['quality'].lower()} learner
- {ctx['element']} element methods work best
- Practical application over pure theory

**Skill Priorities:**
1. Master {ctx['nak_quality']} fundamentals
2. Develop {ctx['nature']} expertise
3. Learn {ctx['element']} element practices
4. Study {ctx['nak_deity']} teachings"""

        # Section 8: Life Purpose Alignment
        sections['life_purpose'] = f"""**Core Purpose:**
Express {ctx['nak_quality']} through {ctx['nature']} to serve others.

**Daily Alignment Practices:**
- Morning intention: Connect with {ctx['nak_deity']}
- Work focus: Apply {ctx['nak_quality']} consciously
- Evening review: Assess alignment with purpose

**Signs of Alignment:**
- Energy and enthusiasm in {ctx['nature']} activities
- Opportunities appearing for {ctx['nak_quality']} expression
- Feeling of rightness and flow

**Course Corrections:**
- If depleted: More {ctx['element']} element rest
- If stuck: {ctx['nak_deity']} guidance meditation
- If conflicted: Return to {ctx['nak_quality']} basics"""

        # Section 9: Challenges & Lessons
        sections['challenges'] = f"""**Current Challenges:**
1. Balancing {ctx['element']} ambition with peace
2. Mastering {ctx['ruler']} energy without domination
3. Integrating {ctx['nak_quality']} with practical life

**Root Causes:**
- {ctx['nakshatra']} karmic patterns requiring resolution
- {ctx['zodiac']} tendencies needing refinement
- {ctx['element']} element excess or deficiency

**Transformation Approaches:**
- Challenge 1: {ctx['element']} element balancing practices
- Challenge 2: {ctx['nak_deity']} surrender meditation
- Challenge 3: Practical {ctx['nak_quality']} application

**Expected Resolution:**
With consistent effort, major progress within 3-5 years."""

        # Section 10: Key Timing & Transits
        sections['timing'] = f"""**Current Period:**
{ctx['ruler']} influence active - focus on {ctx['nature']}.

**Upcoming Favorable Windows:**
- Next 6 months: Good for {ctx['nak_quality']} initiatives
- 1-2 years: Career advancement opportunities
- 3-5 years: Major life consolidation

**Challenging Periods:**
- Saturn transits: Test {ctx['element']} foundations
- Rahu-Ketu axis: {ctx['nakshatra']} activation

**Action Timing:**
- Initiate: During waxing moon in compatible signs
- Complete: Before eclipses
- Rest: During {ctx['ruler']} challenging aspects

**Annual Highlights:**
Your birthday month + 5th and 9th months are most favorable for major decisions."""

        full_analysis = self._compile_sections(sections, 'Present Life')

        return {
            'category': 'present_life',
            'title': 'Your Present Life Analysis',
            'full_analysis': full_analysis,
            **sections,
            'metadata': {
                'tradition': 'Bhrigu Samhita & Nadi Jyotisha',
                'generated_at': datetime.utcnow().isoformat()
            }
        }

    # =========================================================================
    # LIFE EVENTS - Timing and milestones
    # =========================================================================
    def generate_life_events(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate LIFE EVENTS timing predictions"""
        ctx = self._get_context(birth_data)

        sections = {}

        sections['yearly_forecast'] = f"""**Year 1 (Current):** Foundation building in {ctx['nature']}
**Year 2:** Expansion of {ctx['nak_quality']} opportunities
**Year 3:** Consolidation and relationship focus
**Year 4:** Career advancement peak
**Year 5:** Spiritual deepening phase

**Decade Overview:**
This decade emphasizes {ctx['element']} element mastery and {ctx['ruler']} theme integration."""

        sections['marriage_timing'] = f"""**Favorable Marriage Windows:**
- Venus transits through 7th from Moon: Excellent
- Jupiter aspects to 7th house: Very favorable
- {ctx['ruler']} positive periods: Good for commitment

**Age Indicators:**
Early favorable: 26-30 | Peak window: 28-34 | Later option: 35-40

**Partner Compatibility:**
Look for {ctx['element']} compatible signs and {ctx['nakshatra']}-harmonious nakshatras."""

        sections['career_milestones'] = f"""**Career Timeline:**
- Age 25-30: Skill building in {ctx['nak_quality']}
- Age 30-35: First major recognition
- Age 35-42: Leadership opportunities
- Age 42-50: Peak influence period
- Age 50+: Mentorship and legacy

**Breakthrough Indicators:**
During {ctx['ruler']} favorable dashas and Jupiter transits to 10th house."""

        sections['children_family'] = f"""**Family Expansion:**
- Favorable periods: Jupiter transit through 5th house
- {ctx['nakshatra']} indicates: 1-3 children likely
- Optimal timing: When Jupiter aspects Moon

**Parenting Style:**
Your {ctx['element']} nature creates nurturing through {ctx['nak_quality']}."""

        sections['financial_events'] = f"""**Wealth Milestones:**
- Age 30-35: First significant accumulation
- Age 40-45: Property/major investment
- Age 50-55: Peak wealth period

**Windfall Indicators:**
During 11th house activations and {ctx['ruler']} dasha periods."""

        sections['health_alerts'] = f"""**Health-Sensitive Periods:**
- Saturn transits: General vitality check
- Mars transits to 6th/8th: Accident awareness
- {ctx['element']}-related imbalance windows

**Preventive Actions:**
Regular checkups during challenging transits. {ctx['element']} element diet adjustments."""

        sections['spiritual_milestones'] = f"""**Awakening Timeline:**
- Current: Foundation practices with {ctx['nak_deity']}
- 5-10 years: Deepening experiences
- 15-20 years: Potential breakthrough
- 25+ years: Teaching capacity emerges"""

        sections['relocations'] = f"""**Travel & Moves:**
- Favorable directions: Based on {ctx['element']} element
- Relocation timing: During Rahu-Ketu favorable periods
- Pilgrimage: {ctx['nak_deity']} sacred sites recommended"""

        sections['education'] = f"""**Learning Milestones:**
- Formal education completion: Standard timeline
- Skill certifications: {ctx['nak_quality']} related, ages 25-35
- Spiritual studies: Ongoing, intensifying with age"""

        sections['favorable_periods'] = f"""**Growth Windows:**
- Jupiter dashas: Expansion and opportunity
- Venus periods: Relationships and creativity
- Mercury periods: Learning and communication
- {ctx['ruler']} favorable: {ctx['nature']} success"""

        sections['challenging_periods'] = f"""**Testing Phases:**
- Saturn dashas: Discipline and restructuring
- Rahu periods: Desire management
- Ketu periods: Letting go lessons
- Eclipses affecting {ctx['nakshatra']}: Transformation"""

        sections['transits'] = f"""**Major Transits to Watch:**
- Jupiter through {ctx['zodiac']}: Every 12 years - major blessings
- Saturn through {ctx['zodiac']}: Every 29 years - restructuring
- Rahu-Ketu axis: Every 18 years - karmic activation"""

        sections['age_milestones'] = f"""**Significant Ages:**
- 28-30: Saturn return - life restructuring
- 36: Jupiter return - wisdom expansion
- 42: Uranus opposition - midlife awakening
- 56: Second Saturn return - elder wisdom
- 60: Jupiter return - spiritual elder phase"""

        full_analysis = self._compile_sections(sections, 'Life Events')

        return {
            'category': 'life_events',
            'title': 'Your Life Events Timeline',
            'full_analysis': full_analysis,
            **sections,
            'metadata': {
                'tradition': 'Bhrigu Samhita & Nadi Jyotisha',
                'generated_at': datetime.utcnow().isoformat()
            }
        }

    # =========================================================================
    # KARMIC REMEDIES - Specific remedial measures
    # =========================================================================
    def generate_karmic_remedies(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate KARMIC REMEDIES - specific practices and rituals"""
        ctx = self._get_context(birth_data)

        sections = {}

        sections['mantras'] = f"""**Primary Mantra:**
{self._get_mantra_for_planet(ctx['ruler'])}
Count: 108 daily | Best time: Sunrise

**Nakshatra Mantra:**
Om {ctx['nak_deity']}aya Namah
Count: 27 times | Best time: During {ctx['nakshatra']} transit

**Protection Mantra:**
Om Gam Ganapataye Namah
Count: 21 times before important activities"""

        sections['gemstones'] = f"""**Primary Gemstone:**
{self._get_gemstone_for_planet(ctx['ruler'])}

**Supporting Stone:**
Based on {ctx['nakshatra']}: {self._get_nakshatra_stone(ctx['nak_ruler'])}

**Wearing Instructions:**
- Energize on {ctx['ruler']} day
- Wear on appropriate finger
- Minimum 3 carats for effectiveness"""

        sections['yantras'] = f"""**Recommended Yantras:**

1. **{ctx['ruler']} Yantra:**
   - Purpose: Strengthen {ctx['nature']}
   - Placement: Puja room, East direction
   - Worship: Daily with flowers and incense

2. **{ctx['nak_deity']} Yantra:**
   - Purpose: Nakshatra blessings
   - Placement: Near meditation space
   - Worship: During {ctx['nakshatra']} days"""

        sections['charitable_activities'] = f"""**Dana (Charity) Recommendations:**

**{ctx['ruler']} Day Charity:**
Donate items associated with {ctx['ruler']}: {self._get_charity_items(ctx['ruler'])}

**Nakshatra Charity:**
Support causes related to {ctx['nak_quality']}

**Regular Giving:**
- Feed animals on {ctx['ruler']} day
- Support education for underprivileged
- Help elderly on Saturdays"""

        sections['fasting'] = f"""**Recommended Fasts:**

**Primary Fast:**
{self._get_fasting_day(ctx['ruler'])} - for {ctx['ruler']} strength

**Nakshatra Fast:**
During {ctx['nakshatra']} transit days

**Monthly Fasts:**
- Ekadashi (11th lunar day): Spiritual purification
- Pradosham: Shiva blessings
- Full Moon in {ctx['zodiac']}: Special observance"""

        sections['deity_worship'] = f"""**Primary Deity:**
{ctx['nak_deity']} - Your nakshatra deity

**Worship Practice:**
- Daily: Light lamp and offer flowers
- Weekly: Full puja on {ctx['ruler']} day
- Monthly: Special abhishekam on {ctx['nakshatra']} day
- Yearly: Temple visit during {ctx['nakshatra']} festival

**Supporting Deities:**
- {self._get_planet_deity(ctx['ruler'])}: For {ctx['ruler']} blessings
- Ganesha: Obstacle removal
- Your Ishta Devata: Personal connection"""

        sections['pilgrimage'] = f"""**Sacred Sites for Your Chart:**

**Priority Pilgrimages:**
1. {ctx['nak_deity']} temples - Nakshatra blessing
2. {ctx['ruler']}-associated sites - Planetary strength
3. {ctx['element']} element sacred places

**Timing:**
- Best during {ctx['nakshatra']} transit
- Avoid eclipse periods
- Favorable during Jupiter transits

**Rituals at Sites:**
- Abhishekam to main deity
- Donation to temple
- Meditation in sanctum"""

        sections['lifestyle'] = f"""**Daily Practices:**

**Morning (Brahma Muhurta):**
- Wake before sunrise
- {ctx['nak_deity']} mantra recitation
- {ctx['element']} element exercise

**Diet:**
- Favor {ctx['element']} balancing foods
- Avoid heavy food on fast days
- Sattvic diet for spiritual progress

**Behavioral Disciplines:**
- Practice {ctx['nak_quality']} consciously
- Speak truth, especially on {ctx['ruler']} days
- Serve others through {ctx['nature']}"""

        sections['planetary_rituals'] = f"""**{ctx['ruler']} Shanti Puja:**
- When: During challenging {ctx['ruler']} periods
- Method: Full planetary peace ritual with priest
- Offerings: Items associated with {ctx['ruler']}

**Navagraha Puja:**
- When: Annual or during multiple planetary afflictions
- Benefits: Balances all planetary energies

**Homa (Fire Ritual):**
- {ctx['ruler']} Homa for major issues
- Perform during auspicious muhurta"""

        sections['karmic_cleansing'] = f"""**Purification Practices:**

**Daily Cleansing:**
- Morning bath with mantra
- Evening forgiveness meditation
- Release of daily karma before sleep

**Weekly Cleansing:**
- {ctx['ruler']} day special practices
- {ctx['element']} element purification

**Deep Cleansing:**
- Annual past-life healing session
- Pitru tarpan for ancestral karma
- {ctx['nak_deity']} forgiveness ritual"""

        sections['service'] = f"""**Seva (Service) Recommendations:**

**Weekly Service:**
- Help others with {ctx['nak_quality']} skills
- Support {ctx['element']}-related causes
- Assist at {ctx['nak_deity']} temples

**Special Service:**
- Teach {ctx['nature']} to those in need
- Feed hungry on {ctx['ruler']} days
- Support spiritual education"""

        sections['meditation'] = f"""**Meditation Practices:**

**Primary Practice:**
{ctx['nak_deity']} dhyana - 20 minutes daily

**{ctx['element']} Element Meditation:**
Visualization of {ctx['element'].lower()} for balance

**Advanced Practice:**
Past-life regression for karmic healing

**Timing:**
- Best: Brahma muhurta (pre-dawn)
- Good: Sunset
- During: {ctx['nakshatra']} transit days"""

        full_analysis = self._compile_sections(sections, 'Karmic Remedies')

        return {
            'category': 'karmic_remedies',
            'title': 'Your Personalized Karmic Remedies',
            'full_analysis': full_analysis,
            **sections,
            'metadata': {
                'tradition': 'Bhrigu Samhita & Nadi Jyotisha',
                'generated_at': datetime.utcnow().isoformat()
            }
        }

    # =========================================================================
    # RELATIONSHIPS - Connection and compatibility
    # =========================================================================
    def generate_relationships(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate RELATIONSHIPS specific predictions"""
        ctx = self._get_context(birth_data)

        sections = {}

        sections['romantic_marriage'] = f"""**Romantic Nature:**
Your {ctx['nakshatra']} creates deep connections through {ctx['nak_quality']}.

**Ideal Partner Qualities:**
- Appreciates {ctx['nature']}
- Compatible {ctx['element']} expression
- Spiritual alignment with {ctx['nak_deity']} values

**Marriage Indicators:**
- Strong commitment capacity from {ctx['quality']} nature
- Need for partner who balances {ctx['ruler']} energy
- Deep loyalty once committed

**Compatibility Signs:**
Best matches: {ctx['element']}-compatible signs
Challenging: Opposing element dominance"""

        sections['family'] = f"""**Family Dynamics:**
Your {ctx['zodiac']} Sun creates {ctx['nature']} family role.

**Parent Relationships:**
- Father: {ctx['ruler']} themes in connection
- Mother: {ctx['moon_sign']} emotional bond

**Sibling Dynamics:**
- Natural role: Guide in {ctx['nak_quality']}
- Challenges: {ctx['element']} element conflicts possible

**Creating Family:**
Your {ctx['nakshatra']} indicates nurturing through {ctx['nak_quality']}."""

        sections['soul_connections'] = f"""**Soul Family Recognition:**
You attract souls connected through {ctx['nak_deity']} lineage.

**Recognition Signs:**
- Instant familiarity
- Shared interest in {ctx['nak_quality']}
- Deep comfort despite short acquaintance

**Your Soul Group:**
- 12-20 souls traveling together
- Meeting scheduled through life events
- Purpose: Mutual growth in {ctx['nature']}"""

        sections['friendships'] = f"""**Friendship Patterns:**
{ctx['nakshatra']} creates bonds through {ctx['nak_quality']} sharing.

**Ideal Friends:**
- Appreciate your {ctx['nature']}
- Challenge you to grow
- Share {ctx['element']} interests

**Social Circle:**
- Quality over quantity
- Deep rather than wide connections
- {ctx['nak_deity']}-aligned groups beneficial"""

        sections['professional'] = f"""**Work Relationships:**
{ctx['quality']} approach to professional connections.

**Best Collaborations:**
- Partners who complement {ctx['nak_quality']}
- Mentors in {ctx['nature']} fields
- Teams valuing {ctx['element']} approach

**Leadership Style:**
{ctx['ruler']}-influenced, emphasizing {ctx['nature']}."""

        sections['karmic_patterns'] = f"""**Relationship Karma:**
Patterns repeating until resolved:

1. **{ctx['ruler']} Pattern:** Learning balanced power in relationships
2. **{ctx['element']} Pattern:** Giving vs. receiving in {ctx['element']} ways
3. **{ctx['nakshatra']} Pattern:** {ctx['nak_quality']} expression in bonds

**Resolution:**
Conscious awareness and {ctx['nak_deity']} meditation."""

        sections['communication'] = f"""**Communication Style:**
{ctx['element']} element expression with {ctx['quality']} approach.

**Strengths:**
- Clear about {ctx['nature']} needs
- {ctx['nak_quality']} in expression
- {ctx['ruler']} directness

**Growth Areas:**
- Listening to non-{ctx['element']} perspectives
- Patience with different paces
- Softening {ctx['ruler']} intensity"""

        sections['timing'] = f"""**Relationship Timing:**

**Meeting Soul Connections:**
- Jupiter transits to 7th: New significant people
- Venus favorable periods: Romance activation
- {ctx['nakshatra']} transits: Soul family meetings

**Commitment Windows:**
- Jupiter-Venus combinations
- Favorable dasha periods
- Auspicious muhurtas for ceremonies"""

        sections['healing'] = f"""**Relationship Healing:**

**For Past Hurts:**
- {ctx['nak_deity']} forgiveness meditation
- Ho'oponopono practice
- Cord-cutting rituals for toxic connections

**For Current Issues:**
- {ctx['element']} element balancing together
- Honest communication about {ctx['nature']} needs
- Professional support if needed

**For Future Health:**
- Regular relationship review
- Shared spiritual practice
- {ctx['nak_quality']} activities together"""

        sections['healthy_practices'] = f"""**Daily Relationship Practices:**

1. **Morning:** Gratitude for partner/family
2. **During Day:** {ctx['nak_quality']} service to loved ones
3. **Evening:** Quality time without devices
4. **Weekly:** {ctx['element']} activity together
5. **Monthly:** Relationship review and reset
6. **Yearly:** Shared pilgrimage or retreat"""

        full_analysis = self._compile_sections(sections, 'Relationships')

        return {
            'category': 'relationships',
            'title': 'Your Relationships Analysis',
            'full_analysis': full_analysis,
            **sections,
            'metadata': {
                'tradition': 'Bhrigu Samhita & Nadi Jyotisha',
                'generated_at': datetime.utcnow().isoformat()
            }
        }

    # =========================================================================
    # KARMIC JOURNEY - Soul purpose and evolution (this IS the right place for soul content)
    # =========================================================================
    def generate_karmic_journey(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate KARMIC JOURNEY - soul purpose and spiritual evolution"""
        ctx = self._get_context(birth_data)

        sections = {}

        sections['soul_purpose'] = f"""Your soul incarnated through {ctx['zodiac']} with {ctx['nakshatra']} nakshatra to master {ctx['nak_quality']}.

**Core Mission:**
Express {ctx['nature']} in service to collective evolution through {ctx['nak_deity']} alignment.

**Why This Life:**
To complete {ctx['element']} element mastery and resolve {ctx['ruler']} karmic patterns.

**Soul's Intention:**
Bring {ctx['nak_quality']} into the world while achieving personal liberation."""

        sections['karmic_blueprint'] = f"""**Karmic Patterns Carried:**
- {ctx['ruler']} lessons: Power and authority balanced
- {ctx['element']} debts: Material vs spiritual resolution
- {ctx['nakshatra']} imprints: {ctx['past_life_hint']} karma

**Blueprint Reading:**
Your soul chose {ctx['zodiac']} ascendant to work through {ctx['nature']} in relationships, career, and spiritual growth.

**Key Karmic Players:**
- {ctx['ruler']}: Main teacher planet
- {ctx['nak_ruler']}: Nakshatra guide
- Saturn: Karmic enforcer"""

        sections['evolution_stage'] = f"""**Current Soul Age:** Mature Soul (60-70% evolved)

**Stage Indicators:**
- Aware of {ctx['nak_quality']} as purpose
- Working through {ctx['element']} attachments
- Developing {ctx['nature']} mastery

**Progress Markers:**
- Past: Established {ctx['ruler']} competence
- Present: Refining {ctx['nak_quality']}
- Future: Teaching others

**Remaining Journey:** 7-12 incarnations to liberation with dedicated practice."""

        sections['life_mission'] = f"""**Dharmic Path:**

**Professional Dharma:**
Apply {ctx['nak_quality']} in {ctx['nature']} fields to serve others while earning livelihood.

**Family Dharma:**
Model {ctx['element']} balance for family members. Heal ancestral {ctx['ruler']} patterns.

**Spiritual Dharma:**
Daily {ctx['nak_deity']} practice. Share {ctx['nak_quality']} wisdom when mature.

**Social Dharma:**
Contribute {ctx['nature']} to community upliftment."""

        sections['karmic_lessons'] = f"""**Primary Lessons:**

1. **{ctx['ruler']} Mastery:** Using {ctx['nature']} without ego
2. **{ctx['element']} Balance:** Neither attached nor averse
3. **{ctx['nak_quality']} Integration:** Making it practical service
4. **Detachment:** Enjoying without clinging
5. **Service:** Giving {ctx['nak_quality']} freely"""

        sections['soul_connections'] = f"""**Soul Family:**
12-20 souls traveling with you across incarnations.

**Recognition:**
- Instant knowing upon meeting
- Shared {ctx['nak_deity']} resonance
- Comfort in {ctx['nak_quality']} expression together

**Current Life Connections:**
Family, close friends, and significant teachers are soul family members appearing for mutual growth."""

        sections['timing'] = f"""**Karmic Activation Periods:**

- **Saturn Returns (29, 58):** Major restructuring
- **Jupiter Returns (12, 24, 36, 48):** Expansion windows
- **{ctx['ruler']} Dashas:** {ctx['nature']} intensification
- **Nodal Returns (18, 37, 55):** Destiny course corrections

**Current Period:** Focus on {ctx['nak_quality']} development and {ctx['element']} balancing."""

        sections['spiritual_gifts'] = f"""**Innate Abilities:**

1. **{ctx['nak_quality'].title()}:** Natural talent from past lives
2. **{ctx['nak_deity']} Connection:** Direct access through devotion
3. **{ctx['element']} Intuition:** Reading {ctx['element']} energies naturally
4. **{ctx['nature'].title()}:** Effortless expression of this quality

**Awakening These Gifts:**
Regular {ctx['nak_deity']} meditation activates dormant abilities."""

        full_analysis = self._compile_sections(sections, 'Karmic Journey')

        return {
            'category': 'karmic_journey',
            'title': 'Your Karmic Journey & Soul Purpose',
            'full_analysis': full_analysis,
            **sections,
            'metadata': {
                'tradition': 'Bhrigu Samhita & Nadi Jyotisha',
                'generated_at': datetime.utcnow().isoformat()
            }
        }

    # =========================================================================
    # PREDICTIONS - Time-based forecasts
    # =========================================================================
    def generate_predictions(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate time-based PREDICTIONS"""
        ctx = self._get_context(birth_data)
        today = datetime.now()

        sections = {}

        sections['daily'] = f"""**{today.strftime('%B %d, %Y')} Forecast:**

{ctx['element']} energy is highlighted today. Focus on {ctx['nak_quality']} activities.

**Favorable:**
- {ctx['nature'].title()} initiatives
- {ctx['nak_deity']} meditation
- {ctx['element']} element activities

**Caution:**
- Avoid {self._get_opposing_element(ctx['element'])} conflicts
- Moderate {ctx['ruler']} intensity

**Best Hours:** Morning for action, evening for reflection."""

        sections['weekly'] = f"""**This Week's Theme:** {ctx['nak_quality'].title()} Expression

**Early Week:** Build momentum in {ctx['nature']} projects
**Mid Week:** Peak energy for {ctx['element']} activities
**Weekend:** Rest and {ctx['nak_deity']} practice

**Opportunities:** {ctx['ruler']}-related matters favorable
**Challenges:** Balance {ctx['element']} drive with rest"""

        sections['monthly'] = f"""**{today.strftime('%B %Y')} Overview:**

**Theme:** Developing {ctx['nak_quality']}

**Week 1:** Foundation setting
**Week 2:** Active expansion
**Week 3:** Consolidation
**Week 4:** Review and rest

**Key Dates:** {ctx['nakshatra']} transit days most powerful
**Focus:** {ctx['nature']} advancement"""

        sections['yearly'] = f"""**{today.year} Annual Forecast:**

**Overall Theme:** Mastering {ctx['nak_quality']}

**Q1:** Foundation and planning for {ctx['nature']} goals
**Q2:** Active growth and {ctx['element']} expansion
**Q3:** Harvest and recognition
**Q4:** Consolidation and spiritual deepening

**Major Opportunities:**
- Career growth through {ctx['nak_quality']}
- Relationships deepening
- Spiritual advancement via {ctx['nak_deity']}

**Challenges to Navigate:**
- {ctx['element']} imbalances
- {ctx['ruler']} intensity management

**Year-End Position:** Significant progress in {ctx['nature']} mastery."""

        full_analysis = self._compile_sections(sections, 'Predictions')

        return {
            'category': 'predictions',
            'title': 'Your Forecasts',
            'full_analysis': full_analysis,
            **sections,
            'metadata': {
                'tradition': 'Bhrigu Samhita & Nadi Jyotisha',
                'generated_at': datetime.utcnow().isoformat()
            }
        }

    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    def _compile_sections(self, sections: Dict[str, str], category_name: str) -> str:
        """Compile sections into full analysis with proper headers"""
        parts = []
        section_titles = {
            # Past Lives
            'recent_life': 'Most Recent Past Life',
            'significant_lives': 'Significant Past Lives',
            'karmic_patterns': 'Recurring Karmic Patterns',
            'past_skills': 'Past Life Skills & Talents',
            'traumas_healing': 'Past Life Traumas Needing Healing',
            'past_relationships': 'Past Life Relationships',
            'karmic_debts': 'Karmic Debts',
            'spiritual_progress': 'Spiritual Progress',
            # Future Lives
            'next_incarnation': 'Next Incarnation',
            'evolution_trajectory': 'Evolution Trajectory',
            'final_birth_conditions': 'Final Birth Conditions',
            'future_scenarios': 'Future Scenarios',
            'moksha_timeline': 'Moksha Timeline',
            'higher_realms': 'Higher Realms Access',
            'bodhisattva_path': 'Bodhisattva Path',
            'ultimate_destiny': 'Ultimate Destiny',
            # Present Life
            'current_phase': 'Current Life Phase',
            'career': 'Career & Professional Path',
            'relationships': 'Relationships & Partnerships',
            'health': 'Health & Wellbeing',
            'finances': 'Financial Prospects',
            'spiritual_growth': 'Spiritual Growth',
            'education': 'Education & Skills',
            'life_purpose': 'Life Purpose Alignment',
            'challenges': 'Challenges & Lessons',
            'timing': 'Key Timing',
            # Life Events
            'yearly_forecast': 'Year-by-Year Forecast',
            'marriage_timing': 'Marriage Timing',
            'career_milestones': 'Career Milestones',
            'children_family': 'Children & Family',
            'financial_events': 'Financial Events',
            'health_alerts': 'Health Alerts',
            'spiritual_milestones': 'Spiritual Milestones',
            'relocations': 'Relocations & Travel',
            'favorable_periods': 'Favorable Periods',
            'challenging_periods': 'Challenging Periods',
            'transits': 'Critical Transits',
            'age_milestones': 'Age Milestones',
            # Karmic Remedies
            'mantras': 'Sacred Mantras',
            'gemstones': 'Gemstone Recommendations',
            'yantras': 'Yantras & Sacred Geometry',
            'charitable_activities': 'Charitable Activities',
            'fasting': 'Fasting & Observances',
            'deity_worship': 'Deity Worship',
            'pilgrimage': 'Pilgrimage Sites',
            'lifestyle': 'Lifestyle Practices',
            'planetary_rituals': 'Planetary Rituals',
            'karmic_cleansing': 'Karmic Cleansing',
            'service': 'Service & Seva',
            'meditation': 'Meditation Practices',
            # Relationships
            'romantic_marriage': 'Romantic & Marriage',
            'family': 'Family Dynamics',
            'soul_connections': 'Soul Connections',
            'friendships': 'Friendships',
            'professional': 'Professional Relations',
            'communication': 'Communication',
            'healing': 'Relationship Healing',
            'healthy_practices': 'Healthy Practices',
            # Karmic Journey
            'soul_purpose': "Soul's Primary Purpose",
            'karmic_blueprint': 'Karmic Blueprint',
            'evolution_stage': 'Evolution Stage',
            'life_mission': 'Life Mission & Dharma',
            'karmic_lessons': 'Karmic Lessons',
            'soul_connections': 'Soul Connections',
            'spiritual_gifts': 'Spiritual Gifts',
            # Predictions
            'daily': 'Daily Forecast',
            'weekly': 'Weekly Forecast',
            'monthly': 'Monthly Forecast',
            'yearly': 'Yearly Forecast'
        }

        for key, content in sections.items():
            title = section_titles.get(key, key.replace('_', ' ').title())
            parts.append(f"## {title}\n\n{content}")

        return '\n\n'.join(parts)

    def _generate_past_life_narratives(self, ctx: Dict) -> str:
        """Generate past life narratives based on context"""
        return f"Past lives connected to {ctx['nak_deity']} and {ctx['element']} element work."

    def _get_mantra_for_planet(self, planet: str) -> str:
        mantras = {
            'Sun': 'Om Hraam Hreem Hraum Sah Suryaya Namah',
            'Moon': 'Om Shraam Shreem Shraum Sah Chandraya Namah',
            'Mars': 'Om Kraam Kreem Kraum Sah Bhaumaya Namah',
            'Mercury': 'Om Braam Breem Braum Sah Budhaya Namah',
            'Jupiter': 'Om Graam Greem Graum Sah Gurave Namah',
            'Venus': 'Om Draam Dreem Draum Sah Shukraya Namah',
            'Saturn': 'Om Praam Preem Praum Sah Shanaye Namah'
        }
        return mantras.get(planet, 'Om Namah Shivaya')

    def _get_gemstone_for_planet(self, planet: str) -> str:
        gemstones = {
            'Sun': 'Ruby (Manikya) - 3-5 carats in gold, ring finger',
            'Moon': 'Pearl (Moti) - 5-7 carats in silver, little finger',
            'Mars': 'Red Coral (Moonga) - 6-9 carats in gold, ring finger',
            'Mercury': 'Emerald (Panna) - 3-5 carats in gold, little finger',
            'Jupiter': 'Yellow Sapphire (Pukhraj) - 3-5 carats in gold, index finger',
            'Venus': 'Diamond (Heera) - 0.5-1 carat in platinum, middle finger',
            'Saturn': 'Blue Sapphire (Neelam) - 3-5 carats in silver, middle finger'
        }
        return gemstones.get(planet, 'Clear Quartz - 5 carats in silver')

    def _get_nakshatra_stone(self, ruler: str) -> str:
        stones = {
            'Ketu': "Cat's Eye (Lehsunia)",
            'Venus': 'Diamond or White Sapphire',
            'Sun': 'Ruby',
            'Moon': 'Pearl',
            'Mars': 'Red Coral',
            'Rahu': 'Hessonite (Gomed)',
            'Jupiter': 'Yellow Sapphire',
            'Saturn': 'Blue Sapphire',
            'Mercury': 'Emerald'
        }
        return stones.get(ruler, 'Clear Quartz')

    def _get_charity_items(self, planet: str) -> str:
        charity = {
            'Sun': 'wheat, jaggery, copper, red cloth',
            'Moon': 'rice, milk, white cloth, silver',
            'Mars': 'red lentils, copper, red cloth',
            'Mercury': 'green vegetables, books, emerald-colored items',
            'Jupiter': 'yellow cloth, turmeric, gold, bananas',
            'Venus': 'white items, sugar, silk, perfume',
            'Saturn': 'black sesame, iron, mustard oil, blue/black cloth'
        }
        return charity.get(planet, 'food to the needy')

    def _get_fasting_day(self, planet: str) -> str:
        days = {
            'Sun': 'Sunday',
            'Moon': 'Monday',
            'Mars': 'Tuesday',
            'Mercury': 'Wednesday',
            'Jupiter': 'Thursday',
            'Venus': 'Friday',
            'Saturn': 'Saturday'
        }
        return days.get(planet, 'Ekadashi')

    def _get_planet_deity(self, planet: str) -> str:
        deities = {
            'Sun': 'Lord Surya/Vishnu',
            'Moon': 'Lord Shiva/Goddess Parvati',
            'Mars': 'Lord Hanuman/Kartikeya',
            'Mercury': 'Lord Vishnu/Goddess Saraswati',
            'Jupiter': 'Lord Brihaspati/Dakshinamurthy',
            'Venus': 'Goddess Lakshmi/Goddess Mahalakshmi',
            'Saturn': 'Lord Shani/Lord Hanuman'
        }
        return deities.get(planet, 'Lord Ganesha')

    def _get_opposing_element(self, element: str) -> str:
        opposites = {
            'Fire': 'Water',
            'Water': 'Fire',
            'Earth': 'Air',
            'Air': 'Earth'
        }
        return opposites.get(element, 'opposing')

    # =========================================================================
    # MAIN GENERATION METHOD
    # =========================================================================
    def generate(self, category: str, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main method to generate category-specific predictions"""
        generators = {
            'past_lives': self.generate_past_lives,
            'future_lives': self.generate_future_lives,
            'present_life': self.generate_present_life,
            'life_events': self.generate_life_events,
            'karmic_remedies': self.generate_karmic_remedies,
            'relationships': self.generate_relationships,
            'karmic_journey': self.generate_karmic_journey,
            'predictions': self.generate_predictions
        }

        generator = generators.get(category)
        if generator:
            return generator(birth_data)

        # Fallback
        return {
            'category': category,
            'full_analysis': f'Predictions for {category} category.',
            'metadata': {'generated_at': datetime.utcnow().isoformat()}
        }


# Singleton instance
_category_predictor = None

def get_category_specific_predictor() -> CategorySpecificOfflinePredictions:
    """Get singleton instance of category-specific predictor"""
    global _category_predictor
    if _category_predictor is None:
        _category_predictor = CategorySpecificOfflinePredictions()
    return _category_predictor

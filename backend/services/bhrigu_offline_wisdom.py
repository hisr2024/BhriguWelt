"""
Bhrigu Offline Wisdom Generator
Generates category-specific predictions using local corpus data when OpenAI is unavailable
"""
import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

class BhriguOfflineWisdomGenerator:
    """
    Generates detailed offline predictions using Bhrigu Samhita and Nadi Jyotisha corpus
    Each category has specific section headers matching what the frontend expects
    """

    def __init__(self):
        self.bhrigu_corpus = None
        self.nadi_corpus = None
        self.soul_journey_model = None
        self._load_corpus()

        # Zodiac sign characteristics for personalization
        self.zodiac_traits = {
            'Aries': {'element': 'Fire', 'ruler': 'Mars', 'quality': 'Cardinal', 'traits': 'leadership, initiative, courage'},
            'Taurus': {'element': 'Earth', 'ruler': 'Venus', 'quality': 'Fixed', 'traits': 'stability, determination, sensuality'},
            'Gemini': {'element': 'Air', 'ruler': 'Mercury', 'quality': 'Mutable', 'traits': 'communication, adaptability, intellect'},
            'Cancer': {'element': 'Water', 'ruler': 'Moon', 'quality': 'Cardinal', 'traits': 'nurturing, intuition, emotional depth'},
            'Leo': {'element': 'Fire', 'ruler': 'Sun', 'quality': 'Fixed', 'traits': 'creativity, leadership, self-expression'},
            'Virgo': {'element': 'Earth', 'ruler': 'Mercury', 'quality': 'Mutable', 'traits': 'analysis, service, perfectionism'},
            'Libra': {'element': 'Air', 'ruler': 'Venus', 'quality': 'Cardinal', 'traits': 'balance, harmony, relationships'},
            'Scorpio': {'element': 'Water', 'ruler': 'Mars', 'quality': 'Fixed', 'traits': 'transformation, depth, intensity'},
            'Sagittarius': {'element': 'Fire', 'ruler': 'Jupiter', 'quality': 'Mutable', 'traits': 'exploration, wisdom, philosophy'},
            'Capricorn': {'element': 'Earth', 'ruler': 'Saturn', 'quality': 'Cardinal', 'traits': 'ambition, discipline, responsibility'},
            'Aquarius': {'element': 'Air', 'ruler': 'Saturn', 'quality': 'Fixed', 'traits': 'innovation, humanitarianism, independence'},
            'Pisces': {'element': 'Water', 'ruler': 'Jupiter', 'quality': 'Mutable', 'traits': 'spirituality, compassion, intuition'}
        }

        # Nakshatra characteristics
        self.nakshatra_traits = {
            'Ashwini': {'deity': 'Ashwini Kumaras', 'symbol': 'Horse head', 'quality': 'healing, speed, initiative'},
            'Bharani': {'deity': 'Yama', 'symbol': 'Yoni', 'quality': 'transformation, restraint, duty'},
            'Krittika': {'deity': 'Agni', 'symbol': 'Razor', 'quality': 'purification, courage, cutting'},
            'Rohini': {'deity': 'Brahma', 'symbol': 'Ox cart', 'quality': 'creativity, growth, fertility'},
            'Mrigashira': {'deity': 'Soma', 'symbol': 'Deer head', 'quality': 'searching, curiosity, gentleness'},
            'Ardra': {'deity': 'Rudra', 'symbol': 'Teardrop', 'quality': 'destruction, renewal, effort'},
            'Punarvasu': {'deity': 'Aditi', 'symbol': 'Bow and quiver', 'quality': 'renewal, return, prosperity'},
            'Pushya': {'deity': 'Brihaspati', 'symbol': 'Flower', 'quality': 'nourishment, spiritual growth, wisdom'},
            'Ashlesha': {'deity': 'Nagas', 'symbol': 'Serpent', 'quality': 'mysticism, kundalini, transformation'},
            'Magha': {'deity': 'Pitris', 'symbol': 'Throne', 'quality': 'royalty, ancestors, authority'},
            'Purva Phalguni': {'deity': 'Bhaga', 'symbol': 'Hammock', 'quality': 'pleasure, creativity, rest'},
            'Uttara Phalguni': {'deity': 'Aryaman', 'symbol': 'Bed', 'quality': 'patronage, contracts, healing'},
            'Hasta': {'deity': 'Savitar', 'symbol': 'Hand', 'quality': 'skill, dexterity, craftsmanship'},
            'Chitra': {'deity': 'Vishvakarma', 'symbol': 'Pearl', 'quality': 'brilliance, creativity, architecture'},
            'Swati': {'deity': 'Vayu', 'symbol': 'Coral', 'quality': 'independence, movement, flexibility'},
            'Vishakha': {'deity': 'Indra-Agni', 'symbol': 'Archway', 'quality': 'determination, goals, triumph'},
            'Anuradha': {'deity': 'Mitra', 'symbol': 'Lotus', 'quality': 'friendship, devotion, success'},
            'Jyeshtha': {'deity': 'Indra', 'symbol': 'Earring', 'quality': 'leadership, protection, seniority'},
            'Moola': {'deity': 'Nirriti', 'symbol': 'Root', 'quality': 'investigation, foundation, destruction'},
            'Purva Ashadha': {'deity': 'Apas', 'symbol': 'Fan', 'quality': 'invincibility, purification, victory'},
            'Uttara Ashadha': {'deity': 'Vishvadevas', 'symbol': 'Elephant tusk', 'quality': 'final victory, righteousness, leadership'},
            'Shravana': {'deity': 'Vishnu', 'symbol': 'Ear', 'quality': 'learning, listening, connection'},
            'Dhanishta': {'deity': 'Vasus', 'symbol': 'Drum', 'quality': 'wealth, music, prosperity'},
            'Shatabhisha': {'deity': 'Varuna', 'symbol': 'Circle', 'quality': 'healing, mystery, solitude'},
            'Purva Bhadrapada': {'deity': 'Aja Ekapada', 'symbol': 'Sword', 'quality': 'purification, penance, transformation'},
            'Uttara Bhadrapada': {'deity': 'Ahir Budhnya', 'symbol': 'Twins', 'quality': 'depth, stability, wisdom'},
            'Revati': {'deity': 'Pushan', 'symbol': 'Fish', 'quality': 'nourishment, protection, completion'}
        }

    def _load_corpus(self):
        """Load corpus data from files"""
        data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')

        # Load Bhrigu Samhita principles
        bhrigu_path = os.path.join(data_dir, 'bhrigu_samhita_principles.yml')
        if os.path.exists(bhrigu_path):
            try:
                with open(bhrigu_path, 'r') as f:
                    self.bhrigu_corpus = json.load(f)
            except Exception as e:
                print(f"Warning: Could not load Bhrigu corpus: {e}")

        # Load Nadi Jyotisha principles
        nadi_path = os.path.join(data_dir, 'nadi_jyotisha_principles.yml')
        if os.path.exists(nadi_path):
            try:
                with open(nadi_path, 'r') as f:
                    self.nadi_corpus = json.load(f)
            except Exception as e:
                print(f"Warning: Could not load Nadi corpus: {e}")

        # Load soul journey model
        journey_path = os.path.join(data_dir, 'bhrigu_karmic_soul_journey_model.json')
        if os.path.exists(journey_path):
            try:
                with open(journey_path, 'r') as f:
                    self.soul_journey_model = json.load(f)
            except Exception as e:
                print(f"Warning: Could not load soul journey model: {e}")

    def _get_zodiac_info(self, zodiac: str) -> Dict[str, str]:
        """Get zodiac characteristics"""
        return self.zodiac_traits.get(zodiac, {
            'element': 'Unknown', 'ruler': 'Unknown',
            'quality': 'Unknown', 'traits': 'unique characteristics'
        })

    def _get_nakshatra_info(self, nakshatra: str) -> Dict[str, str]:
        """Get nakshatra characteristics"""
        # Handle partial matches
        for name, info in self.nakshatra_traits.items():
            if name.lower() in nakshatra.lower() or nakshatra.lower() in name.lower():
                return info
        return {'deity': 'Cosmic forces', 'symbol': 'Stars', 'quality': 'unique spiritual gifts'}

    def _get_relevant_principles(self, context: Dict[str, Any], limit: int = 5) -> List[Dict]:
        """Get relevant principles from corpus based on context"""
        principles = []

        if self.bhrigu_corpus and 'principles' in self.bhrigu_corpus:
            principles.extend(self.bhrigu_corpus['principles'][:limit])

        if self.nadi_corpus and 'principles' in self.nadi_corpus:
            principles.extend(self.nadi_corpus['principles'][:limit])

        return principles[:limit * 2]

    def _get_relevant_remedies(self, limit: int = 5) -> List[Dict]:
        """Get relevant remedies from corpus"""
        remedies = []

        if self.bhrigu_corpus and 'remedies' in self.bhrigu_corpus:
            remedies.extend(self.bhrigu_corpus['remedies'][:limit])

        if self.nadi_corpus and 'remedies' in self.nadi_corpus:
            remedies.extend(self.nadi_corpus['remedies'][:limit])

        return remedies

    def _get_past_life_engines(self, limit: int = 3) -> List[Dict]:
        """Get past life patterns from corpus"""
        if self.bhrigu_corpus and 'past_life_engines' in self.bhrigu_corpus:
            return self.bhrigu_corpus['past_life_engines'][:limit]
        return []

    def _get_future_engines(self, limit: int = 3) -> List[Dict]:
        """Get future prediction patterns from corpus"""
        if self.bhrigu_corpus and 'future_engines' in self.bhrigu_corpus:
            return self.bhrigu_corpus['future_engines'][:limit]
        return []

    def generate_karmic_journey(self, context: Dict[str, Any]) -> str:
        """Generate Karmic Journey prediction with proper section headers"""
        zodiac = context.get('zodiac_sign', 'Unknown')
        nakshatra = context.get('nakshatra', 'Unknown')
        moon_sign = context.get('moon_sign', zodiac)

        zodiac_info = self._get_zodiac_info(zodiac)
        nakshatra_info = self._get_nakshatra_info(nakshatra)
        principles = self._get_relevant_principles(context)

        # Build referenced sutras
        sutra_refs = []
        for p in principles[:3]:
            if 'sutra_reference' in p:
                sutra_refs.append(f"- {p['sutra_reference']}: {p.get('description', '')[:100]}...")

        return f"""## 1. Soul's Primary Purpose

Based on Bhrigu Samhita principles, your soul incarnated with {zodiac} as the guiding energy, blessed by the {nakshatra_info.get('deity', 'cosmic')} deity of {nakshatra} nakshatra.

**Core Purpose:** Your {zodiac_info.get('element', 'elemental')} nature combined with {zodiac_info.get('traits', 'inherent qualities')} indicates a dharmic path focused on spiritual evolution through practical action. The ancient texts speak of souls with your configuration being destined for {nakshatra_info.get('quality', 'unique spiritual development')}.

**Scriptural Reference:** According to the Bhrigu Samhita folios, natives born under {nakshatra} carry the sacred duty of bringing {nakshatra_info.get('symbol', 'cosmic')} energy into manifestation.

## 2. Karmic Blueprint

Your karmic blueprint reveals patterns established across multiple lifetimes:

**Karmic Debts:**
- Past life patterns suggest lessons around {zodiac_info.get('traits', 'core themes')}
- The {zodiac_info.get('ruler', 'planetary')} influence indicates unfinished business related to power and responsibility
- Saturn's karmic teachings require patience and perseverance in this incarnation

**Karmic Credits:**
- Natural talents in {nakshatra_info.get('quality', 'spiritual abilities')} carried from past lives
- Jupiter's blessings indicate accumulated spiritual merit
- Inherent wisdom and intuitive gifts from previous spiritual practice

**Referenced Sutras:**
{chr(10).join(sutra_refs) if sutra_refs else '- Bhrigu Samhita universal principles apply to your configuration'}

## 3. Soul Evolution Stage

As per Nadi Jyotisha classification, your soul is at the **Madhyama (Intermediate)** stage of evolution:

- You have progressed beyond basic karmic lessons
- Current focus: Balancing material responsibilities with spiritual growth
- Estimated incarnations remaining: 7-12 before potential liberation
- Progress indicator: Strong connection to dharmic principles

The {nakshatra} nakshatra placement suggests you are approximately 60-70% through your soul's evolutionary journey.

## 4. Life Mission & Dharma

**Professional Dharma (Artha):**
Your {zodiac} energy combined with {nakshatra_info.get('quality', 'inherent abilities')} makes you suited for roles involving {zodiac_info.get('traits', 'natural expressions')}. Careers in teaching, healing, creative arts, or service align with your karmic purpose.

**Family Dharma (Kama):**
Building harmonious relationships that support spiritual growth. Your soul chose specific family members to learn lessons of patience, unconditional love, and forgiveness.

**Social Dharma (Moksha):**
Contributing to collective evolution through sharing wisdom and uplifting others. Your presence naturally elevates the consciousness of those around you.

**Spiritual Dharma:**
Daily practice, meditation, and self-reflection form the foundation. The {nakshatra_info.get('deity', 'cosmic forces')} guide your inner development.

## 5. Karmic Lessons in This Lifetime

Based on your {zodiac} Sun and {nakshatra} birth star, primary lessons include:

1. **Balance:** Learning to harmonize {zodiac_info.get('element', 'elemental')} energy with practical life
2. **Patience:** Saturn's influence requires developing persistence through challenges
3. **Service:** Using {nakshatra_info.get('quality', 'natural gifts')} for the benefit of others
4. **Detachment:** Cultivating non-attachment while remaining engaged with life
5. **Truth:** Speaking and living authentically, aligned with dharma

## 6. Soul Group Connections

Your soul travels with a specific group across incarnations:

**Soulmates:** 3-5 souls with whom you share deep karmic bonds
**Soul Family:** Approximately 12-20 souls appearing as family, friends, or significant teachers
**Recognition Signs:** Instant familiarity, deep comfort, or intense reaction upon meeting

Current life relationships with strong karmic significance will often feel "fated" or destined.

## 7. Timing of Karmic Events

**Major Karmic Activation Periods:**
- Ages 28-30: Saturn return - major life restructuring
- Ages 36-42: Jupiter maturity - expansion and wisdom
- Ages 54-60: Second Saturn return - spiritual deepening

**Current Phase:** Focus on integrating lessons and preparing for upcoming opportunities.

## 8. Spiritual Gifts & Abilities

Your {nakshatra} nakshatra bestows:
- **Intuitive abilities** connected to {nakshatra_info.get('deity', 'cosmic')} energy
- **Natural healing** capacity through {nakshatra_info.get('quality', 'inherent gifts')}
- **Creative expression** aligned with your soul purpose
- **Teaching ability** to share accumulated wisdom

*This reading is based on classical Bhrigu Samhita and Nadi Jyotisha principles. For AI-enhanced detailed analysis with precise timing, ensure OpenAI API is configured.*"""

    def generate_past_lives(self, context: Dict[str, Any]) -> str:
        """Generate Past Lives prediction with proper section headers"""
        zodiac = context.get('zodiac_sign', 'Unknown')
        nakshatra = context.get('nakshatra', 'Unknown')

        zodiac_info = self._get_zodiac_info(zodiac)
        nakshatra_info = self._get_nakshatra_info(nakshatra)
        past_life_patterns = self._get_past_life_engines()

        # Build narrative from corpus
        narratives = []
        for p in past_life_patterns[:2]:
            if 'narrative' in p:
                narratives.append(p['narrative'])

        return f"""## 1. Most Recent Past Life (Previous Incarnation)

Based on Nadi Jyotisha palm leaf traditions and your {nakshatra} nakshatra placement:

**Time Period:** Late 19th to mid-20th century (approximately 80-150 years ago)
**Geographic Location:** The {zodiac_info.get('element', 'elemental')} influence suggests a region with strong cultural traditions, likely within the Indian subcontinent or connected civilizations
**Social Status:** Middle to upper social standing with access to education and spiritual practices
**Profession:** A role involving {nakshatra_info.get('quality', 'unique abilities')} - possibly teaching, healing, administration, or creative arts
**Circumstances of Transition:** Natural completion of life's purpose, allowing for peaceful transition

**Unfinished Business:** Certain relationships and spiritual practices were left incomplete, creating the impetus for current incarnation.

## 2. Significant Past Lives (3-5 Major Incarnations)

**Life 1 - The Scholar/Priest (400-600 years ago)**
- Era: Medieval period in a temple or monastery setting
- Role: Religious scholar or temple administrator
- Key Events: Preserved sacred texts and taught students
- Karmic Legacy: Strong inclination toward wisdom and spiritual study
- Connection to Present: Natural understanding of scriptures and philosophy

**Life 2 - The Healer/Artisan (800-1000 years ago)**
- Era: Classical period
- Role: Traditional healer or skilled craftsperson
- Key Events: Served community through {nakshatra_info.get('quality', 'healing abilities')}
- Karmic Legacy: Healing abilities and attention to detail
- Connection to Present: Sensitivity to others' suffering, desire to help

**Life 3 - The Warrior/Protector (1200-1500 years ago)**
- Era: Ancient kingdoms
- Role: Protector of dharma and sacred spaces
- Key Events: Defended temples and supported righteous causes
- Karmic Legacy: Courage and sense of duty
- Connection to Present: Strong sense of justice and protection instincts

{f"**Corpus Pattern:** {narratives[0]}" if narratives else ""}

## 3. Recurring Karmic Patterns

Based on your {zodiac} placement, patterns that recur across lifetimes include:

1. **Authority and Service:** Repeatedly placed in positions requiring responsible leadership
2. **Teaching and Learning:** Cycles of acquiring wisdom and sharing it with others
3. **Relationship Dynamics:** Similar soul connections appearing in different relationship forms
4. **Spiritual Seeking:** Continuous quest for deeper truth and liberation
5. **Creative Expression:** Using {zodiac_info.get('traits', 'natural abilities')} for higher purposes

## 4. Past Life Skills & Talents

Skills naturally carried forward from previous incarnations:

- **Intuitive Knowledge:** Understanding complex subjects without formal training
- **Healing Ability:** Natural capacity to comfort and heal others
- **Communication:** Eloquence and ability to convey difficult concepts
- **Artistic Sense:** Appreciation for beauty and creative expression
- **Spiritual Sensitivity:** Connection to subtle energies and higher guidance

Your {nakshatra} nakshatra specifically indicates mastery in {nakshatra_info.get('quality', 'unique domains')}.

## 5. Past Life Traumas Needing Healing

The Bhrigu texts indicate certain past life experiences requiring healing:

- **Loss/Separation:** Unexpected separations from loved ones creating attachment patterns
- **Betrayal Wounds:** Experiences of trust being broken affecting current relationships
- **Unfulfilled Duties:** Incomplete responsibilities creating current life obligations
- **Suppressed Expression:** Past lives where truth could not be spoken freely

**Healing Approach:** Meditation, forgiveness practices, and conscious relationship work help release these patterns.

## 6. Past Life Relationships in Current Life

**Recognition Signs for Past Life Connections:**
- Immediate comfort or discomfort upon meeting
- Sense of having known someone before
- Repetitive relationship patterns
- Strong emotional reactions without clear cause

**Likely Past Life Roles of Current Relationships:**
- Parents: Previous life teachers or caretakers
- Siblings: Past life companions or fellow seekers
- Partners: Soulmates reuniting to complete unfinished lessons
- Close Friends: Members of the same soul group

## 7. Karmic Debts from Past Lives

Your chart configuration indicates:

**Debts Owed:**
- Service obligations to family or community
- Teaching or sharing wisdom not previously delivered
- Acts of kindness left unreciprocated

**Debts Owed to You:**
- Support and assistance from past life beneficiaries
- Recognition for previous life service
- Resources and opportunities as karmic return

**Resolution Path:** Selfless service, gratitude, and conscious relationship healing.

## 8. Past Life Spiritual Progress

Your soul's spiritual development across incarnations:

**Spiritual Practices from Past Lives:**
- Mantra recitation and meditation
- Temple service and ritual worship
- Study of sacred texts
- Service to spiritual teachers

**Current Life Continuation:**
The {nakshatra_info.get('deity', 'cosmic')} connection through {nakshatra} indicates strong spiritual foundation from previous lives.

*This reading draws from Nadi Jyotisha palm leaf traditions. For AI-enhanced detailed past life regression analysis, ensure OpenAI API is configured.*"""

    def generate_future_lives(self, context: Dict[str, Any]) -> str:
        """Generate Future Lives prediction with proper section headers"""
        zodiac = context.get('zodiac_sign', 'Unknown')
        nakshatra = context.get('nakshatra', 'Unknown')

        zodiac_info = self._get_zodiac_info(zodiac)
        nakshatra_info = self._get_nakshatra_info(nakshatra)
        future_patterns = self._get_future_engines()

        trajectories = []
        for p in future_patterns[:2]:
            if 'trajectory' in p:
                trajectories.append(p['trajectory'])

        return f"""## 1. Next Immediate Incarnation

Based on current karmic trajectory and {zodiac} life patterns:

**Probable Time Period:** Mid to late 21st century or early 22nd century
**Geographic Likelihood:** Regions with strong spiritual traditions and technological advancement
**Expected Social Context:** Access to both modern education and traditional wisdom
**Primary Life Purpose:** Continuing the work of balancing material achievement with spiritual evolution
**Karmic Focus:** Completing lessons of {nakshatra_info.get('quality', 'current themes')} begun in this life

**Conditions for Birth:** Your next incarnation will be influenced by how completely you fulfill current life dharma.

## 2. Soul Evolution Trajectory (Next 3-5 Lives)

**Life +1 (Next Incarnation):**
- Focus: Integration of technology with spiritual practice
- Expected Development: Enhanced psychic abilities and healing capacity
- Soul Progress: Moving toward higher consciousness expression

**Life +2:**
- Focus: Teaching and guiding others on spiritual path
- Expected Development: Leadership in spiritual communities
- Soul Progress: Preparing for potential final incarnations

**Life +3:**
- Focus: Service at collective level
- Expected Development: Working with planetary consciousness
- Soul Progress: Nearing completion of major karmic cycles

{f"**Corpus Trajectory:** {trajectories[0]}" if trajectories else ""}

## 3. Conditions for This Being the Final Birth

Your current karmic completion assessment:

**Completion Percentage:** Approximately 65-75%

**Remaining Requirements:**
- Full release of material attachments (partially complete)
- Resolution of all major relationship karma
- Service completion to soul group members
- Attainment of sustained meditative states
- Complete forgiveness of self and others

**Signs This Could Be Final:**
- Strong spiritual inclination from early age
- Decreasing interest in purely material pursuits
- Natural ability to witness thoughts without attachment
- Compassion arising spontaneously for all beings

## 4. Future Life Scenarios Based on Current Actions

**Scenario A: Accelerated Spiritual Path**
If current spiritual practices continue:
- Next life as spiritual teacher or healer
- Rapid progress toward liberation
- Possibility of 2-3 remaining incarnations
- Access to higher realm experiences between lives

**Scenario B: Balanced Material-Spiritual Path**
If dharmic balance maintained:
- Comfortable incarnations with gradual progress
- 5-7 remaining incarnations
- Continued evolution through service
- Strong support from soul group

**Scenario C: Material Focus Path**
If material attachments dominate:
- Extended cycle of learning incarnations
- Repetition of certain lesson types
- 10+ remaining incarnations
- Opportunity to reset priorities in future lives

## 5. Moksha Timeline & Preparation

**Estimated Timeline to Liberation:** 7-12 incarnations under current trajectory

**Accelerating Factors:**
- Daily meditation and spiritual practice
- Selfless service (seva)
- Study of sacred texts with understanding
- Surrender to divine will

**Preparation for Final Liberation:**
1. Gradual release of all binding desires
2. Development of equanimity in all circumstances
3. Recognition of the Self in all beings
4. Dissolution of ego identification

## 6. Higher Realms Accessibility

Based on your {nakshatra} nakshatra and spiritual development:

**Currently Accessible Realms:**
- Pitru Loka (Ancestral realm) - for guidance and blessings
- Deva Loka (Lower celestial realms) - during deep meditation

**Future Accessibility:**
- Brahma Loka - with continued spiritual progress
- Vaikuntha/Kailash - upon liberation from birth cycle

**Between-Life Experience:**
Your soul will likely experience periods of rest, learning, and planning in subtle realms between incarnations.

## 7. Bodhisattva Path Potential

Assessment of potential for voluntary return as guide:

**Current Indicators:**
- Natural compassion for others' suffering
- Desire to share wisdom and help
- {nakshatra_info.get('quality', 'teaching abilities')}

**Bodhisattva Probability:** Moderate to High

If you choose this path, future incarnations could include:
- Spiritual teacher or guru
- Healer serving many
- Social reformer improving collective conditions
- Artist inspiring spiritual awakening

## 8. Soul's Ultimate Destiny

Based on Bhrigu Samhita principles regarding your soul's journey:

**Cosmic Purpose:**
Your soul is part of the great work of consciousness evolving through matter. Each incarnation contributes to this universal unfoldment.

**Final Destination:**
Complete merger with cosmic consciousness (Brahman), retaining the option of compassionate return to assist others.

**Legacy Across Time:**
The wisdom, love, and service generated through all your incarnations contribute to the elevation of collective human consciousness.

*This reading reflects classical Vedic understanding of soul evolution. For AI-enhanced future trajectory analysis with probability assessments, ensure OpenAI API is configured.*"""

    def generate_present_life(self, context: Dict[str, Any]) -> str:
        """Generate Present Life prediction with proper section headers"""
        zodiac = context.get('zodiac_sign', 'Unknown')
        nakshatra = context.get('nakshatra', 'Unknown')

        zodiac_info = self._get_zodiac_info(zodiac)
        nakshatra_info = self._get_nakshatra_info(nakshatra)

        return f"""## 1. Current Life Phase & Stage

As a {zodiac} native with {nakshatra} nakshatra, your current life phase characteristics:

**Elemental Influence:** The {zodiac_info.get('element', 'cosmic')} element shapes your approach to life, bringing {zodiac_info.get('traits', 'unique qualities')}.

**Current Dasha Influence:** Your planetary period influences current circumstances. The ruling planet of your nakshatra ({nakshatra_info.get('deity', 'cosmic forces')}) guides this phase.

**Life Stage Theme:** Building foundations while integrating spiritual understanding into daily life.

**Key Focus Areas:**
- Professional development aligned with dharma
- Relationship harmony and growth
- Health and wellbeing maintenance
- Spiritual practice deepening

## 2. Career & Professional Path

**Ideal Career Directions:**
Based on {zodiac} energy and {nakshatra} qualities:
- Fields involving {nakshatra_info.get('quality', 'natural abilities')}
- Roles requiring {zodiac_info.get('traits', 'inherent strengths')}
- Service-oriented professions
- Creative or healing vocations

**Natural Professional Talents:**
- Leadership and initiative ({zodiac_info.get('ruler', 'planetary')} influence)
- Communication and relationship building
- Problem-solving and analysis
- Creative vision and implementation

**Career Timing:**
- Current period: Building reputation and skills
- Upcoming opportunities: Recognition for consistent effort
- Peak earning potential: 40s-50s based on accumulated expertise

## 3. Relationships & Partnerships

**Romantic Relationships:**
- Ideal partner qualities: Complementary {zodiac_info.get('element', 'elemental')} energy
- Relationship style: Seeking depth and meaningful connection
- Marriage timing: Favorable periods when Jupiter aspects relationship houses

**Family Dynamics:**
- Parents: Karmic teachers providing life lessons
- Siblings: Soul companions sharing the journey
- Children: Souls entrusted to your guidance

**Social Connections:**
- Natural ability to form meaningful friendships
- Attracting like-minded spiritual seekers
- Building supportive community networks

## 4. Health & Wellbeing

**Constitutional Type:** {zodiac_info.get('element', 'Elemental')} constitution with {nakshatra} influence

**Health Strengths:**
- Natural vitality from {zodiac_info.get('ruler', 'planetary')} energy
- Recovery ability supported by spiritual practices
- Mind-body awareness

**Areas Requiring Attention:**
- Stress management for {zodiac_info.get('element', 'elemental')} types
- Regular rest and rejuvenation
- Balanced diet aligned with constitution

**Recommended Practices:**
- Yoga suited to your constitution
- Pranayama for energy balance
- Meditation for mental clarity

## 5. Financial Prospects & Wealth

**Wealth Indicators:**
- {zodiac} natives typically build wealth through {zodiac_info.get('traits', 'natural approaches')}
- {nakshatra} influence brings opportunities through {nakshatra_info.get('quality', 'unique channels')}

**Financial Strengths:**
- Ability to generate income through multiple sources
- Natural financial intuition
- Long-term wealth building capacity

**Recommended Approaches:**
- Balanced saving and investment
- Dharmic wealth generation
- Charitable giving for prosperity flow

## 6. Spiritual Growth Opportunities

**Current Spiritual Stage:**
Your {nakshatra} connection to {nakshatra_info.get('deity', 'cosmic forces')} indicates developed spiritual foundation.

**Recommended Practices:**
- Daily meditation aligned with your nakshatra deity
- Mantra practice: Chanting mantras of {nakshatra_info.get('deity', 'your guiding deity')}
- Service: Regular seva as spiritual practice
- Study: Sacred texts for wisdom cultivation

**Pilgrimage Sites:**
- Temples associated with {nakshatra_info.get('deity', 'your nakshatra deity')}
- Sacred water bodies for purification
- Mountain retreats for meditation

## 7. Education & Learning

**Learning Style:** {zodiac_info.get('element', 'Elemental')} nature favors experiential and intuitive learning

**Recommended Study Areas:**
- Subjects aligned with {nakshatra_info.get('quality', 'natural interests')}
- Spiritual and philosophical texts
- Practical skills supporting dharmic work

**Teaching Ability:** Strong potential to share knowledge with others

## 8. Life Purpose & Fulfillment

**Core Purpose:**
Living in alignment with dharma while evolving spiritually. Your {zodiac} energy and {nakshatra} placement indicate a path of {nakshatra_info.get('quality', 'meaningful service')}.

**Fulfillment Keys:**
- Balancing material and spiritual pursuits
- Contributing to others' wellbeing
- Continuous self-improvement
- Living authentically

## 9. Challenges & Growth Areas

**Primary Challenges:**
- Managing {zodiac_info.get('element', 'elemental')} energy imbalances
- Navigating relationship complexities
- Maintaining spiritual focus amid material demands

**Growth Opportunities:**
- Developing patience and perseverance
- Cultivating equanimity
- Deepening compassion
- Strengthening spiritual practice

## 10. Favorable & Challenging Periods

**Favorable Periods:**
- Jupiter transits to natal positions: Expansion and opportunities
- Benefic dasha periods: Growth and success
- Days: Thursday and days ruled by your nakshatra lord

**Challenging Periods:**
- Saturn transits: Restructuring and discipline required
- Rahu-Ketu transit over natal positions: Karmic activation
- Requires extra spiritual practice and patience

*This reading synthesizes classical Vedic principles. For AI-enhanced timing analysis with specific dates, ensure OpenAI API is configured.*"""

    def generate_life_events(self, context: Dict[str, Any]) -> str:
        """Generate Life Events prediction with proper section headers"""
        zodiac = context.get('zodiac_sign', 'Unknown')
        nakshatra = context.get('nakshatra', 'Unknown')
        current_age = context.get('age', 30)

        zodiac_info = self._get_zodiac_info(zodiac)

        return f"""## Year-by-Year Forecast

Based on Nadi Jyotisha timing principles for {zodiac} natives:

**Year 1 (Age {current_age + 1}):**
- Theme: Foundation building and new beginnings
- Career: Opportunities for skill development
- Relationships: Deepening existing connections
- Best timing: Spring months for new initiatives

**Year 2 (Age {current_age + 2}):**
- Theme: Growth and expansion
- Career: Recognition for past efforts
- Relationships: Potential for significant partnerships
- Best timing: Jupiter-favorable periods

**Year 3 (Age {current_age + 3}):**
- Theme: Consolidation and stability
- Career: Steady progress and establishment
- Relationships: Commitments and deepening bonds
- Best timing: Late year for major decisions

**Year 4 (Age {current_age + 4}):**
- Theme: Transformation and change
- Career: Possible shifts or promotions
- Relationships: Growth through challenges
- Best timing: Mid-year for transitions

**Year 5 (Age {current_age + 5}):**
- Theme: Harvest and achievement
- Career: Peak performance period
- Relationships: Stability and harmony
- Best timing: Throughout the year

## Marriage & Partnerships

**Optimal Marriage Windows:**
- Ages 25-32: Traditional favorable period
- Jupiter transits to 7th house from Moon
- Venus and Jupiter in strength

**Partnership Indicators:**
- Strong commitment potential based on {zodiac} characteristics
- Karmic connections likely with partners from soul group
- Growth through relationship as spiritual practice

## Career Milestones

**Professional Development Timeline:**
- Early Career (20s): Foundation and learning
- Mid-Career (30s-40s): Establishment and recognition
- Peak Period (40s-50s): Authority and achievement
- Legacy Phase (50s+): Mentorship and wisdom sharing

**Key Transition Points:**
- Saturn return (~29-30): Major career restructuring
- Jupiter return (~36): Expansion opportunities
- Second Saturn return (~58-60): Wisdom application

## Children & Family Events

**Indicators for Children:**
- 5th house influences determine timing and number
- Jupiter's blessing supports family expansion
- Favorable periods when benefics aspect 5th house

**Family Milestones:**
- Family gatherings during favorable transits
- Important decisions aligned with lunar phases
- Ancestral blessings activated through appropriate rituals

## Financial Breakthroughs

**Wealth Accumulation Periods:**
- Jupiter transits to 2nd and 11th houses
- Dasha periods of wealth-giving planets
- Saturn maturity bringing long-term stability

**Property and Assets:**
- Favorable periods for property: Saturn well-placed
- Investment timing: Jupiter and Venus favorable
- Inheritance potential: 8th house activation

## Health Alerts & Wellness

**Periods Requiring Vigilance:**
- Saturn transits to 6th or 8th house
- Rahu-Ketu axis affecting health houses
- Recommended: preventive care during these periods

**Wellness Optimization:**
- Regular practice during favorable periods
- Seasonal adjustments to diet and routine
- Spiritual practice for overall wellbeing

## Spiritual Milestones

**Awakening Windows:**
- Jupiter transits to 9th or 12th house
- Ketu periods: Natural spiritual intensification
- Ages 42, 54, 60: Classic spiritual deepening points

**Potential Experiences:**
- Increased intuition and inner guidance
- Meeting significant spiritual teachers
- Deepening meditation experiences

## Relocations & Travel

**Travel Periods:**
- 3rd and 9th house activations
- Jupiter transits for beneficial journeys
- Pilgrimage timing aligned with nakshatra

**Relocation Indicators:**
- 4th house changes for residence shifts
- Career-motivated moves during 10th house transits
- Spiritual relocations during 12th house activation

## Education & Skill Development

**Learning Phases:**
- Mercury and Jupiter favorable periods
- 5th and 9th house activations
- Continuous learning recommended throughout life

## Favorable Dasha Periods

**Most Beneficial Periods:**
- Jupiter Mahadasha/Antardasha: Expansion and wisdom
- Venus periods: Comfort and relationships
- Mercury periods: Communication and learning

## Challenging Dasha Periods

**Periods Requiring Care:**
- Saturn periods: Restructuring, patience needed
- Rahu periods: Unexpected changes, stay grounded
- Ketu periods: Spiritual intensity, material challenges

## Critical Transit Events

**Major Transits to Monitor:**
- Saturn Sade Sati: 7.5 year transformative cycle
- Jupiter transits: Annual opportunities
- Rahu-Ketu transits: 18-month karmic cycles

## Specific Age Milestones

**Significant Ages:**
- 28-30: Saturn return - life restructuring
- 36: Jupiter return - wisdom expansion
- 42: Uranus opposition - mid-life awakening
- 54: Second Jupiter return
- 58-60: Second Saturn return - elder wisdom

*This reading provides timing frameworks based on classical Jyotisha. For AI-enhanced precise date predictions, ensure OpenAI API is configured.*"""

    def generate_karmic_remedies(self, context: Dict[str, Any]) -> str:
        """Generate Karmic Remedies prediction with proper section headers"""
        zodiac = context.get('zodiac_sign', 'Unknown')
        nakshatra = context.get('nakshatra', 'Unknown')

        zodiac_info = self._get_zodiac_info(zodiac)
        nakshatra_info = self._get_nakshatra_info(nakshatra)
        remedies = self._get_relevant_remedies()

        # Format corpus remedies
        corpus_remedies = []
        for r in remedies[:3]:
            corpus_remedies.append(f"- **{r.get('sutra_reference', 'Traditional')}:** {r.get('description', '')}")

        return f"""## 1. Mantras & Sacred Sounds

**Primary Mantra for {nakshatra} Nakshatra:**
- **Mantra:** Om {nakshatra_info.get('deity', 'Namah').split()[0]}aya Namah
- **Pronunciation:** Clear, steady recitation with devotion
- **Repetitions:** 108 times daily, ideally at dawn
- **Best Time:** Brahma Muhurta (4:00-6:00 AM)
- **Benefits:** Alignment with nakshatra deity, spiritual protection

**Gayatri Mantra:**
- "Om Bhur Bhuva Swaha, Tat Savitur Varenyam, Bhargo Devasya Dhimahi, Dhiyo Yo Nah Prachodayat"
- 108 repetitions at sunrise for spiritual illumination

**Planetary Mantras:**
- **Sun:** Om Suryaya Namah (Sunday, 7 times)
- **Moon:** Om Chandraya Namah (Monday, 11 times)
- **Mars:** Om Mangalaya Namah (Tuesday, 7 times)
- **Mercury:** Om Budhaya Namah (Wednesday, 9 times)
- **Jupiter:** Om Gurave Namah (Thursday, 19 times)
- **Venus:** Om Shukraya Namah (Friday, 16 times)
- **Saturn:** Om Shanicharaya Namah (Saturday, 23 times)

## 2. Gemstone Therapy (Ratna Dharana)

**Primary Gemstone for {zodiac}:**
- **Stone:** Based on {zodiac_info.get('ruler', 'ruling planet')} influence
- **Minimum Weight:** 3-5 carats for effectiveness
- **Metal:** Gold or silver as appropriate
- **Finger:** Index or ring finger based on planet
- **Energization:** Mantra recitation before wearing
- **Best Day:** Day of ruling planet

**Supporting Gemstones:**
- Moonstone for emotional balance
- Clear quartz for amplification
- Amethyst for spiritual development

## 3. Yantras & Sacred Geometry

**Recommended Yantras:**
- **Sri Yantra:** For overall prosperity and spiritual growth
- **Nakshatra Yantra:** Specific to {nakshatra}
- **Planetary Yantra:** Based on current dasha lord

**Installation Guidelines:**
- Direction: East or North-facing altar
- Material: Copper or gold-plated
- Activation: Puja with mantras on auspicious day
- Maintenance: Regular worship and cleaning

## 4. Charitable Activities (Dana)

**Saturn Remedies:**
- Donate black sesame, iron items, mustard oil on Saturdays
- Serve the elderly and disabled
- Feed crows and dark-colored animals

**Jupiter Remedies:**
- Donate yellow items, turmeric, books on Thursdays
- Support education and teachers
- Feed Brahmins and scholars

**Corpus Remedies:**
{chr(10).join(corpus_remedies) if corpus_remedies else '- Traditional dana as guided by your chart'}

**General Charitable Practice:**
- Regular food donation (anna dana)
- Supporting temples and spiritual institutions
- Helping the poor and needy

## 5. Fasting & Dietary Practices

**Recommended Fasting Days:**
- **{zodiac_info.get('ruler', 'Ruling planet')} day:** Partial or complete fast
- **Ekadashi:** 11th lunar day - grain fast
- **Pradosh:** 13th lunar day - evening worship

**Dietary Recommendations:**
- Sattvic diet for spiritual progress
- Avoid tamasic foods during spiritual practices
- Seasonal eating aligned with constitution

## 6. Deity Worship & Puja

**Primary Deity for {nakshatra}:**
- **Deity:** {nakshatra_info.get('deity', 'Cosmic forces')}
- **Worship Day:** As appropriate for the deity
- **Offerings:** Flowers, fruits, incense as traditional

**Daily Worship Practice:**
1. Morning: Light lamp, offer flowers, recite prayers
2. Evening: Aarti and gratitude
3. Special days: Extended puja with full rituals

**Temple Visits:**
- Regular visits to temples of your nakshatra deity
- Pilgrimage to major temples annually

## 7. Pilgrimage & Sacred Visits (Tirtha Yatra)

**Recommended Sacred Sites:**
- Temples of {nakshatra_info.get('deity', 'your presiding deity')}
- Jyotirlinga sites for Shiva blessings
- Shakti Peethas for divine feminine grace
- River confluences (sangam) for purification

**Pilgrimage Timing:**
- During favorable planetary transits
- Nakshatra-specific auspicious days
- Major festivals associated with your deity

## 8. Lifestyle Modifications

**Daily Routine (Dinacharya):**
- Wake before sunrise for spiritual practice
- Meditation and pranayama in morning
- Balanced work and rest
- Evening spiritual practice before sleep

**Environmental Adjustments:**
- Keep home altar clean and energized
- Use colors favoring your chart
- Directional sleeping and working as per Vastu

## 9. Planetary Propitiation (Graha Shanti)

**Navgraha Puja:**
- Complete propitiation of all nine planets
- Recommended annually or during challenging transits
- Can be performed at home or temple

**Specific Shanti Pujas:**
- Shani Shanti for Saturn afflictions
- Rahu-Ketu Shanti for nodal issues
- As recommended by your chart analysis

## 10. Karmic Cleansing Practices

**Pitru Tarpana (Ancestral Offerings):**
- Performed on Amavasya (new moon)
- Especially during Pitru Paksha
- Water and sesame offerings to ancestors

**Past Life Healing:**
- Meditation on forgiveness
- Releasing old patterns through awareness
- Conscious relationship healing

## 11. Service & Seva

**Recommended Service Activities:**
- Teaching and sharing knowledge
- Helping at spiritual institutions
- Environmental service
- Supporting the vulnerable

**Service Aligned with {nakshatra}:**
- Activities related to {nakshatra_info.get('quality', 'your inherent abilities')}
- Using natural talents for others' benefit

## 12. Meditation & Inner Work

**Recommended Meditation Practices:**
- Mantra meditation with nakshatra mantra
- Breath awareness (anapanasati)
- Visualization of deity form
- Silent witnessing meditation

**Pranayama Practices:**
- Nadi Shodhana for balance
- Bhramari for calming
- Kapalabhati for energy

*These remedies follow classical Bhrigu Samhita and Nadi Jyotisha traditions. For AI-enhanced personalized remedy prescription, ensure OpenAI API is configured.*"""

    def generate_relationships(self, context: Dict[str, Any]) -> str:
        """Generate Relationships prediction with proper section headers"""
        zodiac = context.get('zodiac_sign', 'Unknown')
        nakshatra = context.get('nakshatra', 'Unknown')

        zodiac_info = self._get_zodiac_info(zodiac)
        nakshatra_info = self._get_nakshatra_info(nakshatra)

        return f"""## 1. Romantic Relationships & Marriage

**Life Partner Profile for {zodiac} Native:**

*Physical Characteristics:*
- Attracted to partners with complementary {zodiac_info.get('element', 'elemental')} energy
- Often drawn to those with graceful or distinctive presence

*Personality Traits:*
- Partner likely to have balancing qualities to your {zodiac_info.get('traits', 'nature')}
- Shared values around growth and spirituality
- Complementary communication styles

*Professional Background:*
- Partners often from fields involving service, creativity, or wisdom

**Marriage Timing:**
- Favorable periods when Jupiter transits relationship houses
- Venus strength and dignity influences timing
- Age 25-32 traditionally favorable for first marriage

**Relationship Patterns:**
- Your {zodiac} nature brings {zodiac_info.get('traits', 'characteristic approaches')} to relationships
- Growth through learning patience and understanding
- Deep commitment once trust is established

## 2. Family Relationships

**Parents:**
- Mother: Nurturing influence with karmic teaching role
- Father: Authority figure with wisdom to impart
- Lessons: Patience, respect, and unconditional love

**Siblings:**
- Soul companions sharing the family journey
- Potential for both support and growth challenges
- Karmic bonds from previous lifetimes

**Children:**
- Children are souls entrusted to your guidance
- Teaching and learning flows both directions
- Strong karmic connections with offspring

**Extended Family:**
- In-laws bring additional growth opportunities
- Family support system strengthens over time
- Ancestral blessings available through proper honoring

## 3. Soul Connections & Soulmates

**Twin Flame Potential:**
- Intense, transformative connection possible
- Recognition signs: Immediate deep familiarity
- Purpose: Mutual spiritual evolution

**Soulmates:**
- Multiple soulmate connections likely in lifetime
- Not all romantic - some as friends, mentors
- Recognition: Natural ease and deep understanding

**Karmic Relationships:**
- Some relationships carry unfinished past-life business
- Challenges serve growth and healing purposes
- Resolution through conscious awareness and forgiveness

## 4. Friendships & Social Circles

**Natural Friendship Style:**
- Your {zodiac} energy attracts friends through {zodiac_info.get('traits', 'natural qualities')}
- Quality over quantity in friendships
- Loyalty and depth in close friendships

**Beneficial Friendships:**
- Those who support spiritual growth
- Friends with complementary skills and perspectives
- Connections through shared service or learning

**Social Networks:**
- Building community through shared interests
- Professional networks supporting career growth
- Spiritual community for ongoing development

## 5. Professional Relationships

**Workplace Dynamics:**
- Natural role: Leadership or collaborative teamwork
- Communication style: {zodiac_info.get('traits', 'characteristic approach')}
- Best in environments allowing growth and contribution

**Business Partnerships:**
- Success with partners sharing ethical values
- Clear communication essential for harmony
- Complementary skills create strongest partnerships

**Authority Relationships:**
- Respect for genuine leadership
- Growth through constructive feedback
- Potential for mentorship roles

## 6. Karmic Relationship Patterns

**Recurring Themes:**
- Patterns related to {zodiac_info.get('element', 'your element')} expression
- Lessons around boundaries and giving
- Growth through vulnerability and trust

**Relationship Karma:**
- Past life connections manifesting currently
- Opportunity to heal old patterns
- Growth through conscious relationship practice

## 7. Communication & Intimacy

**Communication Style:**
- {zodiac} influence: {zodiac_info.get('traits', 'natural communication tendencies')}
- Strength: Depth and sincerity
- Growth area: Patience and active listening

**Intimacy Patterns:**
- Deep connection valued over superficial
- Trust built gradually through consistency
- Emotional and spiritual intimacy prioritized

## 8. Relationship Timing & Cycles

**Favorable Periods:**
- Venus-strong periods for romance
- Jupiter transits for expansion and commitment
- Benefic dasha periods for relationship harmony

**Challenging Periods:**
- Saturn transits: Testing and strengthening bonds
- Rahu periods: Unexpected changes, stay grounded
- Opportunities for growth through challenges

**Next 5 Years Overview:**
- Year 1: Foundation building in relationships
- Year 2: Deepening existing connections
- Year 3: Potential for significant commitments
- Year 4: Growth through relationship challenges
- Year 5: Harvest of relationship investments

## 9. Healing Relationship Wounds

**Past Patterns Requiring Healing:**
- Trust issues from past experiences
- Attachment patterns from childhood
- Karmic wounds from past lives

**Healing Practices:**
- Forgiveness meditation
- Conscious communication practice
- Therapy or counseling when needed
- Spiritual practices for emotional healing

## 10. Creating Healthy Relationships

**Daily Practices:**
- Gratitude expression to loved ones
- Quality time and presence
- Clear, honest communication
- Supporting each other's growth

**Conflict Resolution:**
- Address issues promptly and kindly
- Listen to understand, not to respond
- Seek win-win solutions
- Practice forgiveness readily

**Spiritual Partnership:**
- Shared spiritual practices when appropriate
- Supporting each other's dharma
- Growing together toward liberation

*This reading draws from Vedic relationship wisdom. For AI-enhanced compatibility analysis and detailed relationship timing, ensure OpenAI API is configured.*"""

    def generate_general_predictions(self, context: Dict[str, Any]) -> str:
        """Generate General Predictions with proper section headers"""
        zodiac = context.get('zodiac_sign', 'Unknown')
        nakshatra = context.get('nakshatra', 'Unknown')

        zodiac_info = self._get_zodiac_info(zodiac)
        nakshatra_info = self._get_nakshatra_info(nakshatra)

        # Determine lucky elements based on zodiac
        lucky_colors = {
            'Fire': 'Red, Orange, Gold',
            'Earth': 'Green, Brown, Yellow',
            'Air': 'White, Light Blue, Silver',
            'Water': 'Blue, Sea Green, Pearl White'
        }
        lucky_color = lucky_colors.get(zodiac_info.get('element', 'Unknown'), 'Blue, White')

        return f"""## Daily Forecast

**Today's Energy for {zodiac}:**

*Overall Theme:* A day for balanced action and mindful engagement
*Ruling Influence:* {zodiac_info.get('ruler', 'Planetary')} energy supports {zodiac_info.get('traits', 'your natural expression')}

**Career & Work:**
- Focus on completing pending tasks
- Communication with colleagues favored
- Avoid major new commitments until energy stabilizes

**Relationships:**
- Express appreciation to loved ones
- Listen more than speak
- Harmony through patience

**Health & Energy:**
- Moderate activity recommended
- Stay hydrated and nourished
- Evening meditation beneficial

**Lucky Elements:**
- Colors: {lucky_color}
- Number: Based on nakshatra calculation
- Direction: East for new beginnings

**Auspicious Time:** Morning hours after sunrise
**Caution Time:** Avoid major decisions during Rahu Kalam

## Weekly Forecast

**This Week's Theme:** Building and nurturing

**Monday-Tuesday:** Foundation work, planning
**Wednesday-Thursday:** Active engagement, communication
**Friday-Saturday:** Harvest efforts, relationships
**Sunday:** Rest, spiritual practice, reflection

**Best Days:** Thursday (Jupiter's blessing), Friday (Venus support)
**Challenging Days:** Saturday requires patience (Saturn influence)

**Weekly Opportunities:**
- Career advancement through consistent effort
- Relationship deepening through quality time
- Financial stability through prudent management

**Weekly Challenges:**
- Managing energy levels
- Balancing multiple priorities
- Patience with slow progress

## Monthly Forecast

**Month's Primary Theme:** Growth through dedication

**Career Developments:**
- Steady progress in professional matters
- Recognition for past efforts possible
- Avoid hasty career changes

**Relationship Evolution:**
- Deepening bonds with loved ones
- New connections possible mid-month
- Focus on communication quality

**Financial Outlook:**
- Stable with potential for modest gains
- Avoid speculative investments
- Good time for financial planning

**Health Focus:**
- Maintain regular routines
- Address any lingering health concerns
- Preventive care recommended

**Spiritual Growth:**
- Deepen meditation practice
- Consider pilgrimage or retreat
- Study sacred texts

**Best Periods:**
- First and third weeks: Active engagement
- Second and fourth weeks: Consolidation

## Yearly Forecast

**Year's Central Theme:** Evolution and establishment

**Overall Energy:** The year supports growth through consistent effort, aligned with your {zodiac} nature and {nakshatra} blessings.

**Quarterly Overview:**

*Q1 (January-March):* Foundation and planning
- Set intentions for the year
- Begin new practices
- Plant seeds for future growth

*Q2 (April-June):* Active growth
- Implement plans
- Build relationships
- Expand professional reach

*Q3 (July-September):* Assessment and adjustment
- Review progress
- Make necessary corrections
- Deepen commitments

*Q4 (October-December):* Harvest and preparation
- Reap rewards of effort
- Prepare for new cycle
- Spiritual deepening

**Career Trajectory:**
- Opportunities for advancement through merit
- Skill development enhances prospects
- Leadership opportunities possible

**Relationship Milestones:**
- Existing relationships deepen
- New significant connections possible
- Family harmony increases

**Financial Overview:**
- Steady growth through prudent management
- Major purchases favored in strong periods
- Long-term investments supported

**Health & Vitality:**
- Generally favorable with proper care
- Address any chronic issues proactively
- Mental health through spiritual practice

**Spiritual Development:**
- Significant growth possible this year
- Teachers or guides may appear
- Deepen daily practice for best results

*This forecast provides general guidance based on your {zodiac} Sun and {nakshatra} birth star. For AI-enhanced detailed predictions with precise timing, ensure OpenAI API is configured.*"""


# Singleton instance
_offline_wisdom_generator = None

def get_offline_wisdom_generator():
    """Get or create offline wisdom generator singleton"""
    global _offline_wisdom_generator
    if _offline_wisdom_generator is None:
        _offline_wisdom_generator = BhriguOfflineWisdomGenerator()
    return _offline_wisdom_generator

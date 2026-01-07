"""
Bhrigu Samhita and Nadi Jyotisa Predictions Service
Comprehensive predictions based on ancient Vedic wisdom
"""
import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

from services.openai_service import get_openai_service
from services.astrology_calculator import AstrologyCalculator
from services.section_parser import get_section_parser
from services.bhrigu_corpus_db import get_corpus_database

# Configure logging
logger = logging.getLogger(__name__)


class BhriguPredictionsService:
    """
    Comprehensive Bhrigu Samhita and Nadi Jyotisa predictions service
    Implements all 8 prediction categories with extensive AI-powered analysis
    Enhanced with structured section extraction and corpus integration
    """

    def __init__(self):
        self.openai_service = get_openai_service()
        self.astrology_calculator = AstrologyCalculator()
        self.section_parser = get_section_parser(self.openai_service)
        self.corpus_db = get_corpus_database()

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
        # Calculate birth chart if not already provided
        if 'zodiac_sign' not in birth_data:
            try:
                chart_data = self.astrology_calculator.calculate_birth_chart(
                    birth_data['date_of_birth'],
                    birth_data['time_of_birth'],
                    birth_data['latitude'],
                    birth_data['longitude']
                )
                birth_data.update(chart_data)
            except Exception as e:
                print(f"Error calculating chart: {e}")

        # Route to specific prediction method
        category_methods = {
            'karmic_journey': self.generate_karmic_journey_prediction,
            'past_lives': self.generate_past_lives_prediction,
            'future_lives': self.generate_future_lives_prediction,
            'present_life': self.generate_present_life_prediction,
            'life_events': self.generate_life_events_prediction,
            'karmic_remedies': self.generate_karmic_remedies_prediction,
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

    def generate_karmic_journey_prediction(self, birth_data: Dict[str, Any],
                                          question: Optional[str] = None) -> Dict[str, Any]:
        """
        Karmic Journey: Discover your soul's purpose and life mission
        Based on Bhrigu Samhita principles of soul evolution
        """
        prompt = f"""{self.bhrigu_system_prompt}

Generate a comprehensive Karmic Journey analysis for a person with the following birth details:

**Birth Details:**
- Date of Birth: {birth_data.get('date_of_birth')}
- Time of Birth: {birth_data.get('time_of_birth')}
- Place of Birth: {birth_data.get('place_of_birth')}

**Astrological Configuration:**
- Zodiac Sign (Rashi): {birth_data.get('zodiac_sign')}
- Moon Sign: {birth_data.get('moon_sign')}
- Ascendant (Lagna): {birth_data.get('ascendant')}
- Nakshatra: {birth_data.get('nakshatra')}
- North Node (Rahu): {birth_data.get('rahu_position', 'Calculate from chart')}
- South Node (Ketu): {birth_data.get('ketu_position', 'Calculate from chart')}

{f'**Specific Question:** {question}' if question else ''}

MANDATORY: You MUST structure your response with these EXACT section headers using ## markdown format.
Each section must be comprehensive (200+ words minimum).

Provide an extensive analysis covering these sections in this EXACT format:

## Soul's Primary Purpose
- The fundamental reason this soul incarnated in this lifetime
- Unique dharmic path and cosmic mission
- Core spiritual lessons to master

## 2. Karmic Blueprint
- Major karmic patterns from past lives affecting this life
- Karmic debts to be repaid
- Karmic credits earned in past lives
- Specific yogas indicating karmic destiny

## 3. Soul Evolution Stage
- Current level of spiritual development
- Past incarnations count and quality
- Remaining incarnations before liberation
- Progress on the path to moksha

## 4. Life Mission & Dharma
- Professional dharma (career purpose)
- Family dharma (relationships purpose)
- Social dharma (contribution to society)
- Spiritual dharma (inner development)

## 5. Karmic Lessons in This Lifetime
- Primary lessons the soul must learn
- Challenges designed for growth
- Opportunities for spiritual advancement
- Tests that will appear repeatedly until mastered

## 6. Soul Group Connections
- Soulmates and karmic relationships
- Soul family members in current life
- Past life connections affecting present relationships
- Teachers and guides destined to appear

## 7. Timing of Karmic Events
- Major karmic turning points by age
- Dasha periods of intense karmic activity
- Auspicious times for spiritual breakthroughs
- Challenging periods requiring extra awareness

## Spiritual Gifts & Abilities
- Psychic or intuitive abilities from past lives
- Natural talents supporting the soul mission
- Hidden capabilities waiting to be activated
- Spiritual practices most beneficial for this soul

CRITICAL REMINDER: Structure your ENTIRE response using the ## header format shown above.
Each section must have substantive content (minimum 200 words per section).
Provide specific, actionable guidance rooted in Bhrigu Samhita and Nadi Jyotisa traditions."""

        prediction_text = self.openai_service.generate_prediction(prompt, birth_data)

        # Extract sections using section parser with auto-repair
        sections = self.section_parser.extract_sections(
            prediction_text, 
            'karmic_journey', 
            birth_data
        )
        
        # Validate and ensure all sections are present
        missing_sections = self.section_parser.get_missing_sections(sections, 'karmic_journey')
        if missing_sections:
            logger.info(f"Auto-repairing {len(missing_sections)} missing sections for karmic_journey")
            for section_key in missing_sections:
                sections[section_key] = self.section_parser.generate_missing_section(
                    section_key,
                    prediction_text,
                    'karmic_journey',
                    birth_data
                )

        return {
            'category': 'karmic_journey',
            'title': 'Your Karmic Journey & Soul Purpose',
            'full_analysis': prediction_text,
            **sections,  # Include all extracted/generated sections
            'metadata': self._generate_metadata(birth_data),
            'generated_at': datetime.utcnow().isoformat()
        }

    def generate_past_lives_prediction(self, birth_data: Dict[str, Any],
                                      question: Optional[str] = None) -> Dict[str, Any]:
        """
        Past Lives: Explore previous incarnations and karmic patterns
        """
        prompt = f"""{self.bhrigu_system_prompt}

Generate a detailed Past Lives analysis based on Nadi Jyotisa principles:

**Current Birth Details:**
- Zodiac Sign: {birth_data.get('zodiac_sign')}
- Nakshatra: {birth_data.get('nakshatra')}
- Moon Sign: {birth_data.get('moon_sign')}
- Ketu Position (South Node): {birth_data.get('ketu_position')}
- Saturn Position: {birth_data.get('saturn_position')}
- 12th House Lord: {birth_data.get('twelfth_house_lord')}

{f'**Specific Question:** {question}' if question else ''}

Provide comprehensive analysis of:

## 1. Most Recent Past Life (Previous Incarnation)
- Time period and geographic location
- Social status and profession
- Major life events and circumstances
- Cause and age of death
- Unfinished business carried forward

## 2. Significant Past Lives (3-5 Major Incarnations)
For each life, describe:
- Historical era and culture
- Role and profession
- Key relationships
- Major achievements or failures
- Karmic lessons learned or missed
- Connection to current life themes

## 3. Recurring Karmic Patterns
- Patterns that repeat across lifetimes
- Unresolved conflicts from multiple lives
- Relationships that recur in different forms
- Themes requiring resolution

## 4. Past Life Skills & Talents
- Abilities mastered in previous lives
- Natural talents carried forward
- Languages or arts from past incarnations
- Professional skills that come naturally

## 5. Past Life Traumas Needing Healing
- Traumatic events creating current fears
- Past life deaths affecting current phobias
- Betrayals or losses creating trust issues
- Violent or sudden deaths influencing present

## 6. Past Life Relationships in Current Life
- People you've known before (how to recognize them)
- Karmic contracts with current family members
- Soulmates from previous incarnations
- Enemies becoming friends or vice versa

## 7. Karmic Debts from Past Lives
- Debts owed to specific people or groups
- Cultural or religious karmic obligations
- Unfulfilled promises or duties
- Resources taken that must be returned

## 8. Past Life Spiritual Progress
- Spiritual practices from previous lives
- Temples, churches, or holy places visited before
- Deities or spiritual figures you served
- Level of enlightenment in previous incarnations

Reference specific Nadi Jyotisa indicators and planetary positions."""

        prediction_text = self.openai_service.generate_prediction(prompt, birth_data)

        # Extract sections using section parser with auto-repair
        sections = self.section_parser.extract_sections(
            prediction_text, 
            'past_lives', 
            birth_data
        )
        
        # Validate and ensure all sections are present
        missing_sections = self.section_parser.get_missing_sections(sections, 'past_lives')
        if missing_sections:
            logger.info(f"Auto-repairing {len(missing_sections)} missing sections for past_lives")
            for section_key in missing_sections:
                sections[section_key] = self.section_parser.generate_missing_section(
                    section_key,
                    prediction_text,
                    'past_lives',
                    birth_data
                )

        return {
            'category': 'past_lives',
            'title': 'Your Past Lives & Karmic Patterns',
            'full_analysis': prediction_text,
            **sections,  # Include all extracted/generated sections
            'metadata': self._generate_metadata(birth_data),
            'generated_at': datetime.utcnow().isoformat()
        }

    def generate_future_lives_prediction(self, birth_data: Dict[str, Any],
                                        question: Optional[str] = None) -> Dict[str, Any]:
        """
        Future Lives: Envision soul's evolution and future incarnations
        """
        prompt = f"""{self.bhrigu_system_prompt}

Generate Future Lives predictions based on current karmic trajectory:

**Current Life Indicators:**
- Zodiac Sign: {birth_data.get('zodiac_sign')}
- Nakshatra: {birth_data.get('nakshatra')}
- Rahu Position (North Node): {birth_data.get('rahu_position')}
- Jupiter Position: {birth_data.get('jupiter_position')}
- 9th House Configuration: {birth_data.get('ninth_house')}

{f'**Specific Question:** {question}' if question else ''}

Analyze and predict:

## 1. Next Immediate Incarnation
- Likely time period for next birth (if applicable)
- Probable geographic location and culture
- Expected social circumstances
- Primary life purpose in next life
- Karmic lessons continuing forward

## 2. Soul Evolution Trajectory (Next 3-5 Lives)
For each future life:
- Expected spiritual development level
- Type of incarnation (human, higher realms, etc.)
- Major themes and purposes
- Relationships with current life souls
- Progress toward liberation

## 3. Conditions for This Being the Final Birth
- Current karmic completion percentage
- Remaining lessons before moksha
- Practices that could accelerate liberation
- Signs that this might be the last incarnation
- Path to breaking the cycle of rebirth

## 4. Future Life Scenarios Based on Current Actions
**If Current Spiritual Path Continues:**
- Likely future incarnations
- Higher realms of existence possible
- Accelerated evolution path

**If Materialistic Focus Dominates:**
- Karmic consequences in future lives
- Possible regression or delays
- Lessons that will need repeating

**If Dharmic Balance Maintained:**
- Optimal evolution path
- Balanced progression
- Natural spiritual growth

## 5. Moksha Timeline & Preparation
- Estimated lifetimes until liberation
- Current progress toward enlightenment
- Practices to accelerate moksha
- Obstacles to final liberation
- Signs you're approaching final births

## 6. Higher Realms Accessibility
- Eligibility for Deva realms
- Brahma Loka possibilities
- Vaikuntha or Kailash attainment
- Requirements for higher plane incarnations

## 7. Bodhisattva Path Potential
- Capacity to return as spiritual teacher
- Possibility of becoming a guide for others
- Avatar or sage incarnation potential
- Service incarnations for humanity

## 8. Soul's Ultimate Destiny
- Final destination of this soul
- Cosmic purpose across all incarnations
- Contribution to universal consciousness
- Legacy across time and space

Ground predictions in Bhrigu Samhita principles of karmic progression."""

        prediction_text = self.openai_service.generate_prediction(prompt, birth_data)

        # Extract sections using section parser with auto-repair
        sections = self.section_parser.extract_sections(
            prediction_text, 
            'future_lives', 
            birth_data
        )
        
        # Validate and ensure all sections are present
        missing_sections = self.section_parser.get_missing_sections(sections, 'future_lives')
        if missing_sections:
            logger.info(f"Auto-repairing {len(missing_sections)} missing sections for future_lives")
            for section_key in missing_sections:
                sections[section_key] = self.section_parser.generate_missing_section(
                    section_key,
                    prediction_text,
                    'future_lives',
                    birth_data
                )

        return {
            'category': 'future_lives',
            'title': 'Your Future Lives & Soul Evolution',
            'full_analysis': prediction_text,
            **sections,  # Include all extracted/generated sections
            'metadata': self._generate_metadata(birth_data),
            'generated_at': datetime.utcnow().isoformat()
        }

    def generate_present_life_prediction(self, birth_data: Dict[str, Any],
                                        question: Optional[str] = None) -> Dict[str, Any]:
        """
        Present Life: Comprehensive analysis of current life and opportunities
        """
        prompt = f"""{self.bhrigu_system_prompt}

Generate comprehensive Present Life analysis:

**Birth and Current Details:**
- Date of Birth: {birth_data.get('date_of_birth')}
- Current Age: {birth_data.get('age', self._calculate_age(birth_data.get('date_of_birth')))}
- Zodiac Sign: {birth_data.get('zodiac_sign')}
- Nakshatra: {birth_data.get('nakshatra')}
- Ascendant: {birth_data.get('ascendant')}
- Current Mahadasha: {birth_data.get('current_dasha', 'To be determined')}
- Moon Sign: {birth_data.get('moon_sign')}

{f'**Specific Question:** {question}' if question else ''}

Provide detailed analysis of:

## 1. Current Life Phase & Stage
- Current age-related life phase (youth, middle age, wisdom years)
- Astrological timing and phase
- Major themes of current period
- Challenges and opportunities right now

## 2. Career & Professional Path
- Ideal career directions based on chart
- Natural talents for professional success
- Business vs. employment suitability
- Timing for career changes or advancement
- Professional challenges and how to overcome them
- Peak earning periods

## 3. Relationships & Partnerships
**Romantic Relationships:**
- Marriage timing and indicators
- Ideal partner characteristics
- Relationship challenges to anticipate
- Multiple relationships or single committed partnership

**Family Relationships:**
- Parents, siblings, children dynamics
- Family karmic patterns
- Healing family wounds

**Friendships & Social Connections:**
- Natural social circles
- Beneficial friendships
- Networking opportunities

## 4. Health & Wellbeing
- Constitution type (Vata, Pitta, Kapha)
- Potential health vulnerabilities
- Best preventive practices
- Optimal diet and lifestyle
- Mental and emotional health considerations
- Longevity indicators

## 5. Financial Prospects & Wealth
- Wealth accumulation potential
- Best sources of income
- Financial challenges and timing
- Property and asset indicators
- Periods of financial gain and loss
- Wealth preservation strategies

## 6. Spiritual Growth Opportunities
- Current spiritual development level
- Recommended spiritual practices
- Meditation and yoga suitability
- Guru or teacher connections
- Pilgrimage sites beneficial to visit
- Spiritual breakthroughs timing

## 7. Education & Learning
- Fields of study aligned with chart
- Optimal learning methods
- Higher education timing and success
- Self-study vs. formal education
- Teaching abilities and opportunities

## 8. Life Purpose & Fulfillment
- How to live in alignment with dharma
- Balancing material and spiritual life
- Creating lasting impact and legacy
- Finding joy and contentment
- Serving others while fulfilling personal goals

## 9. Challenges & Growth Areas
- Main obstacles in current life
- Karmic tests specific to this incarnation
- Character development opportunities
- Fears to overcome
- Weaknesses to transform into strengths

## 10. Favorable & Challenging Periods
- Next 5 years month-by-month highlights
- Dasha periods and their effects
- Best timing for major decisions
- Periods to exercise caution
- Windows of maximum opportunity

Base analysis on classical Bhrigu Samhita delineation methods."""

        prediction_text = self.openai_service.generate_prediction(prompt, birth_data)

        # Extract sections using section parser with auto-repair
        sections = self.section_parser.extract_sections(
            prediction_text, 
            'present_life', 
            birth_data
        )
        
        # Validate and ensure all sections are present
        missing_sections = self.section_parser.get_missing_sections(sections, 'present_life')
        if missing_sections:
            logger.info(f"Auto-repairing {len(missing_sections)} missing sections for present_life")
            for section_key in missing_sections:
                sections[section_key] = self.section_parser.generate_missing_section(
                    section_key,
                    prediction_text,
                    'present_life',
                    birth_data
                )

        return {
            'category': 'present_life',
            'title': 'Your Present Life Comprehensive Analysis',
            'full_analysis': prediction_text,
            **sections,  # Include all extracted/generated sections
            'metadata': self._generate_metadata(birth_data),
            'generated_at': datetime.utcnow().isoformat()
        }

    def generate_life_events_prediction(self, birth_data: Dict[str, Any],
                                       question: Optional[str] = None) -> Dict[str, Any]:
        """
        Life Events: Predict major transitions with precision timing
        """
        current_age = birth_data.get('age', self._calculate_age(birth_data.get('date_of_birth')))

        prompt = f"""{self.bhrigu_system_prompt}

Generate precise Life Events predictions using Nadi Jyotisa timing methods:

**Birth Details:**
- Date of Birth: {birth_data.get('date_of_birth')}
- Current Age: {current_age} years
- Zodiac Sign: {birth_data.get('zodiac_sign')}
- Nakshatra: {birth_data.get('nakshatra')}
- Current Dasha: {birth_data.get('current_dasha')}
- Dasha Balance: {birth_data.get('dasha_balance')}

{f'**Specific Question:** {question}' if question else ''}

MANDATORY: Structure your response with these EXACT section headers using ## markdown format.
Each section must be comprehensive with specific timing and details.

Provide year-by-year predictions for the next 10 years with precision timing:

## Year-by-Year Forecast

For EACH year, provide:

### Year 1 (Age {current_age + 1})
**Dasha Period:** [Specify Mahadasha/Antardasha]
**Overall Theme:** [Major themes and energies]

**Major Life Events:**
- Month-by-month significant events
- Career developments and changes
- Relationship milestones
- Financial events (gains, expenses, investments)
- Health matters requiring attention
- Spiritual experiences

**Best Timing For:**
- Major decisions and new beginnings
- Important commitments or contracts
- Travel and relocation
- Education and learning
- Investments and purchases

**Periods to Exercise Caution:**
- Challenging transits
- Difficult dashas
- Accident-prone periods
- Health vulnerable times

[Continue for each of the 10 years]

## Marriage & Partnerships
- Exact timing windows for meeting life partner
- Marriage periods (specify months/years)
- Relationship challenges and resolutions
- Multiple relationships or single partnership destiny

## Career Milestones
- Job changes and promotions (specific timing)
- Business launch optimal periods
- Career peak periods
- Professional recognition and awards
- Industry changes or shifts

## Children & Family
- Children birth timing (if applicable)
- Number of children indicated
- Family expansion or changes
- Parent or elder care responsibilities

## Financial Events
- Wealth accumulation periods
- Property acquisition timing
- Inheritance or windfall periods
- Business success phases
- Investment opportunities

## Health Alerts
- Periods requiring health vigilance
- Surgery or medical procedure timing
- Wellness breakthrough opportunities
- Longevity indicators
- Preventive care timing

## Spiritual Milestones
- Spiritual awakening windows
- Initiation or diksha timing
- Pilgrimage travel periods
- Meeting spiritual teachers
- Meditation or sadhana breakthroughs

## Relocations & Travel
- Moving to new cities/countries
- Long-distance travel periods
- Beneficial locations
- Timing for permanent moves

## Education
- Higher education timing
- Certification or degree completion
- Skill mastery periods
- Teaching or training opportunities

## Favorable Dasha Periods
List all favorable Mahadasha/Antardasha combinations in next 10 years with:
- Start and end dates
- Benefits expected
- Areas of life positively affected
- Actions to take during these periods

## Challenging Dasha Periods
List difficult periods with:
- Start and end dates
- Nature of challenges
- Remedies to mitigate
- Lessons to be learned

## Critical Transit Events
- Saturn transits and Sade Sati
- Jupiter transits and benefits
- Rahu-Ketu transit effects
- Eclipse impacts
- Retrograde periods of significance

## Specific Age Milestones
Highlight ages of particular significance:
- Age 30, 36, 42, 48, 54, 60 (Saturn cycles)
- Jupiter return periods
- Nodal returns
- Personal planetary returns

CRITICAL REMINDER: Structure your ENTIRE response using the ## header format as shown above.
Provide month-level precision where possible using Nadi Jyotisa methods."""

        prediction_text = self.openai_service.generate_prediction(prompt, birth_data)

        # Extract sections using section parser with auto-repair
        sections = self.section_parser.extract_sections(
            prediction_text, 
            'life_events', 
            birth_data
        )
        
        # Validate and ensure all sections are present
        missing_sections = self.section_parser.get_missing_sections(sections, 'life_events')
        if missing_sections:
            logger.info(f"Auto-repairing {len(missing_sections)} missing sections for life_events")
            for section_key in missing_sections:
                sections[section_key] = self.section_parser.generate_missing_section(
                    section_key,
                    prediction_text,
                    'life_events',
                    birth_data
                )

        return {
            'category': 'life_events',
            'title': 'Your Life Events with Precision Timing',
            'full_analysis': prediction_text,
            **sections,  # Include all extracted/generated sections
            'metadata': self._generate_metadata(birth_data),
            'generated_at': datetime.utcnow().isoformat()
        }

    def generate_karmic_remedies_prediction(self, birth_data: Dict[str, Any],
                                           question: Optional[str] = None) -> Dict[str, Any]:
        """
        Karmic Remedies: Personalized spiritual practices and remedies
        """
        prompt = f"""{self.bhrigu_system_prompt}

Generate comprehensive Karmic Remedies based on Bhrigu Samhita tradition:

**Chart Details:**
- Zodiac Sign: {birth_data.get('zodiac_sign')}
- Nakshatra: {birth_data.get('nakshatra')}
- Ascendant: {birth_data.get('ascendant')}
- Planetary Afflictions: {birth_data.get('afflictions', 'To be determined from chart')}
- Weak Planets: {birth_data.get('weak_planets', 'To be determined')}
- Doshas: {birth_data.get('doshas', 'To be determined')}

{f'**Specific Challenges:** {question}' if question else ''}

Provide detailed remedial measures:

## 1. Mantras & Sacred Sounds

For each afflicted or weak planet, provide:

**Planet-Specific Mantras:**
- Sanskrit mantra (with Devanagari if possible)
- Pronunciation guide (phonetic)
- Meaning and translation
- Number of repetitions (daily/total sankalpa)
- Best time for chanting
- Expected benefits and timeline

Include mantras for:
- Sun (Surya)
- Moon (Chandra)
- Mars (Mangal)
- Mercury (Budh)
- Jupiter (Guru)
- Venus (Shukra)
- Saturn (Shani)
- Rahu & Ketu

**Maha Mrityunjaya and other powerful mantras**
**Gayatri Mantra variations**
**Navgraha Stotra**

## 2. Gemstone Therapy (Ratna Dharana)

For each recommended gemstone:
- Primary gemstone for ascendant/moon
- Supporting gemstones
- Weight in carats (minimum)
- Finger to wear on
- Metal for ring (gold, silver, panchdhatu)
- Day and time for wearing
- Mantra for energizing
- Duration to wear
- Expected effects
- Alternatives if gemstone too expensive

## 3. Yantras & Sacred Geometry

- Specific yantras for your chart
- How to energize and worship
- Placement in home (direction, location)
- Mantras to use with yantra
- Materials (copper, gold, bhojpatra)
- Auspicious timing for installation

## 4. Charitable Activities (Dana)

For each planet, specify:
**What to donate:**
- Items corresponding to each planet
- Quantities or amounts
- Recipients (temples, poor, specific groups)

**When to donate:**
- Specific days of the week
- Tithis (lunar days)
- Special occasions

**Saturn (Shani) Remedies:**
- Mustard oil donation
- Iron items donation
- Feeding crows
- Serving disabled persons

**Jupiter (Guru) Remedies:**
- Gold/yellow items donation
- Teaching or knowledge sharing
- Supporting education

[Continue for each planet]

## 5. Fasting & Dietary Practices

- Days to fast for specific planets
- Partial vs. complete fasting
- Foods to avoid or emphasize
- Sattvic diet recommendations
- Cooking and eating mindfully
- Alcohol and non-veg considerations

## 6. Deity Worship & Puja

**Primary Deities for your chart:**
- Main deity for ascendant
- Ishta devata (personal deity)
- Kula devata (family deity)

For each deity:
- Specific pujas to perform
- Offerings (flowers, food, incense)
- Days for worship
- Temples to visit
- Home shrine setup
- Festival participation

## 7. Pilgrimage & Sacred Visits (Tirtha Yatra)

- Priority temples/sites to visit
- Specific shrines for your nakshatra
- Jyotirlinga or Shakti Peeth relevance
- Timing for pilgrimage
- Rituals to perform at sites
- Virtual pilgrimage options if travel not possible

## 8. Lifestyle Modifications

**Daily Routine (Dinacharya):**
- Wake time and sleep time
- Meditation schedule
- Exercise and yoga
- Prayer times

**Spiritual Practices:**
- Pranayama techniques
- Meditation methods best suited
- Yoga asanas for your dosha
- Mindfulness practices

**Environmental Adjustments:**
- Home vastu corrections
- Workplace setup
- Colors to wear/avoid
- Directions to face while working/sleeping

## 9. Planetary Propitiation (Graha Shanti)

**Major Rituals:**
- Navgraha Puja (9 planets worship)
- Specific graha shanti for afflicted planets
- Rahu-Ketu Puja for nodal afflictions
- Saturn Shanti for Sade Sati or Saturn dasha

**Timing:**
- When to perform
- Duration and frequency
- Priests or self-performance

## 10. Karmic Cleansing Practices

- Past life karma healing methods
- Ancestral healing (Pitru Dosha remedies)
- Curse removal (Shaap Vimochan)
- Evil eye protection (Nazar Dosh)
- Negative energy clearing

## 11. Service & Seva

- Specific service activities aligned with chart
- Helping particular groups (elderly, animals, etc.)
- Teaching or mentoring
- Environmental service
- Temple or community service

## 12. Meditation & Inner Work

- Meditation techniques for your chart
- Chakra work specific to planetary positions
- Visualization practices
- Breathing techniques (specific pranayama)
- Japa meditation guidelines

Provide practical, affordable, and effective remedies that can be integrated into modern life."""

        prediction_text = self.openai_service.generate_prediction(prompt, birth_data)

        # Extract sections using section parser with auto-repair
        sections = self.section_parser.extract_sections(
            prediction_text, 
            'karmic_remedies', 
            birth_data
        )
        
        # Validate and ensure all sections are present
        missing_sections = self.section_parser.get_missing_sections(sections, 'karmic_remedies')
        if missing_sections:
            logger.info(f"Auto-repairing {len(missing_sections)} missing sections for karmic_remedies")
            for section_key in missing_sections:
                sections[section_key] = self.section_parser.generate_missing_section(
                    section_key,
                    prediction_text,
                    'karmic_remedies',
                    birth_data
                )

        return {
            'category': 'karmic_remedies',
            'title': 'Your Personalized Karmic Remedies',
            'full_analysis': prediction_text,
            **sections,  # Include all extracted/generated sections
            'metadata': self._generate_metadata(birth_data),
            'generated_at': datetime.utcnow().isoformat()
        }

    def generate_relationships_prediction(self, birth_data: Dict[str, Any],
                                         question: Optional[str] = None) -> Dict[str, Any]:
        """
        Relationships: Soul connections and compatibility analysis
        """
        prompt = f"""{self.bhrigu_system_prompt}

Generate comprehensive Relationships analysis:

**Your Chart:**
- Zodiac Sign: {birth_data.get('zodiac_sign')}
- Nakshatra: {birth_data.get('nakshatra')}
- Moon Sign: {birth_data.get('moon_sign')}
- Venus Position: {birth_data.get('venus_position')}
- 7th House: {birth_data.get('seventh_house')}
- Mars Position: {birth_data.get('mars_position')}

{f'**Specific Question:** {question}' if question else ''}

Analyze all relationship aspects:

## 1. Romantic Relationships & Marriage

**Life Partner Profile:**
- Physical characteristics
- Personality traits
- Professional background
- Cultural/religious compatibility
- Age difference tendency

**Marriage Timing:**
- Optimal marriage age/period
- Multiple marriages indicated?
- Love marriage vs. arranged
- Meeting circumstances
- Engagement to marriage timeline

**Relationship Patterns:**
- Your role in relationships
- Attractions and repulsions
- Communication style
- Conflict resolution approach
- Growth through partnership

**Compatibility Factors:**
- Best zodiac signs for partnership
- Nakshatra compatibility (Kuta)
- Guna matching considerations
- Mangal Dosha and implications
- Other doshas affecting marriage

## 2. Family Relationships

**Parents:**
- Relationship with mother
- Relationship with father
- Karmic lessons from parents
- Supporting vs. challenging dynamics
- Parental health and longevity

**Siblings:**
- Sibling dynamics
- Support or rivalry
- Karmic connections with siblings
- Helping siblings or receiving help

**Children:**
- Number of children indicated
- Gender indications
- Timing of children
- Relationship with children
- Children's success and wellbeing

**Extended Family:**
- In-laws relationship
- Family support system
- Family inheritance matters

## 3. Soul Connections & Soulmates

**Twin Flame:**
- Twin flame presence in this life
- Recognition signs
- Purpose of twin flame connection
- Challenges in twin flame union

**Soulmates:**
- Number of soulmate connections
- How to recognize soulmates
- Purpose of each soulmate relationship
- Platonic vs. romantic soulmates

**Karmic Relationships:**
- Past life connections in current relationships
- Karmic debts in relationships
- Lessons through difficult relationships
- When to stay vs. when to leave

## 4. Friendships & Social Circles

- Natural friend types
- Beneficial friendships
- Friendships to avoid
- Best timing for new friendships
- Friend-to-romantic-partner transitions
- Betrayal or loyalty patterns

## 5. Professional Relationships

**Colleagues & Co-workers:**
- Working in teams vs. independently
- Leadership or follower tendencies
- Office politics navigation
- Mentor and mentee relationships

**Business Partnerships:**
- Suitability for business partnerships
- Ideal business partner traits
- Partnership timing
- Partnership challenges

**Boss & Authority Figures:**
- Relating to authority
- Career advancement through relationships
- Political dynamics at work

## 6. Karmic Relationship Patterns

**Recurring Themes:**
- Patterns that repeat in relationships
- Lessons not yet learned
- Attractions to similar personality types
- Breaking negative patterns

**Relationship Karma:**
- Debts owed in relationships
- Credits earned
- Healing relationship karma
- Forgiveness and release

## 7. Communication & Intimacy

- Communication strengths and weaknesses
- Emotional expression style
- Intimacy needs and patterns
- Building deeper connections
- Vulnerability and trust

## 8. Relationship Timing & Cycles

**Next 5 Years:**
For each year, predict:
- Relationship status changes
- Meeting significant people
- Relationship challenges
- Growth opportunities
- Marriage/commitment timing

**Dasha Periods:**
- Favorable periods for relationships
- Challenging relationship dashas
- Meeting life partner dasha
- Separation or divorce indications

## 9. Healing Relationship Wounds

- Childhood wounds affecting relationships
- Past life relationship traumas
- Trust and abandonment issues
- Healing practices for relationships
- Therapy and counseling indications

## 10. Creating Healthy Relationships

**Practices for Relationship Success:**
- Daily practices for partnership harmony
- Conflict resolution strategies
- Maintaining independence in relationships
- Spiritual practices together
- Love languages and preferences

**Red Flags to Avoid:**
- Personality types to be cautious with
- Relationship patterns to break
- Warning signs in new relationships
- When to seek help or counseling

Provide specific, actionable relationship guidance based on classical astrology."""

        prediction_text = self.openai_service.generate_prediction(prompt, birth_data)

        # Extract sections using section parser with auto-repair
        sections = self.section_parser.extract_sections(
            prediction_text, 
            'relationships', 
            birth_data
        )
        
        # Validate and ensure all sections are present
        missing_sections = self.section_parser.get_missing_sections(sections, 'relationships')
        if missing_sections:
            logger.info(f"Auto-repairing {len(missing_sections)} missing sections for relationships")
            for section_key in missing_sections:
                sections[section_key] = self.section_parser.generate_missing_section(
                    section_key,
                    prediction_text,
                    'relationships',
                    birth_data
                )

        return {
            'category': 'relationships',
            'title': 'Your Relationships & Soul Connections',
            'full_analysis': prediction_text,
            **sections,  # Include all extracted/generated sections
            'metadata': self._generate_metadata(birth_data),
            'generated_at': datetime.utcnow().isoformat()
        }

    def generate_general_predictions(self, birth_data: Dict[str, Any],
                                    question: Optional[str] = None) -> Dict[str, Any]:
        """
        General Predictions: Daily, weekly, monthly forecasts
        """
        prompt = f"""{self.bhrigu_system_prompt}

Generate general astrological predictions:

**Birth Details:**
- Zodiac Sign: {birth_data.get('zodiac_sign')}
- Nakshatra: {birth_data.get('nakshatra')}
- Moon Sign: {birth_data.get('moon_sign')}

{f'**Specific Question:** {question}' if question else ''}

Provide:

## Daily Forecast
- Today's overall energy
- Career focus
- Relationship guidance
- Health tips
- Lucky color and number
- Auspicious time
- Things to avoid

## Weekly Forecast
- This week's theme
- Major opportunities
- Challenges to navigate
- Best days for important activities
- Relationship dynamics
- Financial matters

## Monthly Forecast
- Month's overall theme
- Career developments
- Relationship evolution
- Financial prospects
- Health considerations
- Spiritual growth opportunities
- Best timing for major decisions

## Yearly Forecast
- Year's primary themes
- Major life events predicted
- Career trajectory
- Relationship milestones
- Financial overview
- Health focus areas
- Spiritual development
- Quarterly breakdown

Base on current planetary transits and your natal chart."""

        prediction_text = self.openai_service.generate_prediction(prompt, birth_data)

        # Extract sections using section parser with auto-repair
        sections = self.section_parser.extract_sections(
            prediction_text, 
            'predictions', 
            birth_data
        )
        
        # Validate and ensure all sections are present
        missing_sections = self.section_parser.get_missing_sections(sections, 'predictions')
        if missing_sections:
            logger.info(f"Auto-repairing {len(missing_sections)} missing sections for predictions")
            for section_key in missing_sections:
                sections[section_key] = self.section_parser.generate_missing_section(
                    section_key,
                    prediction_text,
                    'predictions',
                    birth_data
                )

        return {
            'category': 'predictions',
            'title': 'Your General Predictions',
            'full_analysis': prediction_text,
            **sections,  # Include all extracted/generated sections
            'metadata': self._generate_metadata(birth_data),
            'generated_at': datetime.utcnow().isoformat()
        }

    # Helper methods

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

    def _generate_metadata(self, birth_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate metadata for the prediction"""
        return {
            'zodiac_sign': birth_data.get('zodiac_sign'),
            'nakshatra': birth_data.get('nakshatra'),
            'moon_sign': birth_data.get('moon_sign'),
            'ascendant': birth_data.get('ascendant'),
            'ai_model': 'gpt-4',
            'tradition': 'Bhrigu Samhita & Nadi Jyotisa'
        }

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
        except:
            return 0


# Singleton instance
_bhrigu_service = None

def get_bhrigu_service():
    """Get or create Bhrigu Predictions Service singleton"""
    global _bhrigu_service
    if _bhrigu_service is None:
        _bhrigu_service = BhriguPredictionsService()
    return _bhrigu_service

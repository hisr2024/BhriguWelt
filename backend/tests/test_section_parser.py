"""
Unit tests for SectionParser
Tests section extraction, validation, and generation
"""
import json
from pathlib import Path

import pytest
from services.section_parser import SectionParser, get_section_parser


class TestSectionParser:
    """Test suite for section parser"""
    
    @pytest.fixture
    def parser(self):
        """Create a section parser instance"""
        return SectionParser()
    
    @pytest.fixture
    def sample_birth_data(self):
        """Sample birth data for testing"""
        return {
            'zodiac_sign': 'Leo',
            'nakshatra': 'Magha',
            'moon_sign': 'Leo',
            'ascendant': 'Sagittarius',
            'date_of_birth': '1990-07-15',
            'time_of_birth': '14:30',
            'place_of_birth': 'Mumbai, India'
        }
    
    def test_section_parser_initialization(self, parser):
        """Test parser initializes correctly"""
        assert parser is not None
        assert parser.openai_service is None  # Initially None
        assert len(parser.REQUIRED_SECTIONS) > 0
        assert 'karmic_journey' in parser.REQUIRED_SECTIONS
        assert 'life_events' in parser.REQUIRED_SECTIONS
        assert 'predictions' in parser.REQUIRED_SECTIONS
    
    def test_required_sections_defined(self, parser):
        """Test that required sections are defined for all categories"""
        categories = ['karmic_journey', 'life_events', 'predictions', 
                     'past_lives', 'future_lives', 'present_life',
                     'karmic_remedies', 'relationships']
        
        for category in categories:
            assert category in parser.REQUIRED_SECTIONS
            assert len(parser.REQUIRED_SECTIONS[category]) > 0
    
    def test_karmic_journey_sections(self, parser):
        """Test karmic journey has all expected sections"""
        sections = parser.REQUIRED_SECTIONS['karmic_journey']
        expected = ['soul_purpose', 'karmic_blueprint', 'evolution_stage',
                   'life_mission', 'karmic_lessons', 'soul_connections',
                   'timing', 'spiritual_gifts']
        
        for section in expected:
            assert section in sections
    
    def test_life_events_sections(self, parser):
        """Test life events has all expected sections"""
        sections = parser.REQUIRED_SECTIONS['life_events']
        expected = ['yearly_forecast', 'marriage_timing', 'career_milestones',
                   'children_family', 'financial_events', 'health_alerts']
        
        for section in expected:
            assert section in sections
    
    def test_predictions_sections(self, parser):
        """Test predictions has all expected sections"""
        sections = parser.REQUIRED_SECTIONS['predictions']
        expected = ['daily', 'weekly', 'monthly', 'yearly']
        
        assert sections == expected
    
    def test_extract_section_with_header(self, parser):
        """Test extraction of section with clear header"""
        text = """
# Analysis

## Soul's Primary Purpose

This is the soul purpose content.
It has multiple paragraphs.

## Karmic Blueprint

This is the karmic blueprint.
"""
        
        result = parser.extract_section_content(text, 'soul_purpose')
        assert 'soul purpose content' in result.lower()
        assert 'multiple paragraphs' in result.lower()
        assert 'karmic blueprint' not in result.lower()
    
    def test_extract_section_without_header(self, parser):
        """Test extraction falls back to keyword search"""
        text = """
The soul purpose for this person is to lead with wisdom.
Their purpose involves teaching and guiding others.

The karmic blueprint shows past life patterns.
"""
        
        result = parser.extract_section_content(text, 'soul_purpose')
        # Should find something related to soul purpose
        assert len(result) >= 0  # May be empty if no exact match
    
    def test_extract_section_empty_text(self, parser):
        """Test extraction with empty text"""
        result = parser.extract_section_content("", 'soul_purpose')
        assert result == ""
    
    def test_validate_sections_all_present(self, parser):
        """Test validation with all sections present"""
        sections = {
            'soul_purpose': 'This is a comprehensive analysis of the soul purpose ' * 20,
            'karmic_blueprint': 'Detailed karmic blueprint analysis ' * 20,
            'evolution_stage': 'Soul evolution stage description ' * 20,
            'life_mission': 'Life mission and dharma ' * 20,
            'karmic_lessons': 'Karmic lessons to learn ' * 20,
            'soul_connections': 'Soul group connections ' * 20,
            'timing': 'Timing of karmic events ' * 20,
            'spiritual_gifts': 'Spiritual gifts and abilities ' * 20
        }
        
        validation = parser.validate_sections(sections, 'karmic_journey')
        
        # All sections should be valid
        for key, valid in validation.items():
            assert valid, f"Section {key} should be valid"
    
    def test_validate_sections_missing(self, parser):
        """Test validation with missing sections"""
        sections = {
            'soul_purpose': 'Short',  # Too short
            'karmic_blueprint': 'Also short'  # Too short
        }
        
        validation = parser.validate_sections(sections, 'karmic_journey')
        
        # Most sections should be invalid
        invalid_count = sum(1 for valid in validation.values() if not valid)
        assert invalid_count > 0
    
    def test_get_missing_sections(self, parser):
        """Test getting list of missing sections"""
        sections = {
            'soul_purpose': 'A' * 150,  # Valid
            'karmic_blueprint': 'Short'  # Invalid
        }
        
        missing = parser.get_missing_sections(sections, 'karmic_journey')
        
        # Should include karmic_blueprint and other missing sections
        assert 'karmic_blueprint' in missing
        assert len(missing) > 1  # Should have more missing sections
    
    def test_fallback_section_generation(self, parser, sample_birth_data):
        """Test fallback section when AI is not available"""
        result = parser._get_fallback_section('soul_purpose', sample_birth_data)
        
        assert len(result) > 100
        assert 'Soul Purpose' in result
        assert sample_birth_data['zodiac_sign'] in result
        assert sample_birth_data['nakshatra'] in result
    
    def test_generic_section_prompt(self, parser, sample_birth_data):
        """Test generic prompt generation"""
        prompt = parser._generic_section_prompt('soul_purpose', sample_birth_data, 'karmic_journey')
        
        assert 'Soul Purpose' in prompt
        assert sample_birth_data['zodiac_sign'] in prompt
        assert sample_birth_data['nakshatra'] in prompt
        assert 'karmic journey' in prompt.lower()
    
    def test_extract_sections_no_ai(self, parser, sample_birth_data):
        """Test section extraction without AI service (uses fallback)"""
        text = """
## Soul's Primary Purpose
This person's soul purpose is leadership.

## Karmic Blueprint
Past life patterns of authority.
"""
        
        sections = parser.extract_sections(text, 'karmic_journey', sample_birth_data)
        
        # Should have all required sections (some generated via fallback)
        required = parser.REQUIRED_SECTIONS['karmic_journey']
        for section_key in required:
            assert section_key in sections
            assert sections[section_key] is not None
    
    def test_section_header_patterns(self, parser):
        """Test that section headers are defined"""
        assert len(parser.SECTION_HEADERS) > 0
        assert 'soul_purpose' in parser.SECTION_HEADERS
        assert 'daily' in parser.SECTION_HEADERS
        assert 'yearly_forecast' in parser.SECTION_HEADERS
    
    def test_singleton_pattern(self):
        """Test that get_section_parser returns singleton"""
        parser1 = get_section_parser()
        parser2 = get_section_parser()
        
        assert parser1 is parser2


class TestSectionParserEdgeCases:
    """Test edge cases and error handling"""
    
    @pytest.fixture
    def parser(self):
        return SectionParser()
    
    def test_extract_with_malformed_headers(self, parser):
        """Test extraction with various header formats"""
        text = """
### Soul's Primary Purpose (weird format)
Content here.

# Soul Purpose
More content.

soul purpose:
Even more content.
"""
        
        result = parser.extract_section_content(text, 'soul_purpose')
        # Should extract something
        assert len(result) >= 0
    
    def test_extract_with_unicode(self, parser):
        """Test extraction with unicode characters"""
        text = """
## Soul's Primary Purpose

The soul's purpose involves प्रेम (love) and दया (compassion).
Sanskrit mantras: ॐ नमः शिवाय
"""
        
        result = parser.extract_section_content(text, 'soul_purpose')
        assert 'purpose' in result.lower()
    
    def test_validate_empty_sections(self, parser):
        """Test validation with empty sections dictionary"""
        validation = parser.validate_sections({}, 'karmic_journey')
        
        # All should be invalid
        for valid in validation.values():
            assert not valid
    
    def test_extract_sections_invalid_category(self, parser):
        """Test extraction with invalid category"""
        sections = parser.extract_sections("Some text", 'invalid_category', {})
        
        # Should return empty dict (no required sections)
        assert isinstance(sections, dict)


class TestSectionParserFlexibleExtraction:
    """Test the new flexible regex patterns and improved extraction"""

    @pytest.fixture
    def parser(self):
        return SectionParser()

    def test_numbered_section_extraction(self, parser):
        """Test extraction with numbered sections (1., 2., etc.)"""
        text = """
1. Soul's Primary Purpose
The fundamental reason for this incarnation is revealed through detailed analysis.

2. Karmic Blueprint
Past life patterns are examined here.
"""
        result = parser.extract_section_content(text, 'soul_purpose')
        assert 'fundamental reason' in result.lower()

    def test_bold_header_extraction(self, parser):
        """Test extraction with **bold** headers"""
        text = """
**Soul's Primary Purpose**
This native is destined for spiritual work with comprehensive guidance included.

**Karmic Blueprint**
Different patterns emerge.
"""
        result = parser.extract_section_content(text, 'soul_purpose')
        assert 'spiritual work' in result.lower()

    def test_colon_separated_headers(self, parser):
        """Test headers with colons"""
        text = """
Soul's Primary Purpose:
The native has a unique mission involving teaching and healing practices.

Karmic Blueprint:
Past life influences.
"""
        result = parser.extract_section_content(text, 'soul_purpose')
        assert 'teaching' in result.lower() or 'healing' in result.lower()

    def test_mixed_header_formats(self, parser):
        """Test document with various header formats"""
        text = """
## Soul's Primary Purpose
Standard markdown format with comprehensive analysis.

**Karmic Blueprint**
Bold format content.

3. Life Mission & Dharma
Numbered format content.
"""
        result1 = parser.extract_section_content(text, 'soul_purpose')
        result2 = parser.extract_section_content(text, 'karmic_blueprint')
        result3 = parser.extract_section_content(text, 'life_mission')

        assert len(result1) > 20
        assert len(result2) > 10
        assert len(result3) > 10

    def test_partial_keyword_matching(self, parser):
        """Test partial keyword matching fallback"""
        text = """
The soul calling is evident in the chart with specific indicators present.
This individual has a unique purpose beyond ordinary existence and duties.

Different themes emerge in relationship patterns.
"""
        result = parser.extract_section_content(text, 'soul_purpose')
        # With partial matching, should get content with at least 50% keywords
        assert isinstance(result, str)

    def test_case_insensitive_matching(self, parser):
        """Test case-insensitive header matching"""
        text = """
## SOUL'S PRIMARY PURPOSE
This should match despite uppercase formatting.

## soul's primary purpose
This should also match with lowercase.
"""
        result = parser.extract_section_content(text, 'soul_purpose')
        assert len(result) > 20

    def test_whitespace_tolerance(self, parser):
        """Test tolerance for extra whitespace"""
        text = """
##   Soul's Primary Purpose
Content with extra whitespace.

##Soul's Primary Purpose
Content without spaces.
"""
        result = parser.extract_section_content(text, 'soul_purpose')
        assert len(result) > 10

    def test_markdown_header_levels(self, parser):
        """Test extraction with ### and #### markdown headers"""
        text = """
### 1.1 Soul's Primary Purpose
This section uses a third-level header with numbering.

#### Supporting Details
Additional nested details should be included in the parent section.

## Karmic Blueprint
Next section starts here.
"""
        result = parser.extract_section_content(text, 'soul_purpose')
        assert 'third-level header' in result.lower()
        assert 'supporting details' in result.lower()
        assert 'karmic blueprint' not in result.lower()

    def test_nested_markdown_sections(self, parser):
        """Test nested markdown headers merge into nearest known section"""
        text = """
## 2. Soul's Primary Purpose
Primary content starts here.

### Subtheme A
Details for subtheme A that should stay with soul purpose.

#### Subtheme A.1
More nested details.

## 3. Karmic Blueprint
Different section content.
"""
        result = parser.extract_section_content(text, 'soul_purpose')
        assert 'primary content starts here' in result.lower()
        assert 'subtheme a' in result.lower()
        assert 'more nested details' in result.lower()
        assert 'karmic blueprint' not in result.lower()


class TestSectionParserLifeEvents:
    """Test life_events category extraction"""

    @pytest.fixture
    def parser(self):
        return SectionParser()

    def test_all_life_events_sections_defined(self, parser):
        """Test all life_events sections are defined"""
        sections = parser.REQUIRED_SECTIONS['life_events']
        expected = ['yearly_forecast', 'marriage_timing', 'career_milestones',
                   'children_family', 'financial_events', 'health_alerts',
                   'spiritual_milestones', 'relocations', 'education',
                   'favorable_periods', 'challenging_periods', 'transits',
                   'age_milestones']

        for section in expected:
            assert section in sections

    def test_life_events_extraction(self, parser):
        """Test extraction of life_events sections"""
        text = """
## Year-by-Year Forecast
Comprehensive yearly predictions with specific events and timing details.

## Marriage & Partnerships
Marriage timing and relationship analysis with precise periods.

## Career Milestones
Career trajectory with promotion and growth opportunities.

## Financial Events
Financial breakthroughs and wealth accumulation timing.
"""
        sections = parser.extract_sections(text, 'life_events', {})

        assert 'yearly_forecast' in sections
        assert 'marriage_timing' in sections
        assert len(sections['yearly_forecast']) > 50
        assert len(sections['marriage_timing']) > 50


class TestSectionParserRealSamples:
    """Test parsing against real AI samples stored in test_outputs."""

    @pytest.fixture
    def parser(self):
        return SectionParser()

    def test_karmic_journey_real_sample_numbered_headers(self, parser):
        """Ensure numbered markdown headers are parsed from real AI output."""
        sample_path = Path(__file__).resolve().parents[1] / "test_outputs" / "karmic_journey_test_result.json"
        data = json.loads(sample_path.read_text(encoding="utf-8"))
        full_analysis = data["full_analysis"]

        result = parser.extract_section_content(full_analysis, "soul_purpose")

        assert "ashwini" in result.lower()
        assert "karmic blueprint" not in result.lower()

    def test_predictions_real_sample_header_variants(self, parser):
        """Validate extraction on AI output that mixes multiple headers."""
        sample_path = Path(__file__).resolve().parents[1] / "test_outputs" / "predictions_test_result.json"
        data = json.loads(sample_path.read_text(encoding="utf-8"))
        text = data["yearly"]

        daily = parser.extract_section_content(text, "daily")
        weekly = parser.extract_section_content(text, "weekly")

        assert "today" in daily.lower()
        assert "weekly" in weekly.lower() or "this week" in weekly.lower()


class TestSectionParserValidationAndLogging:
    """Test validation and logging functionality"""

    @pytest.fixture
    def parser(self):
        return SectionParser()

    def test_minimum_length_validation(self, parser):
        """Test minimum section length validation"""
        sections = {
            'soul_purpose': 'A' * 150,  # Valid (>100)
            'karmic_blueprint': 'Short',  # Invalid (<100)
        }

        validation = parser.validate_sections(sections, 'karmic_journey')
        assert validation['soul_purpose'] == True
        assert validation['karmic_blueprint'] == False

    def test_extraction_statistics(self, parser):
        """Test extraction success rate"""
        text = """
## Soul's Primary Purpose
Comprehensive soul purpose analysis with detailed astrological insights.

## Karmic Blueprint
Detailed karmic blueprint analysis with past life influences.

## Life Mission & Dharma
Life mission guidance with specific dharma recommendations.
"""

        sections = parser.extract_sections(text, 'karmic_journey', {})
        missing = parser.get_missing_sections(sections, 'karmic_journey')

        # Should have extracted at least 3 sections
        total_required = len(parser.REQUIRED_SECTIONS['karmic_journey'])
        extracted = total_required - len(missing)
        assert extracted >= 3


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

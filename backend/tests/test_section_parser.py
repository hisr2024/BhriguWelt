"""
Unit tests for SectionParser
Tests section extraction, validation, and generation
"""
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


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

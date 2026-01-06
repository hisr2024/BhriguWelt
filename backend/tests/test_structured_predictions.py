"""
Integration tests for structured predictions
Tests the complete flow from input to structured output
"""
import pytest
from services.bhrigu_predictions import BhriguPredictionsService
from services.section_parser import SectionParser


class TestStructuredPredictions:
    """Integration tests for structured prediction generation"""
    
    # Test configuration constants
    SUBSTANTIAL_CONTENT_THRESHOLD = 0.7  # 70% of sections should have substantial content
    
    @pytest.fixture
    def service(self):
        """Create a predictions service instance"""
        return BhriguPredictionsService()
    
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
            'place_of_birth': 'Mumbai, India',
            'latitude': 19.0760,
            'longitude': 72.8777
        }
    
    def test_service_initialization(self, service):
        """Test service initializes with all components"""
        assert service is not None
        assert service.openai_service is not None
        assert service.section_parser is not None
        assert service.corpus_db is not None
        assert service.astrology_calculator is not None
    
    def test_karmic_journey_structure(self, service, sample_birth_data):
        """Test karmic journey returns all required sections"""
        result = service.generate_karmic_journey_prediction(sample_birth_data)
        
        # Check basic structure
        assert 'category' in result
        assert result['category'] == 'karmic_journey'
        assert 'title' in result
        assert 'full_analysis' in result
        assert 'metadata' in result
        assert 'generated_at' in result
        
        # Check all required sections are present
        parser = SectionParser()
        required_sections = parser.REQUIRED_SECTIONS['karmic_journey']
        
        for section_key in required_sections:
            assert section_key in result, f"Missing section: {section_key}"
            assert result[section_key] is not None, f"Section {section_key} is None"
            assert len(str(result[section_key])) > 0, f"Section {section_key} is empty"
    
    def test_life_events_structure(self, service, sample_birth_data):
        """Test life events returns all required sections"""
        result = service.generate_life_events_prediction(sample_birth_data)
        
        # Check basic structure
        assert 'category' in result
        assert result['category'] == 'life_events'
        assert 'title' in result
        assert 'full_analysis' in result
        
        # Check all required sections are present
        parser = SectionParser()
        required_sections = parser.REQUIRED_SECTIONS['life_events']
        
        for section_key in required_sections:
            assert section_key in result, f"Missing section: {section_key}"
            assert result[section_key] is not None, f"Section {section_key} is None"
            assert len(str(result[section_key])) > 0, f"Section {section_key} is empty"
    
    def test_predictions_structure(self, service, sample_birth_data):
        """Test predictions returns all required sections"""
        result = service.generate_general_predictions(sample_birth_data)
        
        # Check basic structure
        assert 'category' in result
        assert result['category'] == 'predictions'
        
        # Check all required sections are present
        parser = SectionParser()
        required_sections = parser.REQUIRED_SECTIONS['predictions']
        
        for section_key in required_sections:
            assert section_key in result, f"Missing section: {section_key}"
            assert result[section_key] is not None, f"Section {section_key} is None"
            assert len(str(result[section_key])) > 0, f"Section {section_key} is empty"
    
    def test_past_lives_structure(self, service, sample_birth_data):
        """Test past lives returns all required sections"""
        result = service.generate_past_lives_prediction(sample_birth_data)
        
        assert result['category'] == 'past_lives'
        
        parser = SectionParser()
        required_sections = parser.REQUIRED_SECTIONS['past_lives']
        
        for section_key in required_sections:
            assert section_key in result
            assert result[section_key] is not None
    
    def test_future_lives_structure(self, service, sample_birth_data):
        """Test future lives returns all required sections"""
        result = service.generate_future_lives_prediction(sample_birth_data)
        
        assert result['category'] == 'future_lives'
        
        parser = SectionParser()
        required_sections = parser.REQUIRED_SECTIONS['future_lives']
        
        for section_key in required_sections:
            assert section_key in result
            assert result[section_key] is not None
    
    def test_present_life_structure(self, service, sample_birth_data):
        """Test present life returns all required sections"""
        result = service.generate_present_life_prediction(sample_birth_data)
        
        assert result['category'] == 'present_life'
        
        parser = SectionParser()
        required_sections = parser.REQUIRED_SECTIONS['present_life']
        
        for section_key in required_sections:
            assert section_key in result
            assert result[section_key] is not None
    
    def test_karmic_remedies_structure(self, service, sample_birth_data):
        """Test karmic remedies returns all required sections"""
        result = service.generate_karmic_remedies_prediction(sample_birth_data)
        
        assert result['category'] == 'karmic_remedies'
        
        parser = SectionParser()
        required_sections = parser.REQUIRED_SECTIONS['karmic_remedies']
        
        for section_key in required_sections:
            assert section_key in result
            assert result[section_key] is not None
    
    def test_relationships_structure(self, service, sample_birth_data):
        """Test relationships returns all required sections"""
        result = service.generate_relationships_prediction(sample_birth_data)
        
        assert result['category'] == 'relationships'
        
        parser = SectionParser()
        required_sections = parser.REQUIRED_SECTIONS['relationships']
        
        for section_key in required_sections:
            assert section_key in result
            assert result[section_key] is not None
    
    def test_sections_have_minimum_content(self, service, sample_birth_data):
        """Test that generated sections have meaningful content length"""
        result = service.generate_karmic_journey_prediction(sample_birth_data)
        
        parser = SectionParser()
        required_sections = parser.REQUIRED_SECTIONS['karmic_journey']
        
        # At least some sections should have substantial content
        substantial_sections = 0
        for section_key in required_sections:
            if len(str(result[section_key])) >= 100:
                substantial_sections += 1
        
        # At least 70% of sections should have substantial content
        assert substantial_sections >= len(required_sections) * self.SUBSTANTIAL_CONTENT_THRESHOLD
    
    def test_comprehensive_prediction_routing(self, service, sample_birth_data):
        """Test that comprehensive prediction routes to correct methods"""
        categories = [
            'karmic_journey',
            'past_lives',
            'future_lives',
            'present_life',
            'life_events',
            'karmic_remedies',
            'relationships',
            'predictions'
        ]
        
        for category in categories:
            result = service.generate_comprehensive_prediction(
                sample_birth_data,
                category
            )
            assert result['category'] == category
            assert 'full_analysis' in result
    
    def test_metadata_generation(self, service, sample_birth_data):
        """Test that metadata is properly generated"""
        result = service.generate_karmic_journey_prediction(sample_birth_data)
        
        assert 'metadata' in result
        metadata = result['metadata']
        
        # Check metadata structure
        assert 'zodiac_sign' in metadata
        assert 'nakshatra' in metadata
        assert metadata['zodiac_sign'] == sample_birth_data['zodiac_sign']
        assert metadata['nakshatra'] == sample_birth_data['nakshatra']
    
    def test_no_unstructured_only_results(self, service, sample_birth_data):
        """Test that results always have structured sections, not just full_analysis"""
        result = service.generate_karmic_journey_prediction(sample_birth_data)
        
        parser = SectionParser()
        required_sections = parser.REQUIRED_SECTIONS['karmic_journey']
        
        # Count how many sections have content
        sections_with_content = 0
        for section_key in required_sections:
            if section_key in result and result[section_key]:
                sections_with_content += 1
        
        # All required sections should have content
        assert sections_with_content == len(required_sections), \
            f"Only {sections_with_content}/{len(required_sections)} sections have content"
    
    def test_different_zodiacs(self, service):
        """Test predictions work for different zodiac signs"""
        zodiacs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo']
        nakshatras = ['Ashwini', 'Rohini', 'Mrigashira', 'Pushya', 'Magha', 'Hasta']
        
        for zodiac, nakshatra in zip(zodiacs, nakshatras):
            birth_data = {
                'zodiac_sign': zodiac,
                'nakshatra': nakshatra,
                'moon_sign': zodiac,
                'date_of_birth': '1990-01-01',
                'latitude': 19.0760,
                'longitude': 72.8777
            }
            
            result = service.generate_karmic_journey_prediction(birth_data)
            
            assert result['category'] == 'karmic_journey'
            assert 'soul_purpose' in result
            assert result['soul_purpose'] is not None


class TestAutoRepairFunctionality:
    """Test the auto-repair functionality for missing sections"""
    
    @pytest.fixture
    def service(self):
        return BhriguPredictionsService()
    
    @pytest.fixture
    def sample_birth_data(self):
        return {
            'zodiac_sign': 'Scorpio',
            'nakshatra': 'Anuradha',
            'moon_sign': 'Scorpio',
            'date_of_birth': '1985-11-10',
            'latitude': 28.6139,
            'longitude': 77.2090
        }
    
    def test_auto_repair_fills_missing_sections(self, service, sample_birth_data):
        """Test that auto-repair fills in any missing sections"""
        # Generate prediction
        result = service.generate_life_events_prediction(sample_birth_data)
        
        # Verify all sections are present (auto-repair should have filled them)
        parser = SectionParser()
        required = parser.REQUIRED_SECTIONS['life_events']
        
        missing = []
        for section_key in required:
            if section_key not in result or not result[section_key]:
                missing.append(section_key)
        
        assert len(missing) == 0, f"Auto-repair failed for sections: {missing}"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

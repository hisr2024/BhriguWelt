"""
Tests for Consciousness-Aware AI Module
"""

import pytest
from services.advanced_ai.consciousness_ai import ConsciousnessAwareAI, MultiModalAI


@pytest.fixture
def consciousness_ai():
    """Create ConsciousnessAwareAI instance for testing"""
    return ConsciousnessAwareAI()


@pytest.fixture
def sample_birth_data():
    """Sample birth data for testing"""
    return {
        'name': 'Test User',
        'date_of_birth': '1990-01-01',
        'time_of_birth': '12:00',
        'place_of_birth': 'Mumbai, India',
    }


class TestConsciousnessAwareAI:
    """Test consciousness-aware AI functionality"""

    def test_initialization(self, consciousness_ai):
        """Test AI initialization"""
        assert consciousness_ai is not None
        assert consciousness_ai.ethical_constraints is not None
        assert consciousness_ai.bias_detectors is not None

    def test_ethical_constraints_loaded(self, consciousness_ai):
        """Test ethical constraints are properly loaded"""
        constraints = consciousness_ai.ethical_constraints

        assert constraints['respect_free_will'] is True
        assert constraints['avoid_fatalism'] is True
        assert constraints['promote_growth'] is True
        assert constraints['avoid_harm'] is True

    def test_bias_detectors_loaded(self, consciousness_ai):
        """Test bias detectors are properly loaded"""
        detectors = consciousness_ai.bias_detectors

        assert 'gender_bias' in detectors
        assert 'cultural_bias' in detectors
        assert 'socioeconomic_bias' in detectors

    def test_validate_ethics_good_prediction(self, consciousness_ai):
        """Test ethical validation with good prediction"""
        good_prediction = "You have the choice to grow and develop your skills. Your path is filled with opportunities for learning."

        result = consciousness_ai._validate_ethics(good_prediction)

        assert result['passed'] is True
        assert result['score'] >= 0.9
        assert len(result['violations']) == 0

    def test_validate_ethics_fatalistic_prediction(self, consciousness_ai):
        """Test ethical validation detects fatalistic language"""
        bad_prediction = "You are doomed to fail and there is no way out of this situation."

        result = consciousness_ai._validate_ethics(bad_prediction)

        assert result['passed'] is False
        assert result['score'] < 1.0
        assert len(result['violations']) > 0
        assert any('fatalistic' in v.lower() for v in result['violations'])

    def test_detect_biases_clean_prediction(self, consciousness_ai, sample_birth_data):
        """Test bias detection with clean prediction"""
        clean_prediction = "Your talents and abilities will help you achieve your goals."

        result = consciousness_ai._detect_biases(clean_prediction, sample_birth_data)

        assert result['bias_free'] is True
        assert result['score'] >= 0.9
        assert len(result['detected_biases']) == 0

    def test_detect_biases_gender_bias(self, consciousness_ai, sample_birth_data):
        """Test bias detection catches gender bias"""
        biased_prediction = "Women should focus on family while men must pursue career."

        result = consciousness_ai._detect_biases(biased_prediction, sample_birth_data)

        assert result['bias_free'] is False
        assert result['score'] < 1.0
        assert len(result['detected_biases']) > 0
        assert any('gender' in b.lower() for b in result['detected_biases'])

    def test_add_consciousness_awareness(self, consciousness_ai, sample_birth_data):
        """Test consciousness awareness enhancement"""
        basic_prediction = "You will face challenges in your career."

        enhanced = consciousness_ai._add_consciousness_awareness(
            basic_prediction,
            sample_birth_data,
            'career'
        )

        assert len(enhanced) > len(basic_prediction)
        assert 'growth' in enhanced.lower() or 'learn' in enhanced.lower()
        assert 'wisdom' in enhanced.lower() or 'mindful' in enhanced.lower()

    def test_enhance_empowerment(self, consciousness_ai):
        """Test empowerment enhancement"""
        disempowering = "You must do this. You cannot avoid it. You will fail."

        empowered = consciousness_ai._enhance_empowerment(disempowering)

        assert 'must' not in empowered.lower() or empowered.count('must') < disempowering.count('must')
        assert 'choose' in empowered.lower() or 'consider' in empowered.lower()
        assert 'cannot' not in empowered.lower()

    def test_assess_consciousness_level_high(self, consciousness_ai):
        """Test consciousness level assessment - high"""
        high_prediction = "Your awareness and consciousness will guide your transformation. Embrace this wisdom and mindfulness in your growth journey."

        level = consciousness_ai._assess_consciousness_level(high_prediction)

        assert level == 'high'

    def test_assess_consciousness_level_medium(self, consciousness_ai):
        """Test consciousness level assessment - medium"""
        medium_prediction = "You will learn and understand new concepts. This will help you develop and improve."

        level = consciousness_ai._assess_consciousness_level(medium_prediction)

        assert level in ['medium', 'high']

    def test_assess_consciousness_level_low(self, consciousness_ai):
        """Test consciousness level assessment - low"""
        low_prediction = "You must do this. You should follow that. You have to complete this. You cannot avoid it."

        level = consciousness_ai._assess_consciousness_level(low_prediction)

        assert level == 'low'

    def test_calculate_quality_score(self, consciousness_ai):
        """Test quality score calculation"""
        prediction = "Your journey offers many opportunities for growth and learning. Trust your inner wisdom."

        ethical_check = {'score': 1.0, 'violations': [], 'passed': True}
        bias_check = {'score': 1.0, 'detected_biases': [], 'bias_free': True}

        score = consciousness_ai._calculate_quality_score(
            prediction,
            ethical_check,
            bias_check
        )

        assert 0.0 <= score <= 1.0
        assert score >= 0.7  # Should be high for good prediction

    def test_enhance_prediction_success(self, consciousness_ai, sample_birth_data):
        """Test full prediction enhancement"""
        raw_prediction = "You will face challenges but can overcome them through effort."

        result = consciousness_ai.enhance_prediction(
            raw_prediction,
            sample_birth_data,
            'career',
            {}
        )

        assert 'enhanced_prediction' in result
        assert 'original_prediction' in result
        assert 'ethical_score' in result
        assert 'bias_score' in result
        assert 'consciousness_level' in result
        assert 'quality_score' in result

        assert len(result['enhanced_prediction']) >= len(raw_prediction)
        assert result['ethical_score'] >= 0.0
        assert result['bias_score'] >= 0.0

    def test_enhance_prediction_with_improvements(self, consciousness_ai, sample_birth_data):
        """Test prediction enhancement improves quality"""
        poor_prediction = "You must do this. You are doomed if you don't."

        result = consciousness_ai.enhance_prediction(
            poor_prediction,
            sample_birth_data,
            'general',
            {}
        )

        # Enhanced prediction should be better than original
        assert result['enhanced_prediction'] != poor_prediction
        assert 'must' not in result['enhanced_prediction'].lower()
        assert 'doomed' not in result['enhanced_prediction'].lower()


class TestMultiModalAI:
    """Test multi-modal AI functionality"""

    def test_initialization(self):
        """Test multi-modal AI initialization"""
        mm_ai = MultiModalAI()

        assert mm_ai is not None
        assert 'text' in mm_ai.supported_modes
        assert 'vision' in mm_ai.supported_modes
        assert 'audio' in mm_ai.supported_modes

    def test_process_birth_chart_image_placeholder(self):
        """Test vision processing placeholder"""
        mm_ai = MultiModalAI()

        result = mm_ai.process_birth_chart_image(b'fake_image_data')

        assert 'error' in result
        assert result['confidence'] == 0.0

    def test_process_audio_query_placeholder(self):
        """Test audio processing placeholder"""
        mm_ai = MultiModalAI()

        result = mm_ai.process_audio_query(b'fake_audio_data')

        assert result == ""


class TestIntegration:
    """Integration tests"""

    def test_full_prediction_enhancement_pipeline(self, consciousness_ai, sample_birth_data):
        """Test complete enhancement pipeline"""
        # Simulate a prediction with issues
        raw_prediction = """
        You must follow this path strictly. Women should focus on relationships.
        You are doomed if you don't listen. There is no other way.
        """

        # Enhance
        result = consciousness_ai.enhance_prediction(
            raw_prediction,
            sample_birth_data,
            'relationships',
            {}
        )

        # Verify improvements
        enhanced = result['enhanced_prediction']

        # Should remove fatalistic language
        assert 'doomed' not in enhanced.lower()

        # Should be more empowering
        assert 'choose' in enhanced.lower() or 'consider' in enhanced.lower()

        # Should have consciousness additions
        assert len(enhanced) > len(raw_prediction)

        # Should have reasonable quality scores
        assert result['quality_score'] > 0.0

    def test_enhancement_preserves_good_content(self, consciousness_ai, sample_birth_data):
        """Test that enhancement preserves already-good content"""
        good_prediction = "Your awareness and inner wisdom will guide you. Trust your choices and embrace growth opportunities."

        result = consciousness_ai.enhance_prediction(
            good_prediction,
            sample_birth_data,
            'spiritual',
            {}
        )

        # Should maintain high scores
        assert result['ethical_score'] >= 0.9
        assert result['bias_score'] >= 0.9
        assert result['consciousness_level'] == 'high'

        # Should not drastically change good content
        assert good_prediction in result['enhanced_prediction'] or \
               all(word in result['enhanced_prediction'] for word in good_prediction.split()[:5])

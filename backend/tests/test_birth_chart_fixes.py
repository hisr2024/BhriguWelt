"""
Tests for birth chart parameter fixes and validator
Validates Issue 1 and Issue 2 fixes
"""
import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.validators import validate_birth_data
from services.astrology_calculator import AstrologyCalculator


class TestValidateBirthData:
    """Test the validate_birth_data function (Issue 1 fix)"""
    
    def test_valid_with_place_of_birth(self):
        """Test validation with place_of_birth"""
        data = {
            'date_of_birth': '1990-01-15',
            'time_of_birth': '14:30',
            'place_of_birth': 'New Delhi, India'
        }
        result = validate_birth_data(data)
        assert result is None, f"Should be valid but got: {result}"
    
    def test_valid_with_coordinates(self):
        """Test validation with latitude/longitude"""
        data = {
            'date_of_birth': '1990-01-15',
            'time_of_birth': '14:30',
            'latitude': 28.6139,
            'longitude': 77.2090
        }
        result = validate_birth_data(data)
        assert result is None, f"Should be valid but got: {result}"
    
    def test_valid_with_both_place_and_coords(self):
        """Test validation with both place and coordinates"""
        data = {
            'date_of_birth': '1990-01-15',
            'time_of_birth': '14:30',
            'place_of_birth': 'New Delhi, India',
            'latitude': 28.6139,
            'longitude': 77.2090
        }
        result = validate_birth_data(data)
        assert result is None, f"Should be valid but got: {result}"
    
    def test_invalid_missing_both_location(self):
        """Test validation fails when both place and coords are missing"""
        data = {
            'date_of_birth': '1990-01-15',
            'time_of_birth': '14:30'
        }
        result = validate_birth_data(data)
        assert result is not None
        assert 'place_of_birth' in result or 'latitude' in result
    
    def test_invalid_empty_request_body(self):
        """Test validation fails with empty request body"""
        result = validate_birth_data({})
        assert result == "Request body is required"
    
    def test_invalid_date_format(self):
        """Test validation fails with invalid date format"""
        data = {
            'date_of_birth': '15-01-1990',  # Wrong format
            'time_of_birth': '14:30',
            'place_of_birth': 'New Delhi'
        }
        result = validate_birth_data(data)
        assert result is not None
        assert 'YYYY-MM-DD' in result
    
    def test_invalid_time_format(self):
        """Test validation fails with invalid time format"""
        data = {
            'date_of_birth': '1990-01-15',
            'time_of_birth': '25:30',  # Invalid hour
            'place_of_birth': 'New Delhi'
        }
        result = validate_birth_data(data)
        assert result is not None
        assert 'HH:MM' in result
    
    def test_invalid_coordinates(self):
        """Test validation fails with invalid coordinates"""
        data = {
            'date_of_birth': '1990-01-15',
            'time_of_birth': '14:30',
            'latitude': 100,  # Invalid latitude (> 90)
            'longitude': 77.2090
        }
        result = validate_birth_data(data)
        assert result is not None
        assert 'latitude' in result.lower()


class TestBirthChartCalculation:
    """Test birth chart calculation with new parameter format (Issue 2 fix)"""
    
    def test_calculate_with_place(self):
        """Test birth chart calculation with place parameter"""
        calc = AstrologyCalculator()
        chart = calc.calculate_birth_chart(
            date_of_birth='1990-01-15',
            time_of_birth='14:30',
            place='New Delhi, India'
        )
        assert chart is not None
        assert 'zodiac_sign' in chart
        assert 'moon_sign' in chart
        assert 'ascendant' in chart
    
    def test_calculate_with_coordinates(self):
        """Test birth chart calculation with coordinates"""
        calc = AstrologyCalculator()
        chart = calc.calculate_birth_chart(
            date_of_birth='1990-01-15',
            time_of_birth='14:30',
            place='',
            latitude=28.6139,
            longitude=77.2090
        )
        assert chart is not None
        assert 'zodiac_sign' in chart
        assert 'moon_sign' in chart
        assert 'ascendant' in chart
    
    def test_calculate_with_optional_coords(self):
        """Test birth chart calculation with place and optional coordinates"""
        calc = AstrologyCalculator()
        chart = calc.calculate_birth_chart(
            date_of_birth='1990-01-15',
            time_of_birth='14:30',
            place='New Delhi, India',
            latitude=None,
            longitude=None
        )
        assert chart is not None
        assert 'zodiac_sign' in chart


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

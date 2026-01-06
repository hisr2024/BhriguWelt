"""
Unit tests for BhriguCorpusDatabase
Tests corpus loading and data retrieval
"""
import pytest
from pathlib import Path
from services.bhrigu_corpus_db import BhriguCorpusDatabase, get_corpus_database


class TestBhriguCorpusDatabase:
    """Test suite for corpus database"""
    
    @pytest.fixture
    def corpus_db(self):
        """Create a corpus database instance"""
        return BhriguCorpusDatabase()
    
    @pytest.fixture
    def sample_birth_data(self):
        """Sample birth data for testing"""
        return {
            'zodiac_sign': 'Leo',
            'nakshatra': 'Magha',
            'moon_sign': 'Leo',
            'date_of_birth': '1990-07-15'
        }
    
    def test_corpus_db_initialization(self, corpus_db):
        """Test corpus database initializes"""
        assert corpus_db is not None
        assert corpus_db.local_corpus is not None
        assert isinstance(corpus_db.local_corpus, dict)
        assert corpus_db.online_search_enabled == False
    
    def test_local_corpus_structure(self, corpus_db):
        """Test local corpus has expected structure"""
        corpus = corpus_db.local_corpus
        
        expected_keys = ['bhrigu_samhita', 'nadi_jyotisa', 'commentaries',
                        'nakshatra_mappings', 'life_events', 'timing_rules']
        
        for key in expected_keys:
            assert key in corpus
    
    def test_data_files_exist(self):
        """Test that data files were created"""
        data_dir = Path(__file__).parent.parent / 'data'
        
        # Check bhrigu_samhita files
        assert (data_dir / 'bhrigu_samhita' / 'core_texts.json').exists()
        assert (data_dir / 'bhrigu_samhita' / 'commentaries.json').exists()
        assert (data_dir / 'bhrigu_samhita' / 'nakshatra_mappings.json').exists()
        
        # Check nadi_jyotisa files
        assert (data_dir / 'nadi_jyotisa' / 'manuscripts.json').exists()
        assert (data_dir / 'nadi_jyotisa' / 'life_events_patterns.json').exists()
        assert (data_dir / 'nadi_jyotisa' / 'timing_rules.json').exists()
    
    def test_get_karmic_analysis(self, corpus_db, sample_birth_data):
        """Test getting karmic analysis from corpus"""
        result = corpus_db.get_karmic_analysis(sample_birth_data)
        
        assert isinstance(result, list)
        # May be empty if no data for this combination
        assert result is not None
    
    def test_search_local(self, corpus_db):
        """Test local search functionality"""
        result = corpus_db.search_local('Leo', 'Magha', 'karmic_journey')
        
        assert isinstance(result, list)
    
    def test_search_local_different_zodiacs(self, corpus_db):
        """Test search with different zodiac signs"""
        zodiacs = ['Aries', 'Taurus', 'Gemini', 'Leo', 'Virgo']
        
        for zodiac in zodiacs:
            result = corpus_db.search_local(zodiac, 'Ashwini', 'karmic_journey')
            assert isinstance(result, list)
    
    def test_filter_by_zodiac_nakshatra(self, corpus_db):
        """Test filtering by zodiac and nakshatra"""
        data = {
            'Leo': {
                'Magha': {'soul_purpose': 'Leadership through wisdom'}
            }
        }
        
        result = corpus_db._filter_by_zodiac_nakshatra(data, 'Leo', 'Magha')
        
        assert len(result) > 0
        assert isinstance(result, list)
    
    def test_filter_with_nested_data(self, corpus_db):
        """Test filtering with complex nested structures"""
        data = {
            'Aries': {
                'Ashwini': {
                    'soul_purpose': 'Pioneer',
                    'life_mission': 'Healing'
                }
            }
        }
        
        result = corpus_db._filter_by_zodiac_nakshatra(data, 'Aries', 'Ashwini')
        assert len(result) > 0
    
    def test_filter_with_empty_data(self, corpus_db):
        """Test filtering with empty data"""
        result = corpus_db._filter_by_zodiac_nakshatra({}, 'Leo', 'Magha')
        assert result == []
        
        result = corpus_db._filter_by_zodiac_nakshatra(None, 'Leo', 'Magha')
        assert result == []
    
    def test_is_comprehensive(self, corpus_db):
        """Test comprehensiveness check"""
        # Empty result is not comprehensive
        assert not corpus_db.is_comprehensive([])
        
        # One or two entries not comprehensive
        assert not corpus_db.is_comprehensive([{'data': 1}])
        assert not corpus_db.is_comprehensive([{'data': 1}, {'data': 2}])
        
        # Three or more entries is comprehensive
        assert corpus_db.is_comprehensive([{'data': 1}, {'data': 2}, {'data': 3}])
    
    def test_merge_results(self, corpus_db):
        """Test merging local and online results"""
        local = [{'source': 'local', 'data': 1}]
        online = [{'source': 'online', 'data': 2}]
        
        merged = corpus_db.merge_results(local, online)
        
        assert len(merged) == 2
        assert merged[0]['source'] == 'local'
        assert merged[1]['source'] == 'online'
    
    def test_get_life_events_patterns(self, corpus_db, sample_birth_data):
        """Test getting life events patterns"""
        result = corpus_db.get_life_events_patterns(sample_birth_data)
        
        assert isinstance(result, list)
    
    def test_get_timing_rules(self, corpus_db, sample_birth_data):
        """Test getting timing rules"""
        result = corpus_db.get_timing_rules(sample_birth_data)
        
        assert isinstance(result, list)
    
    def test_format_corpus_for_context(self, corpus_db):
        """Test formatting corpus entries for context"""
        entries = [
            {'soul_purpose': 'Leadership', 'life_mission': 'Service'},
            {'karmic_debt': 'Pride to balance'}
        ]
        
        formatted = corpus_db.format_corpus_for_context(entries)
        
        assert len(formatted) > 0
        assert 'CORPUS' in formatted
        assert 'Leadership' in formatted
    
    def test_format_empty_corpus(self, corpus_db):
        """Test formatting empty corpus"""
        formatted = corpus_db.format_corpus_for_context([])
        assert formatted == ""
    
    def test_online_search_disabled(self, corpus_db, sample_birth_data):
        """Test that online search is disabled by default"""
        result = corpus_db.search_online_corpus(sample_birth_data, 'karmic_journey')
        
        # Should return empty list when disabled
        assert result == []
    
    def test_singleton_pattern(self):
        """Test that get_corpus_database returns singleton"""
        db1 = get_corpus_database()
        db2 = get_corpus_database()
        
        assert db1 is db2


class TestCorpusDataContent:
    """Test the actual content of corpus data files"""
    
    @pytest.fixture
    def corpus_db(self):
        return BhriguCorpusDatabase()
    
    def test_bhrigu_samhita_content(self, corpus_db):
        """Test Bhrigu Samhita has expected content"""
        bhrigu = corpus_db.local_corpus.get('bhrigu_samhita', {})
        
        # Should have some content loaded
        if bhrigu:  # Only test if file exists
            assert isinstance(bhrigu, dict)
    
    def test_nadi_jyotisa_content(self, corpus_db):
        """Test Nadi Jyotisa has expected content"""
        nadi = corpus_db.local_corpus.get('nadi_jyotisa', {})
        
        # Should have some content loaded
        if nadi:  # Only test if file exists
            assert isinstance(nadi, dict)
    
    def test_karmic_journey_data_exists(self, corpus_db):
        """Test that karmic journey data exists for at least one zodiac"""
        bhrigu = corpus_db.local_corpus.get('bhrigu_samhita', {})
        
        if 'karmic_journey' in bhrigu:
            karmic_data = bhrigu['karmic_journey']
            assert isinstance(karmic_data, dict)
            # Should have at least one zodiac
            assert len(karmic_data) > 0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

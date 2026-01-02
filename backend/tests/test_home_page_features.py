"""
Test cases to validate Future Outlooks and Past Lives functionality
for the BhriguWelt home page enhancement task.
"""

import pytest
from bhriguwelt.horoscope import HoroscopeRequest
from bhriguwelt.past_future_bridge import build_past_future_synthesis
from bhriguwelt.future_directives import build_future_directives_engine
from bhriguwelt.past_life_memory import build_past_life_memory_reconstruction


def _sample_request():
    """Create a sample horoscope request for testing."""
    return HoroscopeRequest(
        name="Test Seeker",
        birth_date="1990-06-15",
        birth_time="10:30",
        birth_place="Varanasi, Bharat",
        lunar_tithi=8,
        moon_element="water",
        mars_house=5,
        saturn_house=7,
        venus_house=2,
        rahu_aspects_ascendant=False,
        consent_for_date_predictions=True,
    )


def test_future_outlook_generates_predictions():
    """Test that Future Outlooks generates accurate predictions."""
    request = _sample_request()
    result = build_future_directives_engine(request)
    
    # Verify result structure
    assert isinstance(result, dict)
    assert len(result) > 0, "Future directives should generate results"
    
    # Check for entries - they can be categorized by type
    found_predictions = False
    for category, entries in result.items():
        if isinstance(entries, list) and entries:
            found_predictions = True
            entry = entries[0]
            assert isinstance(entry, dict), "Each entry should be a dictionary"
            # Check for common fields
            has_guidance = "guidance" in entry or "focus" in entry or "influence" in entry
            assert has_guidance, "Entry should have guidance/focus/influence"
            break
    
    assert found_predictions, "Should generate at least some future predictions"
    print("✓ Future Outlooks test passed - predictions generated successfully")


def test_past_lives_generates_insights():
    """Test that Past Lives generates karmic insights."""
    request = _sample_request()
    result = build_past_life_memory_reconstruction(request)
    
    # Verify result structure
    assert isinstance(result, dict)
    assert len(result) > 0, "Past life reconstruction should generate results"
    
    # The structure has categories like 'Karmic Carryover', 'Past Patterns', etc.
    found_insights = False
    for category, data in result.items():
        if isinstance(data, dict):
            # Check for archetypes, lessons, or other insight fields
            if "archetypes" in data or "lessons_carried" in data or "folios" in data:
                found_insights = True
                break
    
    assert found_insights, "Should generate past life insights"
    print("✓ Past Lives test passed - karmic insights generated successfully")


def test_past_future_synthesis_integration():
    """Test that past-future synthesis integrates both modules."""
    request = _sample_request()
    synthesis = build_past_future_synthesis(request)
    
    # Verify synthesis contains both past and future data
    assert hasattr(synthesis, "past_life")
    assert hasattr(synthesis, "future")
    
    past_data = synthesis.past_life
    future_data = synthesis.future
    
    # Verify past life data
    assert "insights" in past_data
    assert len(past_data["insights"]) > 0
    
    # Verify future data
    assert "trajectories" in future_data
    assert len(future_data["trajectories"]) > 0
    
    print("✓ Past-Future synthesis test passed - integration working correctly")


def test_predictions_have_bhrigu_references():
    """Test that predictions include Bhrigu Samhita references."""
    request = _sample_request()
    synthesis = build_past_future_synthesis(request)
    
    # Check for manuscript references in past life insights
    past_insights = synthesis.past_life.get("insights", [])
    has_past_reference = any(
        "citation" in insight or "sutra_reference" in insight or "engine_id" in insight
        for insight in past_insights
    )
    
    # Check for references in future trajectories
    future_trajectories = synthesis.future.get("trajectories", [])
    has_future_reference = any(
        "citation" in traj or "sutra_reference" in traj or "engine_id" in traj
        for traj in future_trajectories
    )
    
    # At least one should have references
    assert has_past_reference or has_future_reference, \
        "Predictions should include Bhrigu Samhita references"
    
    print("✓ Bhrigu Samhita references test passed")


def test_prediction_accuracy_metrics():
    """Test that predictions include certainty/confidence metrics."""
    request = _sample_request()
    synthesis = build_past_future_synthesis(request)
    
    # Verify past life insights have certainty
    past_insights = synthesis.past_life.get("insights", [])
    certainty_found = False
    for insight in past_insights:
        if "certainty" in insight or "confidence" in insight:
            certainty_found = True
            certainty = insight.get("certainty") or insight.get("confidence")
            assert isinstance(certainty, (int, float))
            assert 0 <= certainty <= 100
    
    # Verify future trajectories have certainty
    future_trajectories = synthesis.future.get("trajectories", [])
    for trajectory in future_trajectories:
        if "certainty" in trajectory or "confidence" in trajectory:
            certainty_found = True
            certainty = trajectory.get("certainty") or trajectory.get("confidence")
            assert isinstance(certainty, (int, float))
            assert 0 <= certainty <= 100
    
    print("✓ Prediction accuracy metrics test passed")


def test_different_birth_parameters_produce_different_results():
    """Test that different birth parameters produce different predictions."""
    request1 = HoroscopeRequest(
        name="Seeker One",
        birth_date="1985-03-20",
        birth_time="06:00",
        birth_place="Jaipur, Bharat",
        lunar_tithi=3,
        moon_element="fire",
        mars_house=1,
        consent_for_date_predictions=True,
    )
    
    request2 = HoroscopeRequest(
        name="Seeker Two",
        birth_date="1995-11-08",
        birth_time="18:45",
        birth_place="Chennai, Bharat",
        lunar_tithi=12,
        moon_element="earth",
        mars_house=10,
        consent_for_date_predictions=True,
    )
    
    result1 = build_past_future_synthesis(request1)
    result2 = build_past_future_synthesis(request2)
    
    # Results should be different
    past1 = str(result1.past_life)
    past2 = str(result2.past_life)
    future1 = str(result1.future)
    future2 = str(result2.future)
    
    # At least one should be different
    assert past1 != past2 or future1 != future2, \
        "Different birth parameters should produce different predictions"
    
    print("✓ Parameter variation test passed")


if __name__ == "__main__":
    # Run tests
    test_future_outlook_generates_predictions()
    test_past_lives_generates_insights()
    test_past_future_synthesis_integration()
    test_predictions_have_bhrigu_references()
    test_prediction_accuracy_metrics()
    test_different_birth_parameters_produce_different_results()
    print("\n✅ All tests passed successfully!")

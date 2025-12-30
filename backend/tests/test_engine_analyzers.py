from bhriguwelt.engine_analyzers import analyze_core_engines


def _analysis_by_engine(bundle=None, tradition="universal"):
    analyses = analyze_core_engines(tradition, core_bundle=bundle)
    return {analysis.engine: analysis for analysis in analyses}


def test_analyzer_flags_missing_manuscript_fields():
    bundle = {
        "principles": [
            {"id": "BR-X", "description": "anchor", "sutra_reference": "folio"},
        ],
        "remedies": [
            {"id": "REM-X", "description": "remedy", "sutra_reference": "folio"},
        ],
        "past_life_engines": [
            {"id": "PL-X", "description": "desc", "sutra_reference": "folio"},
        ],
        "future_engines": [
            {"id": "FU-X", "description": "desc", "trajectory": "path", "sutra_reference": "folio"},
        ],
        "transit_rules": [
            {"id": "TR-X", "influence": "impact", "sutra_reference": "folio"},
        ],
        "matchmaking_criteria": [
            {"id": "MM-X", "description": "desc", "sutra_reference": "folio"},
        ],
    }

    analysis_map = _analysis_by_engine(bundle)

    assert not analysis_map["past_life_engines"].aligned_to_bhrigu
    assert "PL-X:narrative" in analysis_map["past_life_engines"].missing_manuscript_fields
    assert not analysis_map["matchmaking_criteria"].aligned_to_bhrigu
    assert "MM-X:pair_rules" in analysis_map["matchmaking_criteria"].missing_manuscript_fields

    assert analysis_map["principles"].aligned_to_bhrigu
    assert analysis_map["remedies"].aligned_to_bhrigu
    assert analysis_map["future_engines"].aligned_to_bhrigu
    assert analysis_map["transit_rules"].aligned_to_bhrigu


def test_analyzer_uses_bhrigu_corpus_defaults():
    analyses = analyze_core_engines("Northern")
    assert all(analysis.tradition == "northern" for analysis in analyses)
    assert all(analysis.aligned_to_bhrigu for analysis in analyses)
    assert all(analysis.sutra_references for analysis in analyses if analysis.engine != "remedies")

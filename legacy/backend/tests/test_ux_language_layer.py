from bhriguwelt.ux_language_layer import compose_language_layer


def test_compose_language_layer_supports_hindi_and_tones():
    layer = compose_language_layer(
        seeker={"name": "Asha", "tradition": "universal"},
        horoscope={"karmic_epoch": "learning arc"},
        past_life={"interpretation": "Past insight"},
        future={"interpretation": "Future insight", "trajectories": [{"focus": "career", "window": "2025"}]},
        timeline={"summary": "Five-stage growth"},
        matchmaking={"interpretation": "Match hint", "compatibility": {"compatibility_index": 82}},
        language="hi",
        tone="spiritual",
        cultural_sensitivity="diaspora",
    ).to_dict()

    assert layer["language"] == "hi"
    assert layer["tone"] == "spiritual"
    assert any(section.get("title") for section in layer["sections"])
    assert "Asha" in layer["introduction"]
    assert layer["disclaimer"]



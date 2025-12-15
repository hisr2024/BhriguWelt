from bhriguwelt.rule_dsl import DSLParseError, compile_dsl_to_dataset_entries, parse_dsl


def test_parse_dsl_parses_typed_values_including_lists():
    text = (
        "engine PL-12:\n"
        "  tradition = universal\n"
        "  sutra = \"Bikaner folio 12b\"\n"
        "  desc = \"Watery Moon + Jupiter aspect...\"\n"
        "  narrative = \"...\"\n"
        "  confidence = 0.82\n"
        "  when:\n"
        "    moon_element any_of [water]\n"
        "    lunar_tithi min 1\n"
        "    lunar_tithi max 8\n"
        "    rahu_aspects_ascendant equals true\n"
        "engine DEMO-2:\n"
        "  when:\n"
        "    example_field any_of [1, 2, 3.5, true, \"foo\"]\n"
    )

    engines = parse_dsl(text)

    assert len(engines) == 2
    first = engines[0]
    assert first["id"] == "PL-12"
    assert first["description"] == "Watery Moon + Jupiter aspect..."
    assert first["sutra_reference"] == "Bikaner folio 12b"
    assert first["confidence"] == 0.82
    assert first["conditions"]["moon_element"]["any_of"] == ["water"]
    assert first["conditions"]["lunar_tithi"] == {"min": 1, "max": 8}
    assert first["conditions"]["rahu_aspects_ascendant"]["equals"] is True

    second = engines[1]
    assert second["conditions"]["example_field"]["any_of"] == [1, 2, 3.5, True, "foo"]


def test_compile_dsl_defaults_tradition_and_conditions():
    text = "engine ONLY:\n  confidence = 1\n"
    engines = compile_dsl_to_dataset_entries(text)

    assert engines[0]["tradition"] == "universal"
    assert engines[0]["conditions"] == {}


def test_parse_dsl_rejects_unknown_ops():
    text = "engine OOPS:\n  when:\n    field unknown 1\n"

    try:
        parse_dsl(text)
    except DSLParseError as exc:  # pragma: no cover - specific branch assertion
        assert exc.line == 3
        assert "unsupported op" in exc.message
    else:  # pragma: no cover - parse_dsl must raise
        raise AssertionError("expected DSLParseError")

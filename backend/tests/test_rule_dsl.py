from bhriguwelt.rule_dsl import all_of, any_of, between, compile_rule, eq, Rule


def test_eq_any_of_between_compile():
    compiled = compile_rule(
        all_of(
            eq("moon_element", "water"),
            any_of("mars_house", [1, 5, 9]),
            between("lunar_tithi", 1, 10),
        )
    )

    assert compiled["moon_element"]["equals"] == "water"
    assert compiled["mars_house"]["any_of"] == [1, 5, 9]
    assert compiled["lunar_tithi"] == {"min": 1, "max": 10}



def test_all_of_merges_rules():
    rule_a = eq("saturn_house", 7)
    rule_b = any_of("saturn_house", [7, 8])
    merged = compile_rule(all_of(rule_a, rule_b))

    assert merged["saturn_house"]["equals"] == 7
    assert merged["saturn_house"]["any_of"] == [7, 8]



def test_compile_rule_accepts_mapping():
    mapping = {"venus_house": {"equals": 2}}
    assert compile_rule(mapping) == mapping
    assert compile_rule(None) == {}
    try:
        compile_rule("bad")
    except TypeError:
        pass
    else:  # pragma: no cover - guard
        raise AssertionError("compile_rule should reject strings")

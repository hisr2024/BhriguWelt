import dataclasses

from bhriguwelt.calculations import CelestialSnapshot
from bhriguwelt.taxonomy_generator import generate_future_taxonomy, generate_past_life_taxonomy


SNAPSHOT_FIELDS = {f.name for f in dataclasses.fields(CelestialSnapshot)}
ALLOWED_COMPARATORS = {"equals", "any_of", "min", "max"}


def _assert_engine_shape(engine, required):
    for field in required:
        assert engine.get(field)
    for key, rule in engine.get("conditions", {}).items():
        assert key in SNAPSHOT_FIELDS
        assert set(rule).issubset(ALLOWED_COMPARATORS)


def test_generate_past_life_taxonomy_bounds():
    engines = generate_past_life_taxonomy(1, 3)
    assert [e["id"] for e in engines] == ["PL-1", "PL-2", "PL-3"]
    for engine in engines:
        _assert_engine_shape(engine, ["id", "sutra_reference", "description", "narrative", "tradition"])


def test_generate_future_taxonomy_bounds_and_errors():
    engines = generate_future_taxonomy(2, 4)
    assert [e["id"] for e in engines] == ["FU-2", "FU-3", "FU-4"]
    for engine in engines:
        _assert_engine_shape(engine, ["id", "sutra_reference", "description", "trajectory", "tradition"])

    try:
        generate_future_taxonomy(5, 4)
    except ValueError:
        pass
    else:  # pragma: no cover - guard
        raise AssertionError("expected start>end to raise")

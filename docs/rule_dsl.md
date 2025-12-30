# Rule Authoring DSL

The rule DSL is a YAML/JSON surface that compiles into the canonical dataset
structure consumed by the Bhrigu engines. It focuses on a minimal comparator set
(`equals`, `any_of`, `min`, `max`) and guarded matchmaking comparators.

## Structure

- Top-level keys are rule identifiers following `PREFIX-<number>` (e.g., `PL-7`
  or `FU-19`).
- Each rule maps to a block with `when` (conditions) and `then` (payload) keys.
- Conditions are field->comparator mappings. Scalars automatically map to
  `equals` during compilation.

### Supported comparators

- `equals`: strict equality
- `any_of`: list/tuple/set of acceptable values
- `min` / `max`: inclusive numeric bounds
- Matchmaking `pair_rules` use the existing engine surface: `comparator`
  values of `harmonious` (list of compatible sets) or `distance` (numeric
  difference with optional `circular`), paired with `weight`.

## Examples

### Past life rule (YAML)

```yaml
PL-12:
  when:
    moon_nakshatra:
      any_of: ["Ashlesha", "Revati"]
    mercury_score:
      min: 0.4
      max: 0.8
  then:
    narrative: "Scholar-priest with meticulous record keeping"
    sutra_reference: "Kashi folio 7c"
    confidence: 0.72
```

### Future trajectory (JSON)

```json
{
  "FU-9": {
    "when": {"sun_rashi": {"equals": "Leo"}},
    "then": {
      "trajectory": "Leadership via community platforms",
      "sutra_reference": "Sharada leaf 21a",
      "certainty": 0.66
    }
  }
}
```

### Matchmaking snippet

```yaml
MM-21:
  when: {}
  then:
    sutra_reference: "Grantha scroll 44d"
    description: "Venus stewardship and thoughtful Mars alignments"
    time_horizon: "long-term"
    base_weight: 0.5
    pair_rules:
      - label: "Venus harmony"
        primary_field: "venus_house"
        partner_field: "venus_house"
        comparator: "distance"
        max_difference: 2
        circular: true
        weight: 0.6
```

## Validation

- Parsing is handled by `parse_dsl`, which accepts YAML when available and
  falls back to JSON or a tiny inlined YAML subset.
- Unsupported comparators raise a `ValueError` during compilation.
- IDs must use supported prefixes (`PL`/`FU`) and numeric suffixes; out-of-range
  values are rejected when compiling to the dataset via `compile_to_dataset`.
- `any_of` must be a list/tuple/set; other comparator values must be numeric or
  scalar.

Compile a DSL file into dataset YAML:

```bash
PYTHONPATH=backend/src python -m bhriguwelt.admin_cli compile-dsl --in rules.yml --out compiled.yml
```


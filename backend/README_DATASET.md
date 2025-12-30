# Bhrigu Samhita dataset operations

The canonical manuscript corpus for the backend lives at:

```
backend/data/bhrigu_samhita_principles.yml
```

The loader resolves this path automatically, but you can point the engine to an
alternate location by exporting `BHRIGUWELT_DATA_PATH`.

## Bootstrapping a scaffold

If the dataset is missing, generate a fresh scaffold (with all PL/FU taxonomy
entries) via the admin CLI:

```bash
cd backend
export PYTHONPATH="$(pwd)/src"
python -m bhriguwelt.admin_cli bootstrap --out backend/data/bhrigu_samhita_principles.yml
```

This invokes the deterministic taxonomy generator and persists the complete
corpus through `persist_bhrigu_data`, preserving principle checksums.

## Linting

Validate a dataset in place with:

```bash
cd backend
export PYTHONPATH="$(pwd)/src"
python -m bhriguwelt.admin_cli lint --path backend/data/bhrigu_samhita_principles.yml
```

The linter loads YAML when available (JSON otherwise), runs the same
`_validate_and_enrich` guards as the runtime loader, and prints a quick summary
of section counts. It exits non-zero on validation errors.

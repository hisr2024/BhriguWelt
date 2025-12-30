# BhriguWelt dataset layout

The canonical Bhrigu Samhita corpus ships with the repository at
`backend/data/bhrigu_samhita_principles.yml`. The loader uses this path by
default and can be overridden for experiments or CI using the
`BHRIGUWELT_DATA_PATH` environment variable.

```bash
export BHRIGUWELT_DATA_PATH=/tmp/bhrigu.yml
PYTHONPATH=backend/src python -m bhriguwelt.admin_cli print-path
```

## Linting

Run the admin lint command to validate schema shape, required keys, checksums,
and duplicate identifiers. The CLI also reports coverage for the expected
taxonomy ranges (PL-1…PL-108 and FU-1…FU-84) in a summary table.

```bash
PYTHONPATH=backend/src python -m bhriguwelt.admin_lint --path backend/data/bhrigu_samhita_principles.yml
```

To autofill missing taxonomy placeholders and persist them back to disk:

```bash
PYTHONPATH=backend/src python -m bhriguwelt.admin_lint --autofill-taxonomy --write-back --path backend/data/bhrigu_samhita_principles.yml
```

## Reweighting with labeled CSVs

The admin CLI supports deterministic, hallucination-free weight updates based
on labeled CSVs:

```bash
PYTHONPATH=backend/src python -m bhriguwelt.admin_cli reweight-csv \
  --in backend/data/bhrigu_samhita_principles.yml \
  --labels weights.csv \
  --out /tmp/reweighted.yml
```

The `weights.csv` file must contain `id`, `weight_key`, and `label` columns.


"""Administrative helpers for managing the Bhrigu dataset."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, Mapping

from . import bhrigu_data
from .data_loader import (
    _compute_principle_checksum,
    _validate_and_enrich,
    current_data_path,
    load_bhrigu_data,
    persist_bhrigu_data,
)
from .ml_weighting import apply_reweighting, supervised_csv_reweight
from .rule_dsl import compile_to_dataset, parse_dsl
from .taxonomy import (
    FUTURE_PREFIX,
    FUTURE_RANGE,
    MATCHMAKING_PREFIX,
    PAST_LIFE_PREFIX,
    PAST_LIFE_RANGE,
    PRINCIPLE_PREFIX,
    REMEDY_PREFIX,
    TRANSIT_PREFIX,
    missing_ids_in_dataset,
    validate_id,
)

try:  # pragma: no cover - optional dependency
    import yaml
except Exception:  # pragma: no cover - offline envs
    yaml = None


def _load_dataset(path: Path | None) -> Dict[str, Any]:
    if path is None:
        return load_bhrigu_data()

    if path.suffix.lower() in {".yml", ".yaml"} and yaml:
        with path.open("r", encoding="utf-8") as handle:
            return _validate_and_enrich(yaml.safe_load(handle))

    with path.open("r", encoding="utf-8") as handle:
        return _validate_and_enrich(json.load(handle))


def _print_summary(dataset: Dict[str, Any]) -> None:
    sections = {
        "principles": dataset.get("principles", []),
        "past_life_engines": dataset.get("past_life_engines", []),
        "future_engines": dataset.get("future_engines", []),
        "transit_rules": dataset.get("transit_rules", []),
        "matchmaking_criteria": dataset.get("matchmaking_criteria", []),
        "remedies": dataset.get("remedies", []),
    }
    for name, entries in sections.items():
        count = len(entries) if isinstance(entries, list) else 0
        print(f"{name}: {count}")


def _bootstrap_dataset(out_path: Path | None) -> Path:
    dataset = bhrigu_data.as_dict()
    target = out_path or current_data_path()
    persist_bhrigu_data(dataset, target)
    return target


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser("bhriguwelt-admin", description="Admin CLI for Bhrigu data")
    sub = parser.add_subparsers(dest="command", required=True)

    lint = sub.add_parser("lint", help="Validate the dataset")
    lint.add_argument("--path", type=str, default="", help="Path to dataset (YAML/JSON)")
    lint.add_argument("--strict", action="store_true", help="Fail when taxonomy ids are missing")

    stats = sub.add_parser("stats", help="Show dataset statistics")
    stats.add_argument("--path", type=str, default="", help="Path to dataset (YAML/JSON)")

    fmt = sub.add_parser("format", help="Re-serialize dataset with stable ordering")
    fmt.add_argument("--path", type=str, required=True, help="Path to dataset (YAML/JSON)")
    fmt.add_argument("--out", type=str, default="", help="Optional output path")

    compile_dsl = sub.add_parser("compile-dsl", help="Compile rule DSL into dataset YAML")
    compile_dsl.add_argument("--in", dest="dsl_in", required=True, help="Path to rule DSL file")
    compile_dsl.add_argument("--out", dest="dsl_out", required=True, help="Destination dataset path")

    reweight = sub.add_parser("reweight", help="Adjust weights using ML-assisted heuristics")
    reweight.add_argument("--in", dest="weights_in", required=True, help="Path to dataset (YAML/JSON)")
    reweight.add_argument("--out", dest="weights_out", required=True, help="Destination path")
    reweight.add_argument("--mode", dest="mode", default="conservative", help="Reweighting mode")

    reweight_csv = sub.add_parser(
        "reweight-csv", help="Reweight weights from labeled CSV without new ids"
    )
    reweight_csv.add_argument("--in", dest="weights_in", required=True, help="Path to dataset (YAML/JSON)")
    reweight_csv.add_argument("--labels", dest="labels_path", required=True, help="CSV containing id,weight_key,label")
    reweight_csv.add_argument("--out", dest="weights_out", required=True, help="Destination path")
    reweight_csv.add_argument(
        "--section",
        dest="section",
        default="principles",
        help="Dataset section to target (default: principles)",
    )
    reweight_csv.add_argument(
        "--learning-rate",
        dest="learning_rate",
        type=float,
        default=0.5,
        help="Blend factor between old weights and labels",
    )

    bootstrap = sub.add_parser("bootstrap", help="Generate canonical dataset scaffold")
    bootstrap.add_argument(
        "--out",
        type=str,
        default=str(current_data_path()),
        help="Target path for generated dataset",
    )

    sub.add_parser("print-path", help="Show the resolved dataset path")
    return parser


def _normalize_tradition(entry: Mapping[str, Any]) -> Mapping[str, Any]:
    if not isinstance(entry, dict):
        return entry
    if "tradition" not in entry:
        return entry
    tradition = entry.get("tradition")
    if isinstance(tradition, str):
        entry["tradition"] = tradition.lower()
    elif isinstance(tradition, Iterable):
        entry["tradition"] = [str(item).lower() for item in tradition if str(item).strip()]
    else:
        raise ValueError(f"tradition must be string or list for {entry.get('id', 'entry')}")
    return entry


def _validate_taxonomy(dataset: Mapping[str, Any], strict: bool) -> None:
    section_requirements = {
        "past_life_engines": (PAST_LIFE_PREFIX, PAST_LIFE_RANGE),
        "future_engines": (FUTURE_PREFIX, FUTURE_RANGE),
        "remedies": (REMEDY_PREFIX, None),
        "transit_rules": (TRANSIT_PREFIX, None),
        "matchmaking_criteria": (MATCHMAKING_PREFIX, None),
        "principles": (PRINCIPLE_PREFIX, None),
    }

    for section, (prefix, bounds) in section_requirements.items():
        entries = dataset.get(section) or []
        if not isinstance(entries, list):
            raise ValueError(f"{section} must be a list")
        for entry in entries:
            identifier = entry.get("id") if isinstance(entry, Mapping) else None
            if not identifier:
                continue
            start, end = bounds or (None, None)
            try:
                if bounds and strict:
                    validate_id(prefix, str(identifier), start, end)
                else:
                    validate_id(prefix, str(identifier))
            except ValueError as exc:
                if strict:
                    raise
                print(f"warning: {exc}", file=sys.stderr)
            _normalize_tradition(entry)

    missing = missing_ids_in_dataset(dataset)
    missing_pl = len(missing.get("past_life_engines", []))
    missing_fu = len(missing.get("future_engines", []))
    if strict and (missing_pl or missing_fu):
        raise ValueError(
            f"Missing taxonomy ids - past_life_engines: {missing_pl}, future_engines: {missing_fu}"
        )

    if missing_pl:
        print(f"warning: {missing_pl} past-life engines missing from taxonomy", file=sys.stderr)
    if missing_fu:
        print(f"warning: {missing_fu} future engines missing from taxonomy", file=sys.stderr)


def lint_dataset(dataset: Dict[str, Any], *, strict: bool = False) -> Dict[str, Any]:
    required_sections = {
        "metadata",
        "principles",
        "past_life_engines",
        "future_engines",
        "remedies",
        "transit_rules",
        "matchmaking_criteria",
    }

    missing_sections = [section for section in required_sections if section not in dataset]
    if missing_sections:
        raise ValueError(f"Dataset missing required sections: {', '.join(sorted(missing_sections))}")

    validated = _validate_and_enrich(dataset)
    for principle in validated.get("principles", []):
        recorded_checksum = principle.get("integrity", {}).get("checksum")
        computed = _compute_principle_checksum(principle)
        if recorded_checksum and recorded_checksum != computed:
            raise ValueError(f"Checksum mismatch for {principle.get('id')}: {recorded_checksum} != {computed}")

    _validate_taxonomy(validated, strict)
    return validated


def _save_dataset(dataset: Mapping[str, Any], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if yaml:
        with out_path.open("w", encoding="utf-8") as handle:
            yaml.safe_dump(dataset, handle, allow_unicode=True, sort_keys=False)
    else:
        with out_path.open("w", encoding="utf-8") as handle:
            json.dump(dataset, handle, ensure_ascii=False, indent=2)


def _render_stats(dataset: Mapping[str, Any]) -> None:
    _print_summary(dataset)
    by_tradition: Dict[str, int] = {}
    for section in ("principles", "past_life_engines", "future_engines"):
        for entry in dataset.get(section, []) or []:
            if not isinstance(entry, Mapping):
                continue
            tradition = str(entry.get("tradition", "universal")).lower()
            by_tradition[tradition] = by_tradition.get(tradition, 0) + 1
    print("\nTradition counts:")
    for tradition, count in sorted(by_tradition.items()):
        print(f"- {tradition}: {count}")

    missing = missing_ids_in_dataset(dataset)
    print("\nMissing taxonomy ids:")
    for section, ids in missing.items():
        print(f"- {section}: {len(ids)} missing")


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)

    if args.command == "print-path":
        print(current_data_path())
        return 0

    if args.command == "bootstrap":
        target = _bootstrap_dataset(Path(args.out))
        print(f"Dataset written to {target}")
        return 0

    if args.command == "lint":
        dataset_path = Path(args.path) if getattr(args, "path", "") else None
        try:
            dataset = _load_dataset(dataset_path)
            lint_dataset(dataset, strict=bool(getattr(args, "strict", False)))
        except Exception as exc:  # pragma: no cover - CLI surface
            print(f"lint failed: {exc}", file=sys.stderr)
            return 1
        _print_summary(dataset)
        return 0

    if args.command == "stats":
        dataset_path = Path(args.path) if getattr(args, "path", "") else None
        dataset = _load_dataset(dataset_path)
        _render_stats(dataset)
        return 0

    if args.command == "format":
        dataset = _load_dataset(Path(args.path))
        out_path = Path(args.out) if getattr(args, "out", "") else Path(args.path)
        _save_dataset(dataset, out_path)
        print(f"Formatted dataset written to {out_path}")
        return 0

    if args.command == "compile-dsl":
        dsl_path = Path(args.dsl_in)
        dsl_text = dsl_path.read_text(encoding="utf-8")
        compiled = compile_to_dataset(parse_dsl(dsl_text))
        _save_dataset(compiled, Path(args.dsl_out))
        print(f"Compiled dataset written to {args.dsl_out}")
        return 0

    if args.command == "reweight":
        dataset = _load_dataset(Path(args.weights_in))
        reweighted = apply_reweighting(dataset, mode=args.mode)
        _save_dataset(reweighted, Path(args.weights_out))
        return 0

    if args.command == "reweight-csv":
        dataset = _load_dataset(Path(args.weights_in))
        reweighted = supervised_csv_reweight(
            dataset,
            Path(args.labels_path),
            section=args.section,
            learning_rate=float(args.learning_rate),
        )
        _save_dataset(reweighted, Path(args.weights_out))
        return 0

    print(f"Unknown command: {args.command}", file=sys.stderr)
    return 1


if __name__ == "__main__":  # pragma: no cover - CLI entrypoint
    raise SystemExit(main())

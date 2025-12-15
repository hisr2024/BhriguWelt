"""Administrative helpers for managing the Bhrigu dataset."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any, Dict

from . import bhrigu_data
from .data_loader import (
    _validate_and_enrich,
    current_data_path,
    load_bhrigu_data,
    persist_bhrigu_data,
)
from .taxonomy_generator import generate_future_taxonomy, generate_past_life_taxonomy

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

    return load_bhrigu_data(path=path)


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
    dataset["past_life_engines"] = generate_past_life_taxonomy()
    dataset["future_engines"] = generate_future_taxonomy()

    target = out_path or current_data_path()
    persist_bhrigu_data(dataset, target)
    return target


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser("bhriguwelt-admin", description="Admin CLI for Bhrigu data")
    sub = parser.add_subparsers(dest="command", required=True)

    lint = sub.add_parser("lint", help="Validate the dataset")
    lint.add_argument("--path", type=str, default="", help="Path to dataset (YAML/JSON)")

    bootstrap = sub.add_parser("bootstrap", help="Generate canonical dataset scaffold")
    bootstrap.add_argument(
        "--out",
        type=str,
        default=str(current_data_path()),
        help="Target path for generated dataset",
    )

    sub.add_parser("print-path", help="Show the resolved dataset path")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)

    if args.command == "print-path":
        print(current_data_path())
        return 0

    if args.command == "bootstrap":
        target = _bootstrap_dataset(Path(args.out))
        print(f"Dataset written to {target}")
        return 0

    # lint
    dataset_path = Path(args.path) if getattr(args, "path", "") else None
    try:
        dataset = _load_dataset(dataset_path)
        _validate_and_enrich(dataset)
    except Exception as exc:  # pragma: no cover - CLI surface
        print(f"lint failed: {exc}", file=sys.stderr)
        return 1

    _print_summary(dataset)
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entrypoint
    raise SystemExit(main())


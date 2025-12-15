"""Admin-facing lint helpers to guard the Bhrigu dataset."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List

from .data_loader import load_bhrigu_data, persist_bhrigu_data
from .schemas import (
    LintIssue,
    validate_condition_ops,
    validate_required_fields,
    validate_unique_ids,
    ENGINE_BLOCKS,
)
from .taxonomy_generator import merge_taxonomy_into_dataset


def _lint_dataset(dataset: Dict[str, Any]) -> List[LintIssue]:
    issues: List[LintIssue] = []

    # required blocks / fields
    for block in ENGINE_BLOCKS.keys():
        issues.extend(validate_required_fields(block, dataset.get(block)))

    # unique ids
    issues.extend(validate_unique_ids(dataset))

    # conditions operator checks for relevant blocks
    for block in ("past_life_engines", "future_engines", "transit_rules", "remedies"):
        entries = dataset.get(block) or []
        if not isinstance(entries, list):
            continue
        for idx, e in enumerate(entries):
            if not isinstance(e, dict):
                continue
            if "conditions" in e:
                issues.extend(
                    [
                        LintIssue(it.level, f"{block}[{idx}].{it.path}", it.message)
                        for it in validate_condition_ops(e.get("conditions"))
                    ]
                )

            # warn placeholders
            if "TBD" in str(e.get("sutra_reference", "")) or "TBD" in str(e.get("description", "")):
                issues.append(LintIssue("WARN", f"{block}[{idx}]", "placeholder content detected (TBD)"))

    return issues


def build_cli() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser("bhriguwelt-admin-lint", description="Lint BhriguWelt dataset")
    p.add_argument("--path", type=str, default="", help="Dataset path (yaml/json). If omitted, uses configured loader.")
    p.add_argument("--json", action="store_true", help="Print issues as JSON")
    p.add_argument("--fail-on-warn", action="store_true", help="Exit nonzero on warnings too")
    p.add_argument("--autofill-taxonomy", action="store_true", help="Auto add missing PL/FU ids (placeholders)")
    p.add_argument("--write-back", action="store_true", help="Persist dataset back to disk after autofill")
    return p


def main(argv: List[str] | None = None) -> int:
    args = build_cli().parse_args(argv)

    dataset = load_bhrigu_data(Path(args.path)) if args.path else load_bhrigu_data()

    if args.autofill_taxonomy:
        dataset = merge_taxonomy_into_dataset(dataset)
        if args.write_back:
            # if a path was supplied, write to it; else write to configured data path
            target = Path(args.path) if args.path else None
            persist_bhrigu_data(dataset, target)

    issues = _lint_dataset(dataset)

    if args.json:
        print(json.dumps([issue.__dict__ for issue in issues], ensure_ascii=False, indent=2))
    else:
        for it in issues:
            print(f"[{it.level}] {it.path}: {it.message}")

    errors = [i for i in issues if i.level == "ERROR"]
    warns = [i for i in issues if i.level == "WARN"]

    if errors:
        return 2
    if args.fail_on_warn and warns:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

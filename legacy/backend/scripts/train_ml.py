#!/usr/bin/env python
"""Train the feedback ML model from the persisted SQLite records."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from bhriguwelt.feedback import load_feedback_dataframe
from bhriguwelt.ml_model import TrainingSummary, train_feedback_model


def _env_default(key: str, fallback: str) -> str:
    return os.environ.get(key, fallback)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train feedback rating model")
    parser.add_argument("--model-path", type=Path, default=None, help="Destination path for the trained model artifact")
    parser.add_argument(
        "--n-estimators",
        type=int,
        default=int(_env_default("BHRIGU_FEEDBACK_TREES", "200")),
        help="Number of trees in the random forest",
    )
    parser.add_argument(
        "--max-depth",
        type=int,
        default=int(_env_default("BHRIGU_FEEDBACK_MAX_DEPTH", "0")),
        help="Optional maximum tree depth (0 disables the limit)",
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=float(_env_default("BHRIGU_FEEDBACK_TEST_SIZE", "0.2")),
        help="Fraction of rows reserved for validation",
    )
    parser.add_argument(
        "--random-state",
        type=int,
        default=int(_env_default("BHRIGU_FEEDBACK_SEED", "42")),
        help="Random seed used for deterministic splits",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    max_depth = args.max_depth or None

    feedback_frame = load_feedback_dataframe()
    summary: TrainingSummary = train_feedback_model(
        feedback_frame,
        model_path=args.model_path,
        n_estimators=args.n_estimators,
        max_depth=max_depth,
        test_size=args.test_size,
        random_state=args.random_state,
    )
    print(json.dumps(summary.to_dict(), indent=2))


if __name__ == "__main__":  # pragma: no cover - developer utility
    main()

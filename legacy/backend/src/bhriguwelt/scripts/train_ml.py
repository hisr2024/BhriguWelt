"""CLI utility for retraining the feedback-driven ML weighting model."""

from __future__ import annotations

import argparse
import json
import logging

from ..ml_service import retrain_feedback_model


def main() -> None:  # pragma: no cover - developer utility
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Optional cap on most recent feedback rows to include in training",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable debug logging for telemetry output",
    )
    args = parser.parse_args()

    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO)

    metrics = retrain_feedback_model(limit=args.limit)
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":  # pragma: no cover - developer utility
    main()

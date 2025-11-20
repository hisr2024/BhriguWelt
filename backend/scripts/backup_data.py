"""Simple backup helper for Bhrigu Samhita datasets."""

from __future__ import annotations

import argparse
import shutil
from datetime import datetime
from pathlib import Path


DEFAULT_SOURCE = Path(__file__).resolve().parents[1] / "data" / "bhrigu_samhita_principles.yml"
DEFAULT_DEST = Path(__file__).resolve().parents[1] / "backups"


def backup(source: Path = DEFAULT_SOURCE, destination: Path = DEFAULT_DEST) -> Path:
    destination.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    target = destination / f"bhrigu_samhita_principles-{timestamp}.yml"
    shutil.copy2(source, target)
    return target


def main() -> None:
    parser = argparse.ArgumentParser(description="Back up Bhrigu Samhita principle corpus.")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE, help="Path to source data file")
    parser.add_argument(
        "--destination", type=Path, default=DEFAULT_DEST, help="Folder to store timestamped backups"
    )
    args = parser.parse_args()
    target = backup(args.source, args.destination)
    print(f"Backup created at {target}")


if __name__ == "__main__":
    main()

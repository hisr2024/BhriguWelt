"""Simple backup helper for the Bhrigu Samhita dataset.

Creates a timestamped copy of the primary data file under ``backend/backups``.
Designed to run without third-party dependencies so Railway/Nixpacks pipelines
can use it as-is.
"""

from __future__ import annotations

import os
import shutil
from datetime import datetime
from pathlib import Path


def backup_dataset(data_path: str | os.PathLike[str] | None = None) -> Path:
    """Copy the dataset to a timestamped location and return the backup path."""

    source = Path(data_path or Path(__file__).resolve().parent.parent / "data" / "bhrigu_samhita_principles.yml")
    if not source.exists():
        raise FileNotFoundError(f"Dataset not found at {source}")

    backups_dir = source.parent.parent / "backups"
    backups_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    target = backups_dir / f"bhrigu_samhita_principles-{timestamp}.yml"
    shutil.copy2(source, target)
    return target


def main() -> None:  # pragma: no cover - convenience wrapper
    path = backup_dataset(os.getenv("BHRIGU_DATA_PATH"))
    print(f"Backup created at {path}")


if __name__ == "__main__":  # pragma: no cover - CLI entry
    main()

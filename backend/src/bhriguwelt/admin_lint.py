"""Admin-facing lint helpers to guard the Bhrigu dataset."""

from __future__ import annotations

from typing import Any, Dict, Iterable, Sequence

from .schemas import DATASET_SEGMENTS


class DatasetValidationError(ValueError):
    """Raised when the dataset is missing critical sections."""


def require_dataset_fields(dataset: Dict[str, Any], required: Sequence[str] | None = None) -> None:
    """Ensure the dataset contains the required blocks.

    A ValueError is raised if any required section is absent or empty.
    """

    expected = tuple(required) if required is not None else DATASET_SEGMENTS
    missing: list[str] = []
    for section in expected:
        entries: Iterable[Any] | None = dataset.get(section) if isinstance(dataset, dict) else None
        if not entries:
            missing.append(section)
            continue
    if missing:
        raise DatasetValidationError(f"Dataset is missing required sections: {', '.join(sorted(missing))}")

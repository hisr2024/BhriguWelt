"""Entrypoint for ``python -m bhriguwelt``."""

from __future__ import annotations

from .admin_cli import main


if __name__ == "__main__":  # pragma: no cover - CLI bridge
    raise SystemExit(main())


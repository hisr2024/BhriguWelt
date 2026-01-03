"""Regenerate integrity.txt for Bhrigu Samhita data sources."""

from __future__ import annotations

import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_FILES = [
    ROOT / "data" / "bhrigu_samhita_principles.yml",
    ROOT / "src" / "bhriguwelt" / "bhrigu_data.py",
]
OUTPUT = ROOT / "data" / "integrity.txt"


def md5sum(path: Path) -> str:
    digest = hashlib.md5()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8192), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    lines = [f"{md5sum(path)}  {path.relative_to(ROOT)}" for path in DATA_FILES]
    OUTPUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote integrity hashes for {len(DATA_FILES)} files to {OUTPUT}")


if __name__ == "__main__":
    main()

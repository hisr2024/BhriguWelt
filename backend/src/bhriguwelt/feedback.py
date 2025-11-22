"""Feedback storage and quarterly review helpers for the Bhrigu API."""
from __future__ import annotations

import os
import sqlite3
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List

_VALID_ENGINES = {"horoscope", "past-life", "future", "matchmaking", "calendar", "transits"}
_DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "data" / "feedback.db"


@dataclass
class FeedbackEntry:
    id: int
    engine: str
    rating: int
    seeker_name: str | None
    notes: str
    created_at: str


def _db_path() -> Path:
    override = os.environ.get("BHRIGU_FEEDBACK_DB")
    return Path(override) if override else _DEFAULT_DB_PATH


def _connect() -> sqlite3.Connection:
    path = _db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    _ensure_schema(connection)
    return connection


def _ensure_schema(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            engine TEXT NOT NULL,
            seeker_name TEXT,
            rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
            notes TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    connection.commit()


def _timestamp(now: datetime | None = None) -> str:
    return (now or datetime.utcnow()).strftime("%Y-%m-%d %H:%M:%S")


def record_feedback(
    *, engine: str, rating: int, seeker_name: str | None = None, notes: str | None = None, created_at: datetime | None = None
) -> FeedbackEntry:
    if engine not in _VALID_ENGINES:
        raise ValueError(f"Unsupported engine for feedback: {engine}")
    if not 1 <= int(rating) <= 5:
        raise ValueError("Rating must be between 1 and 5")

    with _connect() as connection:
        cursor = connection.execute(
            "INSERT INTO feedback (engine, seeker_name, rating, notes, created_at) VALUES (?, ?, ?, ?, ?)",
            (engine, seeker_name, int(rating), (notes or "").strip(), _timestamp(created_at)),
        )
        connection.commit()
        inserted_id = cursor.lastrowid
        row = connection.execute(
            "SELECT id, engine, rating, seeker_name, notes, created_at FROM feedback WHERE id = ?", (inserted_id,)
        ).fetchone()
    assert row is not None  # pragma: no cover - ensured by preceding insert
    return FeedbackEntry(
        id=row["id"],
        engine=row["engine"],
        rating=row["rating"],
        seeker_name=row["seeker_name"],
        notes=row["notes"],
        created_at=row["created_at"],
    )


def _quarter_boundaries(year: int, quarter: int) -> tuple[str, str]:
    if quarter not in {1, 2, 3, 4}:
        raise ValueError("Quarter must be between 1 and 4")
    start_month = (quarter - 1) * 3 + 1
    start = datetime(year, start_month, 1)
    if quarter == 4:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, start_month + 3, 1)
    return _timestamp(start), _timestamp(end)


def quarterly_reviews(limit: int = 8) -> List[Dict[str, object]]:
    with _connect() as connection:
        rows = connection.execute(
            """
            SELECT
                strftime('%Y', created_at) AS year,
                CAST(((CAST(strftime('%m', created_at) AS INTEGER) - 1) / 3) + 1 AS INTEGER) AS quarter,
                COUNT(*) AS submissions,
                AVG(rating) AS average_rating,
                SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) AS promoters
            FROM feedback
            GROUP BY year, quarter
            ORDER BY year DESC, quarter DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

        summary: List[Dict[str, object]] = []
        for row in rows:
            year = int(row["year"])
            quarter = int(row["quarter"])
            start, end = _quarter_boundaries(year, quarter)
            recent_notes = connection.execute(
                """
                SELECT seeker_name, rating, notes, created_at
                FROM feedback
                WHERE notes != '' AND created_at >= ? AND created_at < ?
                ORDER BY created_at DESC
                LIMIT 3
                """,
                (start, end),
            ).fetchall()

            summary.append(
                dict(
                    label=f"{year} Q{quarter}",
                    average_rating=round(row["average_rating"], 2) if row["average_rating"] is not None else None,
                    submissions=row["submissions"],
                    promoters=row["promoters"] or 0,
                    recent_notes=[
                        {
                            "seeker_name": note["seeker_name"],
                            "rating": note["rating"],
                            "notes": note["notes"],
                            "created_at": note["created_at"],
                        }
                        for note in recent_notes
                    ],
                )
            )
    return summary


def serialize_entry(entry: FeedbackEntry) -> Dict[str, object]:
    return asdict(entry)


__all__ = ["FeedbackEntry", "record_feedback", "quarterly_reviews", "serialize_entry"]

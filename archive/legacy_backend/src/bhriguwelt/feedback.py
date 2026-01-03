"""Feedback storage and quarterly review helpers for the Bhrigu API."""
from __future__ import annotations

import json
import os
import sqlite3
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

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
    inputs: Dict[str, Any] | None


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
            created_at TEXT NOT NULL,
            inputs_json TEXT DEFAULT ''
        )
        """
    )
    columns = {row["name"] for row in connection.execute("PRAGMA table_info(feedback)")}
    if "inputs_json" not in columns:
        connection.execute("ALTER TABLE feedback ADD COLUMN inputs_json TEXT DEFAULT ''")
    connection.commit()


def _timestamp(now: datetime | None = None) -> str:
    return (now or datetime.utcnow()).strftime("%Y-%m-%d %H:%M:%S")


def _normalize_inputs_payload(engine: str, inputs: Dict[str, Any] | None) -> Dict[str, Any]:
    normalized: Dict[str, Any] = {"engine": engine}
    if inputs is None:
        return normalized

    if isinstance(inputs, dict):
        normalized.update(inputs)
    else:
        normalized["raw"] = inputs
    return normalized


def _serialize_inputs(inputs: Dict[str, Any] | None) -> str:
    if inputs is None:
        return ""
    try:
        return json.dumps(inputs, ensure_ascii=False)
    except TypeError:
        # Fall back to string coercion for non-serializable entries
        sanitized = {key: str(value) for key, value in inputs.items()}
        return json.dumps(sanitized, ensure_ascii=False)


def _deserialize_inputs(raw: str | None) -> Dict[str, Any] | None:
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {"value": parsed}
    except json.JSONDecodeError:
        return None


def record_feedback(
    *,
    engine: str,
    rating: int,
    seeker_name: str | None = None,
    notes: str | None = None,
    created_at: datetime | None = None,
    inputs: Dict[str, Any] | None = None,
) -> FeedbackEntry:
    if engine not in _VALID_ENGINES:
        raise ValueError(f"Unsupported engine for feedback: {engine}")
    if not 1 <= int(rating) <= 5:
        raise ValueError("Rating must be between 1 and 5")

    normalized_inputs = _normalize_inputs_payload(engine, inputs)
    inputs_json = _serialize_inputs(normalized_inputs)

    with _connect() as connection:
        cursor = connection.execute(
            """
            INSERT INTO feedback (engine, seeker_name, rating, notes, created_at, inputs_json)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (engine, seeker_name, int(rating), (notes or "").strip(), _timestamp(created_at), inputs_json),
        )
        connection.commit()
        inserted_id = cursor.lastrowid
        row = connection.execute(
            "SELECT id, engine, rating, seeker_name, notes, created_at, inputs_json FROM feedback WHERE id = ?",
            (inserted_id,),
        ).fetchone()
    assert row is not None  # pragma: no cover - ensured by preceding insert
    return FeedbackEntry(
        id=row["id"],
        engine=row["engine"],
        rating=row["rating"],
        seeker_name=row["seeker_name"],
        notes=row["notes"],
        created_at=row["created_at"],
        inputs=_deserialize_inputs(row["inputs_json"]),
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


def feedback_analytics_snapshot(limit_recent: int = 5) -> Dict[str, Any]:
    with _connect() as connection:
        total_count = connection.execute("SELECT COUNT(*) FROM feedback").fetchone()[0]
        average_rating = connection.execute("SELECT AVG(rating) FROM feedback").fetchone()[0]
        ratings_breakdown = connection.execute(
            "SELECT rating, COUNT(*) AS total FROM feedback GROUP BY rating ORDER BY rating"
        ).fetchall()
        by_engine = connection.execute(
            """
            SELECT engine, COUNT(*) AS submissions, AVG(rating) AS average_rating,
                   SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) AS promoters
            FROM feedback
            GROUP BY engine
            ORDER BY submissions DESC
            """
        ).fetchall()
        recent_entries = connection.execute(
            """
            SELECT id, engine, rating, seeker_name, notes, created_at
            FROM feedback
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit_recent,),
        ).fetchall()

    return {
        "total": total_count,
        "average_rating": round(average_rating, 2) if average_rating is not None else None,
        "ratings_breakdown": {row["rating"]: row["total"] for row in ratings_breakdown},
        "by_engine": [
            {
                "engine": row["engine"],
                "submissions": row["submissions"],
                "average_rating": round(row["average_rating"], 2) if row["average_rating"] is not None else None,
                "promoters": row["promoters"] or 0,
            }
            for row in by_engine
        ],
        "recent": [
            {
                "id": row["id"],
                "engine": row["engine"],
                "rating": row["rating"],
                "seeker_name": row["seeker_name"],
                "notes": row["notes"],
                "created_at": row["created_at"],
            }
            for row in recent_entries
        ],
    }


def serialize_entry(entry: FeedbackEntry) -> Dict[str, object]:
    return asdict(entry)


def load_feedback_dataframe(limit: int | None = None):
    """Load feedback (including inputs) into a pandas DataFrame for ML training.

    Parameters
    ----------
    limit:
        Optional maximum number of rows to load, ordered by recency.
    """

    import pandas as pd

    query = "SELECT id, engine, rating, seeker_name, notes, created_at, inputs_json FROM feedback ORDER BY created_at DESC"
    params: tuple[int] | None = None
    if limit:
        query = f"{query} LIMIT ?"
        params = (int(limit),)

    with _connect() as connection:
        frame = pd.read_sql_query(query, connection, params=params)

    if "inputs_json" in frame.columns:
        frame["inputs"] = frame["inputs_json"].apply(_deserialize_inputs)
        frame = frame.drop(columns=["inputs_json"])

    return frame


__all__ = [
    "FeedbackEntry",
    "record_feedback",
    "quarterly_reviews",
    "feedback_analytics_snapshot",
    "serialize_entry",
    "load_feedback_dataframe",
]

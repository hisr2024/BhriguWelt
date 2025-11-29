"""User profile, session memory, and alert scheduling utilities."""
from __future__ import annotations

import json
import os
import sqlite3
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence

_DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "data" / "profiles.db"


def _db_path() -> Path:
    override = os.environ.get("BHRIGU_PROFILES_DB")
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
        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE,
            full_name TEXT,
            date_of_birth TEXT,
            time_of_birth TEXT,
            place_of_birth TEXT,
            timezone TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            metadata_json TEXT DEFAULT ''
        )
        """
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profile_id INTEGER,
            session_key TEXT NOT NULL,
            transcript_json TEXT DEFAULT '[]',
            updated_at TEXT NOT NULL,
            UNIQUE(profile_id, session_key)
        )
        """
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profile_id INTEGER,
            label TEXT NOT NULL,
            event_time TEXT NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    connection.commit()


def _timestamp(now: Optional[datetime] = None) -> str:
    return (now or datetime.utcnow()).strftime("%Y-%m-%d %H:%M:%S")


@dataclass
class Profile:
    id: int
    user_id: Optional[str]
    full_name: Optional[str]
    date_of_birth: Optional[str]
    time_of_birth: Optional[str]
    place_of_birth: Optional[str]
    timezone: Optional[str]
    created_at: str
    updated_at: str
    metadata: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        payload = asdict(self)
        payload["metadata"] = self.metadata
        return payload


@dataclass
class SessionSnapshot:
    session_key: str
    transcript: List[Dict[str, Any]]
    updated_at: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_key": self.session_key,
            "transcript": self.transcript,
            "updated_at": self.updated_at,
        }


@dataclass
class Alert:
    id: int
    profile_id: int
    label: str
    event_time: str
    notes: Optional[str]
    created_at: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def _serialize_metadata(metadata: Dict[str, Any] | None) -> str:
    if not metadata:
        return ""
    return json.dumps(metadata, ensure_ascii=False)


def _deserialize_metadata(raw: str | None) -> Dict[str, Any]:
    if not raw:
        return {}
    try:
        loaded = json.loads(raw)
        return loaded if isinstance(loaded, dict) else {"value": loaded}
    except json.JSONDecodeError:
        return {}


def create_or_update_profile(payload: Dict[str, Any]) -> Profile:
    user_id = payload.get("user_id")
    now = _timestamp()
    metadata = payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}
    with _connect() as connection:
        existing = None
        if user_id:
            existing = connection.execute(
                "SELECT * FROM profiles WHERE user_id = ?",
                (user_id,),
            ).fetchone()
        if existing:
            connection.execute(
                """
                UPDATE profiles
                SET full_name = ?, date_of_birth = ?, time_of_birth = ?, place_of_birth = ?, timezone = ?,
                    metadata_json = ?, updated_at = ?
                WHERE user_id = ?
                """,
                (
                    payload.get("full_name"),
                    payload.get("date_of_birth"),
                    payload.get("time_of_birth"),
                    payload.get("place_of_birth"),
                    payload.get("timezone"),
                    _serialize_metadata(metadata),
                    now,
                    user_id,
                ),
            )
            profile_id = existing["id"]
        else:
            cursor = connection.execute(
                """
                INSERT INTO profiles (user_id, full_name, date_of_birth, time_of_birth, place_of_birth, timezone, created_at, updated_at, metadata_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    payload.get("full_name"),
                    payload.get("date_of_birth"),
                    payload.get("time_of_birth"),
                    payload.get("place_of_birth"),
                    payload.get("timezone"),
                    now,
                    now,
                    _serialize_metadata(metadata),
                ),
            )
            profile_id = cursor.lastrowid
            if not user_id:
                connection.execute(
                    "UPDATE profiles SET user_id = ? WHERE id = ?",
                    (f"profile-{profile_id}", profile_id),
                )
        connection.commit()
        row = connection.execute("SELECT * FROM profiles WHERE id = ?", (profile_id,)).fetchone()
    assert row is not None  # pragma: no cover
    return _row_to_profile(row)


def _row_to_profile(row: sqlite3.Row) -> Profile:
    return Profile(
        id=row["id"],
        user_id=row["user_id"],
        full_name=row["full_name"],
        date_of_birth=row["date_of_birth"],
        time_of_birth=row["time_of_birth"],
        place_of_birth=row["place_of_birth"],
        timezone=row["timezone"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        metadata=_deserialize_metadata(row["metadata_json"]),
    )


def get_profile(*, profile_id: int | None = None, user_id: str | None = None) -> Profile | None:
    if not profile_id and not user_id:
        raise ValueError("profile_id or user_id is required")
    with _connect() as connection:
        row: sqlite3.Row | None = None
        if profile_id:
            row = connection.execute("SELECT * FROM profiles WHERE id = ?", (profile_id,)).fetchone()
        elif user_id:
            row = connection.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,)).fetchone()
        return _row_to_profile(row) if row else None


def list_profiles(limit: int = 25) -> List[Profile]:
    with _connect() as connection:
        rows = connection.execute(
            "SELECT * FROM profiles ORDER BY updated_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [_row_to_profile(row) for row in rows]


def upsert_session_turn(
    *,
    profile_id: int,
    session_key: str,
    role: str,
    content: str,
    remedies: Optional[Sequence[str]] = None,
) -> SessionSnapshot:
    now = _timestamp()
    remedies_list = list(remedies or [])
    with _connect() as connection:
        row = connection.execute(
            "SELECT transcript_json FROM sessions WHERE profile_id = ? AND session_key = ?",
            (profile_id, session_key),
        ).fetchone()
        if row:
            transcript = _decode_transcript(row["transcript_json"])
        else:
            transcript = []
        transcript.append({"role": role, "content": content, "remedies": remedies_list, "timestamp": now})
        serialized = json.dumps(transcript, ensure_ascii=False)
        connection.execute(
            """
            INSERT INTO sessions (profile_id, session_key, transcript_json, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(profile_id, session_key) DO UPDATE SET transcript_json = excluded.transcript_json, updated_at = excluded.updated_at
            """,
            (profile_id, session_key, serialized, now),
        )
        connection.commit()
    return SessionSnapshot(session_key=session_key, transcript=transcript, updated_at=now)


def fetch_session(profile_id: int, session_key: str) -> SessionSnapshot | None:
    with _connect() as connection:
        row = connection.execute(
            "SELECT transcript_json, updated_at FROM sessions WHERE profile_id = ? AND session_key = ?",
            (profile_id, session_key),
        ).fetchone()
        if not row:
            return None
        return SessionSnapshot(
            session_key=session_key,
            transcript=_decode_transcript(row["transcript_json"]),
            updated_at=row["updated_at"],
        )


def _decode_transcript(raw: str | None) -> List[Dict[str, Any]]:
    if not raw:
        return []
    try:
        loaded = json.loads(raw)
        return loaded if isinstance(loaded, list) else []
    except json.JSONDecodeError:
        return []


def add_alert(*, profile_id: int, label: str, event_time: str, notes: str | None = None) -> Alert:
    now = _timestamp()
    with _connect() as connection:
        cursor = connection.execute(
            """
            INSERT INTO alerts (profile_id, label, event_time, notes, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (profile_id, label, event_time, notes, now),
        )
        connection.commit()
        row = connection.execute(
            "SELECT id, profile_id, label, event_time, notes, created_at FROM alerts WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
    assert row is not None  # pragma: no cover
    return Alert(
        id=row["id"],
        profile_id=row["profile_id"],
        label=row["label"],
        event_time=row["event_time"],
        notes=row["notes"],
        created_at=row["created_at"],
    )


def schedule_dasha_alerts(profile_id: int, dashas: Sequence[Dict[str, Any]], *, limit: int = 5) -> List[Alert]:
    """Persist upcoming dasha transitions as alerts for notification surfaces.

    The scheduler is intentionally simple so it can run in sandboxed environments
    where cron or task queues are unavailable. It deduplicates by label+time to
    avoid spamming the same transition repeatedly.
    """

    scheduled: List[Alert] = []
    normalized = [entry for entry in dashas if isinstance(entry, dict)]
    upcoming = sorted(normalized, key=lambda item: item.get("start", ""))[:limit]

    with _connect() as connection:
        for entry in upcoming:
            label = f"Dasha shift: {entry.get('lord', 'Planet')} begins"
            event_time = str(entry.get("start"))
            if not event_time:
                continue
            existing = connection.execute(
                "SELECT id FROM alerts WHERE profile_id = ? AND label = ? AND event_time = ?",
                (profile_id, label, event_time),
            ).fetchone()
            if existing:
                continue
            notes = entry.get("anchor_rule") or ""
            now = _timestamp()
            connection.execute(
                """
                INSERT INTO alerts (profile_id, label, event_time, notes, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (profile_id, label, event_time, notes, now),
            )
            connection.commit()
            scheduled.append(
                Alert(
                    id=connection.execute("SELECT last_insert_rowid() as id").fetchone()["id"],
                    profile_id=profile_id,
                    label=label,
                    event_time=event_time,
                    notes=notes,
                    created_at=now,
                )
            )

    return scheduled


def upcoming_alerts(*, profile_id: int, limit: int = 10) -> List[Alert]:
    with _connect() as connection:
        rows = connection.execute(
            """
            SELECT id, profile_id, label, event_time, notes, created_at
            FROM alerts
            WHERE profile_id = ?
            ORDER BY event_time ASC
            LIMIT ?
            """,
            (profile_id, limit),
        ).fetchall()
    alerts: List[Alert] = []
    for row in rows:
        record = dict(row)
        alerts.append(
            Alert(
                id=record["id"],
                profile_id=record["profile_id"],
                label=record["label"],
                event_time=record["event_time"],
                notes=record.get("notes"),
                created_at=record["created_at"],
            )
        )
    return alerts


def alerts_summary(limit: int = 10) -> List[Dict[str, Any]]:
    with _connect() as connection:
        rows = connection.execute(
            "SELECT label, event_time, profile_id, notes, created_at FROM alerts ORDER BY event_time ASC LIMIT ?",
            (limit,),
        ).fetchall()
    return [dict(row) for row in rows]


def analytics_snapshot() -> Dict[str, Any]:
    with _connect() as connection:
        profile_count = connection.execute("SELECT COUNT(*) FROM profiles").fetchone()[0]
        alert_count = connection.execute("SELECT COUNT(*) FROM alerts").fetchone()[0]
        session_count = connection.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
    return {
        "profiles": profile_count,
        "alerts": alert_count,
        "sessions": session_count,
    }


__all__ = [
    "Profile",
    "SessionSnapshot",
    "Alert",
    "create_or_update_profile",
    "get_profile",
    "list_profiles",
    "upsert_session_turn",
    "fetch_session",
    "add_alert",
    "upcoming_alerts",
    "alerts_summary",
    "analytics_snapshot",
]

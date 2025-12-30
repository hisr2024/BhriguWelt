"""User profile, session memory, and alert scheduling utilities."""
from __future__ import annotations

import base64
import binascii
import json
import logging
import os
import sqlite3
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

_DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "data" / "profiles.db"
_ENCRYPTION_PREFIX = "enc::"
_ENCRYPTION_KEY: bytes | None = None
logger = logging.getLogger(__name__)


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


def _load_encryption_key() -> bytes | None:
    raw_key = os.environ.get("BHRIGUWELT_PROFILE_ENCRYPTION_KEY")
    if not raw_key:
        return None
    for decoder in (_decode_base64_key, _decode_hex_key):
        key = decoder(raw_key)
        if key:
            return key
    raise ValueError("BHRIGUWELT_PROFILE_ENCRYPTION_KEY must be base64 or hex for 16/24/32-byte keys")


def _decode_base64_key(raw_key: str) -> bytes | None:
    try:
        key = base64.urlsafe_b64decode(raw_key)
    except (ValueError, binascii.Error):
        return None
    if len(key) in {16, 24, 32}:
        return key
    return None


def _decode_hex_key(raw_key: str) -> bytes | None:
    try:
        key = bytes.fromhex(raw_key)
    except ValueError:
        return None
    if len(key) in {16, 24, 32}:
        return key
    return None


def _encryption_key() -> bytes | None:
    global _ENCRYPTION_KEY
    if _ENCRYPTION_KEY is None:
        _ENCRYPTION_KEY = _load_encryption_key()
        if _ENCRYPTION_KEY is None:
            logger.warning("Profile encryption key not configured; birth data stored in plaintext")
    return _ENCRYPTION_KEY


def _encrypt_value(value: str | None) -> str | None:
    if not value:
        return value
    key = _encryption_key()
    if not key:
        return value
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    encrypted = aesgcm.encrypt(nonce, value.encode("utf-8"), None)
    payload = base64.urlsafe_b64encode(nonce + encrypted).decode("utf-8")
    return f"{_ENCRYPTION_PREFIX}{payload}"


def _decrypt_value(value: str | None) -> str | None:
    if not value:
        return value
    if not value.startswith(_ENCRYPTION_PREFIX):
        return value
    key = _encryption_key()
    if not key:
        raise ValueError("Encryption key not configured for encrypted birth data")
    payload = value[len(_ENCRYPTION_PREFIX) :]
    raw = base64.urlsafe_b64decode(payload.encode("utf-8"))
    nonce, encrypted = raw[:12], raw[12:]
    aesgcm = AESGCM(key)
    decrypted = aesgcm.decrypt(nonce, encrypted, None)
    return decrypted.decode("utf-8")


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
    encrypted_payload = {
        "full_name": payload.get("full_name"),
        "date_of_birth": _encrypt_value(payload.get("date_of_birth")),
        "time_of_birth": _encrypt_value(payload.get("time_of_birth")),
        "place_of_birth": _encrypt_value(payload.get("place_of_birth")),
        "timezone": _encrypt_value(payload.get("timezone")),
    }
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
                    encrypted_payload["full_name"],
                    encrypted_payload["date_of_birth"],
                    encrypted_payload["time_of_birth"],
                    encrypted_payload["place_of_birth"],
                    encrypted_payload["timezone"],
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
                    encrypted_payload["full_name"],
                    encrypted_payload["date_of_birth"],
                    encrypted_payload["time_of_birth"],
                    encrypted_payload["place_of_birth"],
                    encrypted_payload["timezone"],
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
        date_of_birth=_decrypt_value(row["date_of_birth"]),
        time_of_birth=_decrypt_value(row["time_of_birth"]),
        place_of_birth=_decrypt_value(row["place_of_birth"]),
        timezone=_decrypt_value(row["timezone"]),
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


def _session_turn_count(raw: str | None) -> int:
    transcript = _decode_transcript(raw)
    return len(transcript)


def analytics_snapshot() -> Dict[str, Any]:
    with _connect() as connection:
        profile_count = connection.execute("SELECT COUNT(*) FROM profiles").fetchone()[0]
        alert_count = connection.execute("SELECT COUNT(*) FROM alerts").fetchone()[0]
        session_count = connection.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
        profiles_created_7d = connection.execute(
            "SELECT COUNT(*) FROM profiles WHERE created_at >= datetime('now', '-7 days')"
        ).fetchone()[0]
        profiles_updated_24h = connection.execute(
            "SELECT COUNT(*) FROM profiles WHERE updated_at >= datetime('now', '-1 day')"
        ).fetchone()[0]
        sessions_active_7d = connection.execute(
            "SELECT COUNT(*) FROM sessions WHERE updated_at >= datetime('now', '-7 days')"
        ).fetchone()[0]
        recent_profiles = connection.execute(
            """
            SELECT id, user_id, full_name, created_at, updated_at
            FROM profiles
            ORDER BY updated_at DESC
            LIMIT 5
            """
        ).fetchall()
        recent_sessions = connection.execute(
            """
            SELECT profile_id, session_key, transcript_json, updated_at
            FROM sessions
            ORDER BY updated_at DESC
            LIMIT 5
            """
        ).fetchall()
        session_transcripts = connection.execute("SELECT transcript_json FROM sessions").fetchall()

    session_turns = [_session_turn_count(row["transcript_json"]) for row in session_transcripts]
    average_turns = round(sum(session_turns) / len(session_turns), 2) if session_turns else 0

    return {
        "profiles": {
            "total": profile_count,
            "created_last_7_days": profiles_created_7d,
            "updated_last_24_hours": profiles_updated_24h,
            "recent": [
                {
                    "id": row["id"],
                    "user_id": row["user_id"],
                    "full_name": row["full_name"],
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"],
                }
                for row in recent_profiles
            ],
        },
        "alerts": {
            "total": alert_count,
        },
        "sessions": {
            "total": session_count,
            "active_last_7_days": sessions_active_7d,
            "average_turns": average_turns,
            "recent": [
                {
                    "profile_id": row["profile_id"],
                    "session_key": row["session_key"],
                    "turns": _session_turn_count(row["transcript_json"]),
                    "updated_at": row["updated_at"],
                }
                for row in recent_sessions
            ],
        },
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

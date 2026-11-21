"""
Monthly voice allowance per subscriber, counted in characters synthesised.

30 minutes ≈ 27,000 characters of calm narration (15 chars/second).
Stored in Redis when REDIS_URL is set (survives deploys), otherwise in the
app database. Keys are an anonymous hash of the subscription, never a name
or e-mail.
"""
from __future__ import annotations

import os
from datetime import datetime, timezone

from utils.logger import setup_logger

logger = setup_logger(__name__)


def monthly_minutes() -> int:
    return int(os.getenv('VOICE_MONTHLY_MINUTES', '30'))


def monthly_chars() -> int:
    return monthly_minutes() * 60 * 15


def _period() -> str:
    return datetime.now(timezone.utc).strftime('%Y-%m')


_redis = None


def _redis_client():
    global _redis
    if _redis is None and os.getenv('REDIS_URL'):
        try:
            import redis
            _redis = redis.Redis.from_url(os.environ['REDIS_URL'], socket_timeout=3)
            _redis.ping()
        except Exception as exc:
            logger.warning('Voice usage: Redis unavailable, using database (%s)', exc)
            _redis = False
    return _redis or None


def used(subscriber: str) -> int:
    key = f'bw:voice:{subscriber}:{_period()}'
    r = _redis_client()
    if r:
        try:
            return int(r.get(key) or 0)
        except Exception:
            pass
    from models import VoiceUsage
    row = VoiceUsage.query.filter_by(subscriber=subscriber, period=_period()).first()
    return row.chars if row else 0


def add(subscriber: str, chars: int) -> int:
    if chars <= 0:
        return used(subscriber)
    key = f'bw:voice:{subscriber}:{_period()}'
    r = _redis_client()
    if r:
        try:
            total = int(r.incrby(key, chars))
            r.expire(key, 40 * 24 * 3600)
            return total
        except Exception:
            pass
    from models import VoiceUsage, db
    row = VoiceUsage.query.filter_by(subscriber=subscriber, period=_period()).first()
    if not row:
        row = VoiceUsage(subscriber=subscriber, period=_period(), chars=0)
        db.session.add(row)
    row.chars = (row.chars or 0) + chars
    db.session.commit()
    return row.chars


def remaining(subscriber: str) -> int:
    return max(0, monthly_chars() - used(subscriber))

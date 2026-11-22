"""
Morning and evening notifications (Web Push).

Each subscribed device gets two short messages a day at its own local time:

  morning (default 07:00)  today's Moon star and what it means for the reader
  evening (default 20:00)  what tomorrow brings, so it can be planned

The text is computed from the real sky (Swiss Ephemeris, Lahiri), never
templated at random. With the reader's natal Moon (sign and nakshatra index,
the only chart facts stored) it is personal: tara bala and chandra bala, as on
the Today page. Without it, the message gives the day's panchanga.

Sending is idempotent: a device's slot is claimed with a conditional UPDATE
before the push goes out, so several gunicorn workers running the loop never
send the same message twice.

Keys: VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY (raw base64url) if set; otherwise a
pair is made once and kept in the database. VAPID_SUBJECT is the contact
(mailto: or https:),
NOTIFICATIONS_LOOP=false to switch the in-process loop off,
NOTIFICATIONS_CRON_SECRET to allow an external trigger instead.
"""
from __future__ import annotations

import hashlib
import json
import os
import random
import threading
import time
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from utils.logger import setup_logger

logger = setup_logger(__name__)

NAK_SPAN = 360.0 / 27.0
SEND_WINDOW = timedelta(hours=3)  # a slot missed by more than this is skipped for the day
LOOP_SECONDS = 120


# ── configuration ────────────────────────────────────────────────────────

_keys_cache: Optional[Tuple[str, str]] = None


def _make_keys() -> Tuple[str, str]:
    from cryptography.hazmat.primitives import serialization
    from py_vapid import Vapid02, b64urlencode
    v = Vapid02()
    v.generate_keys()
    pub = v.public_key.public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
    priv = v.private_key.private_numbers().private_value.to_bytes(32, 'big')
    return b64urlencode(pub), b64urlencode(priv)


def _keys() -> Optional[Tuple[str, str]]:
    """(public, private) VAPID keys: from env, else made once and kept in the database."""
    global _keys_cache
    env_pub, env_priv = (os.getenv('VAPID_PUBLIC_KEY') or '').strip(), (os.getenv('VAPID_PRIVATE_KEY') or '').strip()
    if env_pub and env_priv:
        return env_pub, env_priv
    if _keys_cache:
        return _keys_cache
    try:
        from models import AppKeyPair, db
        row = db.session.get(AppKeyPair, 'vapid')
        if not row:
            pub, priv = _make_keys()
            db.session.add(AppKeyPair(name='vapid', public_key=pub, private_key=priv))
            try:
                db.session.commit()
            except Exception:  # another worker made it first
                db.session.rollback()
            row = db.session.get(AppKeyPair, 'vapid')
        if row:
            _keys_cache = (row.public_key, row.private_key)
        return _keys_cache
    except Exception as e:
        logger.warning('VAPID keys unavailable: %s', type(e).__name__)
        try:
            from models import db
            db.session.rollback()
        except Exception:
            pass
        return None


def public_key() -> str:
    k = _keys()
    return k[0] if k else ''


def _private_key() -> str:
    k = _keys()
    return k[1] if k else ''


def subject() -> str:
    return (os.getenv('VAPID_SUBJECT') or 'mailto:support@kiaanverse.com').strip()


def configured() -> bool:
    return bool(public_key() and _private_key())


def endpoint_hash(endpoint: str) -> str:
    return hashlib.sha256(endpoint.encode('utf-8')).hexdigest()


def valid_time(value: Any, default: str) -> str:
    try:
        hh, mm = str(value).split(':', 1)
        h, m = int(hh), int(mm)
        if 0 <= h <= 23 and 0 <= m <= 59:
            return f'{h:02d}:{m:02d}'
    except (ValueError, AttributeError):
        pass
    return default


def valid_tz(value: Any) -> str:
    name = str(value or '')[:64]
    try:
        ZoneInfo(name)
        return name
    except (ZoneInfoNotFoundError, ValueError):
        return 'UTC'


# ── natal Moon ───────────────────────────────────────────────────────────

def natal_moon_from_birth(birth: Dict[str, Any]) -> Optional[Tuple[int, int]]:
    """(moon sign 0..11, nakshatra 0..26) from birth details; birth data is not kept."""
    try:
        from services.astrology_calculator import get_astrology_calculator

        def coord(v, limit):
            try:
                n = float(v)
            except (TypeError, ValueError):
                return None
            return n if -limit <= n <= limit else None

        calc = get_astrology_calculator()
        if not calc:
            return None
        chart = calc.calculate_birth_chart(
            date_of_birth=str(birth['date_of_birth'])[:10],
            time_of_birth=str(birth['time_of_birth'])[:8],
            place=str(birth.get('place_of_birth') or '')[:200],
            latitude=coord(birth.get('latitude'), 90),
            longitude=coord(birth.get('longitude'), 180),
            timezone_override=str(birth['timezone'])[:64] if birth.get('timezone') else None,
        )
        moon = (chart.get('planets') or {}).get('Moon') or {}
        lon = float(moon['longitude']) % 360.0
        return int(lon // 30), min(int(lon / NAK_SPAN), 26)
    except Exception as e:  # missing fields, bad place, ephemeris error
        logger.info('Natal Moon not computed for notifications: %s', type(e).__name__)
        return None


# ── message text ─────────────────────────────────────────────────────────

def _sky(when_utc: datetime) -> Dict[str, Any]:
    from services import ephemeris_core as E
    from services import daily_gochara as G

    pos = E.planet_positions(when_utc)
    moon, sun = pos['Moon']['longitude'], pos['Sun']['longitude']
    nak, _pada, _lord = E.nakshatra_of(moon)
    t = int(((moon - sun) % 360.0) // 12)
    in_paksha = t % 15
    name = ('Purnima' if t == 14 else 'Amavasya') if in_paksha == 14 else G.TITHI_NAMES[in_paksha]
    return {
        'moon_sign_i': int(moon // 30), 'moon_sign': E.SIGNS[int(moon // 30)],
        'nak_i': min(int(moon / NAK_SPAN), 26), 'nakshatra': nak,
        'tithi_name': name, 'paksha': 'Shukla' if t < 15 else 'Krishna',
        'tithi_use': G.TITHI_CLASS_USE[G.TITHI_CLASS[in_paksha % 5]],
    }


def _personal(sky: Dict[str, Any], moon_sign: Optional[int], moon_nak: Optional[int]) -> Optional[Dict[str, Any]]:
    from services import daily_gochara as G
    if moon_sign is None or moon_nak is None:
        return None
    tara_name, tara_score, tara_text = G.TARAS[(sky['nak_i'] - moon_nak) % 9]
    from_moon = (sky['moon_sign_i'] - moon_sign) % 12 + 1
    chandra_score, chandra_text = G.CHANDRA[from_moon]
    return {
        'tara': G.TARA_PLAIN.get(tara_name, tara_name), 'tara_text': tara_text,
        'from_moon': from_moon, 'chandra_text': chandra_text, 'score': tara_score + chandra_score,
    }


def _feel(score: int) -> str:
    return 'a strong day' if score >= 3 else 'a good day' if score >= 1 else 'a mixed day' if score >= -1 else 'a day to go gently'


def _special(sky: Dict[str, Any]) -> Optional[str]:
    n = sky['tithi_name']
    if n == 'Ekadashi':
        return f"{sky['paksha']} Ekadashi: a day for fasting, prayer and restraint."
    if n == 'Purnima':
        return 'Purnima, the full Moon: good for prayer, gratitude and completing things.'
    if n == 'Amavasya':
        return 'Amavasya, the new Moon: remember your ancestors; begin nothing new.'
    return None


def _clip(text: str, limit: int) -> str:
    return text if len(text) <= limit else text[: limit - 1].rstrip(' ,;:') + '…'


def compose(kind: str, local_now: datetime, moon_sign: Optional[int], moon_nak: Optional[int]) -> Dict[str, str]:
    """Title and body for the morning ('morning') or evening ('evening') message."""
    if kind == 'morning':
        at = local_now.replace(hour=12, minute=0, second=0, microsecond=0)
        when, url = 'Today', '/dashboard'
    else:
        at = (local_now + timedelta(days=1)).replace(hour=8, minute=0, second=0, microsecond=0)
        when, url = 'Tomorrow', '/horoscope'
    sky = _sky(at.astimezone(timezone.utc))
    me = _personal(sky, moon_sign, moon_nak)
    special = _special(sky)

    if me:
        if me['from_moon'] == 8:
            title = f'{when}: go gently (Chandrashtama)'
            body = f"The Moon is 8th from your birth Moon: {me['chandra_text'].split(':', 1)[-1].strip()}."
        else:
            title = f"{when}: {_feel(me['score'])} for you"
            body = f"Moon in {sky['nakshatra']}, {me['tara']}: {me['tara_text'].split(':', 1)[-1].strip()}."
        if special:
            body = f'{body} {special}'
    else:
        title = f"{when}: Moon in {sky['nakshatra']}"
        body = special or f"{sky['paksha']} {sky['tithi_name']}, {sky['tithi_use']}."
    body = _clip(body, 160) + (' Open your leaf.' if kind == 'morning' else ' Plan ahead.')
    return {'title': _clip(title, 60), 'body': body, 'url': url, 'tag': f'bw-{kind}'}


# ── sending ──────────────────────────────────────────────────────────────

class Gone(Exception):
    """The push service says this subscription no longer exists."""


def send(sub, payload: Dict[str, Any]) -> None:
    from pywebpush import WebPushException, webpush
    try:
        webpush(
            subscription_info={'endpoint': sub.endpoint, 'keys': {'p256dh': sub.p256dh, 'auth': sub.auth}},
            data=json.dumps(payload),
            vapid_private_key=_private_key(),
            vapid_claims={'sub': subject()},
            ttl=4 * 3600,
            timeout=10,
        )
    except WebPushException as e:
        status = getattr(getattr(e, 'response', None), 'status_code', None)
        if status in (404, 410):
            raise Gone() from e
        raise


def _slot_due(sub, kind: str, now_utc: datetime) -> Optional[Tuple[datetime, str]]:
    if not (sub.morning if kind == 'morning' else sub.evening):
        return None
    tz = ZoneInfo(valid_tz(sub.tz))
    local = now_utc.astimezone(tz)
    h, m = map(int, (sub.morning_at if kind == 'morning' else sub.evening_at).split(':'))
    slot = local.replace(hour=h, minute=m, second=0, microsecond=0)
    today = local.date().isoformat()
    last = sub.last_morning if kind == 'morning' else sub.last_evening
    if last == today or not (slot <= local < slot + SEND_WINDOW):
        return None
    return local, today


def dispatch(now_utc: Optional[datetime] = None) -> Dict[str, int]:
    """Send every morning/evening message that is due. Safe to run concurrently."""
    from models import PushSubscription, db

    stats = {'sent': 0, 'failed': 0, 'removed': 0}
    if not configured():
        return stats
    now_utc = now_utc or datetime.now(timezone.utc)
    for sub in PushSubscription.query.all():
        for kind in ('morning', 'evening'):
            try:
                due = _slot_due(sub, kind, now_utc)
            except Exception:
                continue
            if not due:
                continue
            local, today = due
            column = PushSubscription.last_morning if kind == 'morning' else PushSubscription.last_evening
            claimed = (
                PushSubscription.query
                .filter(PushSubscription.id == sub.id, (column.is_(None)) | (column != today))
                .update({column: today}, synchronize_session=False)
            )
            db.session.commit()
            if claimed != 1:
                continue  # another worker took it
            try:
                send(sub, compose(kind, local, sub.moon_sign, sub.moon_nakshatra))
                PushSubscription.query.filter_by(id=sub.id).update({'failures': 0}, synchronize_session=False)
                stats['sent'] += 1
            except Gone:
                PushSubscription.query.filter_by(id=sub.id).delete(synchronize_session=False)
                stats['removed'] += 1
            except Exception as e:
                stats['failed'] += 1
                failures = (sub.failures or 0) + 1
                logger.warning('Push failed (%s), attempt %s', type(e).__name__, failures)
                if failures >= 10:
                    PushSubscription.query.filter_by(id=sub.id).delete(synchronize_session=False)
                    stats['removed'] += 1
                else:
                    PushSubscription.query.filter_by(id=sub.id).update({'failures': failures}, synchronize_session=False)
            db.session.commit()
            if kind == 'morning':
                break  # one message per device per pass
    return stats


# ── background loop ──────────────────────────────────────────────────────

_started = False


def start_loop(app) -> None:
    """Run dispatch() every couple of minutes in this process (one thread per worker)."""
    global _started
    if _started or os.getenv('NOTIFICATIONS_LOOP', 'true').lower() in ('0', 'false', 'no'):
        return
    if app.config.get('TESTING') or 'pytest' in __import__('sys').modules:
        return
    _started = True

    def run():
        time.sleep(random.uniform(10, 60))  # spread the workers out
        while True:
            try:
                with app.app_context():
                    stats = dispatch() if configured() else {'sent': 0, 'failed': 0, 'removed': 0}
                    if stats['sent'] or stats['failed'] or stats['removed']:
                        logger.info('Notifications: %s', stats)
            except Exception as e:
                logger.warning('Notification loop error: %s', type(e).__name__)
                try:
                    from models import db
                    with app.app_context():
                        db.session.rollback()
                except Exception:
                    pass
            time.sleep(LOOP_SECONDS + random.uniform(0, 20))

    threading.Thread(target=run, name='bw-notifications', daemon=True).start()
    logger.info('✓ Notification loop started')

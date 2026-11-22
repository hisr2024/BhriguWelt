"""
Morning and evening notifications.

  GET  /api/notifications/config       VAPID public key, whether push is on
  POST /api/notifications/subscribe    save or update this device's subscription
  POST /api/notifications/unsubscribe  forget this device
  POST /api/notifications/test         send one message now to this device
  POST /api/notifications/dispatch     run due sends (external cron; needs secret)
"""
from __future__ import annotations

import hmac
import os
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from services import notifications as N
from utils.logger import setup_logger

logger = setup_logger(__name__)

bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')


def _subscription_from(body):
    sub = body.get('subscription') or {}
    endpoint = str(sub.get('endpoint') or '')
    keys = sub.get('keys') or {}
    p256dh, auth = str(keys.get('p256dh') or ''), str(keys.get('auth') or '')
    if not endpoint.startswith('https://') or len(endpoint) > 2000 or not p256dh or not auth:
        return None
    if len(p256dh) > 255 or len(auth) > 255:
        return None
    return endpoint, p256dh, auth


@bp.route('/config', methods=['GET'])
def config():
    return jsonify({'available': N.configured(), 'public_key': N.public_key() or None,
                    'defaults': {'morning_at': '07:00', 'evening_at': '20:00'}})


@bp.route('/subscribe', methods=['POST'])
def subscribe():
    from models import PushSubscription, db
    if not N.configured():
        return jsonify({'error': 'unavailable'}), 503
    body = request.get_json(silent=True) or {}
    parsed = _subscription_from(body)
    if not parsed:
        return jsonify({'error': 'invalid_subscription'}), 400
    endpoint, p256dh, auth = parsed

    h = N.endpoint_hash(endpoint)
    sub = PushSubscription.query.filter_by(endpoint_hash=h).first()
    if not sub:
        sub = PushSubscription(endpoint=endpoint, endpoint_hash=h, p256dh=p256dh, auth=auth)
        db.session.add(sub)
    sub.p256dh, sub.auth = p256dh, auth
    sub.tz = N.valid_tz(body.get('tz'))
    sub.morning = bool(body.get('morning', True))
    sub.evening = bool(body.get('evening', True))
    sub.morning_at = N.valid_time(body.get('morning_at'), '07:00')
    sub.evening_at = N.valid_time(body.get('evening_at'), '20:00')
    sub.failures = 0

    birth = body.get('birth')
    if isinstance(birth, dict) and birth.get('date_of_birth') and birth.get('time_of_birth'):
        moon = N.natal_moon_from_birth(birth)  # birth details are used here and not stored
        if moon:
            sub.moon_sign, sub.moon_nakshatra = moon
    elif body.get('personal') is False:
        sub.moon_sign = sub.moon_nakshatra = None

    db.session.commit()
    return jsonify({'saved': True, 'personal': sub.moon_nakshatra is not None,
                    'morning': sub.morning, 'evening': sub.evening,
                    'morning_at': sub.morning_at, 'evening_at': sub.evening_at})


@bp.route('/unsubscribe', methods=['POST'])
def unsubscribe():
    from models import PushSubscription, db
    endpoint = str(((request.get_json(silent=True) or {}).get('endpoint')) or '')
    if endpoint:
        PushSubscription.query.filter_by(endpoint_hash=N.endpoint_hash(endpoint)).delete()
        db.session.commit()
    return jsonify({'removed': True})


_last_test: dict = {}


@bp.route('/test', methods=['POST'])
def test():
    from models import PushSubscription
    from zoneinfo import ZoneInfo
    endpoint = str(((request.get_json(silent=True) or {}).get('endpoint')) or '')
    sub = PushSubscription.query.filter_by(endpoint_hash=N.endpoint_hash(endpoint)).first() if endpoint else None
    if not sub:
        return jsonify({'error': 'not_subscribed'}), 404
    now = datetime.now(timezone.utc)
    last = _last_test.get(sub.id)
    if last and (now - last).total_seconds() < 30:
        return jsonify({'error': 'too_soon'}), 429
    _last_test[sub.id] = now
    local = now.astimezone(ZoneInfo(N.valid_tz(sub.tz)))
    kind = 'morning' if local.hour < 15 else 'evening'
    try:
        N.send(sub, N.compose(kind, local, sub.moon_sign, sub.moon_nakshatra))
    except N.Gone:
        return jsonify({'error': 'gone'}), 410
    except Exception as e:
        logger.warning('Test push failed: %s', type(e).__name__)
        return jsonify({'error': 'send_failed'}), 502
    return jsonify({'sent': True})


@bp.route('/dispatch', methods=['POST'])
def dispatch():
    secret = os.getenv('NOTIFICATIONS_CRON_SECRET') or ''
    given = request.headers.get('X-Cron-Secret') or ''
    if not secret or not hmac.compare_digest(secret, given):
        return jsonify({'error': 'forbidden'}), 403
    return jsonify(N.dispatch())

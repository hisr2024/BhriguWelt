"""Morning and evening notifications: subscribe, compose, idempotent dispatch."""
import os
import sys
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app as flask_app  # noqa: E402
from services import notifications as N  # noqa: E402

SUB = {'endpoint': 'https://fcm.googleapis.com/fcm/send/abc123', 'keys': {'p256dh': 'BKey', 'auth': 'authKey'}}


@pytest.fixture
def client(monkeypatch):
    flask_app.config['TESTING'] = True
    with flask_app.test_client() as c:
        with flask_app.app_context():
            from models import PushSubscription, db
            db.create_all()
            PushSubscription.query.delete()
            db.session.commit()
            yield c


@pytest.fixture
def outbox(monkeypatch):
    sent = []
    monkeypatch.setattr(N, 'send', lambda sub, payload: sent.append((sub.endpoint, payload)))
    return sent


def test_config_makes_and_keeps_a_key(client):
    a = client.get('/api/notifications/config').get_json()
    b = client.get('/api/notifications/config').get_json()
    assert a['available'] is True
    assert a['public_key'] and a['public_key'] == b['public_key']
    assert len(a['public_key']) == 87  # 65-byte uncompressed P-256 point, base64url


def test_subscribe_validates_and_upserts(client):
    assert client.post('/api/notifications/subscribe', json={'subscription': {'endpoint': 'http://x'}}).status_code == 400
    r = client.post('/api/notifications/subscribe', json={'subscription': SUB, 'tz': 'Europe/Berlin', 'morning_at': '7:30'})
    assert r.status_code == 200
    body = r.get_json()
    assert body['morning_at'] == '07:30' and body['evening_at'] == '20:00' and body['personal'] is False
    client.post('/api/notifications/subscribe', json={'subscription': SUB, 'tz': 'Not/AZone', 'evening': False})
    from models import PushSubscription
    rows = PushSubscription.query.all()
    assert len(rows) == 1 and rows[0].tz == 'UTC' and rows[0].evening is False


def test_birth_details_give_moon_but_are_not_stored(client, monkeypatch):
    monkeypatch.setattr(N, 'natal_moon_from_birth', lambda birth: (3, 7))
    r = client.post('/api/notifications/subscribe', json={
        'subscription': SUB, 'birth': {'date_of_birth': '1990-05-15', 'time_of_birth': '10:30', 'place_of_birth': 'New Delhi'}})
    assert r.get_json()['personal'] is True
    from models import PushSubscription
    row = PushSubscription.query.one()
    assert (row.moon_sign, row.moon_nakshatra) == (3, 7)
    assert '1990' not in ' '.join(str(v) for v in row.__dict__.values())


def test_compose_texts():
    local = datetime(2026, 11, 23, 7, 0, tzinfo=ZoneInfo('Europe/Berlin'))
    generic = N.compose('morning', local, None, None)
    assert generic['title'].startswith('Today: Moon in ') and generic['url'] == '/dashboard'
    personal = N.compose('evening', local, 3, 7)
    assert personal['title'].startswith('Tomorrow:') and personal['url'] == '/horoscope'
    for msg in (generic, personal):
        assert len(msg['title']) <= 60 and len(msg['body']) <= 180


def test_dispatch_sends_once_at_local_time(client, outbox):
    client.post('/api/notifications/subscribe', json={'subscription': SUB, 'tz': 'Asia/Kolkata'})
    before = datetime(2026, 11, 23, 1, 0, tzinfo=timezone.utc)   # 06:30 IST
    at = datetime(2026, 11, 23, 1, 40, tzinfo=timezone.utc)      # 07:10 IST
    evening = datetime(2026, 11, 23, 14, 35, tzinfo=timezone.utc)  # 20:05 IST
    assert N.dispatch(before)['sent'] == 0
    assert N.dispatch(at)['sent'] == 1
    assert N.dispatch(at)['sent'] == 0  # already claimed for today
    assert N.dispatch(evening)['sent'] == 1
    assert [p['tag'] for _, p in outbox] == ['bw-morning', 'bw-evening']


def test_gone_subscription_is_removed(client, monkeypatch):
    def gone(sub, payload):
        raise N.Gone()
    monkeypatch.setattr(N, 'send', gone)
    client.post('/api/notifications/subscribe', json={'subscription': SUB, 'tz': 'UTC'})
    assert N.dispatch(datetime(2026, 11, 23, 7, 5, tzinfo=timezone.utc))['removed'] == 1
    from models import PushSubscription
    assert PushSubscription.query.count() == 0


def test_unsubscribe_and_dispatch_secret(client, monkeypatch):
    client.post('/api/notifications/subscribe', json={'subscription': SUB})
    client.post('/api/notifications/unsubscribe', json={'endpoint': SUB['endpoint']})
    from models import PushSubscription
    assert PushSubscription.query.count() == 0
    assert client.post('/api/notifications/dispatch').status_code == 403
    monkeypatch.setenv('NOTIFICATIONS_CRON_SECRET', 's3cret-value')
    assert client.post('/api/notifications/dispatch', headers={'X-Cron-Secret': 's3cret-value'}).status_code == 200

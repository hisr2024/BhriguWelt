"""Optional accounts: e-mail code / Google sign-in, linked Premium, synced profiles."""
import os
import sys
from unittest.mock import MagicMock

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app as flask_app  # noqa: E402
from services import accounts, entitlements as ent, mailer  # noqa: E402


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv('SECRET_KEY', 'test-secret')
    flask_app.config['TESTING'] = True
    with flask_app.test_client() as c:
        with flask_app.app_context():
            from models import AccountProfiles, AccountPurchase, LoginCode, UserAccount, db
            db.create_all()
            for model in (AccountProfiles, AccountPurchase, LoginCode, UserAccount):
                model.query.delete()
            db.session.commit()
            yield c


@pytest.fixture
def outbox(monkeypatch):
    sent = []
    monkeypatch.setenv('RESEND_API_KEY', 're_test')
    monkeypatch.setattr(mailer, 'send', lambda to, subject, html, text: sent.append((to, subject, text)))
    return sent


def _sign_in(client, outbox, email='seeker@example.com', headers=None):
    assert client.post('/api/account/email/start', json={'email': email}).status_code == 200
    code = outbox[-1][1].split()[0]
    r = client.post('/api/account/email/verify', json={'email': email, 'code': code}, headers=headers or {})
    assert r.status_code == 200, r.get_json()
    return r.get_json()


def test_database_url_normalised(monkeypatch):
    from app import _database_url
    monkeypatch.setenv('DATABASE_URL', 'postgres://u:p@h/db')
    assert _database_url() == 'postgresql+psycopg://u:p@h/db'
    monkeypatch.setenv('DATABASE_URL', 'postgresql://u:p@h/db')
    assert _database_url() == 'postgresql+psycopg://u:p@h/db'


def test_email_code_sign_in_and_me(client, outbox):
    data = _sign_in(client, outbox)
    assert data['user']['email'] == 'seeker@example.com'
    me = client.get('/api/account/me', headers={'X-BW-Auth': data['session']})
    assert me.status_code == 200 and me.get_json()['premium'] == {'active': False}
    assert client.get('/api/account/me').status_code == 403


def test_wrong_code_and_attempt_limit(client, outbox, monkeypatch):
    monkeypatch.setattr('time.sleep', lambda s: None)
    client.post('/api/account/email/start', json={'email': 'a@example.com'})
    code = outbox[-1][1].split()[0]
    for _ in range(5):
        assert client.post('/api/account/email/verify', json={'email': 'a@example.com', 'code': '000000' if code != '000000' else '111111'}).status_code == 400
    # Locked after 5 wrong tries, even with the right code.
    assert client.post('/api/account/email/verify', json={'email': 'a@example.com', 'code': code}).status_code == 400


def test_code_rate_limit(client, outbox):
    for _ in range(5):
        assert client.post('/api/account/email/start', json={'email': 'b@example.com'}).status_code == 200
    assert client.post('/api/account/email/start', json={'email': 'b@example.com'}).status_code == 429


def test_email_unavailable_without_provider(client, monkeypatch):
    monkeypatch.delenv('RESEND_API_KEY', raising=False)
    monkeypatch.delenv('SENDGRID_API_KEY', raising=False)
    assert client.post('/api/account/email/start', json={'email': 'c@example.com'}).status_code == 503


def test_google_sign_in(client, monkeypatch):
    monkeypatch.setattr(accounts, 'verify_google_credential',
                        lambda c: {'email': 'G@Example.com', 'sub': '123', 'name': 'Asha', 'email_verified': True})
    data = client.post('/api/account/google', json={'credential': 'x'}).get_json()
    assert data['user'] == {'email': 'g@example.com', 'name': 'Asha'}
    monkeypatch.setattr(accounts, 'verify_google_credential', lambda c: None)
    assert client.post('/api/account/google', json={'credential': 'bad'}).status_code == 400


def test_purchase_follows_the_account(client, outbox, monkeypatch):
    monkeypatch.setattr(ent, 'status_for', lambda e, fresh=False: {'active': True, 'source': e['s'], 'plan': 'yearly'})
    device_token = ent.issue_token('stripe', 'cus_A')
    first = _sign_in(client, outbox, headers={'X-BW-Entitlement': device_token})
    assert first['premium']['active']
    # A second device with no purchase gets Premium by signing in.
    second = _sign_in(client, outbox)
    assert second['premium']['active'] and ent.read_token(second['premium']['entitlement'])['r'] == 'cus_A'


def test_profiles_sync_encrypted(client, outbox):
    session = _sign_in(client, outbox)['session']
    h = {'X-BW-Auth': session}
    profiles = [{'name': 'Asha', 'dateOfBirth': '1990-05-15', 'timeOfBirth': '10:30',
                 'placeOfBirth': 'New Delhi', 'latitude': 28.6, 'evil': 'x'}, {'bad': 1}]
    assert client.put('/api/account/profiles', json={'profiles': profiles}, headers=h).get_json()['saved'] == 1
    got = client.get('/api/account/profiles', headers=h).get_json()['profiles']
    assert got == [{'name': 'Asha', 'dateOfBirth': '1990-05-15', 'timeOfBirth': '10:30',
                    'placeOfBirth': 'New Delhi', 'latitude': 28.6}]
    from models import AccountProfiles
    assert 'Asha' not in AccountProfiles.query.first().data


def test_signout_all_and_delete(client, outbox):
    session = _sign_in(client, outbox)['session']
    h = {'X-BW-Auth': session}
    assert client.post('/api/account/signout-all', headers=h).status_code == 200
    assert client.get('/api/account/me', headers=h).status_code == 403
    session = _sign_in(client, outbox)['session']
    h = {'X-BW-Auth': session}
    client.put('/api/account/profiles', json={'profiles': [{'name': 'A', 'dateOfBirth': '1990-01-01'}]}, headers=h)
    assert client.delete('/api/account', headers=h).status_code == 200
    assert client.get('/api/account/me', headers=h).status_code == 403
    from models import AccountProfiles, UserAccount
    assert UserAccount.query.filter_by(email='seeker@example.com').count() == 0
    assert AccountProfiles.query.count() == 0

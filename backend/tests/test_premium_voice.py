"""Premium subscriptions (entitlements, gate) and read-aloud voice."""
import base64
import os
import sys
from unittest.mock import MagicMock, patch

import pytest

from services import entitlements as ent
from services import premium_gate, tts_service, voice_usage

# Import the Flask app at module load (before conftest patches redis), as the
# other endpoint tests do.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app as flask_app  # noqa: E402


@pytest.fixture
def client():
    flask_app.config['TESTING'] = True
    with flask_app.test_client() as c:
        with flask_app.app_context():
            yield c


# ── tokens ───────────────────────────────────────────────────────────────

def test_token_roundtrip_and_tamper(monkeypatch):
    monkeypatch.setenv('SECRET_KEY', 's3cret')
    tok = ent.issue_token('stripe', 'cus_123')
    assert ent.read_token(tok) == {'s': 'stripe', 'r': 'cus_123'}
    assert ent.read_token(tok[:-2] + 'xx') is None
    assert ent.read_token('garbage') is None
    monkeypatch.setenv('SECRET_KEY', 'other')
    assert ent.read_token(tok) is None


def test_restore_link_token(monkeypatch):
    monkeypatch.setenv('SECRET_KEY', 's3cret')
    link = ent.issue_restore_link_token('cus_9')
    assert ent.read_restore_link_token(link) == 'cus_9'
    assert ent.read_restore_link_token(link, max_age=-1) is None


# ── store checks ─────────────────────────────────────────────────────────

def _play_response(state, expiry, product='premium_yearly', ack='ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED'):
    resp = MagicMock(status_code=200)
    resp.json.return_value = {
        'subscriptionState': state, 'acknowledgementState': ack,
        'lineItems': [{'productId': product, 'expiryTime': expiry}]}
    return resp


def test_play_status_active_and_acknowledges(monkeypatch):
    session = MagicMock()
    session.get.return_value = _play_response('SUBSCRIPTION_STATE_ACTIVE', '2099-01-01T00:00:00Z',
                                              ack='ACKNOWLEDGEMENT_STATE_PENDING')
    session.post.return_value = MagicMock(status_code=200)
    monkeypatch.setattr(ent, '_play_http', lambda: session)
    result = ent.play_status('tok', acknowledge=True)
    assert result['active'] and result['plan'] == 'yearly'
    assert session.post.call_args[0][0].endswith('/premium_yearly/tokens/tok:acknowledge')


@pytest.mark.parametrize('state,expiry,product,active', [
    ('SUBSCRIPTION_STATE_CANCELED', '2099-01-01T00:00:00Z', 'premium_monthly', True),
    ('SUBSCRIPTION_STATE_EXPIRED', '2020-01-01T00:00:00Z', 'premium_monthly', False),
    ('SUBSCRIPTION_STATE_ACTIVE', '2099-01-01T00:00:00Z', 'some_other_app_sku', False),
    ('SUBSCRIPTION_STATE_ON_HOLD', '2099-01-01T00:00:00Z', 'premium_monthly', False),
])
def test_play_status_states(monkeypatch, state, expiry, product, active):
    session = MagicMock()
    session.get.return_value = _play_response(state, expiry, product)
    monkeypatch.setattr(ent, '_play_http', lambda: session)
    assert ent.play_status('tok')['active'] is active


def test_stripe_status(monkeypatch):
    monkeypatch.setenv('STRIPE_PRICE_MONTHLY', 'price_m')
    monkeypatch.setenv('STRIPE_PRICE_YEARLY', 'price_y')
    sub = {'status': 'trialing', 'cancel_at_period_end': False,
           'items': {'data': [{'price': {'id': 'price_m'}, 'current_period_end': 4102444800}]}}
    listing = MagicMock()
    listing.auto_paging_iter.return_value = [sub]
    fake = MagicMock()
    fake.Subscription.list.return_value = listing
    monkeypatch.setattr(ent, 'stripe_client', lambda: fake)
    result = ent.stripe_status('cus_1')
    assert result['active'] and result['plan'] == 'monthly'
    sub['status'] = 'canceled'
    assert ent.stripe_status('cus_1')['active'] is False


def test_store_outage_keeps_last_answer(monkeypatch):
    monkeypatch.setenv('SECRET_KEY', 's')
    e = {'s': 'stripe', 'r': 'cus_outage'}
    monkeypatch.setattr(ent, 'stripe_status', lambda cid: {'active': True, 'source': 'stripe'})
    assert ent.status_for(e)['active']
    ent._cache[f"stripe:cus_outage"] = (0, {'active': True})   # expired entry
    monkeypatch.setattr(ent, 'stripe_status', MagicMock(side_effect=ConnectionError('down')))
    assert ent.status_for(e)['active']


# ── gate ─────────────────────────────────────────────────────────────────

@pytest.mark.parametrize('path,premium', [
    ('/api/bhrigu-predictions/past-lives', True),
    ('/api/bhrigu-predictions/karmic-debts', True),
    ('/api/bhrigu-predictions/karmic-journey', False),
    ('/api/bhrigu-predictions/karmic-journey/stream', False),
    ('/api/bhrigu-predictions/past-lives/stream', True),
    ('/api/bhrigu-predictions/session/start', False),
    ('/api/insights/daily', False),
    ('/api/insights/horoscope/daily', False),
    ('/api/insights/horoscope/yearly', True),
    ('/api/insights/weekly', True),
    ('/api/matchmaking/compatibility', True),
    ('/api/astrology/birth-chart', False),
])
def test_premium_paths(path, premium):
    assert premium_gate.is_premium_path(path) is premium


def test_gate_off_by_default_and_on_when_enforced(client, monkeypatch):
    monkeypatch.delenv('BILLING_ENFORCE', raising=False)
    r = client.post('/api/matchmaking/compatibility', json={})
    assert r.status_code != 402
    monkeypatch.setenv('BILLING_ENFORCE', 'true')
    r = client.post('/api/matchmaking/compatibility', json={})
    assert r.status_code == 402 and r.get_json()['error'] == 'premium_required'
    r = client.post('/api/insights/daily', json={})
    assert r.status_code != 402


def test_config_endpoint(client, monkeypatch):
    monkeypatch.delenv('STRIPE_SECRET_KEY', raising=False)
    data = client.get('/api/billing/config').get_json()
    assert data['stripe']['available'] is False
    assert data['play']['products'] == {'monthly': 'premium_monthly', 'yearly': 'premium_yearly'}
    assert data['voice_minutes'] == 30


def test_checkout_not_configured(client, monkeypatch):
    monkeypatch.delenv('STRIPE_SECRET_KEY', raising=False)
    assert client.post('/api/billing/stripe/checkout', json={'plan': 'monthly'}).status_code == 503


def test_checkout_redirect_origin_is_allowlisted(client, monkeypatch):
    monkeypatch.setenv('STRIPE_SECRET_KEY', 'sk_test_x')
    monkeypatch.setenv('STRIPE_PRICE_MONTHLY', 'price_m')
    monkeypatch.setenv('STRIPE_PRICE_YEARLY', 'price_y')
    fake = MagicMock()
    fake.checkout.Session.create.return_value = {'url': 'https://checkout.stripe.com/x'}
    monkeypatch.setattr(ent, 'stripe_client', lambda: fake)
    from routes import billing_routes
    monkeypatch.setattr(billing_routes, '_stripe_prices_public', lambda: None)
    r = client.post('/api/billing/stripe/checkout', json={'plan': 'yearly', 'origin': 'https://evil.example'})
    assert r.get_json()['url'].startswith('https://checkout.stripe.com')
    kwargs = fake.checkout.Session.create.call_args.kwargs
    assert kwargs['success_url'].startswith('https://bhriguwelt.app/premium/success')
    assert kwargs['subscription_data'] == {'trial_period_days': 7}
    assert kwargs['line_items'][0]['price'] == 'price_y'
    assert kwargs['managed_payments'] == {'enabled': True}
    assert 'billing_address_collection' not in kwargs and 'currency' not in kwargs

    monkeypatch.setenv('STRIPE_MANAGED_PAYMENTS', 'false')
    client.post('/api/billing/stripe/checkout', json={'plan': 'monthly'})
    kwargs = fake.checkout.Session.create.call_args.kwargs
    assert 'managed_payments' not in kwargs and kwargs['billing_address_collection'] == 'auto'


def test_play_verify_issues_token(client, monkeypatch):
    monkeypatch.setenv('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON', '{}')
    monkeypatch.setattr(ent, 'play_status', lambda tok, acknowledge=False: {
        'active': True, 'source': 'play', 'plan': 'monthly', 'product_id': 'premium_monthly'})
    data = client.post('/api/billing/play/verify', json={'purchase_token': 'abc'}).get_json()
    assert ent.read_token(data['entitlement'])['r'] == 'abc'


# ── voice ────────────────────────────────────────────────────────────────

def test_clean_for_speech():
    text = "## Your karmic debts\n- **Father** — duty e.g. respect\n* 45% of the time → Saturn 12°"
    out = tts_service.clean_for_speech(text)
    assert '#' not in out and '*' not in out and '—' not in out
    assert 'Your karmic debts.' in out
    assert 'for example' in out and '45 percent' in out and '12 degrees' in out


def test_chunking_respects_limit():
    text = ' '.join(f'Sentence number {i} is here.' for i in range(300))
    chunks = tts_service.chunk_text(text, 500)
    assert all(len(c) <= 500 for c in chunks)
    assert ' '.join(chunks) == text


def test_speak_sarvam_and_cache(monkeypatch, tmp_path):
    monkeypatch.setattr(tts_service, '_CACHE_DIR', tmp_path)
    monkeypatch.setenv('SARVAM_API_KEY', 'sk_x')
    monkeypatch.delenv('TTS_ENGINE', raising=False)
    calls = []

    def fake_post(url, json=None, headers=None, timeout=None):
        calls.append(json)
        resp = MagicMock(status_code=200)
        resp.json.return_value = {'audios': [base64.b64encode(b'ID3\x00\x00\x00\x00\x00\x00\x00MP3').decode()]}
        return resp

    monkeypatch.setattr(tts_service.requests, 'post', fake_post)
    audio, info = tts_service.speak('Hello there. Namaste.')
    assert info['chars'] > 0 and not info['cached'] and audio.endswith(b'MP3')
    assert calls[0]['model'] == 'bulbul:v3' and calls[0]['output_audio_codec'] == 'mp3'
    assert calls[0]['language_code'] == 'en-IN'
    assert tts_service.cost_chars('Hello there. Namaste.') == 0
    audio2, info2 = tts_service.speak('Hello there. Namaste.')
    assert info2['cached'] and info2['chars'] == 0 and len(calls) == 1


def test_svara_falls_back_to_sarvam(monkeypatch, tmp_path):
    monkeypatch.setattr(tts_service, '_CACHE_DIR', tmp_path)
    monkeypatch.setenv('TTS_ENGINE', 'svara')
    monkeypatch.setenv('SVARA_TTS_URL', 'https://svara.example')
    monkeypatch.setenv('SARVAM_API_KEY', 'sk_x')

    def fake_post(url, json=None, headers=None, timeout=None):
        if 'svara' in url:
            assert url.endswith('/v1/audio/speech') and json['voice'] == 'en_female'
            return MagicMock(status_code=503, content=b'')
        resp = MagicMock(status_code=200)
        resp.json.return_value = {'audios': [base64.b64encode(b'AUDIO').decode()]}
        return resp

    monkeypatch.setattr(tts_service.requests, 'post', fake_post)
    audio, info = tts_service.speak('Om. Peace.')
    assert info['engine'] == 'sarvam' and audio == b'AUDIO'


def test_speak_requires_premium_and_meters(client, monkeypatch, tmp_path):
    monkeypatch.setattr(tts_service, '_CACHE_DIR', tmp_path)
    monkeypatch.setenv('SARVAM_API_KEY', 'sk_x')
    monkeypatch.setenv('SECRET_KEY', 's')
    assert client.post('/api/voice/speak', json={'text': 'hi'}).status_code == 402

    token = ent.issue_token('stripe', 'cus_voice')
    monkeypatch.setattr(ent, 'status_for', lambda e, fresh=False: {'active': True})
    monkeypatch.setattr(tts_service, 'speak', lambda *a, **k: (b'MP3', {'chars': 900, 'engine': 'sarvam', 'cached': False}))
    monkeypatch.setattr(tts_service, 'cost_chars', lambda *a, **k: 900)
    store = {}
    monkeypatch.setattr(voice_usage, 'used', lambda s: store.get(s, 0))
    monkeypatch.setattr(voice_usage, 'add', lambda s, c: store.__setitem__(s, store.get(s, 0) + c))
    r = client.post('/api/voice/speak', json={'text': 'hello'}, headers={'X-BW-Entitlement': token})
    assert r.status_code == 200 and r.mimetype == 'audio/mpeg'
    assert int(r.headers['X-Voice-Seconds-Left']) == (27000 - 900) // 15
    store[ent.subscriber_key(ent.read_token(token))] = 26500
    r = client.post('/api/voice/speak', json={'text': 'hello'}, headers={'X-BW-Entitlement': token})
    assert r.status_code == 429

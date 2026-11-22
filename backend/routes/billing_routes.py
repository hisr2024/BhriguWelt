"""
Premium subscription and read-aloud voice endpoints.

  GET  /api/billing/config            what the app should offer (stores, prices, trial)
  GET  /api/billing/status            is this browser's entitlement active?
  POST /api/billing/play/verify       Android app: purchase token → entitlement
  POST /api/billing/stripe/checkout   website: start Stripe Checkout
  POST /api/billing/stripe/complete   website: finished Checkout → entitlement
  POST /api/billing/stripe/portal     website: manage / cancel in Stripe
  POST /api/billing/restore           website: e-mail a sign-in link to a payer
  POST /api/billing/restore/confirm   website: link token → entitlement
  POST /api/voice/speak               premium: text → MP3 (counts monthly minutes)
  GET  /api/voice/usage               premium: minutes used / left this month
"""
from __future__ import annotations

import os
import re
import time

from flask import Blueprint, Response, jsonify, request

from services import entitlements as ent
from services import mailer, tts_service, voice_usage
from utils.logger import setup_logger

logger = setup_logger(__name__)

bp = Blueprint('billing', __name__, url_prefix='/api/billing')
voice_bp = Blueprint('voice', __name__, url_prefix='/api/voice')

_ALLOWED_RETURN = re.compile(
    r'^https://((www\.)?bhriguwelt\.app|[a-z0-9-]+\.vercel\.app)$|^http://localhost:\d+$')
_EMAIL = re.compile(r'^[^@\s]{1,64}@[^@\s]{1,255}\.[^@\s]{2,}$')


def _return_origin(payload) -> str:
    origin = (payload.get('origin') or request.headers.get('Origin') or '').rstrip('/')
    extra = (os.getenv('FRONTEND_URL') or '').rstrip('/')
    if _ALLOWED_RETURN.match(origin) or (extra and origin == extra):
        return origin
    return 'https://bhriguwelt.app'


def _link_to_account(source: str, ref: str) -> None:
    """A purchase made or restored while signed in belongs to that account."""
    try:
        from services import accounts
        user = accounts.current_user(request)
        if user:
            accounts.link_purchase(user, source, ref)
    except Exception as exc:  # never fail a purchase over account linking
        logger.warning('Could not link purchase to account: %s', exc)


def _not_configured(store: str):
    return jsonify({'error': 'billing_not_configured', 'store': store,
                    'message': 'Subscriptions are not switched on yet.'}), 503


# ── config & status ──────────────────────────────────────────────────────

_price_cache = {'at': 0.0, 'data': None}


def _stripe_prices_public():
    if not ent.stripe_configured():
        return None
    if _price_cache['data'] is not None and time.time() - _price_cache['at'] < 3600:
        return _price_cache['data']
    stripe = ent.stripe_client()
    out = {}
    for plan, price_id in ent.stripe_prices().items():
        price = stripe.Price.retrieve(price_id, expand=['currency_options'])
        options = {cur: (opt.get('unit_amount') if hasattr(opt, 'get') else opt['unit_amount'])
                   for cur, opt in (price.get('currency_options') or {}).items()}
        options.setdefault(price['currency'], price['unit_amount'])
        out[plan] = {'currency': price['currency'], 'amount': price['unit_amount'],
                     'options': options,
                     'interval': (price.get('recurring') or {}).get('interval')}
    _price_cache.update(at=time.time(), data=out)
    return out


@bp.route('/config', methods=['GET'])
def config():
    try:
        prices = _stripe_prices_public()
    except Exception as exc:
        logger.warning('Could not load Stripe prices: %s', exc)
        prices = None
    return jsonify({
        'enforced': ent.enforcement_on(),
        'trial_days': int(os.getenv('PREMIUM_TRIAL_DAYS', '7')),
        'voice_minutes': voice_usage.monthly_minutes(),
        'play': {'available': ent.play_configured(), 'package': ent.play_package(),
                 'products': ent.play_products()},
        'stripe': {'available': ent.stripe_configured(), 'prices': prices},
        'restore_by_email': mailer.configured() and ent.stripe_configured(),
        'voice': {'available': tts_service.configured(), 'engine': tts_service.engine_name()},
    })


@bp.route('/status', methods=['GET'])
def status():
    entitlement = ent.request_entitlement(request)
    if not entitlement:
        return jsonify({'active': False, 'enforced': ent.enforcement_on()})
    try:
        result = dict(ent.status_for(entitlement, fresh=request.args.get('fresh') == '1'))
    except ent.BillingNotConfigured:
        return _not_configured(entitlement['s'])
    result['enforced'] = ent.enforcement_on()
    if result.get('active'):
        sub = ent.subscriber_key(entitlement)
        result['voice'] = {'minutes': voice_usage.monthly_minutes(),
                           'seconds_left': tts_service.estimate_seconds(voice_usage.remaining(sub))}
    return jsonify(result)


# ── Google Play (Android app) ────────────────────────────────────────────

@bp.route('/play/verify', methods=['POST'])
def play_verify():
    payload = request.get_json(silent=True) or {}
    token = (payload.get('purchase_token') or '').strip()
    if not token or len(token) > 1024:
        return jsonify({'error': 'purchase_token required'}), 400
    if not ent.play_configured():
        return _not_configured('play')
    try:
        result = ent.play_status(token, acknowledge=True)
    except Exception as exc:
        logger.error('Play verification failed: %s', exc)
        return jsonify({'error': 'verification_failed'}), 502
    if not result.get('active'):
        return jsonify({'active': False, 'error': 'not_active', 'state': result.get('state')}), 402
    entitlement_token = ent.issue_token('play', token, result.get('product_id'))
    _link_to_account('play', token)
    ent.forget({'s': 'play', 'r': token})
    return jsonify({**result, 'entitlement': entitlement_token})


# ── Stripe (website) ─────────────────────────────────────────────────────

@bp.route('/stripe/checkout', methods=['POST'])
def stripe_checkout():
    if not ent.stripe_configured():
        return _not_configured('stripe')
    payload = request.get_json(silent=True) or {}
    plan = payload.get('plan')
    if plan not in ('monthly', 'yearly'):
        return jsonify({'error': 'plan must be monthly or yearly'}), 400
    origin = _return_origin(payload)
    stripe = ent.stripe_client()
    params = {
        'mode': 'subscription',
        'line_items': [{'price': ent.stripe_prices()[plan], 'quantity': 1}],
        'success_url': f'{origin}/premium/success?session_id={{CHECKOUT_SESSION_ID}}',
        'cancel_url': f'{origin}/premium',
        'allow_promotion_codes': True,
        'metadata': {'app': 'bhriguwelt', 'plan': plan},
    }
    managed = ent.stripe_managed_payments()
    if managed:
        # Stripe is the seller of record and handles tax, so tax and
        # address parameters are Stripe's to set, not ours.
        params['managed_payments'] = {'enabled': True}
    else:
        params['billing_address_collection'] = 'auto'
    trial = int(os.getenv('PREMIUM_TRIAL_DAYS', '7'))
    if trial > 0:
        params['subscription_data'] = {'trial_period_days': trial}
    currency = (payload.get('currency') or '').lower()
    try:
        if managed:
            raise LookupError  # Stripe picks the buyer's currency itself
        prices = _stripe_prices_public() or {}
        if currency and currency in (prices.get(plan) or {}).get('options', {}):
            params['currency'] = currency
    except Exception:
        pass
    existing = ent.request_entitlement(request)
    if existing and existing['s'] == 'stripe':
        params['customer'] = existing['r']
    try:
        session = stripe.checkout.Session.create(**params)
    except Exception as exc:
        logger.error('Stripe checkout failed: %s', exc)
        return jsonify({'error': 'checkout_failed'}), 502
    return jsonify({'url': session['url']})


@bp.route('/stripe/complete', methods=['POST'])
def stripe_complete():
    if not ent.stripe_configured():
        return _not_configured('stripe')
    session_id = ((request.get_json(silent=True) or {}).get('session_id') or '').strip()
    if not session_id.startswith('cs_'):
        return jsonify({'error': 'session_id required'}), 400
    stripe = ent.stripe_client()
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except Exception as exc:
        logger.warning('Stripe session lookup failed: %s', exc)
        return jsonify({'error': 'unknown_session'}), 404
    if session.get('status') != 'complete' or not session.get('customer'):
        return jsonify({'error': 'not_complete'}), 402
    customer = session['customer']
    ent.forget({'s': 'stripe', 'r': customer})
    _link_to_account('stripe', customer)
    result = ent.status_for({'s': 'stripe', 'r': customer}, fresh=True)
    return jsonify({**result, 'entitlement': ent.issue_token('stripe', customer)})


@bp.route('/stripe/portal', methods=['POST'])
def stripe_portal():
    if not ent.stripe_configured():
        return _not_configured('stripe')
    entitlement = ent.request_entitlement(request)
    if not entitlement or entitlement['s'] != 'stripe':
        return jsonify({'error': 'no_web_subscription'}), 400
    origin = _return_origin(request.get_json(silent=True) or {})
    try:
        session = ent.stripe_client().billing_portal.Session.create(
            customer=entitlement['r'], return_url=f'{origin}/settings')
    except Exception as exc:
        logger.error('Stripe portal failed: %s', exc)
        return jsonify({'error': 'portal_failed'}), 502
    ent.forget(entitlement)
    return jsonify({'url': session['url']})


@bp.route('/restore', methods=['POST'])
def restore():
    payload = request.get_json(silent=True) or {}
    email = (payload.get('email') or '').strip().lower()
    if not _EMAIL.match(email):
        return jsonify({'error': 'valid email required'}), 400
    if not (ent.stripe_configured() and mailer.configured()):
        return jsonify({'error': 'restore_unavailable'}), 503
    origin = _return_origin(payload)
    # Same answer whether or not the address has a subscription, so this
    # cannot be used to find out who subscribes.
    reply = jsonify({'sent': True})
    try:
        stripe = ent.stripe_client()
        for customer in stripe.Customer.list(email=email, limit=5).auto_paging_iter():
            if ent.stripe_status(customer['id']).get('active'):
                _send_restore_mail(email, f"{origin}/premium/restore?t={ent.issue_restore_link_token(customer['id'])}")
                break
    except Exception as exc:
        logger.error('Restore lookup failed: %s', exc)
    return reply


def _send_restore_mail(email: str, link: str) -> None:
    mailer.send(
        email,
        'Your BhriguWelt Premium sign-in link',
        mailer.button_html(
            'Tap the button below on the phone or computer where you want BhriguWelt Premium. '
            'The link works for 30 minutes.',
            link, 'Open Premium', 'If you did not ask for this, you can ignore this e-mail.'),
        f'Open this link on the device where you want BhriguWelt Premium (valid 30 minutes): {link}',
    )


@bp.route('/restore/confirm', methods=['POST'])
def restore_confirm():
    token = ((request.get_json(silent=True) or {}).get('token') or '').strip()
    customer = ent.read_restore_link_token(token) if token else None
    if not customer:
        return jsonify({'error': 'link_expired'}), 400
    try:
        result = ent.status_for({'s': 'stripe', 'r': customer}, fresh=True)
    except ent.BillingNotConfigured:
        return _not_configured('stripe')
    if not result.get('active'):
        return jsonify({'error': 'not_active'}), 402
    _link_to_account('stripe', customer)
    return jsonify({**result, 'entitlement': ent.issue_token('stripe', customer)})


@bp.route('/review/redeem', methods=['POST'])
def review_redeem():
    """App-store reviewers: an access code (REVIEW_ACCESS_CODE) unlocks
    Premium on their device without a purchase."""
    import hashlib
    code = ((request.get_json(silent=True) or {}).get('code') or '')[:128]
    if not ent.review_code_matches(code):
        time.sleep(1)  # slow down guessing
        return jsonify({'error': 'invalid_code'}), 400
    ref = hashlib.sha256(ent.review_code().encode()).hexdigest()[:16]
    return jsonify({'active': True, 'source': 'review', 'plan': 'review',
                    'entitlement': ent.issue_token('review', ref)})


# ── voice ────────────────────────────────────────────────────────────────

@voice_bp.route('/speak', methods=['POST'])
def speak():
    entitlement = ent.request_entitlement(request)
    try:
        active = bool(entitlement and ent.status_for(entitlement).get('active'))
    except ent.BillingNotConfigured:
        active = False
    if not active:
        return jsonify({'error': 'premium_required',
                        'message': 'Listening is part of BhriguWelt Premium.'}), 402
    if not tts_service.configured():
        return jsonify({'error': 'voice_unavailable'}), 503

    payload = request.get_json(silent=True) or {}
    text = payload.get('text') or ''
    if not isinstance(text, str) or not text.strip():
        return jsonify({'error': 'text required'}), 400
    lang = payload.get('lang', 'en')
    gender = payload.get('voice', 'female')
    pace = payload.get('pace', 1.0)

    sub = ent.subscriber_key(entitlement)
    needed = tts_service.cost_chars(text, lang, gender, pace)
    left = voice_usage.remaining(sub)
    if needed > left:
        return jsonify({'error': 'voice_limit_reached',
                        'minutes': voice_usage.monthly_minutes(),
                        'seconds_left': tts_service.estimate_seconds(left)}), 429
    try:
        audio, info = tts_service.speak(text, lang, gender, pace)
    except ValueError:
        return jsonify({'error': 'text required'}), 400
    except tts_service.TTSUnavailable as exc:
        logger.error('Voice failed: %s', exc)
        return jsonify({'error': 'voice_unavailable'}), 503
    voice_usage.add(sub, info['chars'])
    left_after = voice_usage.remaining(sub)
    return Response(audio, mimetype='audio/mpeg', headers={
        'Cache-Control': 'private, max-age=31536000',
        'X-Voice-Seconds-Left': str(tts_service.estimate_seconds(left_after)),
        'X-Voice-Engine': info['engine'],
        'Access-Control-Expose-Headers': 'X-Voice-Seconds-Left, X-Voice-Engine',
    })


@voice_bp.route('/usage', methods=['GET'])
def usage():
    entitlement = ent.request_entitlement(request)
    try:
        active = bool(entitlement and ent.status_for(entitlement).get('active'))
    except ent.BillingNotConfigured:
        active = False
    if not active:
        return jsonify({'error': 'premium_required'}), 402
    sub = ent.subscriber_key(entitlement)
    return jsonify({'minutes': voice_usage.monthly_minutes(),
                    'seconds_left': tts_service.estimate_seconds(voice_usage.remaining(sub))})

"""
Premium entitlements: who has paid, checked against the store that took the money.

BhriguWelt has no user accounts. Instead the browser keeps a signed
"entitlement token" that names where the subscription lives:

* Google Play (the Android app): the Play purchase token. Google is asked
  whether it is active via the Play Developer API (service account).
* Stripe (the website): the Stripe customer id. Stripe is asked whether the
  customer has an active or trialing subscription.

The token is signed with SECRET_KEY so it cannot be forged; the store is the
source of truth for whether it is still active, so cancelling or refunding
in Play or Stripe ends access on the next check. Results are cached briefly
per process to keep store API calls low.

Environment
  GOOGLE_PLAY_PACKAGE                  default app.bhriguwelt.twa
  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON     the service-account key (JSON text)
  PLAY_PRODUCT_MONTHLY / _YEARLY       default premium_monthly / premium_yearly
  STRIPE_SECRET_KEY                    sk_live_... / sk_test_...
  STRIPE_PRICE_MONTHLY / _YEARLY       price_... ids
"""
from __future__ import annotations

import json
import os
import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from utils.logger import setup_logger

logger = setup_logger(__name__)

TOKEN_SALT = 'bw-entitlement-v1'
RESTORE_SALT = 'bw-restore-v1'
STATUS_TTL_SECONDS = 600          # re-ask the store at most every 10 minutes
NEGATIVE_TTL_SECONDS = 60         # a "not active" answer is re-checked sooner

PLAY_ACTIVE_STATES = {
    'SUBSCRIPTION_STATE_ACTIVE',
    'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
    # Cancelled but paid until expiry: still entitled until expiryTime.
    'SUBSCRIPTION_STATE_CANCELED',
}
STRIPE_ACTIVE_STATES = {'active', 'trialing', 'past_due'}


class BillingNotConfigured(RuntimeError):
    """The store this request needs has no credentials on the server."""


# ── configuration ────────────────────────────────────────────────────────

def play_package() -> str:
    return os.getenv('GOOGLE_PLAY_PACKAGE', 'app.bhriguwelt.twa')


def play_products() -> Dict[str, str]:
    return {
        'monthly': os.getenv('PLAY_PRODUCT_MONTHLY', 'premium_monthly'),
        'yearly': os.getenv('PLAY_PRODUCT_YEARLY', 'premium_yearly'),
    }


def stripe_prices() -> Dict[str, str]:
    return {
        'monthly': os.getenv('STRIPE_PRICE_MONTHLY', ''),
        'yearly': os.getenv('STRIPE_PRICE_YEARLY', ''),
    }


def play_configured() -> bool:
    return bool(os.getenv('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON'))


def stripe_configured() -> bool:
    prices = stripe_prices()
    return bool(os.getenv('STRIPE_SECRET_KEY') and prices['monthly'] and prices['yearly'])


def enforcement_on() -> bool:
    """Premium features are only locked once the owner switches this on,
    so nothing is locked before the stores are set up."""
    return os.getenv('BILLING_ENFORCE', 'false').strip().lower() in ('1', 'true', 'yes', 'on')


def _secret() -> str:
    secret = os.getenv('SECRET_KEY')
    if not secret:
        # app.py generates a random SECRET_KEY when unset; tokens would then
        # not survive a restart, which is why render.yaml generates one.
        from flask import current_app
        secret = current_app.config.get('SECRET_KEY') or 'dev-only-secret'
    return secret


# ── tokens ───────────────────────────────────────────────────────────────

def issue_token(source: str, ref: str, product: Optional[str] = None) -> str:
    payload = {'s': source, 'r': ref}
    if product:
        payload['p'] = product
    return URLSafeTimedSerializer(_secret(), salt=TOKEN_SALT).dumps(payload)


def read_token(token: Optional[str]) -> Optional[Dict[str, str]]:
    if not token or len(token) > 4096:
        return None
    try:
        data = URLSafeTimedSerializer(_secret(), salt=TOKEN_SALT).loads(token)
    except BadSignature:
        return None
    if not isinstance(data, dict) or data.get('s') not in ('play', 'stripe') or not data.get('r'):
        return None
    return data


def issue_restore_link_token(customer_id: str) -> str:
    return URLSafeTimedSerializer(_secret(), salt=RESTORE_SALT).dumps({'c': customer_id})


def read_restore_link_token(token: str, max_age: int = 1800) -> Optional[str]:
    try:
        data = URLSafeTimedSerializer(_secret(), salt=RESTORE_SALT).loads(token, max_age=max_age)
    except (BadSignature, SignatureExpired):
        return None
    return data.get('c') if isinstance(data, dict) else None


def subscriber_key(entitlement: Dict[str, str]) -> str:
    """Stable id for usage metering (voice minutes) — never personal data."""
    import hashlib
    return hashlib.sha256(f"{entitlement['s']}:{entitlement['r']}".encode()).hexdigest()[:32]


# ── cache ────────────────────────────────────────────────────────────────

_cache: Dict[str, tuple] = {}
_cache_lock = threading.Lock()


def _cached(key: str):
    with _cache_lock:
        hit = _cache.get(key)
    if hit and hit[0] > time.time():
        return hit[1]
    return None


def _store(key: str, value: Dict[str, Any]) -> Dict[str, Any]:
    ttl = STATUS_TTL_SECONDS if value.get('active') else NEGATIVE_TTL_SECONDS
    with _cache_lock:
        if len(_cache) > 5000:
            _cache.clear()
        _cache[key] = (time.time() + ttl, value)
    return value


def forget(entitlement: Dict[str, str]) -> None:
    with _cache_lock:
        _cache.pop(f"{entitlement['s']}:{entitlement['r']}", None)


# ── Google Play ──────────────────────────────────────────────────────────

_play_session = None


def _play_http():
    global _play_session
    if _play_session is None:
        raw = os.getenv('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON')
        if not raw:
            raise BillingNotConfigured('Google Play billing is not set up on the server')
        from google.oauth2 import service_account
        from google.auth.transport.requests import AuthorizedSession
        creds = service_account.Credentials.from_service_account_info(
            json.loads(raw), scopes=['https://www.googleapis.com/auth/androidpublisher'])
        _play_session = AuthorizedSession(creds)
    return _play_session


def _parse_rfc3339(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        return None


def play_status(purchase_token: str, acknowledge: bool = False) -> Dict[str, Any]:
    url = ('https://androidpublisher.googleapis.com/androidpublisher/v3/applications/'
           f'{play_package()}/purchases/subscriptionsv2/tokens/{purchase_token}')
    resp = _play_http().get(url, timeout=15)
    if resp.status_code in (400, 404, 410):
        return {'active': False, 'source': 'play', 'reason': 'unknown_purchase'}
    resp.raise_for_status()
    sub = resp.json()

    products = play_products()
    plan_by_product = {v: k for k, v in products.items()}
    best_expiry, product_id = None, None
    for item in sub.get('lineItems', []):
        expiry = _parse_rfc3339(item.get('expiryTime'))
        if expiry and (best_expiry is None or expiry > best_expiry):
            best_expiry, product_id = expiry, item.get('productId')

    now = datetime.now(timezone.utc)
    active = (sub.get('subscriptionState') in PLAY_ACTIVE_STATES
              and best_expiry is not None and best_expiry > now
              and product_id in plan_by_product)

    if (acknowledge and active
            and sub.get('acknowledgementState') == 'ACKNOWLEDGEMENT_STATE_PENDING'):
        ack = ('https://androidpublisher.googleapis.com/androidpublisher/v3/applications/'
               f'{play_package()}/purchases/subscriptions/{product_id}/tokens/{purchase_token}:acknowledge')
        ack_resp = _play_http().post(ack, json={}, timeout=15)
        if ack_resp.status_code >= 300:
            logger.warning('Play acknowledge failed: %s', ack_resp.status_code)

    return {
        'active': bool(active),
        'source': 'play',
        'plan': plan_by_product.get(product_id),
        'product_id': product_id,
        'expires': best_expiry.isoformat() if best_expiry else None,
        'state': sub.get('subscriptionState'),
        'manage_url': (f'https://play.google.com/store/account/subscriptions'
                       f'?sku={product_id}&package={play_package()}') if product_id else
                      'https://play.google.com/store/account/subscriptions',
    }


# ── Stripe ───────────────────────────────────────────────────────────────

def stripe_client():
    key = os.getenv('STRIPE_SECRET_KEY')
    if not key:
        raise BillingNotConfigured('Stripe is not set up on the server')
    import stripe
    stripe.api_key = key
    stripe.max_network_retries = 2
    return stripe


def stripe_status(customer_id: str) -> Dict[str, Any]:
    stripe = stripe_client()
    prices = stripe_prices()
    plan_by_price = {v: k for k, v in prices.items() if v}
    subs = stripe.Subscription.list(customer=customer_id, status='all', limit=10)
    best = None
    for sub in subs.auto_paging_iter():
        if sub['status'] not in STRIPE_ACTIVE_STATES:
            continue
        items = sub['items']['data']
        price_id = items[0]['price']['id'] if items else None
        if price_id not in plan_by_price:
            continue
        end = items[0].get('current_period_end') or sub.get('current_period_end')
        if best is None or (end or 0) > (best[1] or 0):
            best = (sub, end, plan_by_price[price_id])
    if not best:
        return {'active': False, 'source': 'stripe'}
    sub, end, plan = best
    return {
        'active': True,
        'source': 'stripe',
        'plan': plan,
        'state': sub['status'],
        'cancel_at_period_end': bool(sub.get('cancel_at_period_end')),
        'expires': datetime.fromtimestamp(end, timezone.utc).isoformat() if end else None,
    }


# ── entry point ──────────────────────────────────────────────────────────

def status_for(entitlement: Optional[Dict[str, str]], fresh: bool = False) -> Dict[str, Any]:
    if not entitlement:
        return {'active': False}
    key = f"{entitlement['s']}:{entitlement['r']}"
    if not fresh:
        hit = _cached(key)
        if hit is not None:
            return hit
    try:
        if entitlement['s'] == 'play':
            result = play_status(entitlement['r'])
        else:
            result = stripe_status(entitlement['r'])
    except BillingNotConfigured:
        raise
    except Exception as exc:  # store unreachable: don't lock a payer out
        logger.warning('Entitlement check failed (%s): %s', entitlement['s'], exc)
        stale = None
        with _cache_lock:
            hit = _cache.get(key)
        if hit:
            stale = hit[1]
        return stale or {'active': False, 'source': entitlement['s'], 'reason': 'store_unreachable'}
    return _store(key, result)


def request_entitlement(req) -> Optional[Dict[str, str]]:
    return read_token(req.headers.get('X-BW-Entitlement'))


def is_premium(req) -> bool:
    ent = request_entitlement(req)
    if not ent:
        return False
    try:
        return bool(status_for(ent).get('active'))
    except BillingNotConfigured:
        return False

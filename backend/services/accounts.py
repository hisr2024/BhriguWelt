"""
Accounts: sign-in with Google or a one-time e-mail code (no passwords).

The browser keeps a signed session token (header X-BW-Auth). It carries the
account id and a token version, so "sign out everywhere" and account
deletion invalidate every device at once. Sessions last 12 months and are
refreshed on use.

Premium purchases (Play/Stripe) are linked to the account, so a subscriber
signed in on any device gets the same entitlement token there.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from services import entitlements as ent
from utils.logger import setup_logger

logger = setup_logger(__name__)

SESSION_SALT = 'bw-session-v1'
SESSION_MAX_AGE = 365 * 24 * 3600
CODE_TTL = timedelta(minutes=10)
CODE_MAX_ATTEMPTS = 5
CODES_PER_HOUR = 5
EMAIL_RE = re.compile(r'^[^@\s]{1,64}@[^@\s]{1,255}\.[^@\s]{2,}$')


def normalise_email(email: str) -> Optional[str]:
    email = (email or '').strip().lower()
    return email if EMAIL_RE.match(email) else None


def google_client_id() -> str:
    return os.getenv('GOOGLE_OAUTH_CLIENT_ID', '').strip()


# ── sessions ─────────────────────────────────────────────────────────────

def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(ent._secret(), salt=SESSION_SALT)


def issue_session(user) -> str:
    return _serializer().dumps({'u': user.id, 'v': user.token_version})


def current_user(req):
    token = req.headers.get('X-BW-Auth')
    if not token or len(token) > 2048:
        return None
    try:
        data = _serializer().loads(token, max_age=SESSION_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None
    from models import UserAccount
    user = UserAccount.query.get(data.get('u'))
    if not user or user.token_version != data.get('v'):
        return None
    return user


# ── sign-in ──────────────────────────────────────────────────────────────

def _code_hash(email: str, code: str) -> str:
    return hmac.new(ent._secret().encode(), f'{email}:{code}'.encode(), hashlib.sha256).hexdigest()


def create_login_code(email: str) -> Optional[str]:
    """Returns the code, or None when this address asked too often."""
    from models import LoginCode, db
    since = datetime.utcnow() - timedelta(hours=1)
    if LoginCode.query.filter(LoginCode.email == email, LoginCode.created_at >= since).count() >= CODES_PER_HOUR:
        return None
    code = f'{secrets.randbelow(1_000_000):06d}'
    LoginCode.query.filter_by(email=email, used=False).update({'used': True})
    db.session.add(LoginCode(email=email, code_hash=_code_hash(email, code),
                             expires_at=datetime.utcnow() + CODE_TTL))
    db.session.commit()
    return code


def verify_login_code(email: str, code: str) -> bool:
    from models import LoginCode, db
    row = (LoginCode.query.filter_by(email=email, used=False)
           .order_by(LoginCode.created_at.desc()).first())
    if not row or row.expires_at < datetime.utcnow() or row.attempts >= CODE_MAX_ATTEMPTS:
        return False
    row.attempts += 1
    ok = hmac.compare_digest(row.code_hash, _code_hash(email, (code or '').strip()))
    if ok:
        row.used = True
    db.session.commit()
    return ok


def verify_google_credential(credential: str) -> Optional[Dict[str, Any]]:
    client_id = google_client_id()
    if not client_id or not credential:
        return None
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        info = id_token.verify_oauth2_token(credential, google_requests.Request(), client_id)
    except Exception as exc:
        logger.warning('Google credential rejected: %s', exc)
        return None
    if not info.get('email_verified') or not info.get('email'):
        return None
    return info


def find_or_create(email: str, google_sub: Optional[str] = None, name: Optional[str] = None):
    from models import UserAccount, db
    user = None
    if google_sub:
        user = UserAccount.query.filter_by(google_sub=google_sub).first()
    if not user:
        user = UserAccount.query.filter_by(email=email).first()
    if not user:
        user = UserAccount(id=str(uuid.uuid4()), email=email)
        db.session.add(user)
    if google_sub and not user.google_sub:
        user.google_sub = google_sub
    if name and not user.name:
        user.name = name[:120]
    user.last_login_at = datetime.utcnow()
    db.session.commit()
    return user


# ── purchases ────────────────────────────────────────────────────────────

def link_purchase(user, source: str, ref: str) -> None:
    if not user or source not in ('play', 'stripe') or not ref:
        return
    from models import AccountPurchase, db
    existing = AccountPurchase.query.filter_by(source=source, ref=ref).first()
    if existing:
        if existing.user_id != user.id:
            # The purchase moves to whoever signed in with it most recently.
            existing.user_id = user.id
            db.session.commit()
        return
    db.session.add(AccountPurchase(user_id=user.id, source=source, ref=ref))
    db.session.commit()


def link_request_entitlement(user, req) -> None:
    entitlement = ent.request_entitlement(req)
    if entitlement and entitlement['s'] in ('play', 'stripe'):
        link_purchase(user, entitlement['s'], entitlement['r'])


def best_entitlement(user) -> Dict[str, Any]:
    """The account's active subscription as an entitlement token, if any."""
    from models import AccountPurchase
    for row in AccountPurchase.query.filter_by(user_id=user.id).order_by(AccountPurchase.created_at.desc()):
        try:
            status = ent.status_for({'s': row.source, 'r': row.ref})
        except ent.BillingNotConfigured:
            continue
        if status.get('active'):
            return {**status, 'entitlement': ent.issue_token(row.source, row.ref)}
    return {'active': False}


# ── synced profiles (encrypted at rest) ──────────────────────────────────

def _fernet():
    from cryptography.fernet import Fernet
    raw = os.getenv('PROFILE_ENCRYPTION_KEY') or ent._secret()
    key = base64.urlsafe_b64encode(hashlib.sha256(f'bw-profiles:{raw}'.encode()).digest())
    return Fernet(key)


PROFILE_FIELDS = ('name', 'dateOfBirth', 'timeOfBirth', 'placeOfBirth', 'latitude', 'longitude',
                  'timezone', 'notes', 'gender', 'birthTimeAccuracy', 'createdAt', 'updatedAt')


def clean_profiles(items: Any) -> List[Dict[str, Any]]:
    out = []
    if not isinstance(items, list):
        return out
    for item in items[:50]:
        if not isinstance(item, dict) or not item.get('name') or not item.get('dateOfBirth'):
            continue
        clean = {k: item[k] for k in PROFILE_FIELDS if k in item and item[k] is not None}
        for k, v in list(clean.items()):
            if isinstance(v, str):
                clean[k] = v[:500]
        out.append(clean)
    return out


def load_profiles(user) -> Dict[str, Any]:
    from models import AccountProfiles
    row = AccountProfiles.query.get(user.id)
    if not row:
        return {'profiles': [], 'updated_at': None}
    try:
        profiles = json.loads(_fernet().decrypt(row.data.encode()).decode())
    except Exception:
        logger.error('Stored profiles for an account could not be decrypted')
        profiles = []
    return {'profiles': profiles, 'updated_at': row.updated_at.isoformat() + 'Z'}


def save_profiles(user, profiles: List[Dict[str, Any]]) -> None:
    from models import AccountProfiles, db
    blob = _fernet().encrypt(json.dumps(profiles).encode()).decode()
    row = AccountProfiles.query.get(user.id)
    if row:
        row.data = blob
        row.updated_at = datetime.utcnow()
    else:
        db.session.add(AccountProfiles(user_id=user.id, data=blob))
    db.session.commit()


def delete_account(user) -> None:
    from models import AccountProfiles, AccountPurchase, LoginCode, UserAccount, db
    AccountProfiles.query.filter_by(user_id=user.id).delete()
    AccountPurchase.query.filter_by(user_id=user.id).delete()
    LoginCode.query.filter_by(email=user.email).delete()
    UserAccount.query.filter_by(id=user.id).delete()
    db.session.commit()

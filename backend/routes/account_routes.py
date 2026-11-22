"""
Account endpoints (optional sign-in; the app works without an account).

  GET    /api/account/config          which sign-in methods are switched on
  POST   /api/account/email/start     send a 6-digit code to an e-mail address
  POST   /api/account/email/verify    code → session
  POST   /api/account/google          Google ID token → session
  GET    /api/account/me              who am I (+ Premium on this account)
  POST   /api/account/signout-all     end every session of this account
  GET    /api/account/profiles        synced birth profiles
  PUT    /api/account/profiles        replace synced birth profiles
  DELETE /api/account                 delete the account and its data

Auth errors use 403, not 401: the app's 401 handler means "re-enter passcode".
"""
from __future__ import annotations

import time

from flask import Blueprint, jsonify, request

from services import accounts, mailer
from utils.logger import setup_logger

logger = setup_logger(__name__)

bp = Blueprint('account', __name__, url_prefix='/api/account')


def _signed_in_response(user):
    accounts.link_request_entitlement(user, request)
    return jsonify({
        'session': accounts.issue_session(user),
        'user': {'email': user.email, 'name': user.name},
        'premium': accounts.best_entitlement(user),
    })


def _require_user():
    user = accounts.current_user(request)
    if not user:
        return None, (jsonify({'error': 'signed_out'}), 403)
    return user, None


@bp.route('/config', methods=['GET'])
def config():
    return jsonify({
        'email': mailer.configured(),
        'google_client_id': accounts.google_client_id() or None,
    })


@bp.route('/email/start', methods=['POST'])
def email_start():
    email = accounts.normalise_email((request.get_json(silent=True) or {}).get('email'))
    if not email:
        return jsonify({'error': 'invalid_email'}), 400
    if not mailer.configured():
        return jsonify({'error': 'email_unavailable'}), 503
    code = accounts.create_login_code(email)
    if code is None:
        return jsonify({'error': 'too_many_codes'}), 429
    try:
        mailer.send(
            email,
            f'{code} is your BhriguWelt sign-in code',
            f'<p>Namaste,</p><p>Your BhriguWelt sign-in code is:</p>'
            f'<p style="font-size:28px;letter-spacing:6px;font-weight:700">{code}</p>'
            f'<p>It works for 10 minutes. If you did not ask for it, you can ignore this e-mail.</p>',
            f'Your BhriguWelt sign-in code is {code}. It works for 10 minutes.',
        )
    except Exception as exc:
        logger.error('Sign-in code e-mail failed: %s', exc)
        return jsonify({'error': 'email_failed'}), 502
    return jsonify({'sent': True})


@bp.route('/email/verify', methods=['POST'])
def email_verify():
    payload = request.get_json(silent=True) or {}
    email = accounts.normalise_email(payload.get('email'))
    code = str(payload.get('code') or '')[:12]
    if not email or not accounts.verify_login_code(email, code):
        time.sleep(0.5)
        return jsonify({'error': 'invalid_code'}), 400
    return _signed_in_response(accounts.find_or_create(email))


@bp.route('/google', methods=['POST'])
def google():
    info = accounts.verify_google_credential((request.get_json(silent=True) or {}).get('credential') or '')
    if not info:
        return jsonify({'error': 'google_rejected'}), 400
    email = accounts.normalise_email(info['email'])
    if not email:
        return jsonify({'error': 'google_rejected'}), 400
    return _signed_in_response(accounts.find_or_create(email, info.get('sub'), info.get('name')))


@bp.route('/me', methods=['GET'])
def me():
    user, error = _require_user()
    if error:
        return error
    return _signed_in_response(user)


@bp.route('/signout-all', methods=['POST'])
def signout_all():
    user, error = _require_user()
    if error:
        return error
    from models import db
    user.token_version += 1
    db.session.commit()
    return jsonify({'signed_out': True})


@bp.route('/profiles', methods=['GET', 'PUT'])
def profiles():
    user, error = _require_user()
    if error:
        return error
    if request.method == 'GET':
        return jsonify(accounts.load_profiles(user))
    items = accounts.clean_profiles((request.get_json(silent=True) or {}).get('profiles'))
    accounts.save_profiles(user, items)
    return jsonify({'saved': len(items)})


@bp.route('', methods=['DELETE'])
def delete():
    user, error = _require_user()
    if error:
        return error
    accounts.delete_account(user)
    return jsonify({'deleted': True})

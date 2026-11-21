"""
Server-side premium gate (Flask before_request hook).

Does nothing unless BILLING_ENFORCE is on. Then the premium readings,
the week/month/year horoscopes and matchmaking answer 402 without an
active entitlement. The free plan keeps Today, the birth chart, the
Karmic journey reading and the daily horoscope.
"""
from __future__ import annotations

import re

from flask import jsonify, request

from services import entitlements as ent

PREMIUM = [
    re.compile(r'^/api/bhrigu-predictions/(past-lives|future-lives|karmic-debts|present-life|'
               r'life-events|karmic-remedies|karma-reset|relationships|predictions|comprehensive)/?$'),
    re.compile(r'^/api/bhrigu-predictions/(?!karmic[-_]journey/)[a-z_-]+/stream/?$'),
    re.compile(r'^/api/insights/(weekly|monthly|yearly)/?$'),
    re.compile(r'^/api/insights/horoscope/(weekly|monthly|yearly)/?$'),
    re.compile(r'^/api/matchmaking/'),
]


def is_premium_path(path: str) -> bool:
    return any(p.match(path) for p in PREMIUM)


def check():
    if request.method == 'OPTIONS' or not ent.enforcement_on():
        return None
    if not is_premium_path(request.path):
        return None
    if ent.is_premium(request):
        return None
    return jsonify({
        'error': 'premium_required',
        'message': 'This reading is part of BhriguWelt Premium.',
    }), 402

"""JWT helpers for profile authentication."""

from __future__ import annotations

import os
import importlib.util
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

if importlib.util.find_spec("jwt"):
    import jwt
else:

    class _JwtStubError(Exception):
        """Fallback error for missing PyJWT dependency."""

    class jwt:  # type: ignore[no-redef]
        PyJWTError = _JwtStubError

        @staticmethod
        def encode(*args: object, **kwargs: object) -> str:
            raise RuntimeError("PyJWT is required for profile authentication")

        @staticmethod
        def decode(*args: object, **kwargs: object) -> Dict[str, Any]:
            raise RuntimeError("PyJWT is required for profile authentication")

_JWT_ISSUER = "bhriguwelt"
_JWT_AUDIENCE = "bhriguwelt-profiles"


def _jwt_secret() -> str:
    secret = os.environ.get("BHRIGUWELT_JWT_SECRET")
    if not secret:
        raise RuntimeError("BHRIGUWELT_JWT_SECRET is not configured")
    return secret


def _jwt_ttl_seconds() -> int:
    raw = os.environ.get("BHRIGUWELT_JWT_TTL_SECONDS", "86400")
    try:
        return int(raw)
    except ValueError as exc:
        raise RuntimeError("BHRIGUWELT_JWT_TTL_SECONDS must be an integer") from exc


def issue_profile_token(*, user_id: str, profile_id: int | None = None, role: str = "user") -> str:
    now = datetime.now(timezone.utc)
    ttl = timedelta(seconds=_jwt_ttl_seconds())
    payload: Dict[str, Any] = {
        "sub": user_id,
        "role": role,
        "iss": _JWT_ISSUER,
        "aud": _JWT_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int((now + ttl).timestamp()),
    }
    if profile_id is not None:
        payload["profile_id"] = profile_id
    return jwt.encode(payload, _jwt_secret(), algorithm="HS256")


def decode_profile_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(
            token,
            _jwt_secret(),
            algorithms=["HS256"],
            audience=_JWT_AUDIENCE,
            issuer=_JWT_ISSUER,
        )
    except jwt.PyJWTError as exc:
        raise ValueError("Invalid or expired token") from exc

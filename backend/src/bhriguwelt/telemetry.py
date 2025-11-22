"""Optional telemetry hooks for backend monitoring."""

from __future__ import annotations

import os
from typing import Dict

try:  # pragma: no cover - sentry-sdk is optional
    import sentry_sdk
except Exception:  # pragma: no cover - environments may omit Sentry
    sentry_sdk = None


def init_telemetry(dsn: str | None = None, environment: str | None = None) -> None:
    """Initialize Sentry if a DSN is provided.

    When Sentry is unavailable or DSN is blank, this function no-ops so the
    zero-dependency runtime stays intact.
    """

    resolved_dsn = dsn or os.environ.get("SENTRY_DSN")
    if not resolved_dsn or sentry_sdk is None:
        return

    sentry_sdk.init(
        dsn=resolved_dsn,
        environment=environment or os.environ.get("ENVIRONMENT", "production"),
        traces_sample_rate=float(os.environ.get("SENTRY_TRACES_SAMPLE_RATE", "0.0")),
        profiles_sample_rate=float(os.environ.get("SENTRY_PROFILES_SAMPLE_RATE", "0.0")),
    )


def capture_exception(error: BaseException, context: Dict[str, object] | None = None) -> None:
    """Send an exception to Sentry when configured."""

    if sentry_sdk is None or not sentry_sdk.Hub.current.client:
        return

    sentry_sdk.capture_exception(error, scope=lambda scope: scope.set_context("bhrigu", context or {}))


__all__ = ["init_telemetry", "capture_exception"]

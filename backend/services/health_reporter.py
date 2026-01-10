"""
Dependency health reporter for Bhrigu predictions services.
Aggregates service readiness and initialization errors.
"""
from typing import Dict, Any, List

from services.openai_service import get_openai_service, get_openai_initialization_errors
from services.corpus_loader import get_corpus_loader
from services.bhrigu_offline_wisdom import (
    get_offline_wisdom_generator,
    get_offline_wisdom_initialization_errors,
)
from services.astrology_calculator import (
    get_astrology_calculator,
    get_astrology_dependency_error,
)


class HealthReporter:
    """Aggregate dependency status for predictions services."""

    def _build_status(self, available: bool, errors: List[str]) -> Dict[str, Any]:
        if not available:
            status = "unavailable"
        elif errors:
            status = "degraded"
        else:
            status = "ok"
        return {
            "status": status,
            "available": available,
            "errors": errors,
        }

    def get_dependency_status(self) -> Dict[str, Any]:
        """Return dependency health status for prediction services."""
        openai_service = get_openai_service()
        openai_errors = get_openai_initialization_errors()
        openai_available = bool(openai_service and openai_service.enabled)
        if not openai_available and not openai_errors:
            openai_errors = ["OpenAI service not enabled."]

        corpus_result = get_corpus_loader()
        corpus_available = bool(corpus_result and corpus_result.get('loader'))
        corpus_errors = []
        if not corpus_available and corpus_result and corpus_result.get('error'):
            error_info = corpus_result['error']
            corpus_errors = [f"{error_info.get('code', 'unknown')}: {error_info.get('message', 'Corpus loader unavailable')}"]

        offline_wisdom = get_offline_wisdom_generator()
        offline_errors = get_offline_wisdom_initialization_errors()
        offline_available = bool(offline_wisdom)

        calculator = get_astrology_calculator()
        calculator_error = get_astrology_dependency_error()
        calculator_errors = [calculator_error] if calculator_error else []
        calculator_available = bool(calculator)

        dependencies = {
            "openai": self._build_status(openai_available, openai_errors),
            "corpus": self._build_status(corpus_available, corpus_errors),
            "offline_wisdom": self._build_status(offline_available, offline_errors),
            "calculator": self._build_status(calculator_available, calculator_errors),
        }

        overall_status = "ok"
        if any(dep["status"] == "unavailable" for dep in dependencies.values()):
            overall_status = "unavailable"
        elif any(dep["status"] == "degraded" for dep in dependencies.values()):
            overall_status = "degraded"

        return {
            "status": overall_status,
            "dependencies": dependencies,
        }


_health_reporter_instance = None


def get_health_reporter() -> HealthReporter:
    """Get or create the health reporter singleton."""
    global _health_reporter_instance
    if _health_reporter_instance is None:
        _health_reporter_instance = HealthReporter()
    return _health_reporter_instance

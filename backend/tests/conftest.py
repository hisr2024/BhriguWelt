"""Test fixtures and path setup for backend tests."""

from __future__ import annotations

import sys
import threading
import trace
from pathlib import Path
from typing import Iterable, List, Set

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SRC_PATH = PROJECT_ROOT / "src"

if str(SRC_PATH) not in sys.path:  # pragma: no cover - import side effect
    sys.path.insert(0, str(SRC_PATH))

_TRACE_KEY = "_cov_tracer"


def _discover_py_files(paths: Iterable[str]) -> List[Path]:
    discovered: List[Path] = []
    for raw in paths:
        candidate = (PROJECT_ROOT / raw).resolve()
        if candidate.is_dir():
            discovered.extend(candidate.rglob("*.py"))
        elif candidate.suffix == ".py" and candidate.exists():
            discovered.append(candidate)
    return discovered


def pytest_addoption(parser):  # pragma: no cover - exercised via CLI
    parser.addoption("--cov", action="append", default=[], help="Paths to measure coverage for")
    parser.addoption(
        "--cov-report",
        action="append",
        default=[],
        help="Report formats (supports term-missing)",
    )


def pytest_configure(config):  # pragma: no cover - exercised via CLI
    cov_targets = config.getoption("--cov")
    if cov_targets:
        tracer = trace.Trace(count=True, trace=False, ignoredirs=[sys.prefix, sys.exec_prefix])
        setattr(config, _TRACE_KEY, tracer)


def pytest_sessionstart(session):  # pragma: no cover - exercised via CLI
    tracer = getattr(session.config, _TRACE_KEY, None)
    if tracer:
        sys.settrace(tracer.globaltrace)
        threading.settrace(tracer.globaltrace)


def pytest_sessionfinish(session, exitstatus):  # pragma: no cover - exercised via CLI
    tracer = getattr(session.config, _TRACE_KEY, None)
    if not tracer:
        return

    sys.settrace(None)
    threading.settrace(None)
    results = tracer.results()

    files = _discover_py_files(session.config.getoption("--cov"))
    if not files:
        return

    term_missing = "term-missing" in session.config.getoption("--cov-report")
    reporter = session.config.pluginmanager.getplugin("terminalreporter")

    total_executable = 0
    total_executed = 0

    for file in sorted(files):
        executable: Set[int] = set(trace._find_executable_linenos(str(file)))  # type: ignore[attr-defined]
        executed: Set[int] = set(results.counts.get(str(file), {}))
        if not executable:
            continue

        total_executable += len(executable)
        total_executed += len(executed)

        if reporter and term_missing:
            missing = sorted(executable - executed)
            pct = (len(executed) / len(executable)) * 100
            reporter.write_line(
                f"{file.relative_to(PROJECT_ROOT)}: {pct:5.1f}% covered, missing lines: {missing}",
            )

    if reporter and total_executable:
        overall = (total_executed / total_executable) * 100
        reporter.write_line(f"TOTAL COVERAGE: {overall:5.1f}% over {total_executable} lines")

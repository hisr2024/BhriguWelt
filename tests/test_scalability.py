import os
import time
from concurrent.futures import ThreadPoolExecutor
from urllib.request import urlopen

import pytest

BASE_URL = os.getenv('SCALABILITY_BASE_URL')
CONCURRENCY = int(os.getenv('SCALABILITY_CONCURRENCY', '1000'))
TIMEOUT = int(os.getenv('SCALABILITY_TIMEOUT', '10'))

pytestmark = pytest.mark.skipif(
    not BASE_URL,
    reason='SCALABILITY_BASE_URL is not set; provide a running backend to execute load test.',
)


def _hit_health() -> int:
    with urlopen(f"{BASE_URL.rstrip('/')}/health", timeout=TIMEOUT) as response:
        return response.status


def test_scalability_health_endpoint():
    """Emulate high-concurrency requests against the health endpoint."""
    start = time.time()
    max_workers = min(CONCURRENCY, 200)

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        statuses = list(executor.map(lambda _: _hit_health(), range(CONCURRENCY)))

    duration = time.time() - start
    assert all(status == 200 for status in statuses)
    assert duration < (TIMEOUT * 4), (
        f"High-load test exceeded expected runtime: {duration:.2f}s for {CONCURRENCY} requests"
    )

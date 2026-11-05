"""Lahiri must apply on every thread (Swiss Ephemeris settings are thread-local)."""
import threading
from datetime import datetime, timezone

from services import ephemeris_core as ec


def _compute(out, key):
    dt = datetime(1983, 8, 9, 3, 50, tzinfo=timezone.utc)  # 09:20 IST
    out[key] = (round(ec.ascendant(dt, 28.6139, 77.209), 4),
                round(ec._ayanamsa(dt), 4),
                round(ec.planet_positions(datetime(1990, 1, 1, 0, 1, tzinfo=timezone.utc))['Moon']['longitude'], 4))


def test_worker_thread_matches_main_thread():
    out = {}
    _compute(out, 'main')
    t = threading.Thread(target=_compute, args=(out, 'worker'))
    t.start(); t.join()
    assert out['worker'] == out['main']
    assert 23.5 < out['main'][1] < 23.8   # Lahiri ayanamsa in 1983 ≈ 23°38′

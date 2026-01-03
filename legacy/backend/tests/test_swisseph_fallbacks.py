from __future__ import annotations

from datetime import datetime, timezone

from bhriguwelt import astronomical_calculations as ac


def test_swisseph_errors_fall_back_to_python(monkeypatch):
    monkeypatch.setattr(ac, "has_swisseph", lambda: True)
    def _boom(*_, **__):
        raise RuntimeError("boom")

    monkeypatch.setattr(ac, "_swisseph_lunar_details", _boom)

    result = ac.derive_lunar_details(datetime(2024, 5, 18, tzinfo=timezone.utc))

    assert result["lunar_tithi"]
    assert result["moon_element"]

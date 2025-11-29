from __future__ import annotations

from datetime import datetime, timezone

from bhriguwelt import astronomical_calculations as astro


def test_derive_lunar_details_falls_back_when_swisseph_breaks(monkeypatch):
    monkeypatch.setattr(astro, "has_swisseph", lambda: True)
    monkeypatch.setattr(astro, "_swisseph_lunar_details", lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("boom")))

    details = astro.derive_lunar_details(datetime.now(tz=timezone.utc), latitude=0.0, longitude=0.0)

    assert 1 <= int(details["lunar_tithi"]) <= 30
    assert isinstance(details["moon_element"], str)

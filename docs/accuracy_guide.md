# Accuracy and Panchang Alignment Guide

This release layers tradition-aware rules, Panchang hints, and integrity
checks over the Bhrigu Samhita engines. Use the guide below when validating
outputs, reconciling Panchang values with third-party tools, or onboarding
new manuscript families.

## Automated inputs
- `backend/src/bhriguwelt/astronomical_calculations.py` can derive Panchang-like
  fields from birth date, time, and optional coordinates so forms no longer rely
  on manual tithi/house recall.
- `calendar_conversion.convert_birth_details` returns Śaka month, tithi name,
  Nakshatra, Yoga, and Karana identifiers so frontend clients can surface
  aligned rituals.

### Panchang derivation formulas
When Swiss Ephemeris is present, the Panchang values follow standard
celestial-longitude formulas (see `_swisseph_panchang`):

- **Tithi** = ⌊((λ<sub>moon</sub> − λ<sub>sun</sub>) mod 360) / 12⌋ + 1, with
  names drawn from `_TITHI_NAMES` and phases prefixed with *Shukla* (1–15) or
  *Krishna* (16–30).
- **Nakshatra** = ⌊(λ<sub>moon</sub> mod 360) / (360 / 27)⌋ + 1 → index into
  `_NAKSHATRAS`.
- **Yoga** = ⌊((λ<sub>moon</sub> + λ<sub>sun</sub>) mod 360) / (360 / 27)⌋ + 1 →
  index into `_YOGAS`.
- **Karana** = ⌊((λ<sub>moon</sub> − λ<sub>sun</sub>) mod 360) / 6⌋ + 1 → name
  from `_KARANA_SEQUENCE`, which preserves the repeating *Bava*→*Vishti* cycle
  and closes with *Shakuni*, *Chatushpada*, and *Naga*.

The fallback branch keeps hashes deterministic across environments while
mirroring the same modular math (see `_cyclic_value` and `_fallback_panchang`).
This ensures unit tests remain stable even without compiled ephemerides.

### Time and coordinate normalization
- `normalize_birth_datetime` accepts ISO strings and optional timezones or
  minute offsets, returning an aware UTC datetime. The helper also tolerates
  pre-1900 dates so archival manuscript entries can be tested.
- `geocode_location` prefers geopy + TimezoneFinder when installed and falls
  back to hashed coordinates to avoid network reliance during CI.
- All Panchang math runs in IST (`Asia/Kolkata`) via `_ist_datetime` to align
  with the 82°30' meridian mandated by the Calendar Reform Committee.

## Tradition selection
- All principles, remedies, engines, and matchmaking criteria now carry a
  `tradition` value (`universal`, `northern`, `southern-grantha`, or
  `western-grantha`). Requests filter results so seekers only see folios from
  the manuscript family they chose.

### Expected tradition outcomes
- **Universal**: Serve cross-lineage guidance and shared house attributions.
- **Northern/Southern Grantha**: Use manuscript-specific remedies and varga
  emphases; favor regional Panchanga annotations when supplied.
- **Western Grantha**: Prefer overlays that already reconcile Hellenistic
  influences found in digitized western manuscripts.

When adding a new manuscript family, document its folio markers and any house
or nakshatra reinterpretations in `docs/bhrigu_references.md` so tradition
filters can be audited.

## Integrity
- `backend/data/integrity.txt` stores MD5 hashes for the YAML corpus and its
  offline Python mirror. Run `python backend/scripts/update_integrity.py` after
  editing either file to refresh the audit trail.

### Integrity verification runbook
1. Modify folio YAML or the offline Python mirror.
2. Execute `python backend/scripts/update_integrity.py` to regenerate the MD5
   snapshot.
3. Commit the updated `backend/data/integrity.txt` alongside the content
   changes so reviewers can verify checksums.
4. For releases, cross-check the recorded hashes against deployment artifacts to
   ensure Panchang rule bundles remain untampered.

### Troubleshooting skew
- If Panchang displays drift from independent panchangams, confirm the server
  timezone is IST-aligned and Swiss Ephemeris is available. If not, compare
  fallback hashes across environments to rule out differing Python hash seeds.
- If integrity checks fail on CI, ensure the runner uses the same Python major
  version (hash salts differ across versions) and that `backend/data` is not
  mutated during build steps.

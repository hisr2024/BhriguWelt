# Accuracy and Panchang Alignment Guide

This release layers tradition-aware rules, Panchang hints, and integrity
checks over the Bhrigu Samhita engines.

## Automated inputs
- `backend/src/bhriguwelt/astronomical_calculations.py` can derive Panchang-like
  fields from birth date, time, and optional coordinates so forms no longer rely
  on manual tithi/house recall.
- `calendar_conversion.convert_birth_details` now returns Śaka month, tithi name,
  Nakshatra, Yoga, and Karana identifiers so frontend clients can surface
  aligned rituals.

## Tradition selection
- All principles, remedies, engines, and matchmaking criteria now carry a
  `tradition` value (`universal`, `northern`, `southern-grantha`, or
  `western-grantha`). Requests filter results so seekers only see folios from
  the manuscript family they chose.

## Integrity
- `backend/data/integrity.txt` stores MD5 hashes for the YAML corpus and its
  offline Python mirror. Run `python backend/scripts/update_integrity.py` after
  editing either file to refresh the audit trail.

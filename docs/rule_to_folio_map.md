# Bhrigu Samhita folio → runtime rule mapping

| Folio / Sutra | Engine | Runtime rule | Notes |
| ------------- | ------ | ------------ | ----- |
| BR-1          | Horoscope | Elevates `moon_element == water` by +0.20 in scoring | See `calculations.score_principles` for the modifier. |
| BR-7          | Horoscope | Boosts Mars in 10th house with lunar tithi 5 | Used inside `score_principles` to prioritize vocation directives. |
| BR-18         | Horoscope | Saturn + Venus in 2nd with Rahu aspect triggers remedy emphasis | Referenced in `score_principles` and `horoscope._compose_horoscope_interpretation`. |
| MM-DEFAULT    | Matchmaking | Fallback compatibility notes when folios are sparse | Lives in `calculations.evaluate_matchmaking`. |
| MM-SYN        | Matchmaking | Synastry overlay builder fuses Mars/Venus/Mercury houses | Implemented in `calculations._build_synastry_overlays`. |
| PL-PRIMARY    | Past-life  | Selects highest-confidence reincarnation narrative | Applied in `horoscope._compose_past_life_interpretation`. |
| FUTURE-TRANSIT| Future / Transits | Ranks transit directives by certainty | See `calculations.evaluate_transits` for scoring. |
| REM-ANCHOR    | Remedies | Injects top folio IDs into interpretation for UI anchors | `horoscope._compose_horoscope_interpretation` appends these. |

Use this table when onboarding or extending engines so manuscript references stay visible in code reviews and UI copy.

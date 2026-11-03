# Birth-time accuracy

The Lagna moves about 1° every 4 minutes, and the Moon about 13° per day. The optional `birth_time_accuracy` field sets how much weight the engine gives to statements that depend on houses or degrees.

| Value | Effect in `bhrigu_nadi_rules.py` |
|---|---|
| `exact` | Every rule at full weight. |
| `within_15` | House-based rules × 0.85. |
| `within_hour` | House-based rules × 0.6, tagged "[birth time ±1 h: house may shift]". The sensitivity check widens to ±60 min. The Moon's navamsa is skipped. |
| `unknown` | Houses are counted from the Moon (**Chandra Lagna**). House-based rules × 0.55, tagged "[houses from Moon]". Lagna-degree transits, the D9 Lagna and the spouse-navamsa reading are skipped. The sensitivity check tests whether the Moon's nakshatra, and so the dasha sequence, changes during the birth day. |

**Chandra Lagna** is standard classical practice. Phaladeepika and other texts read gochara from the Moon, and astrologers use the Moon as the reference sign when the birth time is unreliable.

**F-SENS-01** recomputes the chart at the offsets above and flags any Lagna or Moon-sign change. This check is an engineering safeguard, not a technique from the texts.

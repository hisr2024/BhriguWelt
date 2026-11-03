# Ashtakavarga — F-AV-01, F-AV-02 (label: classical)

**Source:** Brihat Parashara Hora Shastra, the Ashtakavarga chapters (ch. 66 in the R. Santhanam edition). For example, the Moon's table is vv. 24–31 and Venus's is vv. 56–63.

## How it is computed
- Each of the seven grahas has a **Bhinnashtakavarga (BAV)**.
- Eight contributors give it bindus: the Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn and the Lagna. Each one gives a bindu in fixed houses counted from its own sign.
- The tables live in `ASHTAKAVARGA` in `backend/services/bhrigu_nadi_rules.py`.
- Per-planet totals: Sun 48, Moon 49, Mars 39, Mercury 54, Jupiter 56, Venus 52, Saturn 39.
- **Sarvashtakavarga (SAV)** is the sum of the seven BAVs. It always totals 337, which the unit tests check.

## How the app uses it
- **F-AV-01:** SAV per house, counted from the Lagna, or from the Moon when the birth time is unknown.
  - 28 or more is read as strong, and below 25 as weak. This is the common convention for an average of 337 / 12 ≈ 28.
  - The finding reports the domain houses for the category, plus the strongest and weakest houses.
- **F-AV-02:** transit strength. It gives the bindus that Saturn and Jupiter receive, in their own BAV, for the sign they currently transit.
  - 4 or more of 8 is favourable, and 3 or fewer is weak.
  - It also gives the bindus for Saturn's next sign.

## Variant readings
These four rows were checked against two pages that cite BPHS ch. 66 (tempora.ltd). The open-source PyJHora (a Jagannatha Hora port) uses a different reading for them:

| Row | BPHS (used here) | Variant (PyJHora) |
|---|---|---|
| Moon's BAV, from the Moon | 1 3 6 7 10 11 | 1 3 6 7 9 10 11 |
| Moon's BAV, from Mars | 2 3 5 6 9 10 11 | 2 3 5 6 10 11 |
| Moon's BAV, from Jupiter | 1 4 7 8 10 11 12 | 1 2 4 7 8 10 11 |
| Venus's BAV, from Mars | 3 5 6 9 11 12 | 3 4 6 9 11 12 |

Both readings keep the same per-planet totals. If you prefer the other reading, change those four rows in the table.

## Reductions (shodhana) — F-AV-03
Both reductions follow BPHS.

**Trikona shodhana.** For each trine group of signs (fire, earth, air, water):
- if any sign in the group has 0, the group is left unchanged;
- if all three are equal, all become 0;
- otherwise the smallest value is subtracted from each sign.

**Ekadhipatya shodhana.** Applied after trikona, to the pairs of signs that share a lord (Mars, Venus, Mercury, Jupiter and Saturn each own two). The Sun and Moon own one sign each, so they have no pair.
- No change if either value is 0 or both signs hold a graha.
- **Both signs empty:** equal values become 0; unequal values both drop to the smaller one.
- **One sign occupied:** if the empty sign is lower it becomes 0; otherwise it is reduced to the occupied sign's value.
- "Occupied" counts the seven grahas only. The nodes and the Lagna are not counted.
- Some authors instead reduce an empty sign that is *equal* to the occupied sign to 0. This engine treats equal as unchanged, the same reading PyJHora uses for that case.
- All five sign pairs are reduced in every planet's row, as BPHS describes. PyJHora differs on two points: it reduces only the owning planet's own pair, and it counts the Lagna and the nodes as occupants.

The app reports the reduced bindus for the sign Saturn and Jupiter are transiting. Sodhya pinda (the weighted sum) is **not** computed, because the published rasi multipliers differ between editions (for example, Virgo is 5 or 6).

## Kakshya timing — F-AV-04
- Each sign is split into 8 kakshyas of 3°45′. Their lords, in order, are Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon and Lagna.
- A slow planet gives its results while it crosses a kakshya whose lord gave it a bindu in that sign. That information comes from the prastara chart, the contributor-by-sign breakdown.
- The app lists the next such windows for Saturn and Jupiter over 2 years.

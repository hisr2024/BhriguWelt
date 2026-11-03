# Bhrigu / Nadi rule catalogue (chart-facts layer)

Implemented in `backend/services/bhrigu_nadi_rules.py` on top of
`backend/services/ephemeris_core.py` (Swiss Ephemeris, Lahiri ayanamsa,
whole-sign houses, mean node). Every prediction is now built from these
findings first; the LLM only phrases them (one call per category).

## Why this layer exists

The audit found the readings were generic because:

1. **The chart itself was wrong.** The Lagna was wrong in every tested chart, because sidereal time was converted to degrees twice and then fed into an invented formula. Rahu/Ketu were about 58° off, because a Dublin Julian Day was mixed with a standard one. The dasha ignored the birth balance and had no antardasha.
2. **Fallback routing.** Every section prompt contained "Do NOT mention soul purpose", which made fallback routing send every section to the Karmic Journey template.
3. **Invented content.** That template contained invented figures ("60-70% through the journey", "7-12 incarnations") and invented folio citations.

All three are fixed. The invented constants are removed and prompts no longer ask for folio numbers.

## Provenance labels

| Label | Meaning |
|---|---|
| classical | BPHS, Phaladeepika, Jaimini Sutras, standard gochara |
| tradition-attributed | Practised under the Bhrigu/Nadi name and known mainly from 20th-century publications: Bhrigu Bindu, Bhrigu Chakra Paddhati, R.G. Rao's Bhrigu Nandi Nadi. **Add a sourced text to `core_wisdom/techniques/` before marketing these as canonical Bhrigu Samhita.** |
| modern | Engineering or modern synthesis |

Weights (0–1) are ranking priors. They are never shown as percentages or probabilities.

## Rules

| ID | Provenance | What it computes | Dated |
|---|---|---|---|
| F-LAGNA-01 | classical | Lagna degree and nakshatra; Lagna lord's sign, house, nakshatra; occupants | – |
| F-NODES-01 | classical | Rahu/Ketu sign, degree and house; conjunct planets; the karmic axis | – |
| F-KARAKA-01 | classical | Jaimini 7-karaka scheme: Atmakaraka, Amatyakaraka, Darakaraka; 12th from the Atmakaraka | – |
| F-DIGNITY-01 | classical | Exaltation, debilitation (with neecha-bhanga check), own sign | – |
| F-RETRO-01 | modern reading | Retrograde grahas at birth | – |
| F-PARIVARTANA-01 | classical | Sign exchange, classified Maha / Khala / Dainya | – |
| F-YOGA-01 | classical | Gajakesari and Pancha Mahapurusha, both tested against the chart | – |
| F-BHAVAT-01 | classical | For each domain: house H, Hth from H, and Hth from the natural karaka | – |
| F-BNN-02 | tradition-attributed | Jiva karaka (Jupiter for male charts, Venus for female) and its trine/2nd/12th/7th links. Needs the optional `gender` input; never guessed | – |
| F-BNN-03 | tradition-attributed | Saturn as karma karaka and its links. A retrograde planet also acts from the previous sign | – |
| F-DASHA-01 | classical | Vimshottari maha/antar dasha with birth balance; next two antardashas | ✔ |
| F-DASHA-02 | classical | Activation by the dasha lord: house it occupies, houses it owns, its star lord's house | ✔ |
| F-DASHA-03 | classical | Domain windows over 12 years: periods where both the maha and antar lords signify the domain | ✔ |
| F-TRANSIT-01 | classical | Saturn/Jupiter within 1° of natal Moon, Sun and Lagna degree, next 5 years | ✔ |
| F-SADESATI-01 | classical | Saturn in the 12th/1st/2nd sign from the Moon (rising, peak, setting phases) | ✔ |
| F-GOCHARA-01 | classical | Jupiter's sign counted from the Moon (Phaladeepika ch. 26) | ✔ |
| F-BB-01 | tradition-attributed | Bhrigu Bindu (Rahu→Moon midpoint); Saturn/Jupiter conjunctions with it over 10 years | ✔ |
| F-BCP-01 | tradition-attributed | Bhrigu Chakra Paddhati: running year N activates house ((N−1) mod 12)+1 | ✔ |
| F-BNN-01 | tradition-attributed | Jupiter progressed one sign per year, and the natal planets it links | ✔ |
| F-SENS-01 | modern | Re-computes the chart at ±15/30 min (±60 if approximate); flags a Lagna or Moon-sign change. If the time is unknown, checks whether the Moon's nakshatra changes that day | – |
| F-D9-01 / 02 | classical | Navamsa: vargottama planets; Venus and 7th lord in D9 | – |
| F-KARAKAMSHA-01 | classical | Atmakaraka's navamsa sign, its occupants, 12th from it (Jaimini 1) | – |
| F-YOGA-02..05 | classical | Dharma-Karmadhipati, Viparita raja, Sunapha / Anapha / Durudhara / Kemadruma, Dhana | – |
| F-STAR-01 | modern | Domain lord → star lord → houses it occupies and owns | – |
| F-MOKSHA-01 | classical | Moksha indicators that are actually present (no counts, no percentages) | – |
| F-LESSON-01 | modern | Lesson triggers from `data/bhrigu_karmic_soul_journey_model.json` | – |
| F-TRANSIT-02 | modern | Double transit of Jupiter + Saturn on a domain house or its lord | ✔ |
| F-GOCHARA-02 / 03 | classical | Saturn from Moon; Kantaka (4th) and Ashtama (8th) Shani windows (Phaladeepika ch. 26) | ✔ |
| F-AV-01 / 02 | classical | Sarvashtakavarga house strength; transit bindus of Saturn and Jupiter (BPHS ch. 66) | ✔ |
| F-AV-03 | classical | Trikona and ekadhipatya shodhana of the transit sign's bindus | – |
| F-AV-04 | classical | Kakshya timing: Saturn and Jupiter windows in bindu-giving kakshyas | ✔ |
| F-GOCHARA-04 | classical | Sun, Mars, Mercury and Venus (60 days) and the nodes: house from Moon, vedha-blocked days, bindus | ✔ |
| F-NODES-02 | modern | Nodal return of Rahu to its natal degree | ✔ |
| F-WINDOW-01 | modern | Ranks up to three distinct windows where dated rules overlap | ✔ |

Sources and provenance for every technique: `core_wisdom/techniques/`.

## Reference chart (unit-tested)

15 May 1990, 10:30 IST, Delhi:

- **Lagna and nodes:** Lagna 9°53′ Cancer. Rahu 17°38′ Capricorn (7th). Ketu 17°38′ Cancer (1st).
- **Dasha:** Rahu MD until 2029-12-09. Rahu–Sun AD runs 2026-06-28 → 2027-05-22.
- **Bhrigu Bindu:** 8°44′ Cancer. Saturn conjoins it in Sep 2034 – Jun 2035.
- **Sensitivity flag:** the Moon sits at 29°51′ Sagittarius and becomes Capricorn at +30 min.

See `backend/tests/test_bhrigu_nadi_rules.py`.

## Precision inputs

- **`gender`** (`male` / `female` / `other`): selects the Bhrigu Nandi Nadi jiva karaka (F-BNN-02). With `other`, the rule is skipped.
- **`birth_time_accuracy`** (`exact` / `within_15` / `within_hour` / `unknown`): down-weights and tags house-based rules. With `unknown`, houses are counted from the Moon (Chandra Lagna). See `core_wisdom/techniques/birth_time.md`.

Both are optional fields on the get-started form and the profile page. Both are part of the server cache key.

## Still open

- Sodhya pinda: the rasi multipliers differ between editions, so it is left out until a source is chosen.
- `vedic_yogas_calculator.py` still marks 27 yogas active regardless of the chart, so don't use it for readings.
- `backend/data/*_principles.yml` and `docs/bhrigu_references.md` contain folio numbers we could not verify.

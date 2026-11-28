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
| F-DIGNITY-01 | classical | Exaltation (with the degree of deepest exaltation), debilitation, own sign and the moolatrikona portion (BPHS ch. 3). Neecha-bhanga: lord of the debilitation sign, or the planet exalted there, in a kendra from the Lagna or the Moon; or exaltation in the navamsa (Phaladeepika ch. 7) | – |
| F-RETRO-01 | modern reading | Retrograde grahas at birth | – |
| F-PARIVARTANA-01 | classical | Sign exchange, classified Maha / Khala / Dainya | – |
| F-YOGA-01 | classical | Gajakesari and Pancha Mahapurusha, both tested against the chart | – |
| F-BHAVAT-01 | classical | For each domain: house H, Hth from H, and Hth from the natural karaka | – |
| F-BNN-02 | tradition-attributed | Jiva karaka (Jupiter for male charts, Venus for female) and its links by R. G. Rao's Nadi aspects: same sign and trines (same direction), 7th and 3rd/11th (opposite direction), 2nd and 12th. Needs the optional `gender` input; never guessed | – |
| F-BNN-03 | tradition-attributed | Saturn as karma karaka and its links. A retrograde planet also acts from the previous sign | – |
| F-DASHA-01 | classical | Vimshottari maha/antar dasha with birth balance; next two antardashas | ✔ |
| F-DASHA-02 | classical | Activation by the dasha lord: house it occupies, houses it owns, its star lord's house | ✔ |
| F-DASHA-03 | classical | Domain windows over 12 years: periods where both the maha and antar lords signify the domain | ✔ |
| F-TRANSIT-01 | classical | Saturn/Jupiter within 1° of natal Moon, Sun and Lagna degree, next 5 years | ✔ |
| F-SADESATI-01 | classical | Saturn in the 12th/1st/2nd sign from the Moon (rising, peak, setting phases) | ✔ |
| F-GOCHARA-01 | classical | Jupiter's sign counted from the Moon (Phaladeepika ch. 26) | ✔ |
| F-BB-01 | tradition-attributed | Bhrigu Bindu = Rahu + half the arc from Rahu forward to the Moon (C. S. Patel, *Predicting through Navamsa and Nadi Astrology*, ch. 13, method 1; his worked examples are unit tests). Crossings by Saturn, Jupiter, Rahu and Ketu over 10 years within 100′, and their aspects (Jupiter 5/7/9, Saturn 3/7/10, nodes 5/9) over 4 years; a crossing outranks an aspect | ✔ |
| F-BCP-01 | tradition-attributed | Bhrigu Chakra Paddhati: running year N activates house ((N−1) mod 12)+1; its occupants, its lord's house, the planets aspecting it and the round of the wheel | ✔ |
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
| F-BSUTRA-01 | tradition-attributed | Bhrigu Sutram: the year of life in which a planet's house result is said to show (39 sutras that state an age, with their stated conditions). Upcoming years are dated; past years are listed as check-points for the birth time. Not applied when the birth time is unknown | ✔ |
| F-BNN-04 | tradition-attributed | Field of work from the planets connected with Saturn, the karma karaka (same sign, trine, 7th). Planet meanings are the classical karakatvas (Phaladeepika ch. 5) | – |
| F-BNN-05 | tradition-attributed | Bhrigu Nandi Nadi timing: windows in the next 4 years when transit Jupiter joins the direction of a natal karaka (Saturn = work, Venus = home/vehicles and the wife, Mercury = land/study, Mars = the husband) and when Jupiter and Saturn both connect with it; states whether the birth chart supports it | ✔ |
| F-MATURITY-01 | tradition-attributed | Maturity ages: Jupiter 16, Sun 22, Moon 24, Venus 25, Mars 28, Mercury 32, Saturn 36, Rahu 42, Ketu 48; the planet maturing now or next | ✔ |
| F-STATE-01 | classical | The state of each planet: its age by degree (Baladi avastha: infant, youth, adult, old, spent, running forward in odd signs and backward in even signs), its alertness by sign (awake in own or exalted sign, asleep in an enemy's or debilitation sign, dreaming otherwise) and its directional strength (Sun and Mars in the 10th, Moon and Venus in the 4th, Mercury and Jupiter in the 1st, Saturn in the 7th). BPHS ch. 45 and 27 | – |
| F-ARUDHA-01 | classical | Arudha Lagna: as far from the Lagna lord as the lord is from the Lagna, with the 10th taken when it falls in the 1st or 7th. Planets in the 11th from it show gains, in the 12th the drains (BPHS ch. 29) | – |
| F-ARUDHA-02 | classical | Upapada, the pada of the 12th house: its lord's dignity and the planets in the 2nd from it, which sustain or strain a marriage (BPHS ch. 30) | – |
| F-D10-01 | classical | Dashamsha (tenth division, 3° parts; from the sign itself in odd signs, from its 9th in even signs): the 10th lord, the Sun and Saturn there, and planets in the same sign in both charts | – |
| F-D7-01 | classical | Saptamsha (seventh division; from the sign itself in odd signs, from its 7th in even signs): the 5th lord and Jupiter there | – |
| F-INDU-01 | classical | Indu Lagna, the wealth point: kalas of the 9th lords from the Lagna and the Moon (Sun 30, Moon 16, Mars 6, Mercury 8, Jupiter 10, Venus 12, Saturn 1) added, divided by 12, the remainder counted from the Moon (Uttara Kalamrita) | – |
| F-YOGA-06..12 | classical | Mahabhagya (day or night birth with Sun, Moon and Lagna in odd or even signs, by gender), Adhi (benefics 6th, 7th, 8th from the Moon), Amala (benefic in the 10th), Vesi / Vasi / Ubhayachari (planets beside the Sun), Shakata (Moon 6th, 8th or 12th from Jupiter, with its cancellation), Saraswati, and the Nabhasa yogas Rajju, Musala, Nala, Mala and Sarpa. Each is stated only when its condition is met | – |
| F-YOGA-13 | modern | Kala Sarpa: all seven planets on one side of the Rahu–Ketu axis (popular usage; not in BPHS) | – |
| F-DASHA-04 | classical | The sub-period lord counted from the main-period lord: kendra or trine works smoothly, 6th, 8th or 12th brings friction, the rest is moderate; natural friendship is noted (BPHS, antardasha chapters) | ✔ |
| F-YOGINI-01 | classical | Yogini dasha, a second 36-year cycle: Mangala 1, Pingala 2, Dhanya 3, Bhramari 4, Bhadrika 5, Ulka 6, Siddha 7, Sankata 8 years; the first is (birth star + 3) mod 8, with the balance from the Moon's place in the star | ✔ |
| F-MURTI-01 | tradition-attributed | Murti nirnaya: the grade of the current Saturn and Jupiter transits from the Moon's sign at the minute the planet entered, counted from the birth Moon: 1, 6, 11 gold; 2, 5, 9 silver; 3, 7, 10 copper; 4, 8, 12 iron | ✔ |

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

## Counter-checks (28 Nov 2026)

- **Astronomy.** 300 random charts (1930–2025, latitudes −55° to +60°) compared with an independent ephemeris (PyEphem) and first-principles formulas: planets within 0.6–2.6″, mean node 0.15″, Lagna 0.33″. The remaining difference is the reference's own accuracy. The engine's sidereal longitudes are free of nutation, as a star-fixed zodiac requires.
- **Lahiri ayanamsa** at J2000: 23°51′25.5″.
- **Vimshottari** recomputed independently from the Moon's longitude: identical to the second; the nine periods sum to 120 years.
- **Signs, nakshatras, padas, navamsa:** no mismatch in 2,700 placements.
- **Ashtakavarga:** every chart gives the classical totals 48/49/39/54/56/52/39 (337).
- **Gochara vedha table** re-read against Phaladeepika ch. 26: all seven planets agree.
- **Bhrigu Bindu:** matches the worked examples of the source.

## Reviewed and not adopted

- **Bhrigu Saral Paddhati (Saptarishis Astrology, from 2009).** Its rules ("Jupiter disturbs the 10th and 6th from itself", "Jupiter with Saturn spoils Aries") say that "at least one signification" changes, without saying which or when; its authors add that it does not work in every chart. Too loose to raise precision.
- **Nadi amsha (the 150th division, Chandra Kala Nadi).** Published sources disagree on the counting order (movable/fixed/dual against odd/even) and the result verses are not available as data. An amsha number without its reading adds nothing a reader can use.
- **Bhrigu Nandi Nadi friend and enemy groups.** Known in the tradition, but the exact table could not be checked against a source in this pass.
- **Length-of-life statements** (Bhrigu Sutram 8th house; 64th navamsa; 22nd drekkana): left out on purpose.
- **Palm-leaf Nadi readings and the Bhrigu Samhita horoscope collection itself.** These are libraries of individual readings, not a rule set. No critical edition exists, so they cannot be reproduced or verified by calculation.

## Still open

- Sodhya pinda: the rasi multipliers differ between editions, so it is left out until a source is chosen.
- `vedic_yogas_calculator.py` still marks 27 yogas active regardless of the chart. No live code uses it; don't use it for readings.
- `backend/data/*_principles.yml` and `docs/bhrigu_references.md` contain folio numbers we could not verify. They no longer reach any prompt unless `ALLOW_UNVERIFIED_CORPUS=true` (`services/corpus_loader.py`).

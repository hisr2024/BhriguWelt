# Classical core (label: classical)

Sources: Brihat Parashara Hora Shastra (BPHS), Brihat Jataka (BJ), Phaladeepika (PD), Saravali and Uttara Kalamrita. Chapters are cited by subject, because chapter numbers differ between BPHS editions.

## Houses and lords — F-LAGNA-01, F-BHAVAT-01
- Houses are counted whole-sign from the Lagna. The lord of each house is the lord of its sign, as in the BPHS chapter on houses.
- **Bhavat-bhavam:** the Hth house from the Hth repeats that house's theme. The formula is `((2H − 2) mod 12) + 1`.
- **Karaka-from-karaka:** count the house from its natural significator. Examples: 7th from Venus for the spouse, 9th from the Sun for the father, 4th from the Moon for the mother, 5th from Jupiter for children, 10th from the Sun for career.

## Graha drishti (sign aspect) — F-ASPECT
- Every graha aspects the 7th sign from itself.
- Mars also aspects the 4th and 8th, Jupiter the 5th and 9th, and Saturn the 3rd and 10th (BPHS, chapter on aspects; BJ).
- Rahu and Ketu are given the 7th only. Some authors add 5th and 9th aspects for the nodes; that view is disputed, so it is off by default.

## Dignity — F-DIGNITY-01
- **Exaltation signs:** Sun Aries, Moon Taurus, Mars Capricorn, Mercury Virgo, Jupiter Cancer, Venus Pisces, Saturn Libra.
- **Debilitation:** the 7th sign from exaltation.
- **Neecha-bhanga (simplified):** the lord of the debilitation sign, or the planet exalted there, sits in a kendra from the Lagna.

## Parivartana — F-PARIVARTANA-01
Two planets in each other's signs (PD, chapter on yogas). The exchange is classed as:
- **Dainya:** a 6th, 8th or 12th house is involved.
- **Khala:** the 3rd house is involved.
- **Maha:** all other exchanges.

## Vimshottari dasha — F-DASHA-01/02/03
- **Cycle:** 120 years with the lord order Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17. The first period is the lord of the Moon's nakshatra.
- **Birth balance:** the elapsed fraction of the Moon's nakshatra is subtracted from the first period.
- **Antardasha:** length = `Y(maha) × Y(antar) / 120` years (BPHS, dasha chapters).
- **Results:** a period gives the results of the houses its lord occupies and owns, and of its star lord.
- **Domain windows:** a period scores highest when both the maha and antar lords signify the domain (repo rules BS-216/224/231/236).

## Yogas — F-YOGA-01..05
| ID | Yoga | Condition | Source |
|---|---|---|---|
| F-YOGA-01 | Pancha Mahapurusha | Mars, Mercury, Jupiter, Venus or Saturn in own or exaltation sign in a kendra from the Lagna | BPHS, BJ |
| F-YOGA-01 | Gajakesari | Jupiter in a kendra from the Moon | BPHS, PD |
| F-YOGA-02 | Dharma-Karmadhipati | 9th and 10th lords conjunct, in exchange or in mutual 7th aspect | BPHS, Rajayoga chapter |
| F-YOGA-03 | Viparita raja | Lords of the 6th, 8th or 12th placed in the 6th, 8th or 12th | BPHS; Uttara Kalamrita |
| F-YOGA-04 | Sunapha / Anapha / Durudhara / Kemadruma | Planets (excluding the Sun and nodes) 2nd, 12th, both or neither from the Moon | BJ, Chandra-yoga chapter. The Kemadruma cancellation used here (a planet in a kendra from the Moon) comes from later texts such as PD, not from BJ |
| F-YOGA-05 | Dhana | 2nd or 11th lord conjunct the lord of the 1st, 5th or 9th | BPHS, Dhanayoga chapter |

The old `vedic_yogas_calculator.py` marks 27 yogas active regardless of the chart, so it must not be used for readings.

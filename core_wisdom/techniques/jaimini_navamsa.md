# Jaimini karakas and the navamsa (label: classical)

Sources: Jaimini Upadesa Sutras, adhyaya 1 (karakas, karakamsha), the BPHS chapters on karakas and on the sixteen divisional charts (shodashavarga), and Phaladeepika.

## Chara karakas — F-KARAKA-01
- The seven grahas, Sun to Saturn, are ranked by degree within their sign.
- The highest degree is the Atmakaraka (AK), the next is the Amatyakaraka, and the lowest is the Darakaraka (DK, the spouse significator).
- The default is the 7-karaka scheme. Set `BHRIGU_KARAKA_SCHEME=8` to use BPHS's 8-karaka scheme, which adds Rahu measured as 30° minus its degree.

## Navamsa (D9) — F-D9-01, F-D9-02
- Each sign is split into nine padas of 3°20′. The count runs continuously from Aries, which places:
  - fire signs from Aries,
  - earth signs from Capricorn,
  - air signs from Libra,
  - water signs from Cancer.
  - The code computes this as `floor(lon × 9 / 30) mod 12`.
- **Vargottama:** the same sign in the rashi chart and the navamsa. It is read as steady and reliable.
- **Marriage:** the navamsa positions of Venus and the 7th lord show its quality (BPHS).
- **Accuracy:** the Moon's navamsa is skipped when the birth time is uncertain by an hour or more, because the Moon moves 3°20′ in about six hours.

## Karakamsha — F-KARAKAMSHA-01, F-MOKSHA-01
- The karakamsha is the AK's navamsa sign (Jaimini 1). Planets in that sign describe the soul's main pursuits.
- The 12th sign from the karakamsha shows the final emancipation (moksha) indicators. Ketu or benefics there are read as strengthening liberation.
- **F-MOKSHA-01** lists only the indicators actually present:
  - Ketu in the 12th
  - Jupiter occupying or aspecting the 12th
  - benefics or Ketu in the 12th from the karakamsha
- The engine **never** outputs a count of remaining lives or a percentage of progress. No classical text computes either, and the earlier template invented them.

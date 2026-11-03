# Gochara (transits)

## Classical — counted from the natal Moon (Phaladeepika ch. 26, Gocharaphala)
- **F-GOCHARA-01:** Jupiter is favourable in the 2nd, 5th, 7th, 9th and 11th signs from the Moon.
- **F-GOCHARA-02:** Saturn is favourable in the 3rd, 6th and 11th signs from the Moon, and demanding elsewhere.
- **F-GOCHARA-03:**
  - *Kantaka Shani* is Saturn in the 4th from the Moon.
  - *Ashtama Shani* is Saturn in the 8th from the Moon.
- **F-SADESATI-01:** Sade Sati is Saturn in the 12th, 1st and 2nd from the Moon (the rising, peak and setting phases). Retrograde re-entries are included.
- The vedha (obstruction) refinements in the same chapter are **not yet implemented**.

## Transits over natal points — F-TRANSIT-01
- The engine flags Saturn or Jupiter within 1° of the natal Moon, Sun or Lagna degree, over the next 5 years.
- Conjunction is classical gochara. The 1° orb is a modern precision choice.
- The Lagna degree is skipped when it isn't exactly known.

## Double transit — F-TRANSIT-02 (modern)
- Jupiter and Saturn must each occupy or aspect (by sign) the domain house or its lord's sign at the same time.
- The idea was popularised in the 20th century (K. N. Rao) and rests on classical drishti. It also appears in the repo as BS-218.
- It is used only to support a dasha window, never as a standalone prediction.

## Nodal return — F-NODES-02 (modern framing)
- Transit Rahu returns to its natal degree roughly every 18.6 years. The return is computed astronomically.
- The "desire-axis reset" reading is interpretive.

## Ranked windows — F-WINDOW-01 (modern)
- The engine merges dated findings whose date ranges overlap, and scores each window by the sum of the rule weights.
- It returns up to three windows that don't overlap each other.
- Weights are ranking priors. The UI never shows them as probabilities.

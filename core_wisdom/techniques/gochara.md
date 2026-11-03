# Gochara (transits)

## Classical — counted from the natal Moon (Phaladeepika ch. 26, Gocharaphala)
- **F-GOCHARA-01:** Jupiter is favourable in the 2nd, 5th, 7th, 9th and 11th signs from the Moon.
- **F-GOCHARA-02:** Saturn is favourable in the 3rd, 6th and 11th signs from the Moon, and demanding elsewhere.
- **F-GOCHARA-03:** Saturn in the 4th or 8th from the Moon. Phaladeepika ch. 26 gives Saturn's results by house from the Moon. The names *Kantaka Shani* and *Ashtama Shani* are later popular usage, not terms from that chapter.
- **F-SADESATI-01:** Saturn in the 12th, 1st and 2nd from the Moon (the rising, peak and setting phases), including retrograde re-entries. The name *Sade Sati* is likewise popular usage; the results come from the same chapter.
- **Vedha (obstruction), Phaladeepika ch. 26 vv. 3–8:** a planet in a favourable house gives no good result while another transiting planet occupies its vedha house.
  - Applied to Jupiter (F-GOCHARA-01) and Saturn (F-GOCHARA-02).
  - Pairs, written as good house : vedha house:
    - Sun 3:9, 6:12, 10:4, 11:5
    - Moon 1:5, 3:9, 6:12, 7:2, 10:4, 11:8
    - Mars and Saturn 3:12, 6:9, 11:5
    - Mercury 2:5, 4:3, 6:9, 8:1, 10:8, 11:12
    - Jupiter 2:12, 5:4, 7:3, 9:10, 11:8
    - Venus 1:8, 2:7, 3:1, 4:10, 5:9, 8:5, 9:11, 11:6, 12:3
  - **Exemptions:** the Sun and Saturn don't obstruct each other, and neither do the Moon and Mercury (vv. 3–6).
  - The nodes are not used as obstructers.
  - Source: *Phaladeepika*, tr. V. Subrahmanya Sastri, 2nd ed. 1950 (on wisdomlib.org). The OCR of v. 8 (Venus) is damaged; its pairs follow the order of houses listed in that verse.

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
- A window is reported only when a domain dasha period (F-DASHA-03) overlaps at least one other dated rule for the **same** theme. This follows the principle that transits deliver what the dasha promises.
- The dates shown are the actual intersection of the overlapping ranges.
- It returns up to three windows that don't overlap each other.
- Weights are ranking priors. The UI never shows them as probabilities.

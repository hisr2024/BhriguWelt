# Technique sources and provenance

Every rule in `backend/services/bhrigu_nadi_rules.py` carries one of three labels. This folder explains where each technique comes from, so that the app never presents a modern method as an ancient one.

| Label | Meaning |
|---|---|
| **classical** | Found in the standard Sanskrit hora texts of Indian origin. |
| **tradition-attributed** | Taught under the Bhrigu or Nadi name, but known to us through 20th-century publications. No older manuscript has been traced. |
| **modern** | A 20th-century synthesis, or an engineering safeguard. |

## About "19th-century manuscripts"

Most classical texts reached print from manuscripts only in the late 19th and early 20th centuries, so "19th-century source" usually means "the first printed edition of an older text".

- **Brihat Parashara Hora Shastra:** according to its Wikipedia article (https://en.wikipedia.org/wiki/Brihat_Parashara_Hora_Shastra), which itself cites secondary scholarship, the text was:
  - first printed by Venkateswara Press, Bombay, in 1905;
  - edited by Sitaram Jha in 1944, who reportedly acknowledged altering it;
  - without any known ancient commentary.
  Check this against a primary source before quoting it.
- **Brihat Jataka (Varahamihira) and Phaladeepika (Mantreswara):** both have long, continuous manuscript and commentary traditions.
- **Jaimini Upadesa Sutras:** survive with medieval commentaries.

We found **no 19th-century or earlier manuscript** for three of the techniques. They are therefore labelled tradition-attributed:

- Bhrigu Bindu
- Bhrigu Chakra Paddhati (BCP)
- The Bhrigu Nandi Nadi sign-link rules

If you hold a manuscript, an edition or a verse reference for any of these, add it to the matching file and the label can be raised.

The repo files `backend/data/*_principles.yml` and `docs/bhrigu_references.md` contain folio numbers that we could not verify. The rules engine does not use them.

## Files

| File | Techniques | Label |
|---|---|---|
| [classical_core.md](classical_core.md) | Lagna and house lords, graha drishti, dignity, parivartana, Vimshottari dasha, bhavat-bhavam, yogas (Pancha Mahapurusha, Gajakesari, Dharma-Karmadhipati, Viparita, Dhana, Chandra yogas incl. Kemadruma) | classical |
| [jaimini_navamsa.md](jaimini_navamsa.md) | Chara karakas, karakamsha, 12th from karakamsha, navamsa, vargottama, moksha indicators | classical |
| [ashtakavarga.md](ashtakavarga.md) | Bhinnashtakavarga, Sarvashtakavarga, transit bindus | classical |
| [gochara.md](gochara.md) | Transits counted from the Moon, Sade Sati, Kantaka and Ashtama Shani, transits over natal points, double transit, nodal return | classical / modern |
| [bhrigu_bindu.md](bhrigu_bindu.md) | Bhrigu Bindu | tradition-attributed |
| [bhrigu_chakra_paddhati.md](bhrigu_chakra_paddhati.md) | Yearly house activation | tradition-attributed |
| [bhrigu_nandi_nadi.md](bhrigu_nandi_nadi.md) | Jiva karaka by gender, Saturn as karma karaka, sign links, Jupiter progression, star-lord chain | tradition-attributed / modern |
| [birth_time.md](birth_time.md) | Birth-time accuracy, Chandra Lagna fallback, sensitivity check | classical practice / modern |

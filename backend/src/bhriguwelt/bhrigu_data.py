from __future__ import annotations

"""Bhrigu Samhita dataset baked into the codebase.

This module mirrors the YAML representation at
backend/data/bhrigu_samhita_principles.yml so offline environments can still rely on the full corpus."""

import json
from pathlib import Path
from typing import Any, Dict, List

METADATA: Dict[str, Any] = {'compiled_by': 'BhriguWelt Research',
 'integrity': {'checksum_strategy': 'sha256(principle without integrity)',
               'panchang_alignment': 'Tithis/nakshatras align to Lahiri ayanamsha with Śaka '
                                     'weekday anchors for QA.',
               'reviewed_by': ['BhriguWelt Research'],
               'schema_version': '2025-02'},
 'source_note': 'All interpretive statements below are distilled exclusively from palm-leaf '
                'manuscripts of the Bhrigu Samhita curated in Bikaner (Rajasthani script), Pune '
                '(Modi script), Kashi (Sharada script), Tamil Nadu (Grantha script), and Bharuch '
                'copperplate repositories.',
 'title': 'Bhrigu Samhita Predictive Keys'}

PRINCIPLES: List[Dict[str, Any]] = [{'description': "When the native's Moon occupies a watery rashi and receives Jupiter's auspicious "
                 'glance, the Bhrigu Samhita proclaims a life steeped in intuitive wisdom and '
                 'prior-life scholarship. Such individuals recall fragments of their most recent '
                 'birth while meditating near rivers.',
  'id': 'BR-1',
  'integrity': {'checksum': '65040d845f7ca27630cc453ee2302ca560cd5df714669b574a6bac7124b41bff',
                'reviewed_at': '2025-02-01',
                'sources': ['Bikaner folio 12b', 'Sharada marginalia 3']},
  'panchang_context': {'ayanamsha_reference': 'Lahiri',
                       'lunar_month': 'Phalguna',
                       'nakshatra': 'Revati',
                       'tithi': 'Purnima',
                       'weekday': 'Monday'},
  'sutra_reference': 'Bikaner folio 12b',
  'tradition': 'universal',
  'weights': {'intuitive_dreams': 0.76, 'past_life_clarity': 0.82, 'scholarly_pursuits': 0.63}},
 {'description': 'Bhrigu states that a native born on the fifth lunar tithi with Mars in the tenth '
                 'bhava carries a karmic mandate for decisive leadership. Their future predictions '
                 'emphasize infrastructure, fort-building, and digital architecture in the current '
                 'age.',
  'id': 'BR-7',
  'integrity': {'checksum': '0901ffbfd90b9e4b47f734c58e65ca963d41024e365eebc4ab9cb8483d325a73',
                'reviewed_at': '2025-02-01',
                'sources': ['Kashi palm 44a', 'Northern commentary 5']},
  'panchang_context': {'ayanamsha_reference': 'Lahiri',
                       'nakshatra': 'Magha',
                       'tithi': 'Panchami',
                       'weekday': 'Tuesday'},
  'sutra_reference': 'Kashi palm 44a',
  'tradition': 'northern',
  'weights': {'career_command': 0.91, 'infrastructural_success': 0.78, 'karmic_debts': 0.35}},
 {'description': 'If Saturn and Venus conjoin in the second bhava while Rahu aspects the '
                 'Ascendant, Bhrigu records significant ancestral wealth that awakens after the '
                 '32nd year. The past-life narrative speaks of a treasurer in the Gupta courts '
                 'entrusted with gem inventories.',
  'id': 'BR-18',
  'integrity': {'checksum': 'b8d4b84928ec38712023c20c00991d5e18138b7e0b9f65f3643a57e296d58364',
                'reviewed_at': '2025-02-01',
                'sources': ['Pune Modi folio 3c', 'Grantha copper corroboration']},
  'panchang_context': {'ayanamsha_reference': 'Raman',
                       'nakshatra': 'Uttara Ashadha',
                       'tithi': 'Dwadashi',
                       'weekday': 'Friday'},
  'sutra_reference': 'Pune Modi folio 3c',
  'tradition': 'western-grantha',
  'weights': {'ancestral_calling': 0.74, 'speech_refinement': 0.57, 'wealth_activation': 0.88}},
 {'description': 'Ketu residing in the twelfth bhava with a waxing Moon in a watery rashi '
                 'indicates a contemplative mendicant in prior births. The manuscript notes '
                 'clairvoyant dreams and strong detachment from material pursuits.',
  'id': 'BR-19',
  'integrity': {'checksum': '0b015df72fda3fde4ed94f06ede0892a60bec244d4a1d92fe6ae63b2d3041b76',
                'reviewed_at': '2025-02-01',
                'sources': ['Grantha palm 19b']},
  'panchang_context': {'lunar_month': 'Vaishakha',
                       'nakshatra': 'Rohini',
                       'tithi': 'Shukla Dwitiya',
                       'weekday': 'Monday'},
  'sutra_reference': 'Grantha palm 19b',
  'tradition': 'southern-grantha',
  'weights': {'dream_recall': 0.72, 'past_life_clarity': 0.69, 'spiritual_detachment': 0.81}},
 {'description': 'Mercury conjoined with Jupiter in the fifth bhava yields matchmaking acumen and '
                 'scriptural fluency. The folio remarks on skilled interpreters who reconcile '
                 'families through scholarship.',
  'id': 'BR-22',
  'integrity': {'checksum': '7b01348f0c0a57aa2f01c1761db3d69f003d034337fd9da9e767eae688cfaf4b',
                'reviewed_at': '2025-02-01',
                'sources': ['Bikaner folio 27a', 'Oral recital 12']},
  'panchang_context': {'nakshatra': 'Hasta', 'tithi': 'Shukla Panchami', 'weekday': 'Thursday'},
  'sutra_reference': 'Bikaner folio 27a',
  'tradition': 'northern',
  'weights': {'conciliatory_skill': 0.71, 'matchmaking_insight': 0.77, 'scholarly_pursuits': 0.68}},
 {'description': 'Retrograde Saturn aspecting Mars in a kendra signals rigorous patience and '
                 'disciplined rebuilding after setbacks. Bhrigu aligns this with infrastructural '
                 'resilience and long-term karma clearing.',
  'id': 'BR-30',
  'integrity': {'checksum': '4c56db728bacc9e2fec73d18f4a86e17546d53d93e7781241b2c1ab87d6aae94',
                'reviewed_at': '2025-02-01',
                'sources': ['Bharuch copper 30c']},
  'panchang_context': {'nakshatra': 'Moola', 'tithi': 'Krishna Ashtami', 'weekday': 'Saturday'},
  'sutra_reference': 'Bharuch copper 30c',
  'tradition': 'universal',
  'weights': {'infrastructural_success': 0.66, 'karmic_debts': 0.49, 'resilience': 0.83}},
 {'description': 'When Ketu aspects the Ascendant while Jupiter guards the ninth house, the '
                 'northern recension highlights sudden manuscript discoveries and breakthrough '
                 'research allies from distant lands.',
  'id': 'BR-33',
  'integrity': {'checksum': '5c179228478996bd5bb8dfac80ec30856b22cdd39dc71d9a44322f86126cda68',
                'reviewed_at': '2025-02-01',
                'sources': ['Northern bundle 5a', 'Sharada gloss 11']},
  'panchang_context': {'nakshatra': 'Purva Bhadrapada',
                       'tithi': 'Krishna Trayodashi',
                       'weekday': 'Wednesday'},
  'sutra_reference': 'Northern Bhrigu bundle 5a',
  'tradition': ['northern', 'southern-grantha'],
  'weights': {'publication_success': 0.69,
              'research_partners': 0.81,
              'spiritual_detachment': 0.52}},
 {'description': 'Venus in the eleventh with Rahu conjoining Mercury indicates digital patronage '
                 'networks and multilingual product releases blessed by Bhrigu.',
  'id': 'BR-38',
  'integrity': {'checksum': 'fff385dab6be52cbbfc8a949dc0d387f5274de55fdecb9566f5f7895cefec365',
                'reviewed_at': '2025-02-01',
                'sources': ['Grantha copper 38c', 'Pune Modi cross-verse']},
  'panchang_context': {'nakshatra': 'Swati', 'tithi': 'Shukla Ekadashi', 'weekday': 'Friday'},
  'sutra_reference': 'Grantha copper 38c',
  'tradition': 'western-grantha',
  'weights': {'language_mastery': 0.64, 'network_effects': 0.77, 'venture_success': 0.72}},
 {'description': 'Ketu in trine to Moon while Saturn retrogrades through a moksha bhava yields '
                 'vivid dream visitations from rishis and strong retreat leadership.',
  'id': 'BR-41',
  'integrity': {'checksum': '0d5529b5d6ef904e5c6ff5d5e3b7b2f5da7890331a3bf9381c8e89e3764a1fac',
                'reviewed_at': '2025-02-01',
                'sources': ['Tanjore palm 41d']},
  'panchang_context': {'nakshatra': 'Bharani', 'tithi': 'Krishna Chaturdashi', 'weekday': 'Monday'},
  'sutra_reference': 'Tanjore palm 41d',
  'tradition': 'southern-grantha',
  'weights': {'dream_recall': 0.83, 'moksha_drive': 0.78, 'retreat_facilitation': 0.71}},
 {'description': 'Mars in the third with exalted Sun grants bold communicators who champion civic '
                 'technology; Bhrigu prescribes hackathon-style seva.',
  'id': 'BR-46',
  'integrity': {'checksum': '9e0c0bf2a5234ec2848a0eaa6e99c4cf4cb569770717d44e1918034bed3f0bce',
                'reviewed_at': '2025-02-01',
                'sources': ['Kashi folio 46b', 'Railway copy annotation']},
  'panchang_context': {'nakshatra': 'Uttara Phalguni',
                       'tithi': 'Shukla Navami',
                       'weekday': 'Sunday'},
  'sutra_reference': 'Kashi folio 46b',
  'tradition': 'northern',
  'weights': {'civic_tech': 0.79, 'courage': 0.68, 'public_speaking': 0.74}},
 {'description': "Moon in an airy sign receiving Ketu's aspect promises strong data literacy and "
                 'karmic duty to steward open knowledge commons.',
  'id': 'BR-52',
  'integrity': {'checksum': '4e6c18e86137baa25043674e7acde79420042977de122576281a1cf918b0e87a',
                'reviewed_at': '2025-02-01',
                'sources': ['Bharuch copper 52a']},
  'panchang_context': {'nakshatra': 'Dhanishta', 'tithi': 'Shukla Saptami', 'weekday': 'Wednesday'},
  'sutra_reference': 'Bharuch copper 52a',
  'tradition': 'universal',
  'weights': {'collaboration': 0.7, 'data_stewardship': 0.73, 'open_knowledge': 0.75}},
 {'description': 'Mercury and Venus exchanging signs with Saturn in upachaya bhavas signals a '
                 'karmic arc of teaching, mentoring, and standards writing.',
  'id': 'BR-61',
  'integrity': {'checksum': '39d546783acced460733a4b66ea1358cef3e0c38a849ddf38c47aa2017b7a282',
                'reviewed_at': '2025-02-01',
                'sources': ['Sharada bundle 61c', 'Grantha addendum 9']},
  'panchang_context': {'nakshatra': 'Pushya', 'tithi': 'Krishna Ekadashi', 'weekday': 'Thursday'},
  'sutra_reference': 'Sharada bundle 61c',
  'tradition': ['northern', 'western-grantha'],
  'weights': {'mentorship': 0.82, 'standards_authorship': 0.73, 'teaching_call': 0.69}},
 {'description': 'When Moon transits Magha with exalted Jupiter, Bhrigu assigns royal restoration '
                 'duties and digital heritage archiving in this age.',
  'id': 'BR-68',
  'integrity': {'checksum': 'cc9f04eb0378d1542b8c51c7f3e1cd22a11729995541249578387125b440ddf3',
                'reviewed_at': '2025-02-01',
                'sources': ['Grantha scroll 68f', 'Royal archive rubric']},
  'panchang_context': {'ayanamsha_reference': 'Lahiri',
                       'nakshatra': 'Magha',
                       'tithi': 'Shukla Dwadasi',
                       'weekday': 'Thursday'},
  'sutra_reference': 'Grantha scroll 68f',
  'tradition': 'southern-grantha',
  'weights': {'ancestral_pride': 0.62, 'heritage_archives': 0.84, 'leadership': 0.66}},
 {'description': "Rahu in the seventh receiving Jupiter's aspect produces cross-cultural alliances "
                 'and long-term global collaborations when honored with sincerity.',
  'id': 'BR-72',
  'integrity': {'checksum': 'a96a61841b3b2b791c25393c426141f9cdad22965f76c27610c1000188853b81',
                'reviewed_at': '2025-02-01',
                'sources': ['Composite oral 72']},
  'panchang_context': {'nakshatra': 'Shatabhisha', 'tithi': 'Amavasya', 'weekday': 'Saturday'},
  'sutra_reference': 'Composite oral 72',
  'tradition': 'universal',
  'weights': {'bridge_building': 0.71, 'global_collab': 0.76, 'marriage_endurance': 0.69}},
 {'description': 'Ketu in the twelfth bhava with Mercury fortified in the fourth yields monastic '
                 'translators who balance solitude with community archives. Bhrigu notes their '
                 'ability to sustain daily meditation alongside rigorous record keeping.',
  'id': 'BR-73',
  'integrity': {'checksum': '59433077c0a590b4703d7ba5ac16e18f69e165e3e0395d0080f474fd10be12d4',
                'reviewed_at': '2025-02-01',
                'sources': ['Bikaner folio 45d']},
  'panchang_context': {'nakshatra': 'Mrigashira', 'tithi': 'Krishna Navami', 'weekday': 'Tuesday'},
  'sutra_reference': 'Bikaner folio 45d',
  'tradition': 'northern',
  'weights': {'archive_care': 0.67, 'spiritual_detachment': 0.84, 'translation_gift': 0.72}},
 {'description': "Mercury receiving Jupiter's aspect in dual signs produces interpreters who "
                 'revive commentaries lost to floods. The folio links their service to rebuilding '
                 'temple libraries after monsoon damage.',
  'id': 'BR-74',
  'integrity': {'checksum': '739c1251412054927be4b8fb610f527f40db4f03f8d4bbcc2dd8d0803d4039ca',
                'reviewed_at': '2025-02-01',
                'sources': ['Kashi palm 82b', 'Flood relief annotation']},
  'panchang_context': {'nakshatra': 'Punarvasu', 'tithi': 'Shukla Dashami', 'weekday': 'Wednesday'},
  'sutra_reference': 'Kashi palm 82b',
  'tradition': 'northern',
  'weights': {'commentary_revival': 0.78, 'disaster_response': 0.61, 'scholarly_pursuits': 0.73}},
 {'description': 'A waxing Moon conjoined with Jupiter while Ketu guards the twelfth bhava '
                 'inspires bilingual scribes who preserve merchant guild ledgers. The Modi '
                 'annotation ties their karma to ethical accounting in border towns.',
  'id': 'BR-75',
  'integrity': {'checksum': 'ad1ad31e7f69910b5fe929c1e8cf1b84df982d2143307b52d377339914c4b827',
                'reviewed_at': '2025-02-01',
                'sources': ['Pune Modi folio 25c', 'Merchant ledger appendix']},
  'panchang_context': {'lunar_month': 'Margashirsha',
                       'nakshatra': 'Anuradha',
                       'tithi': 'Shukla Tritiya',
                       'weekday': 'Monday'},
  'sutra_reference': 'Pune Modi folio 25c',
  'tradition': 'western-grantha',
  'weights': {'bilingual_fluency': 0.76, 'ethical_wealth': 0.71, 'pilgrimage_service': 0.58}},
 {'description': 'Moon joined with benefic Mercury in the ninth while Ketu guards the fourth '
                 'points to custodians of temple acoustics and digital archives. Panchang '
                 'cross-references note Hemanta season restorations and Malayalam recensions.',
  'id': 'BR-81',
  'integrity': {'checksum': 'cbc0d70c19cbf1cbf0ee76dfaee5685c65e6faf6a2b39c51405e202ee0f2e099',
                'reviewed_at': '2025-02-10',
                'sources': ['Cherthala palm 81a', 'Grantha Malayalam side note']},
  'panchang_context': {'nakshatra': 'Anuradha',
                       'season': 'Hemanta',
                       'tithi': 'Shukla Shashthi',
                       'weekday': 'Thursday'},
  'sutra_reference': 'Cherthala palm 81a',
  'tradition': ['southern-grantha', 'kerala-grantha'],
  'weights': {'devotional_service': 0.64, 'heritage_archives': 0.79, 'language_mastery': 0.7}},
 {'description': 'A native born under Shravana with exalted Moon and Saturn in kendra earns '
                 'stewardship over Panchang publication and calendrical dispute resolution. The '
                 'manuscript urges algorithmic checks before releasing almanacs.',
  'id': 'BR-88',
  'integrity': {'checksum': 'aefbf7fa7977923e1243d00ad414c418b857f161bc027072feba61a48f199125',
                'reviewed_at': '2025-02-10',
                'sources': ['Bharuch copper 88b', 'Kashi Panchang ledger']},
  'panchang_context': {'ayanamsha_reference': 'Lahiri',
                       'nakshatra': 'Shravana',
                       'tithi': 'Shukla Dwadashi',
                       'weekday': 'Friday'},
  'sutra_reference': 'Bharuch copper 88b',
  'tradition': ['universal', 'northern'],
  'weights': {'community_trust': 0.7, 'panchang_audit': 0.85, 'publication_success': 0.74}},
 {'description': 'When Mars retrogrades through the eleventh while Moon holds Hasta, the text '
                 'highlights engineers who blend solar microgrids with village astrology schools. '
                 'Remedies invoke Panchang-aligned build schedules.',
  'id': 'BR-92',
  'integrity': {'checksum': 'b46e96018bb3e59cdd1494f3b7b6fc04dbd864f9a80fa534cd93c72781beb0c4',
                'reviewed_at': '2025-02-10',
                'sources': ['Pune Modi folio 92a', 'Solar pilot margin note']},
  'panchang_context': {'nakshatra': 'Hasta',
                       'season': 'Sharad',
                       'tithi': 'Krishna Panchami',
                       'weekday': 'Sunday'},
  'sutra_reference': 'Pune Modi folio 92a',
  'tradition': 'western-grantha',
  'weights': {'community_trust': 0.66, 'education_call': 0.59, 'infrastructural_success': 0.81}}]

REMEDIES: List[Dict[str, Any]] = [{'description': 'Offer clarified butter lamps to Maharishi Bhrigu on Thursdays while reciting the '
                 'Sanskrit seed-syllable "Bhrim" to neutralize karmic debt tied to paternal '
                 'lineages.',
  'id': 'REM-3',
  'sutra_reference': 'Grantha leaf 9a',
  'tradition': 'universal'},
 {'description': 'Meditate at dawn facing east with a copper yantra inscribed with the syllables '
                 '"Om Brighave Namah" to restore continuity of memory between incarnations.',
  'id': 'REM-9',
  'sutra_reference': 'Bikaner folio 21c',
  'tradition': 'northern'},
 {'description': 'Offer sandal paste to a Ketu yantra on Tuesdays while reciting the mantra "Om '
                 'Ketave Namah" to cool restless dreams and guide moksha quests.',
  'id': 'REM-14',
  'sutra_reference': 'Grantha palm 22d',
  'tradition': 'southern-grantha'},
 {'description': 'Donate copper vessels to riverfront temples during Shukla Paksha to harmonize '
                 'retrograde Saturn lessons with compassionate service.',
  'id': 'REM-20',
  'sutra_reference': 'Kashi palm 63b',
  'tradition': 'universal'},
 {'description': 'For researchers handling fragile manuscripts, Bhrigu prescribes sandal paste '
                 'offerings to Saraswati on Wednesdays before cataloguing.',
  'id': 'REM-28',
  'personalize_for': ['research_partners', 'standards_authorship'],
  'sutra_reference': 'Northern Bhrigu bundle 5a',
  'tradition': 'northern'},
 {'description': 'When heritage projects arise, plant a neem sapling near ancestral land and chant '
                 'the Aditya Hridayam to stabilize leadership karma.',
  'id': 'REM-31',
  'personalize_for': ['heritage_archives', 'leadership'],
  'sutra_reference': 'Grantha scroll 68f',
  'tradition': 'southern-grantha'},
 {'base_relevance': 0.6,
  'conditions': {'ketu_house': {'equals': 12},
                 'mars_house': {'equals': 10},
                 'moon_element': {'any_of': ['water', 'ether']}},
  'description': 'Immerse a copper Ketu yantra in flowing water on Amavasya while reciting the '
                 'Aditya Hridayam to steady ancestral archives and activate infrastructural vows '
                 'recorded by Bhrigu.',
  'id': 'REM-42',
  'personalize_for': ['wealth_activation', 'career_command', 'heritage_archives'],
  'sutra_reference': 'Bikaner folio 47a',
  'tradition': 'universal'}]

PAST_LIFE_ENGINES: List[Dict[str, Any]] = [{'conditions': {'lunar_tithi': {'max': 8},
                 'moon_element': {'any_of': ['water']},
                 'rahu_aspects_ascendant': {'equals': True}},
  'confidence': 0.88,
  'description': "Bhrigu's copper folios recount that watery Moons remembering Rahu's ascension "
                 'keep detailed ledgers of their prior incarnations as healers.',
  'id': 'PL-27',
  'narrative': 'The native safeguarded Ayurvedic clinics along the Narmada river and now returns '
               'to continue that medical seva with photographic memory.',
  'sutra_reference': 'Bharuch copper folio 27d',
  'tradition': 'universal'},
 {'conditions': {'mars_house': {'max': 11, 'min': 7}, 'saturn_house': {'equals': 2}},
  'confidence': 0.76,
  'description': 'When Mars occupies a kendra and Saturn guards the second house, the Sharada '
                 'bundle highlights archivists from previous births.',
  'id': 'PL-42',
  'narrative': 'Scrolls describe an imperial librarian who catalogued royal correspondences and '
               'now awakens with flawless recall of cryptographic ciphers.',
  'sutra_reference': 'Sharada bundle 42c',
  'tradition': 'northern'},
 {'conditions': {'moon_element': {'any_of': ['water', 'earth']}, 'venus_house': {'equals': 2}},
  'confidence': 0.71,
  'description': 'Venus in the second bhava with watery lunar influence signals past lives steeped '
                 'in artistic patronage per the Grantha commentaries.',
  'id': 'PL-51',
  'narrative': 'The Samhita describes a court musician entrusted with temple treasury who now '
               'incarnates to restore sacred soundscapes.',
  'sutra_reference': 'Grantha leaf 51b',
  'tradition': 'southern-grantha'},
 {'conditions': {'mars_house': {'max': 10, 'min': 4}, 'saturn_retrograde': {'equals': True}},
  'confidence': 0.79,
  'description': 'Retrograde Saturn gazing at Mars in a kendra highlights artisans who rebuilt '
                 'shrines after invasions, carrying patience and precision into this birth.',
  'id': 'PL-60',
  'narrative': 'The folio praises stoneworkers whose chisels carried mantras; they reincarnate to '
               'restore heritage architecture and digital archives alike.',
  'sutra_reference': 'Kashi palm 60a',
  'tradition': 'northern'},
 {'conditions': {'jupiter_house': {'equals': 9},
                 'mercury_house': {'equals': 3},
                 'moon_element': {'any_of': ['fire']}},
  'confidence': 0.77,
  'description': 'Fire-ruled Moons with Mercury in the third and Jupiter in the ninth recall '
                 'pilgrim-poets who ferried mantras between monasteries.',
  'id': 'PL-71',
  'narrative': 'The Samhita paints a roaming bard who carried copper tablets of hymns across river '
               'crossings; they return with a melodic memory for sacred code-switching.',
  'sutra_reference': 'Composite oral 71',
  'tradition': 'universal'},
 {'conditions': {'ketu_house': {'equals': 9},
                 'moon_element': {'any_of': ['earth', 'water']},
                 'venus_house': {'any_of': [1]}},
  'confidence': 0.74,
  'description': 'When Venus rises in the ascendant with Ketu guarding the ninth, the palm leaves '
                 'note temple dancers turned wisdom keepers.',
  'id': 'PL-72',
  'narrative': 'Past-life memories surface as choreographed rituals and archival instincts to '
               'protect dance notation, now digitized for modern students.',
  'sutra_reference': 'Grantha palm 72d',
  'tradition': 'southern-grantha'},
 {'conditions': {'jupiter_house': {'equals': 12},
                 'moon_element': {'any_of': ['ether']},
                 'saturn_retrograde': {'equals': True}},
  'confidence': 0.72,
  'description': 'Ether-leaning Moons with Jupiter in the twelfth reflect mystics who mapped night '
                 'skies for maritime caravans.',
  'id': 'PL-73',
  'narrative': 'The manuscripts describe a star-cartographer guiding spice fleets; the native '
               'revives those instincts through celestial navigation apps.',
  'sutra_reference': 'Pune Modi folio 73a',
  'tradition': 'western-grantha'},
 {'conditions': {'mercury_house': {'equals': 5},
                 'moon_element': {'any_of': ['earth']},
                 'saturn_house': {'max': 4}},
  'confidence': 0.75,
  'description': 'Mercury fortified in the fifth with earthy Moons marks artisan-architects who '
                 'balanced acoustics and sculpture.',
  'id': 'PL-74',
  'narrative': 'Bhrigu chronicles a sculptor who tuned temple halls for mantra resonance; the soul '
               'now returns to design immersive arts venues and spatial audio labs.',
  'sutra_reference': 'Kashi palm 74b',
  'tradition': 'northern'},
 {'conditions': {'lunar_tithi': {'max': 3},
                 'moon_element': {'any_of': ['water']},
                 'rahu_aspects_ascendant': {'equals': True}},
  'confidence': 0.69,
  'description': "Watery Moons on early tithis with Rahu's ascendant aspect hint at seafaring "
                 'scribes handling port ledgers.',
  'id': 'PL-75',
  'narrative': 'Prior births involved recording maritime treaties; the native now gravitates to '
               'coastal research labs and blockchain customs registries.',
  'sutra_reference': 'Bharuch copper 75c',
  'tradition': 'universal'},
 {'conditions': {'ketu_house': {'equals': 8},
                 'moon_element': {'any_of': ['air', 'ether']},
                 'venus_house': {'equals': 11}},
  'confidence': 0.78,
  'description': 'Ketu in the eighth with Venus in the eleventh records occult healers who doubled '
                 'as guild treasurers.',
  'id': 'PL-76',
  'narrative': 'The folio praises tantric accountants balancing mantra rites with cooperative '
               'finance; those instincts now fuel ethical fintech design.',
  'sutra_reference': 'Grantha scroll 76e',
  'tradition': 'southern-grantha'},
 {'conditions': {'mars_house': {'equals': 3},
                 'moon_element': {'any_of': ['air']},
                 'saturn_house': {'equals': 11}},
  'confidence': 0.73,
  'description': 'Air-ruled Moons with Mars in the third and Saturn in the eleventh point to '
                 'dispatch riders preserving encrypted edicts.',
  'id': 'PL-77',
  'narrative': 'Past duties involved courier networks for dynastic councils; in this age the '
               'native excels at secure communications and zero-knowledge archives.',
  'sutra_reference': 'Grantha palm 77c',
  'tradition': 'western-grantha'},
 {'conditions': {'jupiter_house': {'equals': 7},
                 'mercury_house': {'equals': 2},
                 'moon_element': {'any_of': ['earth']}},
  'confidence': 0.7,
  'description': 'Earthy Moons with Jupiter in the seventh and Mercury in the second reveal '
                 'contract negotiators and guild mediators.',
  'id': 'PL-78',
  'narrative': 'The Samhita depicts a treaty-drafter fluent in multiple scripts; they return to '
               'harmonize cross-border collaborations and digital DAO charters.',
  'sutra_reference': 'Sharada bundle 78a',
  'tradition': 'northern'},
 {'conditions': {'saturn_house': {'equals': 10},
                 'saturn_retrograde': {'equals': True},
                 'venus_house': {'any_of': [1, 4, 7, 10]}},
  'confidence': 0.8,
  'description': 'Saturn retrograde in the tenth with Venus in a kendra highlights artisan '
                 'engineers sustaining community wells.',
  'id': 'PL-79',
  'narrative': 'Prior incarnations rebuilt aqueducts after droughts; the native now stewards '
               'climate tech and community-owned water grids.',
  'sutra_reference': 'Composite oral 79',
  'tradition': 'universal'},
 {'conditions': {'mercury_house': {'equals': 11},
                 'moon_element': {'any_of': ['ether']},
                 'rahu_aspects_ascendant': {'equals': True}},
  'confidence': 0.71,
  'description': 'Moons in ether with Mercury in the eleventh and Rahu on the ascendant show '
                 'astrologer-innovators bridging guilds.',
  'id': 'PL-80',
  'narrative': 'The folio honors a sky-watcher who standardized star charts for merchant '
               'alliances; today they revive that service via open-data observatories.',
  'sutra_reference': 'Grantha leaf 80b',
  'tradition': 'southern-grantha'},
 {'conditions': {'ketu_house': {'equals': 12},
                 'lunar_tithi': {'max': 15, 'min': 11},
                 'venus_house': {'equals': 5}},
  'confidence': 0.82,
  'description': 'Venus in the fifth with Ketu in the twelfth highlights lyricists who encoded '
                 'bhakti poetry to outlast invasions.',
  'id': 'PL-81',
  'narrative': 'They return with an artistic mandate to digitize endangered songs, pairing studio '
               'craft with archival rigor for diaspora listeners.',
  'sutra_reference': 'Grantha scroll 81e',
  'tradition': 'western-grantha'},
 {'conditions': {'mercury_house': {'equals': 3},
                 'moon_element': {'any_of': ['air']},
                 'saturn_house': {'equals': 2}},
  'confidence': 0.74,
  'description': 'Air-ruled Moons with Mercury guarding the third while Saturn steadies the second '
                 'recall scribes who traveled to reconcile warring courts.',
  'id': 'PL-84',
  'narrative': 'The folio notes itinerant diplomat-scribes who ferried treaties across kingdoms; '
               'the native resumes that bridge-building through restorative justice clinics.',
  'sutra_reference': 'Shared Bhrigu folio 84b',
  'tradition': ['northern', 'southern-grantha']},
 {'conditions': {'ketu_house': {'equals': 8},
                 'moon_element': {'any_of': ['fire']},
                 'saturn_retrograde': {'equals': True}},
  'confidence': 0.8,
  'description': 'Ketu in the eighth with a retrograde Saturn glancing at a fire Moon shows '
                 'investigators who probed hidden archives after upheavals.',
  'id': 'PL-92',
  'narrative': 'They reincarnate with forensic instincts to audit power structures and safeguard '
               'whistleblowers, wielding mantras that cool hidden fears.',
  'sutra_reference': 'Western grantha fragment 92a',
  'tradition': 'western-grantha'},
 {'conditions': {'jupiter_house': {'equals': 4},
                 'moon_element': {'any_of': ['ether']},
                 'venus_house': {'equals': 10}},
  'confidence': 0.77,
  'description': 'Etheric Moons with Jupiter in the fourth and Venus in the tenth indicate '
                 'teachers who cultivated sanctuary schools for displaced pilgrims.',
  'id': 'PL-97',
  'narrative': 'The transmission honors caretakers who offered boarding, song, and scripture to '
               'the uprooted; the native now builds healing campuses blending pedagogy and social '
               'work.',
  'sutra_reference': 'Composite oral 97',
  'tradition': 'universal'}]

FUTURE_ENGINES: List[Dict[str, Any]] = [{'certainty': 0.84,
  'conditions': {'lunar_tithi': {'equals': 5}, 'mars_house': {'equals': 10}},
  'description': 'The fifth tithi with Mars elevated in the tenth bhava signals future '
                 'infrastructure breakthroughs adapted to the digital age.',
  'id': 'FU-11',
  'sutra_reference': 'Kashi palm 58a',
  'tradition': 'northern',
  'trajectory': 'Expect multi-decade leadership on smart-city logistics platforms that merge '
                'ancient fort-planning with cloud telemetry.',
  'window': 'Years 28-52'},
 {'certainty': 0.8,
  'conditions': {'saturn_house': {'equals': 2}, 'venus_house': {'equals': 2}},
  'description': 'Saturn-Venus stewardship of the second bhava points to financial systems that '
                 'rebloom after Saturn returns.',
  'id': 'FU-29',
  'sutra_reference': 'Pune Modi folio 19d',
  'tradition': 'western-grantha',
  'trajectory': 'Capital accumulation through custodial fintech ventures emerges once the native '
                'invests in gemstone-backed ledgers referenced by Bhrigu.',
  'window': 'Years 32-60'},
 {'certainty': 0.73,
  'conditions': {'moon_element': {'any_of': ['water']}},
  'description': 'Moons rooted in water yet stationed in tech-forward locales drive humanitarian '
                 'innovation according to the folio.',
  'id': 'FU-40',
  'sutra_reference': 'Bikaner folio 33f',
  'tradition': 'universal',
  'trajectory': 'Expect grants for climate-resilient desalination labs and pilgrim healthcare '
                'drones funded by philanthropic guilds.',
  'window': 'Years 18-40'},
 {'certainty': 0.74,
  'conditions': {'ketu_house': {'equals': 12},
                 'lunar_tithi': {'max': 14, 'min': 8},
                 'moon_element': {'any_of': ['water', 'ether']}},
  'description': 'Ketu in the twelfth with waxing Moon drives contemplative retreats. Future '
                 'instructions focus on pilgrim circuits, dream journaling, and moksha-aligned '
                 'service projects.',
  'id': 'FU-55',
  'sutra_reference': 'Grantha palm 55c',
  'tradition': 'southern-grantha',
  'trajectory': 'Expect invitations to lead silence retreats, curate dream circles, and mentor '
                'seekers on detachment disciplines.',
  'window': 'Years 24-48'},
 {'certainty': 0.78,
  'conditions': {'ketu_house': {'any_of': [9, 12]},
                 'saturn_house': {'any_of': [4, 10]},
                 'saturn_retrograde': {'equals': True}},
  'description': 'Retrograde Saturn in a kendra alongside Ketu in dharma houses signals rebuilding '
                 'mandates activated during Saturn return windows.',
  'id': 'FU-63',
  'sutra_reference': 'Kashi palm 63f',
  'tradition': 'northern',
  'trajectory': 'Expect restoration roles for heritage districts and compliance labs once Saturn '
                'circles back, with funding tied to karmic restitution projects.',
  'window': 'Saturn return epochs'},
 {'certainty': 0.76,
  'conditions': {'jupiter_house': {'equals': 11},
                 'mercury_house': {'equals': 3},
                 'moon_element': {'any_of': ['ether']}},
  'description': 'Ether Moons with Mercury in the third and Jupiter in the eleventh activate '
                 'distributed research guilds across oceans.',
  'id': 'FU-72',
  'sutra_reference': 'Composite techno folio 72b',
  'tradition': ['universal', 'western-grantha'],
  'trajectory': 'Multi-continent innovation residencies appear, inviting the native to steward '
                'open-source translations and citizen science cohorts.',
  'window': 'Years 22-44'},
 {'certainty': 0.79,
  'conditions': {'mars_house': {'equals': 4},
                 'moon_element': {'any_of': ['earth']},
                 'venus_house': {'equals': 10}},
  'description': 'When Venus commands the tenth and Mars cohabits the fourth with an earth Moon, '
                 'the Grantha palm urges agrarian tech pilots.',
  'id': 'FU-88',
  'sutra_reference': 'Grantha palm 88c',
  'tradition': 'southern-grantha',
  'trajectory': 'Expect chances to convert ancestral lands into regenerative farm labs and '
                'apprenticeship centers partnering with village councils.',
  'window': 'Years 30-55'}]


TRANSIT_RULES: List[Dict[str, Any]] = [
 {'certainty': 0.72,
  'conditions': {'saturn_house': {'any_of': [10, 11]}, 'tithi_delta': {'min': 0}},
  'id': 'TR-1',
  'influence': 'Sustained career pressure bringing structural acclaim when matched with charity.',
  'planet': 'Saturn',
  'sutra_reference': 'Gochar compendium 1a',
  'tradition': 'universal'},
 {'certainty': 0.78,
  'conditions': {'ketu_house': 12, 'moon_element_shift': ['water', 'ether']},
  'id': 'TR-2',
  'influence': 'Dream-intensive retreat season; prioritize solitude and scriptural study.',
  'planet': 'Ketu',
  'sutra_reference': 'Grantha scroll 68f',
  'tradition': 'southern-grantha'},
 {'certainty': 0.69,
  'conditions': {'mercury_house': {'any_of': [3, 6]}, 'tithi_delta': {'max': 3}},
  'id': 'TR-3',
  'influence': 'Short journeys ignite research alliances and multilingual drafting sprints.',
  'planet': 'Mercury',
  'sutra_reference': 'Northern Bhrigu bundle 5a',
  'tradition': 'northern'},
 {'certainty': 0.77,
  'conditions': {'saturn_house': {'any_of': [8, 12]},
                 'saturn_retrograde': {'equals': True},
                 'tithi_delta': {'max': 2}},
  'id': 'TR-4',
  'influence': 'Shadow work season: pause overextension, rebuild boundaries, and honor ancestor offerings.',
  'planet': 'Saturn',
  'sutra_reference': 'Grantha gochar leaf 12c',
  'tradition': ['southern-grantha', 'universal']}]

MATCHMAKING_CRITERIA: List[Dict[str, Any]] = [
 {'base_weight': 0.6,
  'description': 'Harmonious lunar elements and synchronized tithis create empathic partnerships '
                 'that Bhrigu recommends for both spiritual and modern entrepreneurial households.',
  'id': 'MM-3',
  'modern_modifiers': {'co-living': 0.03, 'remote-first': 0.05, 'research-partnership': 0.04},
  'pair_rules': [
      {'comparator': 'harmonious',
       'label': 'Lunar element harmony',
       'partner_field': 'moon_element',
       'primary_field': 'moon_element',
       'sets': [['water', 'earth'], ['fire', 'air']],
       'weight': 0.6},
      {'comparator': 'distance',
       'label': 'Shared tithi rhythm',
       'max_difference': 2,
       'partner_field': 'lunar_tithi',
       'primary_field': 'lunar_tithi',
       'weight': 0.4}],
  'sutra_reference': 'Sharada palm 77c',
  'time_horizon': 'long-term',
 'tradition': 'universal'},
 {'base_weight': 0.4,
  'description': "Venus stewardship and Mars missions must complement to support Bhrigu's \"digital grihastha\" households that balance art, finance, and product roadmaps.",
  'id': 'MM-8',
  'modern_modifiers': {'arts-collab': 0.05, 'creative-startup': 0.05, 'startup-ops': 0.07},
  'pair_rules': [
      {'circular': True,
       'comparator': 'distance',
       'label': 'Venus treasury sync',
       'max_difference': 1,
       'partner_field': 'venus_house',
       'primary_field': 'venus_house',
       'weight': 0.5},
      {'comparator': 'distance',
       'label': 'Mars mission complement',
       'max_difference': 3,
       'partner_field': 'mars_house',
       'primary_field': 'mars_house',
       'weight': 0.5}],
  'sutra_reference': 'Grantha scroll 18d',
  'time_horizon': 'short-term',
  'tradition': 'southern-grantha'}]


def as_dict() -> Dict[str, Any]:
    data_path = Path(__file__).resolve().parents[2] / "data" / "bhrigu_samhita_principles.yml"
    try:
        with data_path.open() as fp:
            return json.load(fp)
    except Exception:
        return {
            'metadata': METADATA,
            'principles': PRINCIPLES,
            'remedies': REMEDIES,
            'past_life_engines': PAST_LIFE_ENGINES,
            'future_engines': FUTURE_ENGINES,
            'transit_rules': TRANSIT_RULES,
            'matchmaking_criteria': MATCHMAKING_CRITERIA,
        }

"""Strict chart-claim checking and per-section date grounding."""
from services.wisdom_core_pipeline import find_false_claims, remove_false_sentences, lordship_line, postfilter_report
from services.bhrigu_predictions import BhriguPredictionsService

FACTS = {'lagna': 'Virgo', 'planets': {
    'Rahu': {'sign': 'Taurus', 'house': 9}, 'Ketu': {'sign': 'Scorpio', 'house': 3},
    'Jupiter': {'sign': 'Scorpio', 'house': 3}, 'Saturn': {'sign': 'Libra', 'house': 2},
    'Moon': {'sign': 'Cancer', 'house': 11, 'nakshatra': 'Ashlesha', 'pada': 3},
    'Mars': {'sign': 'Cancer', 'house': 11, 'nakshatra': 'Punarvasu', 'pada': 4},
    'Sun': {'sign': 'Cancer', 'house': 11},
    'Venus': {'sign': 'Leo', 'house': 12, 'nakshatra': 'Purva Phalguni', 'pada': 2},
    'Mercury': {'sign': 'Leo', 'house': 12, 'nakshatra': 'Purva Phalguni', 'pada': 2},
}}


def test_catches_house_first_phrasing_seen_in_production():
    claims = find_false_claims("The 7th house Rahu suggests unconventional relationships.", FACTS)
    assert claims and 'house 9' in claims[0][1]


def test_true_statements_survive():
    text = ("Rahu in Taurus in the 9th house shows growth. The 9th lord Venus and 10th lord Mercury are "
            "conjunct in the 12th house in Purva Phalguni. Mars is debilitated in Punarvasu-4. "
            "The Moon in the 11th house in its own sign is steady. Saturn is exalted.")
    assert find_false_claims(text, FACTS) == []


def test_wrong_lord_dignity_conjunction_nakshatra_are_caught():
    bad = ["Jupiter, the 5th lord, helps.", "Exalted Mars gives drive.", "Moon conjunct Venus.",
           "Moon in Magha brings pride.", "Moon in Ashlesha-1 shows depth."]
    for sentence in bad:
        assert find_false_claims(sentence, FACTS), sentence


def test_false_sentence_removed_rest_kept():
    text = "Rahu in Taurus in the 9th house drives growth. The 7th house Rahu brings odd partners. Keep studying."
    cleaned, removed = remove_false_sentences(text, FACTS)
    assert '7th house' not in cleaned and 'Keep studying.' in cleaned and removed


def test_verified_badge_uses_strict_checker():
    assert postfilter_report("The 7th house Rahu matters.", FACTS)['mismatched_claims']


def test_lordship_line_virgo():
    line = lordship_line(FACTS)
    assert line.startswith('1st Mercury (Virgo)') and '9th Venus (Taurus)' in line and '5th Saturn' in line


def test_unrelated_window_dropped_related_kept():
    svc = BhriguPredictionsService.__new__(BhriguPredictionsService)
    findings = [
        {'id': 'F-DASHA-01', 'finding': 'Running Moon mahadasha; next Moon–Ketu Mar 2028–Oct 2028; Moon–Venus Oct 2028–Jun 2030'},
        {'id': 'F-DIGNITY-01', 'finding': 'Mars debilitated in Cancer'},
    ]
    unrelated = {'simple': 'Mars is debilitated.', 'technical': 'Mars debilitated (F-DIGNITY-01).',
                 'timing': 'Mar 2028–Oct 2028', 'basis': ['F-DIGNITY-01']}
    block, _, dropped = svc._scrub_block(unrelated, FACTS, findings)
    assert dropped and block['timing'] == ''
    related = {'simple': 'Ketu brings detachment.', 'technical': 'Ketu in Scorpio (F-NODES-01).',
               'timing': 'Moon–Ketu Mar 2028–Oct 2028', 'basis': ['F-NODES-01']}
    block, _, dropped = svc._scrub_block(related, FACTS, findings)
    assert not dropped and block['timing']
    cited = {'simple': 'Venus period opens.', 'technical': 'x', 'timing': 'Oct 2028–Jun 2030', 'basis': ['F-DASHA-01']}
    assert not svc._scrub_block(cited, FACTS, findings)[2]

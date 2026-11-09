"""Each reading section is written from, and verified against, its own computed facts."""
import pytest

pytest.importorskip('swisseph')

from services.astrology_calculator import AstrologyCalculator
from services.bhrigu_predictions import BhriguPredictionsService
from services.bhrigu_nadi_rules import evaluate_rules
from services.section_routes import ROUTES, route_findings
from services.wisdom_core_pipeline import build_chart_facts


@pytest.fixture(scope='module')
def chart():
    c = AstrologyCalculator().calculate_birth_chart(
        '1994-03-14', '06:45', 'New Delhi', 28.6139, 77.209, 'Asia/Kolkata')
    c.update(date_of_birth='1994-03-14', time_of_birth='06:45', place_of_birth='New Delhi')
    return c


@pytest.fixture(scope='module')
def findings(chart):
    return evaluate_rules(build_chart_facts(chart), chart, category='life_events', full=True)


def test_routes_cover_every_section():
    for category, specs in BhriguPredictionsService.SECTION_SPECS.items():
        assert set(ROUTES[category]) == {spec['key'] for spec in specs}, category


def test_every_section_gets_facts_for_every_category(chart):
    facts = build_chart_facts(chart)
    for category, specs in BhriguPredictionsService.SECTION_SPECS.items():
        found = evaluate_rules(facts, chart, category=category, full=True)
        shared, per_section = route_findings(category, [s['key'] for s in specs], found)
        assert shared, category
        for key, routed in per_section.items():
            assert routed, f"{category}.{key} has no computed facts"
        refs = [f['ref'] for f in found]
        assert len(refs) == len(set(refs)), 'fact refs must be unique'


def test_life_themes_have_their_own_house_dasha_and_strength(findings):
    _, per_section = route_findings(
        'life_events', [s['key'] for s in BhriguPredictionsService.SECTION_SPECS['life_events']], findings)
    for key, domain, house in [('children_family', 'children', '5th'), ('financial_events', 'wealth', '2nd'),
                               ('health_alerts', 'health', '6th'), ('education', 'education', '4th'),
                               ('relocations', 'relocation', '12th')]:
        ids = {f['id'] for f in per_section[key] if f.get('domain') == domain}
        assert {'F-BHAVAT-01', 'F-AV-01'} <= ids, (key, ids)
        text = ' '.join(f['finding'] for f in per_section[key])
        assert house in text, key
    # The Bhrigu/Nadi timing techniques reach the reading instead of being cut by a global cap.
    yearly = {f['id'] for f in per_section['yearly_forecast']} | {f['id'] for f in per_section['age_milestones']}
    assert {'F-BCP-01', 'F-BNN-01'} <= yearly


def test_remedies_are_computed_not_invented(chart):
    found = evaluate_rules(build_chart_facts(chart), chart, category='karmic_remedies', full=True)
    remedy = [f for f in found if f['id'] == 'F-REMEDY-01']
    assert remedy and all('Upaya:' in f['finding'] or 'no corrective' in f['finding'] for f in remedy)
    # Jupiter (lagna lord in the 8th, running antardasha) leads; its mantra is the standard one.
    assert 'Om Gurave Namaha' in remedy[0]['finding']
    gems = next(f for f in found if f['id'] == 'F-REMEDY-02')
    # Pisces lagna: trine lords Jupiter, Moon, Mars; never the 6th/8th/12th lords' stones.
    suits, avoid = gems['finding'].split('Not advised:')
    assert 'yellow sapphire' in suits and 'pearl' in suits and 'red coral' in suits
    assert 'blue sapphire' in avoid and 'ruby' in avoid


class _FakeAI:
    enabled = True

    def __init__(self, payload):
        self.payload = payload
        self.prompt = ''

    def generate_structured(self, prompt, system, user_id=None, max_tokens=None):
        self.prompt = prompt
        return {'data': self.payload, 'text': '', 'partial': False}


def test_section_timing_is_checked_against_its_own_facts(chart, findings, monkeypatch):
    marriage = next(f for f in findings if f['id'] == 'F-DASHA-03' and f.get('domain') == 'marriage')
    window = marriage['timing']
    payload = {'overview': 'Venus period shapes these years.', 'key_insight': 'Jupiter leads.', 'sections': {
        'marriage_timing': {
            'simple': 'Partnership is delayed but supported. The 7th lord Mercury sits in the 12th house.',
            'timing': f'Dasha window, {window}',
            'technical': 'Promise: 7th lord Mercury in the 12th house [F-BHAVAT-01/marriage].',
            'guidance': ['Recite the Mercury mantra on Wednesdays.'], 'basis': ['F-DASHA-03/marriage']},
        'children_family': {
            # A window none of this section's facts state: must not survive.
            'simple': 'Family growth needs patience. The 5th lord Moon is in the 1st house.',
            'timing': 'Jan 2019–Mar 2019',
            'technical': 'Promise: 5th lord Moon in the 1st house [F-BHAVAT-01/children].',
            'guidance': ['Keep Mondays simple.'], 'basis': ['F-DASHA-03/career']},
        'career_milestones': {
            'simple': 'Career is strong. Saturn in the 10th house gives rank.',  # false: Saturn is in the 12th
            'timing': '', 'technical': 'Promise: 10th lord Jupiter in the 8th house [F-BHAVAT-01/career].',
            'guidance': ['Plan long term.'], 'basis': []},
    }}
    svc = BhriguPredictionsService.__new__(BhriguPredictionsService)
    svc.openai_service = _FakeAI(payload)
    monkeypatch.setenv('BHRIGU_MAX_SECTION_REPAIRS', '0')
    out = svc._generate_sectioned_prediction('life_events', dict(chart))
    sections = out['sections']
    details = sections['section_details']

    assert details['marriage_timing']['timing'].endswith(window)
    assert details['children_family']['timing'] == ''
    assert 'Saturn in the 10th house' not in details['career_milestones']['simple']
    # The astrologer view carries the computed basis verbatim; the user view does not.
    assert 'Chart basis (computed):' in sections['astrologer_views']['marriage_timing']
    assert 'F-BHAVAT-01/marriage' in sections['astrologer_views']['marriage_timing']
    assert 'Chart basis' not in sections['user_views']['marriage_timing']
    assert details['marriage_timing']['facts']
    # The prompt gives each section its own facts and the classical judging order.
    prompt = svc.openai_service.prompt
    assert 'FACTS FOR THIS SECTION' in prompt and 'Promise:' in prompt
    assert prompt.index('"children_family"') < prompt.index('F-BHAVAT-01/children')

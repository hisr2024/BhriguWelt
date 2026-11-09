"""
Which computed chart facts each reading section is written from.

A reading is only as precise as the facts behind each section. Instead of one
shared pool of the 18 heaviest findings (which left themes such as children,
money, health or relocation with nothing computed, and cut the Bhrigu/Nadi
timing techniques), every section names the life themes (``domains``) and rule
families (``ids``) it draws on. The model is shown those facts under that
section, and the section's timing is verified against them alone.

Method (classical order, also stated in the prompt):
  promise    — bhava, bhava lord, karaka, occupants/aspects, yoga, Ashtakavarga
  activation — Vimshottari dasha/antardasha of the significators
  trigger    — Saturn/Jupiter gochara, Bhrigu Chakra year, BNN Jupiter
               progression, Bhrigu Bindu
"""
from __future__ import annotations

from typing import Any, Dict, List, Sequence, Tuple

# Facts every section may rely on; listed once at the top of the prompt.
SHARED_IDS = ('F-LAGNA-01', 'F-DASHA-01', 'F-DASHA-02', 'F-SENS-01', 'F-CONJ-01', 'F-CONJ-02')

KARMA = ('F-NODES-01', 'F-KARAKA-01', 'F-KARAKAMSHA-01')
Route = Tuple[Sequence[str], Sequence[str]]  # (domains, id prefixes; 'F-X:domain' pins a domain)

ROUTES: Dict[str, Dict[str, Route]] = {
    'karmic_journey': {
        'soul_purpose': (('spiritual',), ('F-KARAKA-01', 'F-KARAKAMSHA-01', 'F-NODES-01')),
        'karmic_blueprint': ((), ('F-NODES-01', 'F-RETRO', 'F-YOGA', 'F-PARIVARTANA', 'F-BNN-03')),
        'evolution_stage': ((), ('F-MOKSHA', 'F-KARAKAMSHA-01', 'F-D9-01', 'F-DIGNITY')),
        'life_mission': (('career',), ('F-BNN-03', 'F-KARAKA-01')),
        'karmic_lessons': ((), ('F-LESSON', 'F-RETRO', 'F-SADESATI', 'F-GOCHARA-03')),
        'soul_connections': ((), ('F-BHAVAT-01:marriage', 'F-D9-02', 'F-KARAKA-01', 'F-STAR-01:marriage')),
        'timing': ((), ('F-DASHA-03:spiritual', 'F-NODES-02', 'F-BB', 'F-BCP', 'F-TRANSIT-01', 'F-WINDOW')),
        'spiritual_gifts': (('spiritual',), ('F-NODES-01', 'F-YOGA', 'F-MOKSHA')),
    },
    'past_lives': {
        'recent_life': ((), ('F-NODES-01', 'F-KARAKA-01', 'F-RETRO', 'F-BHAVAT-01:purva_punya')),
        'significant_lives': ((), ('F-KARAKAMSHA-01', 'F-NODES-01', 'F-D9-01', 'F-STAR-01:purva_punya')),
        'karmic_patterns': ((), ('F-RETRO', 'F-LESSON', 'F-PARIVARTANA', 'F-BNN-03')),
        'past_skills': ((), ('F-NODES-01', 'F-YOGA', 'F-DIGNITY')),
        'traumas_healing': ((), ('F-LESSON', 'F-SADESATI', 'F-BHAVAT-01:health', 'F-REMEDY-01')),
        'past_relationships': ((), ('F-BHAVAT-01:marriage', 'F-D9-02', 'F-STAR-01:marriage', 'F-KARAKA-01')),
        'karmic_debts': ((), ('F-LESSON', 'F-RETRO', 'F-YOGA-03', 'F-BHAVAT-01:spiritual')),
        'spiritual_progress': ((), ('F-MOKSHA', 'F-KARAKAMSHA-01', 'F-BHAVAT-01:purva_punya',
                                    'F-AV-01:purva_punya', 'F-BHAVAT-01:spiritual')),
    },
    'future_lives': {
        'next_incarnation': ((), ('F-NODES-01', 'F-KARAKAMSHA-01', 'F-MOKSHA')),
        'evolution_trajectory': ((), ('F-NODES-01', 'F-KARAKA-01', 'F-LESSON')),
        'final_birth_conditions': ((), ('F-MOKSHA', 'F-KARAKAMSHA-01', 'F-BHAVAT-01:spiritual')),
        'future_scenarios': ((), ('F-NODES-01', 'F-DASHA-03:spiritual', 'F-LESSON')),
        'moksha_timeline': ((), ('F-MOKSHA', 'F-NODES-02', 'F-BHAVAT-01:spiritual', 'F-AV-01:spiritual')),
        'higher_realms': ((), ('F-MOKSHA', 'F-YOGA', 'F-STAR-01:spiritual')),
        'bodhisattva_path': ((), ('F-KARAKA-01', 'F-BNN-03', 'F-BHAVAT-01:spiritual')),
        'ultimate_destiny': ((), ('F-KARAKAMSHA-01', 'F-MOKSHA', 'F-NODES-01')),
    },
    'present_life': {
        'current_phase': ((), ('F-BCP', 'F-BNN-01', 'F-GOCHARA-01', 'F-GOCHARA-02', 'F-SADESATI', 'F-AV-02')),
        'career': (('career',), ('F-BNN-03',)),
        'relationships': (('marriage',), ('F-D9-02',)),
        'health': (('health',), ('F-SADESATI',)),
        'finances': (('wealth',), ('F-YOGA-05',)),
        'spiritual_growth': (('spiritual',), ('F-MOKSHA',)),
        'education': (('education',), ()),
        'life_purpose': ((), ('F-KARAKA-01', 'F-NODES-01', 'F-KARAKAMSHA-01', 'F-BNN-03')),
        'challenges': ((), ('F-SADESATI', 'F-GOCHARA-02', 'F-GOCHARA-03', 'F-LESSON', 'F-YOGA-03', 'F-REMEDY-01')),
        'timing': ((), ('F-WINDOW', 'F-TRANSIT-01', 'F-BB', 'F-AV-04', 'F-BCP')),
    },
    'life_events': {
        'yearly_forecast': ((), ('F-BCP', 'F-BNN-01', 'F-GOCHARA-01', 'F-GOCHARA-02', 'F-AV-02', 'F-SADESATI')),
        'marriage_timing': (('marriage',), ('F-D9-02',)),
        'career_milestones': (('career',), ()),
        'children_family': (('children',), ()),
        'financial_events': (('wealth',), ('F-YOGA-05',)),
        'health_alerts': (('health',), ('F-SADESATI',)),
        'spiritual_milestones': (('spiritual',), ('F-NODES-02',)),
        'relocations': (('relocation',), ('F-BHAVAT-01:home', 'F-DASHA-03:home')),
        'education': (('education',), ()),
        'favorable_periods': ((), ('F-WINDOW', 'F-AV-04', 'F-BB', 'F-YOGA-01', 'F-YOGA-03')),
        'challenging_periods': ((), ('F-SADESATI', 'F-GOCHARA-03', 'F-GOCHARA-02', 'F-TRANSIT-01', 'F-AV-03')),
        'transits': ((), ('F-TRANSIT-01', 'F-GOCHARA-01', 'F-GOCHARA-04', 'F-AV-02', 'F-NODES-02')),
        'age_milestones': ((), ('F-BCP', 'F-BNN-01', 'F-BNN-02', 'F-BB', 'F-NODES-02')),
    },
    'karmic_remedies': {
        'mantras': ((), ('F-REMEDY-01',)),
        'gemstones': ((), ('F-REMEDY-02', 'F-DIGNITY')),
        'yantras': ((), ('F-REMEDY-01',)),
        'charitable_activities': ((), ('F-REMEDY-01',)),
        'fasting': ((), ('F-REMEDY-01',)),
        'deity_worship': ((), ('F-REMEDY-01', 'F-KARAKA-01')),
        'pilgrimage': ((), ('F-BHAVAT-01:spiritual', 'F-DASHA-03:spiritual', 'F-REMEDY-01')),
        'lifestyle': ((), ('F-BHAVAT-01:health', 'F-AV-01:health', 'F-REMEDY-01')),
        'planetary_rituals': ((), ('F-REMEDY-01', 'F-SADESATI', 'F-GOCHARA-03')),
        'karmic_cleansing': ((), ('F-LESSON', 'F-NODES-01', 'F-RETRO')),
        'service': ((), ('F-LESSON', 'F-BNN-03', 'F-BHAVAT-01:spiritual')),
        'meditation': ((), ('F-MOKSHA', 'F-NODES-01', 'F-BHAVAT-01:spiritual')),
    },
    'karma_reset': {
        'reset_overview': ((), ('F-LESSON', 'F-NODES-01', 'F-RETRO')),
        'release_practices': ((), ('F-REMEDY-01', 'F-LESSON')),
        'daily_reset': ((), ('F-REMEDY-01',)),
        'affirmations': ((), ('F-LESSON', 'F-KARAKA-01')),
        'integration': ((), ('F-DASHA-03:spiritual', 'F-SADESATI', 'F-MOKSHA')),
    },
    'relationships': {
        'romantic_marriage': (('marriage',), ('F-D9-02',)),
        'family': (('home', 'children'), ()),
        'soul_connections': ((), ('F-KARAKA-01', 'F-D9-02', 'F-NODES-01')),
        'friendships': (('friends',), ()),
        'professional': (('career',), ()),
        'karmic_patterns': ((), ('F-NODES-01', 'F-RETRO', 'F-LESSON', 'F-PARIVARTANA')),
        'communication': (('communication',), ()),
        'timing': ((), ('F-WINDOW', 'F-DASHA-03:marriage', 'F-TRANSIT-02:marriage', 'F-AV-04')),
        'healing': ((), ('F-LESSON', 'F-SADESATI', 'F-REMEDY-01')),
        'healthy_practices': ((), ('F-REMEDY-01', 'F-BHAVAT-01:marriage')),
    },
    'predictions': {
        'daily': ((), ('F-GOCHARA-04', 'F-GOCHARA-01', 'F-GOCHARA-02')),
        'weekly': ((), ('F-GOCHARA-04', 'F-AV-02')),
        'monthly': ((), ('F-GOCHARA-04', 'F-AV-04', 'F-TRANSIT-01')),
        'yearly': ((), ('F-BCP', 'F-BNN-01', 'F-SADESATI', 'F-WINDOW', 'F-GOCHARA-03')),
    },
}

MAX_FACTS_PER_SECTION = 6


def assign_refs(findings: List[Dict[str, Any]]) -> None:
    """Give every finding a unique, citable ``ref`` (rule IDs repeat across themes)."""
    seen: Dict[str, int] = {}
    for f in findings:
        base = f"{f['id']}/{f['domain']}" if f.get('domain') else f['id']
        seen[base] = seen.get(base, 0) + 1
        f['ref'] = base if seen[base] == 1 else f"{base}.{seen[base]}"


def _matches(f: Dict[str, Any], domains: Sequence[str], prefixes: Sequence[str]) -> bool:
    dom = f.get('domain')
    if dom and dom in domains:
        return True
    for prefix in prefixes:
        if ':' in prefix:
            rule, pinned = prefix.split(':', 1)
            if dom == pinned and f['id'].startswith(rule):
                return True
        elif not dom and f['id'].startswith(prefix):
            return True
    return False


def route_findings(category: str, section_keys: Sequence[str], findings: List[Dict[str, Any]]
                   ) -> Tuple[List[Dict[str, Any]], Dict[str, List[Dict[str, Any]]]]:
    """Return (shared facts, {section key: facts}) for one category."""
    assign_refs(findings)
    shared = [f for f in findings if f['id'] in SHARED_IDS]
    routes = ROUTES.get(category, {})
    general = [f for f in findings if f['id'] not in SHARED_IDS and not f.get('domain')]
    per_section: Dict[str, List[Dict[str, Any]]] = {}
    for key in section_keys:
        domains, prefixes = routes.get(key, ((), ()))
        picked = [f for f in findings if f['id'] not in SHARED_IDS and _matches(f, domains, prefixes)]
        if not picked:
            picked = general[:4]
        picked = sorted(picked, key=lambda f: -f['weight'])[:MAX_FACTS_PER_SECTION]
        per_section[key] = picked
    return shared, per_section


def fact_line(f: Dict[str, Any]) -> str:
    line = f"[{f.get('ref') or f['id']}] {f['finding']}"
    if f.get('timing'):
        line += f" | timing: {f['timing']}"
    return line

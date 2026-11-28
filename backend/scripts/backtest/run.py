"""Back-test: was each known life event inside a window the engine would have named beforehand?

For every event the engine is run as if the reading were made LEAD days earlier, and the
facts routed to the matching reading section are checked: does any dated window hold the
event? The control asks the same of placebo dates 2 to 5 years either side of the real
event, for the same person. A rule set with predictive value must beat the placebo rate.

    cd backend && PYTHONPATH=.:scripts/backtest python scripts/backtest/run.py [LEAD_DAYS]

Takes about four minutes. See docs/bhrigu_nadi_rules.md, "Back-test against documented lives".
"""
import collections
import random
import sys
from datetime import datetime, timedelta, timezone, date
from people import P
from services import ephemeris_core as E
from services.bhrigu_nadi_rules import evaluate_rules
from services.wisdom_core_pipeline import build_chart_facts
from services.section_routes import ROUTES, route_findings

LEAD = int(sys.argv[1]) if len(sys.argv) > 1 else 365
SKIP = {'Bruce Springsteen'}   # rising degree 29.98 Taurus: the Lagna sign itself is in doubt
KEYS = list(ROUTES['life_events'])
SECTION = {'m': ['marriage_timing'], 'c': ['children_family'], 'a': ['career_milestones', 'favorable_periods'], 's': ['challenging_periods']}
NAME = {'m': 'Marriage', 'c': 'Birth of a child', 'a': 'Achievement', 's': 'Setback'}
cache = {}

def facts(name, d):
    key = (name, d)
    if key not in cache:
        p = P[name]
        ch = E.build_chart(p['utc'], p['lat'], p['lon'])
        bd = {'latitude': p['lat'], 'longitude': p['lon'], 'gender': p['g'], 'birth_time_accuracy': '',
              'birth_details': {'utc': p['utc'].isoformat()}, **ch}
        now = datetime(d.year, d.month, d.day, 12, tzinfo=timezone.utc) - timedelta(days=LEAD)
        f = evaluate_rules(build_chart_facts(bd), bd, full=True, now=now)
        cache[key] = (f, route_findings('life_events', KEYS, f)[1])
    return cache[key]

def covering(name, d, section):
    """Rule ids of the section's facts whose window holds the date; and how many dated facts the section had."""
    per = facts(name, d)[1][section]
    iso = d.isoformat()
    dated = [f for f in per if f.get('start') and f.get('end')]
    return [f['id'] for f in dated if f['start'] <= iso <= f['end']], len(dated), sum(
        (date.fromisoformat(f['end']) - date.fromisoformat(f['start'])).days for f in dated)

def placebos(name, d, kind):
    real = [date.fromisoformat(x) for x, k in P[name]['ev'] if k == kind]
    out = []
    for k in (-5, -4, -3, -2, 2, 3, 4, 5):
        q = d + timedelta(days=round(k * 365.25))
        if all(abs((q - r).days) > 270 for r in real):
            out.append(q)
    return out

rows = []
for name, p in P.items():
    if name in SKIP:
        continue
    for iso, kind in p['ev']:
        d = date.fromisoformat(iso)
        for section in SECTION[kind] + (['challenging_periods'] if kind == 'a' else ['favorable_periods'] if kind == 's' else []):
            ids, n_dated, width = covering(name, d, section)
            pl = [covering(name, q, section) for q in placebos(name, d, kind)]
            rows.append(dict(name=name, date=iso, kind=kind, section=section, hit=bool(ids), ids=ids, n_dated=n_dated, width=width,
                             placebo=[bool(x[0]) for x in pl], placebo_ids=[x[0] for x in pl]))

def summarise(sel, label):
    n = len(sel); hits = sum(r['hit'] for r in sel)
    pn = sum(len(r['placebo']) for r in sel); ph = sum(sum(r['placebo']) for r in sel)
    # cluster bootstrap over people for the difference (real rate - placebo rate)
    people = sorted({r['name'] for r in sel}); random.seed(7); diffs = []
    for _ in range(4000):
        pick = [random.choice(people) for _ in people]
        s = [r for nm in pick for r in sel if r['name'] == nm]
        a = sum(r['hit'] for r in s) / len(s); b = sum(sum(r['placebo']) for r in s) / max(1, sum(len(r['placebo']) for r in s))
        diffs.append(a - b)
    diffs.sort(); lo, hi = diffs[100], diffs[3899]
    print(f"{label:46s} events {n:3d}  hit {hits:3d} = {100*hits/n:5.1f}%   chance {100*ph/pn:5.1f}% (n={pn})   lift {100*(hits/n-ph/pn):+5.1f} pts  95% [{100*lo:+.0f}, {100*hi:+.0f}]"
          f"   dated facts/section {sum(r['n_dated'] for r in sel)/n:.1f}")

print(f"LEAD {LEAD} days; people {len(P)-len(SKIP)}; events {sum(len(p['ev']) for n,p in P.items() if n not in SKIP)}")
main = [r for r in rows if r['section'] in SECTION[r['kind']]]
for kind in 'mcas':
    for section in SECTION[kind]:
        summarise([r for r in main if r['kind'] == kind and r['section'] == section], f"{NAME[kind]} in '{section}'")
summarise([r for r in rows if r['kind'] == 'a' and r['section'] == 'challenging_periods'], "CROSS: Achievement in 'challenging_periods'")
summarise([r for r in rows if r['kind'] == 's' and r['section'] == 'favorable_periods'], "CROSS: Setback in 'favorable_periods'")
summarise([r for r in main if not (r['kind'] == 'a' and r['section'] == 'favorable_periods')], 'ALL (own section, one per event)')

# per rule family: when its window is one of the section's facts, how often does it hold the real date vs a placebo date
fam = collections.defaultdict(lambda: [0, 0, 0, 0])
for r in main:
    for i in set(r['ids']): fam[(i, r['kind'])][0] += 1
    for pid in r['placebo_ids']:
        for i in set(pid): fam[(i, r['kind'])][2] += 1
tot = collections.Counter(); ptot = collections.Counter()
for r in main:
    tot[r['kind']] += 1; ptot[r['kind']] += len(r['placebo'])
print('\nrule | kind | real hits/events | placebo hits/placebos')
for (i, k), v in sorted(fam.items(), key=lambda kv: (kv[0][1], -kv[1][0])):
    if v[0] + v[2] >= 8:
        print(f"  {i:14s} {NAME[k]:17s} {v[0]:3d}/{tot[k]:3d} = {100*v[0]/tot[k]:5.1f}%   placebo {v[2]:3d}/{ptot[k]:3d} = {100*v[2]/ptot[k]:5.1f}%")

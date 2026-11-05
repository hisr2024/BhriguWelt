"""
Ashtakoot (Guna Milan) — the standard 36-point North-Indian match.

Pure functions over Moon signs, Moon nakshatras and (optionally) Moon
longitudes. Tables follow the common classical/Muhurta Chintamani usage:

  Varna 1 · Vashya 2 · Tara 3 · Yoni 4 · Graha Maitri 5 · Gana 6 · Bhakoot 7 · Nadi 8

Direction matters for Varna, Vashya and Gana: `boy` is the groom, `girl` the
bride. When genders are unknown, callers pass person 1 as `boy`.
"""
from __future__ import annotations

from typing import Dict, Optional

SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
         'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
NAKSHATRAS = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu',
              'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra',
              'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha',
              'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati']
SIGN_LORD = {'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon', 'Leo': 'Sun',
             'Virgo': 'Mercury', 'Libra': 'Venus', 'Scorpio': 'Mars', 'Sagittarius': 'Jupiter',
             'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'}

# --- Varna (Moon sign) -----------------------------------------------------
VARNA_RANK = {'Brahmin': 4, 'Kshatriya': 3, 'Vaishya': 2, 'Shudra': 1}
VARNA = {'Cancer': 'Brahmin', 'Scorpio': 'Brahmin', 'Pisces': 'Brahmin',
         'Aries': 'Kshatriya', 'Leo': 'Kshatriya', 'Sagittarius': 'Kshatriya',
         'Taurus': 'Vaishya', 'Virgo': 'Vaishya', 'Capricorn': 'Vaishya',
         'Gemini': 'Shudra', 'Libra': 'Shudra', 'Aquarius': 'Shudra'}

# --- Vashya (Moon sign; Sagittarius and Capricorn split at 15°) -------------
VASHYA_ORDER = ['Chatushpada', 'Manava', 'Jalachara', 'Vanachara', 'Keeta']
VASHYA_MATRIX = [  # boy row, girl column
    [2, 1, 1, 0.5, 1],
    [1, 2, 0.5, 0, 1],
    [1, 0.5, 2, 1, 1],
    [0.5, 0, 1, 2, 0],
    [1, 1, 1, 0, 2],
]


def vashya_group(sign: str, degree_in_sign: Optional[float] = None) -> str:
    if sign in ('Aries', 'Taurus'):
        return 'Chatushpada'
    if sign in ('Gemini', 'Virgo', 'Libra', 'Aquarius'):
        return 'Manava'
    if sign in ('Cancer', 'Pisces'):
        return 'Jalachara'
    if sign == 'Leo':
        return 'Vanachara'
    if sign == 'Scorpio':
        return 'Keeta'
    first_half = degree_in_sign is None or degree_in_sign < 15
    if sign == 'Sagittarius':
        return 'Manava' if first_half else 'Chatushpada'
    if sign == 'Capricorn':
        return 'Chatushpada' if first_half else 'Jalachara'
    return 'Manava'


# --- Yoni (Moon nakshatra) ---------------------------------------------------
YONI_ORDER = ['Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat',
              'Cow', 'Buffalo', 'Tiger', 'Deer', 'Monkey', 'Mongoose', 'Lion']
NAKSHATRA_YONI = ['Horse', 'Elephant', 'Sheep', 'Serpent', 'Serpent', 'Dog', 'Cat', 'Sheep', 'Cat',
                  'Rat', 'Rat', 'Cow', 'Buffalo', 'Tiger', 'Buffalo', 'Tiger', 'Deer', 'Deer', 'Dog',
                  'Monkey', 'Mongoose', 'Monkey', 'Lion', 'Horse', 'Lion', 'Cow', 'Elephant']
YONI_MATRIX = [
    # Ho El Sh Se Do Ca Ra Co Bu Ti De Mo Mn Li
    [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1],  # Horse
    [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],  # Elephant
    [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],  # Sheep
    [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],  # Serpent
    [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],  # Dog
    [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],  # Cat
    [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],  # Rat
    [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],  # Cow
    [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],  # Buffalo
    [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],  # Tiger
    [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],  # Deer
    [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],  # Monkey
    [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],  # Mongoose
    [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4],  # Lion
]

# --- Graha Maitri (natural relationships, BPHS) ------------------------------
FRIENDS = {'Sun': {'Moon', 'Mars', 'Jupiter'}, 'Moon': {'Sun', 'Mercury'},
           'Mars': {'Sun', 'Moon', 'Jupiter'}, 'Mercury': {'Sun', 'Venus'},
           'Jupiter': {'Sun', 'Moon', 'Mars'}, 'Venus': {'Mercury', 'Saturn'},
           'Saturn': {'Mercury', 'Venus'}}
ENEMIES = {'Sun': {'Venus', 'Saturn'}, 'Moon': set(), 'Mars': {'Mercury'},
           'Mercury': {'Moon'}, 'Jupiter': {'Mercury', 'Venus'}, 'Venus': {'Sun', 'Moon'},
           'Saturn': {'Sun', 'Moon', 'Mars'}}


def _relation(a: str, b: str) -> str:
    if a == b or b in FRIENDS[a]:
        return 'friend'
    return 'enemy' if b in ENEMIES[a] else 'neutral'


MAITRI_POINTS = {
    frozenset(['friend']): 5, frozenset(['friend', 'neutral']): 4, frozenset(['neutral']): 3,
    frozenset(['friend', 'enemy']): 1, frozenset(['neutral', 'enemy']): 0.5, frozenset(['enemy']): 0,
}

# --- Gana (Moon nakshatra) ---------------------------------------------------
DEVA = {'Ashwini', 'Mrigashira', 'Punarvasu', 'Pushya', 'Hasta', 'Swati', 'Anuradha', 'Shravana', 'Revati'}
MANUSHYA = {'Bharani', 'Rohini', 'Ardra', 'Purva Phalguni', 'Uttara Phalguni', 'Purva Ashadha',
            'Uttara Ashadha', 'Purva Bhadrapada', 'Uttara Bhadrapada'}
GANA_POINTS = {  # (boy, girl)
    ('Deva', 'Deva'): 6, ('Deva', 'Manushya'): 6, ('Deva', 'Rakshasa'): 1,
    ('Manushya', 'Deva'): 5, ('Manushya', 'Manushya'): 6, ('Manushya', 'Rakshasa'): 0,
    ('Rakshasa', 'Deva'): 1, ('Rakshasa', 'Manushya'): 0, ('Rakshasa', 'Rakshasa'): 6,
}


def gana(nakshatra: str) -> str:
    if nakshatra in DEVA:
        return 'Deva'
    return 'Manushya' if nakshatra in MANUSHYA else 'Rakshasa'


# --- Nadi (Moon nakshatra) ---------------------------------------------------
def nadi(nakshatra: str) -> str:
    i = NAKSHATRAS.index(nakshatra)
    # Aadi / Madhya / Antya follow a 1-2-3-3-2-1 zig-zag through the 27 stars.
    return ['Aadi', 'Madhya', 'Antya', 'Antya', 'Madhya', 'Aadi'][i % 6]


def ashtakoot(boy: Dict, girl: Dict) -> Dict[str, Dict]:
    """
    boy / girl: {'moon_sign', 'nakshatra', 'moon_degree' (optional, degree in sign)}.
    Returns {kuta: {'score', 'max', 'detail'}} plus 'total'.
    """
    bs, gs = boy['moon_sign'], girl['moon_sign']
    bn, gn = boy['nakshatra'], girl['nakshatra']
    bi, gi = NAKSHATRAS.index(bn), NAKSHATRAS.index(gn)

    varna = 1 if VARNA_RANK[VARNA[bs]] >= VARNA_RANK[VARNA[gs]] else 0

    vb = vashya_group(bs, boy.get('moon_degree'))
    vg = vashya_group(gs, girl.get('moon_degree'))
    vashya = VASHYA_MATRIX[VASHYA_ORDER.index(vb)][VASHYA_ORDER.index(vg)]

    def tara_good(from_i: int, to_i: int) -> bool:
        t = ((to_i - from_i) % 27) % 9 + 1
        return t not in (3, 5, 7)
    tara = 1.5 * tara_good(gi, bi) + 1.5 * tara_good(bi, gi)

    yb, yg = NAKSHATRA_YONI[bi], NAKSHATRA_YONI[gi]
    yoni = YONI_MATRIX[YONI_ORDER.index(yb)][YONI_ORDER.index(yg)]

    lb, lg = SIGN_LORD[bs], SIGN_LORD[gs]
    maitri = MAITRI_POINTS[frozenset([_relation(lb, lg), _relation(lg, lb)])]

    gb, gg = gana(bn), gana(gn)
    gana_pts = GANA_POINTS[(gb, gg)]

    d = (SIGNS.index(bs) - SIGNS.index(gs)) % 12
    bhakoot = 0 if d in (1, 11, 4, 8, 5, 7) else 7   # 2/12, 5/9, 6/8 are doshas

    nb, ng = nadi(bn), nadi(gn)
    nadi_pts = 0 if nb == ng else 8

    result = {
        'varna': {'score': varna, 'max': 1, 'detail': f"{VARNA[bs]} / {VARNA[gs]}"},
        'vashya': {'score': vashya, 'max': 2, 'detail': f"{vb} / {vg}"},
        'tara': {'score': tara, 'max': 3, 'detail': 'both directions auspicious' if tara == 3 else 'one or both directions inauspicious'},
        'yoni': {'score': yoni, 'max': 4, 'detail': f"{yb} / {yg}"},
        'graha_maitri': {'score': maitri, 'max': 5, 'detail': f"{lb} / {lg}"},
        'gana': {'score': gana_pts, 'max': 6, 'detail': f"{gb} / {gg}"},
        'bhakoot': {'score': bhakoot, 'max': 7, 'detail': f"{SIGNS.index(bs) - SIGNS.index(gs)}"},
        'nadi': {'score': nadi_pts, 'max': 8, 'detail': f"{nb} / {ng}"},
    }
    result['bhakoot']['detail'] = 'no dosha' if bhakoot else 'dosha (2/12, 5/9 or 6/8)'
    result['total'] = sum(v['score'] for k, v in result.items() if isinstance(v, dict) and 'score' in v)
    return result

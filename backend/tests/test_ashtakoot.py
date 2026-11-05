"""Regression tests for the standard Ashtakoot tables (services.ashtakoot)."""
import pytest

from services.ashtakoot import ashtakoot, nadi, vashya_group


def person(sign, nak, deg=None):
    return {'moon_sign': sign, 'nakshatra': nak, 'moon_degree': deg}


def test_bhakoot_5_9_is_dosha():
    # Aries–Leo are 5/9 from each other: Bhakoot dosha (0 points).
    assert ashtakoot(person('Aries', 'Ashwini'), person('Leo', 'Magha'))['bhakoot']['score'] == 0


@pytest.mark.parametrize('a,b', [('Aries', 'Taurus'), ('Pisces', 'Aries'), ('Aries', 'Scorpio'), ('Virgo', 'Aries')])
def test_bhakoot_2_12_and_6_8_are_dosha(a, b):
    assert ashtakoot(person(a, 'Ashwini'), person(b, 'Rohini'))['bhakoot']['score'] == 0


@pytest.mark.parametrize('a,b', [('Aries', 'Aries'), ('Aries', 'Libra'), ('Aries', 'Gemini'), ('Aries', 'Cancer')])
def test_bhakoot_good_pairs(a, b):
    assert ashtakoot(person(a, 'Ashwini'), person(b, 'Rohini'))['bhakoot']['score'] == 7


def test_tara_ashwini_krittika():
    # Ashwini→Krittika is the 3rd star (Vipat, bad); Krittika→Ashwini is the 26th, tara 8 (good).
    assert ashtakoot(person('Aries', 'Ashwini'), person('Aries', 'Krittika'))['tara']['score'] == 1.5


def test_yoni_pairs():
    assert ashtakoot(person('Gemini', 'Punarvasu'), person('Leo', 'Magha'))['yoni']['score'] == 0  # cat / rat
    assert ashtakoot(person('Taurus', 'Krittika'), person('Cancer', 'Pushya'))['yoni']['score'] == 4  # sheep / sheep


@pytest.mark.parametrize('a,b,points', [
    ('Capricorn', 'Pisces', 3),   # Saturn / Jupiter: neutral both ways
    ('Gemini', 'Cancer', 1),      # Mercury sees Moon as enemy, Moon sees Mercury as friend
    ('Leo', 'Gemini', 4),         # Sun neutral to Mercury, Mercury friend to Sun
    ('Aries', 'Leo', 5),          # Mars / Sun: mutual friends
])
def test_graha_maitri(a, b, points):
    assert ashtakoot(person(a, 'Ashwini'), person(b, 'Magha'))['graha_maitri']['score'] == points


def test_vashya_manava_vanachara():
    assert ashtakoot(person('Gemini', 'Ardra'), person('Leo', 'Magha'))['vashya']['score'] == 0


def test_vashya_split_signs():
    assert vashya_group('Sagittarius', 10) == 'Manava'
    assert vashya_group('Sagittarius', 20) == 'Chatushpada'
    assert vashya_group('Capricorn', 10) == 'Chatushpada'
    assert vashya_group('Capricorn', 20) == 'Jalachara'


def test_varna_uses_moon_sign():
    # Cancer (Brahmin) groom with Gemini (Shudra) bride gets the point; reversed does not.
    assert ashtakoot(person('Cancer', 'Pushya'), person('Gemini', 'Ardra'))['varna']['score'] == 1
    assert ashtakoot(person('Gemini', 'Ardra'), person('Cancer', 'Pushya'))['varna']['score'] == 0


def test_nadi_groups():
    for star in ('Ashwini', 'Ardra', 'Punarvasu', 'Uttara Phalguni', 'Hasta', 'Jyeshtha', 'Mula', 'Shatabhisha', 'Purva Bhadrapada'):
        assert nadi(star) == 'Aadi'
    for star in ('Krittika', 'Rohini', 'Ashlesha', 'Magha', 'Swati', 'Vishakha', 'Uttara Ashadha', 'Shravana', 'Revati'):
        assert nadi(star) == 'Antya'


def test_same_nakshatra_has_nadi_dosha_and_total_bounds():
    r = ashtakoot(person('Aries', 'Ashwini'), person('Aries', 'Ashwini'))
    assert r['nadi']['score'] == 0
    assert 0 <= r['total'] <= 36


def test_matchmaking_service_shape():
    from services.matchmaking_service import MatchmakingService
    svc = MatchmakingService.__new__(MatchmakingService)
    c1 = {'moon_sign': 'Aries', 'nakshatra': 'Ashwini', 'planets': {'Moon': {'degree_in_sign': 5.0}}}
    c2 = {'moon_sign': 'Leo', 'nakshatra': 'Magha', 'planets': {'Moon': {'longitude': 125.0}}}
    out = svc._calculate_ashtakoot(c1, c2)
    assert out['max_score'] == 36
    assert out['bhakoot']['score'] == 0
    assert set(out) >= {'varna', 'vashya', 'tara', 'yoni', 'graha_maitri', 'gana', 'bhakoot', 'nadi', 'total_score'}
    assert svc._get_planet_house({'planets': {}}, 'Mars') is None

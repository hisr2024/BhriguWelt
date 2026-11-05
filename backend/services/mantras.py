"""Standard short Navagraha nama mantras, keyed by English or Sanskrit planet name."""

PLANET_MANTRA = {
    'Sun': 'Om Suryaya Namaha', 'Moon': 'Om Chandraya Namaha', 'Mars': 'Om Mangalaya Namaha',
    'Mercury': 'Om Budhaya Namaha', 'Jupiter': 'Om Gurave Namaha', 'Venus': 'Om Shukraya Namaha',
    'Saturn': 'Om Shanaischaraya Namaha', 'Rahu': 'Om Rahave Namaha', 'Ketu': 'Om Ketave Namaha',
}
_ALIASES = {
    'Surya': 'Sun', 'Chandra': 'Moon', 'Soma': 'Moon', 'Mangal': 'Mars', 'Mangala': 'Mars', 'Kuja': 'Mars',
    'Budha': 'Mercury', 'Guru': 'Jupiter', 'Brihaspati': 'Jupiter', 'Shukra': 'Venus',
    'Shani': 'Saturn', 'Shanaischara': 'Saturn',
}


def planet_mantra(name: str, default: str = 'Om Namah Shivaya') -> str:
    key = (name or '').strip().split(' ')[0]
    key = _ALIASES.get(key, key)
    return PLANET_MANTRA.get(key, default)

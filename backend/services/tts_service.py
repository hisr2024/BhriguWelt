"""
Read-aloud voice for readings and Today.

Two engines, chosen with TTS_ENGINE:

* ``sarvam`` (default) — Sarvam Bulbul over the REST API, using the same
  SARVAM_API_KEY as the AI readings. Indian English and Hindi voices.
* ``svara``  — Kenpath Labs' open svara-TTS v1 served by their
  svara-tts-inference server (OpenAI-compatible ``/v1/audio/speech``) on a GPU
  host you run. Set SVARA_TTS_URL (base URL, e.g. https://svara.example.com)
  and optionally SVARA_TTS_KEY (sent as a Bearer token to your gateway).
  If Svara fails or times out the request falls back to Sarvam, so a cold
  GPU never leaves the listener with silence.

Text is cleaned for speech (markdown, symbols, abbreviations), split at
sentence boundaries into chunks under the engine limit, synthesised as MP3
and joined. Results are cached on disk by content hash so a passage is paid
for once per server until the disk is recycled; the browser also keeps its
own copy.
"""
from __future__ import annotations

import base64
import hashlib
import os
import re
import tempfile
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import requests

from utils.logger import setup_logger

logger = setup_logger(__name__)

SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech'
SARVAM_CHUNK_CHARS = 1800          # API limit is 2,500; stay well under it
SVARA_CHUNK_CHARS = 600            # svara chunks internally; keep requests short
MAX_INPUT_CHARS = 12000            # one Listen request (a long reading section)
SAMPLE_RATE = 24000

LANGS = {'en': 'en-IN', 'hi': 'hi-IN'}

# Voices offered in the app. Sarvam speaker names are model-specific.
VOICES = {
    'sarvam': {
        'female': os.getenv('TTS_SARVAM_SPEAKER_FEMALE', 'kavya'),
        'male': os.getenv('TTS_SARVAM_SPEAKER_MALE', 'aditya'),
    },
    'svara': {
        'female': {'en': 'en_female', 'hi': 'hi_female'},
        'male': {'en': 'en_male', 'hi': 'hi_male'},
    },
}


class TTSUnavailable(RuntimeError):
    pass


def engine_name() -> str:
    name = os.getenv('TTS_ENGINE', 'sarvam').strip().lower()
    return name if name in ('sarvam', 'svara') else 'sarvam'


def sarvam_model() -> str:
    return os.getenv('TTS_SARVAM_MODEL', 'bulbul:v3')


def configured() -> bool:
    return bool(os.getenv('SARVAM_API_KEY')) or (
        engine_name() == 'svara' and bool(os.getenv('SVARA_TTS_URL')))


# ── text preparation ─────────────────────────────────────────────────────

_REPLACEMENTS = [
    (re.compile(r'```.*?```', re.S), ' '),
    (re.compile(r'`([^`]*)`'), r'\1'),
    (re.compile(r'!\[[^\]]*\]\([^)]*\)'), ' '),
    (re.compile(r'\[([^\]]+)\]\([^)]*\)'), r'\1'),
    (re.compile(r'^\s{0,3}#{1,6}\s*(.+?)\s*#*\s*$', re.M), r'\1.'),
    (re.compile(r'^\s*[-*•·]\s+', re.M), ''),
    (re.compile(r'^\s*\d+[.)]\s+', re.M), ''),
    (re.compile(r'[*_~>|]+'), ''),
    (re.compile(r'\s*[–—]\s*'), ', '),
    (re.compile(r'\s*→\s*'), ' to '),
    (re.compile(r'(\d)\s*°'), r'\1 degrees'),
    (re.compile(r'(\d+)\s*%'), r'\1 percent'),
    (re.compile(r'\be\.g\.', re.I), 'for example'),
    (re.compile(r'\bi\.e\.', re.I), 'that is'),
    (re.compile(r'\betc\.', re.I), 'and so on'),
    (re.compile(r'\bvs\.?', re.I), 'versus'),
    (re.compile(r'&'), ' and '),
    (re.compile(r'[\U0001F300-\U0001FAFF☀-➿]'), ''),
]


def clean_for_speech(text: str) -> str:
    out = text or ''
    for pattern, repl in _REPLACEMENTS:
        out = pattern.sub(repl, out)
    # A line ending without punctuation is a heading or list item: pause there.
    lines = [ln.strip() for ln in out.splitlines()]
    lines = [ln if not ln or ln[-1] in '.!?:;,।' else ln + '.' for ln in lines]
    out = ' '.join(ln for ln in lines if ln)
    out = re.sub(r'\s+([,.;:!?])', r'\1', out)
    out = re.sub(r'([,.;:!?])(?=[^\s\d"\')])', r'\1 ', out)
    out = re.sub(r'\.{2,}', '.', out)
    return re.sub(r'\s{2,}', ' ', out).strip()


_SENTENCE = re.compile(r'(?<=[.!?।])\s+')


def chunk_text(text: str, limit: int) -> List[str]:
    chunks: List[str] = []
    current = ''
    for sentence in _SENTENCE.split(text):
        sentence = sentence.strip()
        if not sentence:
            continue
        while len(sentence) > limit:                 # very long sentence
            cut = sentence.rfind(', ', 0, limit)
            cut = cut + 1 if cut > limit // 3 else limit
            piece, sentence = sentence[:cut].strip(), sentence[cut:].strip()
            if current:
                chunks.append(current)
                current = ''
            chunks.append(piece)
        if len(current) + len(sentence) + 1 > limit:
            chunks.append(current)
            current = sentence
        else:
            current = f'{current} {sentence}'.strip()
    if current:
        chunks.append(current)
    return chunks


# ── cache ────────────────────────────────────────────────────────────────

_CACHE_DIR = Path(os.getenv('TTS_CACHE_DIR', os.path.join(tempfile.gettempdir(), 'bw-tts-cache')))
_CACHE_MAX_FILES = int(os.getenv('TTS_CACHE_MAX_FILES', '3000'))
_cache_lock = threading.Lock()


def cache_key(engine: str, voice: str, lang: str, text: str) -> str:
    model = sarvam_model() if engine == 'sarvam' else 'svara-tts-v1'
    return hashlib.sha256(f'{engine}|{model}|{voice}|{lang}|{text}'.encode()).hexdigest()


def _cache_get(key: str) -> Optional[bytes]:
    path = _CACHE_DIR / f'{key}.mp3'
    try:
        return path.read_bytes()
    except OSError:
        return None


def _cache_put(key: str, audio: bytes) -> None:
    try:
        _CACHE_DIR.mkdir(parents=True, exist_ok=True)
        with _cache_lock:
            files = list(_CACHE_DIR.glob('*.mp3'))
            if len(files) >= _CACHE_MAX_FILES:
                files.sort(key=lambda p: p.stat().st_mtime)
                for old in files[: len(files) // 5]:
                    old.unlink(missing_ok=True)
        tmp = _CACHE_DIR / f'{key}.tmp'
        tmp.write_bytes(audio)
        tmp.replace(_CACHE_DIR / f'{key}.mp3')
    except OSError as exc:
        logger.debug('TTS cache write failed: %s', exc)


# ── engines ──────────────────────────────────────────────────────────────

def _sarvam_chunk(text: str, lang: str, speaker: str, pace: float) -> bytes:
    key = os.getenv('SARVAM_API_KEY')
    if not key:
        raise TTSUnavailable('SARVAM_API_KEY is not set')
    body = {
        'text': text,
        'language_code': LANGS.get(lang, 'en-IN'),
        'model': sarvam_model(),
        'speaker': speaker,
        'pace': pace,
        'speech_sample_rate': SAMPLE_RATE,
        'output_audio_codec': 'mp3',
    }
    temperature = os.getenv('TTS_SARVAM_TEMPERATURE')
    if temperature:
        body['temperature'] = float(temperature)
    resp = requests.post(SARVAM_TTS_URL, json=body, timeout=60,
                         headers={'api-subscription-key': key})
    if resp.status_code >= 400:
        raise TTSUnavailable(f'Sarvam TTS {resp.status_code}: {resp.text[:200]}')
    audios = resp.json().get('audios') or []
    if not audios:
        raise TTSUnavailable('Sarvam TTS returned no audio')
    return b''.join(base64.b64decode(a) for a in audios)


def _svara_chunk(text: str, lang: str, voice_id: str, pace: float) -> bytes:
    base = os.getenv('SVARA_TTS_URL', '').rstrip('/')
    if not base:
        raise TTSUnavailable('SVARA_TTS_URL is not set')
    headers = {}
    if os.getenv('SVARA_TTS_KEY'):
        headers['Authorization'] = f"Bearer {os.getenv('SVARA_TTS_KEY')}"
    body = {'model': 'svara-tts-v1', 'input': text, 'voice': voice_id,
            'response_format': 'mp3', 'speed': pace}
    resp = requests.post(f'{base}/v1/audio/speech', json=body, headers=headers,
                         timeout=float(os.getenv('SVARA_TTS_TIMEOUT', '45')))
    if resp.status_code >= 400 or not resp.content:
        raise TTSUnavailable(f'Svara TTS {resp.status_code}')
    return resp.content


def _synthesise(engine: str, chunks: List[str], lang: str, gender: str, pace: float) -> bytes:
    if engine == 'svara':
        voice = VOICES['svara'][gender].get(lang, VOICES['svara'][gender]['en'])
        call = lambda c: _svara_chunk(c, lang, voice, pace)  # noqa: E731
    else:
        voice = VOICES['sarvam'][gender]
        call = lambda c: _sarvam_chunk(c, lang, voice, pace)  # noqa: E731
    # A few chunks in parallel keeps a long reading quick without
    # hammering the provider's rate limit.
    with ThreadPoolExecutor(max_workers=min(4, len(chunks))) as pool:
        parts = list(pool.map(call, chunks))
    return _join_mp3(parts)


def _strip_id3(mp3: bytes) -> bytes:
    if mp3[:3] == b'ID3' and len(mp3) > 10:
        size = ((mp3[6] & 0x7F) << 21) | ((mp3[7] & 0x7F) << 14) | ((mp3[8] & 0x7F) << 7) | (mp3[9] & 0x7F)
        return mp3[10 + size:]
    return mp3


def _join_mp3(parts: List[bytes]) -> bytes:
    """MP3 is a stream of independent frames, so same-format parts can be
    concatenated; only the leading ID3 tag of later parts is dropped."""
    if not parts:
        return b''
    return parts[0] + b''.join(_strip_id3(p) for p in parts[1:])


# ── public API ───────────────────────────────────────────────────────────

def speak(text: str, lang: str = 'en', gender: str = 'female', pace: float = 1.0) -> Tuple[bytes, Dict]:
    """Return (mp3_bytes, info). info has chars (billed), cached, engine."""
    lang = lang if lang in LANGS else 'en'
    gender = gender if gender in ('female', 'male') else 'female'
    pace = min(1.3, max(0.8, float(pace or 1.0)))
    clean = clean_for_speech(text)[:MAX_INPUT_CHARS]
    if not clean:
        raise ValueError('Nothing to read aloud')

    primary = engine_name()
    engines = [primary] + (['sarvam'] if primary == 'svara' and os.getenv('SARVAM_API_KEY') else [])
    last_error: Optional[Exception] = None
    for engine in engines:
        voice_label = f'{gender}:{pace:.2f}'
        key = cache_key(engine, voice_label, lang, clean)
        hit = _cache_get(key)
        if hit:
            return hit, {'chars': 0, 'cached': True, 'engine': engine, 'text_chars': len(clean)}
        limit = SVARA_CHUNK_CHARS if engine == 'svara' else SARVAM_CHUNK_CHARS
        try:
            audio = _synthesise(engine, chunk_text(clean, limit), lang, gender, pace)
        except Exception as exc:  # try the next engine
            logger.warning('TTS engine %s failed: %s', engine, exc)
            last_error = exc
            continue
        _cache_put(key, audio)
        return audio, {'chars': len(clean), 'cached': False, 'engine': engine, 'text_chars': len(clean)}
    raise TTSUnavailable(str(last_error) if last_error else 'No voice engine configured')


def cost_chars(text: str, lang: str = 'en', gender: str = 'female', pace: float = 1.0) -> int:
    """Characters this request would bill: 0 when the audio is already cached."""
    lang = lang if lang in LANGS else 'en'
    gender = gender if gender in ('female', 'male') else 'female'
    pace = min(1.3, max(0.8, float(pace or 1.0)))
    clean = clean_for_speech(text)[:MAX_INPUT_CHARS]
    if _cache_get(cache_key(engine_name(), f'{gender}:{pace:.2f}', lang, clean)):
        return 0
    return len(clean)


def estimate_seconds(chars: int) -> int:
    """About 15 characters a second for calm narration."""
    return int(round(chars / 15))

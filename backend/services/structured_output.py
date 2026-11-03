"""
Robust decoding of LLM output into structured data and clean readable text.

The production failure this module fixes: the model returned a JSON reading
(``{"summary": ..., "sections": {...}, "confidence": 0.9}``) and the service
re-serialised it with ``json.dumps`` and stored that *string* as the section
body, so users saw raw JSON on screen.

Everything here is stdlib-only and side-effect free so it can be imported by
the OpenAI service, the predictions service and tests without cycles.
"""
import json
import re
from typing import Any, Dict, List, Optional

_FENCE_RE = re.compile(r"```(?:json|JSON)?\s*([\s\S]*?)```")


def _balanced_objects(text: str) -> List[str]:
    """Return every top-level balanced ``{...}`` substring (string-aware)."""
    found: List[str] = []
    depth = 0
    start = -1
    in_str = False
    escape = False
    for i, ch in enumerate(text):
        if in_str:
            if escape:
                escape = False
            elif ch == '\\':
                escape = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == '{':
            if depth == 0:
                start = i
            depth += 1
        elif ch == '}' and depth:
            depth -= 1
            if depth == 0 and start >= 0:
                found.append(text[start:i + 1])
                start = -1
    return found


def _repair_truncated(text: str) -> Optional[str]:
    """Close an object cut off by max_tokens: drop the dangling fragment,
    close any open string, then close open brackets in order."""
    start = text.find('{')
    if start < 0:
        return None
    body = text[start:]
    stack: List[str] = []
    in_str = False
    escape = False
    last_safe = -1  # index after the last complete value at any depth
    for i, ch in enumerate(body):
        if in_str:
            if escape:
                escape = False
            elif ch == '\\':
                escape = True
            elif ch == '"':
                in_str = False
                last_safe = i + 1
            continue
        if ch == '"':
            in_str = True
        elif ch in '{[':
            stack.append('}' if ch == '{' else ']')
        elif ch in '}]':
            if stack:
                stack.pop()
            last_safe = i + 1
        elif ch == ',':
            last_safe = i
    if not stack:
        return None  # not truncated (or not JSON at all)
    if in_str:
        candidate = body + '"'
    else:
        candidate = body[:last_safe] if last_safe > 0 else body
    candidate = candidate.rstrip().rstrip(',').rstrip(':')
    # A trailing dangling key ("key") without value: drop it.
    candidate = re.sub(r',\s*"[^"]*"\s*$', '', candidate)
    # Recompute closers for the trimmed candidate.
    stack = []
    in_str = False
    escape = False
    for ch in candidate:
        if in_str:
            if escape:
                escape = False
            elif ch == '\\':
                escape = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch in '{[':
            stack.append('}' if ch == '{' else ']')
        elif ch in '}]' and stack:
            stack.pop()
    return candidate + ''.join(reversed(stack))


def _loads_dict(candidate: str) -> Optional[Dict[str, Any]]:
    try:
        value = json.loads(candidate)
    except (json.JSONDecodeError, TypeError, ValueError):
        return None
    # Double-encoded: the model returned a JSON *string* containing JSON.
    if isinstance(value, str) and value.strip().startswith('{'):
        try:
            value = json.loads(value)
        except (json.JSONDecodeError, ValueError):
            return None
    return value if isinstance(value, dict) else None


def extract_json_object(text: Any) -> Optional[Dict[str, Any]]:
    """
    Best-effort extraction of a JSON object from model output.

    Handles: plain JSON, ```json fenced blocks, prose before/after, several
    objects concatenated (chunked calls — merged), double-encoded strings and
    output truncated by the token limit. Returns None when no object exists.
    """
    if isinstance(text, dict):
        return text
    if not isinstance(text, str) or '{' not in text:
        return None
    raw = text.strip()

    direct = _loads_dict(raw)
    if direct is not None:
        return direct

    for fenced in _FENCE_RE.findall(raw):
        parsed = _loads_dict(fenced.strip())
        if parsed is not None:
            return parsed

    objects = [o for o in (_loads_dict(c) for c in _balanced_objects(raw)) if o is not None]
    if len(objects) == 1:
        return objects[0]
    if len(objects) > 1:
        return merge_readings(objects)

    repaired = _repair_truncated(raw)
    if repaired:
        parsed = _loads_dict(repaired)
        if parsed is not None:
            parsed.setdefault('_truncated', True)
            return parsed
    return None


def merge_readings(objects: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Merge several partial readings (from chunked calls) into one."""
    merged: Dict[str, Any] = {}
    sections: Dict[str, Any] = {}
    for obj in objects:
        for key, value in obj.items():
            if key == 'sections' and isinstance(value, dict):
                for s_key, s_val in value.items():
                    sections.setdefault(s_key, s_val)
            else:
                merged.setdefault(key, value)
    if sections:
        merged['sections'] = sections
    return merged


def _as_lines(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    text = str(value).strip()
    if not text:
        return []
    # "1. foo 2. bar 3. baz" on one line → separate items
    parts = re.split(r'\s*(?:^|(?<=\s))(?:\d+[.)]|[-•*])\s+', text)
    items = [p.strip() for p in parts if p and p.strip()]
    return items if len(items) > 1 else [text]


_LIST_KEYS = ('guidance', 'actionable guidance', 'actions', 'recommendations', 'remedies', 'steps')


def value_to_markdown(value: Any, depth: int = 0) -> str:
    """Render any decoded JSON value as readable markdown (never raw JSON)."""
    if value is None:
        return ''
    if isinstance(value, str):
        nested = extract_json_object(value) if value.lstrip().startswith('{') else None
        if nested is not None:
            return reading_to_markdown(nested, depth)
        return value.strip()
    if isinstance(value, (int, float, bool)):
        return str(value)
    if isinstance(value, list):
        return '\n'.join(f"- {value_to_markdown(v, depth + 1)}" for v in value if v not in (None, ''))
    if isinstance(value, dict):
        return reading_to_markdown(value, depth)
    return str(value)


_META_KEYS = {'confidence', '_truncated', 'basis', 'rule_ids', 'sources', 'citations'}


def _title(key: str) -> str:
    return key.replace('_', ' ').strip().title() if key.islower() or '_' in key else key.strip()


def reading_to_markdown(obj: Dict[str, Any], depth: int = 0) -> str:
    """Convert a decoded reading dict into clean markdown text."""
    parts: List[str] = []
    summary = obj.get('summary') or obj.get('overview')
    if isinstance(summary, str) and summary.strip():
        parts.append(summary.strip())
    for key, value in obj.items():
        if key in ('summary', 'overview') or key in _META_KEYS:
            continue
        if key == 'sections' and isinstance(value, dict):
            for s_key, s_val in value.items():
                if str(s_key).lower() in _LIST_KEYS:
                    items = _as_lines(s_val)
                    if items:
                        parts.append("Actionable Guidance:\n" + '\n'.join(f"- {i}" for i in items))
                    continue
                body = value_to_markdown(s_val, depth + 1)
                if body:
                    parts.append(f"### {_title(s_key)}\n{body}")
            continue
        if key.lower() in _LIST_KEYS:
            items = _as_lines(value)
            if items:
                parts.append("Actionable Guidance:\n" + '\n'.join(f"- {i}" for i in items))
            continue
        body = value_to_markdown(value, depth + 1)
        if body:
            parts.append(f"**{_title(key)}:** {body}" if '\n' not in body else f"**{_title(key)}:**\n{body}")
    return '\n\n'.join(p for p in parts if p).strip()


def to_readable_text(text: Any) -> str:
    """If ``text`` carries a JSON reading, return it as markdown; else unchanged."""
    if isinstance(text, dict):
        return reading_to_markdown(text)
    if not isinstance(text, str):
        return '' if text is None else str(text)
    stripped = text.strip()
    if '{' not in stripped:
        return text
    obj = extract_json_object(stripped)
    if obj is None:
        return text
    rendered = reading_to_markdown(obj)
    return rendered or text


def normalize_for_dedupe(text: str) -> str:
    return re.sub(r'[^a-z0-9]+', ' ', (text or '').lower()).strip()

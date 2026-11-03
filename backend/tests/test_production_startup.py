"""Production startup must accept a Sarvam-only configuration."""


def _run_check(monkeypatch, env):
    for k in ['OPENAI_API_KEY', 'SARVAM_API_KEY', 'SECRET_KEY', 'JWT_SECRET_KEY', 'FRONTEND_URL', 'AI_PROVIDER']:
        monkeypatch.delenv(k, raising=False)
    for k, v in env.items():
        monkeypatch.setenv(k, v)
    import backend.app as app_module
    monkeypatch.setattr(app_module, 'IS_PRODUCTION', True)
    exits = []
    monkeypatch.setattr(app_module, '_exit_startup', lambda lines: exits.append(lines))
    app_module._check_required_env_vars()
    return exits


BASE = {'SECRET_KEY': 'x' * 64, 'JWT_SECRET_KEY': 'y' * 64, 'FRONTEND_URL': 'https://bhriguwelt.vercel.app'}


def test_sarvam_only_production_starts(monkeypatch):
    assert _run_check(monkeypatch, {**BASE, 'SARVAM_API_KEY': 'sk_live_abc'}) == []


def test_production_without_any_ai_key_is_rejected(monkeypatch):
    exits = _run_check(monkeypatch, BASE)
    assert exits and any('SARVAM_API_KEY' in line for line in exits[0])

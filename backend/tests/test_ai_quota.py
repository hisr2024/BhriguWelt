import pytest

from backend.services import ai_quota


class FakeRedis:
    def __init__(self):
        self.store = {}
        self.expiry = {}

    def eval(self, script, numkeys, key, limit, incr):
        current = int(self.store.get(key, 0))
        limit = int(limit)
        incr = int(incr)
        if current + incr > limit:
            return [0, limit - current]
        new_total = current + incr
        self.store[key] = new_total
        self.expiry[key] = 172800
        return [1, limit - new_total]

    def get(self, key):
        value = self.store.get(key)
        return str(value) if value is not None else None

    def incrby(self, key, amount):
        self.store[key] = int(self.store.get(key, 0)) + int(amount)
        return self.store[key]

    def expire(self, key, ttl):
        self.expiry[key] = ttl


def test_estimate_tokens_minimum():
    assert ai_quota.estimate_tokens("") == 1
    assert ai_quota.estimate_tokens("a") == 1


def test_check_daily_quota_and_reserve_allows(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(ai_quota, "_get_redis_client", lambda: fake)

    with monkeypatch.context() as env:
        env.setenv("USER_DAILY_TOKEN_LIMIT", "1000")
        allowed, remaining = ai_quota.check_daily_quota_and_reserve("user123", 200)

    assert allowed is True
    assert remaining == 800


def test_check_daily_quota_and_reserve_blocks(monkeypatch):
    fake = FakeRedis()
    fake.store[ai_quota._get_quota_key("user123")] = 950
    monkeypatch.setattr(ai_quota, "_get_redis_client", lambda: fake)

    with monkeypatch.context() as env:
        env.setenv("USER_DAILY_TOKEN_LIMIT", "1000")
        with pytest.raises(ai_quota.QuotaExceededError):
            ai_quota.check_daily_quota_and_reserve("user123", 100)


def test_update_usage_after_call(monkeypatch):
    fake = FakeRedis()
    monkeypatch.setattr(ai_quota, "_get_redis_client", lambda: fake)

    ai_quota.update_usage_after_call("user123", 150)
    key = ai_quota._get_quota_key("user123")
    assert fake.store[key] == 150

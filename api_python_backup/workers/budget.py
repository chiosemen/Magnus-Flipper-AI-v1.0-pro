import os
import time
from typing import Literal, Tuple

import redis

_redis_client = None


def _get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
    return _redis_client


def _key(kind: str, org_id: str, ts_ms: int) -> str:
    minute = int(ts_ms / 60000)
    return f"budget:{kind}:{org_id}:{minute}"


def take_tokens(kind: Literal["alerts", "llm"], org_id: str, amount: int) -> Tuple[bool, int, int]:
    limit = int(
        os.getenv("BUDGET_ALERTS_RATE_PER_MIN", "60")
        if kind == "alerts"
        else os.getenv("BUDGET_LLM_TOKENS_PER_MIN", "30000")
    )
    burst = int(os.getenv("BUDGET_BURST_MULTIPLIER", "1"))
    cap = limit * burst
    k = _key(kind, org_id, int(time.time() * 1000))
    pipe = _get_redis().pipeline()
    pipe.incrby(k, amount)
    pipe.expire(k, 90, nx=True)
    used, _ = pipe.execute()
    allowed = used <= cap
    return allowed, used, cap

"""
Bitrix24 REST API client.

Handles rate limiting (2 req/sec) and batch requests.
Docs: https://apidocs.bitrix24.ru/api-reference/
"""

import asyncio
import logging
import time

import httpx
from app.bitrix.auth import get_valid_token

logger = logging.getLogger("bitrix_client")

_last_request_time: float = 0.0
_RATE_LIMIT_DELAY = 0.5  # 2 req/sec


async def _throttle():
    global _last_request_time
    now = time.time()
    elapsed = now - _last_request_time
    if elapsed < _RATE_LIMIT_DELAY:
        await asyncio.sleep(_RATE_LIMIT_DELAY - elapsed)
    _last_request_time = time.time()


async def call_method(domain: str, method: str, params: dict | None = None) -> dict:
    """Call a single Bitrix24 REST API method."""
    token = await get_valid_token(domain)
    url = f"https://{domain}/rest/{method}"

    await _throttle()

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            url,
            json=params or {},
            headers={"Authorization": f"Bearer {token}"},
        )
        resp.raise_for_status()
        data = resp.json()

    if "error" in data:
        logger.error("Bitrix API error: %s - %s", data["error"], data.get("error_description", ""))
        raise RuntimeError(f"Bitrix24 API error: {data['error']}")

    return data.get("result", data)


async def batch_call(domain: str, commands: dict[str, str]) -> dict:
    """
    Batch API call — up to 50 methods in one request.
    commands: {"label": "method?param=value", ...}
    """
    if len(commands) > 50:
        raise ValueError("Batch limit is 50 commands")
    return await call_method(domain, "batch", {"cmd": commands})


async def create_lead(domain: str, fields: dict) -> int:
    """Create a CRM lead in Bitrix24."""
    result = await call_method(domain, "crm.lead.add", {"fields": fields})
    return result


async def create_deal(domain: str, fields: dict) -> int:
    """Create a CRM deal in Bitrix24."""
    result = await call_method(domain, "crm.deal.add", {"fields": fields})
    return result

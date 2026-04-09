"""
Bitrix24 OAuth2 flow for local server applications.

Flow:
1. User installs app in Bitrix24 → Bitrix sends GET to install_url with code
2. Backend exchanges code for access_token + refresh_token
3. Tokens stored per portal (domain)
4. Tokens refreshed automatically before expiry

Docs: https://apidocs.bitrix24.ru/api-reference/oauth/
"""

import logging
import time
from dataclasses import dataclass, field

import httpx
from app.config import settings

logger = logging.getLogger("bitrix_auth")

# In-memory token store. For production, use a database.
_token_store: dict[str, "BitrixTokens"] = {}


@dataclass
class BitrixTokens:
    domain: str
    access_token: str
    refresh_token: str
    expires_at: float = 0.0
    member_id: str = ""
    scope: str = ""

    @property
    def is_expired(self) -> bool:
        return time.time() >= self.expires_at - 60  # 60s safety margin


def get_tokens(domain: str) -> BitrixTokens | None:
    return _token_store.get(domain)


def store_tokens(domain: str, tokens: BitrixTokens):
    _token_store[domain] = tokens


async def exchange_code(code: str, domain: str, server_endpoint: str | None = None) -> BitrixTokens:
    """Exchange authorization code for tokens."""
    token_url = f"https://{domain}/oauth/token/"
    params = {
        "grant_type": "authorization_code",
        "client_id": settings.BITRIX_CLIENT_ID,
        "client_secret": settings.BITRIX_CLIENT_SECRET,
        "code": code,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(token_url, params=params)
        resp.raise_for_status()
        data = resp.json()

    tokens = BitrixTokens(
        domain=domain,
        access_token=data["access_token"],
        refresh_token=data["refresh_token"],
        expires_at=time.time() + data.get("expires_in", 3600),
        member_id=data.get("member_id", ""),
        scope=data.get("scope", ""),
    )
    store_tokens(domain, tokens)
    logger.info("Stored tokens for portal %s", domain)
    return tokens


async def refresh_tokens(domain: str) -> BitrixTokens:
    """Refresh expired tokens."""
    existing = get_tokens(domain)
    if not existing:
        raise ValueError(f"No tokens for domain {domain}")

    token_url = f"https://{domain}/oauth/token/"
    params = {
        "grant_type": "refresh_token",
        "client_id": settings.BITRIX_CLIENT_ID,
        "client_secret": settings.BITRIX_CLIENT_SECRET,
        "refresh_token": existing.refresh_token,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(token_url, params=params)
        resp.raise_for_status()
        data = resp.json()

    tokens = BitrixTokens(
        domain=domain,
        access_token=data["access_token"],
        refresh_token=data["refresh_token"],
        expires_at=time.time() + data.get("expires_in", 3600),
        member_id=data.get("member_id", existing.member_id),
        scope=data.get("scope", existing.scope),
    )
    store_tokens(domain, tokens)
    return tokens


async def get_valid_token(domain: str) -> str:
    """Get a valid access token, refreshing if needed."""
    tokens = get_tokens(domain)
    if not tokens:
        raise ValueError(f"Portal {domain} not installed")
    if tokens.is_expired:
        tokens = await refresh_tokens(domain)
    return tokens.access_token

"""
Web search enrichment — finds evidence about a lead using DuckDuckGo.

Builds multiple targeted queries per lead (not just "company name + БЫ"):
  - bare brand name
  - brand + category
  - brand + marketplace
  - brand + signal keyword

Evidence is classified by source type and quality score.
"""
from __future__ import annotations

import logging
import re
import time
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.scout.models import Lead

from app.scout.models import Evidence

logger = logging.getLogger(__name__)

# Source type → base quality score
_SOURCE_QUALITY: dict[str, tuple[str, float]] = {
    # (source_type, quality)
    "egr.gov.by": ("registry", 0.95),
    "portal.gov.by": ("registry", 0.90),
    "linkedin.com": ("social", 0.65),
    "wildberries": ("marketplace", 0.75),
    "ozon": ("marketplace", 0.75),
    "onliner.by": ("marketplace", 0.70),
    "deal.by": ("marketplace", 0.65),
    "amazon": ("marketplace", 0.70),
    "tut.by": ("news", 0.55),
    "zerkalo.io": ("news", 0.55),
    "sb.by": ("news", 0.50),
    "belta.by": ("news", 0.60),
    "interfax.by": ("news", 0.60),
    "news": ("news", 0.45),
    "media": ("news", 0.45),
    "press": ("news", 0.45),
}
_DEFAULT_SOURCE = ("unknown", 0.30)


def _classify_url(url: str) -> tuple[str, float]:
    """Return (source_type, quality) for a URL."""
    u = url.lower()
    for keyword, (stype, quality) in _SOURCE_QUALITY.items():
        if keyword in u:
            return stype, quality
    # Rough heuristic: .by official domains score higher
    if ".by/" in u and not any(x in u for x in ["blog", "forum", "comment"]):
        return "catalog", 0.45
    return _DEFAULT_SOURCE


def _build_queries(lead: "Lead") -> list[str]:
    """
    Build up to 4 targeted search queries for a lead.
    Strips legal forms and quotes, tries Russian + English variants,
    marketplace search, and signal-specific queries.
    """
    name = lead.normalized_name or lead.company_name

    # Clean: remove legal form abbreviations and surrounding quotes
    clean = re.sub(
        r'\b(ООО|ЗАО|ОАО|УП|ЧУП|ОДО|ИП|ПК|ЧП)\b', "", name, flags=re.IGNORECASE
    )
    clean = re.sub(r'[«»"\'"\u201c\u201d]', "", clean).strip()
    if not clean:
        clean = name

    queries: list[str] = []

    # 1. Primary: name + Belarus (always)
    queries.append(f"{clean} Беларусь")

    # 2. Brand / product context
    queries.append(f"{clean} бренд продукция производитель")

    # 3. Marketplace presence
    queries.append(f"{clean} wildberries OR ozon OR onliner")

    # 4. Signal-specific or category-specific
    if lead.business_category and lead.business_category not in ("", "other"):
        queries.append(f"{clean} {lead.business_category}")
    elif lead.detected_signal in ("new_brand", "new_product"):
        queries.append(f"{clean} новый продукт запуск")
    elif re.search(r"[A-Za-z]", clean):
        # Latin name — try English search
        queries.append(f"{clean} Belarus brand manufacturer")

    return queries[:4]


def enrich_lead(
    lead: "Lead",
    max_results_per_query: int = 3,
    delay: float = 1.0,
) -> list[Evidence]:
    """
    Search the web for evidence about this lead.

    Returns a list of Evidence objects sorted by quality (best first),
    deduplicated by URL, capped at 10 results.
    """
    try:
        from ddgs import DDGS
    except ImportError:
        try:
            from duckduckgo_search import DDGS  # type: ignore[no-redef]
        except ImportError:
            logger.error("[Search] Neither ddgs nor duckduckgo_search is installed")
            return []

    queries = _build_queries(lead)
    evidence: list[Evidence] = []
    seen_urls: set[str] = set()

    for query in queries:
        logger.debug(f"[Search] {query!r}")
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=max_results_per_query))

            for r in results:
                url = r.get("href") or r.get("link") or r.get("url") or ""
                if not url or url in seen_urls:
                    continue
                seen_urls.add(url)

                source_type, quality = _classify_url(url)
                evidence.append(
                    Evidence(
                        url=url,
                        title=r.get("title", ""),
                        snippet=r.get("body") or r.get("snippet") or "",
                        source_type=source_type,
                        quality=quality,
                    )
                )

            time.sleep(delay)

        except Exception as e:
            logger.warning(f"[Search] Query failed ({query!r}): {e}")
            time.sleep(delay)

    # Sort best first, keep top 10
    evidence.sort(key=lambda e: e.quality, reverse=True)
    return evidence[:10]

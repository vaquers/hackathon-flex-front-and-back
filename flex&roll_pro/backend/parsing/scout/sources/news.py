"""
News Search Source — finds new brands, products, companies via DuckDuckGo news.

Searches for Belarusian FMCG / food / cosmetics / pharma / manufacturing signals.
Signal quality is lower than EGR (0.4), but catches companies EGR misses:
  - existing companies launching new products
  - new brands without recent registration
  - companies with export / retail launch signals

Quality: 0.4 (news sources, unverified)
"""
from __future__ import annotations

import logging
import re
import time
from typing import Iterator

from scout.models import Lead, make_lead_id
from scout.sources.base import BaseSource

logger = logging.getLogger(__name__)

# Each tuple: (query, signal_type)
# Focused on signals relevant for label printing sales
NEWS_QUERIES: list[tuple[str, str]] = [
    # New brands / products
    ("новый бренд Беларусь производство 2026", "new_brand"),
    ("запуск бренда Беларусь 2026", "new_brand"),
    ("новый продукт питания напитки Беларусь 2026", "new_product"),
    ("белорусская косметика новинка 2026", "new_product"),
    ("новая линейка продуктов Беларусь", "new_product"),
    # Manufacturing / production
    ("открытие производства Беларусь 2026", "new_factory"),
    ("запуск завода фабрика Беларусь 2026", "new_factory"),
    ("новое предприятие производство Беларусь", "new_factory"),
    # FMCG / retail / packaging
    ("белорусский производитель FMCG упаковка этикетка 2026", "new_product"),
    ("частная марка private label Беларусь", "new_brand"),
    # Export / market entry
    ("белорусский экспорт новый продукт 2026", "export_signal"),
    ("вывод продукта рынок Беларусь 2026", "new_product"),
    # Specific categories
    ("новый напиток энергетик Беларусь", "new_product"),
    ("белорусская косметика бренд запуск", "new_brand"),
    ("производство БАД добавки Беларусь", "new_product"),
    ("зоотовары корм для животных Беларусь производитель", "new_product"),
    ("бытовая химия производство Беларусь", "new_product"),
]


class NewsSearchSource(BaseSource):
    """
    Searches DuckDuckGo news for signals about new Belarusian companies,
    brands, and product launches relevant to label printing.

    Args:
        results_per_query: Max news results per query
        query_delay: Sleep between queries to avoid rate limiting
    """
    name = "news_search"
    source_type = "news"
    source_quality = 0.4

    def __init__(
        self,
        results_per_query: int = 5,
        query_delay: float = 4.0,
    ) -> None:
        self.results_per_query = results_per_query
        self.query_delay = query_delay

    def fetch_candidates(self, **kwargs) -> Iterator[Lead]:
        try:
            from ddgs import DDGS
        except ImportError:
            try:
                from duckduckgo_search import DDGS  # type: ignore[no-redef]
            except ImportError:
                logger.error("[News] Neither ddgs nor duckduckgo_search is installed")
                return

        seen_urls: set[str] = set()

        for query, signal in NEWS_QUERIES:
            logger.info(f"[News] Query: {query!r}")
            try:
                with DDGS() as ddgs:
                    results = list(
                        ddgs.news(query, max_results=self.results_per_query)
                    )

                for r in results:
                    url = r.get("url", "")
                    if not url or url in seen_urls:
                        continue
                    seen_urls.add(url)

                    title = r.get("title", "")
                    body = r.get("body", "")
                    source = r.get("source", "")
                    pub_date = r.get("date", "")

                    # Extract a best-guess company/brand name from title
                    company_hint = _extract_entity_hint(title, body)
                    if not company_hint:
                        company_hint = title[:60]

                    description = f"{title}. {body[:400]}"

                    lead = Lead(
                        id=make_lead_id("news_search", url),
                        company_name=company_hint,
                        normalized_name=company_hint,
                        source_name="news_search",
                        source_type="news",
                        source_url=url,
                        source_quality=0.4,
                        detected_signal=signal,
                        signal_description=(
                            f"Найдено в новостях ({source}, {pub_date}): {title[:120]}"
                        ),
                        country="BY",
                        description=description,
                        raw_data={
                            "query": query,
                            "signal": signal,
                            "title": title,
                            "body": body,
                            "source": source,
                            "date": pub_date,
                            "url": url,
                        },
                    )
                    yield lead

                time.sleep(self.query_delay)

            except Exception as e:
                logger.warning(f"[News] Query failed ({query!r}): {e}")
                time.sleep(self.query_delay * 2)


def _extract_entity_hint(title: str, body: str) -> str:
    """
    Heuristic: extract a potential company/brand name from news text.

    Preference order:
    1. Text in quotes (often brand names in Russian news)
    2. Capitalized multi-word sequences
    3. Empty string if nothing found
    """
    # Pattern 1: text in Russian-style quotes «...» or "..."
    quoted = re.findall(r'[«""]([А-ЯA-Zа-яa-z][^»""]{2,40})[»""]', title)
    if quoted:
        candidate = quoted[0].strip()
        if len(candidate) >= 3:
            return candidate

    # Pattern 2: Latin brand names (e.g., "DrinkCo", "GreenBrand")
    latin = re.findall(r'\b([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,})?)\b', title)
    if latin:
        return latin[0].strip()

    # Pattern 3: Cyrillic proper nouns (capitalized, 4+ chars, not sentence start)
    words = title.split()
    for i, w in enumerate(words[1:], 1):  # skip first word (sentence start)
        w_clean = w.strip('.,!?;:()')
        if w_clean and w_clean[0].isupper() and len(w_clean) >= 4 and not w_clean.isupper():
            return w_clean

    return ""

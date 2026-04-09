"""
EGR Source — fetches new company registrations from egr.gov.by API.

Signal: new_registration
Quality: 0.9 (official government registry)
"""
from __future__ import annotations

import json
import logging
import re
import time
from datetime import date, timedelta
from typing import Any, Iterator

import requests

from app.scout.models import Lead, make_lead_id
from app.scout.sources.base import BaseSource

logger = logging.getLogger(__name__)

EGR_API_URL = "http://egr.gov.by/api/v2/egr/getShortInfoByPeriod"
HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "Mozilla/5.0",
    "Connection": "close",
}
TIMEOUT = 60
MAX_RETRIES = 2

# Legal form abbreviations for cleaner names
_LEGAL_FORMS = {
    r"общество\s+с\s+ограниченной\s+ответственностью": "ООО",
    r"открытое\s+акционерное\s+общество": "ОАО",
    r"закрытое\s+акционерное\s+общество": "ЗАО",
    r"частное\s+унитарное\s+предприятие": "ЧУП",
    r"унитарное\s+предприятие": "УП",
    r"частное\s+предприятие": "ЧП",
    r"производственный\s+кооператив": "ПК",
    r"общество\s+с\s+дополнительной\s+ответственностью": "ОДО",
    r"индивидуальный\s+предприниматель": "ИП",
}


def _clean_name(name: str) -> str:
    """Replace full legal form names with short abbreviations."""
    if not name:
        return ""
    result = name.strip()
    for pattern, abbr in _LEGAL_FORMS.items():
        result = re.sub(pattern, abbr, result, flags=re.IGNORECASE)
    return result


def _extract_json_objects(text: str) -> list[dict[str, Any]]:
    """Handle API responses that return concatenated JSON objects instead of an array."""
    decoder = json.JSONDecoder()
    idx = 0
    items: list[dict[str, Any]] = []
    while idx < len(text):
        while idx < len(text) and text[idx].isspace():
            idx += 1
        if idx >= len(text):
            break
        obj, end = decoder.raw_decode(text, idx)
        if isinstance(obj, dict):
            items.append(obj)
        idx = end
    return items


def _format_date(value: str) -> str:
    """Convert ISO timestamp to YYYY.MM.DD."""
    if not value:
        return ""
    try:
        from datetime import datetime
        value = value.replace("Z", "+00:00")
        dt = datetime.fromisoformat(value)
        return dt.strftime("%Y.%m.%d")
    except Exception:
        pass
    if "T" in value:
        return value.split("T")[0].replace("-", ".")
    return value.replace("-", ".")


def _iter_date_range(start_date: date, end_date: date) -> Iterator[date]:
    current = start_date
    while current <= end_date:
        yield current
        current += timedelta(days=1)


class EGRSource(BaseSource):
    """
    Fetches company registrations from the Belarusian EGR registry.

    Args:
        days_back: How many days back to fetch (default 1 = yesterday + today)
        only_active: Skip non-active registrations
        only_legal_entities: Skip individual entrepreneurs
    """
    name = "egr"
    source_type = "registry"
    source_quality = 0.9

    def __init__(
        self,
        days_back: int = 1,
        only_active: bool = True,
        only_legal_entities: bool = False,
    ) -> None:
        self.days_back = days_back
        self.only_active = only_active
        self.only_legal_entities = only_legal_entities

    def fetch_candidates(
        self,
        start_date: date | None = None,
        end_date: date | None = None,
        **kwargs,
    ) -> Iterator[Lead]:
        if end_date is None:
            end_date = date.today()
        if start_date is None:
            start_date = end_date - timedelta(days=self.days_back)

        logger.info(f"[EGR] Fetching {start_date} → {end_date} (day-by-day)")

        seen_ids: set[str] = set()
        for current_date in _iter_date_range(start_date, end_date):
            try:
                raw = self._fetch(current_date, current_date)
                logger.info(f"[EGR] {current_date}: got {len(raw)} raw records")
            except Exception as e:
                logger.error(f"[EGR] API error for {current_date}: {e}")
                continue

            for item in raw:
                try:
                    lead = self._to_lead(item)
                    if lead and lead.id not in seen_ids:
                        seen_ids.add(lead.id)
                        yield lead
                except Exception as e:
                    logger.warning(f"[EGR] Normalize failed: {e} — {item}")

            if current_date < end_date:
                time.sleep(1.0)

    def _fetch(self, start_date: date, end_date: date) -> list[dict]:
        url = f"{EGR_API_URL}/{start_date.strftime('%d.%m.%Y')}/{end_date.strftime('%d.%m.%Y')}"
        last_exc: Exception | None = None

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
                resp.raise_for_status()
                text = resp.text.strip()
                if not text:
                    return []
                try:
                    data = json.loads(text)
                    if isinstance(data, list):
                        return [x for x in data if isinstance(x, dict)]
                    if isinstance(data, dict):
                        return [data]
                except json.JSONDecodeError:
                    pass
                return _extract_json_objects(text)
            except Exception as e:
                last_exc = e
                logger.warning(f"[EGR] Attempt {attempt}/{MAX_RETRIES} failed for {url}: {e}")
                if attempt < MAX_RETRIES:
                    time.sleep(5)

        raise last_exc if last_exc else RuntimeError("Unknown EGR fetch error")

    def _to_lead(self, item: dict) -> Lead | None:
        status_obj = item.get("nsi00219") or {}
        status = status_obj.get("vnsostk", "").strip()

        if self.only_active and status.lower() != "действующий":
            return None

        full_name = _clean_name(item.get("vnaim", ""))
        short_name = _clean_name(item.get("vfn", "") or item.get("vn", ""))
        person_name = item.get("vfio", "")
        reg_num = str(item.get("ngrn", "")).strip()
        reg_date = _format_date(item.get("dfrom", ""))

        is_legal = bool(full_name)
        if self.only_legal_entities and not is_legal:
            return None

        display_name = full_name or person_name or short_name
        normalized_name = short_name or full_name or person_name

        if not display_name:
            return None

        # Strip surrounding typographic and ASCII quotes
        normalized_name = re.sub(
            r'^[\s«»"\'""\u201c\u201d]+|[\s«»"\'""\u201c\u201d]+$', '', normalized_name
        )
        if not normalized_name:
            normalized_name = display_name

        return Lead(
            id=make_lead_id("egr", reg_num or display_name),
            company_name=display_name,
            normalized_name=normalized_name,
            source_name="egr",
            source_type="registry",
            source_url=f"https://egr.gov.by/egrn/registration.jsp?unp={reg_num}",
            source_quality=0.9,
            detected_signal="new_registration",
            signal_description=f"Новая регистрация в ЕГР: {display_name}, дата: {reg_date}",
            country="BY",
            legal_form="company" if is_legal else "individual",
            raw_data={
                "reg_num": reg_num,
                "reg_date": reg_date,
                "status": status,
                "full_name": full_name,
                "short_name": short_name,
                "person_name": person_name,
            },
        )

import csv
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import requests


BASE_URL = "http://egr.gov.by/api/v2/egr"
HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "Mozilla/5.0",
    "Connection": "close",
}
TIMEOUT = 60

# Настройки под твою задачу
ONLY_ACTIVE = False        # только действующие
ONLY_LEGAL_ENTITIES = False # только юрлица, без ИП/физлиц
REMOVE_DUPLICATES = True   # убирать дубли по reg_num


def extract_json_objects(text: str) -> list[dict[str, Any]]:
    """
    Парсит ответ, если API вернул не JSON-массив, а несколько JSON-объектов подряд.
    """
    decoder = json.JSONDecoder()
    idx = 0
    length = len(text)
    items: list[dict[str, Any]] = []

    while idx < length:
        while idx < length and text[idx].isspace():
            idx += 1

        if idx >= length:
            break

        obj, end = decoder.raw_decode(text, idx)
        if isinstance(obj, dict):
            items.append(obj)
        idx = end

    return items


def format_api_date(value: str) -> str:
    """
    2026-04-06T21:00:00.000+00:00 -> 2026.04.06
    """
    if not value:
        return ""

    try:
        value = value.replace("Z", "+00:00")
        dt = datetime.fromisoformat(value)
        return dt.strftime("%Y.%m.%d")
    except Exception:
        pass

    if "T" in value:
        date_part = value.split("T", 1)[0]
        return date_part.replace("-", ".")

    return value.replace("-", ".")


def fetch_short_info_by_period(start_date: str, end_date: str) -> list[dict[str, Any]]:
    url = f"{BASE_URL}/getShortInfoByPeriod/{start_date}/{end_date}"
    response = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
    response.raise_for_status()

    text = response.text.strip()
    if not text:
        return []

    # 1. Пробуем как обычный JSON
    try:
        data = json.loads(text)

        if isinstance(data, list):
            return [item for item in data if isinstance(item, dict)]

        if isinstance(data, dict):
            return [data]
    except json.JSONDecodeError:
        pass

    # 2. Пробуем как поток JSON-объектов
    return extract_json_objects(text)


def normalize_company(item: dict[str, Any]) -> dict[str, Any]:
    status_obj = item.get("nsi00219") or {}

    reg_num = item.get("ngrn", "")
    full_name = item.get("vnaim", "")
    short_name = item.get("vfn", "") or item.get("vn", "")
    person_name = item.get("vfio", "")
    status = status_obj.get("vnsostk", "")

    entity_type = "company" if full_name else "person"

    display_name = full_name or person_name or short_name

    return {
        "reg_num": reg_num,
        "reg_date": format_api_date(item.get("dfrom", "")),
        "status": status,
        "entity_type": entity_type,
        "name": full_name,
        "short_name": short_name,
        "person_name": person_name,
        "display_name": display_name,
        "raw": json.dumps(item, ensure_ascii=False),
    }


def is_active(item: dict[str, Any]) -> bool:
    status = ((item.get("nsi00219") or {}).get("vnsostk") or "").strip().lower()
    return status == "действующий"


def is_legal_entity(item: dict[str, Any]) -> bool:
    return bool(item.get("vnaim"))


def deduplicate_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    result: list[dict[str, Any]] = []

    for row in rows:
        reg_num = str(row.get("reg_num", "")).strip()

        # если номера нет, просто оставляем запись
        if not reg_num:
            result.append(row)
            continue

        if reg_num not in seen:
            seen.add(reg_num)
            result.append(row)

    return result


def save_csv(rows: list[dict[str, Any]], output_file: str) -> None:
    if not rows:
        print("Нет данных для сохранения")
        return

    fieldnames = [
        "reg_num",
        "reg_date",
        "status",
        "entity_type",
        "name",
        "short_name",
        "person_name",
        "display_name",
        "raw",
    ]

    with open(output_file, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Сохранено: {output_file}")


def main() -> None:
    # По умолчанию: вчера-сегодня
    end_dt = datetime.now()
    start_dt = end_dt - timedelta(days=1)

    start_date = start_dt.strftime("%d.%m.%Y")
    end_date = end_dt.strftime("%d.%m.%Y")

    print(f"Забираю данные за период: {start_date} - {end_date}")

    try:
        raw_items = fetch_short_info_by_period(start_date, end_date)
    except requests.RequestException as e:
        print(f"Ошибка сети: {e}")
        return
    except Exception as e:
        print(f"Ошибка при получении данных: {e}")
        return

    print(f"Получено сырых объектов: {len(raw_items)}")

    filtered_items = raw_items

    if ONLY_ACTIVE:
        filtered_items = [item for item in filtered_items if is_active(item)]

    if ONLY_LEGAL_ENTITIES:
        filtered_items = [item for item in filtered_items if is_legal_entity(item)]

    print(f"После фильтрации осталось: {len(filtered_items)}")

    rows = [normalize_company(item) for item in filtered_items]

    if REMOVE_DUPLICATES:
        before = len(rows)
        rows = deduplicate_rows(rows)
        print(f"После удаления дублей: {len(rows)} (было {before})")

    output_dir = Path(".")
    output_file = output_dir / f"egr_leads_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    save_csv(rows, str(output_file))


if __name__ == "__main__":
    main()
import csv
import json
import re
from datetime import datetime, timedelta

import requests


BASE_URL = "http://egr.gov.by/api/v2/egr"
HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "User-Agent": "Mozilla/5.0",
    "Connection": "close",
}


def extract_json_objects(text: str):
    decoder = json.JSONDecoder()
    idx = 0
    length = len(text)

    while idx < length:
        while idx < length and text[idx].isspace():
            idx += 1
        if idx >= length:
            break

        obj, end = decoder.raw_decode(text, idx)
        yield obj
        idx = end


def fetch_short_info_by_period(start_date: str, end_date: str):
    url = f"{BASE_URL}/getShortInfoByPeriod/{start_date}/{end_date}"
    r = requests.get(url, headers=HEADERS, timeout=60)
    r.raise_for_status()

    text = r.text.strip()

    # 1. сначала пробуем как обычный JSON
    try:
        data = json.loads(text)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return [data]
    except Exception:
        pass

    # 2. если это поток JSON-объектов
    try:
        return list(extract_json_objects(text))
    except Exception as e:
        raise RuntimeError(f"Не удалось распарсить ответ API: {e}")


def normalize_company(item: dict) -> dict:
    status_obj = item.get("nsi00219") or {}

    name = item.get("vnaim") or item.get("vn") or item.get("vfn") or ""
    person = item.get("vfio") or ""

    return {
        "reg_num": item.get("ngrn", ""),
        "date_from": item.get("dfrom", ""),
        "status": status_obj.get("vnsostk", ""),
        "status_code": item.get("nksost", ""),
        "name": name,
        "short_name": item.get("vfn", ""),
        "display_name": person if person else name,
        "person_name": person,
        "raw": json.dumps(item, ensure_ascii=False),
    }


def save_csv(rows, filename="egr_leads.csv"):
    if not rows:
        print("Пустой результат")
        return

    with open(filename, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    print(f"Сохранено: {filename}")


if __name__ == "__main__":
    end_dt = datetime.now()
    start_dt = end_dt - timedelta(days=1)

    start_date = start_dt.strftime("%d.%m.%Y")
    end_date = end_dt.strftime("%d.%m.%Y")

    print(f"Забираю данные за период: {start_date} - {end_date}")

    items = fetch_short_info_by_period(start_date, end_date)
    print(f"Получено объектов: {len(items)}")

    rows = [normalize_company(x) for x in items]
    save_csv(rows)
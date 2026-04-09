import csv
import json
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

    try:
        data = json.loads(text)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return [data]
    except Exception:
        pass

    return list(extract_json_objects(text))


def format_egr_date(value: str) -> str:
    """
    Преобразует:
    2026-04-06T21:00:00.000+00:00 -> 2026.04.06
    """
    if not value:
        return ""

    try:
        # Z -> +00:00, если вдруг встретится
        value = value.replace("Z", "+00:00")
        dt = datetime.fromisoformat(value)
        return dt.strftime("%Y.%m.%d")
    except Exception:
        pass

    # запасной вариант: просто взять дату до T
    if "T" in value:
        date_part = value.split("T", 1)[0]
        try:
            dt = datetime.strptime(date_part, "%Y-%m-%d")
            return dt.strftime("%Y.%m.%d")
        except Exception:
            return date_part.replace("-", ".")

    return value


def normalize_company(item: dict) -> dict:
    status_obj = item.get("nsi00219") or {}

    name = item.get("vnaim") or item.get("vn") or item.get("vfn") or ""
    person = item.get("vfio") or ""

    return {
        "reg_num": item.get("ngrn", ""),
        "reg_date": format_egr_date(item.get("dfrom", "")),
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

    rows = [
    normalize_company(x)
    for x in items
    if (x.get("nsi00219") or {}).get("vnsostk") == "Действующий"
    and x.get("vnaim")  # только юрлица
    ]
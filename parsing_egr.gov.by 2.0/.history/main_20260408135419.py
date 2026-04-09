import csv
import json
import sys
from datetime import datetime, timedelta
from typing import Any, Dict, List, Union

import requests


BASE_URL = "http://egr.gov.by/api/v2/egr"
TIMEOUT = 60


def safe_get(url: str) -> Union[dict, list, str]:
    resp = requests.get(
        url,
        timeout=TIMEOUT,
        headers={
            "Accept": "application/json, text/plain, */*",
            "User-Agent": "Mozilla/5.0 (compatible; EGRClient/1.0)"
        },
    )
    resp.raise_for_status()

    content_type = (resp.headers.get("Content-Type") or "").lower()

    if "application/json" in content_type or "text/json" in content_type:
        return resp.json()

    text = resp.text.strip()

    # Иногда серверы отдают JSON с text/plain
    try:
        return json.loads(text)
    except Exception:
        return text


def date_str(dt: datetime) -> str:
    return dt.strftime("%d.%m.%Y")


def fetch_short_info_by_period(start_date: str, end_date: str) -> Any:
    url = f"{BASE_URL}/getShortInfoByPeriod/{start_date}/{end_date}"
    return safe_get(url)


def fetch_base_info_by_regnum(reg_num: str) -> Any:
    url = f"{BASE_URL}/getBaseInfoByRegNum/{reg_num}"
    return safe_get(url)


def normalize_list_payload(payload: Any) -> List[Dict[str, Any]]:
    """
    Приводим разные возможные форматы ответа к списку словарей.
    """
    if isinstance(payload, list):
        return [x for x in payload if isinstance(x, dict)]

    if isinstance(payload, dict):
        # Частые варианты упаковки
        for key in ("data", "items", "result", "results", "content"):
            value = payload.get(key)
            if isinstance(value, list):
                return [x for x in value if isinstance(x, dict)]

        # Если API вдруг вернул один объект
        return [payload]

    return []


def pick_value(item: Dict[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in item and item[key] not in (None, ""):
            return item[key]
    return ""


def flatten_company(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Так как точная схема ответа пока не подтверждена, пытаемся вытащить
    самые типовые поля из возможных имён.
    """
    return {
        "reg_num": pick_value(item, "regNum", "regnum", "unp", "id"),
        "name": pick_value(item, "name", "fullName", "shortName", "fio"),
        "status": pick_value(item, "status", "state"),
        "reg_date": pick_value(item, "regDate", "dateReg", "registrationDate"),
        "address": pick_value(item, "address", "fullAddress"),
        "head": pick_value(item, "head", "director", "manager"),
        "phone": pick_value(item, "phone", "tel", "telephone"),
        "email": pick_value(item, "email", "mail"),
        "raw": json.dumps(item, ensure_ascii=False),
    }


def save_to_csv(rows: List[Dict[str, Any]], path: str) -> None:
    if not rows:
        print("Нет строк для сохранения")
        return

    fieldnames = list(rows[0].keys())
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    # По умолчанию берём вчера-сегодня
    end_dt = datetime.now()
    start_dt = end_dt - timedelta(days=1)

    if len(sys.argv) == 3:
        start_date = sys.argv[1]  # формат dd.mm.yyyy
        end_date = sys.argv[2]
    else:
        start_date = date_str(start_dt)
        end_date = date_str(end_dt)

    print(f"Забираю данные за период: {start_date} - {end_date}")

    try:
        payload = fetch_short_info_by_period(start_date, end_date)
    except requests.HTTPError as e:
        print(f"HTTP ошибка: {e}")
        return
    except requests.RequestException as e:
        print(f"Ошибка сети: {e}")
        return
    except Exception as e:
        print(f"Неожиданная ошибка: {e}")
        return

    print("Тип ответа:", type(payload).__name__)

    if isinstance(payload, str):
        print("Сервер вернул не JSON. Первые 1000 символов:")
        print(payload[:1000])
        return

    items = normalize_list_payload(payload)
    print(f"Найдено записей: {len(items)}")

    rows = [flatten_company(x) for x in items]
    save_to_csv(rows, "egr_new_registrations.csv")
    print("Сохранено в egr_new_registrations.csv")

    # Если хочешь, можно дополнительно дотягивать подробности по reg_num:
    enriched_rows = []
    for row in rows[:20]:  # сначала ограничим 20 для теста
        reg_num = row.get("reg_num")
        if not reg_num:
            enriched_rows.append(row)
            continue

        try:
            details = fetch_base_info_by_regnum(str(reg_num))
            row["base_info_raw"] = json.dumps(details, ensure_ascii=False)
        except Exception as e:
            row["base_info_raw"] = f"ERROR: {e}"

        enriched_rows.append(row)

    save_to_csv(enriched_rows, "egr_new_registrations_enriched.csv")
    print("Сохранено в egr_new_registrations_enriched.csv")


if __name__ == "__main__":
    main()
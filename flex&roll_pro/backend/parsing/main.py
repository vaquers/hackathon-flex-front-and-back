#!/usr/bin/env python3
"""
AI-Scout — Lead intelligence for Flex and Roll Pro (Беларусь).

Usage:
  python main.py                        # EGR за последние 30 дней + новости, полный анализ
  python main.py --days 7               # EGR за последние 7 дней
  python main.py --source egr           # Только EGR
  python main.py --source news          # Только новости
  python main.py --limit 20             # Не более 20 лидов (для теста)
  python main.py --no-cache             # Игнорировать кеш, анализировать заново
  python main.py --brief                # Сгенерировать текстовый бриф после анализа
  python main.py --output /path/to/dir  # Другая директория для результатов

Результаты:
  data/leads.csv   — таблица для менеджеров (сортировка по score)
  data/leads.json  — полные данные для интеграции
  data/scout.log   — лог работы
"""
from __future__ import annotations

import argparse
import itertools
import logging
import sys
from datetime import date, timedelta
from pathlib import Path


def _setup_logging(verbose: bool, data_dir: Path) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    fmt = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    data_dir.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=level,
        format=fmt,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(data_dir / "scout.log", mode="a", encoding="utf-8"),
        ],
    )


def main() -> None:
    from scout.config import OPENROUTER_API_KEY, DEFAULT_MODEL, DEFAULT_SEARCH_DEPTH, DATA_DIR

    parser = argparse.ArgumentParser(
        prog="main.py",
        description="AI-Scout — Lead intelligence for Flex and Roll Pro",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--source",
        choices=["egr", "news", "all"],
        default="all",
        help="Источник лидов: egr, news или all (default: all)",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=30,
        help="Сколько дней назад смотреть в EGR (default: 30)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Максимум лидов для обработки (default: без ограничений)",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"LLM модель через OpenRouter (default: {DEFAULT_MODEL})",
    )
    parser.add_argument(
        "--search-depth",
        type=int,
        default=DEFAULT_SEARCH_DEPTH,
        dest="search_depth",
        help=f"Результатов веб-поиска на лид (default: {DEFAULT_SEARCH_DEPTH})",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        dest="no_cache",
        help="Игнорировать кеш, анализировать заново",
    )
    parser.add_argument(
        "--brief",
        action="store_true",
        help="Сгенерировать текстовый бриф после завершения анализа",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help=f"Директория для результатов (default: {DATA_DIR})",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Подробный лог (DEBUG)",
    )

    args = parser.parse_args()
    data_dir = args.output or DATA_DIR
    _setup_logging(args.verbose, data_dir)

    if not OPENROUTER_API_KEY:
        print("[!] OPENROUTER_API_KEY не задан.")
        print("    Скопируй .env.example → .env и добавь ключ.")
        sys.exit(1)

    from scout.sources.egr import EGRSource
    from scout.sources.news import NewsSearchSource
    from scout.pipeline import run_pipeline

    streams = []

    if args.source in ("all", "egr"):
        end_date = date.today()
        start_date = end_date - timedelta(days=args.days)
        egr = EGRSource(only_active=True)
        streams.append(egr.fetch_candidates(start_date=start_date, end_date=end_date))
        print(f"[+] EGR: {start_date.strftime('%d.%m.%Y')} → {end_date.strftime('%d.%m.%Y')}")

    if args.source in ("all", "news"):
        news = NewsSearchSource(results_per_query=4)
        streams.append(news.fetch_candidates())
        print("[+] Новости: DuckDuckGo")

    leads = run_pipeline(
        lead_stream=itertools.chain(*streams),
        output_dir=data_dir,
        model=args.model,
        search_depth=args.search_depth,
        limit=args.limit,
        use_cache=not args.no_cache,
    )

    print(f"[+] Результаты: {data_dir}/leads.csv  и  {data_dir}/leads.json")

    if args.brief and leads:
        from scout.exporters.brief import generate_brief
        brief = generate_brief(leads, top_n=10)
        print(brief)
        brief_file = data_dir / f"brief_{date.today().isoformat()}.txt"
        brief_file.write_text(brief, encoding="utf-8")
        print(f"[+] Бриф: {brief_file}")


if __name__ == "__main__":
    main()

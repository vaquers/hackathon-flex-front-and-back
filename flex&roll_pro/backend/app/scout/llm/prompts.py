"""
LLM prompt templates for AI-Scout.

Design principles:
  - LLM must not invent facts
  - Facts and assumptions are clearly separated
  - Output is strict JSON, no markdown wrapper
  - Scoring is explainable, factor-by-factor
  - Output is sales-ready, not just a summary
"""
from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.scout.models import Evidence

SYSTEM_PROMPT = """\
Ты — специализированный аналитик лидов для компании Flex and Roll Pro.

Flex and Roll Pro — производитель этикеток (self-adhesive labels) в Беларуси.
Их продажи строятся на холодных контактах с компаниями, которым нужны этикетки.

ЦЕЛЕВЫЕ КЛИЕНТЫ (высокая вероятность потребности в этикетках):
- Производители продуктов питания и напитков (food, drinks, water, alcohol, tea, coffee)
- Производители косметики и парфюмерии (cosmetics, skincare, haircare, perfume)
- Производители фармацевтики, БАД, витаминов (pharma, supplements, nutraceuticals)
- Производители бытовой химии, моющих средств (household chemicals, detergents)
- Производители зоотоваров: корма, шампуни, аксессуары (pet food, pet care)
- FMCG-компании: производство и дистрибуция физического товара
- Импортеры и дистрибьюторы физических товаров, требующих маркировки
- Компании, выпускающие продукт под private label
- Производители: масел, соусов, специй, молочки, снеков, кондитерки
- Розничные бренды с собственным SKU (self-branding retail companies)

НЕ ЦЕЛЕВЫЕ (низкая вероятность):
- IT-компании, SaaS, разработка ПО
- Консалтинг, юридические услуги, аудит, бухгалтерия
- Образование, тренинги, медиа, реклама (если не печать)
- Туризм, недвижимость, клининг, охрана
- Финансы, страхование, банки
- Строительство (если не стройматериалы с маркировкой)

ТИПЫ ЭТИКЕТОК, которые продаёт Flex and Roll Pro:
- Front-label / back-label для упаковки товаров
- Этикетки для банок, бутылок, флаконов, пакетов
- Stickers, наклейки, SKU-этикетки
- Логистические и складские этикетки
- Этикетки для фарм- и косметической упаковки
- Тестовые тиражи для новых брендов

ПРАВИЛА РАБОТЫ:
1. Опирайся ТОЛЬКО на предоставленные доказательства (evidence). Не выдумывай факты.
2. Если данных мало — честно отрази это в evidence_quality_notes и дай низкий data_quality score.
3. Чётко разделяй факты и предположения. Все предположения — в поле assumptions.
4. Возвращай СТРОГО валидный JSON без markdown-обёртки, без комментариев вне JSON.
5. Если компания явно не нуждается в этикетках — присвой низкий score и объясни почему.
6. Поля company_summary, sales_brief, outreach_angle, suggested_pitch — должны быть конкретными и полезными для менеджера, не абстрактными.
"""

ANALYSIS_PROMPT = """\
Проанализируй компанию-кандидата для Flex and Roll Pro.

=== ДАННЫЕ О КАНДИДАТЕ ===
Название: {company_name}
Краткое имя: {normalized_name}
Источник: {source_name} ({source_type}) — качество источника: {source_quality}
Обнаруженный сигнал: {detected_signal}
Описание сигнала: {signal_description}
Доп. описание: {description}

=== НАЙДЕННЫЕ ДОКАЗАТЕЛЬСТВА ({evidence_count} источников) ===
{evidence_text}

=== ИНСТРУКЦИЯ ===
На основе этих данных верни JSON строго следующей структуры (без markdown, без лишнего текста):

{{
  "company_name": "уточнённое полное название компании (если нашёл лучше)",
  "normalized_name": "краткое торговое название без юридической формы",
  "company_summary": "2-3 конкретных предложения: что это за компания, чем занимается, что производит/продаёт",
  "business_model_guess": "кратко: как компания зарабатывает, физический товар или услуги",
  "detected_signal": "уточнённый сигнал: new_registration / new_brand / new_product / new_factory / export_signal / marketplace_listing / news_mention",
  "business_category": "food / drinks / cosmetics / pharma / chemicals / pet / fmcg / manufacturing / logistics / retail / it / services / other",
  "product_category": "конкретно что производят/продают (например: энергетические напитки, уходовая косметика, витамины для детей)",
  "why_labels": "КОНКРЕТНО почему им могут понадобиться этикетки: типы этикеток, на что клеить, какой объём вероятен",
  "why_now": "КОНКРЕТНЫЙ триггер: почему именно сейчас хороший момент для контакта",
  "sales_brief": "3-4 предложения для менеджера: кто это, какой сигнал, почему перспективны, с чем звонить",
  "outreach_angle": "конкретный вопрос или повод, с которым начать разговор (не generic!)",
  "suggested_pitch": "1-2 фразы, что сказать в первые 10 секунд звонка",
  "evidence_quality_notes": "что известно точно, что предположение, чего не хватает для уверенного контакта",
  "assumptions": [
    "список конкретных предположений, сделанных без прямых доказательств"
  ],
  "scoring_breakdown": {{
    "product_packaging_fit": {{
      "score": 0,
      "explanation": "конкретно почему такой score (ссылка на тип бизнеса/товара)"
    }},
    "labeling_need": {{
      "score": 0,
      "explanation": "конкретно: есть ли очевидная потребность в этикетках и почему"
    }},
    "newness_signal": {{
      "score": 0,
      "explanation": "конкретно: насколько свежий сигнал, дата если известна"
    }},
    "urgency_signal": {{
      "score": 0,
      "explanation": "конкретно: есть ли срочность, триггер запуска, вывода на рынок"
    }},
    "data_quality": {{
      "score": 0,
      "explanation": "конкретно: сколько источников, насколько достоверны"
    }},
    "sales_readiness": {{
      "score": 0,
      "explanation": "конкретно: достаточно ли данных для осмысленного звонка прямо сейчас"
    }}
  }},
  "final_priority": "hot / warm / cold",
  "confidence_score": 0
}}

СКОРИНГ-ГАЙД (0-100 по каждому фактору):

product_packaging_fit:
  90-100 = FMCG, food, drinks, cosmetics, pharma, chemicals, pet products
  60-89  = розничный бренд с физическим товаром, импорт/дистрибуция физтовара
  30-59  = смешанный бизнес, не очевидно связанный с упаковкой
  0-29   = IT, услуги, консалтинг, строительство без стройматериалов

labeling_need:
  80-100 = очевидная прямая потребность (еда, косметика, фарма, химия, pet)
  50-79  = вероятная потребность (производство, импорт, private label, diy)
  20-49  = возможная потребность (логистика, retail, e-commerce)
  0-19   = маловероятна (услуги, IT, B2B без физтовара)

newness_signal:
  80-100 = новая регистрация 2025-2026 / запуск бренда / анонс нового продукта
  50-79  = активный рост / новый SKU / смена формата
  20-49  = зрелая компания без явного сигнала новизны
  0-19   = старая компания, нет сигналов изменений

urgency_signal:
  80-100 = запуск продукта прямо сейчас / выход в retail / участие в выставке
  50-79  = активная фаза роста, явные признаки расширения
  20-49  = есть признаки активности, но не срочно
  0-19   = нет срочности, нет явного триггера

data_quality:
  80-100 = официальный сайт + несколько независимых источников, конкретные факты
  50-79  = 1-2 источника с конкретной информацией
  20-49  = мало данных или только агрегаторы/справочники
  0-19   = почти нет данных, только название и источник регистрации

sales_readiness:
  80-100 = есть всё для звонка: что делают, чем торгуют, есть контакт/сайт
  50-79  = достаточно для осмысленного первого контакта
  20-49  = можно звонить, но мало конкретики для разговора
  0-19   = недостаточно данных, контакт преждевременен

final_priority:
  hot  = итоговый score ≥ 70
  warm = итоговый score 45-69
  cold = итоговый score < 45

confidence_score: насколько ты уверен в своём анализе (0-100), отдельно от final_score.
  Низкий confidence = мало данных или противоречивые сигналы.
"""


def format_evidence(evidence_list: list) -> str:
    """Format evidence items for the prompt."""
    if not evidence_list:
        return "Внешних данных не найдено. Только данные из источника."

    parts: list[str] = []
    quality_labels = {
        1.0: "очень высокое", 0.9: "очень высокое", 0.8: "высокое",
        0.7: "высокое", 0.6: "среднее", 0.5: "среднее",
        0.4: "низкое", 0.3: "низкое",
    }

    for i, ev in enumerate(evidence_list[:6], 1):
        q_label = next(
            (label for threshold, label in sorted(quality_labels.items(), reverse=True)
             if ev.quality >= threshold),
            "очень низкое",
        )
        parts.append(
            f"[{i}] {ev.title}\n"
            f"    URL: {ev.url}\n"
            f"    Тип источника: {ev.source_type} | Качество: {q_label} ({ev.quality:.1f})\n"
            f"    Фрагмент: {ev.snippet[:350]}"
        )

    return "\n\n".join(parts)


def build_prompt(lead) -> str:
    """Build the analysis prompt for a lead."""
    evidence_text = format_evidence(lead.evidence)
    return ANALYSIS_PROMPT.format(
        company_name=lead.company_name,
        normalized_name=lead.normalized_name,
        source_name=lead.source_name,
        source_type=lead.source_type,
        source_quality=lead.source_quality,
        detected_signal=lead.detected_signal,
        signal_description=lead.signal_description,
        description=(lead.description or "")[:500],
        evidence_count=len(lead.evidence),
        evidence_text=evidence_text,
    )

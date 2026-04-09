"""
Daily brief formatter — generates a human-readable morning summary
for the sales team showing today's top leads with actionable context.
"""
from __future__ import annotations

from datetime import date
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from scout.models import Lead

_TIER_EMOJI = {"hot": "🔥", "warm": "🟡", "cold": "🔵"}
_TIER_RU = {"hot": "HOT — звонить первыми", "warm": "WARM — позвонить сегодня", "cold": "COLD — список ожидания"}


def generate_brief(leads: "List[Lead]", top_n: int = 10) -> str:
    today_str = date.today().strftime("%d.%m.%Y")
    hot = [l for l in leads if l.priority_tier == "hot"]
    warm = [l for l in leads if l.priority_tier == "warm"]
    cold = [l for l in leads if l.priority_tier == "cold"]

    sorted_leads = sorted(leads, key=lambda l: l.final_score, reverse=True)
    top = sorted_leads[:top_n]

    lines = [
        "=" * 65,
        f"  AI-SCOUT — ДНЕВНОЙ БРИФ  {today_str}",
        "=" * 65,
        "",
        f"  Сегодня позвонить: {len(hot) + len(warm)} компаний",
        f"  🔥 HOT  ({len(hot)}): приоритет #1, звонить первыми",
        f"  🟡 WARM ({len(warm)}): звонить сегодня",
        f"  🔵 COLD ({len(cold)}): отложить или проверить позже",
        "",
        "─" * 65,
        f"  ТОП-{len(top)} ЛИДОВ",
        "─" * 65,
    ]

    for i, lead in enumerate(top, 1):
        emoji = _TIER_EMOJI.get(lead.priority_tier, "")
        tier_label = _TIER_RU.get(lead.priority_tier, "")

        lines += ["", f"{i}. {emoji} {lead.company_name}"]

        if lead.normalized_name and lead.normalized_name != lead.company_name:
            lines.append(f"   Бренд/торговое имя: {lead.normalized_name}")

        lines += [
            f"   Источник: {lead.source_name}  |  Сигнал: {lead.detected_signal}",
            f"   Score: {lead.final_score:.0f}/100  |  Confidence: {lead.confidence_score:.0f}/100  |  {tier_label}",
        ]

        if lead.company_summary:
            lines += ["", f"   ℹ  {lead.company_summary}"]

        if lead.why_now:
            lines += [f"   ⏰  Почему сейчас: {lead.why_now}"]

        if lead.why_labels:
            lines += [f"   🏷  Зачем этикетки: {lead.why_labels}"]

        if lead.outreach_angle:
            lines += [f"   📞  Угол захода: {lead.outreach_angle}"]

        if lead.suggested_pitch:
            lines += [f"   💬  Питч: {lead.suggested_pitch}"]

        # Score breakdown
        if lead.scoring_breakdown:
            sb = lead.scoring_breakdown
            lines += [
                "",
                f"   Скоринг: "
                f"PPF={sb.product_packaging_fit.score:.0f} | "
                f"Label={sb.labeling_need.score:.0f} | "
                f"New={sb.newness_signal.score:.0f} | "
                f"Urgency={sb.urgency_signal.score:.0f} | "
                f"Data={sb.data_quality.score:.0f} | "
                f"Ready={sb.sales_readiness.score:.0f}",
            ]
            # Show the most important factor explanation
            factors = {
                "PPF": sb.product_packaging_fit,
                "Label": sb.labeling_need,
                "Urgency": sb.urgency_signal,
            }
            for fname, factor in factors.items():
                if factor.explanation:
                    lines.append(f"   • {fname}: {factor.explanation}")

        if lead.evidence_quality_notes:
            lines += [f"   📊  Качество данных: {lead.evidence_quality_notes}"]

        if lead.assumptions:
            lines += [f"   ⚠  Предположения: {'; '.join(lead.assumptions[:2])}"]

        # Top evidence URLs
        top_urls = [e.url for e in lead.evidence[:2]]
        if top_urls:
            lines += ["   🔗  " + " | ".join(top_urls)]

        lines += ["", "─" * 65]

    return "\n".join(lines)

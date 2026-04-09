"""JSON exporter — full lead data with all fields."""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from scout.models import Lead

logger = logging.getLogger(__name__)


def write_json(leads: "List[Lead]", output_path: Path) -> None:
    """Write leads to JSON file sorted by final_score descending."""
    sorted_leads = sorted(leads, key=lambda l: l.final_score, reverse=True)

    hot = sum(1 for l in leads if l.priority_tier == "hot")
    warm = sum(1 for l in leads if l.priority_tier == "warm")
    cold = sum(1 for l in leads if l.priority_tier == "cold")

    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_leads": len(leads),
            "hot_count": hot,
            "warm_count": warm,
            "cold_count": cold,
            "call_today": hot + warm,
        },
        "leads": [l.to_dict() for l in sorted_leads],
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    logger.info(f"[JSON] Wrote {len(leads)} leads → {output_path}")

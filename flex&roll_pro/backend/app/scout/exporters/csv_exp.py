"""CSV exporter — outputs leads sorted by final_score descending."""
from __future__ import annotations

import csv
import logging
from pathlib import Path
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.scout.models import Lead

logger = logging.getLogger(__name__)

CSV_FIELDNAMES = [
    # Identity & source
    "company_name",
    "normalized_name",
    "source_name",
    "detected_signal",
    "signal_description",
    # Business classification
    "business_category",
    "product_category",
    "region",
    "website",
    # Sales intel
    "company_summary",
    "why_now",
    "why_labels",
    "outreach_angle",
    "suggested_pitch",
    "sales_brief",
    # Scoring
    "final_score",
    "priority_tier",
    "confidence_score",
    # Factor breakdown
    "ppf_score",      # product_packaging_fit
    "newness_score",
    "labeling_score",
    "urgency_score",
    "data_quality_score",
    "sales_readiness_score",
    # Evidence
    "top_evidence_urls",
    "evidence_quality_notes",
    "assumptions",
    # Metadata
    "analysis_status",
    "created_at",
    "source_url",
]


def write_csv(leads: "List[Lead]", output_path: Path) -> None:
    """Write leads to CSV file sorted by final_score descending."""
    sorted_leads = sorted(leads, key=lambda l: l.final_score, reverse=True)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDNAMES, extrasaction="ignore")
        writer.writeheader()
        for lead in sorted_leads:
            writer.writerow(lead.to_csv_row())

    logger.info(f"[CSV] Wrote {len(sorted_leads)} leads → {output_path}")

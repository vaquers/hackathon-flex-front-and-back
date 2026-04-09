"""
Main pipeline orchestration for AI-Scout.

Flow per lead:
  1. Check cache → skip if already analyzed
  2. Enrich: web search to collect evidence
  3. Analyze: LLM scoring + sales intel generation
  4. Cache result
  5. Checkpoint save every N leads
  6. Rate-limit sleep between leads

Designed to be fault-tolerant: one lead failing never stops the pipeline.
"""
from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Iterator, List, TYPE_CHECKING

from scout.cache.store import LeadCache
from scout.enrichment.web_search import enrich_lead
from scout.exporters.csv_exp import write_csv
from scout.exporters.json_exp import write_json
from scout.llm.client import analyze_lead
from scout.models import Lead, Evidence, ScoringBreakdown, ScoringFactor, make_lead_id
from scout.config import SLEEP_BETWEEN_LEADS

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)

CHECKPOINT_EVERY = 10  # Save outputs every N leads


def run_pipeline(
    lead_stream: Iterator[Lead],
    output_dir: Path,
    model: str,
    search_depth: int = 3,
    limit: int | None = None,
    use_cache: bool = True,
) -> List[Lead]:
    """
    Run the full pipeline on a stream of lead candidates.

    Args:
        lead_stream: Iterator yielding Lead objects from one or more sources
        output_dir: Directory for output files and cache
        model: LLM model identifier
        search_depth: Max web search results per query
        limit: Stop after processing this many leads (None = no limit)
        use_cache: If True, skip leads already in cache

    Returns:
        List of all processed leads (including cache hits)
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    cache_file = output_dir / ".lead_cache.json"
    cache = LeadCache(cache_file) if use_cache else None

    leads_out: List[Lead] = []
    processed = 0
    cache_hits = 0

    for lead in lead_stream:
        if limit is not None and processed >= limit:
            logger.info(f"[Pipeline] Limit {limit} reached, stopping")
            break

        logger.info(
            f"[Pipeline] #{processed + 1}: {lead.company_name!r} "
            f"[{lead.source_name}/{lead.detected_signal}]"
        )

        # Cache hit → restore and skip re-analysis
        if cache and cache.has(lead.id):
            cached = cache.get(lead.id)
            restored = _restore_from_cache(cached, lead)
            leads_out.append(restored)
            cache_hits += 1
            processed += 1
            logger.debug(f"[Pipeline] Cache hit: {lead.id}")
            continue

        # Step 1: Enrich with web search
        try:
            lead.evidence = enrich_lead(lead, max_results_per_query=search_depth)
            logger.info(f"[Pipeline] Found {len(lead.evidence)} evidence items")
        except Exception as e:
            logger.warning(f"[Pipeline] Enrichment failed for {lead.company_name!r}: {e}")
            lead.evidence = []

        # Step 2: LLM analysis
        try:
            lead = analyze_lead(lead, model=model)
        except Exception as e:
            logger.error(f"[Pipeline] Analysis crashed for {lead.company_name!r}: {e}")
            lead.analysis_status = "failed"

        # Step 3: Cache result
        if cache:
            cache.set(lead.id, lead.to_dict())

        leads_out.append(lead)
        processed += 1

        # Checkpoint: save intermediate results
        if processed % CHECKPOINT_EVERY == 0:
            logger.info(f"[Pipeline] Checkpoint: {processed} processed, saving…")
            _save_outputs(leads_out, output_dir)
            if cache:
                cache.save()

        time.sleep(SLEEP_BETWEEN_LEADS)

    # Final save
    _save_outputs(leads_out, output_dir)
    if cache:
        cache.save()

    _print_summary(leads_out, cache_hits=cache_hits)
    return leads_out


def _save_outputs(leads: List[Lead], output_dir: Path) -> None:
    try:
        write_csv(leads, output_dir / "leads.csv")
        write_json(leads, output_dir / "leads.json")
    except Exception as e:
        logger.error(f"[Pipeline] Output save failed: {e}")


def _print_summary(leads: List[Lead], cache_hits: int = 0) -> None:
    hot = [l for l in leads if l.priority_tier == "hot"]
    warm = [l for l in leads if l.priority_tier == "warm"]
    cold = [l for l in leads if l.priority_tier == "cold"]
    failed = [l for l in leads if l.analysis_status == "failed"]
    partial = [l for l in leads if l.analysis_status == "partial"]

    print(f"\n{'=' * 55}")
    print(f"  AI-SCOUT РЕЗУЛЬТАТ")
    print(f"{'=' * 55}")
    print(f"  Всего лидов:        {len(leads)}")
    print(f"  Из кэша:            {cache_hits}")
    print(f"  🔥 HOT  (score≥70): {len(hot)}")
    print(f"  🟡 WARM (45-69):    {len(warm)}")
    print(f"  🔵 COLD (<45):      {len(cold)}")
    if failed:
        print(f"  ❌ Failed:          {len(failed)}")
    if partial:
        print(f"  ⚠  Partial:         {len(partial)}")
    print(f"{'=' * 55}")

    call_today = hot + warm
    if call_today:
        print(f"\n  Сегодня позвонить ({len(call_today)}):")
        for i, lead in enumerate(
            sorted(call_today, key=lambda l: l.final_score, reverse=True)[:10], 1
        ):
            emoji = "🔥" if lead.priority_tier == "hot" else "🟡"
            print(f"  {i:2}. {emoji} {lead.company_name}  — {lead.final_score:.0f}/100")
            if lead.why_now:
                print(f"      {lead.why_now[:90]}")
    print()


def _restore_from_cache(cached: dict, original_lead: Lead) -> Lead:
    """
    Restore a fully-analyzed Lead from cached dict.
    Uses original_lead as the base to preserve source metadata.
    """
    from scout.llm.client import SCORING_WEIGHTS

    lead = original_lead

    # Scalar fields
    scalar_fields = [
        "company_name", "normalized_name", "business_category", "product_category",
        "detected_signal", "description", "website", "region",
        "company_summary", "business_model_guess", "why_labels", "why_now",
        "sales_brief", "outreach_angle", "suggested_pitch", "evidence_quality_notes",
        "assumptions", "confidence_score", "analysis_status", "analysis_model",
        "created_at", "updated_at",
    ]
    for f in scalar_fields:
        if f in cached:
            setattr(lead, f, cached[f])

    # Evidence
    lead.evidence = [
        Evidence(
            url=e.get("url", ""),
            title=e.get("title", ""),
            snippet=e.get("snippet", ""),
            source_type=e.get("source_type", "unknown"),
            quality=float(e.get("quality", 0.3)),
        )
        for e in cached.get("evidence", [])
    ]

    # Scoring breakdown
    sb_raw = cached.get("scoring_breakdown")
    if sb_raw:
        def _factor(key: str) -> ScoringFactor:
            fd = sb_raw.get(key, {})
            return ScoringFactor(
                score=float(fd.get("score", 25)),
                weight=SCORING_WEIGHTS[key],
                explanation=str(fd.get("explanation", "")),
            )
        lead.scoring_breakdown = ScoringBreakdown(
            product_packaging_fit=_factor("product_packaging_fit"),
            labeling_need=_factor("labeling_need"),
            newness_signal=_factor("newness_signal"),
            urgency_signal=_factor("urgency_signal"),
            data_quality=_factor("data_quality"),
            sales_readiness=_factor("sales_readiness"),
        )

    return lead

"""
Lead generation service.

Two-stage pipeline:
  1. Fetch candidates from EGR → heuristic pre-filter → top CANDIDATE_LIMIT
  2. LLM enrichment + scoring on top PRE_SCORE_TOP_N → return top TOP_K
"""

import asyncio
import json
import logging
import os
import re
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Optional

from app.config import settings

logger = logging.getLogger("lead_generator")

# ── Pipeline configuration ───────────────────────────────────────────────────

CANDIDATE_LIMIT = int(os.getenv("LEAD_CANDIDATE_LIMIT", "100"))
PRE_SCORE_TOP_N = int(os.getenv("LEAD_PRE_SCORE_TOP_N", "15"))
TOP_K = int(os.getenv("LEAD_TOP_K", "5"))
DAYS_BACK = int(os.getenv("LEAD_DAYS_BACK", "3"))
CACHE_TTL_SECONDS = int(os.getenv("LEAD_CACHE_TTL", "3600"))  # 1 hour

DATA_DIR = Path(os.getenv("LEAD_DATA_DIR", "/tmp/leads_data"))
SNAPSHOT_FILE = Path(
    os.getenv(
        "LEAD_SNAPSHOT_FILE",
        str(Path(__file__).resolve().parent.parent.parent / "parsing" / "data" / "leads.json"),
    )
)

# ── Keyword heuristic for pre-filtering ──────────────────────────────────────

_POSITIVE_KEYWORDS = [
    "продукт", "пищев", "напит", "food", "drink", "молоч", "мясн", "кондитер",
    "хлеб", "пекарн", "косметик", "парфюм", "фарм", "лекарств", "витамин",
    "бад", "добавк", "химик", "бытов", "моющ", "чист", "упаков", "тар",
    "этикет", "маркиров", "бренд", "торгов", "розниц", "retail",
    "масл", "соус", "специ", "снек", "кофе", "чай", "сок", "вод",
    "пив", "алкогол", "вин", "ликер", "дистил",
    "корм", "зоо", "pet", "животн",
    "крем", "шампун", "гель", "мыл",
    "fmcg", "производств", "завод", "фабрик", "цех",
    "импорт", "экспорт", "дистрибуц", "опт",
    "сельск", "агро", "ферм",
]

_NEGATIVE_KEYWORDS = [
    "консалт", "консульт", "юрид", "адвокат", "нотари",
    "программ", "софт", "it", "цифров", "digital",
    "страхов", "банк", "финанс", "инвестиц", "кредит",
    "недвижим", "строител", "ремонт", "архитект",
    "образов", "школ", "универс", "курс", "тренинг",
    "охран", "безопасн", "детектив",
    "такси", "перевоз", "логист", "транспорт",
    "рекламн", "маркетинг", "пиар", "дизайн",
    "медиа", "сми", "газет", "журнал",
    "турист", "путешеств", "отель", "гостиниц",
    "стоматолог", "клиник", "медицинск",
]

_PREFERRED_LEGAL_FORMS = {"ООО", "ОАО", "ЗАО", "СООО", "ОДО", "ИООО", "ЧУП"}


def _heuristic_score(company_name: str, legal_form: str | None = None) -> float:
    """Quick keyword-based relevance score (0-100). No API calls."""
    name_lower = company_name.lower()
    score = 30.0  # base score for unknown

    positive_hits = sum(1 for kw in _POSITIVE_KEYWORDS if kw in name_lower)
    negative_hits = sum(1 for kw in _NEGATIVE_KEYWORDS if kw in name_lower)

    score += positive_hits * 12
    score -= negative_hits * 20

    if legal_form and legal_form in _PREFERRED_LEGAL_FORMS:
        score += 5

    return max(0, min(100, score))


# ── Cached result store ──────────────────────────────────────────────────────

@dataclass
class LeadResult:
    id: str
    company_name: str
    normalized_name: str
    registration_date: str | None
    industry: str
    product_category: str
    why_recommended: str
    score: float
    confidence_score: float
    priority_tier: str
    source_url: str
    source_name: str
    company_summary: str
    outreach_angle: str
    suggested_pitch: str
    sales_brief: str
    scoring_breakdown: dict = field(default_factory=dict)
    created_at: str = ""

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "company_name": self.company_name,
            "normalized_name": self.normalized_name,
            "registration_date": self.registration_date,
            "industry": self.industry,
            "product_category": self.product_category,
            "why_recommended": self.why_recommended,
            "score": round(self.score, 1),
            "confidence_score": round(self.confidence_score, 1),
            "priority_tier": self.priority_tier,
            "source_url": self.source_url,
            "source_name": self.source_name,
            "company_summary": self.company_summary,
            "outreach_angle": self.outreach_angle,
            "suggested_pitch": self.suggested_pitch,
            "sales_brief": self.sales_brief,
            "scoring_breakdown": self.scoring_breakdown,
            "created_at": self.created_at,
        }


@dataclass
class CachedLeads:
    leads: list[dict] = field(default_factory=list)
    generated_at: str = ""
    pipeline_status: str = "idle"  # idle | running | done | error
    error_message: str = ""
    total_candidates: int = 0
    total_scored: int = 0


class LeadGeneratorService:
    def __init__(self):
        self._cache = CachedLeads()
        self._lock = Lock()
        self._running = False
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        self._cache_file = DATA_DIR / "cached_leads.json"
        self._load_cache()
        self._hydrate_cache_from_snapshot_if_needed()

    def _load_cache(self):
        if self._cache_file.exists():
            try:
                data = json.loads(self._cache_file.read_text(encoding="utf-8"))
                self._cache = CachedLeads(
                    leads=data.get("leads", []),
                    generated_at=data.get("generated_at", ""),
                    pipeline_status=data.get("pipeline_status", "done"),
                    total_candidates=data.get("total_candidates", 0),
                    total_scored=data.get("total_scored", 0),
                )
                logger.info("Loaded %d cached leads from %s", len(self._cache.leads), self._cache_file)
            except Exception as e:
                logger.warning("Failed to load cache: %s", e)

    def _save_cache(self):
        try:
            self._cache_file.write_text(
                json.dumps({
                    "leads": self._cache.leads,
                    "generated_at": self._cache.generated_at,
                    "pipeline_status": self._cache.pipeline_status,
                    "total_candidates": self._cache.total_candidates,
                    "total_scored": self._cache.total_scored,
                }, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        except Exception as e:
            logger.error("Failed to save cache: %s", e)

    def _load_snapshot_results(self) -> list[LeadResult]:
        """Load precomputed leads from disk when live EGR fetching is unavailable."""
        if not SNAPSHOT_FILE.exists():
            logger.warning("Lead snapshot file not found: %s", SNAPSHOT_FILE)
            return []

        try:
            payload = json.loads(SNAPSHOT_FILE.read_text(encoding="utf-8"))
        except Exception as e:
            logger.warning("Failed to read lead snapshot %s: %s", SNAPSHOT_FILE, e)
            return []

        raw_leads = payload.get("leads", []) if isinstance(payload, dict) else []
        results: list[LeadResult] = []

        for item in raw_leads:
            score = float(item.get("final_score") or 0.0)
            confidence = float(item.get("confidence_score") or 0.0)
            breakdown = item.get("scoring_breakdown") or {}

            why_parts = [
                item.get("why_labels", "").strip(),
                item.get("why_now", "").strip(),
            ]
            why_recommended = " | ".join(part for part in why_parts if part) or "Новая компания в релевантной отрасли"

            results.append(LeadResult(
                id=item.get("id", ""),
                company_name=item.get("company_name", ""),
                normalized_name=item.get("normalized_name") or item.get("company_name", ""),
                registration_date=(item.get("raw_data") or {}).get("reg_date"),
                industry=item.get("business_category") or "unknown",
                product_category=item.get("product_category") or "",
                why_recommended=why_recommended,
                score=score,
                confidence_score=confidence,
                priority_tier=item.get("priority_tier") or "cold",
                source_url=item.get("source_url") or "",
                source_name=item.get("source_name") or "snapshot",
                company_summary=item.get("company_summary") or "",
                outreach_angle=item.get("outreach_angle") or "",
                suggested_pitch=item.get("suggested_pitch") or "",
                sales_brief=item.get("sales_brief") or "",
                scoring_breakdown=breakdown,
                created_at=item.get("created_at") or datetime.now(timezone.utc).isoformat(),
            ))

        results.sort(key=lambda lead: lead.score, reverse=True)
        logger.info("Loaded %d leads from snapshot %s", len(results), SNAPSHOT_FILE)
        return results

    def _hydrate_cache_from_snapshot_if_needed(self):
        """Make snapshot leads immediately available if cache starts empty."""
        if self._cache.leads:
            return

        snapshot_results = self._load_snapshot_results()
        if not snapshot_results:
            return

        self._cache.leads = [lead.to_dict() for lead in snapshot_results]
        self._cache.generated_at = snapshot_results[0].created_at
        self._cache.pipeline_status = "done"
        self._cache.error_message = "Showing snapshot leads while live EGR data is unavailable."
        self._cache.total_candidates = len(snapshot_results)
        self._cache.total_scored = len(snapshot_results)
        self._save_cache()
        logger.info("Hydrated lead cache from snapshot with %d leads", len(snapshot_results))

    def get_top_leads(self) -> dict:
        """Return cached top leads."""
        if not self._cache.leads:
            self._hydrate_cache_from_snapshot_if_needed()
        return {
            "leads": self._cache.leads[:TOP_K],
            "generated_at": self._cache.generated_at,
            "pipeline_status": self._cache.pipeline_status,
            "error_message": self._cache.error_message,
            "total_candidates": self._cache.total_candidates,
            "total_scored": self._cache.total_scored,
            "cache_stale": self._is_cache_stale(),
        }

    def get_status(self) -> dict:
        return {
            "pipeline_status": self._cache.pipeline_status,
            "generated_at": self._cache.generated_at,
            "leads_count": len(self._cache.leads),
            "is_running": self._running,
            "cache_stale": self._is_cache_stale(),
        }

    def _is_cache_stale(self) -> bool:
        if not self._cache.generated_at:
            return True
        try:
            gen_time = datetime.fromisoformat(self._cache.generated_at)
            if gen_time.tzinfo is None:
                gen_time = gen_time.replace(tzinfo=timezone.utc)
            age = (datetime.now(timezone.utc) - gen_time).total_seconds()
            return age > CACHE_TTL_SECONDS
        except Exception:
            return True

    def is_running(self) -> bool:
        return self._running

    def run_pipeline_sync(self):
        """Run the full pipeline synchronously. Call from a background thread."""
        if self._running:
            logger.warning("Pipeline already running, skipping")
            return

        with self._lock:
            self._running = True
            self._cache.pipeline_status = "running"
            self._cache.error_message = ""

        try:
            leads = self._execute_pipeline()
            with self._lock:
                if leads:
                    self._cache.leads = [l.to_dict() for l in leads]
                    self._cache.error_message = ""
                else:
                    logger.warning("Pipeline produced no leads; preserving previous cache")
                    self._cache.error_message = "Live source returned no leads; previous or snapshot data preserved."
                self._cache.generated_at = datetime.now(timezone.utc).isoformat()
                self._cache.pipeline_status = "done"
                self._save_cache()
            logger.info("Pipeline completed: %d leads generated", len(leads))
        except Exception as e:
            logger.exception("Pipeline failed: %s", e)
            with self._lock:
                self._cache.pipeline_status = "error"
                self._cache.error_message = str(e)
                self._save_cache()
        finally:
            self._running = False

    def _execute_pipeline(self) -> list[LeadResult]:
        """
        Stage 1: Fetch from EGR → heuristic pre-filter → top CANDIDATE_LIMIT
        Stage 2: Enrich + LLM score top PRE_SCORE_TOP_N → return sorted
        """
        from app.scout.sources.egr import EGRSource
        from app.scout.enrichment.web_search import enrich_lead
        from app.scout.llm.client import analyze_lead
        from app.scout.config import OPENROUTER_API_KEY, DEFAULT_MODEL

        if not OPENROUTER_API_KEY:
            raise RuntimeError("OPENROUTER_API_KEY not set")

        model = os.getenv("LLM_MODEL", DEFAULT_MODEL)

        # Stage 1: Fetch candidates
        logger.info("Stage 1: Fetching EGR candidates (days_back=%d)", DAYS_BACK)
        source = EGRSource(days_back=DAYS_BACK)
        all_candidates = list(source.fetch_candidates())
        logger.info("Fetched %d raw candidates from EGR", len(all_candidates))
        total_candidates = len(all_candidates)

        if not all_candidates:
            logger.warning("EGR returned no candidates; falling back to snapshot data")
            snapshot_results = self._load_snapshot_results()
            with self._lock:
                self._cache.total_candidates = len(snapshot_results)
                self._cache.total_scored = len(snapshot_results)
            return snapshot_results

        # Pre-filter with heuristic scoring
        scored_candidates = []
        for lead in all_candidates:
            h_score = _heuristic_score(
                lead.company_name,
                lead.raw_data.get("legal_form") if lead.raw_data else None,
            )
            scored_candidates.append((h_score, lead))

        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        top_candidates = scored_candidates[:CANDIDATE_LIMIT]

        logger.info(
            "Pre-filtered to %d candidates (from %d), top heuristic score: %.1f",
            len(top_candidates),
            len(all_candidates),
            top_candidates[0][0] if top_candidates else 0,
        )

        # Take top N for LLM scoring
        to_score = top_candidates[:PRE_SCORE_TOP_N]
        logger.info("Stage 2: LLM scoring top %d candidates", len(to_score))

        results: list[LeadResult] = []
        for i, (h_score, lead) in enumerate(to_score):
            try:
                logger.info(
                    "[%d/%d] Processing: %s (heuristic=%.0f)",
                    i + 1, len(to_score), lead.company_name, h_score,
                )

                # Enrichment
                try:
                    evidence = enrich_lead(lead, max_results_per_query=2, num_queries=3)
                    lead.evidence = evidence
                except Exception as e:
                    logger.warning("Enrichment failed for %s: %s", lead.company_name, e)

                # LLM Analysis
                analyzed = analyze_lead(lead, model=model)

                result = self._scout_lead_to_result(analyzed)
                results.append(result)

                # Rate limiting
                time.sleep(1.5)

            except Exception as e:
                logger.error("Failed to process %s: %s", lead.company_name, e)
                continue

        # Sort by final score descending
        results.sort(key=lambda r: r.score, reverse=True)

        with self._lock:
            self._cache.total_candidates = total_candidates
            self._cache.total_scored = len(results)

        return results

    def _scout_lead_to_result(self, lead) -> LeadResult:
        """Convert scout Lead to our LeadResult."""
        # Build scoring breakdown dict
        breakdown = {}
        if lead.scoring_breakdown:
            sb = lead.scoring_breakdown
            for factor_name in [
                "product_packaging_fit", "labeling_need", "newness_signal",
                "urgency_signal", "data_quality", "sales_readiness",
            ]:
                factor = getattr(sb, factor_name, None)
                if factor:
                    breakdown[factor_name] = {
                        "score": factor.score,
                        "weight": factor.weight,
                        "explanation": factor.explanation,
                    }

        reg_date = None
        if lead.raw_data and lead.raw_data.get("reg_date"):
            reg_date = lead.raw_data["reg_date"]

        why_parts = []
        if lead.why_labels:
            why_parts.append(lead.why_labels)
        if lead.why_now:
            why_parts.append(lead.why_now)
        why_recommended = " | ".join(why_parts) if why_parts else "Новая компания в релевантной отрасли"

        return LeadResult(
            id=lead.id,
            company_name=lead.company_name,
            normalized_name=lead.normalized_name or lead.company_name,
            registration_date=reg_date,
            industry=lead.business_category or "unknown",
            product_category=lead.product_category or "",
            why_recommended=why_recommended,
            score=lead.final_score if lead.final_score else 0.0,
            confidence_score=lead.confidence_score or 0.0,
            priority_tier=lead.priority_tier if lead.priority_tier else "cold",
            source_url=lead.source_url or "",
            source_name=lead.source_name or "egr",
            company_summary=lead.company_summary or "",
            outreach_angle=lead.outreach_angle or "",
            suggested_pitch=lead.suggested_pitch or "",
            sales_brief=lead.sales_brief or "",
            scoring_breakdown=breakdown,
            created_at=lead.created_at or datetime.now(timezone.utc).isoformat(),
        )


# ── Singleton ────────────────────────────────────────────────────────────────

_service: Optional[LeadGeneratorService] = None


def get_lead_service() -> LeadGeneratorService:
    global _service
    if _service is None:
        _service = LeadGeneratorService()
    return _service

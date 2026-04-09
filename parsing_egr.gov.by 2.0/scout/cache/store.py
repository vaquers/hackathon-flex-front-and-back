"""
Persistent cache for lead analysis results.
Stores fully-analyzed Lead dicts so the pipeline can resume without
re-processing already-analyzed leads.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


class LeadCache:
    """
    JSON file-backed cache keyed by lead ID.

    Format:
        {
          "<lead_id>": { <full Lead.to_dict() output> },
          ...
        }
    """

    def __init__(self, cache_file: Path) -> None:
        self.cache_file = cache_file
        self._data: dict[str, dict] = {}
        self._dirty = False
        self._load()

    def _load(self) -> None:
        if not self.cache_file.exists():
            return
        try:
            with open(self.cache_file, encoding="utf-8") as f:
                self._data = json.load(f)
            logger.debug(f"[Cache] Loaded {len(self._data)} entries from {self.cache_file.name}")
        except Exception as e:
            logger.warning(f"[Cache] Failed to load cache: {e}")
            self._data = {}

    def has(self, lead_id: str) -> bool:
        return lead_id in self._data

    def get(self, lead_id: str) -> Optional[dict]:
        return self._data.get(lead_id)

    def set(self, lead_id: str, lead_dict: dict) -> None:
        self._data[lead_id] = lead_dict
        self._dirty = True

    def save(self) -> None:
        if not self._dirty:
            return
        try:
            self.cache_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(self._data, f, ensure_ascii=False, indent=2)
            self._dirty = False
            logger.debug(f"[Cache] Saved {len(self._data)} entries")
        except Exception as e:
            logger.error(f"[Cache] Save failed: {e}")

    @property
    def size(self) -> int:
        return len(self._data)

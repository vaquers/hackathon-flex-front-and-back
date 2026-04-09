"""Abstract base class for all lead sources."""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Iterator

logger = logging.getLogger(__name__)


class BaseSource(ABC):
    """
    Every source must implement fetch_candidates().
    It should yield Lead objects and never raise — log errors and continue.
    """
    name: str = "base"
    source_type: str = "unknown"
    source_quality: float = 0.5

    @abstractmethod
    def fetch_candidates(self, **kwargs) -> Iterator:
        ...

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(name={self.name!r})"

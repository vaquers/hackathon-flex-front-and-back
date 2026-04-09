"""Lead sources package."""
from app.scout.sources.base import BaseSource
from app.scout.sources.egr import EGRSource
from app.scout.sources.news import NewsSearchSource

__all__ = ["BaseSource", "EGRSource", "NewsSearchSource"]

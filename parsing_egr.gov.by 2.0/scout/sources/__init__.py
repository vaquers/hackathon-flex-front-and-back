"""Lead sources package."""
from scout.sources.base import BaseSource
from scout.sources.egr import EGRSource
from scout.sources.news import NewsSearchSource

__all__ = ["BaseSource", "EGRSource", "NewsSearchSource"]

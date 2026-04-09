from typing import TypeVar, Generic, Any
from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    data: T
    meta: dict[str, Any] | None = None
    errors: list[dict[str, str]] | None = None


class PaginationMeta(BaseModel):
    total: int
    page: int
    per_page: int
    processing_time_ms: int | None = None

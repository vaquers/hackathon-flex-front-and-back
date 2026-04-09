from pydantic import BaseModel
from typing import Literal


class SearchResult(BaseModel):
    id: str
    type: Literal["calculation", "tech_doc", "past_order", "template", "proposal"]
    type_label: str
    name: str
    ai_answer: str
    relevant_fragment: str
    client_name: str | None = None
    order_id: str | None = None
    date: str
    relevance_score: int
    tags: list[str]


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
    total: int
    processing_time: int
    suggested_filters: list[str]


class PopularDoc(BaseModel):
    id: str
    name: str
    type: str
    date: str

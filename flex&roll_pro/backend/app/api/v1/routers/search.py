from fastapi import APIRouter, Query
from app.schemas.common import ApiResponse
from app.schemas.search import SearchResponse, PopularDoc
from app.repositories import mock_repository as repo

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=ApiResponse[SearchResponse])
async def search(
    q: str = Query("", description="Search query"),
    types: list[str] | None = Query(None, description="Document type filters"),
):
    # TODO: Replace with RAG pipeline — Qdrant vector search + LLM answer generation
    return ApiResponse(data=repo.search_documents(q, types))


@router.get("/popular", response_model=ApiResponse[list[PopularDoc]])
async def get_popular():
    return ApiResponse(data=repo.get_popular_docs())

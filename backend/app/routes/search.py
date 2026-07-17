from fastapi import APIRouter, Depends
from ..agents.recommender import rank_products
from ..models.schemas import SearchRequest, SearchResponse
from ..repository import MemoryRepository, SupabaseRepository, get_repository

router = APIRouter(prefix="/search", tags=["search"])

@router.post("", response_model=SearchResponse)
def search(payload: SearchRequest, repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    result = rank_products(payload.query, repo.list_products())
    repo.add_trace(result.trace)
    return result

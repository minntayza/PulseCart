from fastapi import APIRouter, Depends

from ..agents.recommender import product_view_trace, rank_products, update_product_view_interest
from ..auth import current_user
from ..models.schemas import AuthUser, SearchResponse
from ..repository import MemoryRepository, SupabaseRepository, get_repository

router = APIRouter(prefix="/events", tags=["events"])


@router.post("/product-view/{product_id}", response_model=SearchResponse)
def product_view(
    product_id: str,
    user: AuthUser = Depends(current_user),
    repo: MemoryRepository | SupabaseRepository = Depends(get_repository),
):
    product = repo.get_product(product_id)
    profile = update_product_view_interest(product, repo.get_profile(user.id))
    repo.save_profile(user.id, profile)
    trace = product_view_trace(product)
    repo.add_trace(trace, user.id)
    result = rank_products("", repo.list_products(), profile)
    result.trace = trace
    return result

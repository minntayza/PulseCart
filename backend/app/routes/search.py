from fastapi import APIRouter, Depends
from ..agents.recommender import rank_products, update_search_interests
from ..auth import optional_user
from ..models.schemas import AuthUser, SearchRequest, SearchResponse
from ..repository import MemoryRepository, SupabaseRepository, get_repository

router = APIRouter(prefix="/search", tags=["search"])

@router.post("", response_model=SearchResponse)
def search(payload: SearchRequest, user: AuthUser | None = Depends(optional_user), repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    products = repo.list_products()
    profile = repo.get_profile(user.id) if user else {}
    promoted = []
    if user and payload.query:
        profile, promoted = update_search_interests(payload.query, products, profile)
        repo.save_profile(user.id, profile)
        repo.record_search(user.id, payload.query)
    result = rank_products(payload.query, products, profile)
    if user and payload.query:
        result.trace.lastAction = f'Searched "{payload.query}"; promoted {len(promoted)} of {sum(payload.query.casefold() in p.name.casefold() for p in products)} name matches'
        result.trace.logs[2].text = f'Promoted newest 50% match set: {", ".join(p.name for p in promoted) or "no exact name matches"}'
    # Empty queries are automatic returning-feed refreshes, not customer
    # actions. Never add them to manager activity.
    if payload.query:
        repo.add_trace(result.trace, user.id if user else None)
    return result

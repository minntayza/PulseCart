from fastapi import APIRouter, Depends
from ..auth import current_user, manager_user
from ..models.schemas import AuthUser, CreateFeedbackRequest, Feedback
from ..repository import MemoryRepository, SupabaseRepository, get_repository

router = APIRouter(prefix="/feedback", tags=["feedback"])

@router.post("", response_model=Feedback, status_code=201)
def create_feedback(payload: CreateFeedbackRequest, user: AuthUser = Depends(current_user), repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    return repo.create_feedback(user.id, payload)

@router.get("", response_model=list[Feedback])
def list_feedback(_: AuthUser = Depends(manager_user), repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    return repo.list_feedback()

from fastapi import APIRouter, Depends
from ..auth import manager_user
from ..models.schemas import AgentTrace, AuthUser
from ..repository import MemoryRepository, SupabaseRepository, get_repository

router = APIRouter(prefix="/agents", tags=["agents"])

@router.get("/traces", response_model=list[AgentTrace])
def traces(_: AuthUser = Depends(manager_user), repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    if isinstance(repo, MemoryRepository):
        return repo.traces
    response = repo.client.table("audit_log").select("output").order("timestamp", desc=True).limit(100).execute()
    return [AgentTrace(**row["output"]) for row in response.data]

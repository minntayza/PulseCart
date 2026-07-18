from fastapi import APIRouter, Depends
from ..auth import manager_user
from ..models.schemas import AgentTrace, AuthUser
from ..repository import MemoryRepository, SupabaseRepository, get_repository

router = APIRouter(prefix="/agents", tags=["agents"])


def meaningful_recommender_trace(trace: AgentTrace) -> bool:
    return trace.agentName == "Recommender Agent" and '"all products"' not in trace.lastAction

@router.get("/traces", response_model=list[AgentTrace])
def traces(_: AuthUser = Depends(manager_user), repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    if isinstance(repo, MemoryRepository):
        return [trace for trace in repo.traces if meaningful_recommender_trace(trace)]
    response = repo.client.table("audit_log").select("output").order("timestamp", desc=True).limit(100).execute()
    traces: list[AgentTrace] = []
    for row in response.data:
        output = row.get("output") or {}
        candidate = output.get("trace", output)
        try:
            trace = AgentTrace(**candidate)
            if meaningful_recommender_trace(trace):
                traces.append(trace)
        except (TypeError, ValueError):
            continue
    return traces

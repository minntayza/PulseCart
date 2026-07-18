from fastapi import APIRouter, Depends
from ..auth import manager_user
from ..models.schemas import AgentTrace, AuthUser
from ..repository import MemoryRepository, SupabaseRepository, get_repository
from ..agents.market_analyst import analyze_market

router = APIRouter(prefix="/agents", tags=["agents"])

@router.get("/traces", response_model=list[AgentTrace])
def traces(_: AuthUser = Depends(manager_user), repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    if isinstance(repo, MemoryRepository):
        return repo.traces
    response = repo.client.table("audit_log").select("output").order("timestamp", desc=True).limit(100).execute()
    return [AgentTrace(**row["output"]) for row in response.data]

@router.post("/market_analyst")
def run_market_analyst(_: AuthUser = Depends(manager_user), repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    # Fetch data
    products = repo.get_all_products()
    # Mock competitor data
    competitors = [{"sku": "ROG Strix G16", "competitor_price": 1200}, {"sku": "Secretlab TITAN", "competitor_price": 490}]
    
    # Run agent
    report, trace = analyze_market([p.model_dump() for p in products], competitors)
    
    # Save trace
    repo.add_trace(trace)
    
    return {"status": "success", "report": report, "trace": trace}

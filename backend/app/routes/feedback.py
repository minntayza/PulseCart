from fastapi import APIRouter, BackgroundTasks, Depends
from ..auth import current_user, manager_user
from ..agents.feedback_agent import analyze_feedback
from ..models.schemas import AgentTrace, AuthUser, CreateFeedbackRequest, Feedback, FeedbackInsights
from ..repository import MemoryRepository, SupabaseRepository, get_repository

router = APIRouter(prefix="/feedback", tags=["feedback"])

@router.post("", response_model=Feedback, status_code=201)
def create_feedback(payload: CreateFeedbackRequest, background_tasks: BackgroundTasks, user: AuthUser = Depends(current_user), repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    feedback = repo.create_feedback(user.id, payload)
    background_tasks.add_task(_auto_analyze, repo)
    return feedback

@router.get("", response_model=list[Feedback])
def list_feedback(_: AuthUser = Depends(manager_user), repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    return repo.list_feedback()

@router.get("/insights", response_model=FeedbackInsights | None)
def get_insights(repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    return repo.get_insights()

@router.post("/analyze", response_model=FeedbackInsights)
def analyze_endpoint(user: AuthUser = Depends(manager_user), repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    feedback_list = repo.list_feedback()
    messages = [f.message for f in feedback_list]
    if not messages:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="No feedback to analyze")
    insights, trace = analyze_feedback(messages)
    repo.save_insights(insights)
    repo.add_trace(trace)
    return insights

def _auto_analyze(repo: MemoryRepository | SupabaseRepository) -> None:
    import logging
    logger = logging.getLogger("feedback")
    try:
        feedback_list = repo.list_feedback()
        messages = [f.message for f in feedback_list]
        logger.info(f"Auto-analyzing {len(messages)} messages")
        if messages:
            insights, trace = analyze_feedback(messages)
            repo.save_insights(insights)
            repo.add_trace(trace)
            logger.info(f"Saved {len(insights.themes)} themes")
    except Exception as exc:
        logger.error(f"Auto-analyze failed: {exc}", exc_info=True)

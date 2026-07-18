from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .routes import agents, events, feedback, manager_products, orders, products, search

settings = get_settings()
api = FastAPI(title=settings.app_name, version="0.1.0")
api.add_middleware(
    CORSMiddleware,
    allow_origins=list({settings.frontend_url.rstrip("/"), "http://localhost:3000", "http://127.0.0.1:3000"}),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
api.include_router(products.router)
api.include_router(search.router)
api.include_router(events.router)
api.include_router(orders.router)
api.include_router(agents.router)
api.include_router(feedback.router)
api.include_router(manager_products.router)

@api.get("/health", tags=["system"])
def health():
    return {"status": "ok", "mode": "mock" if settings.use_mock_data else "supabase"}


# Keep both common Uvicorn targets available without changing behavior.
app = api

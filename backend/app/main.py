from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .routes import agents, feedback, manager_products, orders, products, search

settings = get_settings()
api = FastAPI(title=settings.app_name, version="0.1.0")
api.include_router(products.router)
api.include_router(search.router)
api.include_router(orders.router)
api.include_router(agents.router)
api.include_router(feedback.router)
api.include_router(manager_products.router)

@api.get("/health", tags=["system"])
def health():
    return {"status": "ok", "mode": "mock" if settings.use_mock_data else "supabase"}


# Wrap the complete application so CORS headers are also present on unexpected
# error responses. This lets the frontend display the real API error instead of
# the browser masking it as a CORS failure.
app = CORSMiddleware(
    app=api,
    allow_origins=list({settings.frontend_url.rstrip("/"), "http://localhost:3000", "http://127.0.0.1:3000"}),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

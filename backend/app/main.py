from fastapi import FastAPI, Request, Response
from .config import get_settings
from .routes import agents, chat, feedback, manager_products, orders, products, search

settings = get_settings()
api = FastAPI(title=settings.app_name, version="0.1.0")

# --- CORS ---
ALLOWED_ORIGINS = {
    settings.frontend_url.rstrip("/"),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
}

@api.middleware("http")
async def cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin", "")
    # Handle preflight
    if request.method == "OPTIONS":
        if origin in ALLOWED_ORIGINS:
            return Response(status_code=204, headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Max-Age": "86400",
            })
        return Response(status_code=204)
    # Handle normal requests
    response = await call_next(request)
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response
api.include_router(products.router)
api.include_router(search.router)
api.include_router(orders.router)
api.include_router(agents.router)
api.include_router(feedback.router)
api.include_router(manager_products.router)
api.include_router(chat.router)

@api.get("/health", tags=["system"])
def health():
    return {"status": "ok", "mode": "mock" if settings.use_mock_data else "supabase"}


# Keep both common Uvicorn targets available without changing behavior.
app = api

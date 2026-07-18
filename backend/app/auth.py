from fastapi import Depends, Header, HTTPException, status
from .config import Settings, get_settings
from .models.schemas import AuthUser


DEMO_USERS = {
    "demo-customer-token": AuthUser(id="customer-demo", username="Demo Customer", email="customer@pulsecart.demo", role="customer"),
    "demo-manager-token": AuthUser(id="manager-demo", username="Manager May", email="manager@pulsecart.demo", role="manager"),
}


async def current_user(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> AuthUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    token = authorization.removeprefix("Bearer ").strip()

    # Try demo tokens first (works in both mock and real mode)
    user = DEMO_USERS.get(token)
    if user:
        return user

    # Fall back to Supabase validation (handles real Supabase JWTs in any mode)
    if not settings.supabase_url or not settings.supabase_publishable_key:
        raise HTTPException(status_code=503, detail="Supabase authentication is not configured")
    try:
        from supabase import create_client
        client = create_client(settings.supabase_url, settings.supabase_publishable_key)
        response = client.auth.get_user(token)
        auth_user = response.user
        if not auth_user:
            raise ValueError("User not found")
        metadata = auth_user.user_metadata or {}
        app_metadata = auth_user.app_metadata or {}
        return AuthUser(
            id=str(auth_user.id),
            username=metadata.get("username") or auth_user.email or "Customer",
            email=auth_user.email or "",
            role=app_metadata.get("role", "customer"),
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token") from exc


async def manager_user(user: AuthUser = Depends(current_user)) -> AuthUser:
    if user.role != "manager":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager access required")
    return user


async def optional_user(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> AuthUser | None:
    if not authorization:
        return None
    return await current_user(authorization, settings)

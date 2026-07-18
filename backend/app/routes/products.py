import json
from fastapi import APIRouter, Depends, HTTPException
from ..auth import manager_user
from ..config import Settings, get_settings
from ..models.schemas import AuthUser, GenerateDetailsRequest, GenerateDetailsResponse, Product
from ..repository import MemoryRepository, SupabaseRepository, get_repository

router = APIRouter(prefix="/products", tags=["products"])

DETAILS_SYSTEM_PROMPT = """You are a product copywriter for an e-commerce store called PulseCart.
Given a product name, category, and short description, generate the following fields as JSON:
- overview: A 2-3 sentence product overview suitable for a product detail page.
- howItWorks: A 2-3 sentence explanation of how the product works or what it does.
- bestFor: An array of 3-4 strings describing who or what this product is best for.
- limitations: An array of 2-3 strings describing limitations or considerations.

Return ONLY valid JSON with these 4 keys. No markdown, no explanation."""


@router.get("", response_model=list[Product])
def list_products(repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    try:
        return repo.list_products()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Product catalog could not be loaded: {str(exc)[:300]}") from exc


@router.get("/{product_id}", response_model=Product)
def get_product(product_id: str, repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    try:
        return repo.get_product(product_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Product could not be loaded: {str(exc)[:300]}") from exc


@router.post("/generate-details", response_model=GenerateDetailsResponse)
def generate_product_details(
    body: GenerateDetailsRequest,
    settings: Settings = Depends(get_settings),
    _: AuthUser = Depends(manager_user),
):
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="Anthropic API key is not configured")

    try:
        import anthropic
    except ImportError:
        raise HTTPException(status_code=500, detail="anthropic package is not installed")

    try:
        client_kwargs: dict = {"api_key": settings.anthropic_api_key}
        if settings.anthropic_base_url:
            client_kwargs["base_url"] = settings.anthropic_base_url

        client = anthropic.Anthropic(**client_kwargs)
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=DETAILS_SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": f"Product name: {body.name}\nCategory: {body.category}\nDescription: {body.description}",
                }
            ],
        )

        text = message.content[0].text.strip()
        # Strip markdown fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        data = json.loads(text)
        return GenerateDetailsResponse(
            overview=data.get("overview", ""),
            howItWorks=data.get("howItWorks", ""),
            bestFor=data.get("bestFor", []),
            limitations=data.get("limitations", []),
        )
    except HTTPException:
        raise
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="AI returned invalid JSON. Please try again.") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {str(exc)[:300]}") from exc

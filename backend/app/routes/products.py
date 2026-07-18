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
        import httpx

        base_url = (settings.anthropic_base_url or "https://api.anthropic.com").rstrip("/")
        url = f"{base_url}/v1/messages"

        print(f"[generate-details] POST {url}")
        print(f"[generate-details] Model: mimo-v2.5-pro")

        payload = {
            "model": "mimo-v2.5-pro",
            "max_tokens": 1024,
            "system": DETAILS_SYSTEM_PROMPT,
            "messages": [
                {
                    "role": "user",
                    "content": f"Product name: {body.name}\nCategory: {body.category}\nDescription: {body.description}",
                }
            ],
        }

        with httpx.Client(timeout=60) as client:
            resp = client.post(
                url,
                json=payload,
                headers={
                    "x-api-key": settings.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
            )

        print(f"[generate-details] Response status: {resp.status_code}")

        if resp.status_code != 200:
            print(f"[generate-details] Error body: {resp.text[:500]}")
            raise HTTPException(
                status_code=502,
                detail=f"AI API returned status {resp.status_code}: {resp.text[:300]}",
            )

        data = resp.json()
        print(f"[generate-details] Response keys: {list(data.keys())}")
        print(f"[generate-details] Response snippet: {json.dumps(data)[:500]}")
        text = data["content"][0]["text"].strip()
        # Strip markdown fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        parsed = json.loads(text)
        return GenerateDetailsResponse(
            overview=parsed.get("overview", ""),
            howItWorks=parsed.get("howItWorks", ""),
            bestFor=parsed.get("bestFor", []),
            limitations=parsed.get("limitations", []),
        )
    except HTTPException:
        raise
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="AI returned invalid JSON. Please try again.") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {str(exc)[:500]}") from exc

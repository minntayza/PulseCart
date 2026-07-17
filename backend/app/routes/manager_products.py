import json
from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from httpx import TimeoutException
from starlette.concurrency import run_in_threadpool
from ..auth import manager_user
from ..models.schemas import AuthUser, Product
from ..repository import SupabaseRepository, get_repository

router = APIRouter(prefix="/manager/products", tags=["manager-products"])
ALLOWED_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


def string_list(value: str, field: str) -> list[str]:
    try:
        parsed = json.loads(value)
        if not isinstance(parsed, list) or not all(isinstance(item, str) and item.strip() for item in parsed):
            raise ValueError
        return [item.strip() for item in parsed]
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"{field} must be a JSON array of non-empty strings") from exc


def specification_list(value: str) -> list[dict]:
    try:
        parsed = json.loads(value)
        if not isinstance(parsed, list) or not all(isinstance(item, dict) and item.get("label") and item.get("value") for item in parsed):
            raise ValueError
        return parsed
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="specifications must be a JSON array of objects with label and value") from exc


@router.post("", response_model=Product, status_code=201)
async def create_product(
    name: str = Form(min_length=2, max_length=150),
    category: str = Form(pattern="^(laptops|chairs|headphones|accessories)$"),
    price: float = Form(gt=0),
    stock: int = Form(ge=0),
    description: str = Form(min_length=5, max_length=500),
    overview: str = Form(min_length=10, max_length=3000),
    how_it_works: str = Form(min_length=10, max_length=3000),
    best_for: str = Form(default="[]"),
    limitations: str = Form(default="[]"),
    specifications: str = Form(default="[]"),
    delivery_estimate: str = Form(default="2–5 business days", max_length=100),
    warranty: str = Form(default="1-year limited warranty", max_length=150),
    badge: str | None = Form(default=None, pattern="^(agent|trending|match)$"),
    image: UploadFile | None = File(default=None),
    _: AuthUser = Depends(manager_user),
    repo=Depends(get_repository),
):
    if not isinstance(repo, SupabaseRepository):
        raise HTTPException(status_code=503, detail="Product image upload requires Supabase mode")
    product_id = f"PRD-{uuid4().hex[:10].upper()}"
    bucket = repo.client.storage.from_("product-images")
    object_path: str | None = None
    image_url: str | None = None
    try:
        if image is not None:
            if image.content_type not in ALLOWED_TYPES:
                raise HTTPException(status_code=415, detail="Image must be JPEG, PNG, or WebP")
            contents = await image.read(MAX_IMAGE_BYTES + 1)
            if len(contents) > MAX_IMAGE_BYTES:
                raise HTTPException(status_code=413, detail="Image must be 5 MB or smaller")
            if not contents:
                raise HTTPException(status_code=422, detail="Image file is empty")
            extension = ALLOWED_TYPES[image.content_type]
            object_path = f"{category}/{product_id}{extension}"
            try:
                await run_in_threadpool(
                    bucket.upload,
                    path=object_path,
                    file=contents,
                    file_options={"content-type": image.content_type, "cache-control": "3600", "upsert": "false"},
                )
            except TimeoutException as exc:
                raise HTTPException(
                    status_code=504,
                    detail="The product image upload timed out. Please try again; the storage timeout is now 120 seconds.",
                ) from exc
            except Exception as exc:
                raise HTTPException(status_code=502, detail=f"Product image upload failed: {str(exc)[:300]}") from exc
            image_url = bucket.get_public_url(object_path)
        return repo.create_product({
            "id": product_id, "name": name.strip(), "category": category, "price": price,
            "image": Path(image.filename).name if image and image.filename else "product", "image_url": image_url,
            "description": description.strip(), "rating": 0, "reviews": 0,
            "badge": badge or None, "stock": stock, "overview": overview.strip(),
            "how_it_works": how_it_works.strip(), "best_for": string_list(best_for, "best_for"),
            "limitations": string_list(limitations, "limitations"),
            "specifications": specification_list(specifications), "delivery_estimate": delivery_estimate.strip(),
            "warranty": warranty.strip(), "is_active": True,
        })
    except HTTPException:
        raise
    except Exception as exc:
        try:
            if object_path:
                bucket.remove([object_path])
        except Exception:
            pass
        raise HTTPException(
            status_code=502,
            detail=f"Product could not be created: {str(exc)[:400]}",
        ) from exc

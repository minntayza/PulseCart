from fastapi import APIRouter, Depends, HTTPException
from ..models.schemas import Product
from ..repository import MemoryRepository, SupabaseRepository, get_repository

router = APIRouter(prefix="/products", tags=["products"])

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

from fastapi import APIRouter, Depends
from ..agents.order_coordinator import order_trace
from ..auth import current_user, manager_user
from ..models.schemas import AuthUser, CreateOrderRequest, Order, UpdateOrderStatusRequest
from ..repository import MemoryRepository, SupabaseRepository, get_repository

router = APIRouter(tags=["orders"])

@router.post("/orders", response_model=Order, status_code=201)
def create_order(payload: CreateOrderRequest, user: AuthUser = Depends(current_user), repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    order = repo.create_order(user.id, payload)
    repo.add_trace(order_trace(order))
    return order

@router.get("/orders/me", response_model=list[Order])
def my_orders(user: AuthUser = Depends(current_user), repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    return repo.user_orders(user.id)

@router.get("/manager/orders", response_model=list[Order])
def manager_orders(_: AuthUser = Depends(manager_user), repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    return repo.all_orders()

@router.patch("/manager/orders/{order_id}", response_model=Order)
def update_order(order_id: str, payload: UpdateOrderStatusRequest, _: AuthUser = Depends(manager_user), repo: MemoryRepository | SupabaseRepository = Depends(get_repository)):
    order = repo.update_order(order_id, payload)
    repo.add_trace(order_trace(order, "manager decision"))
    return order

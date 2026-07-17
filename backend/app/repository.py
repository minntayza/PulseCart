from datetime import datetime, timezone
from decimal import Decimal
from threading import Lock
from uuid import uuid4
from fastapi import HTTPException
from .fixtures import PRODUCTS
from .models.schemas import AgentTrace, CreateFeedbackRequest, CreateOrderRequest, Feedback, Order, OrderItem, Product, UpdateOrderStatusRequest
from .config import get_settings


class MemoryRepository:
    def __init__(self) -> None:
        self.products = list(PRODUCTS)
        self.orders: list[Order] = []
        self.traces: list[AgentTrace] = []
        self.feedback: list[Feedback] = []
        self._lock = Lock()

    def list_products(self) -> list[Product]:
        return list(self.products)

    def get_product(self, product_id: str) -> Product:
        product = next((item for item in self.products if item.id == product_id), None)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product

    def add_trace(self, trace: AgentTrace) -> None:
        with self._lock:
            self.traces = [trace, *self.traces][:100]

    def create_order(self, user_id: str, payload: CreateOrderRequest) -> Order:
        lines: list[OrderItem] = []
        total = Decimal("0")
        for requested in payload.items:
            product = self.get_product(requested.productId)
            line_total = product.price * requested.quantity
            total += line_total
            lines.append(OrderItem(product=product, quantity=requested.quantity, lineTotal=line_total))
        order = Order(
            id=f"ORD-{uuid4().hex[:8].upper()}", userId=user_id,
            customerName=payload.customerName.strip(), items=lines,
            address=payload.address.strip(), phone=payload.phone.strip(),
            total=total, status="pending", createdAt=datetime.now(timezone.utc),
        )
        with self._lock:
            self.orders.insert(0, order)
        return order

    def user_orders(self, user_id: str) -> list[Order]:
        return [order for order in self.orders if order.userId == user_id]

    def all_orders(self) -> list[Order]:
        order_rank = {"pending": 0, "approved": 1, "rejected": 2}
        return sorted(self.orders, key=lambda order: (order_rank[order.status], -order.createdAt.timestamp()))

    def update_order(self, order_id: str, payload: UpdateOrderStatusRequest) -> Order:
        with self._lock:
            for index, order in enumerate(self.orders):
                if order.id == order_id:
                    updated = order.model_copy(update={"status": payload.status})
                    self.orders[index] = updated
                    return updated
        raise HTTPException(status_code=404, detail="Order not found")

    def create_feedback(self, user_id: str, payload: CreateFeedbackRequest) -> Feedback:
        feedback = Feedback(id=f"FDB-{uuid4().hex[:8].upper()}", userId=user_id, message=payload.message.strip())
        with self._lock:
            self.feedback.insert(0, feedback)
        return feedback

    def list_feedback(self) -> list[Feedback]:
        return list(self.feedback)


repository = MemoryRepository()


class SupabaseRepository:
    def __init__(self, url: str, secret_key: str, storage_timeout: int = 120) -> None:
        from supabase import ClientOptions, create_client
        self.client = create_client(
            url,
            secret_key,
            options=ClientOptions(storage_client_timeout=storage_timeout),
        )

    @staticmethod
    def _product(row: dict) -> Product:
        return Product(
            **row,
            imageUrl=row.get("image_url"), howItWorks=row.get("how_it_works"),
            bestFor=row.get("best_for") or [],
            deliveryEstimate=row.get("delivery_estimate") or "2–5 business days",
            isActive=row.get("is_active", True),
        )

    def list_products(self) -> list[Product]:
        response = self.client.table("products").select("*").eq("is_active", True).order("name").execute()
        return [self._product(row) for row in response.data]

    def get_product(self, product_id: str) -> Product:
        response = self.client.table("products").select("*").eq("id", product_id).maybe_single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        return self._product(response.data)

    def create_product(self, row: dict) -> Product:
        response = self.client.table("products").insert(row).execute()
        return self._product(response.data[0])

    def add_trace(self, trace: AgentTrace) -> None:
        self.client.table("audit_log").insert({
            "agent_name": trace.agentName, "action": trace.lastAction,
            "input": {}, "output": trace.model_dump(mode="json"),
        }).execute()

    def create_order(self, user_id: str, payload: CreateOrderRequest) -> Order:
        lines: list[OrderItem] = []
        total = Decimal("0")
        for requested in payload.items:
            product = self.get_product(requested.productId)
            line_total = product.price * requested.quantity
            total += line_total
            lines.append(OrderItem(product=product, quantity=requested.quantity, lineTotal=line_total))
        order_id = f"ORD-{uuid4().hex[:8].upper()}"
        created_at = datetime.now(timezone.utc)
        self.client.table("orders").insert({
            "id": order_id, "user_id": user_id, "customer_name": payload.customerName.strip(),
            "address": payload.address.strip(), "phone": payload.phone.strip(),
            "total": str(total), "status": "pending", "created_at": created_at.isoformat(),
        }).execute()
        self.client.table("order_items").insert([
            {"order_id": order_id, "product_id": line.product.id, "quantity": line.quantity, "unit_price": str(line.product.price), "line_total": str(line.lineTotal)}
            for line in lines
        ]).execute()
        return Order(id=order_id, userId=user_id, customerName=payload.customerName.strip(), items=lines, address=payload.address.strip(), phone=payload.phone.strip(), total=total, status="pending", createdAt=created_at)

    def _orders(self, query) -> list[Order]:
        response = query.select("*,order_items(quantity,line_total,products(*))").order("created_at", desc=True).execute()
        orders: list[Order] = []
        for row in response.data:
            lines = [OrderItem(product=self._product(item["products"]), quantity=item["quantity"], lineTotal=item["line_total"]) for item in row.get("order_items", [])]
            orders.append(Order(id=row["id"], userId=row["user_id"], customerName=row["customer_name"], items=lines, address=row["address"], phone=row["phone"], total=row["total"], status=row["status"], createdAt=row["created_at"]))
        return orders

    def user_orders(self, user_id: str) -> list[Order]:
        return self._orders(self.client.table("orders").eq("user_id", user_id))

    def all_orders(self) -> list[Order]:
        return self._orders(self.client.table("orders"))

    def update_order(self, order_id: str, payload: UpdateOrderStatusRequest) -> Order:
        response = self.client.table("orders").update({"status": payload.status}).eq("id", order_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Order not found")
        orders = self._orders(self.client.table("orders").eq("id", order_id))
        return orders[0]

    def create_feedback(self, user_id: str, payload: CreateFeedbackRequest) -> Feedback:
        response = self.client.table("feedback").insert({"user_id": user_id, "message": payload.message.strip()}).execute()
        row = response.data[0]
        return Feedback(id=str(row["id"]), userId=row["user_id"], message=row["message"], theme=row["theme"], severity=row["severity"], createdAt=row["created_at"])

    def list_feedback(self) -> list[Feedback]:
        response = self.client.table("feedback").select("*").order("created_at", desc=True).execute()
        return [Feedback(id=str(row["id"]), userId=row["user_id"], message=row["message"], theme=row["theme"], severity=row["severity"], createdAt=row["created_at"]) for row in response.data]


def get_repository() -> MemoryRepository | SupabaseRepository:
    settings = get_settings()
    if settings.use_mock_data:
        return repository
    if not settings.supabase_configured:
        raise RuntimeError("Set SUPABASE_URL and SUPABASE_SECRET_KEY or enable USE_MOCK_DATA")
    if not hasattr(get_repository, "_supabase"):
        setattr(
            get_repository,
            "_supabase",
            SupabaseRepository(
                settings.supabase_url or "",
                settings.supabase_secret_key or "",
                settings.supabase_storage_timeout,
            ),
        )
    return getattr(get_repository, "_supabase")

from datetime import datetime, timezone
from decimal import Decimal
from threading import Lock
from uuid import uuid4
from fastapi import HTTPException
import httpx
from .fixtures import PRODUCTS
from .models.schemas import AgentTrace, AuthUser, CreateFeedbackRequest, CreateOrderRequest, Feedback, FeedbackInsights, Order, OrderItem, Product, UpdateOrderStatusRequest
from .config import get_settings


class MemoryRepository:
    def __init__(self) -> None:
        self.products = list(PRODUCTS)
        self.orders: list[Order] = []
        self.traces: list[AgentTrace] = []
        self.feedback: list[Feedback] = []
        self.email_outbox: dict[str, dict] = {}
        self.insights: list[FeedbackInsights] = []
        self._lock = Lock()

    def list_products(self) -> list[Product]:
        return list(self.products)

    def get_product(self, product_id: str) -> Product:
        product = next((item for item in self.products if item.id == product_id), None)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product

    def create_product(self, row: dict) -> Product:
        product = Product(
            **row,
            imageUrl=row.get("image_url"), howItWorks=row.get("how_it_works"),
            bestFor=row.get("best_for") or [],
            deliveryEstimate=row.get("delivery_estimate") or "2–5 business days",
            isActive=row.get("is_active", True),
        )
        with self._lock:
            self.products.insert(0, product)
        return product

    def update_product(self, product_id: str, row: dict) -> Product:
        with self._lock:
            for index, product in enumerate(self.products):
                if product.id == product_id:
                    updated_dict = product.model_dump(by_alias=True)
                    # Merge existing with new values
                    for k, v in row.items():
                        if k == "image_url":
                            updated_dict["imageUrl"] = v
                        elif k == "how_it_works":
                            updated_dict["howItWorks"] = v
                        elif k == "best_for":
                            updated_dict["bestFor"] = v
                        elif k == "delivery_estimate":
                            updated_dict["deliveryEstimate"] = v
                        elif k == "is_active":
                            updated_dict["isActive"] = v
                        else:
                            updated_dict[k] = v
                    updated = Product(**updated_dict)
                    self.products[index] = updated
                    return updated
        raise HTTPException(status_code=404, detail="Product not found")

    def delete_product(self, product_id: str) -> None:
        with self._lock:
            for index, product in enumerate(self.products):
                if product.id == product_id:
                    self.products.pop(index)
                    return
        raise HTTPException(status_code=404, detail="Product not found")

    def add_trace(self, trace: AgentTrace) -> None:
        with self._lock:
            self.traces = [trace, *self.traces][:100]

    def create_order(self, user: AuthUser, payload: CreateOrderRequest) -> Order:
        lines: list[OrderItem] = []
        total = Decimal("0")
        for requested in payload.items:
            product = self.get_product(requested.productId)
            line_total = product.price * requested.quantity
            total += line_total
            lines.append(OrderItem(product=product, quantity=requested.quantity, lineTotal=line_total))
        order = Order(
            id=f"ORD-{uuid4().hex[:8].upper()}", userId=user.id,
            customerName=payload.customerName.strip(), customerEmail=user.email, items=lines,
            address=payload.address.strip(), phone=payload.phone.strip(),
            total=total, status="pending", createdAt=datetime.now(timezone.utc),
        )
        with self._lock:
            self.orders.insert(0, order)
        return order

    def user_orders(self, user_id: str) -> list[Order]:
        return [order for order in self.orders if order.userId == user_id]

    def all_orders(self) -> list[Order]:
        order_rank = {"pending": 0, "approved": 1, "delivered": 2, "rejected": 3}
        return sorted(self.orders, key=lambda order: (order_rank[order.status], -order.createdAt.timestamp()))

    def update_order(self, order_id: str, payload: UpdateOrderStatusRequest) -> Order:
        with self._lock:
            for index, order in enumerate(self.orders):
                if order.id == order_id:
                    updated = order.model_copy(update={"status": payload.status})
                    self.orders[index] = updated
                    return updated
        raise HTTPException(status_code=404, detail="Order not found")

    def mark_delivered(self, order_id: str) -> Order:
        with self._lock:
            for index, order in enumerate(self.orders):
                if order.id != order_id:
                    continue
                if order.status == "delivered":
                    return order
                if order.status != "approved":
                    raise HTTPException(status_code=409, detail="Only approved orders can be marked as delivered")
                updated = order.model_copy(update={"status": "delivered", "deliveredAt": datetime.now(timezone.utc)})
                self.orders[index] = updated
                return updated
        raise HTTPException(status_code=404, detail="Order not found")

    def restore_approved(self, order_id: str) -> None:
        with self._lock:
            for index, order in enumerate(self.orders):
                if order.id == order_id and order.status == "delivered":
                    self.orders[index] = order.model_copy(update={"status": "approved", "deliveredAt": None})
                    return

    def queue_delivery_email(self, order: Order) -> tuple[str, str]:
        if not order.customerEmail:
            raise HTTPException(status_code=409, detail="Order has no customer email")
        key = f"{order.id}:order_delivered"
        with self._lock:
            self.email_outbox.setdefault(key, {"status": "pending", "recipient": order.customerEmail, "attempts": 0})
        return key, self.email_outbox[key]["status"]

    def queue_rejection_email(self, order: Order) -> tuple[str, str]:
        if not order.customerEmail:
            raise HTTPException(status_code=409, detail="Order has no customer email")
        key = f"{order.id}:order_rejected"
        with self._lock:
            self.email_outbox.setdefault(key, {"status": "pending", "recipient": order.customerEmail, "attempts": 0})
        return key, self.email_outbox[key]["status"]

    def complete_delivery_email(self, outbox_id: str, provider_message_id: str) -> None:
        with self._lock:
            self.email_outbox[outbox_id].update({"status": "sent", "provider_message_id": provider_message_id, "attempts": 1})

    def fail_delivery_email(self, outbox_id: str, error: str) -> None:
        with self._lock:
            self.email_outbox[outbox_id].update({"status": "failed", "error_message": error[:500], "attempts": 1})

    def create_feedback(self, user_id: str, payload: CreateFeedbackRequest) -> Feedback:
        feedback = Feedback(id=f"FDB-{uuid4().hex[:8].upper()}", userId=user_id, message=payload.message.strip())
        with self._lock:
            self.feedback.insert(0, feedback)
        return feedback

    def list_feedback(self) -> list[Feedback]:
        return list(self.feedback)

    def save_insights(self, insights: FeedbackInsights) -> None:
        with self._lock:
            self.insights.insert(0, insights)
            self.insights = self.insights[:10]

    def get_insights(self) -> FeedbackInsights | None:
        return self.insights[0] if self.insights else None


repository = MemoryRepository()


class SupabaseRepository:
    def __init__(self, url: str, secret_key: str, storage_timeout: int = 120) -> None:
        from supabase import ClientOptions, create_client
        # postgrest-py enables HTTP/2 by default. Some Supabase edge connections
        # occasionally terminate reused HTTP/2 streams, which surfaces as
        # httpx.RemoteProtocolError and takes down every catalog-backed route.
        # HTTP/1.1 is fully supported by Supabase and avoids that failure mode.
        self._http_client = httpx.Client(
            timeout=storage_timeout,
            follow_redirects=True,
            http2=False,
        )
        self.client = create_client(
            url,
            secret_key,
            options=ClientOptions(
                postgrest_client_timeout=storage_timeout,
                storage_client_timeout=storage_timeout,
                httpx_client=self._http_client,
            ),
        )
        self.insights: list[FeedbackInsights] = []
        self._lock = Lock()

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

    def update_product(self, product_id: str, row: dict) -> Product:
        response = self.client.table("products").update(row).eq("id", product_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        return self._product(response.data[0])

    def delete_product(self, product_id: str) -> None:
        response = self.client.table("products").delete().eq("id", product_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")

    def add_trace(self, trace: AgentTrace) -> None:
        self.client.table("audit_log").insert({
            "agent_name": trace.agentName, "action": trace.lastAction,
            "input": {}, "output": trace.model_dump(mode="json"),
        }).execute()

    def create_order(self, user: AuthUser, payload: CreateOrderRequest) -> Order:
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
            "id": order_id, "user_id": user.id, "customer_name": payload.customerName.strip(),
            "customer_email": user.email,
            "address": payload.address.strip(), "phone": payload.phone.strip(),
            "total": str(total), "status": "pending", "created_at": created_at.isoformat(),
        }).execute()
        self.client.table("order_items").insert([
            {"order_id": order_id, "product_id": line.product.id, "quantity": line.quantity, "unit_price": str(line.product.price), "line_total": str(line.lineTotal)}
            for line in lines
        ]).execute()
        return Order(id=order_id, userId=user.id, customerName=payload.customerName.strip(), customerEmail=user.email, items=lines, address=payload.address.strip(), phone=payload.phone.strip(), total=total, status="pending", createdAt=created_at)

    def _orders(self, *, user_id: str | None = None, order_id: str | None = None) -> list[Order]:
        query = self.client.table("orders").select("*,order_items(quantity,line_total,products(*))")
        if user_id is not None:
            query = query.eq("user_id", user_id)
        if order_id is not None:
            query = query.eq("id", order_id)
        response = query.order("created_at", desc=True).execute()
        orders: list[Order] = []
        for row in response.data:
            lines = [OrderItem(product=self._product(item["products"]), quantity=item["quantity"], lineTotal=item["line_total"]) for item in row.get("order_items", [])]
            orders.append(Order(id=row["id"], userId=row["user_id"], customerName=row["customer_name"], customerEmail=row.get("customer_email"), items=lines, address=row["address"], phone=row["phone"], total=row["total"], status=row["status"], createdAt=row["created_at"], deliveredAt=row.get("delivered_at")))
        return orders

    def user_orders(self, user_id: str) -> list[Order]:
        return self._orders(user_id=user_id)

    def all_orders(self) -> list[Order]:
        return self._orders()

    def update_order(self, order_id: str, payload: UpdateOrderStatusRequest) -> Order:
        response = self.client.table("orders").update({"status": payload.status}).eq("id", order_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Order not found")
        orders = self._orders(order_id=order_id)
        return orders[0]

    def mark_delivered(self, order_id: str) -> Order:
        delivered_at = datetime.now(timezone.utc)
        response = self.client.table("orders").update({
            "status": "delivered", "delivered_at": delivered_at.isoformat(),
        }).eq("id", order_id).eq("status", "approved").execute()
        if not response.data:
            existing = self._orders(order_id=order_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Order not found")
            if existing[0].status == "delivered":
                return existing[0]
            raise HTTPException(status_code=409, detail="Only approved orders can be marked as delivered")
        return self._orders(order_id=order_id)[0]

    def restore_approved(self, order_id: str) -> None:
        self.client.table("orders").update({
            "status": "approved", "delivered_at": None,
        }).eq("id", order_id).eq("status", "delivered").execute()

    def queue_delivery_email(self, order: Order) -> tuple[str, str]:
        if not order.customerEmail:
            raise HTTPException(status_code=409, detail="Order has no customer email")
        existing = self.client.table("email_outbox").select("id,status").eq(
            "order_id", order.id,
        ).eq("event_type", "order_delivered").maybe_single().execute()
        if existing is not None and existing.data:
            return str(existing.data["id"]), existing.data["status"]
        response = self.client.table("email_outbox").insert({
            "order_id": order.id,
            "event_type": "order_delivered",
            "recipient": order.customerEmail,
            "subject": f"PulseCart အော်ဒါ {order.id} ပို့ဆောင်ပြီးပါပြီ",
            "payload": order.model_dump(mode="json"),
            "status": "pending",
        }).execute()
        return str(response.data[0]["id"]), response.data[0]["status"]

    def queue_rejection_email(self, order: Order) -> tuple[str, str]:
        if not order.customerEmail:
            raise HTTPException(status_code=409, detail="Order has no customer email")
        existing = self.client.table("email_outbox").select("id,status").eq(
            "order_id", order.id,
        ).eq("event_type", "order_rejected").maybe_single().execute()
        if existing is not None and existing.data:
            return str(existing.data["id"]), existing.data["status"]
        response = self.client.table("email_outbox").insert({
            "order_id": order.id,
            "event_type": "order_rejected",
            "recipient": order.customerEmail,
            "subject": f"PulseCart အော်ဒါ {order.id} ကို လက်ခံဆောင်ရွက်ပေးနိုင်ခြင်း မရှိပါ",
            "payload": order.model_dump(mode="json"),
            "status": "pending",
        }).execute()
        return str(response.data[0]["id"]), response.data[0]["status"]

    def complete_delivery_email(self, outbox_id: str, provider_message_id: str) -> None:
        self.client.table("email_outbox").update({
            "status": "sent", "attempts": 1, "provider_message_id": provider_message_id,
            "sent_at": datetime.now(timezone.utc).isoformat(), "error_message": None,
        }).eq("id", outbox_id).execute()

    def fail_delivery_email(self, outbox_id: str, error: str) -> None:
        self.client.table("email_outbox").update({
            "status": "failed", "attempts": 1, "error_message": error[:500],
        }).eq("id", outbox_id).execute()

    def create_feedback(self, user_id: str, payload: CreateFeedbackRequest) -> Feedback:
        response = self.client.table("feedback").insert({"user_id": user_id, "message": payload.message.strip()}).execute()
        row = response.data[0]
        return Feedback(id=str(row["id"]), userId=row["user_id"], message=row["message"], theme=row["theme"], severity=row["severity"], createdAt=row["created_at"])

    def list_feedback(self) -> list[Feedback]:
        response = self.client.table("feedback").select("*").order("created_at", desc=True).execute()
        return [Feedback(id=str(row["id"]), userId=row["user_id"], message=row["message"], theme=row["theme"], severity=row["severity"], createdAt=row["created_at"]) for row in response.data]

    def save_insights(self, insights: FeedbackInsights) -> None:
        with self._lock:
            self.insights.insert(0, insights)
            self.insights = self.insights[:10]

    def get_insights(self) -> FeedbackInsights | None:
        return self.insights[0] if self.insights else None


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

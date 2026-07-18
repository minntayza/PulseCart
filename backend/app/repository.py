from datetime import datetime, timezone
from decimal import Decimal
from threading import Lock
from uuid import uuid4
from fastapi import HTTPException
from .fixtures import PRODUCTS
from .models.schemas import AgentTrace, AuthUser, ChatConversation, ChatMessage, CreateFeedbackRequest, CreateOrderRequest, Feedback, FeedbackInsights, Order, OrderItem, Product, UpdateOrderStatusRequest, WantedProduct
from .config import get_settings
from .agents.feedback_agent import classify_feedback_theme


class MemoryRepository:
    def __init__(self) -> None:
        self.products = list(PRODUCTS)
        self.orders: list[Order] = []
        self.traces: list[AgentTrace] = []
        self.feedback: list[Feedback] = []
        self.email_outbox: dict[str, dict] = {}
        self.insights: list[FeedbackInsights] = []
        self.conversations: list[ChatConversation] = []
        self.messages: list[ChatMessage] = []
        self.wanted_products: list[WantedProduct] = []
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
            if product.stock < requested.quantity:
                raise HTTPException(status_code=409, detail=f"Insufficient stock for {product.name}: {product.stock} available, {requested.quantity} requested")
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
                    # Decrement stock when approving
                    if payload.status == "approved" and order.status == "pending":
                        for item in order.items:
                            product = next((p for p in self.products if p.id == item.product.id), None)
                            if product and product.stock >= item.quantity:
                                product.stock -= item.quantity
                    # Restore stock when rejecting (if was approved)
                    elif payload.status == "rejected" and order.status == "approved":
                        for item in order.items:
                            product = next((p for p in self.products if p.id == item.product.id), None)
                            if product:
                                product.stock += item.quantity
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
        message = payload.message.strip()
        feedback = Feedback(
            id=f"FDB-{uuid4().hex[:8].upper()}", userId=user_id,
            message=message, theme=classify_feedback_theme(message),
        )
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

    # ── Chat ──────────────────────────────────────────────

    def create_conversation(self, user_id: str, title: str) -> ChatConversation:
        now = datetime.now(timezone.utc).isoformat()
        conv = ChatConversation(id=f"CONV-{uuid4().hex[:8].upper()}", userId=user_id, title=title, createdAt=now, updatedAt=now)
        with self._lock:
            self.conversations.insert(0, conv)
        return conv

    def list_conversations(self, user_id: str) -> list[ChatConversation]:
        return [c for c in self.conversations if c.userId == user_id]

    def get_conversation(self, conversation_id: str) -> ChatConversation | None:
        return next((c for c in self.conversations if c.id == conversation_id), None)

    def get_messages(self, conversation_id: str) -> list[ChatMessage]:
        return [m for m in self.messages if m.conversationId == conversation_id]

    def add_message(self, conversation_id: str, role: str, content: str, product_ids: list[str]) -> ChatMessage:
        now = datetime.now(timezone.utc).isoformat()
        msg = ChatMessage(
            id=f"MSG-{uuid4().hex[:8].upper()}", conversationId=conversation_id,
            role=role, content=content, productIds=product_ids, createdAt=now,
        )
        with self._lock:
            self.messages.append(msg)
            # Update conversation timestamp
            for c in self.conversations:
                if c.id == conversation_id:
                    c.updatedAt = now
                    break
        return msg

    def upsert_wanted_product(self, user_id: str, product_name: str, description: str | None, conversation_id: str | None) -> WantedProduct:
        normalized = " ".join(product_name.lower().split())
        with self._lock:
            existing = next((w for w in self.wanted_products if w.productName == normalized), None)
            if existing:
                existing.mentionCount += 1
                existing.updatedAt = datetime.now(timezone.utc).isoformat()
                return existing
            now = datetime.now(timezone.utc).isoformat()
            wp = WantedProduct(
                id=f"WP-{uuid4().hex[:8].upper()}", userId=user_id,
                productName=normalized, description=description or "",
                mentionCount=1, conversationId=conversation_id,
                createdAt=now, updatedAt=now, status="pending",
            )
            self.wanted_products.insert(0, wp)
            return wp

    def list_wanted_products(self) -> list[WantedProduct]:
        return sorted(self.wanted_products, key=lambda w: -w.mentionCount)

    def update_wanted_status(self, wanted_id: str, status: str) -> WantedProduct:
        with self._lock:
            for wp in self.wanted_products:
                if wp.id == wanted_id:
                    wp.status = status  # type: ignore[assignment]
                    wp.updatedAt = datetime.now(timezone.utc).isoformat()
                    return wp
        raise HTTPException(status_code=404, detail="Wanted product not found")

    def delete_wanted_product(self, wanted_id: str) -> None:
        with self._lock:
            for index, wp in enumerate(self.wanted_products):
                if wp.id == wanted_id:
                    self.wanted_products.pop(index)
                    return
        raise HTTPException(status_code=404, detail="Wanted product not found")


repository = MemoryRepository()


class SupabaseRepository:
    def __init__(self, url: str, secret_key: str, storage_timeout: int = 120) -> None:
        from supabase import ClientOptions, create_client
        self.client = create_client(
            url,
            secret_key,
            options=ClientOptions(storage_client_timeout=storage_timeout),
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
            if product.stock < requested.quantity:
                raise HTTPException(status_code=409, detail=f"Insufficient stock for {product.name}: {product.stock} available, {requested.quantity} requested")
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
        # Get order items before updating
        existing = self._orders(order_id=order_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Order not found")
        order = existing[0]
        # Decrement stock when approving
        if payload.status == "approved" and order.status == "pending":
            for item in order.items:
                resp = self.client.table("products").select("stock").eq("id", item.product.id).execute()
                if resp.data:
                    current_stock = resp.data[0]["stock"]
                    new_stock = max(0, current_stock - item.quantity)
                    self.client.table("products").update({"stock": new_stock}).eq("id", item.product.id).execute()
        # Restore stock when rejecting (if was approved)
        elif payload.status == "rejected" and order.status == "approved":
            for item in order.items:
                resp = self.client.table("products").select("stock").eq("id", item.product.id).execute()
                if resp.data:
                    current_stock = resp.data[0]["stock"]
                    self.client.table("products").update({"stock": current_stock + item.quantity}).eq("id", item.product.id).execute()
        response = self.client.table("orders").update({"status": payload.status}).eq("id", order_id).execute()
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
        message = payload.message.strip()
        response = self.client.table("feedback").insert({
            "user_id": user_id, "message": message,
            "theme": classify_feedback_theme(message),
        }).execute()
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

    # ── Chat ──────────────────────────────────────────────

    def create_conversation(self, user_id: str, title: str) -> ChatConversation:
        now = datetime.now(timezone.utc).isoformat()
        response = self.client.table("chat_conversations").insert({
            "user_id": user_id, "title": title,
        }).execute()
        row = response.data[0]
        return ChatConversation(id=str(row["id"]), userId=row["user_id"], title=row["title"], createdAt=row["created_at"], updatedAt=row["updated_at"])

    def list_conversations(self, user_id: str) -> list[ChatConversation]:
        response = self.client.table("chat_conversations").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute()
        return [ChatConversation(id=str(r["id"]), userId=r["user_id"], title=r["title"], createdAt=r["created_at"], updatedAt=r["updated_at"]) for r in response.data]

    def get_conversation(self, conversation_id: str) -> ChatConversation | None:
        response = self.client.table("chat_conversations").select("*").eq("id", conversation_id).maybe_single().execute()
        if not response.data:
            return None
        r = response.data
        return ChatConversation(id=str(r["id"]), userId=r["user_id"], title=r["title"], createdAt=r["created_at"], updatedAt=r["updated_at"])

    def get_messages(self, conversation_id: str) -> list[ChatMessage]:
        response = self.client.table("chat_messages").select("*").eq("conversation_id", conversation_id).order("created_at").execute()
        return [ChatMessage(id=str(r["id"]), conversationId=r["conversation_id"], role=r["role"], content=r["content"], productIds=r.get("product_ids") or [], createdAt=r["created_at"]) for r in response.data]

    def add_message(self, conversation_id: str, role: str, content: str, product_ids: list[str]) -> ChatMessage:
        response = self.client.table("chat_messages").insert({
            "conversation_id": conversation_id, "role": role,
            "content": content, "product_ids": product_ids,
        }).execute()
        # Update conversation timestamp
        self.client.table("chat_conversations").update({"updated_at": datetime.now(timezone.utc).isoformat()}).eq("id", conversation_id).execute()
        r = response.data[0]
        return ChatMessage(id=str(r["id"]), conversationId=r["conversation_id"], role=r["role"], content=r["content"], productIds=r.get("product_ids") or [], createdAt=r["created_at"])

    def upsert_wanted_product(self, user_id: str, product_name: str, description: str | None, conversation_id: str | None) -> WantedProduct:
        normalized = " ".join(product_name.lower().split())
        existing = self.client.table("wanted_products").select("*").eq("product_name", normalized).maybe_single().execute()
        if existing and existing.data:
            new_count = (existing.data["mention_count"] or 0) + 1
            self.client.table("wanted_products").update({
                "mention_count": new_count, "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", existing.data["id"]).execute()
            r = existing.data
            r["mention_count"] = new_count
            return WantedProduct(id=str(r["id"]), userId=r["user_id"], productName=r["product_name"], description=r.get("description"), mentionCount=r["mention_count"], conversationId=r.get("conversation_id"), createdAt=r["created_at"], updatedAt=r["updated_at"], status=r["status"])
        response = self.client.table("wanted_products").insert({
            "user_id": user_id, "product_name": normalized,
            "description": description or "", "conversation_id": conversation_id,
        }).execute()
        r = response.data[0]
        return WantedProduct(id=str(r["id"]), userId=r["user_id"], productName=r["product_name"], description=r.get("description"), mentionCount=r["mention_count"], conversationId=r.get("conversation_id"), createdAt=r["created_at"], updatedAt=r["updated_at"], status=r["status"])

    def list_wanted_products(self) -> list[WantedProduct]:
        response = self.client.table("wanted_products").select("*").order("mention_count", desc=True).execute()
        return [WantedProduct(id=str(r["id"]), userId=r["user_id"], productName=r["product_name"], description=r.get("description"), mentionCount=r["mention_count"], conversationId=r.get("conversation_id"), createdAt=r["created_at"], updatedAt=r["updated_at"], status=r["status"]) for r in response.data]

    def update_wanted_status(self, wanted_id: str, status: str) -> WantedProduct:
        response = self.client.table("wanted_products").update({"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}).eq("id", wanted_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Wanted product not found")
        r = response.data[0]
        return WantedProduct(id=str(r["id"]), userId=r["user_id"], productName=r["product_name"], description=r.get("description"), mentionCount=r["mention_count"], conversationId=r.get("conversation_id"), createdAt=r["created_at"], updatedAt=r["updated_at"], status=r["status"])

    def delete_wanted_product(self, wanted_id: str) -> None:
        response = self.client.table("wanted_products").delete().eq("id", wanted_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Wanted product not found")


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

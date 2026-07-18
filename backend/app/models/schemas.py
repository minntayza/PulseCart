from datetime import datetime, timezone
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, Field, field_validator


Category = Literal["laptops", "chairs", "headphones", "accessories"]
OrderStatus = Literal["pending", "approved", "rejected", "delivered"]


class Product(BaseModel):
    id: str
    name: str
    category: Category
    price: Decimal = Field(gt=0)
    image: str = "product"
    description: str
    rating: float = Field(ge=0, le=5)
    reviews: int = Field(ge=0)
    badge: Literal["agent", "trending", "match"] | None = None
    imageUrl: str | None = None
    stock: int = Field(default=0, ge=0)
    overview: str | None = None
    howItWorks: str | None = None
    bestFor: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    specifications: list[dict] = Field(default_factory=list)
    deliveryEstimate: str = "2–5 business days"
    warranty: str = "1-year limited warranty"
    isActive: bool = True


class TraceLog(BaseModel):
    timestamp: str
    type: Literal["trigger", "reasoning", "action", "result", "guardrail"]
    text: str


class AgentTrace(BaseModel):
    agentName: str
    agentIcon: str
    status: Literal["active", "idle", "error"]
    lastAction: str
    lastRun: str
    logs: list[TraceLog]


class SearchRequest(BaseModel):
    query: str = Field(max_length=200)

    @field_validator("query")
    @classmethod
    def normalize_query(cls, value: str) -> str:
        return " ".join(value.strip().split())


class SearchResponse(BaseModel):
    products: list[Product]
    trace: AgentTrace


class OrderItemInput(BaseModel):
    productId: str
    quantity: int = Field(ge=1, le=20)


class CreateOrderRequest(BaseModel):
    customerName: str = Field(min_length=2, max_length=100)
    address: str = Field(min_length=5, max_length=500)
    phone: str = Field(min_length=5, max_length=30)
    items: list[OrderItemInput] = Field(min_length=1)


class OrderItem(BaseModel):
    product: Product
    quantity: int
    lineTotal: Decimal


class Order(BaseModel):
    id: str
    userId: str
    customerName: str
    customerEmail: str | None = None
    items: list[OrderItem]
    address: str
    phone: str
    total: Decimal
    status: OrderStatus = "pending"
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deliveredAt: datetime | None = None


class UpdateOrderStatusRequest(BaseModel):
    status: Literal["approved", "rejected"]


class AuthUser(BaseModel):
    id: str
    username: str
    email: str
    role: Literal["customer", "manager"]


class CreateFeedbackRequest(BaseModel):
    message: str = Field(min_length=3, max_length=2000)


class Feedback(BaseModel):
    id: str
    userId: str
    message: str
    theme: Literal["delivery", "pricing", "quality", "service", "other"] = "other"
    severity: Literal["low", "medium", "high"] = "low"
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FeedbackTheme(BaseModel):
    theme: str
    severity: Literal["low", "medium", "high"]
    fixSuggestion: str
    messageCount: int


class FeedbackInsights(BaseModel):
    themes: list[FeedbackTheme]
    totalMessages: int
    analyzedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GenerateDetailsRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    category: Category
    description: str = Field(min_length=5, max_length=500)


class GenerateDetailsResponse(BaseModel):
    shortDescription: str
    overview: str
    howItWorks: str
    bestFor: list[str]
    limitations: list[str]


# ── Chat models ──────────────────────────────────────────────

class ChatConversation(BaseModel):
    id: str
    userId: str
    title: str
    createdAt: str
    updatedAt: str


class ChatMessage(BaseModel):
    id: str
    conversationId: str
    role: Literal["user", "assistant"]
    content: str
    productIds: list[str] = []
    createdAt: str


class WantedProduct(BaseModel):
    id: str
    userId: str
    productName: str
    description: str | None = None
    mentionCount: int = 1
    conversationId: str | None = None
    createdAt: str
    updatedAt: str
    status: Literal["pending", "stocked", "dismissed"] = "pending"


class CreateConversationRequest(BaseModel):
    firstMessage: str | None = None


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    response: str
    productIds: list[str] = []
    wantedProduct: dict | None = None

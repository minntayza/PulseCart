"""Chat Agent — product advisor with LLM and keyword fallback."""

import json
import logging
import httpx
from ..models.schemas import ChatResponse, Product
from ..config import get_settings

logger = logging.getLogger("chat_agent")


def _build_catalog_context(products: list[Product]) -> str:
    """Build a compact product catalog string for the LLM prompt."""
    lines = []
    for p in products:
        stock_label = f"stock:{p.stock}" if p.stock > 0 else "OUT OF STOCK"
        lines.append(f"- [{p.id}] {p.name} | {p.category} | ${p.price} | {stock_label} | {p.description[:80]}")
    return "\n".join(lines)


SYSTEM_PROMPT = """You are PulseCart's friendly product advisor. You help customers find the right products from our catalog.

RULES:
1. Only recommend products that exist in the provided catalog. Include their IDs in the productIds array.
2. Be honest about what's available. If a product is out of stock, say so.
3. If the user asks for something clearly NOT in our catalog, set wantedProduct with a name and description.
4. If the user mentions a budget, only recommend products within that range.
5. Be conversational, helpful, and concise (2-3 sentences max per response).
6. Always respond with valid JSON matching this schema:
{
  "response": "Your natural language reply",
  "productIds": ["product-id-1", "product-id-2"],
  "wantedProduct": null or {"name": "Product Name", "description": "what the user wanted"}
}"""


def chat_respond(
    message: str,
    conversation_history: list[dict],
    products: list[Product],
) -> ChatResponse:
    """Generate a chat response using LLM or keyword fallback."""
    settings = get_settings()

    if settings.anthropic_api_key:
        try:
            return _api_chat(message, conversation_history, products, settings)
        except Exception as exc:
            logger.warning("Chat API failed, falling back to keyword search: %s", exc)

    return _keyword_chat(message, products)


def _api_chat(
    message: str,
    conversation_history: list[dict],
    products: list[Product],
    settings,
) -> ChatResponse:
    """Call the LLM API for a chat response."""
    catalog = _build_catalog_context(products)
    system = f"{SYSTEM_PROMPT}\n\nPRODUCT CATALOG:\n{catalog}"

    messages = []
    # Include last 10 messages for context
    for msg in conversation_history[-10:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": message})

    base_url = getattr(settings, "anthropic_base_url", "https://api.anthropic.com")
    response = httpx.post(
        f"{base_url}/v1/messages",
        headers={
            "x-api-key": settings.anthropic_api_key,
            "content-type": "application/json",
            "anthropic-version": "2023-06-01",
        },
        json={
            "model": settings.chat_model,
            "max_tokens": settings.chat_max_tokens,
            "system": system,
            "messages": messages,
        },
        timeout=30.0,
    )
    response.raise_for_status()

    resp_json = response.json()
    # Extract text from various API response formats
    try:
        result_text = resp_json["content"][0]["text"]
    except (KeyError, IndexError, TypeError):
        try:
            result_text = resp_json["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError):
            result_text = resp_json.get("text") or resp_json.get("message") or resp_json.get("content", "")
            if isinstance(result_text, list):
                result_text = result_text[0].get("text", "") if result_text else ""

    # Strip markdown code blocks if present
    result_text = result_text.strip()
    if result_text.startswith("```"):
        result_text = result_text.split("\n", 1)[1]
    if result_text.endswith("```"):
        result_text = result_text.rsplit("```", 1)[0]
    result_text = result_text.strip()

    try:
        parsed = json.loads(result_text)
        return ChatResponse(
            response=parsed.get("response", "I'm here to help!"),
            productIds=parsed.get("productIds", []),
            wantedProduct=parsed.get("wantedProduct"),
        )
    except json.JSONDecodeError:
        # If JSON parsing fails, return the raw text as response
        return ChatResponse(response=result_text, productIds=[], wantedProduct=None)


def _keyword_chat(message: str, products: list[Product]) -> ChatResponse:
    """Keyword-based fallback when no LLM is available."""
    terms = message.lower().split()
    scored: list[tuple[int, Product]] = []
    for p in products:
        name = p.name.lower()
        category = p.category.lower()
        description = p.description.lower()
        score = sum(5 if t in name else 3 if t in category else 2 if t in description else 0 for t in terms)
        if score > 0:
            scored.append((score, p))

    scored.sort(key=lambda x: -x[0])
    top_products = [p for _, p in scored[:3]]
    product_ids = [p.id for p in top_products]

    if top_products:
        names = ", ".join(p.name for p in top_products)
        response = f"Here are some products that might interest you: {names}. Would you like to know more about any of these?"
        return ChatResponse(response=response, productIds=product_ids, wantedProduct=None)
    else:
        # No matches — capture as wanted product
        product_name = message.strip().rstrip("?!.")
        response = f"I don't have {product_name} in our catalog right now, but I've noted your interest! Our team will look into sourcing it. In the meantime, would you like to see similar products we do carry?"
        return ChatResponse(
            response=response,
            productIds=[],
            wantedProduct={"name": product_name, "description": message}
        )

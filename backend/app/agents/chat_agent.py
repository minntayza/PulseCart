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
        lines.append(f"- [{p.id}] {p.name} | {p.category} | MMK {p.price:,.0f} | {stock_label} | {p.description[:80]}")
    return "\n".join(lines)


SYSTEM_PROMPT = """You are PulseCart's friendly product advisor. You help customers find the right products from our catalog.

RULES:
1. Only recommend products that exist in the provided catalog. Include their IDs in the productIds array.
2. Be honest about what's available. If a product is out of stock, say so.
3. MANDATORY: If the user asks for a SPECIFIC product (by name, model, or brand) that does NOT exactly match any product in our catalog, you MUST set wantedProduct with the product name and a brief description. Do NOT skip this step. Even if you recommend similar alternatives, still set wantedProduct for the exact item they wanted.
4. If the user mentions a budget, only recommend products within that range.
5. Be conversational, helpful, and concise (2-3 sentences max per response).
6. Always respond with valid JSON matching this schema:
{
  "response": "Your natural language reply",
  "productIds": ["product-id-1", "product-id-2"],
  "wantedProduct": null or {"name": "Product Name", "description": "what the user wanted"}
}

EXAMPLES:
- User: "Do you have iPhone 13 Pro Max?" → wantedProduct MUST be {"name": "iPhone 13 Pro Max", "description": "User asked for iPhone 13 Pro Max"} even if you recommend iPhone 17 instead.
- User: "I want a gaming laptop under MMK 2,000,000" → If a matching laptop exists, set wantedProduct to null. If not, set wantedProduct.
- User: "Show me wireless earbuds" → If earbuds exist in catalog, wantedProduct is null. If not, set wantedProduct."""


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

    # Try to extract JSON block from the response (LLM may output text + JSON)
    import re
    json_match = re.search(r'\{[\s\S]*"response"[\s\S]*\}', result_text)
    if json_match:
        try:
            parsed = json.loads(json_match.group())
            # Use the text before the JSON block as the display response
            display_text = result_text[:json_match.start()].strip()
            return ChatResponse(
                response=display_text or parsed.get("response", "I'm here to help!"),
                productIds=parsed.get("productIds", []),
                wantedProduct=parsed.get("wantedProduct"),
            )
        except json.JSONDecodeError:
            pass

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


STOP_WORDS = {"i", "me", "my", "we", "you", "your", "a", "an", "the", "is", "are",
              "do", "does", "did", "have", "has", "had", "can", "could", "would",
              "will", "shall", "may", "might", "need", "want", "looking", "find",
              "show", "give", "get", "buy", "purchase", "where", "how", "what",
              "which", "who", "when", "why", "to", "for", "in", "on", "at", "of",
              "with", "from", "by", "about", "anything", "something", "some", "any"}


def _keyword_chat(message: str, products: list[Product]) -> ChatResponse:
    """Keyword-based fallback when no LLM is available."""
    query = message.lower().strip()
    terms = query.split()
    # Filter out stop words for meaningful keyword matching
    keywords = [t for t in terms if t not in STOP_WORDS]

    # Phase 1: Check if the full query phrase closely matches a product name
    # (e.g. "iphone 13 pro max" should NOT match just because "iphone" is in a product name)
    phrase_matches: list[tuple[float, Product]] = []
    for p in products:
        name = p.name.lower()
        if query in name or name in query:
            # Exact substring match — high relevance
            phrase_matches.append((100.0, p))
        elif keywords and all(t in name for t in keywords):
            # All keywords appear in the product name
            phrase_matches.append((50.0, p))

    if phrase_matches:
        phrase_matches.sort(key=lambda x: -x[0])
        top = [p for _, p in phrase_matches[:3]]
        names = ", ".join(p.name for p in top)
        response = f"Here are some products that might interest you: {names}. Would you like to know more about any of these?"
        return ChatResponse(response=response, productIds=[p.id for p in top], wantedProduct=None)

    # Phase 2: Individual keyword matching across catalog
    scored: list[tuple[int, Product]] = []
    for p in products:
        name = p.name.lower()
        category = p.category.lower()
        description = p.description.lower()
        score = sum(5 if t in name else 3 if t in category else 2 if t in description else 0 for t in keywords)
        if score > 0:
            scored.append((score, p))

    scored.sort(key=lambda x: -x[0])
    top_products = [p for _, p in scored[:3]]

    # Phase 3: Decide — show matches or capture as wanted product
    # A single word match (score=5) in a long query means the user wants something specific.
    # Short queries (<=3 words) with any match → show products.
    # Long queries need score >= 10 (multiple word matches) to show products.
    query_is_short = len(keywords) <= 3
    if top_products and (scored[0][0] >= 10 or (scored[0][0] >= 5 and query_is_short)):
        names = ", ".join(p.name for p in top_products)
        response = f"Here are some products that might interest you: {names}. Would you like to know more about any of these?"
        return ChatResponse(response=response, productIds=[p.id for p in top_products], wantedProduct=None)
    else:
        product_name = message.strip().rstrip("?!.")
        response = f"I don't have {product_name} in our catalog right now, but I've noted your interest! Our team will look into sourcing it. In the meantime, would you like to see similar products we do carry?"
        return ChatResponse(
            response=response,
            productIds=[p.id for _, p in top_products],  # still show any partial matches
            wantedProduct={"name": product_name, "description": message}
        )

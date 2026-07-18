from math import ceil
from ..models.schemas import AgentTrace, Product, SearchResponse, TraceLog


def rank_products(query: str, products: list[Product], profile: dict[str, float] | None = None) -> SearchResponse:
    terms = query.lower().split()
    interests = dict(profile or {})

    def score(product: Product) -> int:
        name, category, description = product.name.lower(), product.category.lower(), product.description.lower()
        return sum(5 if term in name else 3 if term in category else 2 if term in description else 0 for term in terms)

    if terms:
        ranked = sorted(enumerate(products), key=lambda pair: (-score(pair[1]), pair[0]))
    else:
        ranked = sorted(
            enumerate(products),
            key=lambda pair: (-interests.get(f"product:{pair[1].id}", 0.0), pair[0]),
        )
    result = [product for _, product in ranked]
    top = result[0].name if result else "No product"
    trace = AgentTrace(
        agentName="Recommender Agent", agentIcon="AI", status="active",
        lastAction=f'Re-ranked {len(result)} products for "{query or "all products"}"', lastRun="just now",
        logs=[
            TraceLog(timestamp="00:00.000", type="trigger", text=f'Received search: "{query or "all products"}"'),
            TraceLog(timestamp="00:00.120", type="reasoning", text=f'Detected terms: {", ".join(terms) or "none"}'),
            TraceLog(timestamp="00:00.280", type="action", text=f"Scored and re-ranked {len(result)} products"),
            TraceLog(timestamp="00:00.420", type="result", text=f"{top} is first"),
            TraceLog(timestamp="00:00.500", type="guardrail", text="No sensitive personal attributes stored"),
        ],
    )
    return SearchResponse(products=result, trace=trace, profileUpdate=interests)


def update_search_interests(query: str, products: list[Product], profile: dict[str, float]) -> tuple[dict[str, float], list[Product]]:
    """Promote only half of name matches, with the latest search strongest."""
    updated = dict(profile)
    for key in list(updated):
        if key.startswith("product:"):
            updated[key] = round(updated[key] * 0.35, 6)
            if updated[key] < 0.001:
                updated.pop(key)

    needle = query.casefold().strip()
    matches = [product for product in products if needle and needle in product.name.casefold()]
    if not matches:
        terms = needle.split()
        matches = [product for product in products if terms and all(term in product.name.casefold() for term in terms)]

    promoted = matches[:ceil(len(matches) * 0.5)]
    for index, product in enumerate(promoted):
        updated[f"product:{product.id}"] = round(1.0 - index * 0.01, 6)
    return updated, promoted


def update_product_view_interest(product: Product, profile: dict[str, float]) -> dict[str, float]:
    """A deliberate product-detail view is newer and stronger than a search."""
    updated = dict(profile)
    for key in list(updated):
        if key.startswith("product:"):
            updated[key] = round(updated[key] * 0.35, 6)
            if updated[key] < 0.001:
                updated.pop(key)
    updated[f"product:{product.id}"] = 1.2
    return updated


def product_view_trace(product: Product) -> AgentTrace:
    return AgentTrace(
        agentName="Recommender Agent", agentIcon="AI", status="active",
        lastAction=f'Customer viewed {product.name}', lastRun="just now",
        logs=[
            TraceLog(timestamp="00:00.000", type="trigger", text=f'Opened product: "{product.name}"'),
            TraceLog(timestamp="00:00.100", type="reasoning", text="A product-detail view is a strong explicit-interest signal"),
            TraceLog(timestamp="00:00.200", type="action", text="Made this product the customer’s newest preference"),
            TraceLog(timestamp="00:00.300", type="result", text=f"{product.name} will lead the returning feed"),
            TraceLog(timestamp="00:00.400", type="guardrail", text="Interest stored only for this authenticated customer"),
        ],
    )

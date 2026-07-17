from ..models.schemas import AgentTrace, Product, SearchResponse, TraceLog


def rank_products(query: str, products: list[Product]) -> SearchResponse:
    terms = query.lower().split()

    def score(product: Product) -> int:
        name, category, description = product.name.lower(), product.category.lower(), product.description.lower()
        return sum(5 if term in name else 3 if term in category else 2 if term in description else 0 for term in terms)

    ranked = sorted(enumerate(products), key=lambda pair: (-score(pair[1]), pair[0]))
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
    return SearchResponse(products=result, trace=trace)

"""Market Analyst Agent — competitor price comparison analysis.

Standalone Python function (no CrewAI dependency).
"""

from ..tools.market_tools import normalize_sku_data, calculate_price_gap, generate_recommendation
from ..models.schemas import AgentTrace, TraceLog


def analyze_market(products_data: list[dict], competitor_data: list[dict]) -> tuple[dict, AgentTrace]:
    """Compare our product prices against competitors and return a report + trace."""
    logs: list[TraceLog] = [
        TraceLog(timestamp="00:00.000", type="trigger", text="Market Analyst execution triggered"),
    ]

    # Normalize competitor data into a lookup
    comp_prices = normalize_sku_data(competitor_data)
    logs.append(TraceLog(timestamp="00:00.100", type="action", text=f"Normalized {len(comp_prices)} competitor SKUs"))

    insights: list[dict] = []
    for product in products_data:
        name = product.get("name", "Unknown")
        our_price = float(product.get("price", 0))
        # Try to match by name or category
        comp_price = None
        for sku, price in comp_prices.items():
            if sku.lower() in name.lower() or name.lower() in sku.lower():
                comp_price = price
                break

        if comp_price is not None:
            gap = calculate_price_gap(our_price, comp_price)
            rec = generate_recommendation(gap)
            insights.append({"product": name, "gap": round(gap, 2), "recommendation": rec})
        else:
            insights.append({"product": name, "gap": 0.0, "recommendation": "no competitor data"})

    logs.append(TraceLog(timestamp="00:00.300", type="result", text=f"Analyzed {len(insights)} products"))

    review_count = sum(1 for i in insights if "review" in i["recommendation"])
    if review_count:
        logs.append(TraceLog(timestamp="00:00.400", type="reasoning", text=f"Recommended review for {review_count} products"))

    report = {"insights": insights}
    trace = AgentTrace(
        agentName="Market Analyst", agentIcon="📈", status="active",
        lastAction="Generated market report", lastRun="just now", logs=logs,
    )
    return report, trace

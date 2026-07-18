"""Market analysis helper functions (pure Python, no CrewAI dependency)."""


def normalize_sku_data(competitor_data: list[dict]) -> dict[str, float]:
    """Standardizes competitor prices into a {sku: price} mapping."""
    return {item["sku"]: item["competitor_price"] for item in competitor_data if "sku" in item and "competitor_price" in item}


def calculate_price_gap(our_price: float, competitor_price: float) -> float:
    """Computes the percentage difference between our price and competitor price."""
    if competitor_price == 0:
        return 0.0
    return ((our_price - competitor_price) / competitor_price) * 100


def generate_recommendation(price_gap: float) -> str:
    """Generates keep/review/bundle decision based on the price gap percentage."""
    if price_gap > 15:
        return "urgent review needed"
    elif price_gap > 5:
        return "review price"
    else:
        return "keep price"

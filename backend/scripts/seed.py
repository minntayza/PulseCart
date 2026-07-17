from pathlib import Path
import sys

# Allow `python scripts/seed.py` from the backend directory.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.config import get_settings
from app.fixtures import PRODUCTS


def main() -> None:
    settings = get_settings()
    if not settings.supabase_configured:
        raise SystemExit("Set SUPABASE_URL and SUPABASE_SECRET_KEY in backend/.env")
    from supabase import create_client
    client = create_client(settings.supabase_url, settings.supabase_secret_key)
    rows = [product.model_dump(mode="json") for product in PRODUCTS]
    client.table("products").upsert(rows).execute()
    print(f"Seeded {len(rows)} products")


if __name__ == "__main__":
    main()

from argparse import ArgumentParser
from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.config import get_settings


def main() -> None:
    parser = ArgumentParser(description="Promote or demote a PulseCart Supabase user.")
    parser.add_argument("email", help="Existing Supabase Auth user email")
    parser.add_argument("role", choices=("customer", "manager"), help="Application role to assign")
    args = parser.parse_args()

    settings = get_settings()
    if not settings.supabase_configured:
        raise SystemExit("Set SUPABASE_URL and SUPABASE_SECRET_KEY in backend/.env")

    from supabase import create_client
    client = create_client(settings.supabase_url, settings.supabase_secret_key)
    target_email = args.email.strip().lower()
    target = None
    page = 1
    while target is None:
        users = client.auth.admin.list_users(page=page, per_page=1000)
        if not users:
            break
        target = next((user for user in users if (user.email or "").lower() == target_email), None)
        if len(users) < 1000:
            break
        page += 1

    if target is None:
        raise SystemExit(f"No Supabase Auth user found for {target_email}")

    app_metadata = dict(target.app_metadata or {})
    app_metadata["role"] = args.role
    client.auth.admin.update_user_by_id(str(target.id), {"app_metadata": app_metadata})
    client.table("profiles").update({"role": args.role}).eq("user_id", str(target.id)).execute()
    print(f"Updated {target_email} to role={args.role}")
    print("The user must sign out and sign in again to receive a token with the new role.")


if __name__ == "__main__":
    main()

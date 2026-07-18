from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import Order
from app.repository import SupabaseRepository, repository
from app.services.email import delivery_email_html, rejection_email_html
from app.agents.recommender import rank_products, update_search_interests
from app.fixtures import PRODUCTS

client = TestClient(app)
customer = {"Authorization": "Bearer demo-customer-token"}
manager = {"Authorization": "Bearer demo-manager-token"}


def test_supabase_repository_disables_http2(monkeypatch):
    captured = {}

    class FakeClient:
        pass

    def fake_create_client(url, key, options):
        captured.update(url=url, key=key, options=options)
        return FakeClient()

    monkeypatch.setattr("supabase.create_client", fake_create_client)
    repo = SupabaseRepository("https://example.supabase.co", "secret", storage_timeout=15)

    try:
        assert captured["options"].httpx_client is repo._http_client
        assert captured["options"].postgrest_client_timeout == 15
        assert repo._http_client._transport._pool._http2 is False
    finally:
        repo._http_client.close()


def test_health_and_products():
    assert client.get("/health").status_code == 200
    response = client.get("/products")
    assert response.status_code == 200
    assert len(response.json()) == 12


def test_search_ranks_gaming_laptop_first():
    response = client.post("/search", json={"query": "gaming laptop"})
    assert response.status_code == 200
    assert response.json()["products"][0]["category"] == "laptops"
    assert response.json()["trace"]["logs"][-1]["type"] == "guardrail"


def test_latest_search_outranks_old_and_only_half_matches_are_promoted():
    iphone = [product.model_copy(update={"id": f"iphone-{index}", "name": f"iPhone {index}"}) for index, product in enumerate(PRODUCTS[:4], 1)]
    acer = [PRODUCTS[0].model_copy(update={"id": "acer-1", "name": "Acer Swift"})]
    catalog = iphone + acer + PRODUCTS[4:]

    profile, promoted_iphone = update_search_interests("iphone", catalog, {})
    assert len(promoted_iphone) == 2
    profile, promoted_acer = update_search_interests("acer", catalog, profile)
    assert len(promoted_acer) == 1

    returning = rank_products("", catalog, profile)
    assert returning.products[0].id == "acer-1"
    assert next(i for i, p in enumerate(returning.products) if p.id == "acer-1") < next(i for i, p in enumerate(returning.products) if p.id == "iphone-1")


def test_empty_feed_is_not_logged_but_product_click_is_logged_and_ranked_first():
    before = len(repository.traces)
    returning = client.post("/search", json={"query": ""}, headers=customer)
    assert returning.status_code == 200
    assert len(repository.traces) == before

    viewed = client.post("/events/product-view/3", headers=customer)
    assert viewed.status_code == 200
    assert viewed.json()["products"][0]["id"] == "3"
    assert repository.traces[0].lastAction == f"Customer viewed {repository.get_product('3').name}"


def test_order_requires_auth_and_manager_decision():
    payload = {"customerName": "Demo Customer", "address": "123 Demo Street", "phone": "+1 555 0100", "items": [{"productId": "1", "quantity": 2}]}
    assert client.post("/orders", json=payload).status_code == 401
    created = client.post("/orders", json=payload, headers=customer)
    assert created.status_code == 201
    order = created.json()
    assert order["status"] == "pending"
    assert float(order["total"]) == 2599.98
    assert client.get("/manager/orders", headers=customer).status_code == 403
    approved = client.patch(f'/manager/orders/{order["id"]}', json={"status": "approved"}, headers=manager)
    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"
    assert client.post(f'/manager/orders/{order["id"]}/deliver', headers=customer).status_code == 403
    delivered = client.post(f'/manager/orders/{order["id"]}/deliver', headers=manager)
    assert delivered.status_code == 200
    assert delivered.json()["status"] == "delivered"
    assert delivered.json()["deliveredAt"] is not None
    email_html = delivery_email_html(Order(**delivered.json()))
    assert "ပစ္စည်းပို့ဆောင်ရန် Delivery အပ်နှံလိုက်ပါပြီ" in email_html
    assert order["id"] in email_html
    repeated = client.post(f'/manager/orders/{order["id"]}/deliver', headers=manager)
    assert repeated.status_code == 200
    assert repeated.json()["status"] == "delivered"
    history = client.get("/orders/me", headers=customer).json()
    assert any(item["id"] == order["id"] and item["status"] == "delivered" for item in history)


def test_feedback_requires_customer_and_manager_to_list():
    created = client.post("/feedback", json={"message": "Please improve delivery visibility"}, headers=customer)
    assert created.status_code == 201
    assert created.json()["theme"] == "delivery"
    assert client.get("/feedback", headers=customer).status_code == 403
    listed = client.get("/feedback", headers=manager)
    assert listed.status_code == 200
    assert any(item["id"] == created.json()["id"] for item in listed.json())

    general = client.post("/feedback", json={"message": "More Mac products are required"}, headers=customer)
    assert general.status_code == 201
    assert general.json()["theme"] == "other"


def test_rejected_order_queues_burmese_apology_email():
    payload = {"customerName": "Demo Customer", "address": "123 Demo Street", "phone": "+1 555 0100", "items": [{"productId": "2", "quantity": 1}]}
    order = client.post("/orders", json=payload, headers=customer).json()
    rejected = client.patch(f'/manager/orders/{order["id"]}', json={"status": "rejected"}, headers=manager)
    assert rejected.status_code == 200
    assert rejected.json()["status"] == "rejected"
    assert repository.email_outbox[f'{order["id"]}:order_rejected']["status"] == "sent"
    email_html = rejection_email_html(Order(**rejected.json()))
    assert "အနူးအညွတ်တောင်းပန်အပ်ပါသည်" in email_html
    assert order["id"] in email_html

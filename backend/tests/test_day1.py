from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import Order
from app.repository import repository
from app.services.email import delivery_email_html, rejection_email_html

client = TestClient(app)
customer = {"Authorization": "Bearer demo-customer-token"}
manager = {"Authorization": "Bearer demo-manager-token"}


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

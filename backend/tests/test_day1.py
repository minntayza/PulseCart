from fastapi.testclient import TestClient
from app.main import app

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
    history = client.get("/orders/me", headers=customer).json()
    assert any(item["id"] == order["id"] and item["status"] == "approved" for item in history)


def test_feedback_requires_customer_and_manager_to_list():
    created = client.post("/feedback", json={"message": "Please improve delivery visibility"}, headers=customer)
    assert created.status_code == 201
    assert client.get("/feedback", headers=customer).status_code == 403
    listed = client.get("/feedback", headers=manager)
    assert listed.status_code == 200
    assert any(item["id"] == created.json()["id"] for item in listed.json())

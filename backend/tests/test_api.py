from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["default_currency"] == "₹"


def test_sample_bills_endpoint():
    response = client.get("/api/sample-bills")
    assert response.status_code == 200
    data = response.json()
    assert "samples" in data
    assert len(data["samples"]) >= 3
    sample_ids = [s["id"] for s in data["samples"]]
    assert "punjab_grill" in sample_ids
    assert "social_cafe" in sample_ids
    assert "saravana_bhavan" in sample_ids


def test_calculate_endpoint():
    payload = {
        "bill": {
            "restaurant_name": "Punjab Grill & Bar",
            "currency": "₹",
            "items": [
                {"id": "i1", "name": "Butter Chicken", "quantity": 1, "unit_price": 500, "total": 500, "confidence": 0.95},
                {"id": "i2", "name": "Dal Makhani", "quantity": 1, "unit_price": 300, "total": 300, "confidence": 0.95}
            ],
            "subtotal": 800,
            "tax": 40,
            "service_charge": 0,
            "discount": 0,
            "total": 840
        },
        "people": [
            {"id": "p1", "name": "Aarav"},
            {"id": "p2", "name": "Priya"}
        ],
        "assignments": {
            "i1": ["p1"],
            "i2": ["p2"]
        },
        "tax_split_method": "proportional"
    }
    response = client.post("/api/calculate", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert len(res_data["people_calculations"]) == 2
    assert res_data["summary"]["grand_total"] == 840
    assert res_data["summary"]["discrepancy"] == 0.0

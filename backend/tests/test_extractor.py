import io
import pytest
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient
from app.main import app
from app.models.bill import BillExtractionResponse
from app.services.extractors.base import BillExtractor
from app.services.extractors.mock import MockBillExtractor
from app.services.extractors.vision import VisionBillExtractor
from app.services.extractor import extract_bill_from_image, get_bill_extractor

client = TestClient(app)


def create_sample_receipt_image(filename="test_receipt.jpg") -> bytes:
    """Generates a synthetic receipt image using Pillow."""
    img = Image.new("RGB", (400, 600), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Draw simulated receipt text
    draw.text((120, 30), "PUNJAB GRILL", fill=(0, 0, 0))
    draw.text((100, 50), "Bandra Kurla Complex", fill=(50, 50, 50))
    draw.text((40, 80), "-" * 40, fill=(100, 100, 100))
    draw.text((40, 110), "Butter Chicken       1x   580.00", fill=(0, 0, 0))
    draw.text((40, 140), "Paneer Butter Masala 1x   480.00", fill=(0, 0, 0))
    draw.text((40, 170), "Butter Garlic Naan   4x   360.00", fill=(0, 0, 0))
    draw.text((40, 200), "-" * 40, fill=(100, 100, 100))
    draw.text((40, 230), "Subtotal:                1420.00", fill=(0, 0, 0))
    draw.text((40, 260), "GST (5%):                  71.00", fill=(0, 0, 0))
    draw.text((40, 290), "Total:                   1491.00", fill=(0, 0, 0))

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_mock_extractor_schema():
    """Verify MockBillExtractor returns valid schema with explicit fallback flags."""
    extractor = MockBillExtractor(fallback_reason="Automated test demo")
    assert isinstance(extractor, BillExtractor)
    assert extractor.provider_name == "mock"

    dummy_bytes = b"fake-bytes"
    result = extractor.extract(dummy_bytes, filename="punjab_bill.jpg")

    assert isinstance(result, BillExtractionResponse)
    assert result.is_fallback is True
    assert result.fallback_reason == "Automated test demo"
    assert result.extractor_provider == "mock"
    assert result.restaurant_name == "Punjab Grill & Bar"
    assert result.currency in ["INR", "₹"]
    assert len(result.items) > 0
    assert "subtotal" in result.field_confidence
    assert "tax" in result.field_confidence
    assert "total" in result.field_confidence


def test_vision_extractor_requires_api_key():
    """Verify VisionBillExtractor validates non-empty API key."""
    with pytest.raises(ValueError, match="requires a valid non-empty API key"):
        VisionBillExtractor(api_key="")


def test_extractor_fallback_when_vision_fails():
    """
    CRITICAL: Verify that when vision provider is configured with an invalid key,
    it DOES NOT silently fabricate an AI result, but explicitly sets is_fallback=True
    and records the failure reason.
    """
    img_bytes = create_sample_receipt_image()

    # Pass an invalid dummy API key to trigger provider failure
    result = extract_bill_from_image(
        image_bytes=img_bytes,
        filename="dinner.jpg",
        mime_type="image/jpeg",
        custom_api_key="AIzaSy_dummy_invalid_key_for_testing",
    )

    assert isinstance(result, BillExtractionResponse)
    assert result.is_fallback is True
    assert result.fallback_reason is not None
    assert "Vision Provider Error" in result.fallback_reason or "failed" in result.fallback_reason.lower()
    assert result.extractor_provider == "mock"


def test_extractor_service_without_api_key(monkeypatch):
    """Verify clean fallback with explicit explanation when no API key is provided."""
    monkeypatch.setattr("app.config.settings.GEMINI_API_KEY", "")
    img_bytes = create_sample_receipt_image()

    result = extract_bill_from_image(
        image_bytes=img_bytes,
        filename="social_night.jpg",
        mime_type="image/jpeg",
        custom_api_key=None,
    )

    assert result.is_fallback is True
    assert "No Gemini API key provided" in result.fallback_reason
    assert result.restaurant_name == "Social Cafe & Lounge"



def test_api_extract_endpoint_with_image():
    """Test POST /api/extract with an actual JPEG image payload."""
    img_bytes = create_sample_receipt_image()

    response = client.post(
        "/api/extract",
        files={"file": ("test_receipt.jpg", img_bytes, "image/jpeg")},
    )

    assert response.status_code == 200
    data = response.json()

    assert "items" in data
    assert len(data["items"]) > 0
    assert "field_confidence" in data
    assert "subtotal" in data["field_confidence"]
    assert "is_fallback" in data
    assert data["is_fallback"] is True  # Since running locally without real API key
    assert "fallback_reason" in data
    assert data["fallback_reason"] is not None

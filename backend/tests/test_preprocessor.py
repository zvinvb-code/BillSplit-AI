import io
from PIL import Image, ImageDraw
from app.services.image_preprocessor import preprocess_bill_image, PreprocessResult


def create_large_test_image(width=3000, height=4000) -> bytes:
    """Creates a large synthetic image for testing resize & enhancement."""
    img = Image.new("RGB", (width, height), color=(240, 240, 240))
    draw = ImageDraw.Draw(img)
    draw.text((100, 100), "TEST RECEIPT", fill=(10, 10, 10))
    draw.text((100, 200), "Butter Chicken   1x  500.00", fill=(10, 10, 10))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_preprocess_large_image_resizing():
    """Verify that images larger than 2048px are resized preserving aspect ratio."""
    raw_bytes = create_large_test_image(width=3000, height=4000)
    result = preprocess_bill_image(raw_bytes, max_dimension=2048)

    assert isinstance(result, PreprocessResult)
    assert result.original_width == 3000
    assert result.original_height == 4000
    assert result.was_resized is True
    assert max(result.analysis_width, result.analysis_height) <= 2048
    # Aspect ratio check: 3000/4000 = 0.75
    assert abs((result.analysis_width / result.analysis_height) - 0.75) < 0.02
    assert len(result.analysis_bytes) > 0
    # Original bytes must be preserved completely untouched
    assert result.original_bytes == raw_bytes


def test_preprocess_enhancements():
    """Verify contrast and sharpness enhancement flags."""
    raw_bytes = create_large_test_image(width=800, height=1000)
    result = preprocess_bill_image(
        raw_bytes,
        max_dimension=2048,
        enhance_contrast=True,
        enhance_sharpness=True,
    )

    assert result.was_resized is False
    assert result.was_enhanced is True
    assert result.analysis_width == 800
    assert result.analysis_height == 1000

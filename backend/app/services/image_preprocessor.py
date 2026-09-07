"""
Pillow-based Image Preprocessing Pipeline for Bill Analysis.

Generates an enhanced analysis image copy optimized for Gemini OCR / Vision model comprehension
(correcting EXIF orientation, aspect-ratio scaling, mild contrast/sharpening) while leaving
the original user upload untouched for UI review display.
"""

import io
import logging
from typing import Tuple, Optional
from PIL import Image, ImageOps, ImageEnhance
from pydantic import BaseModel

logger = logging.getLogger("image_preprocessor")


class PreprocessResult(BaseModel):
    original_bytes: bytes
    analysis_bytes: bytes
    mime_type: str = "image/jpeg"
    original_width: int
    original_height: int
    analysis_width: int
    analysis_height: int
    was_resized: bool = False
    was_enhanced: bool = False


def preprocess_bill_image(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
    max_dimension: int = 2048,
    enhance_contrast: bool = True,
    enhance_sharpness: bool = True,
    to_grayscale: bool = False,
) -> PreprocessResult:
    """
    Executes the receipt image preprocessing pipeline.

    Steps:
    1. Verify and load raw image bytes.
    2. Correct EXIF orientation (rotation/flip based on camera metadata).
    3. Convert to RGB color mode.
    4. Preserve original dimensions for metadata tracking.
    5. Resize large images while strictly preserving aspect ratio.
    6. Apply mild contrast and sharpness adjustments (avoiding harsh binarization).
    7. Optionally grayscale the analysis copy for low-contrast/faded thermal receipts.
    8. Return PreprocessResult containing both original_bytes and analysis_bytes.
    """
    if not image_bytes or len(image_bytes) == 0:
        raise ValueError("Provided image bytes payload is empty.")

    # 1. Load image
    raw_stream = io.BytesIO(image_bytes)
    pil_img = Image.open(raw_stream)
    pil_img.verify()

    # Re-open after verify
    raw_stream.seek(0)
    pil_img = Image.open(raw_stream)

    # 2. EXIF orientation correction
    try:
        pil_img = ImageOps.exif_transpose(pil_img)
    except Exception as e:
        logger.warning(f"EXIF transpose skipped: {e}")

    # 3. Mode normalization to RGB
    if pil_img.mode not in ("RGB", "L"):
        pil_img = pil_img.convert("RGB")

    orig_width, orig_height = pil_img.size

    # Create distinct copy for AI analysis
    analysis_img = pil_img.copy()

    # 4. Aspect-ratio preserving resize if dimensions exceed max_dimension
    was_resized = False
    if max(analysis_img.size) > max_dimension:
        analysis_img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
        was_resized = True

    anal_width, anal_height = analysis_img.size

    # 5. Mild Contrast Enhancement (1.25x) - improves faint text visibility without clipping
    was_enhanced = False
    if enhance_contrast:
        contrast_enhancer = ImageEnhance.Contrast(analysis_img)
        analysis_img = contrast_enhancer.enhance(1.25)
        was_enhanced = True

    # 6. Mild Sharpening Enhancement (1.25x) - sharpens pixel edges of dot-matrix & thermal prints
    if enhance_sharpness:
        sharpness_enhancer = ImageEnhance.Sharpness(analysis_img)
        analysis_img = sharpness_enhancer.enhance(1.25)
        was_enhanced = True

    # 7. Optional Grayscale Conversion for analysis copy
    if to_grayscale:
        analysis_img = ImageOps.grayscale(analysis_img).convert("RGB")

    # 8. Export enhanced analysis copy to JPEG bytes
    out_buffer = io.BytesIO()
    analysis_img.save(out_buffer, format="JPEG", quality=88, optimize=True)
    analysis_bytes = out_buffer.getvalue()

    return PreprocessResult(
        original_bytes=image_bytes,
        analysis_bytes=analysis_bytes,
        mime_type="image/jpeg",
        original_width=orig_width,
        original_height=orig_height,
        analysis_width=anal_width,
        analysis_height=anal_height,
        was_resized=was_resized,
        was_enhanced=was_enhanced,
    )

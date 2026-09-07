import logging
from typing import Optional
from app.config import settings
from app.models.bill import BillExtractionResponse
from app.services.extractors.base import BillExtractor
from app.services.extractors.vision import VisionBillExtractor
from app.services.extractors.mock import MockBillExtractor

logger = logging.getLogger("extractor_service")


def get_bill_extractor(api_key: Optional[str] = None) -> BillExtractor:
    """
    Factory to obtain the appropriate BillExtractor instance.
    Decouples callers from specific vendor implementations.
    """
    effective_key = api_key or settings.GEMINI_API_KEY
    if effective_key:
        return VisionBillExtractor(api_key=effective_key)
    return MockBillExtractor(fallback_reason="No Gemini API key configured.")


def extract_bill_from_image(
    image_bytes: bytes,
    filename: Optional[str] = None,
    mime_type: str = "image/jpeg",
    custom_api_key: Optional[str] = None,
) -> BillExtractionResponse:
    """
    Extracts structured bill information from an image file.

    Follows these strict rules:
    - If an API key is available, attempts vision extraction via VisionBillExtractor.
    - If the vision provider is configured but fails (e.g. invalid key, quota, network):
      DO NOT silently fabricate an AI result.
      Fall back to MockBillExtractor and explicitly set is_fallback=True with the exact failure reason.
    - If no API key is configured, uses MockBillExtractor with is_fallback=True and a clear demo notice.
    """
    effective_api_key = custom_api_key or settings.GEMINI_API_KEY

    # Case 1: API key is present -> Use Vision Provider
    if effective_api_key:
        try:
            logger.info("Initiating vision extraction with VisionBillExtractor...")
            vision_extractor = VisionBillExtractor(api_key=effective_api_key)
            result = vision_extractor.extract(
                image_bytes=image_bytes,
                filename=filename,
                mime_type=mime_type,
            )
            return result
        except Exception as e:
            error_msg = f"Vision provider failed ({type(e).__name__}): {str(e)}"
            logger.error(f"{error_msg}. Falling back to demo mock bill without silent fabrication.", exc_info=True)

            # Never silently fabricate an AI result: explicitly record is_fallback=True and the failure reason
            mock_extractor = MockBillExtractor(
                fallback_reason=f"Vision Provider Error: {str(e)[:160]}"
            )
            fallback_result = mock_extractor.extract(
                image_bytes=image_bytes,
                filename=filename,
                mime_type=mime_type,
            )
            return fallback_result

    # Case 2: No API key provided -> Return Mock Bill with clear notice
    logger.info("No Gemini API key configured. Using MockBillExtractor for demo.")
    mock_extractor = MockBillExtractor(
        fallback_reason="No Gemini API key provided. Using realistic demo bill (MockBillExtractor)."
    )
    return mock_extractor.extract(
        image_bytes=image_bytes,
        filename=filename,
        mime_type=mime_type,
    )

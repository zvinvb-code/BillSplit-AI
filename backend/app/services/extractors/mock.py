from typing import Optional
from app.models.bill import BillExtractionResponse
from app.sample_data import SAMPLE_BILLS
from app.services.extractors.base import BillExtractor


class MockBillExtractor(BillExtractor):
    """
    Mock bill extraction provider for development, testing, and demo reliability.
    Returns realistic Indian dining bills with complete GST and service charge structures.
    Always explicitly flags is_fallback=True so the UI and users are aware demo data is active.
    """

    def __init__(self, fallback_reason: Optional[str] = None):
        self._fallback_reason = fallback_reason or "Demo mode active (MockBillExtractor)"

    @property
    def provider_name(self) -> str:
        return "mock"

    def extract(
        self,
        image_bytes: bytes,
        filename: Optional[str] = None,
        mime_type: str = "image/jpeg",
    ) -> BillExtractionResponse:
        # Match sample by filename keywords if present
        sample_key = "punjab_grill"
        if filename:
            clean_name = filename.lower()
            if "social" in clean_name:
                sample_key = "social_cafe"
            elif "saravana" in clean_name or "south" in clean_name or "dosa" in clean_name:
                sample_key = "saravana_bhavan"

        sample = SAMPLE_BILLS[sample_key].model_copy(deep=True)
        sample.is_fallback = True
        sample.fallback_reason = self._fallback_reason
        sample.extractor_provider = "mock"
        return sample

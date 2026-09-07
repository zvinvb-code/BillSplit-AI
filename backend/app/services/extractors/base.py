from abc import ABC, abstractmethod
from typing import Optional
from app.models.bill import BillExtractionResponse


class BillExtractor(ABC):
    """
    Abstract Base Class defining the contract for all bill extraction providers.
    Ensures the core application does not directly couple to a single AI or OCR vendor.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the extraction provider."""
        pass

    @abstractmethod
    def extract(
        self,
        image_bytes: bytes,
        filename: Optional[str] = None,
        mime_type: str = "image/jpeg",
    ) -> BillExtractionResponse:
        """
        Extract structured bill information from receipt image bytes.

        :param image_bytes: Raw bytes of the uploaded image.
        :param filename: Optional original filename.
        :param mime_type: Image MIME type (e.g., 'image/jpeg', 'image/png').
        :return: BillExtractionResponse conforming to Pydantic schema.
        """
        pass

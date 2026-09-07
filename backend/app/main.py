from typing import Optional, List, Dict
import logging
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models.bill import BillExtractionResponse
from app.models.calculation import CalculationRequest, CalculationResponse
from app.services.extractor import extract_bill_from_image
from app.services.calculator import calculate_split
from app.sample_data import SAMPLE_BILLS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="BillSplit AI — Snap. Assign. Split. AI-powered restaurant receipt extraction and fair splitting engine.",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["System"])
def health_check():
    """Returns system status and configuration state."""
    has_api_key = bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 5)
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "default_currency": settings.DEFAULT_CURRENCY,
        "gemini_api_configured": has_api_key,
        "message": "BillSplit AI Backend is running smoothly."
    }


@app.get("/api/sample-bills", tags=["Bills"])
def get_sample_bills():
    """Returns metadata for pre-configured sample bills for quick 1-click evaluation."""
    samples = []
    for key, bill in SAMPLE_BILLS.items():
        samples.append({
            "id": key,
            "restaurant_name": bill.restaurant_name,
            "currency": bill.currency,
            "item_count": len(bill.items),
            "subtotal": bill.subtotal,
            "total": bill.total,
            "tax": bill.tax,
            "service_charge": bill.service_charge,
            "discount": bill.discount,
            "notes": bill.notes,
        })
    return {"samples": samples}


@app.get("/api/sample-bills/{bill_id}", response_model=BillExtractionResponse, tags=["Bills"])
def get_sample_bill_by_id(bill_id: str):
    """Returns the full parsed bill data for a specific sample bill."""
    if bill_id not in SAMPLE_BILLS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample bill '{bill_id}' not found. Available: {list(SAMPLE_BILLS.keys())}"
        )
    return SAMPLE_BILLS[bill_id]


@app.post("/api/extract", response_model=BillExtractionResponse, tags=["Bills"])
async def extract_bill(
    file: UploadFile = File(..., description="Photograph or scan of a restaurant bill"),
):
    """
    Accepts a bill image and extracts structured bill data via Gemini 2.5 Flash.
    Uses backend environment GEMINI_API_KEY securely.
    """
    try:
        contents = await file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        result = extract_bill_from_image(
            image_bytes=contents,
            filename=file.filename,
            mime_type=file.content_type or "image/jpeg",
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during bill extraction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process bill image: {str(e)}"
        )



@app.post("/api/calculate", response_model=CalculationResponse, tags=["Calculation"])
def calculate_bill_split(request: CalculationRequest):
    """
    Accepts the user-reviewed bill and item assignments, and returns per-person calculations.
    Ensures mathematical accuracy, proportional tax/service split, and zero penny discrepancy.
    """
    try:
        if not request.people:
            raise HTTPException(status_code=400, detail="At least one person is required to split the bill.")

        if not request.bill.items:
            raise HTTPException(status_code=400, detail="The bill must contain at least one line item.")

        result = calculate_split(request)
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during calculation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate split: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

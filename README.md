# BillSplit AI

**Snap. Assign. Split.**

BillSplit AI is an intelligent, full-stack web application designed to eliminate the hassle and friction of splitting group restaurant bills. By combining multimodal vision AI (Google Gemini 2.5 Flash), an interactive human review interface, and a mathematically rigorous financial calculation engine, BillSplit AI converts complex paper receipts into transparent, itemized splits with proportional tax, service charge, and discount distribution.

---

## Problem

Splitting restaurant receipts after group dining is notoriously error-prone and awkward. Standard bill-splitting apps or manual calculators typically divide the grand total equally, forcing guests who ordered light meals or non-alcoholic beverages to subsidize expensive entrees, cocktails, or specialty items. Furthermore, manually accounting for line-item quantities, shared starters, printed taxes (such as GST), service charges, promotional discounts, and cent-rounding discrepancies requires tedious arithmetic that frequently leads to mistakes and frustration.

---

## Solution

BillSplit AI streamlines the entire post-dining experience into an intuitive, 6-step guided application workflow:

```
Bill photo ──> AI extraction ──> Human verification ──> Item assignment ──> Proportional tax/service calculation ──> Final split
```

1. **Bill Photo**: Upload any receipt photograph or select from pre-loaded Indian dining sample receipts.
2. **AI Extraction**: Multimodal vision AI parses items, quantities, unit prices, line totals, taxes, service fees, discounts, and grand totals into structured data with per-field confidence scores.
3. **Human Verification**: An interactive side-by-side verification interface allows users to review, edit, or adjust extracted values before any calculations occur.
4. **Item Assignment**: Easily assign line items to individual guests, multiple friends, or split shared appetizers across the entire table.
5. **Proportional Tax/Service Calculation**: Overheads (taxes, service charges, discounts) are weighted dynamically according to each person's individual food consumption subtotal.
6. **Final Split**: Receive clear, per-person breakdown cards, zero-penny discrepancy reconciliation, and a 1-click summary formatted for WhatsApp or UPI payments.

---

## Features

- **AI Bill Extraction**: Powered by Google Gemini 2.5 Flash for high-accuracy vision parsing of receipt photographs.
- **Structured Pydantic Output**: Strictly typed data schema validation enforcing backend data integrity.
- **Per-Field Confidence**: Confidence metrics calculated for overall receipt, restaurant name, individual items, subtotal, tax, and total.
- **Human Review**: Interactive side-by-side thermal bill visualizer and editable data grid to verify and fix OCR errors.
- **Multiple People Management**: Dynamic guest management with customizable names, avatars, and quick presets.
- **Shared Items Support**: Split line items 1-way, multi-way between selected guests, or evenly across all diners.
- **Proportional Tax Distribution**: Taxes (e.g. GST) are distributed strictly proportional to each diner's food consumption weight.
- **Proportional Service Charge**: Service fees and gratuity are distributed proportionally across participants.
- **Discount Support**: Promotional discounts and voucher deductions are distributed fairly across orders.
- **Printed vs. Calculated Total Verification**: Automatic audit verifying printed receipt grand total against calculated line item sums, resolving floating-point penny discrepancies.
- **Responsive UI**: Sleek, modern user interface built with glassmorphism, responsive tables, interactive step indicators, and dark-mode aesthetics.

---

## Tech Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, Lucide React Icons

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Validation**: Pydantic v2
- **Image Preprocessing**: Pillow (PIL)
- **Server**: Uvicorn

### AI & Vision
- **Vision Model**: Google Gemini 2.5 Flash via `google-genai` SDK
- **Preprocessing**: EXIF auto-rotation, aspect-ratio scaling, contrast/sharpness enhancement
- **Fallback Engine**: Local mock parser ensuring 100% demo uptime when offline or API keys are absent

---

## Architecture

```
+-----------------------------------------------------------------------------------+
|                                 FRONTEND (React + Vite)                           |
|  +--------------------+   +-------------------+   +----------------------------+  |
|  | Upload / Samples   |-->| Side-by-Side Edit |-->| Dish Assignment Matrix     |  |
|  +--------------------+   +-------------------+   +----------------------------+  |
|                                                                 |                 |
|                                                                 v                 |
|                                                   +----------------------------+  |
|                                                   | Final Split & WhatsApp Copy|  |
|                                                   +----------------------------+  |
+-----------------------------------------------------------------------------------+
                                          |
                                   HTTP REST API
                                          |
+-----------------------------------------------------------------------------------+
|                                 BACKEND (FastAPI)                                 |
|                                                                                   |
|    POST /api/extract                                    POST /api/calculate       |
|            |                                                     |                |
|            v                                                     v                |
|   +-------------------+                                +-------------------+      |
|   | Image Preprocessor|                                | Financial Math    |      |
|   | (Pillow Pipeline) |                                | Engine            |      |
|   +-------------------+                                | - Weighting       |      |
|            |                                           | - Prop. Taxes     |      |
|            v                                           | - Penny Reconcil. |      |
|   +-------------------+                                +-------------------+      |
|   | Gemini Vision AI  |                                          |                |
|   | (google-genai SDK)|                                          v                |
|   +-------------------+                                +-------------------+      |
|            |                                           | Pydantic Schema   |      |
|            v                                           | Validation        |      |
|   +-------------------+                                +-------------------+      |
|   | Fallback Mock Engine|                                                         |
|   +-------------------+                                                           |
+-----------------------------------------------------------------------------------+
```

---

## Calculation Logic

Equal splitting of tax and service charges is mathematically unfair because diners who consume higher-value items should bear a corresponding proportion of the taxes and service fees incurred by those items.

### Concrete Example

Suppose **Person A** consumes food worth **₹800** and **Person B** consumes food worth **₹200**.  
Total Food Subtotal = ₹800 + ₹200 = **₹1,000**.  
The receipt lists a GST (Tax) of **₹180**.

#### Why Equal Splitting is Incorrect:
- Equal split of GST: ₹180 / 2 = ₹90 each.
- Person B (who ordered only ₹200 worth of food) would pay a massive 45% tax on their meal, while Person A pays only 11.25%. This subsidizes Person A's heavy meal at Person B's expense.

#### Proportional Calculation (BillSplit AI Approach):
1. Calculate Food Subtotal Weight:
   $$\text{Weight}_A = \frac{₹800}{₹1000} = 0.80 \quad (80\%)$$
   $$\text{Weight}_B = \frac{₹200}{₹1000} = 0.20 \quad (20\%)$$

2. Distribute Tax Proportionally:
   $$\text{GST Share}_A = 80\% \times ₹180 = \mathbf{₹144}$$
   $$\text{GST Share}_B = 20\% \times ₹180 = \mathbf{₹36}$$

3. Final Totals:
   - **Person A Total**: ₹800 + ₹144 = **₹944**
   - **Person B Total**: ₹200 + ₹36 = **₹236**
   - **Grand Total Verified**: ₹944 + ₹236 = **₹1,180**

BillSplit AI applies this exact weighting formula to taxes, service charges, and discounts, followed by a penny-rounding reconciliation step to ensure $\sum \text{Person Totals} \equiv \text{Bill Grand Total}$.

---

## Local Setup

Follow these instructions to run BillSplit AI locally.

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Windows Command Prompt:
.\venv\Scripts\activate.bat
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload
```
The backend API will be available at `http://localhost:8000`. Interactive API documentation is accessible at `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## Environment Variables

Create a `.env` file inside the `backend/` directory to configure environment variables.

### Backend `.env`

```env
# Gemini API Key (Required for live AI vision extraction)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Override Gemini Model (default: gemini-2.5-flash)
GEMINI_MODEL=gemini-2.5-flash

# Environment Configuration
ENVIRONMENT=development
PORT=8000
```

> [!IMPORTANT]
> **Security Notice**: Never commit real API keys to version control. The repository includes `.env.example` as a template and ignores `.env` in `.gitignore`.

---

## API Specification

### 1. Extract Bill Data
`POST /api/extract`

Parses a uploaded receipt photograph and returns structured line items and confidence scores.

#### Request (`multipart/form-data`)
- `file`: Receipt image file (JPEG, PNG, WEBP)

#### Example Response (`200 OK`)
```json
{
  "restaurant_name": "Punjab Grill & Bar",
  "currency": "INR",
  "items": [
    {
      "id": "item_1",
      "name": "Butter Chicken",
      "quantity": 1.0,
      "unit_price": 580.0,
      "total": 580.0,
      "confidence": 0.98
    },
    {
      "id": "item_2",
      "name": "Garlic Naan",
      "quantity": 4.0,
      "unit_price": 90.0,
      "total": 360.0,
      "confidence": 0.95
    }
  ],
  "subtotal": 940.0,
  "tax": 47.0,
  "service_charge": 47.0,
  "discount": 0.0,
  "total": 1034.0,
  "field_confidence": {
    "subtotal": 0.98,
    "tax": 0.95,
    "service_charge": 0.92,
    "total": 0.99
  },
  "is_fallback": false,
  "fallback_reason": null,
  "extractor_provider": "vision (gemini-2.5-flash)"
}
```

---

### 2. Calculate Bill Split
`POST /api/calculate`

Calculates per-person item shares, proportional overheads, and reconciled grand totals.

#### Example Request (`application/json`)
```json
{
  "bill": {
    "restaurant_name": "Punjab Grill & Bar",
    "currency": "INR",
    "items": [
      {
        "id": "item_1",
        "name": "Butter Chicken",
        "quantity": 1.0,
        "unit_price": 580.0,
        "total": 580.0,
        "confidence": 0.98
      },
      {
        "id": "item_2",
        "name": "Garlic Naan",
        "quantity": 4.0,
        "unit_price": 90.0,
        "total": 360.0,
        "confidence": 0.95
      }
    ],
    "subtotal": 940.0,
    "tax": 47.0,
    "service_charge": 47.0,
    "discount": 0.0,
    "total": 1034.0,
    "field_confidence": {}
  },
  "people": [
    { "id": "p_1", "name": "Aarav" },
    { "id": "p_2", "name": "Priya" }
  ],
  "assignments": {
    "item_1": ["p_1"],
    "item_2": ["p_1", "p_2"]
  },
  "tax_split_method": "proportional"
}
```

#### Example Response (`200 OK`)
```json
{
  "people_calculations": [
    {
      "person_id": "p_1",
      "name": "Aarav",
      "items_subtotal": 760.0,
      "tax_share": 38.0,
      "service_charge_share": 38.0,
      "discount_share": 0.0,
      "total_amount": 836.0,
      "percentage_of_bill": 80.85,
      "item_shares": [
        { "item_id": "item_1", "item_name": "Butter Chicken", "share_amount": 580.0 },
        { "item_id": "item_2", "item_name": "Garlic Naan", "share_amount": 180.0 }
      ]
    },
    {
      "person_id": "p_2",
      "name": "Priya",
      "items_subtotal": 180.0,
      "tax_share": 9.0,
      "service_charge_share": 9.0,
      "discount_share": 0.0,
      "total_amount": 198.0,
      "percentage_of_bill": 19.15,
      "item_shares": [
        { "item_id": "item_2", "item_name": "Garlic Naan", "share_amount": 180.0 }
      ]
    }
  ],
  "summary": {
    "currency": "INR",
    "grand_total": 1034.0,
    "calculated_total_sum": 1034.0,
    "discrepancy": 0.0,
    "unassigned_items": []
  }
}
```

---

## Testing

The project includes unit and integration tests covering API endpoints, image preprocessing, and financial calculation logic.

### Run Tests
```bash
cd backend
pytest -v
```

### Key Test Scenarios Covered
- **API Health & Endpoints**: Validates `/api/health`, `/api/sample-bills`, `/api/extract`, and `/api/calculate`.
- **Single & Multi-Person Splits**: Verifies single person taking all items vs. multi-person shared item divisions.
- **Proportional Math Verification**: Tests that taxes, service charges, and discounts scale accurately with food subtotals.
- **Unassigned Item Detection**: Ensures warning flags are raised if any receipt item remains unassigned to diners.
- **Penny Discrepancy Reconciliation**: Tests floating-point rounding adjustments when dividing odd amounts (e.g. ₹100 split 3 ways).
- **Graceful Fallback Mode**: Verifies system falls back gracefully without breaking when API keys are absent or invalid.

---

## Known Limitations

- **Image Quality Dependency**: AI vision extraction accuracy relies on legible lighting and focus. Extremely blurry, low-resolution, or heavily creased thermal receipts may require manual line-item correction in Step 3.
- **Handwritten Receipts**: Non-standard handwriting or custom restaurant shorthands may need human verification during review.
- **Demo Fallback Engine**: If no Gemini API key is configured or network connection fails, the system seamlessly uses pre-configured fallback sample responses to guarantee demo continuity.

---

## Demo

- **Live Demo**: [URL]
- **Demo Video**: [URL]
- **GitHub Repository**: [URL]

---

## Challenge
Built with ❤️ for the **IT Geeks Vibe Coding Challenge**.  
*Snap. Assign. Split.*
Built with ❤️ for the **IT Geeks Vibe Coding Challenge**.  
*Snap. Assign. Split.*

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.schemas import PriceTrendResponse
from services.price_trend_service import get_price_trend

router = APIRouter(prefix="/api/ai/price-trends", tags=["Price Trends"])


@router.get("/{product_id}", response_model=PriceTrendResponse)
def price_trend(
    product_id: str, days_ahead: int = 14, db: Session = Depends(get_db)
):
    """Get price history and prediction for a product."""
    result = get_price_trend(db, product_id, days_ahead)
    if result is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return result

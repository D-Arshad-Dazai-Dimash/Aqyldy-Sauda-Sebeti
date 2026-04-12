from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.schemas import RecommendationResponse
from services.recommendation_service import (
    get_recommendations_for_product,
    get_recommendations_for_user,
)

router = APIRouter(prefix="/api/ai/recommendations", tags=["Recommendations"])


@router.get("/product/{product_id}", response_model=RecommendationResponse)
def recommend_for_product(
    product_id: str, limit: int = 8, db: Session = Depends(get_db)
):
    """Get product recommendations based on co-purchase patterns."""
    try:
        recs, strategy = get_recommendations_for_product(db, product_id, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return RecommendationResponse(
        product_id=product_id, recommendations=recs, strategy=strategy
    )


@router.get("/user/{user_id}", response_model=RecommendationResponse)
def recommend_for_user(
    user_id: str, limit: int = 10, db: Session = Depends(get_db)
):
    """Get personalized recommendations for a user."""
    try:
        recs, strategy = get_recommendations_for_user(db, user_id, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return RecommendationResponse(
        product_id="user:" + user_id, recommendations=recs, strategy=strategy
    )

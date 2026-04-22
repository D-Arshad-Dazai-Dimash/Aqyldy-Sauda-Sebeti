from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import require_auth
from models.schemas import RecommendationResponse
from services.recommendation_service import (
    get_recommendations_for_product,
    get_recommendations_for_user,
)

router = APIRouter(prefix="/api/ai/recommendations", tags=["Recommendations"])


@router.get("/product/{product_id}", response_model=RecommendationResponse)
def recommend_for_product(
    product_id: str,
    limit: int = 8,
    db: Session = Depends(get_db),
    _claims: dict = Depends(require_auth),
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
    user_id: str,
    limit: int = 10,
    db: Session = Depends(get_db),
    claims: dict = Depends(require_auth),
):
    """Get personalized recommendations for the authenticated user."""
    # Use the email from the verified JWT, not the raw user_id path param,
    # so a user cannot request recommendations for another user.
    authenticated_user = claims.get("sub", user_id)
    try:
        recs, strategy = get_recommendations_for_user(db, authenticated_user, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return RecommendationResponse(
        product_id="user:" + authenticated_user, recommendations=recs, strategy=strategy
    )

from pydantic import BaseModel
from typing import Optional


class ProductRecommendation(BaseModel):
    id: str
    title: str
    price: float
    image_url: Optional[str] = None
    discount: Optional[float] = None
    score: float  # relevance score 0-1


class RecommendationResponse(BaseModel):
    product_id: str
    recommendations: list[ProductRecommendation]
    strategy: str  # "collaborative", "category", "popular"


class PricePoint(BaseModel):
    date: str
    price: float


class PriceTrendResponse(BaseModel):
    product_id: str
    product_title: str
    current_price: float
    history: list[PricePoint]
    predictions: list[PricePoint]
    trend: str  # "rising", "falling", "stable"
    trend_percentage: float  # e.g. +5.2 or -3.1


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: list[ChatMessage] = []
    user_id: Optional[str] = None
    user_latitude: Optional[float] = None
    user_longitude: Optional[float] = None
    radius_meters: int = 5000


class IngredientChecklistItem(BaseModel):
    key: str
    name: str
    product_id: Optional[str] = None
    product_title: Optional[str] = None
    estimated_price: Optional[float] = None
    available: bool = False
    checked: bool = True


class StoreSuggestion(BaseModel):
    store_id: str
    store_name: str
    store_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    coverage_count: int
    coverage_ratio: float
    distance_meters: Optional[float] = None
    estimated_total: Optional[float] = None
    matched_products: list[ProductRecommendation] = []


class ChatResponse(BaseModel):
    reply: str
    suggested_products: list[ProductRecommendation] = []
    ingredient_checklist: list[IngredientChecklistItem] = []
    store_suggestions: list[StoreSuggestion] = []

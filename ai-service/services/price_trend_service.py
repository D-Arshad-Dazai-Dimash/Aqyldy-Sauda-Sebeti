"""
Price Trend Analysis & Prediction

Uses price_history table for historical data and linear regression for forecasting.
"""

import logging
from datetime import datetime, timedelta

import numpy as np
from sqlalchemy import text
from sqlalchemy.orm import Session

from models.schemas import PricePoint, PriceTrendResponse

logger = logging.getLogger(__name__)


def _fetch_price_history(db: Session, product_id: str) -> list[dict]:
    """Fetch price change history for a product."""
    rows = db.execute(
        text("""
            SELECT old_price, new_price, changed_at
            FROM price_history
            WHERE product_id = CAST(:pid AS uuid)
            ORDER BY changed_at ASC
        """),
        {"pid": product_id},
    ).fetchall()
    return [
        {"old_price": float(r[0]), "new_price": float(r[1]), "changed_at": r[2]}
        for r in rows
    ]


def _fetch_product_info(db: Session, product_id: str) -> dict | None:
    row = db.execute(
        text("""
            SELECT id, title, price, created_at
            FROM products WHERE id = CAST(:pid AS uuid)
        """),
        {"pid": product_id},
    ).fetchone()
    if not row:
        return None
    return {
        "id": str(row[0]),
        "title": row[1],
        "price": float(row[2]),
        "created_at": row[3],
    }


def _build_price_timeline(
    product_info: dict, history: list[dict]
) -> list[PricePoint]:
    """
    Build a daily price timeline from creation date to now.
    Fills gaps by carrying forward the last known price.
    """
    if not history:
        # No price changes — flat line from creation to now
        created = product_info["created_at"]
        if hasattr(created, "date"):
            start_date = created.date()
        else:
            start_date = datetime.fromisoformat(str(created)).date()
        today = datetime.utcnow().date()
        price = product_info["price"]
        points = []
        d = start_date
        while d <= today:
            points.append(PricePoint(date=d.isoformat(), price=price))
            d += timedelta(days=1)
        return points if points else [PricePoint(date=today.isoformat(), price=price)]

    # Build timeline from first change backward to creation, then forward
    created = product_info["created_at"]
    if hasattr(created, "date"):
        start_date = created.date()
    else:
        start_date = datetime.fromisoformat(str(created)).date()
    today = datetime.utcnow().date()

    # Map of dates to price changes
    change_map: dict[str, float] = {}
    initial_price = history[0]["old_price"]

    for h in history:
        changed_date = h["changed_at"]
        if hasattr(changed_date, "date"):
            d = changed_date.date()
        else:
            d = datetime.fromisoformat(str(changed_date)).date()
        change_map[d.isoformat()] = h["new_price"]

    # Build daily timeline
    points = []
    current_price = initial_price
    d = start_date
    while d <= today:
        ds = d.isoformat()
        if ds in change_map:
            current_price = change_map[ds]
        points.append(PricePoint(date=ds, price=current_price))
        d += timedelta(days=1)

    return points


def _predict_prices(
    history_points: list[PricePoint], days_ahead: int = 14
) -> tuple[list[PricePoint], str, float]:
    """
    Linear regression on price history to predict future prices.
    Returns (predictions, trend_direction, trend_percentage).
    """
    if len(history_points) < 2:
        # Not enough data — return stable
        last_price = history_points[-1].price if history_points else 0
        last_date = datetime.fromisoformat(history_points[-1].date) if history_points else datetime.utcnow()
        predictions = []
        for i in range(1, days_ahead + 1):
            pred_date = (last_date + timedelta(days=i)).date()
            predictions.append(PricePoint(date=pred_date.isoformat(), price=last_price))
        return predictions, "stable", 0.0

    # Prepare data for regression
    prices = np.array([p.price for p in history_points])
    x = np.arange(len(prices)).reshape(-1, 1).astype(float)
    y = prices.astype(float)

    # Simple linear regression: y = mx + b
    x_mean = np.mean(x)
    y_mean = np.mean(y)
    numerator = np.sum((x.flatten() - x_mean) * (y - y_mean))
    denominator = np.sum((x.flatten() - x_mean) ** 2)

    if denominator == 0:
        slope = 0.0
        intercept = y_mean
    else:
        slope = numerator / denominator
        intercept = y_mean - slope * x_mean

    # Predict future
    last_date = datetime.fromisoformat(history_points[-1].date)
    last_x = len(prices) - 1
    predictions = []
    for i in range(1, days_ahead + 1):
        pred_x = last_x + i
        pred_price = max(0, slope * pred_x + intercept)  # price can't be negative
        pred_date = (last_date + timedelta(days=i)).date()
        predictions.append(PricePoint(date=pred_date.isoformat(), price=round(pred_price, 2)))

    # Determine trend
    if len(prices) >= 2:
        start_price = prices[0]
        end_price = prices[-1]
        if start_price > 0:
            pct_change = ((end_price - start_price) / start_price) * 100
        else:
            pct_change = 0.0
    else:
        pct_change = 0.0

    if pct_change > 2:
        trend = "rising"
    elif pct_change < -2:
        trend = "falling"
    else:
        trend = "stable"

    return predictions, trend, round(pct_change, 1)


def get_price_trend(
    db: Session, product_id: str, days_ahead: int = 14
) -> PriceTrendResponse | None:
    """Full price trend analysis for a product."""
    product_info = _fetch_product_info(db, product_id)
    if not product_info:
        return None

    history = _fetch_price_history(db, product_id)
    timeline = _build_price_timeline(product_info, history)
    predictions, trend, trend_pct = _predict_prices(timeline, days_ahead)

    return PriceTrendResponse(
        product_id=product_id,
        product_title=product_info["title"],
        current_price=product_info["price"],
        history=timeline,
        predictions=predictions,
        trend=trend,
        trend_percentage=trend_pct,
    )

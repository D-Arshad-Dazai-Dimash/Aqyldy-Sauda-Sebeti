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


def _detect_recent_promo(history: list[dict]) -> bool:
    """
    Detect a promo: a drop >= 15 % vs the previous price in the last 24h.
    Returns True only if the most recent change satisfies that.
    """
    if not history:
        return False
    last = history[-1]
    old_p = float(last.get("old_price") or 0)
    new_p = float(last.get("new_price") or 0)
    if old_p <= 0:
        return False
    drop_pct = (old_p - new_p) / old_p
    if drop_pct < 0.15:
        return False
    changed_at = last.get("changed_at")
    if hasattr(changed_at, "date"):
        when = changed_at
    else:
        try:
            when = datetime.fromisoformat(str(changed_at))
        except Exception:
            return False
    return (datetime.utcnow() - when) <= timedelta(hours=24)


def _predict_prices(
    history_points: list[PricePoint], days_ahead: int = 14
) -> tuple[list[PricePoint], str, float, dict]:
    """
    Linear regression on price history to predict future prices.

    Returns ``(predictions, trend_direction, trend_percentage, meta)``
    where ``meta`` carries:
        - ``confidence``: 'low' | 'medium' | 'high'
        - ``model_type``: 'flat' | 'linear'
        - ``volatility``:  residual std-dev in ₸
        - ``horizon_days``: days actually forecast
    The forecast carries 95 % confidence band (±1.96·σ) on every point.
    """
    n = len(history_points)
    last_date = (
        datetime.fromisoformat(history_points[-1].date)
        if history_points
        else datetime.utcnow()
    )
    last_price = history_points[-1].price if history_points else 0.0

    # ── Data-quality gate ──────────────────────────────────────────
    if n < 5:
        # Too little data → flat 3-day forecast, low confidence.
        horizon = min(3, days_ahead)
        predictions = [
            PricePoint(
                date=(last_date + timedelta(days=i)).date().isoformat(),
                price=round(last_price, 2),
                lower=round(last_price * 0.95, 2),
                upper=round(last_price * 1.05, 2),
            )
            for i in range(1, horizon + 1)
        ]
        meta = {
            "confidence": "low",
            "model_type": "flat",
            "volatility": 0.0,
            "horizon_days": horizon,
        }
        return predictions, "stable", 0.0, meta

    # ── Linear regression ──────────────────────────────────────────
    prices = np.array([p.price for p in history_points], dtype=float)
    x = np.arange(n, dtype=float)

    x_mean = float(np.mean(x))
    y_mean = float(np.mean(prices))
    denominator = float(np.sum((x - x_mean) ** 2))
    if denominator == 0:
        slope, intercept = 0.0, y_mean
    else:
        slope = float(np.sum((x - x_mean) * (prices - y_mean)) / denominator)
        intercept = y_mean - slope * x_mean

    # Residual std-dev → 95 % band
    fitted = slope * x + intercept
    residuals = prices - fitted
    # Sample std with Bessel correction; guard tiny n.
    sigma = float(np.std(residuals, ddof=1)) if n >= 2 else 0.0
    band = 1.96 * sigma  # 95 % CI

    # Confidence heuristic:
    #   high   = lots of data + low relative volatility
    #   medium = something in between
    #   low    = small n already filtered above
    rel_vol = sigma / max(y_mean, 1.0)
    if n >= 30 and rel_vol < 0.05:
        confidence = "high"
    elif n >= 10 and rel_vol < 0.15:
        confidence = "medium"
    else:
        confidence = "low"

    horizon = days_ahead
    last_x = n - 1
    predictions: list[PricePoint] = []
    for i in range(1, horizon + 1):
        pred_x = last_x + i
        center = max(0.0, slope * pred_x + intercept)
        predictions.append(
            PricePoint(
                date=(last_date + timedelta(days=i)).date().isoformat(),
                price=round(center, 2),
                lower=round(max(0.0, center - band), 2),
                upper=round(center + band, 2),
            )
        )

    # Trend direction (head-vs-tail % change)
    start_price = float(prices[0])
    end_price = float(prices[-1])
    pct_change = ((end_price - start_price) / start_price) * 100 if start_price > 0 else 0.0
    if pct_change > 2:
        trend = "rising"
    elif pct_change < -2:
        trend = "falling"
    else:
        trend = "stable"

    meta = {
        "confidence": confidence,
        "model_type": "linear",
        "volatility": round(sigma, 2),
        "horizon_days": horizon,
    }
    return predictions, trend, round(pct_change, 1), meta


def get_price_trend(
    db: Session, product_id: str, days_ahead: int = 14
) -> PriceTrendResponse | None:
    """Full price trend analysis for a product."""
    product_info = _fetch_product_info(db, product_id)
    if not product_info:
        return None

    history = _fetch_price_history(db, product_id)
    timeline = _build_price_timeline(product_info, history)
    predictions, trend, trend_pct, meta = _predict_prices(timeline, days_ahead)

    return PriceTrendResponse(
        product_id=product_id,
        product_title=product_info["title"],
        current_price=product_info["price"],
        history=timeline,
        predictions=predictions,
        trend=trend,
        trend_percentage=trend_pct,
        confidence=meta["confidence"],
        model_type=meta["model_type"],
        volatility=meta["volatility"],
        is_promo_recent=_detect_recent_promo(history),
        horizon_days=meta["horizon_days"],
    )

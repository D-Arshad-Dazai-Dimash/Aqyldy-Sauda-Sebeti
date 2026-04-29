"""
TDD tests for the upgraded price-trend predictor.

Covers:
* low-data gate (<5 points → flat 3-day forecast, low confidence);
* linear forecast on a clean upward trend (predicted > current,
  rising, medium/high confidence, lower<center<upper);
* promo detection (≥15 % drop in last 24h);
* response shape (every predicted point has lower/upper).
"""

from datetime import datetime, timedelta

from models.schemas import PricePoint
from services.price_trend_service import (
    _detect_recent_promo,
    _predict_prices,
)


def _mk_points(prices: list[float], start_days_ago: int | None = None) -> list[PricePoint]:
    """Build a daily PricePoint list ending today."""
    today = datetime.utcnow().date()
    n = len(prices)
    start = today - timedelta(days=n - 1)
    return [
        PricePoint(date=(start + timedelta(days=i)).isoformat(), price=p)
        for i, p in enumerate(prices)
    ]


class TestPredictPrices:
    def test_low_data_returns_flat_3_day_forecast(self):
        points = _mk_points([100.0, 101.0])  # n=2 < 5
        preds, trend, pct, meta = _predict_prices(points, days_ahead=14)

        assert meta["confidence"] == "low"
        assert meta["model_type"] == "flat"
        assert meta["horizon_days"] == 3
        assert len(preds) == 3
        assert trend == "stable"
        assert pct == 0.0
        # Flat = same price for every day
        assert all(round(p.price, 2) == 101.00 for p in preds)
        # Confidence band still present
        for p in preds:
            assert p.lower is not None and p.upper is not None
            assert p.lower < p.price < p.upper

    def test_linear_upward_trend_is_detected(self):
        # 10 points, monotonically rising
        points = _mk_points([100, 102, 104, 106, 108, 110, 112, 114, 116, 118])
        preds, trend, pct, meta = _predict_prices(points, days_ahead=14)

        assert len(preds) == 14
        assert meta["model_type"] == "linear"
        assert meta["confidence"] in {"medium", "high"}
        assert trend == "rising"
        assert pct > 0
        # Forecast continues upward
        assert preds[-1].price > preds[0].price >= 118.0
        # Every point has a CI band
        for p in preds:
            assert p.lower is not None and p.upper is not None
            assert p.lower <= p.price <= p.upper

    def test_volatility_is_reported(self):
        # Noisy data → sigma > 0
        points = _mk_points([100, 110, 95, 120, 90, 115, 100, 105, 95, 110])
        _, _, _, meta = _predict_prices(points, days_ahead=14)
        assert meta["volatility"] > 0

    def test_lower_bound_never_negative(self):
        # Falling cheap product, big variance → band could go below zero
        points = _mk_points([20, 18, 15, 12, 10, 8, 6, 5, 4, 3])
        preds, *_ = _predict_prices(points, days_ahead=14)
        assert all((p.lower or 0) >= 0 for p in preds)


class TestDetectRecentPromo:
    def test_drop_15_percent_today_is_promo(self):
        history = [
            {"old_price": 1000, "new_price": 800, "changed_at": datetime.utcnow()},
        ]
        assert _detect_recent_promo(history) is True

    def test_drop_15_percent_two_days_ago_is_not_recent(self):
        history = [
            {
                "old_price": 1000,
                "new_price": 800,
                "changed_at": datetime.utcnow() - timedelta(days=2),
            }
        ]
        assert _detect_recent_promo(history) is False

    def test_small_drop_is_not_promo(self):
        history = [
            {"old_price": 1000, "new_price": 950, "changed_at": datetime.utcnow()},
        ]
        assert _detect_recent_promo(history) is False

    def test_empty_history_is_not_promo(self):
        assert _detect_recent_promo([]) is False

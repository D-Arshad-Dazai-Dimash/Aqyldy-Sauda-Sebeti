"""
Product Recommendation Engine

Strategies (cascading fallback):
1. Collaborative Filtering — products frequently bought together (co-occurrence in orders)
2. Category-Based — products in the same categories
3. Popular — most-ordered products overall

The personalised user-level recommender layers extra signals on top
of the raw co-occurrence matrix:

  * recency decay   — recent purchases weigh more (exp(-days/30))
  * frequency boost — products you buy often promote their neighbours
  * time-of-day     — co-occurrences from orders made around the same
                      hour-of-day bucket as "now" get a small boost
  * discount tilt   — items currently on sale (>=10%) get +0.10
"""

import logging
import math
import time
from collections import defaultdict
from datetime import datetime

import numpy as np
from sqlalchemy import text
from sqlalchemy.orm import Session

from models.schemas import ProductRecommendation

logger = logging.getLogger(__name__)

_CO_OCCURRENCE_CACHE_TTL_SECONDS = 120
_co_occurrence_cache: tuple[float, dict[str, dict[str, int]]] | None = None


def _build_co_occurrence_matrix(db: Session) -> dict[str, dict[str, int]]:
    """Build product co-occurrence matrix from order history."""
    global _co_occurrence_cache

    now = time.monotonic()
    if _co_occurrence_cache is not None:
                ts, cached_matrix = _co_occurrence_cache
                if now - ts < _CO_OCCURRENCE_CACHE_TTL_SECONDS:
                        return cached_matrix

    rows = db.execute(
        text("""
            SELECT oi1.product_id AS p1, oi2.product_id AS p2, COUNT(*) AS cnt
            FROM order_items oi1
            JOIN order_items oi2 ON oi1.order_id = oi2.order_id
                                AND oi1.product_id <> oi2.product_id
            GROUP BY oi1.product_id, oi2.product_id
        """)
    ).fetchall()

    matrix: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for p1, p2, cnt in rows:
        matrix[str(p1)][str(p2)] = cnt

    _co_occurrence_cache = (now, matrix)
    return matrix


def _get_user_purchased_products(db: Session, user_id: str) -> list[str]:
    """Get all product IDs a user has ever purchased."""
    rows = db.execute(
        text("""
            SELECT DISTINCT oi.product_id
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE o.user_id = CAST(:uid AS uuid)
        """),
        {"uid": user_id},
    ).fetchall()
    return [str(r[0]) for r in rows]


def _get_user_purchase_signals(
    db: Session, user_id: str
) -> dict[str, dict[str, float]]:
    """
    Per-user purchase signals used by the v2 recommender.

    Returns a mapping ``product_id -> { "freq": int, "last_days": float,
    "hour_buckets": set[int] }``. ``hour_buckets`` is a 4-way bucket of
    the order's hour-of-day (morning / midday / evening / night) so we
    can boost neighbours of products you typically buy *now*.
    """
    rows = db.execute(
        text("""
            SELECT oi.product_id,
                   COUNT(*) AS freq,
                   EXTRACT(EPOCH FROM (now() - MAX(o.created_at))) / 86400.0 AS days_since_last,
                   ARRAY_AGG(DISTINCT (EXTRACT(HOUR FROM o.created_at)::int / 6)) AS hour_buckets
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE o.user_id = CAST(:uid AS uuid)
            GROUP BY oi.product_id
        """),
        {"uid": user_id},
    ).fetchall()
    out: dict[str, dict] = {}
    for pid, freq, days, buckets in rows:
        out[str(pid)] = {
            "freq": int(freq or 0),
            "last_days": float(days or 0.0),
            "hour_buckets": set(int(b) for b in (buckets or []) if b is not None),
        }
    return out


def _current_hour_bucket() -> int:
    """4-way hour-of-day bucket: 0=00-05, 1=06-11, 2=12-17, 3=18-23."""
    return datetime.now().hour // 6


def _recency_weight(days: float, half_life: float = 30.0) -> float:
    """Exponential decay; 1.0 today, ~0.5 after `half_life` days."""
    if days <= 0:
        return 1.0
    return float(math.exp(-days / half_life))


def _frequency_weight(freq: int) -> float:
    """Sub-linear boost so heavy buyers don't dominate completely."""
    return 1.0 + math.log1p(max(freq, 0))


def _get_category_siblings(db: Session, product_id: str, limit: int) -> list[dict]:
    """Get products in the same categories, ordered by popularity."""
    rows = db.execute(
        text("""
            SELECT DISTINCT p.id, p.title, p.price, p.image_url, p.discount
            FROM products p
            JOIN product_categories pc1 ON p.id = pc1.product_id
            WHERE pc1.category_id IN (
                SELECT category_id FROM product_categories WHERE product_id = CAST(:pid AS uuid)
            )
            AND p.id <> CAST(:pid AS uuid)
            AND p.active = true
            ORDER BY p.price
            LIMIT :lim
        """),
        {"pid": product_id, "lim": limit},
    ).fetchall()
    return [
        {"id": str(r[0]), "title": r[1], "price": float(r[2]),
         "image_url": r[3], "discount": float(r[4]) if r[4] else None}
        for r in rows
    ]


def _get_popular_products(db: Session, exclude_id: str, limit: int) -> list[dict]:
    """Get globally popular products by order count."""
    rows = db.execute(
        text("""
            SELECT p.id, p.title, p.price, p.image_url, p.discount,
                   COUNT(oi.id) AS order_count
            FROM products p
            LEFT JOIN order_items oi ON p.id = oi.product_id
            WHERE p.active = true AND p.id <> CAST(:pid AS uuid)
            GROUP BY p.id
            ORDER BY order_count DESC, p.created_at DESC
            LIMIT :lim
        """),
        {"pid": exclude_id, "lim": limit},
    ).fetchall()
    return [
        {"id": str(r[0]), "title": r[1], "price": float(r[2]),
         "image_url": r[3], "discount": float(r[4]) if r[4] else None}
        for r in rows
    ]


def get_recommendations_for_product(
    db: Session, product_id: str, limit: int = 8
) -> tuple[list[ProductRecommendation], str]:
    """
    Get product recommendations with cascading strategy.
    Returns (recommendations, strategy_name).
    """

    # Strategy 1: Collaborative filtering (co-occurrence)
    matrix = _build_co_occurrence_matrix(db)
    if product_id in matrix and matrix[product_id]:
        co_prods = matrix[product_id]
        # Sort by co-occurrence count
        sorted_pairs = sorted(co_prods.items(), key=lambda x: x[1], reverse=True)[:limit]

        if sorted_pairs:
            max_cnt = sorted_pairs[0][1] if sorted_pairs else 1
            product_ids = [pid for pid, _ in sorted_pairs]
            # Fetch product details
            placeholders = ", ".join(f"CAST(:p{i} AS uuid)" for i in range(len(product_ids)))
            params = {f"p{i}": pid for i, pid in enumerate(product_ids)}
            details = db.execute(
                text(f"""
                    SELECT id, title, price, image_url, discount
                    FROM products WHERE id IN ({placeholders}) AND active = true
                """),
                params,
            ).fetchall()

            detail_map = {str(r[0]): r for r in details}
            results = []
            for pid, cnt in sorted_pairs:
                if pid in detail_map:
                    r = detail_map[pid]
                    results.append(ProductRecommendation(
                        id=str(r[0]), title=r[1], price=float(r[2]),
                        image_url=r[3], discount=float(r[4]) if r[4] else None,
                        score=round(cnt / max_cnt, 3),
                    ))
            if results:
                logger.info("Collaborative filtering: %d results for %s", len(results), product_id)
                return results, "collaborative"

    # Strategy 2: Category-based
    siblings = _get_category_siblings(db, product_id, limit)
    if siblings:
        results = [
            ProductRecommendation(
                score=round(1.0 - i / len(siblings), 3), **s
            )
            for i, s in enumerate(siblings)
        ]
        logger.info("Category-based: %d results for %s", len(results), product_id)
        return results, "category"

    # Strategy 3: Popular products
    popular = _get_popular_products(db, product_id, limit)
    results = [
        ProductRecommendation(
            score=round(1.0 - i / max(len(popular), 1), 3), **p
        )
        for i, p in enumerate(popular)
    ]
    logger.info("Popular fallback: %d results for %s", len(results), product_id)
    return results, "popular"


def get_recommendations_for_user(
    db: Session, user_id: str, limit: int = 10
) -> tuple[list[ProductRecommendation], str]:
    """
    Personalised recommendations using v2 signals on top of the
    co-occurrence matrix:

      score(neighbour) = sum over purchased p of:
          co_occurrence[p][neighbour]
          * recency_weight(days since last buy of p)
          * frequency_weight(times user bought p)
          * (1 + 0.15 if neighbour was bought at the same hour-bucket
             else 0)

    Then a flat +0.10 bonus for neighbours currently on discount >=10%.
    Falls back to popular when there's no signal.
    """
    signals = _get_user_purchase_signals(db, user_id)
    purchased = list(signals.keys())
    if not purchased:
        # No purchase history — return popular
        popular = _get_popular_products(db, "00000000-0000-0000-0000-000000000000", limit)
        return [
            ProductRecommendation(
                score=round(1.0 - i / max(len(popular), 1), 3), **p
            )
            for i, p in enumerate(popular)
        ], "popular"

    matrix = _build_co_occurrence_matrix(db)
    now_bucket = _current_hour_bucket()
    scores: dict[str, float] = defaultdict(float)

    for pid, sig in signals.items():
        neighbours = matrix.get(pid)
        if not neighbours:
            continue
        recency = _recency_weight(sig["last_days"])
        freq_boost = _frequency_weight(sig["freq"])
        bucket_match = now_bucket in sig["hour_buckets"]
        for related_pid, cnt in neighbours.items():
            if related_pid in signals:
                # Don't re-recommend things the user already buys often
                # unless they haven't bought it in a while.
                if signals[related_pid]["last_days"] < 14:
                    continue
            base = float(cnt) * recency * freq_boost
            if bucket_match:
                base *= 1.15
            scores[related_pid] += base

    if not scores:
        popular = _get_popular_products(db, purchased[0], limit)
        return [
            ProductRecommendation(
                score=round(1.0 - i / max(len(popular), 1), 3), **p
            )
            for i, p in enumerate(popular)
        ], "popular"

    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)[: limit * 2]
    product_ids = [pid for pid, _ in sorted_scores]
    placeholders = ", ".join(f"CAST(:p{i} AS uuid)" for i in range(len(product_ids)))
    params = {f"p{i}": pid for i, pid in enumerate(product_ids)}
    details = db.execute(
        text(f"""
            SELECT id, title, price, image_url, discount
            FROM products WHERE id IN ({placeholders}) AND active = true
        """),
        params,
    ).fetchall()

    detail_map = {str(r[0]): r for r in details}

    # Apply final discount tilt (+0.10 base score for any item on >=10%
    # discount), then re-rank.
    final: list[tuple[str, float, tuple]] = []
    for pid, sc in sorted_scores:
        row = detail_map.get(pid)
        if row is None:
            continue
        disc = float(row[4]) if row[4] is not None else 0.0
        if disc >= 10:
            sc += 0.10 * sc  # +10% relative tilt for discounted items
        final.append((pid, sc, row))

    final.sort(key=lambda x: x[1], reverse=True)
    final = final[:limit]
    max_score = final[0][1] if final else 1.0

    results = [
        ProductRecommendation(
            id=str(row[0]),
            title=row[1],
            price=float(row[2]),
            image_url=row[3],
            discount=float(row[4]) if row[4] is not None else None,
            score=round(sc / max_score, 3) if max_score else 0.0,
        )
        for _pid, sc, row in final
    ]
    return results, "collaborative"

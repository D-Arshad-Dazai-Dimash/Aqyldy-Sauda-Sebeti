"""Unit tests for the v2 personalised recommender signals."""
import math
import unittest
from datetime import datetime
from unittest.mock import MagicMock, patch

from services import recommendation_service as rs


class RecencyWeightTest(unittest.TestCase):
    def test_today_returns_one(self):
        self.assertEqual(rs._recency_weight(0.0), 1.0)

    def test_negative_days_clamped_to_one(self):
        self.assertEqual(rs._recency_weight(-3.0), 1.0)

    def test_half_life_decays_to_half(self):
        # Default half-life parameter is the e-folding time, so at t=h
        # the weight is exp(-1) ≈ 0.368 (not 0.5).
        self.assertAlmostEqual(rs._recency_weight(30.0, half_life=30.0), math.exp(-1), places=4)

    def test_old_purchase_decays_strongly(self):
        self.assertLess(rs._recency_weight(120.0), 0.05)

    def test_monotonic_decay(self):
        self.assertGreater(rs._recency_weight(1.0), rs._recency_weight(7.0))
        self.assertGreater(rs._recency_weight(7.0), rs._recency_weight(30.0))


class FrequencyWeightTest(unittest.TestCase):
    def test_zero_frequency_returns_one(self):
        self.assertEqual(rs._frequency_weight(0), 1.0)

    def test_negative_treated_as_zero(self):
        self.assertEqual(rs._frequency_weight(-5), 1.0)

    def test_sublinear_growth(self):
        w1, w10, w100 = (
            rs._frequency_weight(1),
            rs._frequency_weight(10),
            rs._frequency_weight(100),
        )
        self.assertLess(w10 - w1, w1 * 10)
        self.assertLess(w100 - w10, (w10 - w1) * 10)

    def test_strictly_increasing(self):
        self.assertLess(rs._frequency_weight(1), rs._frequency_weight(2))
        self.assertLess(rs._frequency_weight(5), rs._frequency_weight(50))


class HourBucketTest(unittest.TestCase):
    def test_bucket_in_valid_range(self):
        b = rs._current_hour_bucket()
        self.assertIn(b, {0, 1, 2, 3})

    def test_bucket_matches_now(self):
        self.assertEqual(rs._current_hour_bucket(), datetime.now().hour // 6)


class GetRecommendationsForUserTest(unittest.TestCase):
    """End-to-end checks for the v2 user recommender with mocked DB."""

    def _make_db(self, signals_rows, popular_rows=None, details_rows=None):
        db = MagicMock()
        results = []

        def execute(stmt, params=None):
            sql = str(stmt).lower()
            res = MagicMock()
            if "array_agg" in sql and "hour" in sql:
                res.fetchall.return_value = signals_rows
            elif "left join order_items" in sql:
                res.fetchall.return_value = popular_rows or []
            elif "from products where id in" in sql:
                res.fetchall.return_value = details_rows or []
            else:
                res.fetchall.return_value = []
            results.append(sql)
            return res

        db.execute.side_effect = execute
        return db

    def test_no_history_falls_back_to_popular(self):
        popular = [
            ("p1", "Bread", 100.0, "img1", None, 5),
            ("p2", "Milk", 200.0, "img2", None, 3),
        ]
        db = self._make_db(signals_rows=[], popular_rows=popular)

        with patch.object(rs, "_build_co_occurrence_matrix", return_value={}):
            recs, strategy = rs.get_recommendations_for_user(db, "user-1", limit=5)

        self.assertEqual(strategy, "popular")
        self.assertEqual(len(recs), 2)
        self.assertEqual(recs[0].title, "Bread")

    def test_discount_tilt_promotes_sale_items(self):
        # User bought p_user; matrix says p_a and p_b are equally co-occurring.
        # p_b is on 20% discount → should rank above p_a after the tilt.
        signals_rows = [
            ("p_user", 3, 1.0, [rs._current_hour_bucket()]),
        ]
        details_rows = [
            ("p_a", "Plain", 100.0, "img-a", None),
            ("p_b", "Sale", 100.0, "img-b", 20.0),
        ]
        matrix = {"p_user": {"p_a": 10, "p_b": 10}}
        db = self._make_db(signals_rows=signals_rows, details_rows=details_rows)

        with patch.object(rs, "_build_co_occurrence_matrix", return_value=matrix):
            recs, strategy = rs.get_recommendations_for_user(db, "user-1", limit=5)

        self.assertEqual(strategy, "collaborative")
        titles = [r.title for r in recs]
        self.assertIn("Sale", titles)
        self.assertIn("Plain", titles)
        self.assertEqual(titles[0], "Sale")  # discounted item ranks first

    def test_recency_decay_prefers_recent_neighbours(self):
        # Two purchased items, each pointing to a different neighbour with
        # the same raw co-occurrence count. The recently-bought one should
        # win.
        signals_rows = [
            ("p_recent", 1, 1.0, [rs._current_hour_bucket()]),
            ("p_old", 1, 365.0, [rs._current_hour_bucket()]),
        ]
        details_rows = [
            ("n_recent", "Recent neighbour", 100.0, "img-r", None),
            ("n_old", "Old neighbour", 100.0, "img-o", None),
        ]
        matrix = {
            "p_recent": {"n_recent": 5},
            "p_old": {"n_old": 5},
        }
        db = self._make_db(signals_rows=signals_rows, details_rows=details_rows)

        with patch.object(rs, "_build_co_occurrence_matrix", return_value=matrix):
            recs, _ = rs.get_recommendations_for_user(db, "user-1", limit=5)

        self.assertEqual(recs[0].title, "Recent neighbour")

    def test_already_owned_recent_items_are_skipped(self):
        # User just bought n_neighbour 3 days ago — should NOT be recommended.
        signals_rows = [
            ("p_user", 2, 1.0, [rs._current_hour_bucket()]),
            ("n_neighbour", 1, 3.0, [rs._current_hour_bucket()]),
        ]
        details_rows = [
            ("n_neighbour", "Already owned", 100.0, "img", None),
        ]
        matrix = {"p_user": {"n_neighbour": 10}}
        db = self._make_db(signals_rows=signals_rows, details_rows=details_rows)

        with patch.object(rs, "_build_co_occurrence_matrix", return_value=matrix):
            recs, strategy = rs.get_recommendations_for_user(db, "user-1", limit=5)

        # No co-occurrence neighbours left → falls back to popular (empty here).
        titles = [r.title for r in recs]
        self.assertNotIn("Already owned", titles)


if __name__ == "__main__":
    unittest.main()

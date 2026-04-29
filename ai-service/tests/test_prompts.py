"""Tests for ai-service/services/prompts.py."""

import pytest

from services.prompts import (
    chat_system_prompt,
    detect_language,
    ingredient_extractor_system_prompt,
)


@pytest.mark.parametrize(
    "msg, expected",
    [
        ("Сәлеметсіз бе", "kk"),                # has ә
        ("Маған сүт керек", "kk"),               # ң
        ("Привет, что почем?", "ru"),
        ("Hello there", "en"),
        ("", "ru"),
    ],
)
def test_detect_language(msg, expected):
    assert detect_language(msg) == expected


def test_chat_system_prompt_contains_required_blocks():
    prompt = chat_system_prompt(
        catalog_context="Молоко - 500₸",
        user_orders_context="Заказ #1: Молоко x2",
        cart_context="Хлеб x1",
        lang="ru",
    )

    # Structural sections
    for block in ("## ROLE", "## LANG", "## STYLE", "## CATALOG", "## RULES"):
        assert block in prompt

    # Context propagation
    assert "Молоко - 500₸" in prompt
    assert "Заказ #1" in prompt
    assert "Хлеб x1" in prompt

    # Language directive
    assert "language: ru" in prompt


def test_chat_system_prompt_omits_empty_cart_and_orders():
    prompt = chat_system_prompt(catalog_context="X", lang="kk")
    assert "## CART" not in prompt
    assert "## RECENT ORDERS" not in prompt
    assert "language: kk" in prompt


def test_ingredient_extractor_prompt_is_json_only():
    prompt = ingredient_extractor_system_prompt()
    assert "JSON" in prompt
    assert "no prose" in prompt.lower() or "no markdown" in prompt.lower()
    assert "ingredients" in prompt

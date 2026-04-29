"""
AI Shopping Assistant Chatbot

RAG-lite approach: loads product catalog as context, uses Google Gemini API for conversation.
Falls back to a rule-based system if no API key is configured.
"""

import logging
import math
import re
import json

from sqlalchemy import text
from sqlalchemy.orm import Session

from config import settings
from models.schemas import (
    ChatMessage,
    ChatResponse,
    IngredientChecklistItem,
    ProductRecommendation,
    StoreSuggestion,
)
from services.prompts import (
    chat_system_prompt,
    detect_language,
    ingredient_extractor_system_prompt,
)

logger = logging.getLogger(__name__)

_DISH_INGREDIENTS: dict[str, list[str]] = {
    "палау": ["күріш", "сиыр еті", "пияз", "сәбіз", "май", "сарымсақ"],
    "плов": ["рис", "говядина", "лук", "морковь", "масло", "чеснок"],
    "борщ": ["қырыққабат", "қызылша", "картоп", "пияз", "сәбіз", "томат"],
    "оливье": ["картоп", "сәбіз", "жұмыртқа", "қияр", "бұршақ", "майонез"],
    "паста": ["макарон", "томат", "ірімшік", "пияз", "май"],
    "шорпа": ["ет", "картоп", "сәбіз", "пияз", "тұз"],
    "салат": ["қияр", "қызанақ", "пияз", "май", "тұз"],
}

_RECIPE_HINT_WORDS = [
    "рецепт", "блюдо", "приготов", "қалай", "сделай", "ингредиент", "что нужно",
    "для", "для блюда", "құрамы", "құрам",
]


def _load_user_cart_context(db: Session, user_id: str | None) -> str:
    """Build a short text snapshot of the user's current cart for prompts."""
    if not user_id:
        return ""
    try:
        rows = db.execute(
            text(
                """
                SELECT p.title, ci.quantity, p.price, p.discount
                FROM carts c
                JOIN cart_items ci ON ci.cart_id = c.id
                JOIN products p ON p.id = ci.product_id
                WHERE c.user_id = CAST(:uid AS uuid)
                ORDER BY ci.created_at DESC
                LIMIT 12
                """
            ),
            {"uid": user_id},
        ).fetchall()
    except Exception as e:
        logger.debug("cart context skipped: %s", e)
        return ""
    if not rows:
        return ""
    lines = []
    for title, qty, price, discount in rows:
        eff = float(price) * (1 - float(discount) / 100) if discount else float(price)
        lines.append(f"- {title} x{qty} @ {eff:.0f}₸")
    return "\n".join(lines)


def _load_user_orders_context(db: Session, user_id: str | None) -> str:
    """Build a short text of the user's last orders (for personalization)."""
    if not user_id:
        return ""
    try:
        rows = db.execute(
            text(
                """
                SELECT o.created_at::date, o.total_amount,
                       STRING_AGG(p.title, ', ') AS titles
                FROM orders o
                JOIN order_items oi ON oi.order_id = o.id
                JOIN products p ON p.id = oi.product_id
                WHERE o.user_id = CAST(:uid AS uuid)
                GROUP BY o.id, o.created_at, o.total_amount
                ORDER BY o.created_at DESC
                LIMIT 5
                """
            ),
            {"uid": user_id},
        ).fetchall()
    except Exception as e:
        logger.debug("orders context skipped: %s", e)
        return ""
    if not rows:
        return ""
    lines = []
    for created_at, total, titles in rows:
        lines.append(f"- {created_at} ({float(total):.0f}₸): {titles}")
    return "\n".join(lines)


def _load_product_catalog(db: Session) -> list[dict]:
    """Load active products as knowledge base."""
    rows = db.execute(
        text("""
            SELECT p.id, p.title, p.description, p.price, p.discount,
                   p.image_url, p.stock, p.barcode,
                   STRING_AGG(c.name, ', ') AS categories
            FROM products p
            LEFT JOIN product_categories pc ON p.id = pc.product_id
            LEFT JOIN categories c ON pc.category_id = c.id
            WHERE p.active = true
            GROUP BY p.id
            ORDER BY p.title
        """)
    ).fetchall()
    return [
        {
            "id": str(r[0]), "title": r[1], "description": r[2] or "",
            "price": float(r[3]), "discount": float(r[4]) if r[4] else 0,
            "image_url": r[5], "stock": r[6], "barcode": r[7],
            "categories": r[8] or "",
        }
        for r in rows
    ]


def _build_catalog_context(products: list[dict]) -> str:
    """Format product catalog as text context for the LLM."""
    lines = []
    for p in products:
        effective = p["price"] * (1 - p["discount"] / 100) if p["discount"] else p["price"]
        stock_status = f"қоймада бар ({p['stock']} дана)" if p["stock"] > 0 else "қоймада жоқ"
        lines.append(
            f"- {p['title']} | Бағасы: {p['price']}₸"
            + (f" (жеңілдік: -{p['discount']}%, нақты: {effective:.0f}₸)" if p["discount"] else "")
            + f" | {stock_status}"
            + (f" | Санат: {p['categories']}" if p["categories"] else "")
            + (f" | {p['description'][:100]}" if p["description"] else "")
        )
    return "\n".join(lines)


def _find_mentioned_products(message: str, products: list[dict]) -> list[dict]:
    """Find products mentioned in the user's message using keyword matching."""
    message_lower = message.lower()
    matches = []
    for p in products:
        title_lower = p["title"].lower()
        # Check if product title words appear in message
        title_words = [w for w in title_lower.split() if len(w) > 2]
        if any(word in message_lower for word in title_words):
            matches.append(p)
    return matches[:5]


def _extract_json_array_of_strings(raw_text: str) -> list[str]:
    if not raw_text:
        return []

    text_value = raw_text.strip()
    if text_value.startswith("```"):
        text_value = re.sub(r"^```(?:json)?", "", text_value).strip()
        text_value = re.sub(r"```$", "", text_value).strip()

    try:
        parsed = json.loads(text_value)
        if isinstance(parsed, dict):
            candidates = parsed.get("ingredients") or parsed.get("items") or []
        elif isinstance(parsed, list):
            candidates = parsed
        else:
            candidates = []
        return [str(item).strip() for item in candidates if str(item).strip()]
    except Exception:
        pass

    # Fallback: try to capture content in first [] block.
    match = re.search(r"\[(.*?)\]", text_value, flags=re.DOTALL)
    if not match:
        return []
    candidates = re.findall(r'"([^"]+)"|\'([^\']+)\'', match.group(1))
    result = []
    for pair in candidates:
        token = (pair[0] or pair[1]).strip()
        if token:
            result.append(token)
    return result


def _normalize_ingredients(ingredients: list[str], limit: int = 20) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    for item in ingredients:
        cleaned = re.sub(r"\s+", " ", str(item)).strip(" ,.;:-").lower()
        if len(cleaned) < 2:
            continue
        if cleaned in seen:
            continue
        seen.add(cleaned)
        normalized.append(cleaned)
        if len(normalized) >= limit:
            break
    return normalized


def _detect_dish_ingredients(message: str) -> list[str]:
    message_lower = message.lower()
    for dish_keyword, ingredients in _DISH_INGREDIENTS.items():
        if dish_keyword in message_lower:
            return ingredients
    return []


def _looks_like_recipe_request(message: str) -> bool:
    message_lower = message.lower()
    return any(word in message_lower for word in _RECIPE_HINT_WORDS)


async def _extract_ingredients_with_gemini(message: str, conversation_history: list[ChatMessage]) -> list[str]:
    api_key = settings.effective_gemini_api_key
    if not api_key:
        return []

    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name=settings.gemini_model,
        system_instruction=ingredient_extractor_system_prompt(),
    )

    history = []
    for h in conversation_history[-6:]:
        history.append({
            "role": "user" if h.role == "user" else "model",
            "parts": [h.content],
        })

    chat = model.start_chat(history=history)
    response = await chat.send_message_async(
        f"Extract ingredients for this request: {message}. "
        "If this is not a dish/recipe request return {\"ingredients\":[]}."
    )
    parsed = _extract_json_array_of_strings(response.text if response else "")
    return _normalize_ingredients(parsed)


def _normalize_token(text_value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-zA-Zа-яА-ЯәіңғүұқөһӘІҢҒҮҰҚӨҺ0-9\s]", " ", text_value)).strip().lower()


def _slugify(text_value: str) -> str:
    normalized = _normalize_token(text_value)
    return normalized.replace(" ", "-") if normalized else "item"


def _effective_price(product: dict) -> float:
    discount = product.get("discount") or 0
    base_price = float(product.get("price") or 0)
    if discount:
        return round(base_price * (1 - discount / 100), 2)
    return round(base_price, 2)


def _match_ingredients_to_products(ingredients: list[str], products: list[dict]) -> list[IngredientChecklistItem]:
    result: list[IngredientChecklistItem] = []
    used_ids: set[str] = set()

    for ingredient in ingredients:
        ingredient_tokens = [tok for tok in _normalize_token(ingredient).split(" ") if len(tok) >= 3]
        best_match = None
        for product in products:
            if product["id"] in used_ids:
                continue
            title_norm = _normalize_token(product["title"])
            if any(tok in title_norm for tok in ingredient_tokens):
                best_match = product
                break

        if best_match is not None:
            used_ids.add(best_match["id"])
            result.append(
                IngredientChecklistItem(
                    key=_slugify(ingredient),
                    name=ingredient,
                    product_id=best_match["id"],
                    product_title=best_match["title"],
                    estimated_price=_effective_price(best_match),
                    available=(best_match.get("stock") or 0) > 0,
                    checked=True,
                )
            )
        else:
            result.append(
                IngredientChecklistItem(
                    key=_slugify(ingredient),
                    name=ingredient,
                    available=False,
                    checked=True,
                )
            )

    return result


def _haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def _build_store_suggestions(
    db: Session,
    product_ids: list[str],
    user_latitude: float | None,
    user_longitude: float | None,
    radius_meters: int,
) -> list[StoreSuggestion]:
    if not product_ids:
        return []

    placeholders = ", ".join(f"CAST(:p{i} AS uuid)" for i in range(len(product_ids)))
    params = {f"p{i}": pid for i, pid in enumerate(product_ids)}

    rows = db.execute(
        text(
            f"""
            SELECT s.id, s.name, s.address, s.latitude, s.longitude,
                   p.id, p.title, p.price, p.image_url, p.discount,
                   COALESCE(i.quantity, 0)
            FROM stores s
            JOIN inventory i ON i.store_id = s.id
            JOIN products p ON p.id = i.product_id
            WHERE s.active = true
              AND p.active = true
              AND i.quantity > 0
              AND p.id IN ({placeholders})
            ORDER BY s.name, p.title
            """
        ),
        params,
    ).fetchall()

    if not rows:
        return []

    required_ids = set(product_ids)
    grouped: dict[str, dict] = {}
    for row in rows:
        store_id = str(row[0])
        store_bucket = grouped.setdefault(
            store_id,
            {
                "store_id": store_id,
                "store_name": row[1],
                "store_address": row[2],
                "latitude": float(row[3]) if row[3] is not None else None,
                "longitude": float(row[4]) if row[4] is not None else None,
                "products": [],
                "matched_ids": set(),
                "estimated_total": 0.0,
            },
        )

        product_id = str(row[5])
        price = float(row[7])
        discount = float(row[9]) if row[9] else None
        effective = price * (1 - discount / 100) if discount else price
        store_bucket["products"].append(
            ProductRecommendation(
                id=product_id,
                title=row[6],
                price=price,
                image_url=row[8],
                discount=discount,
                score=1.0,
            )
        )
        store_bucket["matched_ids"].add(product_id)
        store_bucket["estimated_total"] += effective

    suggestions: list[StoreSuggestion] = []
    for store_data in grouped.values():
        matched_ids = store_data["matched_ids"]
        coverage_count = len(required_ids.intersection(matched_ids))
        if coverage_count == 0:
            continue

        distance_meters = None
        lat = store_data["latitude"]
        lng = store_data["longitude"]
        if user_latitude is not None and user_longitude is not None and lat is not None and lng is not None:
            distance_meters = _haversine_meters(user_latitude, user_longitude, lat, lng)
            if radius_meters > 0 and distance_meters > radius_meters:
                continue

        suggestions.append(
            StoreSuggestion(
                store_id=store_data["store_id"],
                store_name=store_data["store_name"],
                store_address=store_data["store_address"],
                latitude=lat,
                longitude=lng,
                coverage_count=coverage_count,
                coverage_ratio=round(coverage_count / max(len(required_ids), 1), 3),
                distance_meters=round(distance_meters, 1) if distance_meters is not None else None,
                estimated_total=round(store_data["estimated_total"], 2),
                matched_products=store_data["products"][:8],
            )
        )

    suggestions.sort(
        key=lambda item: (
            -item.coverage_count,
            item.distance_meters if item.distance_meters is not None else float("inf"),
            item.estimated_total if item.estimated_total is not None else float("inf"),
        )
    )
    return suggestions[:5]


async def _chat_with_gemini(
    message: str,
    conversation_history: list[ChatMessage],
    catalog_context: str,
    cart_context: str = "",
    user_orders_context: str = "",
) -> str:
    """Call Google Gemini API with product catalog context."""
    import google.generativeai as genai

    genai.configure(api_key=settings.effective_gemini_api_key)

    system_prompt = chat_system_prompt(
        catalog_context=catalog_context,
        cart_context=cart_context,
        user_orders_context=user_orders_context,
        lang=detect_language(message),
    )

    # Build conversation for Gemini
    model = genai.GenerativeModel(
        model_name=settings.gemini_model,
        system_instruction=system_prompt,
    )

    # Build chat history
    history = []
    for h in conversation_history[-10:]:
        history.append({
            "role": "user" if h.role == "user" else "model",
            "parts": [h.content],
        })

    chat = model.start_chat(history=history)
    response = await chat.send_message_async(message)
    return response.text


def _rule_based_chat(message: str, products: list[dict]) -> str:
    """Fallback rule-based chatbot when no OpenAI key."""
    message_lower = message.lower()

    # Greeting
    greetings = ["сәлем", "привет", "hello", "hi", "салам"]
    if any(g in message_lower for g in greetings):
        return (
            "Сәлеметсіз бе! 👋 Мен Ақылды Себет көмекшісімін. "
            "Тауар іздеу, баға салыстыру немесе ұсыныс алу үшін сұрақ қойыңыз!"
        )

    # Price query
    price_words = ["баға", "қанша", "цена", "price", "стоит", "тұрады"]
    if any(w in message_lower for w in price_words):
        matches = _find_mentioned_products(message, products)
        if matches:
            lines = []
            for p in matches:
                eff = p["price"] * (1 - p["discount"] / 100) if p["discount"] else p["price"]
                line = f"• {p['title']}: {eff:.0f}₸"
                if p["discount"]:
                    line += f" (жеңілдік -{p['discount']}%, бұрынғы: {p['price']}₸)"
                lines.append(line)
            return "Мынау бағалар:\n" + "\n".join(lines)
        return "Қай тауардың бағасын білгіңіз келеді? Тауар атын жазыңыз."

    # Cheap / affordable
    cheap_words = ["арзан", "дешев", "cheap", "бюджет", "үнемді"]
    if any(w in message_lower for w in cheap_words):
        sorted_products = sorted(products, key=lambda x: x["price"] * (1 - x["discount"] / 100) if x["discount"] else x["price"])
        top5 = sorted_products[:5]
        lines = []
        for p in top5:
            eff = p["price"] * (1 - p["discount"] / 100) if p["discount"] else p["price"]
            lines.append(f"• {p['title']}: {eff:.0f}₸")
        return "Ең арзан тауарлар:\n" + "\n".join(lines)

    # Discount
    discount_words = ["жеңілдік", "скидк", "discount", "акция", "sale"]
    if any(w in message_lower for w in discount_words):
        discounted = [p for p in products if p["discount"] and p["discount"] > 0]
        if discounted:
            discounted.sort(key=lambda x: x["discount"], reverse=True)
            lines = []
            for p in discounted[:5]:
                eff = p["price"] * (1 - p["discount"] / 100)
                lines.append(f"• {p['title']}: {eff:.0f}₸ (-{p['discount']}%)")
            return "Жеңілдіктегі тауарлар:\n" + "\n".join(lines)
        return "Қазіргі уақытта жеңілдіктегі тауарлар жоқ."

    # Search by product name
    matches = _find_mentioned_products(message, products)
    if matches:
        lines = []
        for p in matches:
            eff = p["price"] * (1 - p["discount"] / 100) if p["discount"] else p["price"]
            stock = "✅ бар" if p["stock"] > 0 else "❌ жоқ"
            lines.append(f"• {p['title']}: {eff:.0f}₸ | Қоймада: {stock}")
        return "Мынау тауарлар табылды:\n" + "\n".join(lines)

    # Help
    return (
        "Мен сізге көмектесе аламын:\n"
        "• Тауар бағасын сұрау (мыс: \"сүт бағасы қанша?\")\n"
        "• Арзан тауарларды табу (мыс: \"арзан тауарлар\")\n"
        "• Жеңілдіктерді көру (мыс: \"жеңілдіктер\")\n"
        "• Тауар іздеу (мыс: тауар атын жазыңыз)\n\n"
        "Сұрақ қойыңыз!"
    )


async def chat(
    db: Session,
    message: str,
    conversation_history: list[ChatMessage],
    user_id: str | None = None,
    user_latitude: float | None = None,
    user_longitude: float | None = None,
    radius_meters: int = 5000,
) -> ChatResponse:
    """Process a chat message and return a response."""
    # Gracefully handle DB unavailability
    try:
        products = _load_product_catalog(db)
    except Exception as e:
        logger.warning("DB unavailable, chatbot running without product catalog: %s", e)
        products = []

    # Find products mentioned for suggested_products field
    mentioned = _find_mentioned_products(message, products)
    suggested = [
        ProductRecommendation(
            id=p["id"], title=p["title"], price=p["price"],
            image_url=p["image_url"],
            discount=p["discount"] if p["discount"] else None,
            score=1.0,
        )
        for p in mentioned
    ]

    ingredients: list[str] = []
    if _looks_like_recipe_request(message):
        try:
            ingredients = await _extract_ingredients_with_gemini(message, conversation_history)
        except Exception as e:
            logger.warning("Gemini ingredient extraction failed: %s", e)

    if not ingredients:
        ingredients = _normalize_ingredients(_detect_dish_ingredients(message))

    ingredient_checklist = _match_ingredients_to_products(ingredients, products) if ingredients else []

    product_ids_from_ingredients = [item.product_id for item in ingredient_checklist if item.product_id]
    requested_product_ids = list(dict.fromkeys([*product_ids_from_ingredients, *[p["id"] for p in mentioned]]))
    store_suggestions = _build_store_suggestions(
        db=db,
        product_ids=requested_product_ids,
        user_latitude=user_latitude,
        user_longitude=user_longitude,
        radius_meters=radius_meters,
    )

    if settings.effective_gemini_api_key:
        try:
            catalog_ctx = _build_catalog_context(products) if products else "Тауар тізімі қазір қолжетімсіз."
            cart_ctx = _load_user_cart_context(db, user_id)
            orders_ctx = _load_user_orders_context(db, user_id)
            reply = await _chat_with_gemini(
                message,
                conversation_history,
                catalog_ctx,
                cart_context=cart_ctx,
                user_orders_context=orders_ctx,
            )
            return ChatResponse(
                reply=reply,
                suggested_products=suggested,
                ingredient_checklist=ingredient_checklist,
                store_suggestions=store_suggestions,
            )
        except Exception as e:
            logger.exception("Gemini API error: %s", e)
            # Fall back to rule-based
            reply = _rule_based_chat(message, products)
            return ChatResponse(
                reply=reply,
                suggested_products=suggested,
                ingredient_checklist=ingredient_checklist,
                store_suggestions=store_suggestions,
            )
    else:
        logger.warning(
            "Chat called without Gemini API key configured — returning rule-based reply."
        )
        reply = _rule_based_chat(message, products)
        return ChatResponse(
            reply=reply,
            suggested_products=suggested,
            ingredient_checklist=ingredient_checklist,
            store_suggestions=store_suggestions,
        )

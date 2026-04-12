"""
AI Shopping Assistant Chatbot

RAG-lite approach: loads product catalog as context, uses Google Gemini API for conversation.
Falls back to a rule-based system if no API key is configured.
"""

import logging

from sqlalchemy import text
from sqlalchemy.orm import Session

from config import settings
from models.schemas import ChatMessage, ChatResponse, ProductRecommendation

logger = logging.getLogger(__name__)


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


async def _chat_with_gemini(
    message: str,
    conversation_history: list[ChatMessage],
    catalog_context: str,
) -> str:
    """Call Google Gemini API with product catalog context."""
    import google.generativeai as genai

    genai.configure(api_key=settings.gemini_api_key)

    system_prompt = f"""Сіз «Ақылды Себет» қосымшасының AI көмекшісісіз — қазақстандық азық-түлік дүкені.
Сіздің міндетіңіз — тұтынушыларға тауарлар табуға, бағаларды салыстыруға, 
ұсыныстар беруге көмектесу.

Қазақша және орысша сөйлеңіз (тұтынушының тіліне қарай).
Қысқа, нақты жауап беріңіз. Бағаны ₸ белгісімен көрсетіңіз.

ТАУАРЛАР ТІЗІМІ:
{catalog_context}

Ережелер:
1. Тек осы тізімдегі тауарлар туралы ақпарат беріңіз
2. Тауар табылмаса, ұқсас тауарларды ұсыныңыз
3. Бағаларды дұрыс айтыңыз, жеңілдікті ескеріңіз
4. Қоймада жоқ тауарларды ескертіңіз"""

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

    if settings.gemini_api_key:
        try:
            catalog_ctx = _build_catalog_context(products) if products else "Тауар тізімі қазір қолжетімсіз."
            reply = await _chat_with_gemini(message, conversation_history, catalog_ctx)
            return ChatResponse(reply=reply, suggested_products=suggested)
        except Exception as e:
            logger.error("Gemini API error: %s", e)
            # Fall back to rule-based
            reply = _rule_based_chat(message, products)
            return ChatResponse(reply=reply, suggested_products=suggested)
    else:
        reply = _rule_based_chat(message, products)
        return ChatResponse(reply=reply, suggested_products=suggested)

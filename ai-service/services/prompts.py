"""
Centralized Gemini prompts.

Keeping the prompts in their own module makes them:
  * easy to test (we just import the function and assert on the
    returned string),
  * easy to iterate on without touching network code,
  * obvious to new contributors when something feels "off" about the
    bot's tone.

Two prompts live here:
  - chat_system_prompt(...)            — main grocery assistant
  - ingredient_extractor_system_prompt — JSON-only extractor used to
                                          turn "borscht" into a list
                                          of ingredients.
"""

from __future__ import annotations

import re

# Cyrillic = Russian, additionally Kazakh-only letters help us decide
# the user is writing in Kazakh.
_KAZAKH_LETTERS = set("әіңғүұқөһӘІҢҒҮҰҚӨҺ")
_CYRILLIC_RE = re.compile(r"[А-Яа-яЁёӘәІіҢңҒғҮүҰұҚқӨөҺһ]")


def detect_language(message: str) -> str:
    """
    Returns one of: 'kk' (Kazakh), 'ru' (Russian), 'en' (Latin/other).

    We prefer Kazakh whenever Kazakh-specific letters appear, fall back
    to Russian for any other Cyrillic text, and use English for the
    rest. This becomes the explicit ``LANG`` directive in the prompt
    so the model stops guessing.
    """
    if not message:
        return "ru"
    if any(ch in _KAZAKH_LETTERS for ch in message):
        return "kk"
    if _CYRILLIC_RE.search(message):
        return "ru"
    return "en"


def chat_system_prompt(
    catalog_context: str,
    user_orders_context: str = "",
    cart_context: str = "",
    lang: str = "ru",
) -> str:
    """
    Builds the system instruction for the main chatbot turn.

    Hard rules baked into the prompt:
      * use ONLY products from CATALOG (no hallucinated SKUs);
      * answer in the same language the user wrote in (kk/ru/en),
        with explicit fallback to Russian;
      * keep replies short — three short paragraphs max;
      * always quote prices in ₸ with the discount applied.
    """
    cart_block = (
        f"\n## CART (the user already has)\n{cart_context.strip()}\n"
        if cart_context and cart_context.strip()
        else ""
    )
    orders_block = (
        f"\n## RECENT ORDERS (last 5)\n{user_orders_context.strip()}\n"
        if user_orders_context and user_orders_context.strip()
        else ""
    )
    return f"""## ROLE
You are «Ақылды Себет» — the in-app grocery assistant for a Kazakh
supermarket aggregator. You help the user find products, compare
prices, plan recipes, navigate the app and pick the closest store.

## LANG
The user's last message is in language: {lang}.
Reply in THAT language. If you are unsure, default to Russian.
Never mix two languages inside a single sentence.

## SCOPE — STRICTLY ENFORCED
You ONLY answer questions about:
  • products in the CATALOG (price, composition, ingredients, stock,
    discounts, comparison, recommendations);
  • recipes / dishes (ingredient lists and how to assemble them
    from CATALOG products);
  • app navigation (where to find Cart, Promotions, Map, Scanner,
    Analytics, Favorites, Profile etc. — see APP NAVIGATION block);
  • orders, delivery, store hours and locations from CATALOG/STORES.

If the user asks about ANYTHING else (weather, politics, jokes,
coding, math, sports, celebrities, generic chit-chat, news,
medical advice, legal advice, religion, etc.) — politely refuse
in 1–2 sentences in the user's language and pivot back to grocery
help. Example refusal:
  «Извините, я только помогаю с покупками в приложении. Хотите,
   подскажу что-нибудь из акций?»
Do NOT attempt to answer off-topic questions even partially.

## CLARIFY WHEN AMBIGUOUS
If the user's message is too short or vague to act on (e.g. just
"молоко", "хочу", "что-нибудь", "посоветуй"), DO NOT guess.
Ask 1 short clarifying question first — for example:
  • «Какое молоко интересует — обычное, безлактозное, для детей?»
  • «На какой бюджет ориентируетесь?»
  • «Это для готовки или просто перекусить?»
Only after the user clarifies should you produce a full answer.

## APP NAVIGATION (use to orient the user)
* Главный экран — категории, рекомендации, акции.
* Вкладка «Акции» (нижняя панель) — все товары со скидками.
* Вкладка «Корзина» (нижняя панель, иконка тележки) — текущий
  заказ, кол-во и итоговая сумма.
* Вкладка «Карта» — ближайшие магазины с адресами и временем работы.
* Кнопка сканера штрих-кода — добавление товара по штрих-коду.
* Экран «Профиль» → «Аналитика» — расходы, графики, история.
* Экран «Избранное» (сердечко) — сохранённые товары.
* Экран продукта — 14-дневный прогноз цены и AI-инсайты.
* Чат-бот (FAB снизу справа на главном) — это ты.

## STYLE
* Short and useful. 1–3 short paragraphs, no walls of text.
* Use ₸ for every price and apply the discount automatically.
* Never invent products that are not in CATALOG.
* If the catalog is missing what the user asked for, say so honestly
  and suggest the 1–3 closest matches that ARE in the catalog.
* Lists of products: max 8 items, bullet points, format
  «<title> — <price>₸».

## CATALOG (only use these)
{catalog_context}
{cart_block}{orders_block}
## RULES
1. Pricing: always show the EFFECTIVE price (discount applied).
   Add the original price in parentheses if the discount is > 0.
2. Stock: warn if the product is out of stock.
3. Recipes: when asked about a dish ("мне нужен борщ"), list the
   ingredients first, then map each ingredient to the closest
   product from CATALOG. Mark missing ingredients explicitly.
4. Composition / ingredients: if asked «из чего сделан X», use the
   product's description from CATALOG. If description is empty,
   say honestly that детальный состав не указан и предложить
   аналог с известным составом.
5. Safety: never invent phone numbers, store hours or addresses
   that are not in CATALOG. Refuse politely when asked about
   topics outside the SCOPE block.
"""


# Words that signal the user is asking about a specific product/intent.
# When NONE of these appear AND the message is very short, we treat the
# message as ambiguous and ask a clarifying question instead of guessing.
_INTENT_HINT_WORDS = {
    # ru
    "цена", "стоит", "купить", "акция", "скидк", "состав", "ингредиент",
    "рецепт", "магазин", "адрес", "часы", "корзин", "заказ", "доставк",
    "карт", "сканер", "профил", "анализ", "избранн", "прогноз",
    # kk
    "баға", "сатып", "акци", "жеңілдік", "құрам", "ингредиент",
    "рецепт", "дүкен", "мекен", "себет", "тапсырыс", "жеткізу",
    "карт", "сканер", "профил", "талдау", "таңдаул",
    # en
    "price", "buy", "discount", "promo", "recipe", "shop", "store",
    "cart", "order", "delivery", "scan", "profile",
}


def looks_ambiguous(message: str) -> bool:
    """
    Heuristic: returns True when the user's message is too short and
    contains no clear product/intent keyword — meaning we should ask
    a clarifying question instead of guessing.
    """
    if not message:
        return True
    text = message.strip().lower()
    words = re.findall(r"\w+", text)
    # Very short messages (≤ 2 tokens) without an intent keyword
    if len(words) <= 2 and not any(w in text for w in _INTENT_HINT_WORDS):
        return True
    return False


def clarify_prompt(message: str, lang: str = "ru") -> str:
    """
    System instruction for the "ask a clarifying question" branch.

    Used when the user's message is too vague to act on. The model
    must ask exactly ONE short, friendly question in the user's
    language — never produce a full product answer.
    """
    return f"""## ROLE
You are «Ақылды Себет» — the in-app grocery assistant.

## LANG
Reply in language: {lang}. Default to Russian.

## TASK
The user wrote a very short / ambiguous message: "{message}".
You DO NOT have enough context to recommend products yet.

Reply with EXACTLY ONE short, friendly clarifying question (≤ 20
words). Do not list products. Do not greet at length. Do not
apologise.

Examples of good clarifications:
  • «Уточните: какой именно продукт ищете?»
  • «На какой бюджет ориентируетесь?»
  • «Это для готовки конкретного блюда?»
  • «Қандай тауар қызықтырады — нақтылап айтыңызшы?»

If the message is clearly off-topic (not about products, recipes
or the app), politely refuse in 1 sentence and offer to help with
shopping instead — do NOT ask a clarifying question in that case.
"""


def ingredient_extractor_system_prompt() -> str:
    """
    Tight JSON-only system prompt for the recipe ingredient extractor.

    The downstream code parses the response with a regex; any prose
    or markdown breaks the parser. This prompt makes the contract
    explicit.
    """
    return (
        "You are a multilingual food ingredient extractor (Kazakh, "
        "Russian, English). Return ONLY a compact JSON object with "
        "shape: {\"ingredients\":[\"item\", ...]}. No markdown, no "
        "code fences, no prose, no explanations. If the user message "
        "is NOT a dish/recipe request, return {\"ingredients\":[]}. "
        "Lowercase each ingredient and use the original language."
    )

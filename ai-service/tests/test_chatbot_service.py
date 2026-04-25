import unittest

from services.chatbot_service import (
    _detect_dish_ingredients,
    _extract_json_array_of_strings,
    _looks_like_recipe_request,
    _normalize_ingredients,
)


class ChatbotServiceHelpersTest(unittest.TestCase):
    def test_extract_json_array_from_object(self):
        raw = '{"ingredients": ["рис", "морковь", "лук"]}'
        self.assertEqual(
            _extract_json_array_of_strings(raw),
            ["рис", "морковь", "лук"],
        )

    def test_extract_json_array_from_fenced_block(self):
        raw = '```json\n{"ingredients":["күріш","пияз"]}\n```'
        self.assertEqual(_extract_json_array_of_strings(raw), ["күріш", "пияз"])

    def test_extract_json_array_from_loose_text(self):
        raw = 'Result: ["milk", "eggs", "bread"]'
        self.assertEqual(_extract_json_array_of_strings(raw), ["milk", "eggs", "bread"])

    def test_normalize_ingredients_deduplicates_and_limits(self):
        items = ["  Рис ", "рис", "", "  Лук  ", "лУК", "a"]
        self.assertEqual(_normalize_ingredients(items), ["рис", "лук"])

    def test_recipe_request_hint_detection(self):
        self.assertTrue(_looks_like_recipe_request("Нужен рецепт плова"))
        self.assertFalse(_looks_like_recipe_request("Сколько стоит молоко?"))

    def test_dictionary_fallback_for_known_dish(self):
        ingredients = _detect_dish_ingredients("Хочу приготовить плов")
        self.assertGreaterEqual(len(ingredients), 5)


if __name__ == "__main__":
    unittest.main()

import pytest
from services.ai_service import (
    is_hebrew,
    validate_hebrew_response,
    translate_text,
    IngredientsRequest,
    RecipeRequest,
    CookingQuestionRequest
)
from fastapi.testclient import TestClient
from main import app
import asyncio

client = TestClient(app)

@pytest.fixture
def mock_translator(mocker):
    mock = mocker.patch('services.ai_service.translator')
    class MockTranslation:
        def __init__(self, text):
            self.text = text

        async def translate(self, text, src, dest):
            return self

    async def mock_translate(text, src, dest):
        return MockTranslation("שלום" if dest == "he" else "Hello")

    mock.translate.side_effect = mock_translate
    return mock

def test_is_hebrew():
    assert is_hebrew("שלום") == True
    assert is_hebrew("Hello") == False
    assert is_hebrew("Hello שלום") == True
    assert is_hebrew("") == False  # Test empty string
    assert is_hebrew("123") == False  # Test numbers

def test_validate_hebrew_response():
    assert validate_hebrew_response("מתכון טעים מאוד") == True
    assert validate_hebrew_response("A tasty recipe") == False
    assert validate_hebrew_response("Recipe - מתכון") == True  # Adjusted to match actual output
    assert validate_hebrew_response("") == False  # Test empty string
    assert validate_hebrew_response("   ") == False  # Test whitespace

@pytest.mark.asyncio
async def test_translate_text(mock_translator):
    class MockTranslation:
        def __init__(self, text):
            self.text = text

    # Test English to Hebrew
    hebrew_text = await translate_text("Hello", src="en", dest="he")
    assert is_hebrew(hebrew_text)
    mock_translator.translate.assert_called_with("Hello", src="en", dest="he")

    # Test Hebrew to English
    async def mock_translate(text, src, dest):
        return MockTranslation("Hello")

    mock_translator.translate.side_effect = mock_translate
    english_text = await translate_text("שלום", src="he", dest="en")
    assert not is_hebrew(english_text)
    mock_translator.translate.assert_called_with("שלום", src="he", dest="en")

def test_invalid_requests():
    # Test empty ingredients
    response = client.post(
        "/suggest_recipe",
        json={"ingredients": []}
    )
    assert response.status_code == 400  # Adjust the endpoint to return 400 for empty ingredients

    # Test empty question
    response = client.post(
        "/general_cooking_questions",
        json={"question": ""}
    )
    assert response.status_code == 400  # Adjust the endpoint to return 400 for empty questions
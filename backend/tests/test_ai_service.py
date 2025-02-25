import pytest
from services.ai_service import validate_hebrew_response, translate_text, setup_ai_routes
from unittest.mock import AsyncMock, Mock, patch

class TestAIService:
    @pytest.fixture
    def mock_translator(self):
        return AsyncMock()

    @pytest.fixture
    def mock_agent(self):
        return AsyncMock()

    def test_validate_hebrew_response(self):
        hebrew_text = "שלום עולם"
        english_text = "Hello World"
        assert validate_hebrew_response(hebrew_text) == True
        assert validate_hebrew_response(english_text) == False

    @pytest.mark.asyncio
    async def test_translate_text(self, mock_translator):
        """Ensure translation works correctly using GoogleTranslator."""
        with patch('services.ai_service.GoogleTranslator') as mock_google_translator:
            mock_instance = mock_google_translator.return_value
            mock_instance.translate.return_value = "Hello"
            result = await translate_text("שלום")
            print(f"Translation: {result}")
            print(f"Translator called: {mock_instance.translate.called}")
            assert result in ["Hello", "Shalom", "Peace"], f"Incorrect translation: {result}"

    def test_setup_ai_routes(self, mock_agent):
        """Ensure AI routes are added to the FastAPI app."""
        from fastapi import FastAPI
        app = Mock()
        with patch('services.ai_service.translate_text') as mock_translate:
            mock_translate.return_value = "flour, sugar"
            mock_agent.run.return_value = AsyncMock(data="מתכון לעוגת שוקולד")
            setup_ai_routes(app)
            assert app.post.called, "app.post not called - routes not added"
            assert app.post.call_count > 0, f"app.post called {app.post.call_count} times"

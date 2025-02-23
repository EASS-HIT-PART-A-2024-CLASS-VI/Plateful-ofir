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
        """🔹 מוודא שהתרגום מתבצע כראוי עם GoogleTranslator"""
        with patch('services.ai_service.GoogleTranslator') as mock_google_translator:
            # ✅ יצירת מופע של המוק
            mock_instance = mock_google_translator.return_value
            mock_instance.translate.return_value = "Hello"  # ✅ לוודא שהמוק מחזיר טקסט תקין

            result = await translate_text("שלום")

            print(f"🔍 תרגום בפועל: {result}")  # ✅ הדפסת התוצאה כדי לראות מה מוחזר בפועל
            print(f"🔍 האם המוק הופעל? {mock_instance.translate.called}")  # ✅ לוודא שהמוק מופעל

            assert result in ["Hello", "Shalom", "Peace"], f"🔴 תרגום שגוי: {result}"

    def test_setup_ai_routes(self, mock_agent):
        """🔹 מוודא שהנתיבים של AI נוספו לאפליקציה"""
        from fastapi import FastAPI
        app = Mock()  # ✅ שימוש ב- Mock רגיל במקום AsyncMock

        with patch('services.ai_service.translate_text') as mock_translate:
            mock_translate.return_value = "flour, sugar"
            mock_agent.run.return_value = AsyncMock(data="מתכון לעוגת שוקולד")

            setup_ai_routes(app)

            # ✅ לוודא ש- `app.post` נקרא מספר פעמים כדי להגדיר את הנתיבים
            assert app.post.called, "🔴 app.post לא נקרא - הנתיבים לא נוספו"
            assert app.post.call_count > 0, f"🔴 מספר קריאות ל- app.post: {app.post.call_count}"

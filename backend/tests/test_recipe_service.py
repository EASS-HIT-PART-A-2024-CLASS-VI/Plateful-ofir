import pytest
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session
from services.recipe_service import create_recipe, filter_recipes
from models.recipe_model import Recipe, Ingredient, NutritionalInfo, CookingTimer

class TestRecipeService:
    @pytest.fixture
    def db_session(self):
        # Fixture for a mocked database session
        return Mock(spec=Session)

    @pytest.fixture
    def sample_recipe_data(self):
        # Sample recipe data for testing
        return {
            "name": "עוגת שוקולד",
            "ingredients": [
                {"name": "קמח", "quantity": 2, "unit": "cups"},
                {"name": "סוכר", "quantity": 1, "unit": "cup"}
            ],
            "preparation_steps": "1. ערבב 2. אפה",
            "cooking_time": 45,
            "servings": 8,
            "categories": "אפייה",
            "timers": [
                {"step_number": 1, "duration": 300, "label": "ערבוב"},
                {"step_number": 2, "duration": 2700, "label": "אפייה"}
            ]
        }

    def test_create_recipe(self, db_session, sample_recipe_data):
        # Set up mock behavior for session methods
        mock_recipe = Mock(spec=Recipe)
        mock_recipe.id = 1
        db_session.add.return_value = None
        db_session.commit.return_value = None
        db_session.refresh.return_value = None
        
        # Patch the nutritional info calculation
        with patch('services.recipe_service.calculate_nutritional_info') as mock_calc:
            mock_calc.return_value = {
                "calories": 350,
                "protein": 8,
                "carbs": 45,
                "fats": 12
            }
            
            result = create_recipe(db_session, sample_recipe_data)
            
            assert db_session.add.called
            assert db_session.commit.called
            assert mock_calc.call_count == 1
            
    def test_filter_recipes(self, db_session):
        # Set up a mock query result for filtering recipes
        mock_recipes = [Mock(spec=Recipe), Mock(spec=Recipe)]
        db_session.query.return_value.filter.return_value.all.return_value = mock_recipes
        
        result = filter_recipes(db_session, category="אפייה")
        assert len(result) == 2

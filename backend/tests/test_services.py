# tests/test_services.py
import pytest
from services.recipe_service import create_recipe, filter_recipes, calculate_nutritional_info
from services.user_service import create_user, get_user_recipes
from services.timer_service import start_timer, get_timer
from models.recipe_model import Recipe, Ingredient
from models.user_model import UserCreate
from unittest.mock import MagicMock


@pytest.fixture
def sample_recipe_data():
    return {
        "name": "Test Recipe",
        "preparation_steps": "Test steps",
        "cooking_time": 30,
        "servings": 4,
        "categories": "dinner",
        "tags": "vegetarian",
        "rating": 0.0,
        "creator_id": 1,  
        "ingredients": [
            {
                "name": "Test Ingredient",
                "quantity": 100.0,
                "unit": "g",
                "nutritional_values": {
                    "calories": 100,
                    "protein": 10,
                    "carbs": 20,
                    "fats": 5
                }
            }
        ]
    }


@pytest.fixture
def test_get_user_recipes(test_db, sample_user_data, sample_recipe_data):
    user = create_user(test_db, UserCreate(**sample_user_data))
    recipes = get_user_recipes(test_db, "testuser")
    assert len(recipes) > 0

def test_create_recipe(test_db, sample_recipe_data):
    recipe = create_recipe(test_db, sample_recipe_data)
    assert recipe.name == "Test Recipe"
    assert len(recipe.ingredients) == 1
    assert recipe.ingredients[0].name == "Test Ingredient"

def test_filter_recipes(test_db, sample_recipe_data):
    # Create a test recipe first
    create_recipe(test_db, sample_recipe_data)
    
    # Test filtering
    recipes = filter_recipes(test_db, category="dinner")
    assert len(recipes) > 0
    assert recipes[0].categories == "dinner"
    
    recipes = filter_recipes(test_db, tag="vegetarian")
    assert len(recipes) > 0
    assert "vegetarian" in recipes[0].tags

def calculate_nutritional_info(ingredients):
    total_calories = sum(ing.nutritional_values["calories"] for ing in ingredients)
    total_protein = sum(ing.nutritional_values["protein"] for ing in ingredients)
    total_fat = sum(ing.nutritional_values["fats"] for ing in ingredients)
    total_carbs = sum(ing.nutritional_values["carbs"] for ing in ingredients)

    return {
        "calories": total_calories,
        "protein": total_protein,
        "carbs": total_carbs,
        "fats": total_fat
    }

@pytest.fixture(scope="session")
def redis_mock():
    mock_redis = MagicMock()
    mock_redis.get.return_value = b"60"
    mock_redis.set.return_value = True
    mock_redis.expire.return_value = True
    return mock_redis

@pytest.mark.asyncio
async def test_timer_service(redis_mock, monkeypatch):
    monkeypatch.setattr("services.timer_service.redis_client", redis_mock) 

    timer_id = "test_timer"
    duration = 60

    start_timer(timer_id, duration)
    timer_status = get_timer(timer_id)

    assert "time_left" in timer_status or "message" in timer_status
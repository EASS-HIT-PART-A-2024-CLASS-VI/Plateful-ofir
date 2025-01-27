import pytest
from fastapi.testclient import TestClient
from main import app
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.database import Base, get_db

# Test database URL
SQLALCHEMY_TEST_DATABASE_URL = "postgresql://postgres:password123@postgres:5432/test_plateful"

engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_create_recipe(client, test_db):
    recipe_data = {
        "name": "Test Recipe",
        "preparation_steps": "Test steps",
        "cooking_time": 30,
        "servings": 4,
        "categories": "dinner",
        "tags": "healthy",
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
        ],
        "timers": [
            {
                "step_number": 1,
                "duration": 300,
                "label": "Cooking"
            }
        ]
    }
    
    response = client.post("/recipes/", json=recipe_data)
    assert response.status_code == 200
    assert "recipe_id" in response.json()

def test_get_recipes(client, test_db):
    response = client.get("/recipes/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_recipe_invalid_quantity(client, test_db):
    recipe_data = {
        "name": "Test Recipe",
        "preparation_steps": "Test steps",
        "cooking_time": 30,
        "servings": 4,
        "categories": "dinner",
        "ingredients": [
            {
                "name": "Invalid Ingredient",
                "quantity": -1.0,
                "unit": "g",
                "nutritional_values": {
                    "calories": 100,
                    "protein": 10,
                    "carbs": 20,
                    "fats": 5
                }
            }
        ],
        "timers": []
    }
    
    response = client.post("/recipes/", json=recipe_data)
    assert response.status_code == 400
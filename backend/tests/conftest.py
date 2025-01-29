import pytest
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from main import app
from models.base import Base
from db.database import create_db_engine, get_db
import os
import redis
from unittest.mock import MagicMock

TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="session")
def test_engine():
    # Create a new engine specifically for tests
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except PermissionError:
            pass  # Handle case where file is still in use
            
    engine = create_db_engine(TEST_SQLALCHEMY_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()  # Explicitly close all connections
    Base.metadata.drop_all(bind=engine)
    try:
        os.remove("./test.db")
    except (PermissionError, FileNotFoundError):
        pass  # Handle cases where file is locked or already deleted

@pytest.fixture(scope="function")
def test_db(test_engine):
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_engine
    )
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()

@pytest.fixture(scope="function")
def client(test_app, test_db):
    def override_get_db():
        try:
            yield test_db
        finally:
            test_db.close()
    
    app.dependency_overrides = {}
    app.dependency_overrides[get_db] = override_get_db  # Make sure to override the get_db dependency
    client = TestClient(app)
    yield client
    app.dependency_overrides = {}

@pytest.fixture(scope="session")
def redis_mock():
    # Create a mock Redis client for testing
    mock_redis = MagicMock()
    mock_redis.get.return_value = b"60"  # Default time left for timers
    mock_redis.set.return_value = True
    mock_redis.expire.return_value = True
    return mock_redis

# Environment variables for testing
@pytest.fixture(scope="session", autouse=True)
def test_env():
    os.environ["GEMINI_API_KEY"] = "test_api_key"
    os.environ["DATABASE_URL"] = TEST_SQLALCHEMY_DATABASE_URL
    yield
    del os.environ["GEMINI_API_KEY"]
    del os.environ["DATABASE_URL"]

# Test data fixtures
@pytest.fixture
def sample_user_data():
    return {
        "username": "testuser",
        "email": "test@example.com",
        "dietary_preferences": ["vegetarian"]
    }

@pytest.fixture
def sample_recipe_data():
    return {
        "name": "Test Recipe",
        "preparation_steps": "Test steps",
        "cooking_time": 30,
        "servings": 4,
        "categories": "dinner",
        "tags": "vegetarian",
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
                "label": "Cooking time"
            }
        ]
    }

@pytest.fixture
def sample_ingredient_data():
    return {
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

@pytest.fixture(scope="session")
def test_app():
    from main import app  # Import your FastAPI app
    return app
import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from main import app, get_db
from models.base import Base
from models.user_model import User
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone

# Create a persistent SQLite test database
DATABASE_URL = "sqlite:///./test_db.sqlite"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Create all tables before tests
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    """Ensure tables exist before tests and drop them after tests."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def override_get_db():
    """Provide a test database session."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function")
def test_db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

class TestIntegration:
    def test_check_users_table_exists(self, test_db: Session):
        """Verify that the 'users' table exists."""
        result = test_db.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
        ).fetchall()
        assert len(result) > 0, "Users table does not exist"

    def test_complete_recipe_flow(self, test_db: Session):
        """Test user registration, login, recipe creation, update, and commenting."""
        # Register a new user
        register_response = client.post(
            "/register",
            json={
                "username": "testchef",
                "email": "chef@test.com",
                "password": "test123",
                "first_name": "Test",
                "last_name": "Chef"
            }
        )
        print(f"Registration response: {register_response.json()}")
        assert register_response.status_code in [200, 201], f"Registration failed: {register_response.json()}"

        user = test_db.query(User).filter(User.email == "chef@test.com").first()
        assert user is not None, "User was not created in the database"

        # Login and obtain token
        login_response = client.post(
            "/login",
            json={"email": "chef@test.com", "password": "test123"}
        )
        print(f"Login response: {login_response.json()}")
        assert login_response.status_code == 200, f"Login failed: {login_response.json()}"
        token = login_response.json().get("token")
        if not token:
            print(f"No token received! Full response: {login_response.json()}")
        assert token, "No token received"
        headers = {"Authorization": f"Bearer {token}"}

        # Create a recipe
        recipe_data = {
            "name": "עוגת שוקולד",
            "preparation_steps": "1. ערבב. 2. אפה.",
            "cooking_time": 45,
            "servings": 8,
            "categories": "Dessert",
            "tags": "Sweet",
            "creator_id": str(user.id),
            "ingredients": json.dumps([
                {"name": "שוקולד", "quantity": 100, "unit": "גרם"},
                {"name": "קמח", "quantity": 200, "unit": "גרם"}
            ]),
            "timers": json.dumps([
                {"step_number": 1, "duration": 10, "label": "ערבוב"},
                {"step_number": 2, "duration": 20, "label": "אפייה"}
            ])
        }

        create_response = client.post(
            "/recipes/",
            data=recipe_data,
            headers=headers,
            files={}
        )
        assert create_response.status_code == 200, f"Recipe creation failed: {create_response.json()}"
        recipe_id = create_response.json().get("recipe_id")
        assert recipe_id, "No recipe ID received"

        # Retrieve the created recipe
        get_response = client.get(f"/recipes/{recipe_id}")
        assert get_response.status_code == 200, f"Failed to fetch recipe: {get_response.json()}"
        assert get_response.json()["name"] == "עוגת שוקולד"

        # Update the recipe
        update_data = {
            "name": "עוגת שוקולד מיוחדת",
            "preparation_steps": "1. לערבב 2. לאפות",
            "cooking_time": 50,
            "servings": 8,
            "categories": "Dessert",
            "tags": "Sweet",
            "ingredients": json.dumps([
                {"name": "שוקולד", "quantity": 100, "unit": "גרם"},
                {"name": "קמח", "quantity": 200, "unit": "גרם"}
            ]),
            "current_user_id": str(user.id)
        }
        update_response = client.put(
            f"/recipes/{recipe_id}",
            data=update_data,
            headers=headers,
            files={}
        )
        assert update_response.status_code == 200, f"Recipe update failed: {update_response.json()}"

        # Add a comment to the recipe
        comment_data = {
            "user_id": user.id,
            "username": user.username,
            "content": "מתכון מעולה!"
        }
        comment_response = client.post(
            f"/recipes/{recipe_id}/comment",
            json=comment_data,
            headers=headers
        )
        assert comment_response.status_code == 200, f"Failed to add comment: {comment_response.json()}"

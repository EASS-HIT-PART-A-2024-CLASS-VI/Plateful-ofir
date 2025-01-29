# tests/test_models.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, class_mapper
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from models.base import Base
from models.user_model import User
from models.recipe_model import Recipe, ShoppingList
import json


# Use SQLite for testing
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="module")
def test_db():
    engine = create_engine(TEST_SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

    Base.metadata.drop_all(bind=engine)  # מחיקת כל הטבלאות לפני יצירה מחדש
    Base.metadata.create_all(bind=engine)  # יצירה מחדש של כל הטבלאות

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)  # מחיקת כל הנתונים אחרי הבדיקה


print("\n📌 מודלים רשומים ב-SQLAlchemy:")
for mapper in Base.registry.mappers:
    print(mapper.class_)

def test_user_model(test_db):
    user = User(
        username="testuser",
        email="test@example.com",
        dietary_preferences=["vegetarian"]
    )
    test_db.add(user)
    test_db.commit()

    assert user.id is not None
    assert user.username == "testuser"
    assert user.dietary_preferences == ["vegetarian"]

def test_recipe_model(test_db):
    recipe = Recipe(
        name="Test Recipe",
        preparation_steps="Test steps",
        cooking_time=30,
        servings=4,
        categories="Dinner",  
        tags="Easy",  
        rating=4.5,
        creator_id=1
    )

    test_db.add(recipe)
    test_db.commit()
    
    assert recipe.id is not None
    assert recipe.name == "Test Recipe"
    assert recipe.preparation_steps == "Test steps"
    assert recipe.cooking_time == 30
    assert recipe.servings == 4
    assert "Dinner" in recipe.categories
    assert "Easy" in recipe.tags
    assert recipe.rating == 4.5
    assert recipe.creator_id == 1

def test_shopping_list_model(test_db):
    user = User(username="testuser1",email="tes1@example.com")
    test_db.add(user)
    test_db.commit()    
    
    shopping_list = ShoppingList(
        user_id=user.id,
        items=[{"name": "Test Item", "quantity": 2, "unit": "pcs"}],
        created_at=datetime.now().isoformat()
    )
    test_db.add(shopping_list)
    test_db.commit()
    
    assert shopping_list.id is not None
    assert shopping_list.user_id == user.id
    assert len(shopping_list.items) == 1
    assert shopping_list.items[0]["name"] == "Test Item"



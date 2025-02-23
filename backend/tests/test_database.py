import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.base import Base
from models.recipe_model import Recipe, Ingredient, NutritionalInfo
from models.user_model import User
from models.notification_model import Notification
from datetime import datetime

class TestDatabase:
    @pytest.fixture(scope="function")
    def db_engine(self):
        engine = create_engine('sqlite:///:memory:')
        Base.metadata.create_all(engine)
        yield engine
        Base.metadata.drop_all(engine)

    @pytest.fixture(scope="function")
    def db_session(self, db_engine):
        Session = sessionmaker(bind=db_engine)
        session = Session()
        yield session
        session.close()

    def test_create_user(self, db_session):
        user = User(
            username="test_user",
            first_name="Test",
            last_name="User",
            email="test@example.com",
            password_hash="hashed_password"
        )
        db_session.add(user)
        db_session.commit()

        saved_user = db_session.query(User).filter_by(username="test_user").first()
        assert saved_user is not None
        assert saved_user.email == "test@example.com"

    def test_create_recipe_with_relationships(self, db_session):
        # Create user first
        user = User(
            username="chef",
            first_name="Master",
            last_name="Chef",
            email="chef@example.com",
            password_hash="hashed_password"
        )
        db_session.add(user)
        db_session.commit()

        # Create recipe with relationships
        recipe = Recipe(
            name="עוגת שוקולד",
            preparation_steps="1. ערבב 2. אפה",
            cooking_time=45,
            servings=8,
            categories="אפייה",
            creator_id=user.id
        )
        
        ingredient = Ingredient(
            name="קמח",
            quantity=2.0,
            unit="cups",
            recipe=recipe
        )
        
        nutrition = NutritionalInfo(
            calories=350.0,
            protein=8.0,
            carbs=45.0,
            fats=12.0,
            recipe=recipe
        )

        db_session.add(recipe)
        db_session.commit()

        # Verify relationships
        saved_recipe = db_session.query(Recipe).first()
        assert saved_recipe.ingredients[0].name == "קמח"
        assert saved_recipe.nutritional_info.calories == 350.0
        assert saved_recipe.creator.username == "chef"

    def test_cascade_delete(self, db_session):
        # Create recipe with relationships
        recipe = Recipe(
            name="עוגת גבינה",
            preparation_steps="1. ערבב 2. אפה",
            cooking_time=60,
            servings=8
        )
        
        ingredient = Ingredient(
            name="גבינה",
            quantity=500.0,
            unit="גרם",
            recipe=recipe
        )

        db_session.add(recipe)
        db_session.commit()

        # Delete recipe and verify cascade
        db_session.delete(recipe)
        db_session.commit()

        assert db_session.query(Ingredient).count() == 0

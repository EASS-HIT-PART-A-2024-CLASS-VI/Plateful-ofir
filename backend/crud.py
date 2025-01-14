from sqlalchemy.orm import Session
from services.recipe_service import create_recipe, filter_recipes
from services.user_service import create_user, get_user_recipes

# Create a new recipe and save it to the database.
def create_recipe(db: Session, recipe_data):
    return create_recipe(db, recipe_data)  # Call the recipe service

# Create a new user and save it to the database.
def create_user(db: Session, user_data):
    return create_user(db, user_data)  # Call the user service

# Retrieve a list of recipes from the database with pagination.
def get_recipes(db: Session, skip: int = 0, limit: int = 10):
    return filter_recipes(db, skip=skip, limit=limit)  # Call the recipe service

# Retrieve a user by their username.
def get_user_by_username(db: Session, username: str):
    return get_user_recipes(db, username)  # Call the user service

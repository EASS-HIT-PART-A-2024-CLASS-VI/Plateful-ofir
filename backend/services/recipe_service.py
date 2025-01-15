from sqlalchemy.orm import Session
from models.recipe_model import Recipe, NutritionalInfo, Ingredient
from models.user_model import UserProfile
from typing import List, Optional
import redis

# Connect to Redis for timers
redis_client = redis.Redis(host='redis', port=6379, db=0)

# Function to calculate nutritional info
def calculate_nutritional_info(ingredients: List[Ingredient]) -> NutritionalInfo:
    total_calories = 0
    total_protein = 0
    total_fat = 0
    total_carbs = 0
    for ingredient in ingredients:
        total_calories += ingredient.calories
        total_protein += ingredient.protein
        total_fat += ingredient.fat
        total_carbs += ingredient.carbs
    return NutritionalInfo(calories=total_calories, protein=total_protein, fat=total_fat, carbs=total_carbs)

# Function to create a new recipe
def create_recipe(db, recipe_data):
    # Extract ingredients from recipe_data
    ingredients_data = recipe_data.pop("ingredients")

    # Convert ingredient data to SQLAlchemy Ingredient objects
    ingredients = [Ingredient(**ingredient) for ingredient in ingredients_data]

    # Create Recipe object
    recipe = Recipe(**recipe_data)
    recipe.ingredients = ingredients  # Add ingredients to the recipe

    # Add and commit to the database
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return recipe

# Function to get recipes by category or tag
def filter_recipes(db: Session, category: Optional[str] = None, tag: Optional[str] = None) -> List[Recipe]:
    query = db.query(Recipe)
    if category:
        query = query.filter(Recipe.categories == category)
    if tag:
        query = query.filter(Recipe.tags.like(f"%{tag}%"))
    return query.all()

# Function to create a user profile
def create_user(db: Session, user_data):
    user = UserProfile(**user_data.dict())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# Function to handle timers
def start_timer(timer_id: str, duration: int):
    redis_client.set(timer_id, duration)
    redis_client.expire(timer_id, duration)

def get_timer(timer_id: str):
    time_left = redis_client.get(timer_id)
    if time_left:
        return {"time_left": time_left.decode("utf-8")}
    return {"message": "Timer not found"}

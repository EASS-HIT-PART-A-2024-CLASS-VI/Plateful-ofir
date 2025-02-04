from sqlalchemy.orm import Session
from models.recipe_model import Recipe, NutritionalInfo, Ingredient
from models.user_model import UserProfile
from typing import List, Optional
import redis

# Connect to Redis for timers
redis_client = redis.Redis(host='redis', port=6379, db=0)

# Function to create a new recipe
def create_recipe(db: Session, recipe_data: dict):
    """Creates a new recipe and saves it to the database, including its ingredients."""
    
    # Extract ingredients from recipe_data
    ingredients_data = recipe_data.pop("ingredients", [])

    # Create Recipe object
    recipe = Recipe(**recipe_data)
    db.add(recipe)
    db.commit()
    db.refresh(recipe)

    for ingredient in ingredients_data:
        new_ingredient = Ingredient(
            name=ingredient["name"],
            quantity=ingredient["quantity"],
            unit=ingredient["unit"],
            recipe_id=recipe.id
        )
        db.add(new_ingredient)

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

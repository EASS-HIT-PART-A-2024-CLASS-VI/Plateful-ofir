from services.ai_service import calculate_nutritional_info
from sqlalchemy.orm import Session
from models.recipe_model import CookingTimer, Recipe, NutritionalInfo, Ingredient
from models.user_model import UserProfile
from typing import List, Optional
import redis

# Connect to Redis for timers
redis_client = redis.Redis(host='redis', port=6379, db=0)

def create_recipe(db: Session, recipe_data: dict):
    """Create a new recipe, including its ingredients and nutrition."""
    ingredients_data = recipe_data.pop("ingredients", [])
    timers_data = recipe_data.pop("timers", [])

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
    
    for timer in timers_data:
        new_timer = CookingTimer(
            recipe_id=recipe.id,
            step_number=timer["step_number"],
            duration=timer["duration"],
            label=timer.get("label", f"Step {timer['step_number']}")
        )
        db.add(new_timer)

    db.commit()
    db.refresh(recipe)  

    print(f"Calling calculate_nutritional_info() for recipe {recipe.id}")
    nutrition_data = calculate_nutritional_info(ingredients_data, recipe.servings)
    print(f"Nutrition calculated: {nutrition_data}")

    if nutrition_data:
        new_nutritional_info = NutritionalInfo(
            recipe_id=recipe.id,
            calories=nutrition_data["calories"],
            protein=nutrition_data["protein"],
            carbs=nutrition_data["carbs"],
            fats=nutrition_data["fats"],
        )

    print(f"Nutrition data received from API: {nutrition_data}")

    if not nutrition_data:
        print("Nutrition data is empty! Skipping database insertion.")
        db.add(new_nutritional_info)
        db.commit()
        db.refresh(new_nutritional_info)

    return recipe

def filter_recipes(db: Session, category: Optional[str] = None, tag: Optional[str] = None) -> List[Recipe]:
    query = db.query(Recipe)
    if category:
        query = query.filter(Recipe.categories == category)
    if tag:
        query = query.filter(Recipe.tags.like(f"%{tag}%"))
    return query.all()

def create_user(db: Session, user_data):
    user = UserProfile(**user_data.dict())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def start_timer(timer_id: str, duration: int):
    redis_client.set(timer_id, duration)
    redis_client.expire(timer_id, duration)

def get_timer(timer_id: str):
    time_left = redis_client.get(timer_id)
    if time_left:
        return {"time_left": time_left.decode("utf-8")}
    return {"message": "Timer not found"}

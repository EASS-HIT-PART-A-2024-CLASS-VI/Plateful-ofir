from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime
import json
from db.database import get_db, init_db
from models.recipe_model import (
    Recipe, Ingredient, NutritionalInfo, User, 
    ShoppingList, CookingTimer
)
from pydantic import BaseModel, EmailStr

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to Plateful API"}

# Initialize database
init_db()

# Pydantic models
class NutritionalValues(BaseModel):
    calories: int
    protein: int
    carbs: int
    fats: int

class IngredientCreate(BaseModel):
    name: str
    quantity: float
    unit: str
    nutritional_values: NutritionalValues

class TimerCreate(BaseModel):
    step_number: int
    duration: int
    label: str

class RecipeCreate(BaseModel):
    name: str
    preparation_steps: str
    cooking_time: int
    servings: int
    categories: str
    tags: Optional[str] = None
    ingredients: List[IngredientCreate]
    timers: List[TimerCreate]

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    dietary_preferences: List[str]

# Recipe endpoints
@app.post("/recipes/")
async def create_recipe(
    recipe: RecipeCreate,
    current_user_id: int = 1,  # TODO: Replace with actual auth
    db: Session = Depends(get_db)
):
    try:
        # הוסף לוגים נוספים כאן
        print(f"Received recipe: {recipe}")

        # Create recipe
        db_recipe = Recipe(
            name=recipe.name,
            preparation_steps=recipe.preparation_steps,
            cooking_time=recipe.cooking_time,
            servings=recipe.servings,
            categories=recipe.categories,
            tags=recipe.tags,
            creator_id=current_user_id
        )
        
        # Add ingredients
        total_calories = 0
        total_protein = 0
        total_carbs = 0
        total_fats = 0
        
        for ing in recipe.ingredients:
            # בדיקת ערכים תזונתיים
            required_keys = ["calories", "protein", "carbs", "fats"]
            missing_keys = [key for key in required_keys if key not in ing.nutritional_values]
            if missing_keys:
                raise HTTPException(
                    status_code=400,
                    detail=f"מרכיב '{ing.name}' חסר את המפתחות: {', '.join(missing_keys)}"
                )

            # בדיקת כמות
            if ing.quantity <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"מרכיב '{ing.name}' חייב להיות עם כמות חיובית, אך התקבלה כמות: {ing.quantity}."
                )

            # יצירת אובייקט Ingredient
            db_ingredient = Ingredient(
                name=ing.name,
                quantity=ing.quantity,
                unit=ing.unit,
                nutritional_values=ing.nutritional_values,
                recipe=db_recipe
            )

            # חישוב ערכים תזונתיים
            serving_factor = ing.quantity / 100  # הערכים התזונתיים הם לפי 100 גרם/מיליליטר
            total_calories += ing.nutritional_values["calories"] * serving_factor
            total_protein += ing.nutritional_values["protein"] * serving_factor
            total_carbs += ing.nutritional_values["carbs"] * serving_factor
            total_fats += ing.nutritional_values["fats"] * serving_factor

        
        # Create nutritional info
        db_recipe.nutritional_info = NutritionalInfo(
            calories=total_calories,
            protein=total_protein,
            carbs=total_carbs,
            fats=total_fats,
            serving_size=1  # Per serving
        )
        
        # Add timers
        for timer in recipe.timers:
            db_timer = CookingTimer(
                step_number=timer.step_number,
                duration=timer.duration,
                label=timer.label,
                recipe=db_recipe
            )
        
        db.add(db_recipe)
        db.commit()
        return {"message": "Recipe created successfully", "recipe_id": db_recipe.id}
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/recipes/")
async def get_recipes(
    category: Optional[str] = None,
    tag: Optional[str] = None,
    sort_by: str = "rating",
    db: Session = Depends(get_db)
):
    query = db.query(Recipe)
    
    if category:
        query = query.filter(Recipe.categories.contains(category))
    if tag:
        query = query.filter(Recipe.tags.contains(tag))
    
    if sort_by == "rating":
        query = query.order_by(Recipe.rating.desc())
    
    return query.all()

@app.get("/recipes/{recipe_id}/scale")
async def scale_recipe(
    recipe_id: int,
    servings: int,
    db: Session = Depends(get_db)
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    scale_factor = servings / recipe.servings
    scaled_ingredients = []
    
    for ing in recipe.ingredients:
        scaled_ingredients.append({
            "name": ing.name,
            "quantity": round(ing.quantity * scale_factor, 2),
            "unit": ing.unit
        })
    
    return {"scaled_ingredients": scaled_ingredients}

# User endpoints
@app.post("/users/")
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(
        username=user.username,
        email=user.email,
        dietary_preferences=user.dietary_preferences
    )
    db.add(db_user)
    db.commit()
    return {"message": "User created successfully", "user_id": db_user.id}

@app.post("/recipes/{recipe_id}/share/{user_id}")
async def share_recipe(
    recipe_id: int,
    user_id: int,
    current_user_id: int = 1,  # TODO: Replace with actual auth
    db: Session = Depends(get_db)
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    
    if not recipe or not user:
        raise HTTPException(status_code=404, detail="Recipe or user not found")
    
    recipe.shared_with.append(user)
    db.commit()
    return {"message": "Recipe shared successfully"}

@app.post("/shopping-list/")
async def create_shopping_list(
    recipe_id: int,
    servings: int = 1,
    current_user_id: int = 1,  # TODO: Replace with actual auth
    db: Session = Depends(get_db)
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    scale_factor = servings / recipe.servings
    items = []
    
    for ing in recipe.ingredients:
        items.append({
            "name": ing.name,
            "quantity": round(ing.quantity * scale_factor, 2),
            "unit": ing.unit
        })
    
    shopping_list = ShoppingList(
        user_id=current_user_id,
        recipe_id=recipe_id,
        items=items,
        created_at=datetime.now().isoformat()
    )
    
    db.add(shopping_list)
    db.commit()
    return {"message": "Shopping list created", "list_id": shopping_list.id}

@app.post("/recipes/{recipe_id}/timer")
async def start_timer(recipe_id: int, step_number: int, db: Session = Depends(get_db)):
    timer = db.query(CookingTimer).filter(
        CookingTimer.recipe_id == recipe_id,
        CookingTimer.step_number == step_number
    ).first()
    
    if not timer:
        raise HTTPException(status_code=404, detail="Timer not found")
    
    # Here you would integrate with your timer service
    # For now, we'll just return the duration
    return {"duration": timer.duration, "label": timer.label}

@app.post("/recipes/{recipe_id}/rate")
async def rate_recipe(
    recipe_id: int,
    rating: float,
    db: Session = Depends(get_db)
):
    if not 0 <= rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 0 and 5")
    
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    recipe.rating = rating
    db.commit()
    return {"message": "Rating updated successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
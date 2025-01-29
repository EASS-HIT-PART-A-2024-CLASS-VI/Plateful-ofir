from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime
import json
from models.recipe_model import (
    Recipe, Ingredient, NutritionalInfo, 
    ShoppingList, CookingTimer
)
from models.user_model import User
from pydantic import BaseModel, EmailStr, Field, field_validator
from services.ai_service import setup_ai_routes
from db.database import engine, get_db, init_db
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB on startup
    init_db()
    yield
    # Clean up resources on shutdown if needed
    pass

app = FastAPI(lifespan=lifespan)

@app.get("/")
def read_root():
    return {"message": "Welcome to Plateful API"}

# Pydantic models
class NutritionalValues(BaseModel):
    calories: int
    protein: int
    carbs: int
    fats: int

    @field_validator('calories', 'protein', 'carbs', 'fats', mode='before')
    def validate_nutritional_values(cls, v):
        if v < 0:
            raise ValueError('Nutritional values must be non-negative')
        return v

class IngredientCreate(BaseModel):
    name: str
    quantity: float
    unit: str
    nutritional_values: NutritionalValues

    @field_validator('quantity', mode='before')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        return v

    @field_validator('name', mode='before')
    def validate_name(cls, v):
        if not v:
            raise ValueError('Name must not be empty')
        return v

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

class SuggestRecipeRequest(BaseModel):
    ingredients: List[IngredientCreate]

@app.post("/suggest_recipe")
async def suggest_recipe(request: SuggestRecipeRequest):
    if not request.ingredients:
        raise HTTPException(status_code=400, detail="Ingredients list cannot be empty")
    # Your logic to suggest a recipe
    return {"message": "Recipe suggestion"}

class CookingQuestionRequest(BaseModel):
    question: str

@app.post("/general_cooking_questions")
async def general_cooking_questions(request: CookingQuestionRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    # Your logic to handle cooking questions
    return {"message": "Cooking question response"}

# Recipe endpoints
@app.post("/recipes/")
async def create_recipe(
    recipe: RecipeCreate,
    current_user_id: int = 1,
    db: Session = Depends(get_db)
):
    try:
        # Validate basic recipe data
        if recipe.cooking_time < 0:
            raise HTTPException(
                status_code=400,
                detail="Cooking time must be positive"
            )
        if recipe.servings <= 0:
            raise HTTPException(
                status_code=400,
                detail="Number of servings must be positive"
            )
            
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
        
        if not recipe.ingredients:
            raise HTTPException(
                status_code=400,
                detail="Recipe must have at least one ingredient"
            )
        
        for ing in recipe.ingredients:
            # Validate ingredient data
            if ing.quantity <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ingredient '{ing.name}' must have a positive quantity"
                )

            # Create ingredient object
            db_ingredient = Ingredient(
                name=ing.name,
                quantity=ing.quantity,
                unit=ing.unit,
                nutritional_values={
                    "calories": ing.nutritional_values.calories,
                    "protein": ing.nutritional_values.protein,
                    "carbs": ing.nutritional_values.carbs,
                    "fats": ing.nutritional_values.fats
                },
                recipe=db_recipe
            )
            
            # Calculate nutritional values
            serving_factor = ing.quantity / 100
            total_calories += ing.nutritional_values.calories * serving_factor
            total_protein += ing.nutritional_values.protein * serving_factor
            total_carbs += ing.nutritional_values.carbs * serving_factor
            total_fats += ing.nutritional_values.fats * serving_factor
            
            db.add(db_ingredient)
        
        # Create nutritional info
        nutritional_info = NutritionalInfo(
            calories=total_calories,
            protein=total_protein,
            carbs=total_carbs,
            fats=total_fats,
            serving_size=1,
            recipe=db_recipe
        )
        db.add(nutritional_info)
        
        # Add timers
        for timer in recipe.timers:
            if timer.duration <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Timer duration must be positive"
                )
                
            db_timer = CookingTimer(
                step_number=timer.step_number,
                duration=timer.duration,
                label=timer.label,
                recipe=db_recipe
            )
            db.add(db_timer)
        
        try:
            db.add(db_recipe)
            db.commit()
            db.refresh(db_recipe)
            return {"message": "Recipe created successfully", "recipe_id": db_recipe.id}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
            
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except ValueError as ve:
        # Handle validation errors
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        # Handle unexpected errors
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

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

@app.get("/recipes/{recipe_id}")
async def get_recipe(
    recipe_id: int,
    db: Session = Depends(get_db)
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
        
    # Convert recipe to dictionary with all relationships
    recipe_dict = {
        "id": recipe.id,
        "name": recipe.name,
        "preparation_steps": recipe.preparation_steps,
        "cooking_time": recipe.cooking_time,
        "servings": recipe.servings,
        "categories": recipe.categories,
        "tags": recipe.tags,
        "rating": recipe.rating,
        "creator_id": recipe.creator_id,
        "ingredients": [
            {
                "id": ing.id,
                "name": ing.name,
                "quantity": ing.quantity,
                "unit": ing.unit,
                "nutritional_values": ing.nutritional_values
            }
            for ing in recipe.ingredients
        ],
        "nutritional_info": {
            "calories": recipe.nutritional_info.calories,
            "protein": recipe.nutritional_info.protein,
            "carbs": recipe.nutritional_info.carbs,
            "fats": recipe.nutritional_info.fats,
            "serving_size": recipe.nutritional_info.serving_size
        } if recipe.nutritional_info else None,
        "timers": [
            {
                "step_number": timer.step_number,
                "duration": timer.duration,
                "label": timer.label
            }
            for timer in recipe.cooking_timers
        ]
    }
    
    return recipe_dict

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

@app.get("/shopping-list/{recipe_id}")
async def get_shopping_list(
    recipe_id: int,
    servings: int = 1,
    db: Session = Depends(get_db)
    ):

    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    scale_factor = servings / recipe.servings
    items = [
        {"name": ing.name, "quantity": round(ing.quantity * scale_factor, 2), "unit": ing.unit}
        for ing in recipe.ingredients
    ]
    
    return {"recipe_name": recipe.name, "shopping_list": items}

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


@app.put("/recipes/{recipe_id}")
async def update_recipe(
    recipe_id: int,
    recipe: RecipeCreate,
    current_user_id: int = Query(..., description="User ID updating the recipe"),
    db: Session = Depends(get_db)
):
    # Check if recipe exists
    db_recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Check if user owns the recipe
    if db_recipe.creator_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this recipe")
    
    try:
        # Update basic recipe information
        db_recipe.name = recipe.name
        db_recipe.preparation_steps = recipe.preparation_steps
        db_recipe.cooking_time = recipe.cooking_time
        db_recipe.servings = recipe.servings
        db_recipe.categories = recipe.categories
        db_recipe.tags = recipe.tags
        
        # Delete existing ingredients and timers
        db.query(Ingredient).filter(Ingredient.recipe_id == recipe_id).delete()
        db.query(CookingTimer).filter(CookingTimer.recipe_id == recipe_id).delete()
        
        # Add new ingredients
        total_calories = 0
        total_protein = 0
        total_carbs = 0
        total_fats = 0
        
        for ing in recipe.ingredients:
            if ing.quantity <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Ingredient '{ing.name}' must have a positive quantity"
                )

            db_ingredient = Ingredient(
                name=ing.name,
                quantity=ing.quantity,
                unit=ing.unit,
                nutritional_values={
                    "calories": ing.nutritional_values.calories,
                    "protein": ing.nutritional_values.protein,
                    "carbs": ing.nutritional_values.carbs,
                    "fats": ing.nutritional_values.fats
                },
                recipe=db_recipe
            )
            
            serving_factor = ing.quantity / 100
            total_calories += ing.nutritional_values.calories * serving_factor
            total_protein += ing.nutritional_values.protein * serving_factor
            total_carbs += ing.nutritional_values.carbs * serving_factor
            total_fats += ing.nutritional_values.fats * serving_factor
            
            db.add(db_ingredient)
        
        # Update nutritional info
        if db_recipe.nutritional_info:
            db_recipe.nutritional_info.calories = total_calories
            db_recipe.nutritional_info.protein = total_protein
            db_recipe.nutritional_info.carbs = total_carbs
            db_recipe.nutritional_info.fats = total_fats
        else:
            nutritional_info = NutritionalInfo(
                calories=total_calories,
                protein=total_protein,
                carbs=total_carbs,
                fats=total_fats,
                serving_size=1,
                recipe=db_recipe
            )
            db.add(nutritional_info)
        
        # Add new timers
        for timer in recipe.timers:
            if timer.duration <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Timer duration must be positive"
                )
                
            db_timer = CookingTimer(
                step_number=timer.step_number,
                duration=timer.duration,
                label=timer.label,
                recipe=db_recipe
            )
            db.add(db_timer)
        
        db.commit()
        return {"message": "Recipe updated successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

setup_ai_routes(app)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
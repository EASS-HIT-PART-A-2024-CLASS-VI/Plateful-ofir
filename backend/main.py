from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Query, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Union
from datetime import datetime
import json
import os
from passlib.context import CryptContext
from models.recipe_model import (
    Comment, Recipe, Ingredient, NutritionalInfo, SharedRecipe, 
    ShoppingList, CookingTimer
)
from models.user_model import User
from pydantic import BaseModel, EmailStr, Field, field_validator
from services.ai_service import setup_ai_routes
from db.database import engine, get_db, init_db
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from models.recipe_model import Comment
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") 

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB on startup
    init_db()
    yield
    # Clean up resources on shutdown if needed
    pass

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # זה ה-Frontend שלך
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class RecipeCreate(BaseModel):
    name: str
    preparation_steps: str
    cooking_time: int
    servings: int
    categories: str
    tags: str
    ingredients: List[IngredientCreate] = []
    timers: List[TimerCreate] = []

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class SuggestRecipeRequest(BaseModel):
    ingredients: List[IngredientCreate]

class RatingRequest(BaseModel):
    rating: float

class CommentRequest(BaseModel):
    user_id: int
    content: str

# Recipe endpoints
@app.post("/recipes/")
async def create_recipe(
    name: Optional[str] = Form(None),
    preparation_steps: Optional[str] = Form(None),
    cooking_time: Optional[int] = Form(None),
    servings: Optional[int] = Form(None),
    categories: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    creator_id:  Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    try:
        if not os.path.exists("static"):
            os.makedirs("static")  # 👈 יצירת תיקייה אם היא לא קיימת

        image_url = None
        if image:
            image_path = f"static/{image.filename}"
            with open(image_path, "wb") as buffer:
                buffer.write(await image.read())
            image_url = f"/{image_path}"

        new_recipe = Recipe(
            name=name,
            preparation_steps=preparation_steps,
            cooking_time=cooking_time,
            servings=servings,
            categories=categories,
            tags=tags,
            image_url=image_url, 
            creator_id=creator_id 
        )

        db.add(new_recipe)
        db.commit()
        db.refresh(new_recipe)

        return {
        "message": "Recipe created successfully",
        "recipe_id": new_recipe.id,
        "creator_id": new_recipe.creator_id
        }

    except Exception as e:
        db.rollback()
        print(f"❌ Error in create_recipe: {str(e)}")  
        raise HTTPException(status_code=500, detail=str(e))
    
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

@app.get("/users/{user_id}/recipes")
async def get_user_recipes(user_id: int, db: Session = Depends(get_db)):
    try:
        user_recipes = db.query(Recipe).filter(Recipe.creator_id == user_id).all()

        if not user_recipes:
            return []

        return user_recipes

    except Exception as e:
        print(f"❌ Error fetching user recipes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/users/{user_id}/notifications")
async def get_user_notifications(user_id: int, db: Session = Depends(get_db)):
    notifications = [
        {"message": "User 3 shared a recipe with you!", "link": "/recipes/5"},
        {"message": "New comment on your recipe!", "link": "/recipes/2"},
    ]
    return notifications

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
@app.post("/register/", include_in_schema=True)
async def register_user(user: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password) 

    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password  
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}


@app.post("/login/")
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not pwd_context.verify(user.password, db_user.password_hash):  
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {"message": "Login successful", "user_id": db_user.id}

@app.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "dietary_preferences": user.dietary_preferences
    }

@app.post("/recipes/{recipe_id}/share/{user_id}")
async def share_recipe(
    recipe_id: int,
    user_id: int,
    db: Session = Depends(get_db)
    ):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    
    if not recipe or not user:
        raise HTTPException(status_code=404, detail="Recipe or user not found")

    shared_recipe = SharedRecipe(recipe_id=recipe_id, user_id=user_id)
    db.add(shared_recipe)
    db.commit()
    
    return {"message": f"Recipe '{recipe.name}' shared successfully with user {user_id}"}

@app.get("/users/{user_id}/shared-recipes")
async def get_shared_recipes(user_id: int, db: Session = Depends(get_db)):
    shared_recipes = db.query(SharedRecipe).filter(SharedRecipe.user_id == user_id).all()
    
    return [
        {
            "id": shared.recipe.id,
            "name": shared.recipe.name,
            "categories": shared.recipe.categories,
            "rating": shared.recipe.rating
        }
        for shared in shared_recipes
    ]

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
    rating_data: RatingRequest,  # 👈 מקבלים את הבקשה כאובייקט Pydantic
    db: Session = Depends(get_db)
):
    rating = rating_data.rating  # 👈 שולפים את הדירוג מתוך הבקשה

    if not 0 <= rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 0 and 5")

    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # חישוב ממוצע הדירוגים
    total_rating = recipe.rating * recipe.rating_count
    recipe.rating_count += 1
    recipe.rating = (total_rating + rating) / recipe.rating_count

    db.commit()
    return {"message": "Rating updated successfully", "new_rating": recipe.rating, "total_ratings": recipe.rating_count}


@app.put("/recipes/{recipe_id}")
async def update_recipe(
    recipe_id: int,
    recipe: RecipeCreate,  # 👈 מצפה לכל הנתונים כולל `ingredients` ו-`timers`
    current_user_id: int = Query(..., description="User ID updating the recipe"),
    db: Session = Depends(get_db)
):
    # בדיקת קיום המתכון
    db_recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # בדיקת הרשאות משתמש
    if db_recipe.creator_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this recipe")
    
    try:
        # עדכון הנתונים הבסיסיים
        db_recipe.name = recipe.name
        db_recipe.preparation_steps = recipe.preparation_steps
        db_recipe.cooking_time = recipe.cooking_time
        db_recipe.servings = recipe.servings
        db_recipe.categories = recipe.categories
        db_recipe.tags = recipe.tags
        
        # מחיקת המרכיבים והטיימרים הקודמים
        db.query(Ingredient).filter(Ingredient.recipe_id == recipe_id).delete()
        db.query(CookingTimer).filter(CookingTimer.recipe_id == recipe_id).delete()
        
        # הוספת מרכיבים חדשים
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
        
        # עדכון המידע התזונתי
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
        
        # הוספת טיימרים חדשים
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

@app.post("/recipes/{recipe_id}/comment")
async def add_comment(
    recipe_id: int,
    comment_data: CommentRequest,
    db: Session = Depends(get_db)
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    comment = Comment(
        recipe_id=recipe_id,
        user_id=comment_data.user_id,
        content=comment_data.content,
        timestamp=datetime.utcnow().isoformat()
    )

    db.add(comment)
    db.commit()
    return {"message": "Comment added successfully", "comment": comment.content}

@app.get("/recipes/{recipe_id}/comments")
async def get_comments(recipe_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.recipe_id == recipe_id).all()
    return [
        {
            "id": comment.id,
            "user_id": comment.user_id,
            "content": comment.content,
            "timestamp": comment.timestamp
        }
        for comment in comments
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
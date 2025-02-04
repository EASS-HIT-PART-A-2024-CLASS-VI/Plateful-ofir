from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Query, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Union
from datetime import datetime
import json
import shutil
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
from fastapi.staticfiles import StaticFiles
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
    allow_origins=["*"],  # זה ה-Frontend שלך
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# Pydantic models
class NutritionalValues(BaseModel):
    portion_size: int
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
STATIC_DIR = "static"
os.makedirs(STATIC_DIR, exist_ok=True)  # ודא שהתיקייה קיימת

from services.ai_service import calculate_nutritional_info

@app.post("/recipes/")
async def create_recipe(
    name: str = Form(...),
    preparation_steps: str = Form(...),
    cooking_time: int = Form(...),
    servings: int = Form(...),
    categories: str = Form(...),
    tags: str = Form(...),
    creator_id: str = Form(...),
    ingredients: str = Form(...),  
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        creator_id = int(creator_id)
        servings = int(servings)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid creator_id or servings")

    ingredients_list = json.loads(ingredients)

    try:
        print(f"🔄 Calculating nutritional info for ingredients: {ingredients_list}")
        nutrition_values = calculate_nutritional_info(ingredients_list, servings)
        print(f"✅ Computed Nutritional Info: {nutrition_values}")

        new_recipe = Recipe(
            name=name,
            preparation_steps=preparation_steps,
            cooking_time=int(cooking_time),
            servings=servings,
            categories=categories,
            tags=tags,
            creator_id=creator_id
        )

        db.add(new_recipe)
        db.commit()
        db.refresh(new_recipe)

        # ✅ שמירת מצרכים
        for ingredient in ingredients_list:
            new_ingredient = Ingredient(
                name=ingredient["name"],
                quantity=float(ingredient["quantity"]),
                unit=ingredient["unit"],
                recipe_id=new_recipe.id
            )
            db.add(new_ingredient)

        # ✅ שמירת הנתונים התזונתיים כולל portion_size
        nutritional_info = NutritionalInfo(
            recipe_id=new_recipe.id,
            portion_size=float(nutrition_values["portion_size"]),
            calories=float(nutrition_values["calories"]),
            protein=float(nutrition_values["protein"]),
            carbs=float(nutrition_values["carbs"]),
            fats=float(nutrition_values["fats"]),
        )
        db.add(nutritional_info)
        db.commit()

        print(f"✅ Successfully saved nutritional info to DB for recipe {new_recipe.id}")

        return {"message": "Recipe created successfully", "recipe_id": new_recipe.id}

    except Exception as e:
        db.rollback()  
        print(f"❌ Error creating recipe: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating recipe: {str(e)}")

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

    recipes = query.all()

    return [
        {
            "id": r.id,
            "name": r.name,
            "ingredients": [
                {
                    "id": ing.id,
                    "name": ing.name,
                    "quantity": ing.quantity,
                    "unit": ing.unit
                }
                for ing in r.ingredients
            ] if r.ingredients else [],
            "preparation_steps": r.preparation_steps,
            "cooking_time": r.cooking_time,
            "categories": r.categories,
            "rating": r.rating,
            "creator_id": r.creator_id,
            "image_url": r.image_url,
            "nutritional_info": {
                "portion_size": r.nutritional_info.portion_size if r.nutritional_info else 0,
                "calories": r.nutritional_info.calories if r.nutritional_info else 0,
                "protein": r.nutritional_info.protein if r.nutritional_info else 0,
                "carbs": r.nutritional_info.carbs if r.nutritional_info else 0,
                "fats": r.nutritional_info.fats if r.nutritional_info else 0,
            } if r.nutritional_info else None  
        }
        for r in recipes
    ]


@app.get("/recipes/{recipe_id}")
async def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # ✅ שליפת הנתונים התזונתיים
    nutritional_info = db.query(NutritionalInfo).filter(NutritionalInfo.recipe_id == recipe_id).first()
    nutrition_data = {
        "calories": nutritional_info.calories if nutritional_info else 0,
        "protein": nutritional_info.protein if nutritional_info else 0,
        "carbs": nutritional_info.carbs if nutritional_info else 0,
        "fats": nutritional_info.fats if nutritional_info else 0,
        "portion_size": nutritional_info.portion_size if nutritional_info else 100,
    }
    
    print(f"📊 Nutritional info retrieved for recipe {recipe_id}: {nutrition_data}")

    return {
        "id": recipe.id,
        "name": recipe.name,
        "preparation_steps": recipe.preparation_steps if recipe.preparation_steps else "",
        "cooking_time": recipe.cooking_time,
        "servings": recipe.servings,
        "categories": recipe.categories,
        "tags": recipe.tags,
        "image_url": recipe.image_url if recipe.image_url else "/static/default-recipe.jpg",
        "ingredients": [
            {
                "id": ing.id,
                "name": ing.name,
                "quantity": ing.quantity,
                "unit": ing.unit
            }
            for ing in db.query(Ingredient).filter(Ingredient.recipe_id == recipe_id).all()
        ],
        "nutritional_info": nutrition_data  
    }

@app.put("/recipes/{recipe_id}")
async def update_recipe(
    recipe_id: int,
    name: str = Form(...),
    ingredients: str = Form(...),
    preparation_steps: str = Form(...),
    cooking_time: int = Form(...),
    servings: int = Form(...),
    categories: str = Form(...),
    tags: str = Form(...),
    current_user_id: int = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """ Update a recipe, including its ingredients and nutritional values """

    db_recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    if db_recipe.creator_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this recipe")

    # ✅ עדכון נתוני המתכון
    db_recipe.name = name
    db_recipe.preparation_steps = preparation_steps
    db_recipe.cooking_time = cooking_time
    db_recipe.servings = servings
    db_recipe.categories = categories
    db_recipe.tags = tags

    new_ingredients = json.loads(ingredients)

    # ✅ מחיקת מרכיבים ישנים והוספת חדשים
    db.query(Ingredient).filter(Ingredient.recipe_id == recipe_id).delete()
    db.commit()

    for ingredient in new_ingredients:
        new_ingredient = Ingredient(
            name=ingredient["name"],
            quantity=ingredient["quantity"],
            unit=ingredient["unit"],
            recipe_id=recipe_id
        )
        db.add(new_ingredient)

    db.commit()

    # 🔄 **חישוב מחדש של הנתונים התזונתיים**
    nutrition_values = calculate_nutritional_info(new_ingredients, servings)
    
    # ✅ עדכון או יצירה מחדש של הנתונים התזונתיים
    nutritional_info = db.query(NutritionalInfo).filter(NutritionalInfo.recipe_id == recipe_id).first()
    if nutritional_info:
        nutritional_info.portion_size = nutrition_values["portion_size"]
        nutritional_info.calories = nutrition_values["calories"]
        nutritional_info.protein = nutrition_values["protein"]
        nutritional_info.carbs = nutrition_values["carbs"]
        nutritional_info.fats = nutrition_values["fats"]
    else:
        db.add(NutritionalInfo(
            recipe_id=recipe_id,
            portion_size=nutrition_values["portion_size"],
            calories=nutrition_values["calories"],
            protein=nutrition_values["protein"],
            carbs=nutrition_values["carbs"],
            fats=nutrition_values["fats"]
        ))

    db.commit()

    print(f"✅ Updated Nutritional Info for Recipe {recipe_id}: {nutrition_values}")

    return {"message": "Recipe updated successfully"}


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

@app.get("/users/")
async def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    if not users:
        raise HTTPException(status_code=404, detail="No users found")
    
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
        for user in users
    ]

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

@app.get("/users/{user_id}/recipes")
async def get_user_recipes(user_id: int, db: Session = Depends(get_db)):
    try:
        user_recipes = db.query(Recipe).filter(Recipe.creator_id == user_id).all()
        if not user_recipes:
            return []
        return user_recipes
    except Exception as e:
        print(f"Error fetching user recipes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/users/{user_id}/notifications")
async def get_user_notifications(user_id: int, db: Session = Depends(get_db)):
    notifications = [
        {"message": "User 3 shared a recipe with you!", "link": "/recipes/5"},
        {"message": "New comment on your recipe!", "link": "/recipes/2"},
    ]
    return notifications

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
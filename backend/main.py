from urllib.request import Request
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Query, Form, Security
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Union
from datetime import datetime, timedelta
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials,OAuth2PasswordBearer

from models.security import verify_password, create_access_token
import jwt
import json
import shutil
import os
from passlib.context import CryptContext
from models.recipe_model import (
    Comment, Recipe, Ingredient, NutritionalInfo, SharedRecipe, 
    ShoppingList,Rating, CookingTimer
)
from models.user_model import User
from pydantic import BaseModel, EmailStr, Field, field_validator
from services.ai_service import setup_ai_routes
from db.database import engine, get_db, init_db
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from models.recipe_model import Comment
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from services.ai_service import calculate_nutritional_info

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
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],  
)

app.mount("/static", StaticFiles(directory="static"), name="static")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"

def create_access_token(user_id: int):
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

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
    user_id: int
    score: int

class CommentRequest(BaseModel):
    user_id: int
    content: str

# Recipe endpoints
STATIC_DIR = "static"
os.makedirs(STATIC_DIR, exist_ok=True)  # ודא שהתיקייה קיימת


@app.get("/")
async def root():
    return {"message": "✅ Backend is running!"}

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

    # ✅ שמירת תמונה עם נתיב ברירת מחדל
    image_url = "/static/default-recipe.jpg"
    if image:
        image_filename = f"{name.replace(' ', '_')}_{os.urandom(8).hex()}.{image.filename.split('.')[-1]}"
        image_path = os.path.join("static", image_filename)
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_url = f"/static/{image_filename}"

    # ✅ יצירת המתכון ושמירתו ב-DB
    new_recipe = Recipe(
        name=name,
        preparation_steps=preparation_steps,
        cooking_time=cooking_time,
        servings=servings,
        categories=categories,
        tags=tags,
        creator_id=creator_id,
        image_url=image_url
    )
    db.add(new_recipe)
    db.commit()
    db.refresh(new_recipe)

    # ✅ שמירת מרכיבים
    for ingredient in ingredients_list:
        new_ingredient = Ingredient(
            name=ingredient["name"],
            quantity=float(ingredient["quantity"]),
            unit=ingredient["unit"],
            recipe_id=new_recipe.id
        )
        db.add(new_ingredient)

    db.commit()

        # ✅ **חישוב ערכים תזונתיים ושמירתם במסד הנתונים**
    print(f"📢 Calling calculate_nutritional_info with ingredients: {ingredients_list}")
    nutrition_data = calculate_nutritional_info(ingredients_list, servings)
    print(f"📢 Nutrition data received: {nutrition_data}")


    if nutrition_data:
        new_nutritional_info = NutritionalInfo(
            recipe_id=new_recipe.id,
            calories=nutrition_data["calories"],
            protein=nutrition_data["protein"],
            carbs=nutrition_data["carbs"],
            fats=nutrition_data["fats"],
            portion_size=nutrition_data["portion_size"]
        )
        db.add(new_nutritional_info)
        db.commit()
        db.refresh(new_nutritional_info)

    return {
        "message": "Recipe created successfully",
        "recipe_id": new_recipe.id,
        "image_url": new_recipe.image_url
    }


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

    # ✅ וידוא שדירוג לא יחזיר None
    rating = recipe.rating if recipe.rating is not None else 0.0
    image_url = recipe.image_url if recipe.image_url else "/static/default-recipe.jpg"
    timers = db.query(CookingTimer).filter(CookingTimer.recipe_id == recipe_id).all()


    # ✅ שליפת הנתונים התזונתיים
    nutritional_info = db.query(NutritionalInfo).filter(NutritionalInfo.recipe_id == recipe_id).first()
    nutrition_data = {
        "calories": nutritional_info.calories if nutritional_info else 0,
        "protein": nutritional_info.protein if nutritional_info else 0,
        "carbs": nutritional_info.carbs if nutritional_info else 0,
        "fats": nutritional_info.fats if nutritional_info else 0,
        "portion_size": nutritional_info.portion_size if nutritional_info else 100,
    }

    return {
        "id": recipe.id,
        "name": recipe.name,
        "preparation_steps": recipe.preparation_steps if recipe.preparation_steps else "",
        "cooking_time": recipe.cooking_time,
        "servings": recipe.servings,
        "categories": recipe.categories,
        "tags": recipe.tags,
        "image_url": image_url,        
        "rating": rating,  # ✅ החזרת דירוג תקף
        "ingredients": [
            {
                "id": ing.id,
                "name": ing.name,
                "quantity": ing.quantity,
                "unit": ing.unit
            }
            for ing in db.query(Ingredient).filter(Ingredient.recipe_id == recipe_id).all()
        ],
        "nutritional_info": nutrition_data,  
        "timers": [
            {"step_number": timer.step_number, "duration": timer.duration, "label": timer.label}
            for timer in timers
        ] if timers else []

    }

@app.put("/recipes/{recipe_id}")
async def update_recipe(
    recipe_id: int,
    name: str = Form(...),
    preparation_steps: str = Form(...),
    cooking_time: int = Form(...),
    servings: int = Form(...),
    categories: str = Form(...),
    tags: str = Form(...),
    ingredients: str = Form(...),
    current_user_id: str = Form(...),
    image: Optional[UploadFile] = File(None),  # ✅ קבלת תמונה אם נשלחה
    db: Session = Depends(get_db)
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    if str(recipe.creator_id) != current_user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to edit this recipe")

    # ✅ אם הועלתה תמונה חדשה, שמירתה ועדכון `image_url`
    if image:
        image_filename = f"{recipe_id}_{os.urandom(8).hex()}.{image.filename.split('.')[-1]}"
        image_path = os.path.join("static", image_filename)

        # ✅ שמירת התמונה החדשה
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        # ❌ מחיקת התמונה הישנה אם היא לא תמונת ברירת מחדל
        if recipe.image_url and recipe.image_url != "/static/default-recipe.jpg":
            old_image_path = recipe.image_url.replace("/static/", "static/")
            if os.path.exists(old_image_path):
                os.remove(old_image_path)

        # ✅ עדכון URL של התמונה
        recipe.image_url = f"/static/{image_filename}"

    # ✅ עדכון נתוני המתכון
    recipe.name = name
    recipe.preparation_steps = preparation_steps
    recipe.cooking_time = cooking_time
    recipe.servings = servings
    recipe.categories = categories
    recipe.tags = tags

    # ✅ עדכון מרכיבים
    db.query(Ingredient).filter(Ingredient.recipe_id == recipe.id).delete()
    ingredients_list = json.loads(ingredients)
    for ingredient in ingredients_list:
        new_ingredient = Ingredient(
            name=ingredient["name"],
            quantity=float(ingredient["quantity"]),
            unit=ingredient["unit"],
            recipe_id=recipe.id
        )
        db.add(new_ingredient)

    db.commit()

    return {
        "message": "Recipe updated successfully",
        "image_url": recipe.image_url  # ✅ מחזיר את ה-URL המעודכן של התמונה
    }


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

@app.post("/recipes/{recipe_id}/timers")
async def add_timer(recipe_id: int, step_number: int = Form(...), duration: int = Form(...), label: str = Form(...), db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    new_timer = CookingTimer(recipe_id=recipe_id, step_number=step_number, duration=duration, label=label)
    db.add(new_timer)
    db.commit()  # ✅ ודאי שמבוצע commit!
    db.refresh(new_timer)

    return {"message": "Timer added successfully", "timer": new_timer}


@app.post("/recipes/{recipe_id}/rate/")
async def rate_recipe(
    recipe_id: int, 
    rating_data: RatingRequest, 
    db: Session = Depends(get_db)
):
    if rating_data.score < 1 or rating_data.score > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # ✅ בדיקה אם המשתמש כבר דירג
    existing_rating = db.query(Rating).filter(
        Rating.recipe_id == recipe_id, Rating.user_id == rating_data.user_id
    ).first()

    if existing_rating:
        existing_rating.score = rating_data.score  # ✅ עדכון דירוג קיים
    else:
        new_rating = Rating(recipe_id=recipe_id, user_id=rating_data.user_id, score=rating_data.score)
        db.add(new_rating)

    db.commit()

    # ✅ חישוב מחדש של הדירוג הממוצע
    all_ratings = db.query(Rating).filter(Rating.recipe_id == recipe_id).all()
    avg_rating = sum(r.score for r in all_ratings) / len(all_ratings)

    recipe.rating = avg_rating
    recipe.rating_count = len(all_ratings)
    db.commit()

    return {"message": "Rating added successfully", "average_rating": avg_rating}

 
setup_ai_routes(app)

@app.post("/recipes/{recipe_id}/comment")
async def add_comment(
    recipe_id: int,
    comment_data: CommentRequest,  # ✅ FastAPI יצפה ל-JSON בפורמט הנכון
    db: Session = Depends(get_db)
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    if not comment_data.content.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

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
@app.post("/register", include_in_schema=True)  # ✅ אין `/` בסוף הנתיב
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

@app.post("/recipes/{recipe_id}/comments/{comment_id}/reply")
async def reply_to_comment(
    recipe_id: int,
    comment_id: int,
    comment_data: CommentRequest,  # כולל user_id, content
    db: Session = Depends(get_db)
):
    # 1. בדוק שהמתכון קיים
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # 2. בדוק שהתגובה שאליה משיבים קיימת
    parent_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not parent_comment:
        raise HTTPException(status_code=404, detail="Parent comment not found")

    # 3. בדוק תוכן התגובה (לא ריק)
    if not comment_data.content.strip():
        raise HTTPException(status_code=400, detail="Reply cannot be empty")

    # 4. צור את תגובת-הבן
    reply_comment = Comment(
        recipe_id=recipe_id,
        user_id=comment_data.user_id,
        content=comment_data.content,
        timestamp=datetime.utcnow().isoformat(),
        parent_id=comment_id
    )
    db.add(reply_comment)
    db.commit()
    db.refresh(reply_comment)

    return {
        "message": "Reply added successfully",
        "reply": {
            "id": reply_comment.id,
            "content": reply_comment.content,
            "parent_id": reply_comment.parent_id,
            "timestamp": reply_comment.timestamp
        }
    }

@app.post("/login")
async def login_user(user_data: dict, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data["email"]).first()

    if not user or not verify_password(user_data["password"], user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "token": create_access_token(user.id),
        "user": {"id": user.id, "email": user.email}
    }


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


@app.get("/users/me", response_model=None)  # ✅ אין צורך להגדיר Response Model
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)), 
    db: Session = Depends(get_db)
):
    if not credentials or not credentials.credentials:
        print("❌ No Authorization Header received!")
        raise HTTPException(status_code=422, detail="Missing Authorization Header")

    token = credentials.credentials
    print(f"🔹 Received Token: {token}")  # ✅ לוודא שהטוקן מתקבל

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"✅ Decoded Token: {payload}")  # ✅ לוודא שהטוקן תקף

        user_id = payload.get("sub")
        if not user_id:
            print("❌ No user ID in token!")
            raise HTTPException(status_code=401, detail="Invalid token")

        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            print("❌ User not found")
            raise HTTPException(status_code=401, detail="Invalid token")

        return {"id": user.id, "username": user.username, "email": user.email}  # ✅ JSON תקין

    except jwt.ExpiredSignatureError:
        print("❌ Token expired")
        raise HTTPException(status_code=401, detail="Token expired")

    except jwt.JWTError:
        print("❌ Invalid token format")
        raise HTTPException(status_code=401, detail="Invalid token")
    
    
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
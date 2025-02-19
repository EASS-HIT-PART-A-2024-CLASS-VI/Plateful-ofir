from urllib.request import Request
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Query, Form, Security, Header
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Union
from datetime import datetime, timedelta
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials,OAuth2PasswordBearer

from models.notification_model import Notification
from models.security import verify_password, create_access_token
from jose import JWTError, jwt 
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
from services.notification_service import create_notification, get_user_notifications, mark_notifications_as_read

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
    allow_origins=["http://localhost:3000", "http://localhost:8000", "http://127.0.0.1:3000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
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
    first_name: str  
    last_name: str   
    email: EmailStr
    password: str
    birthdate: Optional[str] = None 
    gender: Optional[str] = None
    phone_number: Optional[str] = None


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
    username: str
    content: str
    parent_id: Optional[int] = None


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
    timers: Optional[str] = Form("[]"),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        creator_id = int(creator_id)
        servings = int(servings)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid creator_id or servings")

    ingredients_list = json.loads(ingredients)
    timers_list = json.loads(timers)
    print("📥 טיימרים שהתקבלו:", timers_list) 

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
        )
        db.add(new_nutritional_info)
        db.commit()
        db.refresh(new_nutritional_info)
        
    for timer in timers_list:
        new_timer = CookingTimer(
            recipe_id=new_recipe.id,
            step_number=timer["step_number"],
            duration=timer["duration"],
            label=timer.get("label", f"שלב {timer['step_number']}")  
        )
        db.add(new_timer)
    db.commit()

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
                "calories": r.nutritional_info.calories if r.nutritional_info else 0,
                "protein": r.nutritional_info.protein if r.nutritional_info else 0,
                "carbs": r.nutritional_info.carbs if r.nutritional_info else 0,
                "fats": r.nutritional_info.fats if r.nutritional_info else 0,
            } if r.nutritional_info else None,  # ✅ הוספת פסיק אחרי הבלוק של nutritional_info
            "timers": [
                {"step_number": timer.step_number, "duration": timer.duration, "label": timer.label}
                for timer in db.query(CookingTimer).filter(CookingTimer.recipe_id == r.id).all()
            ]
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

import json

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
    timers: Optional[str] = Form("[]"),  # 🛠 לוודא שזו מחרוזת JSON תקינה
    current_user_id: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        timers_list = json.loads(timers)  # ניסיון להמיר JSON
        print(f"📥 טיימרים שהתקבלו (Parsed JSON): {timers_list}")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"❌ JSON לא תקין: {str(e)}")

    # 🛠 שלב 1: לוודא שהמתכון קיים
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    if str(recipe.creator_id) != current_user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to edit this recipe")

    # ✅ אם יש תמונה חדשה, שמור אותה
    if image:
        image_filename = f"{recipe_id}_{os.urandom(8).hex()}.{image.filename.split('.')[-1]}"
        image_path = os.path.join("static", image_filename)
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

        if recipe.image_url and recipe.image_url != "/static/default-recipe.jpg":
            old_image_path = recipe.image_url.replace("/static/", "static/")
            if os.path.exists(old_image_path):
                os.remove(old_image_path)

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
    
    # 🛠 שלב 2: מחיקת טיימרים ישנים ושמירת חדשים
    print(f"📢 מחיקת טיימרים ישנים למתכון ID {recipe.id}")
    db.query(CookingTimer).filter(CookingTimer.recipe_id == recipe.id).delete()
    db.commit()

    print("📥 טיימרים שמורים:", timers_list) 
    for timer in timers_list:
        try:
            step_number = int(timer["step_number"])
            duration = int(timer["duration"])
            label = timer.get("label", f"שלב {step_number}")

            print(f"⏳ שמירת טיימר: שלב {step_number}, זמן {duration}, תיאור: {label}")

            new_timer = CookingTimer(
                recipe_id=recipe.id,
                step_number=step_number,
                duration=duration,
                label=label
            )
            db.add(new_timer)

        except (ValueError, KeyError, TypeError) as e:
            print(f"❌ שגיאה בהמרת טיימר: {timer}, שגיאה: {e}")

    db.commit()

    return {
        "message": "Recipe updated successfully",
        "image_url": recipe.image_url  
    }

@app.delete("/recipes/{recipe_id}", response_model=None)
async def delete_recipe(recipe_id: int, authorization: str = Header(None), db: Session = Depends(get_db)):
    """ מוחק מתכון לפי ה-ID שלו """

    # ✅ שליפת ה-User ID מה-Headers
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="❌ הרשאה חסרה")
    
    user_id = int(authorization.replace("Bearer ", ""))  # 🔹 הוצאת ה-ID מהכותרת

    # 🔹 שליפת המתכון מה-DB
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()

    if not recipe:
        raise HTTPException(status_code=404, detail="❌ המתכון לא נמצא")

    # 🔹 בדיקה אם המשתמש הנוכחי הוא הבעלים של המתכון
    if recipe.creator_id != user_id:
        raise HTTPException(status_code=403, detail="❌ אין לך הרשאה למחוק את המתכון הזה")

    db.delete(recipe)
    db.commit()

    return {"message": "✅ המתכון נמחק בהצלחה"}


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
async def share_recipe(recipe_id: int, user_id: int, db: Session = Depends(get_db)):
    """ שיתוף מתכון עם משתמש אחר """
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    user = db.query(User).filter(User.id == user_id).first()

    if not recipe or not user:
        raise HTTPException(status_code=404, detail="Recipe or user not found")

    # בדיקה אם המתכון כבר שותף עם המשתמש
    existing_share = db.query(SharedRecipe).filter(
        SharedRecipe.recipe_id == recipe_id,
        SharedRecipe.user_id == user_id
    ).first()

    if existing_share:
        raise HTTPException(status_code=400, detail="Recipe already shared with this user")

    # יצירת השיתוף
    shared_recipe = SharedRecipe(recipe_id=recipe_id, user_id=user_id)
    db.add(shared_recipe)
    db.commit()

    # יצירת התראה למשתמש
    create_notification(db, user_id, f"📢 המתכון {recipe.name} שותף איתך!", f"/recipes/{recipe_id}")

    return {"message": f"Recipe '{recipe.name}' shared successfully with user {user_id}"}


@app.get("/shopping-list/{recipe_id}")
async def get_shopping_list(recipe_id: int, servings: int = 1, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    scale_factor = servings / recipe.servings
    items = [
        {"name": ing.name, "quantity": round(ing.quantity * scale_factor, 2), "unit": ing.unit}
        for ing in recipe.ingredients
    ]
    
    return {"shopping_list": items}  # ודא שזו התשובה המוחזרת בצד השרת

@app.post("/recipes/{recipe_id}/timers")
async def add_timer(recipe_id: int, step_number: int = Form(...), duration: int = Form(...), label: str = Form(...), db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    new_timer = CookingTimer(recipe_id=recipe_id, step_number=step_number, duration=duration, label=label)
    db.add(new_timer)
    db.commit() 
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
    comment_data: CommentRequest,
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
        username=comment_data.username,  
        content=comment_data.content,
        timestamp=datetime.utcnow().isoformat(),
        parent_id=comment_data.parent_id
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    # ✅ יצירת התראה לבעל המתכון אם זה לא אותו משתמש
    if recipe.creator_id != comment_data.user_id:
        create_notification(
            db, 
            user_id=recipe.creator_id, 
            message=f"💬 {comment_data.username} הגיב/ה למתכון שלך {recipe.name}!",
            link=f"/recipes/{recipe_id}"
        )

    return {"message": "Comment added successfully", "comment": comment.content}

@app.get("/recipes/{recipe_id}/comments")
async def get_comments(recipe_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.recipe_id == recipe_id).all()
    return [
        {
            "id": comment.id,
            "user_id": comment.user_id,
            "username": comment.username,
            "content": comment.content,
            "timestamp": comment.timestamp,
            "parent_id": comment.parent_id  # ✅ מחזיר את ה-parent_id
        }
        for comment in comments
    ]

# User endpoints
@app.post("/register", include_in_schema=True)
async def register_user(user: UserRegister, db: Session = Depends(get_db)):
    try:
        print("📥 Data received:", user.dict())  # ✅ הדפסת הנתונים שמתקבלים

        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed_password = pwd_context.hash(user.password) 

        new_user = User(
            first_name=user.first_name,
            last_name=user.last_name,
            username=user.username,
            email=user.email,
            birthdate=user.birthdate,
            gender=user.gender,
            phone_number=user.phone_number,
            password_hash=hashed_password  
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {"message": "User registered successfully"}

    except Exception as e:
        print(f"❌ Error in register_user: {e}")  # ✅ הדפסת השגיאה האמיתית
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recipes/{recipe_id}/comments/{comment_id}/reply")
async def reply_to_comment(
    recipe_id: int,
    comment_id: int,
    comment_data: CommentRequest,
    db: Session = Depends(get_db)
):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    parent_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not parent_comment:
        raise HTTPException(status_code=404, detail="Parent comment not found")

    if not comment_data.content.strip():
        raise HTTPException(status_code=400, detail="Reply cannot be empty")

    reply_comment = Comment(
        recipe_id=recipe_id,
        user_id=comment_data.user_id,
        username=comment_data.username,
        content=comment_data.content,
        timestamp=datetime.utcnow().isoformat(),
        parent_id=comment_id
    )

    db.add(reply_comment)
    db.commit()
    db.refresh(reply_comment)

    # ✅ יצירת התראה למי שהגיב לראשונה, אם זה לא אותו משתמש
    if parent_comment.user_id != comment_data.user_id:
        create_notification(
            db, 
            user_id=parent_comment.user_id, 
            message=f"💬 {comment_data.username} השיב/ה לתגובה שלך במתכון {recipe.name}!",
            link=f"/recipes/{recipe_id}"
        )

    return {
        "message": "Reply added successfully",
        "reply": {
            "id": reply_comment.id,
            "username": reply_comment.username,
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


@app.get("/users/me", response_model=None)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)), 
    db: Session = Depends(get_db)
):
    if not credentials or not credentials.credentials:
        print("❌ No Authorization Header received!")
        return {"message": "No token provided"}  # ✅ במקום לקרוס, מחזירים הודעה

    token = credentials.credentials
    print(f"🔹 Received Token: {token}")  # ✅ הדפסת הטוקן

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

        return {"id": user.id, "username": user.username, "email": user.email}

    except jwt.ExpiredSignatureError:
        print("❌ Token expired")
        return {"message": "Token expired"}  # ✅ במקום לקרוס, מחזירים הודעה

    except jwt.JWTError as e:
        print(f"❌ Invalid token format: {e}")  # ✅ הדפסת השגיאה
        return {"message": "Invalid token"}

    except Exception as e:
        print(f"❌ Unexpected error: {e}")  # ✅ הדפסת כל שגיאה אחרת
        return {"message": "Internal server error"}
    
    
@app.get("/users/find/{username}")
async def find_user(username: str, db: Session = Depends(get_db)):
    """ מחפש משתמש לפי שם משתמש ומחזיר את ה-ID שלו """
    user = db.query(User).filter(User.username == username).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"user_id": user.id}

@app.get("/users/{user_id}/shared_recipes")
async def get_shared_recipes(user_id: int, db: Session = Depends(get_db)):
    """ החזרת כל המתכונים שמשתמש קיבל בשיתוף (ללא שם המשתמש ששיתף) """
    try:
        shared_recipes = db.query(SharedRecipe).filter(SharedRecipe.user_id == user_id).all()

        if not shared_recipes:
            return []

        result = []
        for s in shared_recipes:
            recipe = db.query(Recipe).filter(Recipe.id == s.recipe_id).first()

            if recipe:
                result.append({
                    "recipe_id": recipe.id,
                    "recipe_name": recipe.name,
                    "recipe_image": recipe.image_url
                })

        return result

    except Exception as e:
        print(f"❌ Error fetching shared recipes: {e}")
        raise HTTPException(status_code=500, detail="שגיאה בשרת בעת שליפת מתכונים משותפים")



    
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
async def fetch_notifications(user_id: int, db: Session = Depends(get_db)):
    """ מחזיר את ההתראות של המשתמש """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    notifications = db.query(Notification).filter(Notification.user_id == user_id).all()

    return [
        {
            "id": n.id,  # ✅ הוספת ה-ID לתשובה
            "message": n.message,
            "link": n.link,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        }
        for n in notifications
    ]


@app.delete("/users/{user_id}/notifications/read")
async def delete_read_notifications(user_id: int, db: Session = Depends(get_db)):
    """ מוחק את כל ההתראות שסומנו כנקראו """

    deleted_rows = db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == True).delete(synchronize_session=False)
    
    db.commit()
    
    # ✅ במקום להחזיר 404, נחזיר הודעה שהכל נמחק
    return {"message": f"{deleted_rows} read notifications deleted" if deleted_rows > 0 else "No read notifications to delete"}



@app.delete("/users/{user_id}/notifications/{notification_id}")
async def delete_notification(user_id: int, notification_id: int, db: Session = Depends(get_db)):
    """ מוחק התראה ספציפית כאשר המשתמש לוחץ עליה """
    notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notification)
    db.commit()
    
    return {"message": "Notification deleted"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials,OAuth2PasswordBearer
from models.notification_model import Notification
from models.security import verify_password, create_access_token
from jose import jwt 
import json
import shutil
import os
from passlib.context import CryptContext
from models.recipe_model import (Comment, Recipe, Ingredient, NutritionalInfo, SharedRecipe,Rating, CookingTimer)
from models.user_model import User
from pydantic import BaseModel, EmailStr, field_validator
from services.ai_service import setup_ai_routes
from db.database import engine, get_db, init_db, SessionLocal, Base
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from models.recipe_model import Comment
from fastapi.staticfiles import StaticFiles
from services.ai_service import calculate_nutritional_info
from services.notification_service import create_notification
from datetime import datetime, timedelta, timezone
from services.seed_data import load_seed_data

Base.metadata.create_all(bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") 


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("📢 Initializing database...")
    init_db()  # ✅ יצירת כל הטבלאות במסד הנתונים
    print("✅ Database initialized successfully!")

    db = SessionLocal()
    load_seed_data(db)  # ✅ טעינת נתוני ברירת המחדל אחרי יצירת הטבלאות
    db.close()

    yield


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
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
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
os.makedirs(STATIC_DIR, exist_ok=True)  
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
    # Convert creator_id and servings to integers; raise error if conversion fails.
    try:
        creator_id = int(creator_id)
        servings = int(servings)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid creator_id or servings")

    # Parse ingredients and timers JSON strings.
    ingredients_list = json.loads(ingredients)
    timers_list = json.loads(timers)
    print("Received timers:", timers_list) 

    # Set default image URL; if an image is provided, save it and update image_url.
    image_url = "/static/default-recipe.jpg"
    if image:
        image_filename = f"{name.replace(' ', '_')}_{os.urandom(8).hex()}.{image.filename.split('.')[-1]}"
        image_path = os.path.join("static", image_filename)
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_url = f"/static/{image_filename}"

    # Create and store the new recipe.
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

    # Add each ingredient to the database.
    for ingredient in ingredients_list:
        new_ingredient = Ingredient(
            name=ingredient["name"],
            quantity=float(ingredient["quantity"]),
            unit=ingredient["unit"],
            recipe_id=new_recipe.id
        )
        db.add(new_ingredient)
    db.commit()

    # Calculate nutritional information using provided ingredients.
    print(f"Calling calculate_nutritional_info with ingredients: {ingredients_list}")
    nutrition_data = calculate_nutritional_info(ingredients_list, servings)
    print(f"Nutrition data received: {nutrition_data}")

    # Save nutritional information if available.
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
        
    # Add cooking timers to the recipe.
    for timer in timers_list:
        new_timer = CookingTimer(
            recipe_id=new_recipe.id,
            step_number=timer["step_number"],
            duration=timer["duration"],
            label=timer.get("label", f"Step {timer['step_number']}")
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
    # Build query with optional filtering by category and tag.
    query = db.query(Recipe)
    if category:
        query = query.filter(Recipe.categories.contains(category))
    if tag:
        query = query.filter(Recipe.tags.contains(tag))
    if sort_by == "rating":
        query = query.order_by(Recipe.rating.desc())
    recipes = query.all()

    # Return recipe details, including ingredients, nutritional info, and timers.
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
            "tags": r.tags,
            "creator_id": r.creator_id,
            "image_url": r.image_url,
            "nutritional_info": {
                "calories": r.nutritional_info.calories if r.nutritional_info else 0,
                "protein": r.nutritional_info.protein if r.nutritional_info else 0,
                "carbs": r.nutritional_info.carbs if r.nutritional_info else 0,
                "fats": r.nutritional_info.fats if r.nutritional_info else 0,
            } if r.nutritional_info else None,
            "timers": [
                {
                    "step_number": timer.step_number,
                    "duration": timer.duration,
                    "label": timer.label
                }
                for timer in db.query(CookingTimer).filter(CookingTimer.recipe_id == r.id).all()
            ]
        }
        for r in recipes
    ]    

@app.get("/recipes/{recipe_id}")
async def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    # Retrieve a specific recipe by ID.
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    rating = recipe.rating if recipe.rating is not None else 0.0
    image_url = recipe.image_url if recipe.image_url else "/static/default-recipe.jpg"
    timers = db.query(CookingTimer).filter(CookingTimer.recipe_id == recipe_id).all()

    # Retrieve nutritional information.
    nutritional_info = db.query(NutritionalInfo).filter(NutritionalInfo.recipe_id == recipe_id).first()
    nutrition_data = {
        "calories": nutritional_info.calories if nutritional_info else 0,
        "protein": nutritional_info.protein if nutritional_info else 0,
        "carbs": nutritional_info.carbs if nutritional_info else 0,
        "fats": nutritional_info.fats if nutritional_info else 0,
    }
    print("Nutritional info:", recipe.nutritional_info)

    return {
        "id": recipe.id,
        "name": recipe.name,
        "preparation_steps": recipe.preparation_steps or "",
        "cooking_time": recipe.cooking_time,
        "servings": recipe.servings,
        "categories": recipe.categories,
        "tags": recipe.tags,
        "image_url": image_url,        
        "rating": rating,
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
            {
                "step_number": timer.step_number,
                "duration": timer.duration,
                "label": timer.label
            }
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
    timers: Optional[str] = Form("[]"),
    current_user_id: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # Parse timers JSON string.
    try:
        timers_list = json.loads(timers)
        print(f"Parsed timers: {timers_list}")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")

    # Retrieve the recipe to be updated.
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # Check if the current user is the creator of the recipe.
    if str(recipe.creator_id) != current_user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to edit this recipe")

    # If a new image is provided, save it and update the recipe's image URL.
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

    # Update recipe fields.
    recipe.name = name
    recipe.preparation_steps = preparation_steps
    recipe.cooking_time = cooking_time
    recipe.servings = servings
    recipe.categories = categories
    recipe.tags = tags

    # Delete old ingredients and add updated ones.
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

    # Recalculate nutritional information.
    nutrition_data = calculate_nutritional_info(ingredients_list, recipe.servings)
    existing_nutrition = db.query(NutritionalInfo).filter(NutritionalInfo.recipe_id == recipe.id).first()
    if existing_nutrition:
        existing_nutrition.calories = nutrition_data["calories"]
        existing_nutrition.protein = nutrition_data["protein"]
        existing_nutrition.carbs = nutrition_data["carbs"]
        existing_nutrition.fats = nutrition_data["fats"]
    else:
        new_nutrition = NutritionalInfo(
            recipe_id=recipe.id,
            calories=nutrition_data["calories"],
            protein=nutrition_data["protein"],
            carbs=nutrition_data["carbs"],
            fats=nutrition_data["fats"]
        )
        db.add(new_nutrition)

    db.commit()
    print(f"Nutritional info updated successfully for recipe {recipe.id}")

    db.commit()
    
    # Delete old timers and add new ones.
    print(f"Deleting old timers for recipe ID {recipe.id}")
    db.query(CookingTimer).filter(CookingTimer.recipe_id == recipe.id).delete()
    db.commit()

    print("Timers received:", timers_list)
    for timer in timers_list:
        try:
            step_number = int(timer["step_number"])
            duration = int(timer["duration"])
            label = timer.get("label", f"Step {step_number}")
            print(f"Saving timer: step {step_number}, duration {duration}, label: {label}")
            new_timer = CookingTimer(
                recipe_id=recipe.id,
                step_number=step_number,
                duration=duration,
                label=label
            )
            db.add(new_timer)
        except (ValueError, KeyError, TypeError) as e:
            print(f"Error converting timer: {timer}, error: {e}")

    db.commit()

    return {
        "message": "המתכון עודכן בהצלחה!",
        "image_url": recipe.image_url  
    }


@app.delete("/recipes/{recipe_id}", response_model=None)
async def delete_recipe(recipe_id: int, authorization: str = Header(None), db: Session = Depends(get_db)):
    # Delete a recipe by its ID. First, verify that the request includes a valid Authorization header.
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization missing")
    
    # Extract user ID from the Authorization header.
    user_id = int(authorization.replace("Bearer ", ""))
    
    # Retrieve the recipe from the database.
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Check if the current user is the owner of the recipe.
    if recipe.creator_id != user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this recipe")
    
    # Delete the recipe and commit the change.
    db.delete(recipe)
    db.commit()
    return {"message": "המתכון נמחק בהצלחה!"}


@app.get("/recipes/{recipe_id}/scale")
async def scale_recipe(
    recipe_id: int,
    servings: int,
    db: Session = Depends(get_db)
):
    # Retrieve the recipe and verify it exists.
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Calculate the scaling factor based on the desired servings.
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
    # Share a recipe with another user.
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    if not recipe or not user:
        raise HTTPException(status_code=404, detail="מתכון או משתמש לא נמצאו")
    
    # Check if the recipe is already shared with this user.
    existing_share = db.query(SharedRecipe).filter(
        SharedRecipe.recipe_id == recipe_id,
        SharedRecipe.user_id == user_id
    ).first()
    if existing_share:
        raise HTTPException(status_code=400, detail="המתכון כבר שותף עם היוזר הזה")
    
    # Create the shared recipe record and commit.
    shared_recipe = SharedRecipe(recipe_id=recipe_id, user_id=user_id)
    db.add(shared_recipe)
    db.commit()
    
    # Create a notification for the user.
    create_notification(db, user_id, f"המתכון {recipe.name} שותף איתך!", f"/recipes/{recipe_id}")
    return {"message": f"המתכון '{recipe.name}' שותף עם המשתמש r {user_id}"}


@app.get("/shopping-list/{recipe_id}")
async def get_shopping_list(recipe_id: int, servings: int = 1, db: Session = Depends(get_db)):
    # Retrieve the recipe for which the shopping list is needed.
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Scale ingredient quantities according to the desired servings.
    scale_factor = servings / recipe.servings
    items = [
        {
            "name": ing.name,
            "quantity": round(ing.quantity * scale_factor, 2),
            "unit": ing.unit
        }
        for ing in recipe.ingredients
    ]
    return {"shopping_list": items}


@app.post("/recipes/{recipe_id}/timers")
async def add_timer(
    recipe_id: int,
    step_number: int = Form(...),
    duration: int = Form(...),
    label: str = Form(...),
    db: Session = Depends(get_db)
):
    # Retrieve the recipe to ensure it exists.
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Create a new timer and save it to the database.
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
    # Ensure the rating is between 1 and 5.
    if rating_data.score < 1 or rating_data.score > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Check if the user has already rated the recipe.
    existing_rating = db.query(Rating).filter(
        Rating.recipe_id == recipe_id, Rating.user_id == rating_data.user_id
    ).first()
    if existing_rating:
        # Update existing rating.
        existing_rating.score = rating_data.score
    else:
        # Create a new rating.
        new_rating = Rating(recipe_id=recipe_id, user_id=rating_data.user_id, score=rating_data.score)
        db.add(new_rating)
    db.commit()
    
    # Recalculate the average rating for the recipe.
    all_ratings = db.query(Rating).filter(Rating.recipe_id == recipe_id).all()
    avg_rating = sum(r.score for r in all_ratings) / len(all_ratings)
    recipe.rating = avg_rating
    recipe.rating_count = len(all_ratings)
    db.commit()
    return {"message": "Rating added successfully", "average_rating": avg_rating}


# Setup AI routes for the application.
setup_ai_routes(app)

@app.post("/recipes/{recipe_id}/comment")
async def add_comment(
    recipe_id: int,
    comment_data: CommentRequest,
    db: Session = Depends(get_db)
):
    # Retrieve the recipe by its ID; return 404 if not found.
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # Ensure that the comment content is not empty.
    if not comment_data.content.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    # Create a new Comment instance with the provided data and current timestamp.
    comment = Comment(
        recipe_id=recipe_id,
        user_id=comment_data.user_id,
        username=comment_data.username,  
        content=comment_data.content,
        timestamp=datetime.now(timezone.utc).isoformat(),
        parent_id=comment_data.parent_id
    )

    # Save the comment to the database.
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # If the commenter is not the recipe owner, create a notification for the owner.
    if recipe.creator_id != comment_data.user_id:
        create_notification(
            db, 
            user_id=recipe.creator_id, 
            message=f"💬 {comment_data.username} הגיב על המתכון שלך {recipe.name}!",
            link=f"/recipes/{recipe_id}"
        )

    return {"message": "התגובה התווספה בהצלחה", "comment": comment.content}


@app.get("/recipes/{recipe_id}/comments")
async def get_comments(recipe_id: int, db: Session = Depends(get_db)):
    # Fetch all comments associated with the given recipe.
    comments = db.query(Comment).filter(Comment.recipe_id == recipe_id).all()
    return [
        {
            "id": comment.id,
            "user_id": comment.user_id,
            "username": comment.username,
            "content": comment.content,
            "timestamp": comment.timestamp,
            "parent_id": comment.parent_id  # Return the parent comment ID if it exists.
        }
        for comment in comments
    ]


# User endpoints
@app.post("/register", include_in_schema=True)
async def register_user(user: UserRegister, db: Session = Depends(get_db)):
    try:
        print("Data received:", user.model_dump())

        # Check if the user already exists by email.
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Hash the password using the defined password context.
        hashed_password = pwd_context.hash(user.password) 

        # Create a new User instance with the provided data.
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

        # Save the new user to the database.
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {"message": "User registered successfully"}

    except Exception as e:
        print(f"Error in register_user: {e}")  # Log the actual error for debugging.
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recipes/{recipe_id}/comments/{comment_id}/reply")
async def reply_to_comment(
    recipe_id: int,
    comment_id: int,
    comment_data: CommentRequest,
    db: Session = Depends(get_db)
):
    # Retrieve the recipe by ID.
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    # Retrieve the parent comment by its ID.
    parent_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not parent_comment:
        raise HTTPException(status_code=404, detail="Parent comment not found")

    # Ensure that the reply content is not empty.
    if not comment_data.content.strip():
        raise HTTPException(status_code=400, detail="Reply cannot be empty")

    # Create a new Comment instance for the reply with the parent comment's ID.
    reply_comment = Comment(
        recipe_id=recipe_id,
        user_id=comment_data.user_id,
        username=comment_data.username,
        content=comment_data.content,
        timestamp=datetime.now(timezone.utc).isoformat(),
        parent_id=comment_id
    )

    # Save the reply to the database.
    db.add(reply_comment)
    db.commit()
    db.refresh(reply_comment)

    # Create a notification for the original commenter if the replier is not the same user.
    if parent_comment.user_id != comment_data.user_id:
        create_notification(
            db, 
            user_id=parent_comment.user_id, 
            message=f"💬 {comment_data.username} הגיב על התגובה שלך במתכון {recipe.name}!",
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
    # Retrieve the user based on the provided email.
    user = db.query(User).filter(User.email == user_data["email"]).first()

    # If the user is not found or the password does not match, raise an error.
    if not user or not verify_password(user_data["password"], user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Return a JWT token along with the user's basic info.
    return {
        "token": create_access_token(user.id),
        "user": {"id": user.id, "email": user.email}
    }


@app.get("/users/")
async def get_users(db: Session = Depends(get_db)):
    # Retrieve all users from the database.
    users = db.query(User).all()
    if not users:
        raise HTTPException(status_code=404, detail="No users found")
    
    # Return a list of users with selected fields.
    return [
        {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
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
    # If no credentials are provided, return a message instead of crashing.
    if not credentials or not credentials.credentials:
        print("No Authorization Header received!")
        return {"message": "No token provided"}

    token = credentials.credentials
    print(f"Received Token: {token}")

    try:
        # Attempt to decode the token.
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Decoded Token: {payload}")

        user_id = payload.get("sub")
        if not user_id:
            print("No user ID in token!")
            raise HTTPException(status_code=401, detail="Invalid token")

        # Retrieve the user from the database.
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            print("User not found")
            raise HTTPException(status_code=401, detail="Invalid token")

        return {
            "id": user.id,
            "last_name": user.last_name,
            "first_name": user.first_name,
            "username": user.username,
            "email": user.email
        }

    except jwt.ExpiredSignatureError:
        print("Token expired")
        return {"message": "Token expired"}
    except jwt.JWTError as e:
        print(f"Invalid token format: {e}")
        return {"message": "Invalid token"}
    except Exception as e:
        print(f"Unexpected error: {e}")
        return {"message": "Internal server error"}


@app.get("/users/find/{username}")
async def find_user(username: str, db: Session = Depends(get_db)):
    # Search for a user by username.
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user_id": user.id}


@app.get("/users/{user_id}/shared_recipes")
async def get_shared_recipes(user_id: int, db: Session = Depends(get_db)):
    # Retrieve recipes shared with the specified user.
    try:
        shared_recipes = db.query(SharedRecipe).filter(SharedRecipe.user_id == user_id).all()
        if not shared_recipes:
            return []

        result = []
        # For each shared recipe, fetch its details.
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
        print(f"Error fetching shared recipes: {e}")
        raise HTTPException(status_code=500, detail="Server error while fetching shared recipes")


@app.get("/users/{user_id}/recipes")
async def get_user_recipes(user_id: int, db: Session = Depends(get_db)):
    try:
        # Retrieve recipes created by the specified user.
        user_recipes = db.query(Recipe).filter(Recipe.creator_id == user_id).all()
        if not user_recipes:
            return []
        return user_recipes
    except Exception as e:
        print(f"Error fetching user recipes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/users/{user_id}/notifications")
async def fetch_notifications(user_id: int, db: Session = Depends(get_db)):
    # Retrieve the user to ensure they exist.
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch all notifications for the user.
    notifications = db.query(Notification).filter(Notification.user_id == user_id).all()
    return [
        {
            "id": n.id,  # Include notification ID
            "message": n.message,
            "link": n.link,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        }
        for n in notifications
    ]


@app.delete("/users/{user_id}/notifications/read")
async def delete_read_notifications(user_id: int, db: Session = Depends(get_db)):
    # Delete all notifications marked as read for the user.
    deleted_rows = db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == True).delete(synchronize_session=False)
    db.commit()
    # Return a message indicating the number of notifications deleted.
    return {"message": f"{deleted_rows} read notifications deleted" if deleted_rows > 0 else "No read notifications to delete"}


@app.delete("/users/{user_id}/notifications/{notification_id}")
async def delete_notification(user_id: int, notification_id: int, db: Session = Depends(get_db)):
    # Delete a specific notification when the user clicks on it.
    # Retrieve the notification that matches the given notification ID and user ID.
    notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
    
    # If the notification does not exist, return a 404 error.
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Delete the notification from the database and commit the change.
    db.delete(notification)
    db.commit()
    
    return {"message": "Notification deleted"}


if __name__ == "__main__":
    import uvicorn
    # Run the FastAPI application on host 0.0.0.0 and port 8000.
    uvicorn.run(app, host="0.0.0.0", port=8000)

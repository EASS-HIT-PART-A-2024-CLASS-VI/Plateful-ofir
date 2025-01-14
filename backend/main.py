from fastapi import FastAPI, Depends, UploadFile, File
from backend import database
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from fastapi.responses import FileResponse

# Import the services defined in the services directory
from services.recipe_service import create_recipe, filter_recipes
from services.recipe_service import create_recipe, filter_recipes
from services.user_service import create_user, get_user_recipes  
from services.timer_service import start_timer, get_timer 
from services.image_service import upload_image, get_image  


app = FastAPI()

# Dependency for getting DB session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models for creating a recipe
class IngredientBase(BaseModel):
    name: str
    quantity: str

class RecipeCreate(BaseModel):
    name: str
    image: str
    cooking_time: int
    categories: str
    tags: Optional[str] = None
    ingredients: List[IngredientBase]

class UserCreate(BaseModel):
    username: str
    preferences: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Hello, Plateful!"}

@app.post("/recipes/")
def create_recipe_endpoint(recipe: RecipeCreate, db: Session = Depends(get_db)):
    recipe_data = recipe.dict()
    db_recipe = create_recipe(db, recipe_data)  # Calling the recipe service
    return {"message": "Recipe added successfully!", "recipe": db_recipe}

@app.post("/users/")
def create_user_endpoint(user: UserCreate, db: Session = Depends(get_db)):
    user_data = user.dict()
    db_user = create_user(db, user_data)  # Calling the user service
    return {"message": "User created successfully!", "user": db_user}

@app.post("/upload-image/")
async def upload_image_endpoint(file: UploadFile = File(...)):
    return await upload_image(file)  # Uploading image to the service

@app.get("/recipes/")
def get_recipes(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    recipes = filter_recipes(db, skip=skip, limit=limit)  # Calling the recipe service
    return recipes  # Returning the recipes

@app.get("/users/{username}")
def get_user(username: str, db: Session = Depends(get_db)):
    user = get_user_recipes(db, username=username)  # Calling the user service
    return user if user else {"message": "User not found"}

@app.get("/images/{image_name}")
def get_image_endpoint(image_name: str):
    return get_image(image_name)  # Retrieving image from the service

@app.post("/timer/{timer_id}/{duration}")
def start_timer_endpoint(timer_id: str, duration: int):
    start_timer(timer_id, duration)  # Starting the timer in the service
    return {"message": f"Timer {timer_id} started for {duration} seconds"}

@app.get("/timer/{timer_id}")
def get_timer_endpoint(timer_id: str):
    return get_timer(timer_id)  # Getting the remaining time from the timer

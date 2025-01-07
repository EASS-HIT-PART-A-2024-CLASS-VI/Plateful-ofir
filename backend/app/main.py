from fastapi import FastAPI, Depends, UploadFile, File
from sqlalchemy.orm import Session
from . import crud, models, database
from pydantic import BaseModel
from typing import List, Optional
from fastapi.responses import FileResponse
from services import upload_image, get_image

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello, Plateful!"}


# Dependency for getting DB session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# דגם נתונים עבור יצירת מתכון
class RecipeCreate(BaseModel):
    name: str
    image: str
    cooking_time: int
    categories: str
    tags: Optional[str] = None
    ingredients: List[dict]

# דגם נתונים עבור יצירת משתמש
class UserCreate(BaseModel):
    username: str
    preferences: Optional[str] = None

@app.post("/recipes/")
def create_recipe(recipe: RecipeCreate, db: Session = Depends(get_db)):
    recipe_data = recipe.dict()
    db_recipe = crud.create_recipe(db, recipe_data)
    return {"message": "Recipe added successfully!", "recipe": db_recipe}

@app.post("/users/")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    user_data = user.dict()
    db_user = crud.create_user(db, user_data)
    return {"message": "User created successfully!", "user": db_user}

@app.post("/upload-image/")
async def upload_image_endpoint(file: UploadFile = File(...)):
    return await upload_image(file)

@app.get("/recipes/")
def get_recipes(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    recipes = crud.get_recipes(db, skip=skip, limit=limit)
    return recipes

@app.get("/users/{username}")
def get_user(username: str, db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username=username)
    return user if user else {"message": "User not found"}

@app.get("/images/{image_name}")
def get_image_endpoint(image_name: str):
    return get_image(image_name)

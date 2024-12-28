# app/main.py

from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from app.database import Base, engine, SessionLocal
from app.models import Recipe



app = FastAPI()

# יצירת הטבלאות במסד הנתונים
Base.metadata.create_all(bind=engine)

# דגם של מתכון
class Recipe(BaseModel):
    title: str
    ingredients: List[str]
    steps: List[str]
    cooking_time: int  # זמן הכנה בדקות
    category: str
    tags: List[str]

# דוגמת מתכון
recipes_db = []

@app.post("/api/recipes/")
async def create_recipe(recipe: Recipe):
    recipes_db.append(recipe)
    return {"message": "Recipe created successfully", "recipe": recipe}

@app.get("/api/recipes/")
async def get_recipes():
    return recipes_db

@app.get("/api/recipes/{recipe_id}")
async def get_recipe(recipe_id: int):
    if recipe_id < len(recipes_db):
        return recipes_db[recipe_id]
    return {"message": "Recipe not found"}

@app.put("/api/recipes/{recipe_id}")
async def update_recipe(recipe_id: int, updated_recipe: Recipe):
    if recipe_id < len(recipes_db):
        recipes_db[recipe_id] = updated_recipe
        return {"message": "Recipe updated successfully", "recipe": updated_recipe}
    return {"message": "Recipe not found"}

@app.delete("/api/recipes/{recipe_id}")
async def delete_recipe(recipe_id: int):
    if recipe_id < len(recipes_db):
        deleted_recipe = recipes_db.pop(recipe_id)
        return {"message": "Recipe deleted successfully", "recipe": deleted_recipe}
    return {"message": "Recipe not found"}

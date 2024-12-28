
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

# יצירת מודל עבור מתכון
class Ingredient(BaseModel):
    name: str
    quantity: str

class Recipe(BaseModel):
    name: str
    image: str
    ingredients: List[Ingredient]
    instructions: List[str]
    cooking_time: int  # in minutes

# יצירת היישום FastAPI
app = FastAPI()

# לדוגמה, נתון רשימת מתכונים
recipes = []

@app.post("/recipes/")
def add_recipe(recipe: Recipe):
    recipes.append(recipe)
    return {"message": "Recipe added successfully!"}

@app.get("/recipes/")
def get_recipes():
    return recipes

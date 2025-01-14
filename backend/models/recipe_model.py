from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel
from typing import List, Optional

Base = declarative_base()

# SQLAlchemy Model for Ingredient
class Ingredient(Base):
    __tablename__ = 'ingredients'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    quantity = Column(String)
    recipe_id = Column(Integer, ForeignKey('recipes.id'))
    recipe = relationship("Recipe", back_populates="ingredients")

# SQLAlchemy Model for Recipe
class Recipe(Base):
    __tablename__ = 'recipes'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    image = Column(String)
    cooking_time = Column(Integer)
    categories = Column(String)
    tags = Column(String)
    ingredients = relationship("Ingredient", back_populates="recipe")
    nutritional_info = relationship("NutritionalInfo", uselist=False, back_populates="recipe")
    rating = Column(Float, default=0)  # Add a rating field for recipes

    def __repr__(self):
        return f"<Recipe(name={self.name}, cooking_time={self.cooking_time})>"

# SQLAlchemy Model for NutritionalInfo
class NutritionalInfo(Base):
    __tablename__ = 'nutritional_info'

    id = Column(Integer, primary_key=True, index=True)
    calories = Column(Integer)
    protein = Column(Float)
    fat = Column(Float)
    carbs = Column(Float)
    recipe_id = Column(Integer, ForeignKey('recipes.id'))
    recipe = relationship("Recipe", back_populates="nutritional_info")

# Pydantic Model for Ingredient (to create and read ingredients)
class IngredientBase(BaseModel):
    name: str
    quantity: str

class IngredientCreate(IngredientBase):
    pass

class IngredientRead(IngredientBase):
    id: int  # Adding the ID for reading ingredients

    class Config:
        orm_mode = True  # This tells Pydantic to treat the SQLAlchemy models as dictionaries

# Pydantic Model for NutritionalInfo (for reading nutritional data)
class NutritionalInfoBase(BaseModel):
    calories: int
    protein: float
    fat: float
    carbs: float

class NutritionalInfoRead(NutritionalInfoBase):
    id: int
    recipe_id: int

    class Config:
        orm_mode = True

# Pydantic Model for Recipe (for creating and reading recipes)
class RecipeBase(BaseModel):
    name: str
    image: str
    cooking_time: int
    categories: str
    tags: Optional[str] = None

class RecipeCreate(RecipeBase):
    ingredients: List[IngredientCreate]  # Ingredients to create the recipe

class RecipeRead(RecipeBase):
    id: int
    ingredients: List[IngredientRead]  # List of ingredients for reading
    nutritional_info: NutritionalInfoRead  # Nutritional information for reading

    class Config:
        orm_mode = True

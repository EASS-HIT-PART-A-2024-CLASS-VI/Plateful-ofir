from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel
from typing import List, Optional

Base = declarative_base()

class Ingredient(Base):
    __tablename__ = 'ingredients'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    quantity = Column(String)

    recipe_id = Column(Integer, ForeignKey('recipes.id'))
    recipe = relationship("Recipe", back_populates="ingredients")

class Recipe(Base):
    __tablename__ = 'recipes'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    image = Column(String)
    cooking_time = Column(Integer)
    categories = Column(String)
    tags = Column(String)

    ingredients = relationship("Ingredient", back_populates="recipe")

    def __repr__(self):
        return f"<Recipe(name={self.name}, cooking_time={self.cooking_time})>"

class UserProfile(Base):
    __tablename__ = 'user_profiles'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    preferences = Column(String)  # תוכל לשדרג לפורמט JSON אם צריך

    def __repr__(self):
        return f"<UserProfile(username={self.username})>"

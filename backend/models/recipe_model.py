from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, JSON, Table
from sqlalchemy.orm import relationship
from models.base import Base

# Association table for recipe sharing
recipe_shares = Table('recipe_shares', Base.metadata,
    Column('recipe_id', Integer, ForeignKey('recipes.id')),
    Column('user_id', Integer, ForeignKey('users.id'))
)

class Recipe(Base):
    __tablename__ = 'recipes'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    image = Column(String)
    preparation_steps = Column(Text)
    cooking_time = Column(Integer)
    servings = Column(Integer, default=1)
    categories = Column(String)  # Comma-separated: breakfast,dinner,etc
    tags = Column(String)        # Comma-separated: vegan,gluten-free,etc
    rating = Column(Float, default=0.0)
    creator_id = Column(Integer, ForeignKey('users.id'))
    
    ingredients = relationship("Ingredient", back_populates="recipe", cascade="all, delete-orphan")
    nutritional_info = relationship("NutritionalInfo", back_populates="recipe", uselist=False, cascade="all, delete-orphan")
    creator = relationship("User", back_populates="recipes")
    shared_with = relationship("User", secondary=recipe_shares, backref="shared_recipes")
    cooking_timers = relationship("CookingTimer", back_populates="recipe", cascade="all, delete-orphan")

class Ingredient(Base):
    __tablename__ = 'ingredients'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    quantity = Column(Float)
    unit = Column(String)
    nutritional_values = Column(JSON)  # Stores nutritional values per 100g/ml
    recipe_id = Column(Integer, ForeignKey('recipes.id'))
    
    recipe = relationship("Recipe", back_populates="ingredients")

class NutritionalInfo(Base):
    __tablename__ = 'nutritional_info'

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey('recipes.id'))
    calories = Column(Float)
    protein = Column(Float)
    carbs = Column(Float)
    fats = Column(Float)
    serving_size = Column(Float)
    
    recipe = relationship("Recipe", back_populates="nutritional_info")

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True)
    dietary_preferences = Column(JSON)  # Stores preferences like vegan, gluten-free
    
    recipes = relationship("Recipe", back_populates="creator")
    shopping_lists = relationship("ShoppingList", back_populates="user")

class ShoppingList(Base):
    __tablename__ = 'shopping_lists'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    recipe_id = Column(Integer, ForeignKey('recipes.id'))
    items = Column(JSON)  # Stores shopping items with quantities
    created_at = Column(String)  # ISO format date
    
    user = relationship("User", back_populates="shopping_lists")
    recipe = relationship("Recipe")

class CookingTimer(Base):
    __tablename__ = 'cooking_timers'

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey('recipes.id'))
    step_number = Column(Integer)
    duration = Column(Integer)  # Duration in seconds
    label = Column(String)
    
    recipe = relationship("Recipe", back_populates="cooking_timers")
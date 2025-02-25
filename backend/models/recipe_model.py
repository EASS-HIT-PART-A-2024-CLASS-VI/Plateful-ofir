from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, JSON, Table
from sqlalchemy.orm import relationship
from models.base import Base

# Association table for recipe sharing.
recipe_shares = Table('recipe_shares', Base.metadata,
    Column('recipe_id', Integer, ForeignKey('recipes.id')),
    Column('user_id', Integer, ForeignKey('users.id'))
)

class Recipe(Base):
    __tablename__ = 'recipes'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    ingredients = relationship("Ingredient", back_populates="recipe", cascade="all, delete-orphan")
    preparation_steps = Column(String)
    cooking_time = Column(Integer)
    servings = Column(Integer, default=1)
    categories = Column(String)
    tags = Column(String, nullable=True)
    rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    creator_id = Column(Integer, ForeignKey('users.id'))
    image_url = Column(String, nullable=True)  

    comments = relationship("Comment", back_populates="recipe", cascade="all, delete-orphan")
    nutritional_info = relationship("NutritionalInfo", back_populates="recipe", uselist=False, cascade="all, delete-orphan")
    creator = relationship("User", back_populates="recipes")
    shared_with = relationship("SharedRecipe", back_populates="recipe", cascade="all, delete-orphan")
    cooking_timers = relationship("CookingTimer", back_populates="recipe", cascade="all, delete-orphan")

class Ingredient(Base):
    __tablename__ = 'ingredients'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    quantity = Column(Float)
    unit = Column(String)
    nutritional_values = Column(JSON)  # Nutrition per 100g/ml.
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
    
    recipe = relationship("Recipe", back_populates="nutritional_info")

class ShoppingList(Base):
    __tablename__ = 'shopping_lists'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    recipe_id = Column(Integer, ForeignKey('recipes.id'))
    items = Column(JSON)  # Items with quantities.
    created_at = Column(String)  # ISO date.
    
    user = relationship("User", back_populates="shopping_lists")
    recipe = relationship("Recipe")

class CookingTimer(Base):
    __tablename__ = 'cooking_timers'

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey('recipes.id'))
    step_number = Column(Integer)
    duration = Column(Integer)  # Duration in seconds.
    label = Column(String)
    
    recipe = relationship("Recipe", back_populates="cooking_timers")

class Comment(Base):
    __tablename__ = 'comments'

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey('recipes.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    username = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(String, nullable=False)
    parent_id = Column(Integer, ForeignKey('comments.id'), nullable=True)  

    recipe = relationship("Recipe", back_populates="comments")
    user = relationship("User")
    parent_comment = relationship("Comment", remote_side=[id], backref="children") 

class SharedRecipe(Base):
    __tablename__ = 'shared_recipes'

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey('recipes.id'))
    user_id = Column(Integer, ForeignKey('users.id'))

    recipe = relationship("Recipe", back_populates="shared_with")
    user = relationship("User")

class Rating(Base):
    __tablename__ = "ratings"
    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, nullable=False)

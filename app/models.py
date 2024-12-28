from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    preferences = Column(Text)  # Can be a JSON field for dietary preferences
    
    recipes = relationship('Recipe', back_populates='owner')

class Recipe(Base):
    __tablename__ = 'recipes'
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    instructions = Column(Text)
    preparation_time = Column(Integer)
    cooking_time = Column(Integer)
    category = Column(String)
    
    image_url = Column(String)
    rating = Column(Float, default=0.0)
    user_id = Column(Integer, ForeignKey('users.id'))
    category_id = Column(Integer, ForeignKey('categories.id'))
    created_at = Column(DateTime, server_default=func.now())
    
    owner = relationship('User', back_populates='recipes')
    category = relationship('Category', back_populates='recipes')
    ingredients = relationship('Ingredient', back_populates='recipe')  # Relationship to ingredients
    steps = relationship('PreparationStep', back_populates='recipe')
    tags = relationship('Tag', secondary='recipe_tags', back_populates='recipes')

class Ingredient(Base):
    __tablename__ = 'ingredients'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    quantity = Column(Float)
    unit = Column(String)
    recipe_id = Column(Integer, ForeignKey('recipes.id'))
    
    recipe = relationship('Recipe', back_populates='ingredients')

class PreparationStep(Base):
    __tablename__ = 'preparation_steps'
    
    id = Column(Integer, primary_key=True, index=True)
    step_number = Column(Integer)
    instruction = Column(Text)
    recipe_id = Column(Integer, ForeignKey('recipes.id'))
    
    recipe = relationship('Recipe', back_populates='steps')

class Category(Base):
    __tablename__ = 'categories'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    
    recipes = relationship('Recipe', back_populates='category')

class Tag(Base):
    __tablename__ = 'tags'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    
    recipes = relationship('Recipe', secondary='recipe_tags', back_populates='tags')

class RecipeTag(Base):
    __tablename__ = 'recipe_tags'
    
    recipe_id = Column(Integer, ForeignKey('recipes.id'), primary_key=True)
    tag_id = Column(Integer, ForeignKey('tags.id'), primary_key=True)

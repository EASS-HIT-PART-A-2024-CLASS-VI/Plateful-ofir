from pydantic import BaseModel, ConfigDict
from typing import Optional
from sqlalchemy import Column, Integer, String, JSON
from sqlalchemy.orm import relationship
from models.base import Base

class UserProfile(BaseModel):
    id: int
    username: str
    preferences: Optional[str] = None

    # Update to use the new `ConfigDict` for compatibility
    model_config = ConfigDict(from_attributes=True)

class UserCreate(BaseModel):
    username: str
    preferences: Optional[str] = None


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    dietary_preferences = Column(JSON, nullable=True)

    recipes = relationship("Recipe", back_populates="creator") 
    shopping_lists = relationship("ShoppingList", back_populates="user")

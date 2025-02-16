from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional
from sqlalchemy import Column, Integer, String, JSON, Date
from sqlalchemy.orm import relationship
from models.base import Base

class UserProfile(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str
    email: EmailStr
    birthdate: Optional[str] = None
    gender: Optional[str] = None
    phone_number: Optional[str] = None
    preferences: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class User(Base):
    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)  
    last_name = Column(String, nullable=False)  
    username = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    birthdate = Column(Date, nullable=True) 
    gender = Column(String, nullable=True)  
    phone_number = Column(String, nullable=True) 
    password_hash = Column(String, nullable=False)  
    dietary_preferences = Column(JSON, nullable=True)

    recipes = relationship("Recipe", back_populates="creator") 
    shopping_lists = relationship("ShoppingList", back_populates="user")

class UserCreate(BaseModel):
    username: str
    first_name: str
    last_name: str
    email: EmailStr
    password: str  
    birthdate: Optional[str] = None
    gender: Optional[str] = None
    phone_number: Optional[str] = None
    dietary_preferences: Optional[list[str]] = None

    model_config = ConfigDict(from_attributes=True)

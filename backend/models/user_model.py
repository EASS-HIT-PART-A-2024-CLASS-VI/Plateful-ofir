from pydantic import BaseModel, ConfigDict
from typing import Optional
from sqlalchemy import Column, Integer, String
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

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    preferences = Column(String, nullable=True)

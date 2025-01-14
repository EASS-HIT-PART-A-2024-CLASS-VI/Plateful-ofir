from pydantic import BaseModel
from typing import Optional

class UserProfile(BaseModel):
    id: int
    username: str
    preferences: Optional[str] = None

    class Config:
        orm_mode = True

class UserCreate(BaseModel):
    username: str
    preferences: Optional[str] = None

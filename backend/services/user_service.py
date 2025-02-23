from sqlalchemy.orm import Session
from models.recipe_model import Recipe
from models.user_model import  User
from passlib.context import CryptContext

from typing import List

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Function to create a user profile
def create_user(db: Session, user_data):
    hashed_password = pwd_context.hash(user_data["password"])  
    user_data["password_hash"] = hashed_password  
    del user_data["password"]
    user = User(**user_data)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# Function to get recipes that match the user's preferences
def get_user_recipes(db: Session, username: str) -> List[Recipe]:
    user = db.query(User).filter(User.username == username).first()
    if user:
        return db.query(Recipe).filter(Recipe.categories == user.preferences).all()
    return []

from sqlalchemy.orm import Session
from models.recipe_model import Recipe
from models.user_model import UserProfile

from typing import List

# Function to create a user profile
def create_user(db: Session, user_data):
    user = UserProfile(**user_data.dict())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# Function to get recipes that match the user's preferences
def get_user_recipes(db: Session, username: str) -> List[Recipe]:
    user = db.query(UserProfile).filter(UserProfile.username == username).first()
    if user:
        return db.query(Recipe).filter(Recipe.categories == user.preferences).all()
    return []

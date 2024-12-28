from sqlalchemy.orm import Session
from .models import Recipe, UserProfile, Ingredient

# יצירת מתכון
def create_recipe(db: Session, recipe_data):
    recipe = Recipe(**recipe_data)
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return recipe

# יצירת משתמש
def create_user(db: Session, user_data):
    user = UserProfile(**user_data)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# קריאת כל המתכונים
def get_recipes(db: Session, skip: int = 0, limit: int = 10):
    return db.query(Recipe).offset(skip).limit(limit).all()

# קריאת משתמש לפי שם
def get_user_by_username(db: Session, username: str):
    return db.query(UserProfile).filter(UserProfile.username == username).first()

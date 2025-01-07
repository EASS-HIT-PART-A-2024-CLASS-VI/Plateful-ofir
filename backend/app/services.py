from sqlalchemy.orm import Session
from models import Recipe, NutritionalInfo, UserProfile, Ingredient
from typing import List, Optional
from fastapi import UploadFile, File
import os
from fastapi.responses import FileResponse

# Calculate nutritional information based on ingredients
def calculate_nutritional_info(ingredients: List[Ingredient]) -> NutritionalInfo:
    total_calories = 0
    total_protein = 0
    total_fat = 0
    total_carbs = 0
    for ingredient in ingredients:
        # Calculation based on the nutritional data of each ingredient
        total_calories += ingredient.calories  # If the data exists in the model
        total_protein += ingredient.protein
        total_fat += ingredient.fat
        total_carbs += ingredient.carbs

    return NutritionalInfo(calories=total_calories, protein=total_protein, fat=total_fat, carbs=total_carbs)

# Filter recipes by category and tags
def filter_recipes(db: Session, category: Optional[str] = None, tag: Optional[str] = None) -> List[Recipe]:
    query = db.query(Recipe)
    
    if category:
        query = query.filter(Recipe.categories == category)  # Filter by category if provided
    
    if tag:
        query = query.filter(Recipe.tags.like(f"%{tag}%"))  # Filter by tag if provided
    
    return query.all()  # Return the filtered list of recipes

# Create a user profile and store it in the database
def create_user(db: Session, profile: UserProfile):
    db.add(profile)  # Add the user profile to the session
    db.commit()  # Commit the transaction to the database
    db.refresh(profile)  # Refresh the profile instance with the updated data
    return {"message": f"User {profile.username} created successfully!"}

# Get recipes that match the user's preferences
def get_user_recipes(db: Session, username: str) -> List[Recipe]:
    user = db.query(UserProfile).filter(UserProfile.username == username).first()  # Find the user by username
    if user:
        # Filter recipes based on the user's preferences (e.g., category)
        return db.query(Recipe).filter(Recipe.categories == user.preferences).all()
    return []  # If no user found, return an empty list

# Image management (saving and retrieving images)
UPLOAD_DIR = "images"  # Directory where images will be stored

# Save an uploaded image to the server
async def upload_image(file: UploadFile = File(...)):
    try:
        if not os.path.exists(UPLOAD_DIR):  # Check if the directory exists
            os.makedirs(UPLOAD_DIR)  # Create the directory if it doesn't exist
        file_location = os.path.join(UPLOAD_DIR, file.filename)  # Define the file location
        with open(file_location, "wb") as image_file:
            image_file.write(await file.read())  # Write the image data to a file
        return {"message": f"Image saved at {file_location}"}  # Return the success message
    except Exception as e:
        return {"error": str(e)}  # If an error occurs, return the error message

# Retrieve an image from the server
def get_image(image_name: str):
    try:
        file_location = os.path.join(UPLOAD_DIR, image_name)  # Define the file location
        if os.path.exists(file_location):  # Check if the image file exists
            return FileResponse(file_location)  # Return the image as a response
        return {"message": "Image not found"}  # If the image doesn't exist, return a message
    except Exception as e:
        return {"error": str(e)}  # If an error occurs, return the error message

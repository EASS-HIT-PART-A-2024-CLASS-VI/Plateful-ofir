from models import Recipe, NutritionalInfo, UserProfile,Ingredient
from typing import List, Optional

# חישוב הערכים התזונתיים
def calculate_nutritional_info(ingredients: List[Ingredient]) -> NutritionalInfo:
    total_calories = 0
    total_protein = 0
    total_fat = 0
    total_carbs = 0
    for ingredient in ingredients:
        # חישוב לדוגמה. תוכל להוסיף יותר פרמטרים.
        total_calories += 50
        total_protein += 2
        total_fat += 1
        total_carbs += 10

    return NutritionalInfo(calories=total_calories, protein=total_protein, fat=total_fat, carbs=total_carbs)

# סינון מתכונים לפי קטגוריות ותגיות
def filter_recipes(category: Optional[str] = None, tag: Optional[str] = None) -> List[Recipe]:
    # כאן אתה יכול לסנן את המתכונים לפי הקטגוריה או התגית (שזה יהיה מתוך רשימה או DB)
    # לדוגמה, החזרת רשימת מתכונים
    filtered_recipes = []  # השאר את זה כאן לדוגמה
    return filtered_recipes

# יצירת פרופיל משתמש
def create_user(profile: UserProfile):
    # פה תוכל לשמור את המשתמש בבסיס נתונים או רשימה
    return {"message": f"User {profile.username} created successfully!"}

# הצגת מתכונים למשתמש
def get_user_recipes(username: str):
    # כאן תוכל לשים לוגיקה על פי העדפות המשתמש
    return []  # כאן תוכל להחזיר מתכונים שמותאמים למשתמש

import sys
import os

# הוספת הנתיב של התיקייה הראשית כדי שהייבוא יעבוד
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from models.recipe_model import Recipe, Ingredient, NutritionalInfo
from models.user_model import User
from db.database import SessionLocal, init_db
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def load_seed_data(db: Session):
    try:
        print("Starting seed data loading process...")
        
        # אתחול מסד הנתונים אם הוא לא מאותחל
        init_db()

        # בדיקה אם יש כבר משתמש אדמין
        admin_user = db.query(User).filter(User.email == "admin@plateful.com").first()
        if not admin_user:
            hashed_password = pwd_context.hash("admin123")
            admin_user = User(
                username="admin",
                email="admin@plateful.com",
                password_hash=hashed_password,
                first_name="Admin",
                last_name="User"
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print("✅ Admin user created successfully")

        # בדיקה אם יש כבר מתכונים
        recipe_count = db.query(Recipe).count()
        if recipe_count >= 5:
            print(f"✅ Database already has {recipe_count} recipes. Skipping seed data.")
            return

        # יצירת מתכוני ברירת מחדל
        seed_recipes = [
            {
                "name": "פסטה ברוטב עגבניות",
                "preparation_steps": "לבשל פסטה ולהוסיף רוטב",
                "cooking_time": 25,
                "servings": 4,
                "categories": "איטלקי",
                "tags": "צמחוני,פסטה",
                "image_url": "/static/default-recipe.jpg",
                "ingredients": [
                    {"name": "פסטה", "quantity": 500, "unit": "גרם"},
                    {"name": "רוטב עגבניות", "quantity": 400, "unit": "מ\"ל"}
                ],
                "nutritional_info": {
                    "calories": 450,
                    "protein": 12,
                    "carbs": 65,
                    "fats": 15
                }
            }
        ]

        # הוספת מתכונים למסד הנתונים
        for recipe_data in seed_recipes:
            new_recipe = Recipe(
                name=recipe_data["name"],
                preparation_steps=recipe_data["preparation_steps"],
                cooking_time=recipe_data["cooking_time"],
                servings=recipe_data["servings"],
                categories=recipe_data["categories"],
                tags=recipe_data["tags"],
                creator_id=admin_user.id,
                image_url=recipe_data["image_url"]
            )
            db.add(new_recipe)
            db.flush()  # לקבלת ID של המתכון

            for ingredient in recipe_data["ingredients"]:
                new_ingredient = Ingredient(
                    name=ingredient["name"],
                    quantity=ingredient["quantity"],
                    unit=ingredient["unit"],
                    recipe_id=new_recipe.id
                )
                db.add(new_ingredient)

            nutrition = recipe_data["nutritional_info"]
            new_nutrition = NutritionalInfo(
                recipe_id=new_recipe.id,
                calories=nutrition["calories"],
                protein=nutrition["protein"],
                carbs=nutrition["carbs"],
                fats=nutrition["fats"]
            )
            db.add(new_nutrition)

        db.commit()
        print("✅ Seed data loaded successfully!")

    except Exception as e:
        print(f"❌ Error loading seed data: {str(e)}")
        db.rollback()
        raise

def main():
    db = SessionLocal()
    try:
        load_seed_data(db)
    finally:
        db.close()

if __name__ == "__main__":
    main()

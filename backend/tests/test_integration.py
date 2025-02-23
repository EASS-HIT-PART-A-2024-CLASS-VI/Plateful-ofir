import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from main import app, get_db
from models.base import Base
from models.user_model import User
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone

# ✅ יצירת מסד נתונים יציב (SQLite בקובץ במקום `:memory:`)
DATABASE_URL = "sqlite:///./test_db.sqlite"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# ✅ יצירת כל הטבלאות לפני הכל
Base.metadata.create_all(bind=engine)

# ✅ שימוש במסד נתונים קבוע בתוך FastAPI
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


# ✅ יצירת טבלאות פעם אחת **לפני כל הבדיקות**
@pytest.fixture(scope="session", autouse=True)
def setup_db():
    """✅ מבטיח שכל הבדיקות ירוצו עם טבלאות תקינות"""
    Base.metadata.create_all(bind=engine)  # ✅ חובה לפני הבדיקות
    yield
    Base.metadata.drop_all(bind=engine)  # ✅ מחיקת מסד הנתונים לאחר הבדיקות

def override_get_db():
    """מאפשר שימוש במסד הנתונים המתאים בזמן הבדיקות"""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

app.dependency_overrides[get_db] = override_get_db


# ✅ חיבור תקין למסד נתונים בבדיקות
@pytest.fixture(scope="function")
def test_db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session  # ✅ מחזיר את ה-Session לבדיקה

    session.close()
    transaction.rollback()
    connection.close()

# ✅ בדיקות אינטגרציה
class TestIntegration:
    def test_check_users_table_exists(self, test_db: Session):
        """בדיקה שהטבלה 'users' קיימת במסד הנתונים"""
        result = test_db.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")).fetchall()
        assert len(result) > 0, "❌ users table לא קיימת במסד הנתונים"

    def test_complete_recipe_flow(self, test_db: Session):
        """✅ בדיקה מלאה של יצירת משתמש, יצירת מתכון, עדכון ושליפה"""

        # ✅ לוודא שהטבלה קיימת לפני רישום המשתמש
        assert test_db.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")).fetchall(), "❌ users table לא קיימת!"

        # 1️⃣ **רישום משתמש חדש**
        register_response = client.post(
            "/register",
            json={
                "username": "testchef",
                "email": "chef@test.com",
                "password": "test123",
                "first_name": "Test",
                "last_name": "Chef"
            }
        )
        print(f"📥 Registration response: {register_response.json()}")  # ✅ Debugging

        assert register_response.status_code in [200, 201], f"❌ Registration failed: {register_response.json()}"

        # 2️⃣ **שליפת המשתמש כדי לוודא שנוסף למסד הנתונים**
        user = test_db.query(User).filter(User.email == "chef@test.com").first()
        assert user is not None, "❌ User was not created in database"

        # 3️⃣ **התחברות וקבלת טוקן**
        login_response = client.post(
            "/login",
            json={"email": "chef@test.com", "password": "test123"}  # ✅ לוודא שמשתמשים ב- `email`
        )

        # ✅ הדפסה למעקב אחרי הבעיה
        print(f"📥 Login response: {login_response.json()}")

        assert login_response.status_code == 200, f"❌ Login failed: {login_response.json()}"

        token = login_response.json().get("token")  # ✅ שינוי `access_token` ל- `token`

        # ✅ אם אין טוקן, נדפיס את כל התגובה
        if not token:
            print(f"❌ No token received! Full response: {login_response.json()}")

        assert token, "❌ No token received"

        # ✅ יצירת `headers` עם הטוקן
        headers = {"Authorization": f"Bearer {token}"}  # ✅ תיקון השגיאה!

        # 4️⃣ **יצירת מתכון**
        recipe_data = {
            "name": "עוגת שוקולד",
            "preparation_steps": "1. ערבב. 2. אפה.",  # ✅ הפיכת רשימה למחרוזת
            "cooking_time": 45,
            "servings": 8,
            "categories": "Dessert",  # ✅ הפיכת רשימה למחרוזת
            "tags": "Sweet",  # ✅ הפיכת רשימה למחרוזת
            "creator_id": str(user.id),  # ✅ צריך להיות מחרוזת כי `Form(...)`
            "ingredients": json.dumps([
                {"name": "שוקולד", "quantity": 100, "unit": "גרם"},
                {"name": "קמח", "quantity": 200, "unit": "גרם"}
            ]),  # ✅ המרנו `dict` ל- `json.dumps()`
            "timers": json.dumps([
                {"step_number": 1, "duration": 10, "label": "ערבוב"},
                {"step_number": 2, "duration": 20, "label": "אפייה"}
            ])  # ✅ המרנו `dict` ל- `json.dumps()`
        }

        # ✅ שליחת הנתונים כ- `data` במקום `json`
        create_response = client.post(
            "/recipes/",
            data=recipe_data,  # ✅ `data` במקום `json`
            headers=headers,  
            files={}  # ✅ חובה להוסיף כדי ש- FastAPI ידע שהבקשה עם `Form`
        )

        assert create_response.status_code == 200, f"❌ Recipe creation failed: {create_response.json()}"

        recipe_id = create_response.json().get("recipe_id")
        assert recipe_id, "❌ No recipe ID received"

        # 5️⃣ **בדיקת המתכון שנוצר**
        get_response = client.get(f"/recipes/{recipe_id}")
        assert get_response.status_code == 200, f"❌ Failed to fetch recipe: {get_response.json()}"
        assert get_response.json()["name"] == "עוגת שוקולד"

        # 6️⃣ **עדכון המתכון**
        update_data = {
            "name": "עוגת שוקולד מיוחדת",
            "preparation_steps": "1. לערבב 2. לאפות",  # ✅ הפיכת רשימה למחרוזת
            "cooking_time": 50,
            "servings": 8,
            "categories": "Dessert",  # ✅ הפיכת רשימה למחרוזת
            "tags": "Sweet",  # ✅ הפיכת רשימה למחרוזת
            "ingredients": json.dumps([
                {"name": "שוקולד", "quantity": 100, "unit": "גרם"},
                {"name": "קמח", "quantity": 200, "unit": "גרם"}
            ]),  # ✅ הפיכת `dict` למחרוזת JSON
            "current_user_id": str(user.id)  # ✅ ודא ששולחים את ה-ID של המשתמש
        }
        update_response = client.put(
            f"/recipes/{recipe_id}",
            data=update_data,  # ✅ שולח את הנתונים בפורמט `Form(...)`
            headers=headers,
            files={}  
        )
        assert update_response.status_code == 200, f"❌ Recipe update failed: {update_response.json()}"

        # 7️⃣ **הוספת תגובה למתכון**
        comment_data = {
            "user_id": user.id,
            "username": user.username,
            "content": "מתכון מעולה!"
        }
        comment_response = client.post(
            f"/recipes/{recipe_id}/comment",
            json=comment_data,
            headers=headers
        )
        assert comment_response.status_code == 200, f"❌ Failed to add comment: {comment_response.json()}"

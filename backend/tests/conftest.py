import sys
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# הוספת הנתיב של backend לרשימת הנתיבים של Python
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models.base import Base

# ✅ הגדרת מנוע מסד נתונים אחד בלבד
DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    """יוצר את כל הטבלאות במסד הנתונים לפני הרצת הבדיקות"""
    print("✅ יצירת מסד נתונים זמני ב-SQLite")
    Base.metadata.create_all(bind=engine)  # ✅ יצירת כל הטבלאות במסד הנתונים
    yield
    print("🗑️ מחיקת מסד הנתונים אחרי הבדיקות")
    Base.metadata.drop_all(bind=engine)  # ✅ מחיקת הנתונים לאחר הבדיקות


@pytest.fixture(scope="function")
def db_session():
    """יוצר `Session` זמנית לבדיקה ומבטל שינויים לאחר הבדיקה"""
    session = TestingSessionLocal()
    yield session
    session.rollback()
    session.close()


@pytest.fixture(scope="function")
def test_db(db_session):
    """Alias ל- `db_session` כדי להתאים לבדיקות קיימות"""
    yield db_session

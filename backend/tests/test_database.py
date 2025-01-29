# tests/test_database.py
import pytest
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from models.base import Base
from db.database import get_db, init_db as real_init_db
from unittest.mock import patch

# Use SQLite for testing
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture
def test_db():
    # Create test database
    engine = create_engine(TEST_SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    
    # Create test session
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_get_db(test_db):
    db = next(get_db())
    assert db is not None
    db.close()

def test_init_db(test_db):
    with patch('db.database.SQLALCHEMY_DATABASE_URL', TEST_SQLALCHEMY_DATABASE_URL):
        with patch('db.database.engine', create_engine(TEST_SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})):
            real_init_db()
            # Verify that tables were created
            inspector = inspect(create_engine(TEST_SQLALCHEMY_DATABASE_URL))
            tables = inspector.get_table_names()
            assert "recipes" in tables
            assert "users" in tables
            assert "ingredients" in tables
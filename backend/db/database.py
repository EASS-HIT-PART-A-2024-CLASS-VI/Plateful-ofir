from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.base import Base
import os

# Get the database URL from environment or default to a local SQLite database.
def get_database_url():
    return os.getenv("DATABASE_URL", "sqlite:///./app.db")

# Create a SQLAlchemy engine with special settings for SQLite if needed.
def create_db_engine(database_url=None):
    if database_url is None:
        database_url = get_database_url()
    
    connect_args = {}
    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        
    return create_engine(database_url, connect_args=connect_args)

# Use Docker's service name for connecting to PostgreSQL.
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:password123@postgres:5432/plateful"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency for providing a database session.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize the database by creating all tables.
def init_db():
    Base.metadata.create_all(bind=engine)

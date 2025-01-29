from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.base import Base
from sqlalchemy import create_engine
import os

def get_database_url():
    return os.getenv("DATABASE_URL", "sqlite:///./app.db")

def create_db_engine(database_url=None):
    if database_url is None:
        database_url = get_database_url()
    
    connect_args = {}
    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        
    return create_engine(database_url, connect_args=connect_args)
# Update the database URL to use the Docker service name
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:password123@postgres:5432/plateful"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
def init_db():
    Base.metadata.create_all(bind=engine)

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.models.recipe_model import Base  # Import Base from the recipe model (or user model)

# Update the database URL to use the Docker service name
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:password123@postgres:5432/plateful"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables if they do not exist
Base.metadata.create_all(bind=engine)

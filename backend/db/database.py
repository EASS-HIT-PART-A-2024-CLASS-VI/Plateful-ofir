from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.base import Base

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
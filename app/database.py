from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


# Update the database URL to use the Docker service name
DATABASE_URL = "postgresql://postgres:password123@postgres:5432/plateful"

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create the sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declare a base class for your models
Base = declarative_base()

# Function to create the database tables (run this once)
def create_db():
    Base.metadata.create_all(bind=engine)


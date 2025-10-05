# database.py - creates the database

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# creates the engine (connection to the database)
SQLALCHEMY_DATABASE_URL = "sqlite:///./transfer.db"  # local file database

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # only for SQLite
)

# creates a session factory (manages connections)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# creates a base class for all ORM models
Base = declarative_base()

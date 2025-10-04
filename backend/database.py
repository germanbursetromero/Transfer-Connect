from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1️⃣ Create the engine (connection to the database)
SQLALCHEMY_DATABASE_URL = "sqlite:///./transfer.db"  # local file database
# If you were using Postgres or MySQL, you'd change this URL

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # only for SQLite
)

# 2️⃣ Create a session factory (manages connections)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3️⃣ Create a base class for all ORM models
Base = declarative_base()

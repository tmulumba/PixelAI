from databases import Database
from sqlalchemy import create_engine, MetaData
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('app/core/.env.local')

# Get database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in environment variables.")

# Create Database instance
database = Database(DATABASE_URL)

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create MetaData instance
metadata = MetaData()

# Function to get database connection
async def get_database() -> Database:
    return database

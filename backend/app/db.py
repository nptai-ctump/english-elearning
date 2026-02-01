"""
Database configuration and utilities
- SQLAlchemy engine setup
- Session management
- Base model declaration
"""

import os
from pathlib import Path
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.pool import StaticPool
from typing import Generator
import logging

# ==================== CONFIGURATION ====================

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get database URL from environment or use default
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# ==================== DATABASE PATH HANDLING ====================

def get_database_path() -> str:
    """
    Get absolute path for SQLite database
    Avoids issues when running from different directories
    """
    if DATABASE_URL.startswith("sqlite:///"):
        # Extract relative path
        relative_path = DATABASE_URL.replace("sqlite:///", "")
        
        # Convert to absolute path
        if not relative_path.startswith("/"):
            # Relative path - make it absolute from project root
            project_root = Path(__file__).parent.parent
            absolute_path = (project_root / relative_path).resolve()
            return f"sqlite:///{absolute_path}"
    
    return DATABASE_URL


# ==================== ENGINE CONFIGURATION ====================

# Get proper database URL
DB_URL = get_database_path()

# Configure connection arguments based on database type
if DB_URL.startswith("sqlite"):
    connect_args = {
        "check_same_thread": False,
        "timeout": 15  # Increase timeout for SQLite
    }
    # Use StaticPool for SQLite in testing/development
    poolclass = StaticPool if "test" in os.environ.get("ENV", "") else None
else:
    connect_args = {}
    poolclass = None

# Create engine
engine = create_engine(
    DB_URL,
    connect_args=connect_args,
    poolclass=poolclass,
    pool_pre_ping=True,  # Check connection validity before using
    echo=False  # Set to True for SQL query logging in development
)

# Log database connection info
logger.info(f"Database URL: {DB_URL}")
logger.info(f"Using {'SQLite' if 'sqlite' in DB_URL else 'PostgreSQL/MySQL'}")

# ==================== SESSION FACTORY ====================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

# ==================== BASE MODEL ====================

Base = declarative_base()

# ==================== DEPENDENCY ====================

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency for database session
    Ensures proper session cleanup
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


# ==================== UTILITY FUNCTIONS ====================

def get_db_sync() -> Session:
    """
    Get database session for synchronous operations (scripts, tests)
    Remember to close manually: db.close()
    """
    return SessionLocal()


def init_db():
    """
    Initialize database - create all tables
    Safe to call multiple times (idempotent)
    """
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✓ Database tables created/verified")
    except Exception as e:
        logger.error(f"✗ Error initializing database: {e}")
        raise


def reset_db():
    """
    Drop and recreate all tables (DANGEROUS - dev only)
    """
    if os.getenv("ENV") != "development":
        raise Exception("Reset only allowed in development environment")
    
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    logger.info("✓ Database reset complete")


# ==================== SQLITE FOREIGN KEY SUPPORT ====================

if DB_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        """
        Enable foreign key constraints for SQLite
        """
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


# ==================== DEBUG/TEST ====================

if __name__ == "__main__":
    """
    Test database connection
    Run: python -m app.db
    """
    print("=" * 50)
    print("Testing Database Connection...")
    print("=" * 50)
    
    try:
        # Initialize database
        init_db()
        
        # Test connection
        db = get_db_sync()
        result = db.execute("SELECT sqlite_version()" if "sqlite" in DB_URL else "SELECT version()")
        version = result.scalar()
        
        print(f"✓ Database connected successfully")
        print(f"✓ Database version: {version}")
        print(f"✓ Database path: {DB_URL}")
        
        db.close()
        
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        exit(1)
    
    print("=" * 50)
    print("✓ All tests passed!")
    print("=" * 50)
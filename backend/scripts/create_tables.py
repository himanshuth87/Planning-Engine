"""Create database tables (run once)."""
from app.database import engine, Base
from app.models import *  # noqa: F401, F403

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

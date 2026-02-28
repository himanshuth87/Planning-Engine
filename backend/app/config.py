"""Application configuration."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./production_planning.db"
    API_PREFIX: str = "/api"
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

    def get_database_url(self) -> str:
        # SQLAlchemy requires 'postgresql://', not 'postgres://'
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        # SQLAlchemy requires 'mysql+pymysql://' for PyMySQL driver (easier to install)
        elif url.startswith("mysql://"):
            url = url.replace("mysql://", "mysql+pymysql://", 1)
        return url

settings = Settings()

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # PostgreSQL — same DB as Spring Boot
    db_host: str = "localhost"
    db_port: int = 55432
    db_name: str = "dbaqyldy"
    db_user: str = "aqsa"
    db_pass: str = ""

    # Google Gemini (for chatbot)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # JWT — must match Spring Boot's app.jwt.secret
    jwt_secret: str = "dev-secret-at-least-32-chars-long!!"
    jwt_algorithm: str = "HS256"

    # Service
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = False
    cors_allowed_origins: str = "http://localhost:3000,http://localhost:8080,http://localhost:8081,http://10.0.2.2:8000,http://10.0.2.2:8080,http://localhost:19006"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_pass}@{self.db_host}:{self.db_port}/{self.db_name}"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

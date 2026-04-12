from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # PostgreSQL — same DB as Spring Boot
    db_host: str = "localhost"
    db_port: int = 55432
    db_name: str = "dbaqyldy"
    db_user: str = "aqsa"
    db_pass: str = "aqyldysebet123"

    # Google Gemini (for chatbot)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # Service
    host: str = "0.0.0.0"
    port: int = 8000

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_pass}@{self.db_host}:{self.db_port}/{self.db_name}"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

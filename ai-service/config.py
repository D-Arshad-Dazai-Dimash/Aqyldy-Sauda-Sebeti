import os
import logging

from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # PostgreSQL — same DB as Spring Boot
    db_host: str = "localhost"
    db_port: int = 55432
    db_name: str = "dbaqyldy"
    db_user: str = "aqsa"
    db_pass: str = ""
    # Optional full DB URL override (Spring Boot style "jdbc:postgresql://host:port/db?...").
    # Useful on DigitalOcean App Platform where Spring Boot already gets DB_URL.
    db_url: str = ""

    # Groq (primary LLM provider for the chatbot).
    # Get a free key at https://console.groq.com/keys.
    groq_api_key: str = ""
    # Default to llama-3.3-70b-versatile — fast, generous free tier, good
    # multilingual quality for KK / RU / EN. Override via env var if needed.
    groq_model: str = "llama-3.3-70b-versatile"
    groq_base_url: str = "https://api.groq.com/openai/v1"

    # Legacy Google Gemini settings — kept for backward compatibility but no
    # longer used by default. Remove from your env vars to fully cut over.
    gemini_api_key: str = ""
    google_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash-latest"

    # JWT — must match Spring Boot's app.jwt.secret
    jwt_secret: str = "dev-secret-at-least-32-chars-long!!"
    jwt_algorithm: str = "HS256"
    # When true, chat endpoints skip JWT verification — handy for debugging on
    # DigitalOcean if Spring Boot's JWT_SECRET and the AI service's JWT_SECRET
    # accidentally diverge.
    auth_required: bool = True

    # Service
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = False
    cors_allowed_origins: str = "http://localhost:3000,http://localhost:8080,http://localhost:8081,http://10.0.2.2:8000,http://10.0.2.2:8080,http://localhost:19006,*"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]

    @property
    def effective_groq_api_key(self) -> str:
        return (self.groq_api_key or "").strip()

    @property
    def effective_gemini_api_key(self) -> str:
        """Return whichever of the two well-known env vars is populated."""
        return (self.gemini_api_key or self.google_api_key or "").strip()

    @property
    def llm_provider(self) -> str:
        if self.effective_groq_api_key:
            return "groq"
        if self.effective_gemini_api_key:
            return "gemini"
        return "none"

    @property
    def llm_ready(self) -> bool:
        return self.llm_provider != "none"

    @property
    def llm_model(self) -> str:
        provider = self.llm_provider
        if provider == "groq":
            return self.groq_model
        if provider == "gemini":
            return self.gemini_model
        return ""

    @property
    def database_url(self) -> str:
        # Prefer a fully-qualified URL when supplied.
        raw = (self.db_url or os.environ.get("DATABASE_URL") or "").strip()
        if raw:
            # Spring Boot style starts with "jdbc:" — strip it for SQLAlchemy.
            if raw.startswith("jdbc:"):
                raw = raw[len("jdbc:"):]
            # SQLAlchemy needs the postgresql+psycopg2:// scheme but plain
            # postgresql:// also works. Inject credentials if missing.
            if raw.startswith("postgresql://") and "@" not in raw.split("//", 1)[1]:
                tail = raw.split("//", 1)[1]
                if self.db_user:
                    auth = f"{self.db_user}:{self.db_pass}" if self.db_pass else self.db_user
                    raw = f"postgresql://{auth}@{tail}"
            return raw
        return f"postgresql://{self.db_user}:{self.db_pass}@{self.db_host}:{self.db_port}/{self.db_name}"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Boot-time diagnostics so it is obvious from the DigitalOcean logs whether
# the API key was picked up or not.
_provider = settings.llm_provider
if _provider == "groq":
    _key = settings.effective_groq_api_key
    logger.info(
        "Groq API key configured (length=%d, suffix=...%s, model=%s)",
        len(_key), _key[-4:] if len(_key) >= 4 else "?", settings.groq_model,
    )
elif _provider == "gemini":
    _key = settings.effective_gemini_api_key
    logger.warning(
        "Falling back to legacy Gemini provider (length=%d, suffix=...%s, model=%s) — "
        "set GROQ_API_KEY to switch to the new provider.",
        len(_key), _key[-4:] if len(_key) >= 4 else "?", settings.gemini_model,
    )
else:
    logger.error(
        "❌ NO GROQ_API_KEY (or legacy GEMINI_API_KEY) configured — chatbot "
        "will fall back to rule-based answers and the /api/ai/chat endpoint "
        "will return generic responses. Set GROQ_API_KEY in the AI service "
        "env vars on DigitalOcean App Platform to fix this. Free key: "
        "https://console.groq.com/keys"
    )

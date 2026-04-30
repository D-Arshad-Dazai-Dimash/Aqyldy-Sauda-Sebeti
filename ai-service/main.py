"""
Aqyldy Sauda Sebeti — AI Microservice
Provides: Product Recommendations, Price Trends, AI Chatbot
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import recommendations, price_trends, chatbot

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

app = FastAPI(
    title="Aqyldy Sebeti AI Service",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

# CORS — same origins as Spring Boot + allow Spring Boot itself
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendations.router)
app.include_router(price_trends.router)
app.include_router(chatbot.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service"}


@app.get("/api/ai/health")
def ai_health():
    """
    Detailed readiness probe meant for the mobile app and ops dashboards.

    Tells the caller which LLM provider will be used (Groq preferred, Gemini
    legacy fallback) or whether the chatbot is going to fall back to
    rule-based answers. Keeps the legacy `gemini_*` keys so older builds of
    the mobile app keep working without an immediate update.
    """
    return {
        "status": "ok",
        "service": "ai-service",
        "llm_ready": settings.llm_ready,
        "llm_provider": settings.llm_provider,
        "llm_model": settings.llm_model,
        # Backward-compat aliases used by older app builds.
        "gemini_ready": settings.llm_ready,
        "gemini_model": settings.llm_model,
        "auth_required": settings.auth_required,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=settings.reload)

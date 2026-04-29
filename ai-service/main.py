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

    Tells the caller whether Gemini will actually be used (key set) or
    whether the chatbot is going to fall back to rule-based answers. The
    frontend uses this to render an honest "AI temporarily unavailable"
    banner instead of pretending the bot is broken.
    """
    key = settings.effective_gemini_api_key
    return {
        "status": "ok",
        "service": "ai-service",
        "gemini_ready": bool(key),
        "gemini_model": settings.gemini_model,
        "auth_required": settings.auth_required,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=settings.reload)

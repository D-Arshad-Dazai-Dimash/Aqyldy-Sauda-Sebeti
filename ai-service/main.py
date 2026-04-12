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
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://10.0.2.2:8000",
        "http://10.0.2.2:8080",
        "http://localhost:19006",
    ],
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)

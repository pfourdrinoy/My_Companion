import httpx
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .models import User, Dog
from .routes.dogs import router as dogs_router 
from .routes.user import router as user_router 
from .routes.exercises import router as exercises_router
from .routes.ai import router as ai_router
from .routes.vocabulary import router as vocabulary_router
import spacy

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

app = FastAPI(title="My Companion API")
Base.metadata.create_all(bind=engine)
app.include_router(dogs_router, prefix="/dogs", tags=["Dogs"])
app.include_router(user_router, prefix="/user", tags=["User"])
app.include_router(exercises_router, prefix="/exercises", tags=["Exercises"])
app.include_router(ai_router, prefix="/ai", tags=["AI"])
app.include_router(vocabulary_router, prefix="/vocabulary", tags=["Vocabulary"])

@app.on_event("startup")
async def startup_event():
    spacy.load("fr_core_news_sm")
    spacy.load("es_core_news_sm")
    spacy.load("de_core_news_sm")

    async with httpx.AsyncClient() as client:
        await client.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": "zongwei/gemma3-translator:4b",
                "prompt": "hello warmup",
                "stream": False
            },
            timeout=120.0
        )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Autorise tous les domaines (à remplacer par ton domaine en production)
    allow_credentials=True,
    allow_methods=["*"],  # Autorise toutes les méthodes (GET, POST, etc.)
    allow_headers=["*"],  # Autorise tous les headers
)

@app.get("/test", response_model=str)
def test():
    return "Ceci est un test"
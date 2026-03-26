import logging
import httpx
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes.dogs import router as dogs_router
from .routes.user import router as user_router
from .routes.exercises import router as exercises_router
from .routes.ai import router as ai_router
from .routes.vocabulary import router as vocabulary_router
import spacy

logger = logging.getLogger(__name__)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

app = FastAPI(title="My Companion API")
Base.metadata.create_all(bind=engine)

app.include_router(dogs_router,       prefix="/dogs",       tags=["Dogs"])
app.include_router(user_router,       prefix="/user",       tags=["User"])
app.include_router(exercises_router,  prefix="/exercises",  tags=["Exercises"])
app.include_router(ai_router,         prefix="/ai",         tags=["AI"])
app.include_router(vocabulary_router, prefix="/vocabulary", tags=["Vocabulary"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    # Préchargement des modèles spaCy — silencieux si un modèle est absent
    for model in ("fr_core_news_sm", "es_core_news_sm", "de_core_news_sm"):
        try:
            spacy.load(model)
        except OSError:
            logger.warning("spaCy model '%s' not found at startup.", model)

    # FIX: warmup Ollama sans bloquer/crasher l'API si Ollama n'est pas encore prêt
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": "zongwei/gemma3-translator:4b", "prompt": "hello warmup", "stream": False},
                timeout=120.0,
            )
        logger.info("Ollama warmup successful.")
    except Exception as e:
        logger.warning("Ollama warmup failed (will retry on first request): %s", e)


@app.get("/test", response_model=str)
def test():
    return "Ceci est un test"
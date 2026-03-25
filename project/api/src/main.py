import logging
import os

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routes.ai import _get_nlp
from .routes.ai import router as ai_router
from .routes.dogs import router as dogs_router
from .routes.exercises import router as exercises_router
from .routes.user import router as user_router

logger = logging.getLogger(__name__)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = "zongwei/gemma3-translator:4b"

app = FastAPI(title="My Companion API")

Base.metadata.create_all(bind=engine)

app.include_router(dogs_router,      prefix="/dogs",      tags=["Dogs"])
app.include_router(user_router,      prefix="/user",      tags=["User"])
app.include_router(exercises_router, prefix="/exercises", tags=["Exercises"])
app.include_router(ai_router,        prefix="/ai",        tags=["AI"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    # Pre-load spaCy models (failures are warnings, not crashes)
    for lang in ("french", "spanish", "german"):
        nlp = _get_nlp(lang)
        if nlp:
            logger.info("spaCy model loaded for '%s'", lang)

    # Warm up Ollama
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": OLLAMA_MODEL, "prompt": "hello warmup", "stream": False},
                timeout=120.0,
            )
        logger.info("Ollama warmed up")
    except Exception as e:
        logger.warning("Ollama warmup failed: %s", e)


@app.get("/health")
def health():
    return {"status": "ok"}

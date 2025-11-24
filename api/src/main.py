from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .models import User, Dog
from .routes.dogs import router as dogs_router 
from .routes.user import router as user_router 

app = FastAPI(title="My Companion API")
Base.metadata.create_all(bind=engine)
app.include_router(dogs_router, prefix="/dogs", tags=["Dogs"])
app.include_router(user_router, prefix="/user", tags=["User"])


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

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes.dogs_routes import router as dogs_router 
from .routes.users_routes import router as user_router 

app = FastAPI(title="My Companion API")
Base.metadata.create_all(bind=engine)
app.include_router(dogs_router, prefix="/dogs", tags=["Dogs"])
app.include_router(user_router, prefix="/user", tags=["User"])

frontend_url = os.getenv("FRONTEND_URL", "")
origins = [frontend_url] if frontend_url else []

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://127.0.0.1:3000"],  # Autorise tous les domaines 
    allow_credentials=True,
    allow_methods=["*"],  # Autorise toutes les méthodes (GET, POST, etc.)
    allow_headers=["*"],  # Autorise tous les headers
)

@app.get("/test", response_model=str)
def test():
    return "Ceci est un test"

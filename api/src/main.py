from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .dog import Dog

app = FastAPI()

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

@app.get("/status", response_model=str)
def status(dog: Dog):
    """Afficher l'état du chien"""
    dog.tick()
    status = f"""
    --- État de {dog.name} ---
    Affection : {dog.affection}/100
    Énergie   : {dog.energy}/100
    Faim      : {dog.hunger}/100
    """
    return status

@app.get("/play", response_model=str)
def play(dog: Dog):
    """Jouer avec le chien"""
    dog.tick()
    if dog.energy < 20:
        return f"😴 {dog.name} est trop fatigué pour jouer."
    else:
        dog.energy = dog._clamp(dog.energy - 15)
        dog.affection = dog._clamp(dog.affection + 8)
        return f"🎾 {dog.name} joue avec toi ! Énergie = {dog.energy}"

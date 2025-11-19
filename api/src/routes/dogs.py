from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Dog, User

router = APIRouter()

@router.post("/create_dog")
def create_dog(name: str, user_id: int, db: Session = Depends(get_db)):
    # Vérifie que l'utilisateur existe
    owner = db.query(User).filter(User.id == user_id).first()
    if not owner:
        return {"error": "Utilisateur introuvable"}

    dog = Dog(name=name, owner_id=user_id)
    db.add(dog)
    db.commit()
    db.refresh(dog)
    return {"id": dog.id, "name": dog.name, "owner": owner.username}

# @router.get("/status", response_model=str)
# def status(dog: Dog):
#     """Afficher l'état du chien"""
#     dog.tick()
#     status = f"""
#     --- État de {dog.name} ---
#     Affection : {dog.affection}/100
#     Énergie   : {dog.energy}/100
#     Faim      : {dog.hunger}/100
#     """
#     return status

# @router.get("/play", response_model=str)
# def play(dog: Dog):
#     """Jouer avec le chien"""
#     dog.tick()
#     if dog.energy < 20:
#         return f"😴 {dog.name} est trop fatigué pour jouer."
#     else:
#         dog.energy = dog._clamp(dog.energy - 15)
#         dog.affection = dog._clamp(dog.affection + 8)
#         return f"🎾 {dog.name} joue avec toi ! Énergie = {dog.energy}"

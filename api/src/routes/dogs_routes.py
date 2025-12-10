from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Dog, User
from ..dogs_utils import get_dog_from_id

router = APIRouter()

class DogIdentity(BaseModel):
    id: int
    name: str
    owner_id: int

class DogStatus(BaseModel):
    affection: int
    energy: int
    hunger: int

@router.post("/create_dog", response_model=DogIdentity)
def create_dog(name: str, user_id: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    owner = db.query(User).filter(User.id == user_id).first()
    if not owner:
        return {"error": "Utilisateur introuvable"}

    dog = Dog(name=name, owner_id=user_id)
    db.add(dog)
    db.commit()
    db.refresh(dog)
    return DogIdentity(dog.id, dog.name, dog.owner_id)

@router.get("/status", response_model=DogStatus)
def status(dog_id: int, db: Session = Depends(get_db)):
    dog = get_dog_from_id(dog_id, db)
    dog.tick()

    return DogStatus(dog.affection, dog.energy, dog.hunger)

@router.post("/play", response_model=bool)
def play(dog_id: int, db: Session = Depends(get_db)):
    dog = get_dog_from_id(dog_id, db)
    dog.tick()
    if dog.energy < 20:
        return False
    dog.hunger = dog._clamp(dog.hunger - 15)
    dog.energy = dog._clamp(dog.energy - 15)
    dog.affection = dog._clamp(dog.affection + 8)
    return True

@router.post("/feed", response_model=bool)
def play(dog_id: int, db: Session = Depends(get_db)):
    dog = get_dog_from_id(dog_id, db)
    dog.tick()
    if dog.hunger > 100:
        return False
    dog.hunger = dog._clamp(dog.hunger + 15)
    dog.energy = dog._clamp(dog.energy - 15)
    dog.affection = dog._clamp(dog.affection + 5)
    return True

@router.post("/pet", response_model=bool)
def play(dog_id: int, db: Session = Depends(get_db)):
    dog = get_dog_from_id(dog_id, db)
    dog.tick()
    if dog.affection > 100:
        return False
    dog.affection = dog._clamp(dog.affection + 10)
    return True
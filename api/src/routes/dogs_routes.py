from fastapi import APIRouter, Depends, Form, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from ..database import get_db
from ..models import Dog, User
from ..dogs_utils import get_dog_from_id
from ..auth_utils import get_current_user

router = APIRouter()

class DogIdentity(BaseModel):
    id: int
    name: str
    owner_username: str

    class Config:
        orm_mode = True

class DogStatus(BaseModel):
    name: str
    affection: int
    energy: int
    hunger: int

    class Config:
        orm_mode = True

@router.post("/create_dog", response_model=DogIdentity)
def create_dog(name: str = Form(...), owner: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        dog = Dog(name=name, owner_username=owner.username)
        db.add(dog)
        db.commit()
        db.refresh(dog)
        return dog
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e.orig))


@router.get("/status", response_model=DogStatus)
def status(dog_id: int, db: Session = Depends(get_db)):
    dog = get_dog_from_id(dog_id, db)
    dog.tick()
    db.commit()
    db.refresh(dog)

    return dog

@router.post("/play", response_model=bool)
def play(dog_id: int, db: Session = Depends(get_db)):
    dog = get_dog_from_id(dog_id, db)
    dog.tick()
    if dog.energy < 20:
        return False
    dog.hunger = dog._clamp(dog.hunger - 15)
    dog.energy = dog._clamp(dog.energy - 15)
    dog.affection = dog._clamp(dog.affection + 8)
    db.commit()
    db.refresh(dog)
    return True

@router.post("/feed", response_model=bool)
def feed(dog_id: int, db: Session = Depends(get_db)):
    dog = get_dog_from_id(dog_id, db)
    dog.tick()
    if dog.hunger > 100:
        return False
    dog.hunger = dog._clamp(dog.hunger + 15)
    dog.energy = dog._clamp(dog.energy - 15)
    dog.affection = dog._clamp(dog.affection + 5)
    db.commit()
    db.refresh(dog)
    return True

@router.post("/pet", response_model=bool)
def pet(dog_id: int, db: Session = Depends(get_db)):
    dog = get_dog_from_id(dog_id, db)
    dog.tick()
    if dog.affection > 100:
        return False
    dog.affection = dog._clamp(dog.affection + 10)
    db.commit()
    db.refresh(dog)
    return True
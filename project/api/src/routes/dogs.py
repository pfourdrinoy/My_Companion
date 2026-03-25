from __future__ import annotations

import time
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Dog, User

router = APIRouter()


class DogCreate(BaseModel):
    name: str


@router.post("/", status_code=201)
def create_dog(
    payload: DogCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    if db.query(Dog).filter_by(name=payload.name).first():
        raise HTTPException(409, "A dog with that name already exists")
    dog = Dog(owner_id=current_user.id, name=payload.name)
    db.add(dog)
    db.commit()
    db.refresh(dog)
    return _serialize(dog)


@router.get("/")
def list_dogs(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    dogs = db.query(Dog).filter_by(owner_id=current_user.id).all()
    for dog in dogs:
        dog.tick()
    db.commit()
    return [_serialize(d) for d in dogs]


@router.get("/{dog_id}")
def get_dog(
    dog_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    dog = _get_owned_dog(dog_id, current_user.id, db)
    dog.tick()
    db.commit()
    return _serialize(dog)


@router.post("/{dog_id}/feed")
def feed_dog(
    dog_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    dog = _get_owned_dog(dog_id, current_user.id, db)
    dog.hunger = min(100, dog.hunger + 20)
    dog.last_interaction = time.time()
    db.commit()
    return _serialize(dog)


@router.post("/{dog_id}/play")
def play_with_dog(
    dog_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    dog = _get_owned_dog(dog_id, current_user.id, db)
    dog.affection = min(100, dog.affection + 15)
    dog.energy    = max(0,   dog.energy    - 10)
    dog.last_interaction = time.time()
    db.commit()
    return _serialize(dog)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_owned_dog(dog_id: int, user_id: int, db: Session) -> Dog:
    dog = db.query(Dog).filter_by(id=dog_id, owner_id=user_id).first()
    if not dog:
        raise HTTPException(404, "Dog not found")
    return dog

def _serialize(dog: Dog) -> dict:
    return {
        "id":        dog.id,
        "name":      dog.name,
        "affection": dog.affection,
        "energy":    dog.energy,
        "hunger":    dog.hunger,
    }

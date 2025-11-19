from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Dog, User

router = APIRouter()

@router.post("/create_user")
def create_user(name: str, password: str, db: Session = Depends(get_db)):
    user = User(name=name, password=password)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "name": user.name}
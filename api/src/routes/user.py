import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated
from ..database import get_db
from ..models import Dog, User
from ..auth import hash_password, create_access_token, get_current_user, authenticate_user, get_user

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str

class UserSession(BaseModel):
    username: str
    password: str

@router.post("/create_user")
def create_user(userCreate: UserSession, db: Session = Depends(get_db)):
    existing_user = get_user(userCreate.username, db)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_pw = hash_password(userCreate.password)
    
    user = User(username=userCreate.username, password=hashed_pw)
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"id": user.id, "username": user.username}

@router.post("/login")
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)) -> Token:
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username})
    return Token(access_token=access_token, token_type="bearer")

@router.get("/user")
async def read_users_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user
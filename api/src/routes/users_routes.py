import jwt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated
from ..database import get_db
from ..models import User
from ..auth_utils import hash_password, create_access_token, get_current_user, authenticate_user, get_user

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str

class UserSession(BaseModel):
    username: str
    password: str

@router.post("/create_user")
def create_user(userCreate: UserSession, db: Session = Depends(get_db)):
    """
    Creates a new user after verifying the username is not already taken.

    Args:
        userCreate (UserSession): Contains the username and password required to create a user.
        db (Session, optional): The active database session. Defaults to Depends(get_db).

    Raises:
        HTTPException: 400 error if the username already exists.

    Returns:
        dict: The created user's ID and username.
    """
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
    """
    Authenticates a user and generates a JWT access token.

    Args:
        form_data (OAuth2PasswordRequestForm): Contains username and password.
        db (Session, optional): The active database session. Defaults to Depends(get_db).

    Raises:
        HTTPException: 400 error if credentials are invalid.

    Returns:
        Token: A bearer token containing the signed JWT.
    """
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.id})
    return Token(access_token=access_token, token_type="bearer")

@router.get("/user")
async def read_users_me(current_user: Annotated[User, Depends(get_current_user)]):
    """
    Returns the currently authenticated user.

    Args:
        current_user (User): The authenticated user extracted from the JWT token.

    Returns:
        User: The authenticated user's full model.
    """
    return current_user
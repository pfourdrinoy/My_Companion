import os
import jwt
from typing import Annotated
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from .database import get_db
from .models import User

SECRET_KEY = os.getenv("SECRET_KEY", "SECRET_DEV_KEY")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/user/login")

def hash_password(password: str) -> str:
    """ 
    A function to ash the password

    Args:
        password (str): The password to be hashed.

    Returns:
        str: The password hashed
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    A function that verifies whether a plain-text password matches its hashed version.

    Args:
        plain_password (str): The plain-text password to be verified.
        hashed_password (str): The hashed password version.

    Returns:
        bool: Value if the passwords are the same or not
    """
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, algorithm: str = "HS256", secret_key: str = SECRET_KEY, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    """
    A function to create an access token

    Args:
        data (dict): A dictionnary containing informations to be inserted into the payload.
        algorithm (str, optional): The algorithm used to create the token. Defaults to "HS256".
        secret_key (str, optional): The secret key used to identificate the token. Defaults to SECRET_KEY.
        expires_minutes (int, optional): Amount of time that the token will be available in minutes. Defaults to ACCESS_TOKEN_EXPIRE_MINUTES.

    Returns:
        str: the token generated with all informations
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    return token

def get_user(username: str, db: Session):
    """
    Fetches a user from the database using the username.

    Args:
        username (str): The username to search for.
        db (Session): Database session.

    Returns:
        User | None: The matching user or None if not found.
    """
    existing_user = db.query(User).filter(User.username == username).first()
    if not existing_user:
        return None
    return existing_user

def authenticate_user(username: str, password: str, db: Session):
    """
    Validates a user's credentials.

    Args:
        username (str): Username provided during login.
        password (str): Password provided during login.
        db (Session): Database session.

    Returns:
        User | bool: The authenticated user, or False if authentication fails.
    """
    user = get_user(username, db)
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)):
    """
    Extracts and returns the authenticated user from a JWT token.

    Args:
        token (str): JWT access token provided by the client.
        db (Session): Database session.

    Returns:
        User: The authenticated user.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = get_user(username, db)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user
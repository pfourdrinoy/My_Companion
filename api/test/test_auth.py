import pytest
import jwt
from unittest.mock import MagicMock
from datetime import datetime, timedelta, timezone

from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_user,
    authenticate_user,
    get_current_user,
    SECRET_KEY,
    ALGORITHM
)
from app.models import User

def test_hash_password_and_verify():
    password = "mypassword123"
    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong-password", hashed) is False

def test_create_access_token():
    data = {"sub": "john"}
    token = create_access_token(data)

    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

    assert decoded["sub"] == "john"
    assert "exp" in decoded
    assert decoded["exp"] > datetime.now(timezone.utc).timestamp()

def test_get_user_found():
    db = MagicMock()

    fake_user = User(id=1, username="alice", password="hashed")
    db.query().filter().first.return_value = fake_user

    result = get_user("alice", db)
    assert result == fake_user

def test_get_user_not_found():
    db = MagicMock()
    db.query().filter().first.return_value = None

    result = get_user("unknown", db)
    assert result is None

def test_authenticate_user_success(monkeypatch):
    db = MagicMock()
    hashed = hash_password("secret")

    fake_user = User(id=1, username="bob", password=hashed)
    db.query().filter().first.return_value = fake_user

    result = authenticate_user("bob", "secret", db)
    assert result == fake_user

def test_authenticate_user_wrong_password(monkeypatch):
    db = MagicMock()
    fake_user = User(id=1, username="bob", password=hash_password("secret"))
    db.query().filter().first.return_value = fake_user

    result = authenticate_user("bob", "wrong", db)
    assert result is False

def test_authenticate_user_user_not_found():
    db = MagicMock()
    db.query().filter().first.return_value = None

    result = authenticate_user("ghost", "test", db)
    assert result is False


# ---------------------------------------------------------
# 5. Test get_current_user (async)
# ---------------------------------------------------------

@pytest.mark.asyncio
async def test_get_current_user_success(monkeypatch):
    token = create_access_token({"sub": "charlie"})

    fake_user = User(id=2, username="charlie", password="hashedpwd")
    db = MagicMock()
    db.query().filter().first.return_value = fake_user

    monkeypatch.setattr("app.auth.get_user", lambda username, db: fake_user)

    result = await get_current_user(token, db)
    assert result == fake_user


@pytest.mark.asyncio
async def test_get_current_user_invalid_token():
    invalid_token = "this.is.not.valid.jwt"

    db = MagicMock()

    with pytest.raises(Exception):
        await get_current_user(invalid_token, db)

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import authenticate_user, create_access_token, get_current_user, hash_password
from ..database import get_db
from ..models import LANGUAGES, User, UserLanguage, UserVocabulary

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    username: str
    password: str

class LanguageStats(BaseModel):
    language: str
    label: str
    flag: str
    word_count: int
    avg_mastery: float          # 0.0 – 1.0
    mastered_count: int         # words with mastery_score >= 0.8


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter_by(username=payload.username).first():
        raise HTTPException(400, "Username already taken")
    db.add(User(username=payload.username, password=hash_password(payload.password)))
    db.commit()
    return {"message": "Account created"}


@router.post("/login")
def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)):
    user = authenticate_user(form.username, form.password, db)
    if not user:
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
def me(current_user: Annotated[User, Depends(get_current_user)]):
    return {"id": current_user.id, "username": current_user.username}


# ---------------------------------------------------------------------------
# Language management
# ---------------------------------------------------------------------------

@router.get("/languages/available")
def available_languages():
    """Return all supported languages with their flag and label."""
    return [{"language": k, **v} for k, v in LANGUAGES.items()]


@router.get("/languages", response_model=list[LanguageStats])
def my_languages(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Return the languages the user is learning, with per-language progress stats."""
    enrolled = db.query(UserLanguage).filter_by(user_id=current_user.id).all()
    result = []
    for ul in enrolled:
        lang = ul.language
        rows = db.query(UserVocabulary).filter_by(user_id=current_user.id, language=lang).all()
        word_count    = len(rows)
        avg_mastery   = round(sum(r.mastery_score for r in rows) / word_count, 3) if word_count else 0.0
        mastered      = sum(1 for r in rows if r.mastery_score >= 0.8)
        meta          = LANGUAGES.get(lang, {"flag": "🏳️", "label": lang.capitalize()})
        result.append(LanguageStats(
            language=lang,
            label=meta["label"],
            flag=meta["flag"],
            word_count=word_count,
            avg_mastery=avg_mastery,
            mastered_count=mastered,
        ))
    return result


@router.post("/languages/{language}", status_code=201)
def enroll_language(
    language: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Start learning a new language."""
    language = language.lower()
    if language not in LANGUAGES:
        raise HTTPException(400, f"Unknown language '{language}'. Available: {list(LANGUAGES)}")
    existing = db.query(UserLanguage).filter_by(user_id=current_user.id, language=language).first()
    if existing:
        raise HTTPException(409, f"Already enrolled in '{language}'")
    db.add(UserLanguage(user_id=current_user.id, language=language))
    db.commit()
    return {"message": f"Enrolled in {LANGUAGES[language]['label']} {LANGUAGES[language]['flag']}"}


@router.delete("/languages/{language}")
def unenroll_language(
    language: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Stop learning a language (vocabulary is preserved)."""
    language = language.lower()
    row = db.query(UserLanguage).filter_by(user_id=current_user.id, language=language).first()
    if not row:
        raise HTTPException(404, f"Not enrolled in '{language}'")
    db.delete(row)
    db.commit()
    return {"message": f"Unenrolled from '{language}'"}


# ---------------------------------------------------------------------------
# Vocabulary management
# ---------------------------------------------------------------------------

@router.get("/vocabulary")
def get_vocabulary(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    language: str | None = None,
):
    """Return the user's vocabulary, optionally filtered by language."""
    q = db.query(UserVocabulary).filter_by(user_id=current_user.id)
    if language:
        q = q.filter_by(language=language.lower())
    words = q.order_by(UserVocabulary.mastery_score.asc()).all()
    return [
        {
            "id":                     w.id,
            "language":               w.language,
            "word":                   w.word,
            "translation":            w.translation,
            "pos":                    w.pos,
            "word_determiner":        w.word_determiner,
            "translation_determiner": w.translation_determiner,
            "correct_count":          w.correct_count,
            "wrong_count":            w.wrong_count,
            "mastery_score":          w.mastery_score,
        }
        for w in words
    ]

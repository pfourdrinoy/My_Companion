from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import LANGUAGES, User, UserLanguage, UserVocabulary

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class VocabularyCreate(BaseModel):
    word: str
    language: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _require_enrolled(user_id: int, language: str, db: Session):
    if not db.query(UserLanguage).filter_by(user_id=user_id, language=language).first():
        raise HTTPException(403, f"Not enrolled in '{language}'. Enroll first via POST /user/languages/{language}")

def _serialize(w: UserVocabulary) -> dict:
    return {
        "id":            w.id,
        "language":      w.language,
        "word":          w.word,
        "correct_count": w.correct_count,
        "wrong_count":   w.wrong_count,
        "mastery_score": w.mastery_score,
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/add")
def add_vocabulary(
    vocabs: list[VocabularyCreate],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Add multiple words at once, lowercase, skipping duplicates per language."""
    # Group existing words by language to avoid N+1 queries
    existing: set[tuple[str, str]] = {
        (w.language, w.word)
        for w in db.query(UserVocabulary.language, UserVocabulary.word)
        .filter_by(user_id=current_user.id)
        .all()
    }

    added, skipped = [], []

    for vocab in vocabs:
        language = vocab.language.strip().lower()
        word     = vocab.word.strip().lower()

        _require_enrolled(current_user.id, language, db)

        if (language, word) in existing:
            skipped.append(word)
            continue

        entry = UserVocabulary(user_id=current_user.id, language=language, word=word)
        db.add(entry)
        added.append(entry)
        existing.add((language, word))

    db.commit()
    for entry in added:
        db.refresh(entry)

    return {
        "added":   [_serialize(e) for e in added],
        "skipped": skipped,
    }


@router.get("/all")
def get_all_vocabulary(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    language: str | None = None,
):
    """Return all vocabulary for the current user, optionally filtered by language."""
    q = db.query(UserVocabulary).filter_by(user_id=current_user.id)
    if language:
        q = q.filter_by(language=language.lower())
    words = q.order_by(UserVocabulary.word.asc()).all()
    return [_serialize(w) for w in words]


@router.get("/all_sorted")
def get_vocabulary_sorted(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    language: str | None = None,
    limit: int = 5,
):
    """Return words sorted by mastery score (weakest first), optionally filtered by language."""
    q = db.query(UserVocabulary).filter_by(user_id=current_user.id)
    if language:
        q = q.filter_by(language=language.lower())
    words = q.order_by(UserVocabulary.mastery_score.asc()).limit(limit).all()

    if not words:
        raise HTTPException(404, "No vocabulary found")

    return [_serialize(w) for w in words]


@router.delete("/delete")
def delete_vocabulary(
    word_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    word = db.query(UserVocabulary).filter_by(id=word_id, user_id=current_user.id).first()
    if not word:
        raise HTTPException(404, "Word not found")
    db.delete(word)
    db.commit()
    return {"deleted": word_id}
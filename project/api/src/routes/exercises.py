from __future__ import annotations

from typing import Annotated
import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import User, UserLanguage, UserVocabulary

router = APIRouter()


def _check_enrolled(user_id: int, language: str, db: Session):
    enrolled = db.query(UserLanguage).filter_by(user_id=user_id, language=language).first()
    if not enrolled:
        raise HTTPException(403, f"Not enrolled in '{language}'. Enroll first via POST /user/languages/{language}")


def _vocab_query(user_id: int, language: str, db: Session):
    return (
        db.query(UserVocabulary)
        .filter_by(user_id=user_id, language=language)
        .order_by(UserVocabulary.mastery_score.asc())
        .all()
    )


# ---------------------------------------------------------------------------
# Word exercise
# ---------------------------------------------------------------------------

@router.get("/word")
def exercise_word(
    language: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Return a word to translate (weakest mastery first)."""
    language = language.lower()
    _check_enrolled(current_user.id, language, db)
    words = _vocab_query(current_user.id, language, db)
    if not words:
        raise HTTPException(404, "No vocabulary yet for this language")
    # Favour weak words but add some randomness
    pool = words[:max(1, len(words) // 3)]
    word = random.choice(pool)
    return {
        "id":          word.id,
        "word":        word.word,
        "determiner":  word.word_determiner,
        "pos":         word.pos,
        "language":    word.language,
    }


@router.post("/word/{vocab_id}/answer")
def answer_word(
    vocab_id: int,
    user_answer: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Submit an answer for a word exercise and update mastery."""
    word = db.query(UserVocabulary).filter_by(id=vocab_id, user_id=current_user.id).first()
    if not word:
        raise HTTPException(404, "Vocabulary entry not found")

    correct = user_answer.strip().lower() == word.translation.strip().lower()
    if correct:
        word.correct_count += 1
    else:
        word.wrong_count += 1

    total = word.correct_count + word.wrong_count
    word.mastery_score = round(word.correct_count / total, 3) if total else 0.0
    db.commit()

    return {
        "correct":        correct,
        "correct_answer": word.translation,
        "mastery_score":  word.mastery_score,
    }


# ---------------------------------------------------------------------------
# Sentence exercise (placeholder — powered by AI route)
# ---------------------------------------------------------------------------

@router.get("/sentence")
def exercise_sentence(
    language: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Return a sentence built from the user's weakest words."""
    language = language.lower()
    _check_enrolled(current_user.id, language, db)
    words = _vocab_query(current_user.id, language, db)
    if not words:
        raise HTTPException(404, "No vocabulary yet for this language")
    sample = [w.word for w in words[:5]]
    return {
        "language": language,
        "words":    sample,
        "hint":     "Use the AI /ai/translate/sentence endpoint to get a sentence with these words.",
    }

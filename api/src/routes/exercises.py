from __future__ import annotations

from typing import Annotated
import asyncio
import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import User, UserLanguage, UserVocabulary
from .ai import (
    _ollama_retry, _single_word, _valid_pos,
    _spacy_gender, _spacy_pos, DETERMINERS, VOWELS,
)

router = APIRouter()


def _check_enrolled(user_id: int, language: str, db: Session) -> None:
    if not db.query(UserLanguage).filter_by(user_id=user_id, language=language).first():
        raise HTTPException(403, f"Not enrolled in '{language}'. Enroll first via POST /user/languages/{language}")


def _vocab_query(user_id: int, language: str, db: Session) -> list[UserVocabulary]:
    return (
        db.query(UserVocabulary)
        .filter_by(user_id=user_id, language=language)
        .order_by(UserVocabulary.mastery_score.asc())
        .all()
    )


async def _get_translation(word: str, language: str) -> str:
    prompt = f'Translate "{word}" from {language} to english. Reply with the translated word only, no punctuation, no explanation.'
    return await _ollama_retry(prompt, _single_word)


async def _get_pos(word: str, language: str) -> str | None:
    if pos := _spacy_pos(word, language):
        return pos
    from .ai import VALID_POS
    prompt = f'What is the grammatical category of "{word}" in {language}? Reply with ONE word from: {", ".join(VALID_POS)}. No explanation.'
    try:
        return await _ollama_retry(prompt, _valid_pos)
    except HTTPException:
        return None


async def _get_determiner(word: str, language: str) -> str | None:
    gender = _spacy_gender(word, language)
    if gender:
        lang_map = DETERMINERS.get(language.lower(), {})
        if language.lower() == "french" and word[0].lower() in VOWELS:
            return "l'"
        if det := lang_map.get(gender):
            return det
    if language.lower() not in DETERMINERS:
        return None
    prompt = f'Give the correct definite article for "{word}" in {language}. Reply ONLY with: article + word (e.g. "le chien"). No explanation.'
    try:
        result = await _ollama_retry(
            prompt,
            lambda r: r if word.lower() in r.lower() else (_ for _ in ()).throw(ValueError(f"Word missing from: {r!r}"))
        )
        return result or None
    except HTTPException:
        return None


def _serialize_word(word: UserVocabulary, translation: str, pos: str | None, word_determiner: str | None) -> dict:
    return {
        "id":               word.id,
        "word":             word.word,
        "translation":      translation,
        "pos":              pos,
        "gender":           word.gender,        # FIX: lu depuis la BDD
        "word_determiner":  word_determiner,
        "language":         word.language,
        "mastery_score":    word.mastery_score,
        "correct_count":    word.correct_count,
        "wrong_count":      word.wrong_count,
    }


# ---------------------------------------------------------------------------
# Word exercise
# ---------------------------------------------------------------------------

@router.get("/word")
async def exercise_word(
    language: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Return a word to translate (weakest mastery first), enriched via AI."""
    language = language.lower()
    _check_enrolled(current_user.id, language, db)
    words = _vocab_query(current_user.id, language, db)
    if not words:
        raise HTTPException(404, "No vocabulary yet for this language")

    pool = words[:max(1, len(words) // 3)]
    word = random.choice(pool)

    # FIX: utilise la traduction en BDD si disponible, sinon appelle Ollama
    if word.translation:
        translation   = word.translation
        pos, word_determiner = await asyncio.gather(
            _get_pos(word.word, language),
            _get_determiner(word.word, language),
            return_exceptions=True,
        )
    else:
        translation, pos, word_determiner = await asyncio.gather(
            _get_translation(word.word, language),
            _get_pos(word.word, language),
            _get_determiner(word.word, language),
            return_exceptions=True,
        )

    return _serialize_word(
        word,
        translation      if isinstance(translation, str)      else "",
        pos              if isinstance(pos, str)              else None,
        word_determiner  if isinstance(word_determiner, str)  else None,
    )


@router.post("/word/{vocab_id}/answer")
def answer_word(
    vocab_id: int,
    user_answer: str,
    correct_answer: str,  # FIX: le frontend passe la traduction attendue
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Submit an answer for a word exercise and update mastery."""
    word = db.query(UserVocabulary).filter_by(id=vocab_id, user_id=current_user.id).first()
    if not word:
        raise HTTPException(404, "Vocabulary entry not found")

    # FIX: comparaison contre la traduction attendue, pas le mot source
    correct = user_answer.strip().lower() == correct_answer.strip().lower()

    if correct:
        word.correct_count += 1
    else:
        word.wrong_count += 1

    total = word.correct_count + word.wrong_count
    word.mastery_score = round(word.correct_count / total, 3) if total else 0.0
    db.commit()

    return {
        "correct":       correct,
        "mastery_score": word.mastery_score,
    }


# ---------------------------------------------------------------------------
# Sentence exercise
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
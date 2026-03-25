from __future__ import annotations

import logging
import os
from typing import Annotated

import httpx
import spacy
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import User, UserLanguage, UserVocabulary

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = "zongwei/gemma3-translator:4b"
MAX_RETRIES = 3

VOWELS = set("aeiouâêîôûàèùéëïü")

SPACY_MODELS = {"french": "fr_core_news_sm", "spanish": "es_core_news_sm", "german": "de_core_news_sm"}
SPACY_GENDER_MAP = {"Masc": "Masculine", "Fem": "Feminine", "Neut": "Neuter"}
SPACY_POS_MAP = {
    "NOUN": "noun", "VERB": "verb", "ADJ": "adjective", "ADV": "adverb",
    "PRON": "pronoun", "ADP": "preposition", "CCONJ": "conjunction",
    "SCONJ": "conjunction", "INTJ": "interjection",
}

DETERMINERS = {
    "french":  {"Masculine": "le", "Feminine": "la"},
    "spanish": {"Masculine": "el", "Feminine": "la"},
    "german":  {"Masculine": "der", "Feminine": "die", "Neuter": "das"},
}

VALID_POS = {"noun", "verb", "adjective", "adverb", "pronoun", "preposition", "conjunction", "interjection"}

# ---------------------------------------------------------------------------
# spaCy
# ---------------------------------------------------------------------------

_nlp_cache: dict = {}

def _get_nlp(language: str):
    lang = language.lower()
    if lang not in _nlp_cache:
        model = SPACY_MODELS.get(lang)
        if not model:
            return None
        try:
            _nlp_cache[lang] = spacy.load(model)
        except OSError:
            logger.warning("spaCy model '%s' not found. Run: python -m spacy download %s", model, model)
            return None
    return _nlp_cache[lang]

def _spacy_gender(word: str, language: str) -> str | None:
    nlp = _get_nlp(language)
    if not nlp:
        return None
    for token in nlp(word):
        values = token.morph.get("Gender")
        if values:
            return SPACY_GENDER_MAP.get(values[0])
    return None

def _spacy_pos(word: str, language: str) -> str | None:
    nlp = _get_nlp(language)
    if not nlp:
        return None
    for token in nlp(word):
        if token.pos_:
            return SPACY_POS_MAP.get(token.pos_)
    return None

# ---------------------------------------------------------------------------
# Ollama
# ---------------------------------------------------------------------------

async def _ollama(prompt: str) -> str:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=120.0,
        )
    r.raise_for_status()
    return r.json()["response"].strip()

async def _ollama_retry(prompt: str, validator, max_retries: int = MAX_RETRIES) -> str:
    last_error = None
    for _ in range(max_retries):
        try:
            return validator(await _ollama(prompt))
        except ValueError as e:
            last_error = e
        except httpx.HTTPStatusError as e:
            raise HTTPException(502, f"Ollama HTTP error: {e}")
        except httpx.RequestError as e:
            raise HTTPException(502, f"Ollama connection error: {e}")
    raise HTTPException(502, f"Ollama failed after {max_retries} attempts. Last error: {last_error}")

# ---------------------------------------------------------------------------
# Validators
# ---------------------------------------------------------------------------

def _max(n: int):
    def v(raw: str) -> str:
        if not raw: raise ValueError("Empty response")
        if len(raw) > n: raise ValueError("Response too long")
        return raw
    return v

def _single_word(raw: str) -> str:
    w = raw.lower().strip()
    if len(w.split()) > 1: raise ValueError("More than one word")
    return w

def _valid_pos(raw: str) -> str:
    pos = raw.strip().lower()
    if pos not in VALID_POS: raise ValueError(f"Unknown POS: {raw!r}")
    return pos

def _not_known(known: list[str]):
    def v(raw: str) -> str:
        w = _single_word(raw)
        if w in known: raise ValueError(f"Word already known: {w!r}")
        return w
    return v

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _require_enrolled(user_id: int, language: str, db: Session):
    """Raise 403 if the user is not enrolled in the given language."""
    if not db.query(UserLanguage).filter_by(user_id=user_id, language=language.lower()).first():
        raise HTTPException(403, f"Not enrolled in '{language}'. Enroll first via POST /user/languages/{language}")

def _known_words(user_id: int, language: str, db: Session) -> list[str]:
    rows = (
        db.query(UserVocabulary)
        .filter_by(user_id=user_id, language=language.lower())
        .order_by(UserVocabulary.mastery_score.asc())
        .all()
    )
    return [w.word.lower().strip() for w in rows]

# ---------------------------------------------------------------------------
# Routes — feedback
# ---------------------------------------------------------------------------

@router.post("/feedback/word")
async def feedback_word(word: str, user_answer: str, correct_answer: str, language_learnt: str, language_user: str = "english"):
    prompt = f"""
    The user is learning {language_learnt}.
    Word to translate: "{word}". Correct answer: "{correct_answer}". User's answer: "{user_answer}".
    Briefly explain why it's wrong and give a tip to remember the right word.
    Reply ONLY in {language_user}, 2-3 sentences, without restating the question.
    """
    return {"feedback": await _ollama_retry(prompt, _max(500))}


@router.post("/feedback/sentence")
async def feedback_sentence(sentence: str, user_answer: str, correct_answer: str, language_learnt: str, language_user: str = "english"):
    prompt = f"""
    The user is learning {language_learnt}.
    Sentence to translate: "{sentence}". Correct translation: "{correct_answer}". User's translation: "{user_answer}".
    Briefly explain why it's wrong and give a tip.
    Reply ONLY in {language_user}, 2-3 sentences, without restating the question.
    """
    return {"feedback": await _ollama_retry(prompt, _max(500))}

# ---------------------------------------------------------------------------
# Routes — explanations & translations
# ---------------------------------------------------------------------------

@router.post("/explain/definition")
async def explain_definition(word: str, language_learnt: str, language_user: str = "english"):
    prompt = f"""
    Define the word "{word}" in {language_learnt}.
    Reply ONLY with the definition in {language_user}, 1-2 sentences, without mentioning the word itself.
    """
    return {"definition": await _ollama_retry(prompt, _max(300))}


@router.post("/translate/word")
async def translate_word(word: str, language_learnt: str, language_user: str = "english"):
    prompt = f'Translate "{word}" from {language_learnt} to {language_user}. Reply with the translated word only, no punctuation, no explanation.'
    return await _ollama_retry(prompt, _single_word)


@router.post("/translate/sentence")
async def translate_sentence(sentence: str, language_learnt: str, language_user: str = "english"):
    prompt = f'Translate "{sentence}" from {language_learnt} to {language_user}. Reply with the translated sentence only, no explanation.'
    return await _ollama_retry(prompt, lambda r: r if r else (_ for _ in ()).throw(ValueError("Empty")))

# ---------------------------------------------------------------------------
# Routes — vocabulary (language-scoped)
# ---------------------------------------------------------------------------

@router.post("/get/new_word")
async def get_new_word(
    language_learnt: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    language_user: str = "english",
):
    language_learnt = language_learnt.lower()
    _require_enrolled(current_user.id, language_learnt, db)
    known = _known_words(current_user.id, language_learnt, db)
    prompt = f'You are a {language_learnt} learning assistant. The user knows: {known}. Suggest one new useful {language_learnt} word they don\'t know yet. Reply with that word only.'
    return await _ollama_retry(prompt, _not_known(known))


@router.post("/get/word_determiner")
async def get_word_determiner(
    word: str,
    language_learnt: str,
    current_user: Annotated[User, Depends(get_current_user)],
) -> str:
    gender = _spacy_gender(word, language_learnt)
    if gender:
        lang_map = DETERMINERS.get(language_learnt.lower(), {})
        if language_learnt.lower() == "french" and word[0].lower() in VOWELS:
            return "l'"
        if det := lang_map.get(gender):
            return det

    prompt = f'Give the correct definite article for "{word}" in {language_learnt}. Reply ONLY with: article + word (e.g. "le chien", "l\'arbre"). No explanation.'
    result = await _ollama_retry(prompt, lambda r: r if word.lower() in r.lower() else (_ for _ in ()).throw(ValueError(f"Word missing from: {r!r}")))
    return result or word


@router.post("/get/word_pos")
async def get_word_pos(
    word: str,
    language_learnt: str,
    current_user: Annotated[User, Depends(get_current_user)],
) -> str:
    if pos := _spacy_pos(word, language_learnt):
        return pos
    prompt = f'What is the grammatical category of "{word}" in {language_learnt}? Reply with ONE word from: {", ".join(VALID_POS)}. No explanation.'
    return await _ollama_retry(prompt, _valid_pos)

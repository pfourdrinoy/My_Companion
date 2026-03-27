def _require_enrolled(user_id: int, language: str, db: Session) -> None:
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


def _dictionary_translate(word: str, language_learnt: str, language_user: str) -> str | None:
    src  = LANG_CODES.get(language_learnt.lower())
    dest = LANG_CODES.get(language_user.lower(), "en")
    if not src:
        return None
    try:
        translations = _dictionary.translate(src, word)
        if translations and dest in translations and translations[dest]:
            return translations[dest][0]
    except Exception:
        pass
    return None
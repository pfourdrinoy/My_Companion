import time
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base


# ---------------------------------------------------------------------------
# Language metadata (flags, display names)
# ---------------------------------------------------------------------------

LANGUAGES: dict[str, dict] = {
    "french":     {"flag": "🇫🇷", "label": "French"},
    "spanish":    {"flag": "🇪🇸", "label": "Spanish"},
    "german":     {"flag": "🇩🇪", "label": "German"},
    "italian":    {"flag": "🇮🇹", "label": "Italian"},
    "portuguese": {"flag": "🇵🇹", "label": "Portuguese"},
    "english":    {"flag": "🇬🇧", "label": "English"},
    "japanese":   {"flag": "🇯🇵", "label": "Japanese"},
    "chinese":    {"flag": "🇨🇳", "label": "Chinese"},
}


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id       = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    dogs       = relationship("Dog", back_populates="owner")
    vocabulary = relationship("UserVocabulary", back_populates="owner")
    languages  = relationship("UserLanguage", back_populates="owner")


class UserLanguage(Base):
    """Tracks which languages a user is actively learning."""
    __tablename__ = "user_languages"
    __table_args__ = (UniqueConstraint("user_id", "language", name="uq_user_language"),)

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    language   = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="languages")


class Dog(Base):
    __tablename__ = "dogs"

    id               = Column(Integer, primary_key=True, index=True)
    owner_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    name             = Column(String, unique=True, index=True, nullable=False)
    affection        = Column(Integer, default=75)
    energy           = Column(Integer, default=75)
    hunger           = Column(Integer, default=75)
    last_interaction = Column(Float, default=time.time)

    owner = relationship("User", back_populates="dogs")

    def _clamp(self, value):
        return max(0, min(100, value))

    def tick(self):
        now = time.time()
        elapsed = now - self.last_interaction
        if elapsed >= 10:
            self.energy    = self._clamp(self.energy    - 2)
            self.hunger    = self._clamp(self.hunger    - 2)
            self.affection = self._clamp(self.affection - 1)
            self.last_interaction = now


class UserVocabulary(Base):
    __tablename__ = "user_vocabulary"

    id                     = Column(Integer, primary_key=True, index=True)
    user_id                = Column(Integer, ForeignKey("users.id"), nullable=False)
    language               = Column(String, nullable=False)   # e.g. "french"
    word                   = Column(String, nullable=False)   # e.g. "Hund"
    translation            = Column(String, nullable=False)   # e.g. "dog"
    pos                    = Column(String, nullable=True)    # e.g. "noun"
    word_determiner        = Column(String, nullable=True)    # e.g. "der"
    translation_determiner = Column(String, nullable=True)    # e.g. "the"
    correct_count          = Column(Integer, default=0)
    wrong_count            = Column(Integer, default=0)
    mastery_score          = Column(Float, default=0.0)
    created_at             = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="vocabulary")

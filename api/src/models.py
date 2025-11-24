import time
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    dogs = relationship("Dog", back_populates="owner")

class Dog(Base):
    __tablename__ = "dogs"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, unique=True, index=True, nullable=False)
    affection = Column(Integer, nullable=False, default=75)
    energy = Column(Integer, nullable=False, default=75)
    hunger = Column(Integer, nullable=False, default=75)
    last_interaction = Column(Float, nullable=False, default=time.time)

    owner = relationship("User", back_populates="dogs")

    def _clamp(self, value):
        return max(0, min(100, value))

    def tick(self):
        now = time.time()
        elapsed = now - self.last_interaction
        
        if elapsed >= 10:
            self.energy = self._clamp(self.energy - 2)
            self.hunger = self._clamp(self.hunger - 2)
            self.affection = self._clamp(self.affection - 1)
            self.last_interaction = now


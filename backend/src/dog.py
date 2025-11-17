import time
from dataclasses import dataclass, field

@dataclass
class Dog:
    name: str
    affection: int = 50
    energy: int = 50
    hunger: int = 50
    chaleur: int = 50
    last_interaction: float = field(default_factory=time.time)

    def _clamp(self, value):
        return max(0, min(100, value))

    def tick(self):
        """Fait évoluer l'état du chien au cours du temps."""
        now = time.time()
        elapsed = now - self.last_interaction
        
        if elapsed >= 10:
            self.energy = self._clamp(self.energy - 2)
            self.hunger = self._clamp(self.hunger - 2)
            self.affection = self._clamp(self.affection - 1)
            self.last_interaction = now
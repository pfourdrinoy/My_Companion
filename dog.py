import time
import tkinter as tk
from tkinter import ttk
from dataclasses import dataclass, field

@dataclass
class Dog:
    name: str
    affection: int = 50     # 0–100
    energy: int = 50         # 0–100
    hunger: int = 50         # 0–100
    last_interaction: float = field(default_factory=time.time)

    def _clamp(self, value):
        return max(0, min(100, value))

    def tick(self):
        """Fait évoluer l'état avec le temps."""
        now = time.time()
        elapsed = now - self.last_interaction
        
        # Toutes les 10 secondes, les stats changent un peu
        if elapsed >= 10:
            self.energy = self._clamp(self.energy - 2)
            self.hunger = self._clamp(self.hunger - 2)
            self.affection = self._clamp(self.affection - 1)
            self.last_interaction = now

    def pet(self):
        """Caresser le chien"""
        self.tick()
        self.affection = self._clamp(self.affection + 5)
        print(f"🐾 {self.name} adore ça ! Affection = {self.affection}")

    def feed(self):
        """Nourrir le chien"""
        self.tick()
        if self.hunger <= 20:
            print(f"🍖 {self.name} n'a pas vraiment faim.")
        else:
            self.hunger = self._clamp(self.hunger + 20)
            self.energy = self._clamp(self.energy + 5)
            print(f"🍗 Tu as nourri {self.name} ! Hunger = {self.hunger}")

    def play(self):
        """Jouer avec le chien"""
        self.tick()
        if self.energy < 20:
            print(f"😴 {self.name} est trop fatigué pour jouer.")
        else:
            self.energy = self._clamp(self.energy - 15)
            self.affection = self._clamp(self.affection + 8)
            print(f"🎾 {self.name} joue avec toi ! Énergie = {self.energy}")

    def status(self):
        """Afficher l'état du chien"""
        self.tick()
        print(f"""
        --- État de {self.name} ---
        Affection : {self.affection}/100
        Énergie   : {self.energy}/100
        Faim      : {self.hunger}/100
        """)


# Exemple d’utilisation
# --------------------------
# INTERFACE GRAPHIQUE TKINTER
# --------------------------
class DogApp:
    def __init__(self, root, dog):
        self.root = root
        self.dog = dog

        root.title("Mon Chien Virtuel 🐶")

        # Titre
        self.title = ttk.Label(root, text=f"🐾 {dog.name}", font=("Arial", 20))
        self.title.pack(pady=10)

        # Statut du chien
        self.status_label = ttk.Label(root, text="", font=("Arial", 14))
        self.status_label.pack(pady=10)

        # Boutons d'action
        btn_frame = ttk.Frame(root)
        btn_frame.pack(pady=10)

        ttk.Button(btn_frame, text="Caresser 🤚", command=self.pet).grid(row=0, column=0, padx=5)
        ttk.Button(btn_frame, text="Nourrir 🍖", command=self.feed).grid(row=0, column=1, padx=5)
        ttk.Button(btn_frame, text="Jouer 🎾", command=self.play).grid(row=0, column=2, padx=5)

        # Mise à jour automatique du statut
        self.update_status()

    def pet(self):
        self.dog.pet()
        self.update_status()

    def feed(self):
        self.dog.feed()
        self.update_status()

    def play(self):
        self.dog.play()
        self.update_status()

    def update_status(self):
        self.dog.tick()
        self.status_label.config(
            text=(
                f"Affection : {self.dog.affection}/100\n"
                f"Énergie   : {self.dog.energy}/100\n"
                f"Faim      : {self.dog.hunger}/100\n"
            )
        )
        # Mise à jour régulière
        self.root.after(1000, self.update_status)


# --------------------------
# LANCEMENT DU PROGRAMME
# --------------------------
if __name__ == "__main__":
    root = tk.Tk()
    dog = Dog("Nala")
    app = DogApp(root, dog)
    root.mainloop()

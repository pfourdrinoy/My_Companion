from .models import Dog
from sqlalchemy.orm import Session

def get_dog_from_id(dog_id: str, db: Session):
    existing_dog = db.query(Dog).filter(Dog.id == dog_id).first()
    if not existing_dog:
        return None
    return existing_dog

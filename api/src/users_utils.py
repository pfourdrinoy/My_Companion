from .models import User
from sqlalchemy.orm import Session

def get_user_from_id(user_id: str, db: Session):
    existing_user = db.query(User).filter(User.id == user_id).first()
    if not existing_user:
        return None
    return existing_user
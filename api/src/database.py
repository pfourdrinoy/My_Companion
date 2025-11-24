import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Fournit une session de base de données à utiliser dans les routes FastAPI.
    Utilisation typique :
        def route(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()  # crée une session
    try:
        yield db  # yield permet à FastAPI de l'utiliser dans Depends
    finally:
        db.close()
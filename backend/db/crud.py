import uuid
from sqlalchemy.orm import Session
from . import models


def create_guest_user(db: Session) -> str:
    user_id = str(uuid.uuid4())
    db.add(models.User(id=user_id))
    db.commit()
    return user_id


def get_user(db: Session, user_id: str):
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_document(db: Session, user_id: str, title: str, source: str = "manual") -> int:
    doc = models.Document(user_id=user_id, title=title, source=source)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc.id


def add_chunks(db: Session, user_id: str, doc_id: int, chunks: list[str]) -> int:
    rows = []
    for i, text in enumerate(chunks):
        rows.append(models.Chunk(user_id=user_id, doc_id=doc_id, chunk_index=i, content=text))
    db.add_all(rows)
    db.commit()
    return len(rows)


def get_all_chunks(db: Session):
    return db.query(models.Chunk).all()


def get_chunks_by_user(db: Session, user_id: str):
    return db.query(models.Chunk).filter(models.Chunk.user_id == user_id).all()

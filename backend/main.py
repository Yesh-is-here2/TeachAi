from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from sqlalchemy.orm import Session
import numpy as np

from db.database import Base, engine, get_db
from db import crud, models

from rag.chunking import chunk_text
from rag.vectorstore import VectorStore, normalize

from services.llm import generate_text, embed_texts

load_dotenv()

SUBJECT = "Python"
VECTOR_DIM = 1536
store = VectorStore(dim=VECTOR_DIM)


def rebuild_index(db: Session):
    """
    Load all chunks from SQLite and rebuild the in-memory vector index.
    Called on startup so the vector store survives server restarts.
    """
    try:
        store.reset()
        chunks = crud.get_all_chunks(db)
        if not chunks:
            return
        texts = [c.content for c in chunks]
        embs = embed_texts(texts)
        vecs = normalize(np.array(embs, dtype="float32"))
        meta = [{"user_id": c.user_id, "doc_id": c.doc_id, "text": c.content} for c in chunks]
        store.add(vecs, meta)
        print(f"[startup] Rebuilt vector index with {len(chunks)} chunks")
    except Exception as e:
        # Don't crash the server if OpenAI is unreachable on startup
        print(f"[startup] Warning: could not rebuild index — {e}")


# Modern lifespan approach — replaces deprecated @app.on_event("startup")
@asynccontextmanager
async def lifespan(app: FastAPI):
    db = next(get_db())
    try:
        rebuild_index(db)
    finally:
        db.close()
    yield


app = FastAPI(title="TeachAI", version="3.0.0", lifespan=lifespan)

# Create DB tables on startup
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        # Add your Vercel/Render frontend URL here when deployed
        "https://teachai.vercel.app",
        "https://teachai-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response Models ──────────────────────────────────

class GuestAuthResponse(BaseModel):
    user_id: str


class IngestTextRequest(BaseModel):
    user_id: str
    title: str = "Notes"
    text: str


class AskRequest(BaseModel):
    user_id: str
    question: str
    level: str = "beginner"
    style: str = "simple"
    context: str | None = None
    top_k: int = 5


class LearnRequest(BaseModel):
    user_id: str
    topic: str
    level: str = "beginner"
    style: str = "simple"


# ── Basic Routes ───────────────────────────────────────────────

@app.get("/")
def root():
    return {"name": "TeachAI", "version": "3.0.0", "subject": SUBJECT, "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok", "subject": SUBJECT}


# ── Prompt Helper ──────────────────────────────────────────────

def teacher_system_prompt(level: str, style: str) -> str:
    return f"""
You are TeachAI, a patient expert tutor for ONE subject: {SUBJECT}.

Rules:
- Only answer within {SUBJECT}.
- If the user asks outside {SUBJECT}, refuse briefly and redirect.
- Be accurate. If unsure, say so.

Teaching style: {style}
Student level: {level}

Use clear structure and short sections.
Include examples when helpful.
""".strip()


# ── Auth ───────────────────────────────────────────────────────

@app.post("/auth/guest", response_model=GuestAuthResponse)
def auth_guest(db: Session = Depends(get_db)):
    user_id = crud.create_guest_user(db)
    return {"user_id": user_id}


# ── Ingest ─────────────────────────────────────────────────────

@app.post("/ingest/text")
def ingest_text(req: IngestTextRequest, db: Session = Depends(get_db)):
    if not crud.get_user(db, req.user_id):
        raise HTTPException(status_code=404, detail="user_id not found. Call /auth/guest first.")

    chunks = chunk_text(req.text, chunk_size=900, overlap=140)
    if not chunks:
        raise HTTPException(status_code=400, detail="No text to ingest.")

    doc_id = crud.create_document(db, req.user_id, title=req.title, source="manual")
    n = crud.add_chunks(db, req.user_id, doc_id, chunks)

    embs = embed_texts(chunks)
    vecs = normalize(np.array(embs, dtype="float32"))
    meta = [{"user_id": req.user_id, "doc_id": doc_id, "text": c} for c in chunks]
    store.add(vecs, meta)

    return {"doc_id": doc_id, "chunks_added": n}


# ── Ask (RAG) ──────────────────────────────────────────────────

@app.post("/ask")
def ask(req: AskRequest, db: Session = Depends(get_db)):
    try:
        if not crud.get_user(db, req.user_id):
            raise HTTPException(status_code=404, detail="user_id not found. Call /auth/guest first.")

        q_emb = embed_texts([req.question])[0]
        q_vec = normalize(np.array([q_emb], dtype="float32"))
        hits = store.search(q_vec, top_k=max(1, min(req.top_k, 10)))
        hits = [h for h in hits if h.get("user_id") == req.user_id]
        context_blocks = "\n\n---\n\n".join([h["text"] for h in hits[:req.top_k]])

        sys = teacher_system_prompt(req.level, req.style)
        user_prompt = f"""
Question: {req.question}
Optional context: {req.context or "None"}

Retrieved notes (may be empty):
{context_blocks or "None"}

Return:
1) Direct answer
2) 3 key points
3) 1 short Python code example (if relevant)
4) 2 follow-up questions to check understanding
""".strip()

        text = generate_text(sys, user_prompt)

        return {
            "subject": SUBJECT,
            "user_id": req.user_id,
            "question": req.question,
            "answer": text,
            "sources": [{"score": round(h["score"], 3), "doc_id": h["doc_id"]} for h in hits[:req.top_k]],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Learn ──────────────────────────────────────────────────────

@app.post("/learn")
def learn(req: LearnRequest, db: Session = Depends(get_db)):
    try:
        if not crud.get_user(db, req.user_id):
            raise HTTPException(status_code=404, detail="user_id not found. Call /auth/guest first.")

        sys = teacher_system_prompt(req.level, req.style)
        user_prompt = f"""
Teach this topic in {SUBJECT}: {req.topic}

Return a structured lesson with:
- Title
- Step-by-step explanation (5–8 steps)
- 2 Python code examples
- Common mistakes
- Mini quiz (5 questions: MCQ + short)
""".strip()

        text = generate_text(sys, user_prompt)

        return {
            "subject": SUBJECT,
            "user_id": req.user_id,
            "topic": req.topic,
            "lesson": text,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
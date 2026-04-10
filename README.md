# TeachAI 🎓
### RAG-Powered Python Learning Assistant

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?style=for-the-badge&logo=fastapi&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-black?style=for-the-badge&logo=openai&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Persistent-blue?style=for-the-badge&logo=sqlite&logoColor=white)

**A production-grade full-stack AI tutoring system using Retrieval-Augmented Generation (RAG)**

[Live Demo](#) · [Architecture](#architecture) · [Setup](#setup) · [API Docs](#api-endpoints)

</div>

---

## What is TeachAI?

TeachAI is a full-stack AI tutoring system that answers Python programming questions grounded in the user's own ingested notes. It demonstrates a complete production-style RAG architecture — from document ingestion and vector embedding, to semantic retrieval and LLM-powered response generation.

**Key capabilities:**
- 📥 Ingest your own Python notes and documentation
- 🔍 Semantic search using OpenAI embeddings + custom vector store
- 🤖 Grounded answers via GPT-4o-mini with retrieved context
- 👥 Multi-user isolation — each user's notes are private
- 💾 Persistent storage — documents survive server restarts
- 🌐 Full-stack — FastAPI backend + Next.js frontend

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        TEACHAI SYSTEM                           │
│                                                                 │
│  ┌──────────────┐         ┌──────────────────────────────────┐  │
│  │   Next.js    │  HTTP   │        FastAPI Backend           │  │
│  │  Frontend    │◄───────►│                                  │  │
│  │  localhost   │  POST   │  ┌─────────┐  ┌──────────────┐  │  │
│  │   :3000      │  /ask   │  │Pydantic │  │   CORS       │  │  │
│  └──────────────┘         │  │Validator│  │ Middleware   │  │  │
│                           │  └────┬────┘  └──────────────┘  │  │
│                           │       │                          │  │
│                           │  ┌────▼────────────────────┐    │  │
│                           │  │      RAG PIPELINE        │    │  │
│                           │  │                          │    │  │
│                           │  │  Question                │    │  │
│                           │  │     ↓                    │    │  │
│                           │  │  embed_texts()           │    │  │
│                           │  │  [OpenAI text-emb-3-sm]  │    │  │
│                           │  │     ↓                    │    │  │
│                           │  │  normalize() → L2 norm   │    │  │
│                           │  │     ↓                    │    │  │
│                           │  │  VectorStore.search()    │    │  │
│                           │  │  [cosine similarity]     │    │  │
│                           │  │     ↓                    │    │  │
│                           │  │  Filter by user_id       │    │  │
│                           │  │     ↓                    │    │  │
│                           │  │  Inject context chunks   │    │  │
│                           │  │     ↓                    │    │  │
│                           │  │  GPT-4o-mini [T=0.3]     │    │  │
│                           │  │     ↓                    │    │  │
│                           │  │  Structured Response     │    │  │
│                           │  └──────────────────────────┘    │  │
│                           │                                  │  │
│                           │  ┌──────────┐  ┌─────────────┐  │  │
│                           │  │ NumPy    │  │  SQLAlchemy │  │  │
│                           │  │Vector    │  │  + SQLite   │  │  │
│                           │  │Store     │  │  Persistence│  │  │
│                           │  │(Memory)  │  │  (Disk)     │  │  │
│                           │  └──────────┘  └─────────────┘  │  │
│                           └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Document Ingestion Flow

```
User submits text notes
         │
         ▼
┌─────────────────────┐
│   chunk_text()      │
│  chunk_size = 900   │
│  overlap   = 140    │
│  (char-based)       │
└────────┬────────────┘
         │  [list of chunks]
         ▼
┌─────────────────────┐
│   embed_texts()     │
│  text-emb-3-small   │
│  → 1536-dim vectors │
└────────┬────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│SQLite  │ │VectorStore│
│Chunks  │ │ .add()   │
│Table   │ │(memory)  │
│(disk)  │ └──────────┘
└────────┘
  Persists   Fast Search
  Forever    (in-memory)
```

---

## Query Flow (RAG)

```
User Question
      │
      ▼
embed_texts([question])
      │ 1536-dim vector
      ▼
normalize() → unit vector
      │
      ▼
VectorStore.search()
  sims = vectors @ query.T
  np.argsort(-sims)[:top_k]
      │ top-K chunks
      ▼
Filter by user_id
      │ user-specific chunks
      ▼
Build context prompt:
  system = teacher_prompt(level, style)
  user   = question + context_blocks
      │
      ▼
GPT-4o-mini (temperature=0.3)
      │
      ▼
Structured Response:
  1. Direct Answer
  2. 3 Key Points
  3. Code Example
  4. 2 Follow-up Questions
```

---

## Database Schema

```
users
  ├── id          (UUID string, PK)
  └── created_at  (timestamp)

documents
  ├── id          (int, PK)
  ├── user_id     (FK → users.id)
  ├── title       (string)
  ├── source      (manual/upload/url)
  └── created_at  (timestamp)

chunks
  ├── id          (int, PK)
  ├── doc_id      (FK → documents.id)
  ├── user_id     (string, indexed)
  ├── chunk_index (int)
  ├── content     (text)
  └── created_at  (timestamp)
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 + React + TypeScript | Web UI |
| **Backend** | FastAPI + Uvicorn | REST API server |
| **Validation** | Pydantic BaseModel | Request/response schema |
| **LLM** | OpenAI GPT-4o-mini | Answer generation |
| **Embeddings** | OpenAI text-embedding-3-small (1536-dim) | Semantic vectors |
| **Vector Search** | Custom NumPy VectorStore | Cosine similarity search |
| **Chunking** | Custom sliding window (900 chars, 140 overlap) | Document preprocessing |
| **Database** | SQLAlchemy + SQLite | Persistent storage |
| **Styling** | Tailwind CSS | UI design |
| **Deployment** | Render.com (backend) | Cloud hosting |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check + system info |
| `GET` | `/health` | Service health status |
| `POST` | `/auth/guest` | Create guest user → returns `user_id` |
| `POST` | `/ingest/text` | Ingest text notes → chunk + embed + store |
| `POST` | `/ask` | RAG question answering |
| `POST` | `/learn` | Structured lesson generation |

### Example: Ask a Question

```bash
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-uuid",
    "question": "How do Python decorators work?",
    "level": "beginner",
    "style": "simple",
    "top_k": 5
  }'
```

Response:
```json
{
  "subject": "Python",
  "question": "How do Python decorators work?",
  "answer": "...",
  "sources": [{"score": 0.91, "doc_id": 1}]
}
```

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- OpenAI API Key

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
echo "OPENAI_API_KEY=your_key_here" > .env

uvicorn main:app --reload
# → http://127.0.0.1:8000
# → Swagger docs: http://127.0.0.1:8000/docs
```

### Frontend

```bash
cd mobile_app
npm install
npm run dev
# → http://localhost:3000
```

---

## Project Structure

```
TeachAI/
├── backend/
│   ├── main.py              # FastAPI app, all endpoints
│   ├── requirements.txt
│   ├── .env                 # OPENAI_API_KEY (not committed)
│   ├── db/
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── models.py        # User, Document, Chunk ORM models
│   │   └── crud.py          # Database operations
│   ├── rag/
│   │   ├── chunking.py      # Text chunking (900 chars, 140 overlap)
│   │   └── vectorstore.py   # NumPy cosine similarity search
│   └── services/
│       └── llm.py           # OpenAI embeddings + completions
└── mobile_app/              # Next.js frontend
    ├── app/
    ├── components/
    └── package.json
```

---

## Key Design Decisions

**Why custom NumPy VectorStore instead of FAISS/ChromaDB?**
Built from scratch to demonstrate deep understanding of vector similarity search — cosine similarity via normalized dot product, L2 normalization, and efficient NumPy matrix multiplication. For production at millions of documents, FAISS or Pinecone would be used.

**Why SQLite + in-memory VectorStore?**
SQLite provides persistent chunk storage. VectorStore provides fast in-memory search. On startup, chunks are loaded from SQLite and the vector index is rebuilt — combining persistence with speed.

**Why temperature=0.3?**
Lower temperature → more deterministic outputs → fewer hallucinations. Critical for factual Python tutoring where incorrect answers mislead learners.

**Why character-based chunking?**
Python code and technical text have variable sentence lengths. Character-based chunking (900 chars) provides more predictable, consistent chunk sizes than sentence-based approaches.

---

## Author

**Yeshwanth Akula**
M.S. Computer Science — Saint Louis University (May 2026)
Focus: AI Engineering, LLM Systems, Production ML

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=flat&logo=linkedin)](https://linkedin.com/in/yeshwanth-akula-0339a925b)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-black?style=flat&logo=github)](https://github.com/Yesh-is-here2)

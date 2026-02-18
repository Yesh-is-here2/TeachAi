TeachAI — RAG-Powered Python Learning Assistant
TeachAI is a full-stack AI tutoring system that delivers structured Python explanations using Retrieval-Augmented Generation (RAG), semantic search, and a modern web interface. README (5)
This project demonstrates a production-style AI architecture combining:


FastAPI backend


OpenAI embeddings + LLM reasoning


Vector similarity retrieval


SQLite persistence


Next.js frontend UI



Live System Architecture
Flow
User → Next.js Frontend → FastAPI Backend →
Embeddings + Vector Search (RAG) → LLM → Structured Answer → UI README (5)

Core Features
AI Tutor


Explains Python topics clearly


Returns:


Direct answer


Key points


Code example


Follow-up questions




RAG Memory


Users can ingest notes


Notes are:


Chunked


Embedded


Stored in vector index




Answers are grounded in retrieved context. README (5)


Multi-User Support


Guest authentication


User-specific document retrieval. README (5)


Production-Ready Backend


FastAPI REST API


SQLite database


Vector similarity search


Environment-based configuration


CORS-enabled frontend communication. README (5)


Modern Frontend


Next.js + React


Clean minimal UI


Real-time AI responses


Health-check + error handling. README (5)



Tech Stack
Backend


FastAPI


SQLAlchemy + SQLite


NumPy vector operations


OpenAI API (LLM + embeddings)


Uvicorn server


Frontend


Next.js (App Router)


React + TypeScript


Tailwind CSS


Deployment


Backend: Render


Frontend: Local (optional Vercel deploy). README (5)



Project Structure
teachai/
│
├── backend/
│   ├── main.py
│   ├── db/
│   ├── rag/
│   ├── services/
│   └── requirements.txt
│
├── mobile_app/   # Next.js frontend
├── docs/
└── README.md
``` :contentReference[oaicite:7]{index=7}

---

# API Endpoints

| Feature | Endpoint |
|--------|----------|
| Health | `GET /health` |
| Guest Login | `POST /auth/guest` |
| Ingest Notes | `POST /ingest/text` |
| Ask Question (RAG) | `POST /ask` |
| Learn Structured Topic | `POST /learn` | :contentReference[oaicite:8]{index=8}

---

# Local Setup

## Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

Backend runs at:
http://127.0.0.1:8000
``` :contentReference[oaicite:9]{index=9}

---

## Frontend

```bash
cd mobile_app
npm install
npm run dev

Frontend runs at:
http://localhost:3000
``` :contentReference[oaicite:10]{index=10}

---

# Environment Variables

Create:


backend/.env

Add:


OPENAI_API_KEY=your_key_here

---

# Example Output

## Question
**Explain Python lists**

## TeachAI Response Includes
- Clear definition  
- Key properties  
- Python code example  
- Follow-up learning questions. :contentReference[oaicite:12]{index=12}

---

# Why This Project Matters

TeachAI is **not a simple chatbot**.

It demonstrates:

- Real RAG pipeline  
- Vector search reasoning  
- Multi-user AI memory  
- Full-stack AI deployment  
- Production-style architecture. :contentReference[oaicite:13]{index=13}

This aligns strongly with:

- AI Engineer roles  
- LLM Engineer roles  
- Applied ML Engineer positions. :contentReference[oaicite:14]{index=14}

---

# Future Improvements

- PDF ingestion  
- Persistent vector database (FAISS / pgvector)  
- Chat history memory  
- Voice interface  
- Public SaaS deployment. :contentReference[oaicite:15]{index=15}

---

# Author

**Yeshwanth Akula**  
Master’s in Computer Science — Saint Louis University  
Focus: AI Engineering, LLM Systems, Production ML. :contentReference[oaicite:16]{index=16}

---


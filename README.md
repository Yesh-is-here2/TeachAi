TeachAI — RAG-Powered Python Learning Assistant

TeachAI is a full-stack AI tutoring system that delivers structured Python explanations using Retrieval-Augmented Generation (RAG), semantic search, and a modern web interface.

This project demonstrates production-style AI architecture combining:

FastAPI backend

OpenAI embeddings + LLM reasoning

Vector similarity retrieval

SQLite persistence

Next.js frontend UI

Live System Architecture

Flow

User → Next.js Frontend → FastAPI Backend →
Embeddings + Vector Search (RAG) → LLM → Structured Answer → UI

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

chunked

embedded

stored in vector index

Answers are grounded in retrieved context.

Multi-User Support

Guest authentication

User-specific document retrieval.

Production-Ready Backend

FastAPI REST API

SQLite database

Vector similarity search

Environment-based configuration

CORS-enabled frontend communication

Modern Frontend

Next.js + React

Clean minimal UI

Real-time AI responses

Health-check + error handling

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

Frontend: Local (optional Vercel deploy)

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

API Endpoints
Health
GET /health

Guest Login
POST /auth/guest

Ingest Notes
POST /ingest/text

Ask Question (RAG)
POST /ask

Learn Structured Topic
POST /learn

Local Setup
Backend
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload


Backend runs at:

http://127.0.0.1:8000

Frontend
cd mobile_app
npm install
npm run dev


Frontend runs at:

http://localhost:3000

Environment Variables

Create:

backend/.env


Add:

OPENAI_API_KEY=your_key_here

Example Output

Question

Explain Python lists

TeachAI Response Includes

Clear definition

Key properties

Python code example

Follow-up learning questions

Why This Project Matters

TeachAI is not a simple chatbot.

It demonstrates:

Real RAG pipeline

Vector search reasoning

Multi-user AI memory

Full-stack AI deployment

Production-style architecture

This level of implementation aligns with:

AI Engineer roles

LLM Engineer roles

Applied ML Engineer positions

Future Improvements

PDF ingestion

Persistent vector database (FAISS / pgvector)

Chat history memory

Voice interface

Public SaaS deployment

Author

Yeshwanth Akula
Master’s in Computer Science — Saint Louis University
Focus: AI Engineering, LLM Systems, Production ML

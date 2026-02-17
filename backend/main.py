from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

from services.llm import generate_text

load_dotenv()  # loads backend/.env

app = FastAPI(title="TeachAI v1")

SUBJECT = "Python"


class AskRequest(BaseModel):
    question: str
    level: str = "beginner"
    style: str = "simple"
    context: str | None = None


class LearnRequest(BaseModel):
    topic: str
    level: str = "beginner"
    style: str = "simple"


@app.get("/health")
def health():
    return {"status": "ok", "subject": SUBJECT}


def teacher_system_prompt(level: str, style: str) -> str:
    return f"""
You are TeachAI, a patient expert tutor for ONE subject: {SUBJECT}.
Rules:
- Only answer within {SUBJECT}.
- If user asks outside {SUBJECT}, refuse briefly and ask them to rephrase in {SUBJECT}.
- Be accurate. If unsure, say so.
Teaching style: {style}
Student level: {level}
Use clear structure and short sections. Include examples when helpful.
""".strip()


@app.post("/ask")
def ask(req: AskRequest):
    try:
        sys = teacher_system_prompt(req.level, req.style)
        user = f"""
Question: {req.question}
Optional context: {req.context or "None"}

Return:
1) Direct answer
2) 3 key points
3) 1 short Python code example (if relevant)
4) 2 follow-up questions to check understanding
""".strip()

        text = generate_text(sys, user)
        return {"subject": SUBJECT, "question": req.question, "answer": text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/learn")
def learn(req: LearnRequest):
    try:
        sys = teacher_system_prompt(req.level, req.style)
        user = f"""
Teach this topic in {SUBJECT}: {req.topic}

Return a structured lesson with:
- Title
- Step-by-step explanation (5-8 steps)
- 2 examples (Python code)
- Common mistakes
- Mini quiz (5 questions: mix of MCQ + short)
""".strip()

        text = generate_text(sys, user)
        return {"subject": SUBJECT, "topic": req.topic, "lesson": text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

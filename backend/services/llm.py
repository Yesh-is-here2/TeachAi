import os
from dotenv import load_dotenv
from openai import OpenAI

# 🔹 load .env automatically
load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

DEFAULT_MODEL = os.getenv("TEACHAI_MODEL", "gpt-4o-mini")
EMBED_MODEL = os.getenv("TEACHAI_EMBED_MODEL", "text-embedding-3-small")


def generate_text(system_prompt: str, user_prompt: str, model: str | None = None) -> str:
    resp = client.chat.completions.create(
        model=model or DEFAULT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
    )
    return resp.choices[0].message.content.strip()


def embed_texts(texts: list[str]) -> list[list[float]]:
    resp = client.embeddings.create(
        model=EMBED_MODEL,
        input=texts,
    )
    return [item.embedding for item in resp.data]

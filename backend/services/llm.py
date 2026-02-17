import os
from dotenv import load_dotenv
from openai import OpenAI

# Load .env FIRST
load_dotenv()

def generate_text(system_prompt: str, user_prompt: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not found in environment")

    client = OpenAI(api_key=api_key)

    model = os.getenv("TEACHAI_MODEL", "gpt-4o-mini")

    resp = client.responses.create(
        model=model,
        input=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    return resp.output_text

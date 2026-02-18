from __future__ import annotations

def chunk_text(text: str, chunk_size: int = 900, overlap: int = 140) -> list[str]:
    """
    Split text into overlapping chunks.
    chunk_size: max chars per chunk
    overlap: chars repeated between consecutive chunks
    """
    text = (text or "").strip()
    if not text:
        return []

    if overlap < 0:
        overlap = 0
    if overlap >= chunk_size:
        overlap = max(0, chunk_size // 3)

    chunks: list[str] = []
    start = 0
    n = len(text)

    while start < n:
        end = min(start + chunk_size, n)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= n:
            break

        start = max(0, end - overlap)

    return chunks

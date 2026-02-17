import numpy as np


def normalize(v: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(v, axis=1, keepdims=True) + 1e-12
    return (v / norm).astype("float32")


class VectorStore:
    def __init__(self, dim: int = 1536):
        self.dim = dim
        self.vectors = np.zeros((0, dim), dtype="float32")
        self.meta: list[dict] = []

    def reset(self):
        self.vectors = np.zeros((0, self.dim), dtype="float32")
        self.meta = []

    def add(self, vectors: np.ndarray, meta: list[dict]):
        if vectors.size == 0:
            return
        if vectors.dtype != np.float32:
            vectors = vectors.astype("float32")
        self.vectors = np.vstack([self.vectors, vectors])
        self.meta.extend(meta)

    def search(self, query_vec: np.ndarray, top_k: int = 5):
        if self.vectors.shape[0] == 0:
            return []

        # cosine similarity assuming normalized vectors
        sims = (self.vectors @ query_vec.T).reshape(-1)
        idxs = np.argsort(-sims)[:top_k]

        results = []
        for i in idxs:
            results.append({"score": float(sims[i]), **self.meta[int(i)]})
        return results

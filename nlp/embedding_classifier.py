from __future__ import annotations

from typing import Any

import numpy as np
from sentence_transformers import SentenceTransformer

from evaluate import normalize_text

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
LOW_SIMILARITY = 0.35


class EmbeddingIntentClassifier:
    """Centroid classifier for offline semantic intent experiments."""

    def __init__(self, model_name: str = MODEL_NAME, local_files_only: bool = True) -> None:
        self.model = SentenceTransformer(model_name, local_files_only=local_files_only)
        self.centroids: dict[str, np.ndarray] = {}

    def encode(self, texts: list[str]) -> np.ndarray:
        if not texts:
            return np.empty((0, self.dimension), dtype=np.float32)
        return np.asarray(self.model.encode(texts, normalize_embeddings=True, show_progress_bar=False))

    @property
    def dimension(self) -> int:
        return int(self.model.get_embedding_dimension())

    def fit(self, texts: list[str], labels: list[str]) -> "EmbeddingIntentClassifier":
        if len(texts) != len(labels) or not texts:
            raise ValueError("texts dan labels harus sama panjang dan tidak kosong.")
        vectors = self.encode([normalize_text(text) for text in texts])
        for intent in sorted(set(labels)):
            centroid = vectors[np.array(labels) == intent].mean(axis=0)
            self.centroids[intent] = centroid / np.linalg.norm(centroid)
        return self

    def predict_one(self, text: str) -> dict[str, Any]:
        if not text.strip() or not self.centroids:
            return {"intent": "UNKNOWN", "similarity": 0.0, "confidence": "LOW"}
        vector = self.encode([normalize_text(text)])[0]
        scores = {intent: float(vector @ centroid) for intent, centroid in self.centroids.items()}
        intent, similarity = max(scores.items(), key=lambda item: item[1])
        if similarity < LOW_SIMILARITY and "UNKNOWN" in self.centroids:
            intent = "UNKNOWN"
        return {"intent": intent, "similarity": round(similarity, 4), "confidence": confidence_level(similarity)}

    def predict(self, texts: list[str]) -> list[str]:
        return [result["intent"] for result in (self.predict_one(text) for text in texts)]


def confidence_level(similarity: float) -> str:
    if similarity >= 0.75:
        return "HIGH"
    if similarity >= 0.55:
        return "MEDIUM"
    return "LOW"

from __future__ import annotations

import argparse
from pathlib import Path

from evaluate import evaluate as evaluate_tfidf
from evaluate_embedding import evaluate as evaluate_embedding


def main(path: Path) -> None:
    baseline = evaluate_tfidf(path)["models"]["tfidf_linear_svm"]
    embedding = evaluate_embedding(path)["metrics"]
    print("Model                         Accuracy  Macro F1  Weighted F1")
    print(f"TF-IDF + Linear SVM          {baseline['accuracy']:.4f}    {baseline['macroF1']:.4f}     {baseline['weightedF1']:.4f}")
    print(f"Embedding centroid           {embedding['accuracy']:.4f}    {embedding['macroF1']:.4f}     {embedding['weightedF1']:.4f}")
    print(f"Macro F1 delta (embedding-SVM): {embedding['macroF1'] - baseline['macroF1']:+.4f}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Compare the Phase 10 SVM with the Phase 11 embedding classifier.")
    parser.add_argument("--corpus", type=Path, default=Path(__file__).resolve().parent / "data" / "corpus_v2.json")
    args = parser.parse_args()
    main(args.corpus)

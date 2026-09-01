from __future__ import annotations

from pathlib import Path

from evaluate import evaluate as evaluate_svm
from evaluate_transformer import evaluate as evaluate_transformer


ROOT = Path(__file__).resolve().parent.parent
CORPUS = ROOT / "nlp" / "data" / "corpus_v3.json"
MODEL = ROOT / "nlp" / "models" / "transformer_v3"


def main() -> None:
    svm = evaluate_svm(CORPUS)["models"]["tfidf_linear_svm"]
    transformer = evaluate_transformer(CORPUS, MODEL)["metrics"]
    print("Model                         Accuracy  Macro F1  Weighted F1")
    print(f"TF-IDF + Linear SVM          {svm['accuracy']:.4f}    {svm['macroF1']:.4f}     {svm['weightedF1']:.4f}")
    print(f"Transformer classifier       {transformer['accuracy']:.4f}    {transformer['macroF1']:.4f}     {transformer['weightedF1']:.4f}")
    print(f"Macro F1 delta (transformer-SVM): {transformer['macroF1'] - svm['macroF1']:+.4f}")


if __name__ == "__main__":
    main()

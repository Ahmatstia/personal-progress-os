from __future__ import annotations

from pathlib import Path

from evaluate import evaluate


ROOT = Path(__file__).resolve().parent.parent


def main() -> None:
    v2 = evaluate(ROOT / "nlp" / "data" / "corpus_v2.json")
    v3 = evaluate(ROOT / "nlp" / "data" / "corpus_v3.json")
    print("Model                         V2 Accuracy  V3 Accuracy  V2 Macro F1  V3 Macro F1  Delta")
    for name in ("tfidf_logistic_regression", "tfidf_linear_svm"):
        old = v2["models"][name]
        new = v3["models"][name]
        print(f"{name:29} {old['accuracy']:.4f}       {new['accuracy']:.4f}       {old['macroF1']:.4f}       {new['macroF1']:.4f}      {new['macroF1'] - old['macroF1']:+.4f}")


if __name__ == "__main__":
    main()

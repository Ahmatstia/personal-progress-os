from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

ROOT = Path(__file__).resolve().parent.parent
CORPUS_PATH = ROOT / "nlp" / "data" / "corpus_v1.json"
RANDOM_STATE = 42
TEST_SIZE = 0.2
INFORMAL_WORDS = {"yg": "yang", "dgn": "dengan", "dg": "dengan", "gak": "tidak", "ga": "tidak", "nggak": "tidak", "ngerjain": "mengerjakan", "kerjain": "mengerjakan", "hrs": "harus", "sy": "saya", "skrg": "sekarang", "blm": "belum"}


def normalize_text(text: str) -> str:
    """Keep evaluation preprocessing aligned with the TS baseline's intent."""
    words = re.sub(r"\s+", " ", re.sub(r"[!?.,;:()[\]{}\"']", " ", text.lower())).strip().split()
    return " ".join(INFORMAL_WORDS.get(word, word) for word in words)


def load_corpus(path: Path = CORPUS_PATH) -> dict[str, Any]:
    with path.open(encoding="utf-8") as source:
        corpus = json.load(source)
    if not corpus.get("examples"):
        raise ValueError("Corpus tidak memiliki examples.")
    return corpus


def audit_corpus(corpus: dict[str, Any]) -> dict[str, Any]:
    examples = corpus["examples"]
    texts = [example["text"].strip() for example in examples]
    normalized = [normalize_text(text) for text in texts]
    counts = {intent: sum(example["intent"] == intent for example in examples) for intent in corpus["intents"]}
    return {
        "examples": len(examples),
        "intents": len(corpus["intents"]),
        "classDistribution": counts,
        "duplicateExact": len(texts) - len(set(texts)),
        "duplicateNormalized": len(normalized) - len(set(normalized)),
        "tooShort": sum(len(text.split()) < 3 for text in texts),
        "emptyText": sum(not text for text in texts),
        "invalidIntent": sorted({example["intent"] for example in examples} - set(corpus["intents"])),
    }


def build_models() -> dict[str, Pipeline]:
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)
    return {
        "tfidf_logistic_regression": Pipeline([
            ("tfidf", vectorizer),
            ("classifier", LogisticRegression(max_iter=2000, random_state=RANDOM_STATE)),
        ]),
        "tfidf_linear_svm": Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)),
            ("classifier", LinearSVC(random_state=RANDOM_STATE)),
        ]),
    }


def evaluate(path: Path = CORPUS_PATH) -> dict[str, Any]:
    corpus = load_corpus(path)
    examples = corpus["examples"]
    texts = [normalize_text(example["text"]) for example in examples]
    labels = [example["intent"] for example in examples]
    train_texts, test_texts, train_labels, test_labels = train_test_split(
        texts, labels, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=labels
    )
    intents = sorted(set(labels))
    results: dict[str, Any] = {
        "corpus": {"version": corpus["version"], "language": corpus["language"], "examples": len(examples)},
        "quality": audit_corpus(corpus),
        "split": {"train": len(train_texts), "test": len(test_texts), "testSize": TEST_SIZE, "randomState": RANDOM_STATE},
        "models": {},
    }
    for name, model in build_models().items():
        model.fit(train_texts, train_labels)
        predictions = model.predict(test_texts)
        report = classification_report(test_labels, predictions, labels=intents, output_dict=True, zero_division=0)
        matrix = confusion_matrix(test_labels, predictions, labels=intents)
        pairs = sorted(
            ((int(matrix[row][column]), intents[row], intents[column]) for row in range(len(intents)) for column in range(len(intents)) if row != column and matrix[row][column]),
            reverse=True,
        )
        results["models"][name] = {
            "accuracy": round(float(accuracy_score(test_labels, predictions)), 4),
            "macroPrecision": round(float(precision_score(test_labels, predictions, labels=intents, average="macro", zero_division=0)), 4),
            "macroRecall": round(float(recall_score(test_labels, predictions, labels=intents, average="macro", zero_division=0)), 4),
            "macroF1": round(float(f1_score(test_labels, predictions, labels=intents, average="macro", zero_division=0)), 4),
            "weightedF1": round(float(f1_score(test_labels, predictions, labels=intents, average="weighted", zero_division=0)), 4),
            "perIntent": {intent: {metric: round(float(report[intent][metric]), 4) for metric in ("precision", "recall", "f1-score", "support")} for intent in intents},
            "confusionMatrix": matrix.tolist(),
            "topConfusionPairs": [{"actual": actual, "predicted": predicted, "count": count} for count, actual, predicted in pairs[:10]],
            "misclassifiedExamples": [{"actual": actual, "predicted": predicted, "text": text} for text, actual, predicted in zip(test_texts, test_labels, predictions) if actual != predicted],
            "intents": intents,
        }
    return results


def print_report(results: dict[str, Any]) -> None:
    print(f"Corpus {results['corpus']['version']}: {results['corpus']['examples']} examples")
    print(f"Split: {results['split']['train']} train / {results['split']['test']} test, random_state={results['split']['randomState']}")
    for name, metrics in results["models"].items():
        print(f"\n{name}")
        print(f"  accuracy:        {metrics['accuracy']:.4f}")
        print(f"  macro precision: {metrics['macroPrecision']:.4f}")
        print(f"  macro recall:    {metrics['macroRecall']:.4f}")
        print(f"  macro F1:        {metrics['macroF1']:.4f}")
        print(f"  weighted F1:     {metrics['weightedF1']:.4f}")
        if metrics["topConfusionPairs"]:
            pair = metrics["topConfusionPairs"][0]
            print(f"  top confusion:   {pair['actual']} -> {pair['predicted']} ({pair['count']})")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate TF-IDF baseline classifiers.")
    parser.add_argument("--json", action="store_true", help="Print the full machine-readable report.")
    parser.add_argument("--corpus", type=Path, default=CORPUS_PATH, help="Corpus JSON path.")
    args = parser.parse_args()
    report = evaluate(args.corpus)
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print_report(report)

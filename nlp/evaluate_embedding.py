from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any

from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

from embedding_classifier import EmbeddingIntentClassifier, MODEL_NAME
from evaluate import RANDOM_STATE, ROOT, TEST_SIZE, audit_corpus, load_corpus, normalize_text


def evaluate(path: Path = ROOT / "nlp" / "data" / "corpus_v2.json") -> dict[str, Any]:
    corpus = load_corpus(path)
    examples = corpus["examples"]
    texts = [normalize_text(example["text"]) for example in examples]
    labels = [example["intent"] for example in examples]
    train_texts, test_texts, train_labels, test_labels = train_test_split(
        texts, labels, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=labels
    )
    intents = sorted(set(labels))
    started = time.perf_counter()
    classifier = EmbeddingIntentClassifier()
    classifier.fit(train_texts, train_labels)
    predictions = classifier.predict(test_texts)
    elapsed_ms = (time.perf_counter() - started) * 1000
    report = classification_report(test_labels, predictions, labels=intents, output_dict=True, zero_division=0)
    matrix = confusion_matrix(test_labels, predictions, labels=intents)
    pairs = sorted(
        ((int(matrix[row][column]), intents[row], intents[column]) for row in range(len(intents)) for column in range(len(intents)) if row != column and matrix[row][column]),
        reverse=True,
    )
    return {
        "corpus": {"version": corpus["version"], "language": corpus["language"], "examples": len(examples)},
        "quality": audit_corpus(corpus),
        "split": {"train": len(train_texts), "test": len(test_texts), "testSize": TEST_SIZE, "randomState": RANDOM_STATE},
        "embedding": {"model": MODEL_NAME, "dimension": classifier.dimension, "localFilesOnly": True, "fitAndTestLatencyMs": round(elapsed_ms, 2)},
        "metrics": {
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
        },
    }


def print_report(result: dict[str, Any]) -> None:
    metrics = result["metrics"]
    print(f"Corpus {result['corpus']['version']}: {result['corpus']['examples']} examples")
    print(f"Embedding: {result['embedding']['model']} ({result['embedding']['dimension']} dimensions)")
    print(f"Split: {result['split']['train']} train / {result['split']['test']} test, random_state={result['split']['randomState']}")
    for key in ("accuracy", "macroPrecision", "macroRecall", "macroF1", "weightedF1"):
        print(f"  {key}: {metrics[key]:.4f}")
    print(f"  fit/test latency: {result['embedding']['fitAndTestLatencyMs']:.2f} ms")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate the offline embedding centroid classifier.")
    parser.add_argument("--json", action="store_true", help="Print the full machine-readable report.")
    parser.add_argument("--corpus", type=Path, default=ROOT / "nlp" / "data" / "corpus_v2.json", help="Corpus JSON path.")
    args = parser.parse_args()
    report = evaluate(args.corpus)
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print_report(report)

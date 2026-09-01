from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any

import numpy as np
import torch
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, precision_score, recall_score
from transformers import AutoTokenizer

from evaluate import audit_corpus
from transformer_common import MODEL_DIR, MODEL_NAME, TransformerIntentModel, encode, load_corpus, normalize_text, split_corpus


def evaluate(corpus_path: Path, model_dir: Path = MODEL_DIR) -> dict[str, Any]:
    corpus = load_corpus(corpus_path)
    _, test_texts, _, test_labels, intents = split_corpus(corpus_path)
    tokenizer = AutoTokenizer.from_pretrained(model_dir, local_files_only=True)
    model = TransformerIntentModel(model_name=model_dir.as_posix(), num_labels=len(intents))
    model.classifier.load_state_dict(torch.load(model_dir / "classifier.pt", map_location="cpu", weights_only=True))
    model.eval()
    tokens = encode(tokenizer, test_texts)
    with torch.inference_mode():
        batch_started = time.perf_counter()
        predictions = model(tokens["input_ids"], tokens["attention_mask"]).argmax(dim=1).tolist()
        batch_ms = (time.perf_counter() - batch_started) * 1000
    predicted_labels = [intents[index] for index in predictions]
    single_latencies = []
    for text in test_texts[:10]:
        single_tokens = encode(tokenizer, [normalize_text(text)])
        started = time.perf_counter()
        with torch.inference_mode():
            model(single_tokens["input_ids"], single_tokens["attention_mask"])
        single_latencies.append((time.perf_counter() - started) * 1000)
    report = classification_report(test_labels, predicted_labels, labels=intents, output_dict=True, zero_division=0)
    matrix = confusion_matrix(test_labels, predicted_labels, labels=intents)
    pairs = sorted(((int(matrix[row][column]), intents[row], intents[column]) for row in range(len(intents)) for column in range(len(intents)) if row != column and matrix[row][column]), reverse=True)
    return {
        "corpus": {"version": corpus["version"], "language": corpus["language"], "examples": len(corpus["examples"])},
        "quality": audit_corpus(corpus),
        "split": {"train": len(corpus["examples"]) - len(test_texts), "test": len(test_texts), "testSize": 0.2, "randomState": 42},
        "transformer": {"model": MODEL_NAME, "artifact": str(model_dir), "dimension": model.encoder.config.hidden_size, "maxLength": 48, "singleTextLatencyMs": {"mean": round(float(np.mean(single_latencies)), 2), "median": round(float(np.median(single_latencies)), 2), "min": round(float(np.min(single_latencies)), 2), "max": round(float(np.max(single_latencies)), 2)}, "batchLatencyMs": round(batch_ms, 2)},
        "metrics": {
            "accuracy": round(float(accuracy_score(test_labels, predicted_labels)), 4),
            "macroPrecision": round(float(precision_score(test_labels, predicted_labels, labels=intents, average="macro", zero_division=0)), 4),
            "macroRecall": round(float(recall_score(test_labels, predicted_labels, labels=intents, average="macro", zero_division=0)), 4),
            "macroF1": round(float(f1_score(test_labels, predicted_labels, labels=intents, average="macro", zero_division=0)), 4),
            "weightedF1": round(float(f1_score(test_labels, predicted_labels, labels=intents, average="weighted", zero_division=0)), 4),
            "perIntent": {intent: {metric: round(float(report[intent][metric]), 4) for metric in ("precision", "recall", "f1-score", "support")} for intent in intents},
            "confusionMatrix": matrix.tolist(),
            "topConfusionPairs": [{"actual": actual, "predicted": predicted, "count": count} for count, actual, predicted in pairs[:10]],
            "misclassifiedExamples": [{"actual": actual, "predicted": predicted, "text": text} for text, actual, predicted in zip(test_texts, test_labels, predicted_labels) if actual != predicted],
            "intents": intents,
        },
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate the fine-tuned transformer on corpus v3.")
    parser.add_argument("--corpus", type=Path, default=Path(__file__).resolve().parent / "data" / "corpus_v3.json")
    parser.add_argument("--model", type=Path, default=MODEL_DIR)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    result = evaluate(args.corpus, args.model)
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        metrics = result["metrics"]
        print(f"Corpus {result['corpus']['version']}: {result['corpus']['examples']} examples")
        print(f"Transformer: {result['transformer']['model']}")
        print(f"Accuracy: {metrics['accuracy']:.4f} | Macro F1: {metrics['macroF1']:.4f} | Weighted F1: {metrics['weightedF1']:.4f}")
        print(f"Single latency ms: {result['transformer']['singleTextLatencyMs']}")
